import type { MxRecord } from 'node:dns';
import { createConnection, type Socket } from 'node:net';
import tldts from 'tldts';
import { Address, IPKind, type Target } from './address.js';
import { getMtaStsPolicy, isMxAllowed } from './mta-sts.js';
import { DNSResolver, ResolverKind } from './resolver.js';
import { TXTRecord, TXTResult } from './txt-record.js';
import { DNS_ERRORS } from './types/error.js';
import type { DomainCheckerOptions, ResolveOptions, SafeDCOptions } from './types/options.js';
import { setSafeDCOptions } from './types/options.js';

export type { MxRecord, Socket, DomainCheckerOptions, ResolveOptions };

export class DomainChecker {
	private options: SafeDCOptions;
	private resolver: DNSResolver;
	private failoverResolvers: DNSResolver[] = [];

	constructor(options?: DomainCheckerOptions) {
		this.options = setSafeDCOptions(options);

		this.resolver = new DNSResolver({
			timeout: this.options.dnsTimeout,
			tries: this.options.tries,
		});

		if (this.options.server) {
			this.resolver.kind = ResolverKind.Custom;
			this.resolver.setServers(this.options.server);
		} else {
			this.resolver.kind = ResolverKind.System;
		}

		if (this.options.failoverServers) {
			for (const failoverServer of this.options.failoverServers) {
				const resolver = new DNSResolver({
					timeout: this.options.dnsTimeout,
					tries: this.options.tries,
					kind: ResolverKind.Failover,
				});

				if (this.options.server) {
					if (failoverServer.includes(this.options.server[0])) {
						continue;
					}
				}

				resolver.setServers(failoverServer);
				this.failoverResolvers.push(resolver);
			}

			if (this.options.server) {
				const defaultResolver = new DNSResolver({
					timeout: this.options.dnsTimeout,
					tries: this.options.tries,
					kind: ResolverKind.FailoverSystem,
				});
				this.failoverResolvers.push(defaultResolver);
			}
		}
	}

	public async getNsResolver(target: Target): Promise<DNSResolver> {
		const addr = Address.loadFromTarget(target);
		try {
			// ["ns1.example.net", ...]
			const nsHosts = await this.resolver.resolveNs(addr.hostname).catch(() => []);
			const ips: string[] = [];

			for (const ns of nsHosts) {
				try {
					const v4 = await this.resolver.resolve4(ns);
					ips.push(...v4);
				} catch {
					/* ignore */
				}
				try {
					const v6 = await this.resolver.resolve6(ns);
					ips.push(...v6);
				} catch {
					/* ignore */
				}
			}

			const resolver = new DNSResolver({
				timeout: this.options.dnsTimeout,
				tries: this.options.tries,
				kind: ResolverKind.HostNameServer,
				nsHosts,
			});
			if (ips.length > 0) {
				resolver.setServers(ips);
				return resolver;
			} else {
				// mail.example.net -> example.net
				const nsDomain = tldts.getDomain(addr.hostname);
				if (nsDomain !== null && nsDomain !== addr.hostname) {
					return await this.getNsResolver(nsDomain);
				} else {
					return this.resolver;
				}
			}
		} catch {
			// fallback: system resolver
			return this.resolver;
		}
	}

	public async hasMxRecord(target: Target): Promise<boolean> {
		const addr = Address.loadFromTarget(target);

		try {
			const addresses = await this.getMxRecord({
				target: addr,
				useCache: false,
				preferDomainNS: false,
			});
			return Array.isArray(addresses) && addresses.length > 0;
		} catch {
			return false;
		}
	}

	private async cleanMxRecord(records: MxRecord[], resolveOptions: ResolveOptions): Promise<MxRecord[]> {
		if (!this.options.useMtaSts || records.length === 0) {
			return records;
		}

		try {
			// Get MTA-STS DNS record
			const stsRecord = await this.getMtaStsRecord(resolveOptions);
			const policyId = stsRecord?.getSTSPolicyId();

			if (!policyId) {
				// No MTA-STS configured
				return records;
			}

			// Fetch policy file
			const policy = await getMtaStsPolicy(resolveOptions.target);

			if (!policy) {
				// Policy file not found or invalid
				return records;
			}

			// Filter MX records based on policy
			const allowedRecords = records.filter((record) => isMxAllowed(record.exchange, policy));

			// If policy mode is 'enforce' and no MX matches, return empty (fail delivery)
			if (policy.mode === 'enforce' && allowedRecords.length === 0) {
				return [];
			}

			// If policy mode is 'testing', log but don't filter
			if (policy.mode === 'testing') {
				const blockedRecords = records.filter((record) => !isMxAllowed(record.exchange, policy));
				if (blockedRecords.length > 0) {
					// In testing mode, just log violations but return all records
					console.warn(
						`MTA-STS testing mode: ${blockedRecords.length} MX records would be blocked:`,
						blockedRecords.map((r) => r.exchange),
					);
				}
				return records;
			}

			// For 'enforce' mode, return only allowed records
			return allowedRecords.length > 0 ? allowedRecords : records;
		} catch (error) {
			// On error, return original records (fail open)
			console.error('MTA-STS check failed:', error);
			return records;
		}
	}

	public async getMxRecord(resolveOptions: ResolveOptions): Promise<MxRecord[]> {
		let result: MxRecord[] = [];
		resolveOptions.target = Address.loadFromTarget(resolveOptions.target);

		let lastError: Error;
		try {
			result = await this.resolveMxWithFailover(resolveOptions);
			// Apply MTA-STS filtering
			result = await this.cleanMxRecord(result, resolveOptions);
			return result;
		} catch (error) {
			lastError = error as Error;
		}

		if (resolveOptions.preferDomainNS !== true) {
			for (const resolver of this.failoverResolvers) {
				try {
					result = await this.resolveMxWithFailover(resolveOptions, resolver);
					// Apply MTA-STS filtering
					result = await this.cleanMxRecord(result, resolveOptions);
					return result;
				} catch (error) {
					lastError = error as Error;
				}
			}
		}

		const err = lastError as NodeJS.ErrnoException | undefined;
		const code = err?.code;

		if (code === DNS_ERRORS.NODATA || code === DNS_ERRORS.NOTFOUND) {
			return [];
		}

		throw lastError;
	}

	private async resolveMxWithFailover(resolveOptions: ResolveOptions, fallback?: DNSResolver): Promise<MxRecord[]> {
		resolveOptions.target = Address.loadFromTarget(resolveOptions.target);
		let resolver = fallback ? fallback : this.resolver;
		if ((this.options.useDomainNS || resolveOptions.preferDomainNS) && !fallback) {
			resolver = await this.getNsResolver(resolveOptions.target);
		}
		const result = await resolver.resolveMx(resolveOptions.target.hostname);
		const sorted = [...result].sort((a, b) => a.priority - b.priority);
		return sorted;
	}

	public async getNameServers(target: Target): Promise<string[]> {
		const addr = Address.loadFromTarget(target);

		const nsHosts = await this.resolver.resolveNs(addr.hostname);

		return nsHosts;
	}

	public async getSmtpConnection(target: Target): Promise<Socket | null> {
		const addr = Address.loadFromTarget(target);

		// Get MX records
		const mxRecords = await this.getMxRecord({
			target: addr,
			useCache: false,
			preferDomainNS: false,
		});

		if (mxRecords.length === 0) {
			throw new Error('No MX records found');
		}

		// Check for local IPs if blocking is enabled
		if (this.options.blockLocalIPs) {
			const mxAddr = new Address(mxRecords[0].exchange);
			if (mxAddr.isLocal) {
				throw new Error('Local IP addresses are blocked');
			}
		}

		const port = this.options.deliveryPort;
		let lastError: Error | null = null;

		// Try each MX record in priority order
		for (const mx of mxRecords) {
			try {
				const socket = await this.connectToSmtp(mx.exchange, port);
				return socket;
			} catch (error) {
				lastError = error as Error;
			}
		}

		throw lastError || new Error('Failed to connect to any MX server');
	}

	private connectToSmtp(host: string, port: number): Promise<ReturnType<typeof createConnection>> {
		return new Promise((resolve, reject) => {
			const signal = AbortSignal.timeout(this.options.smtpTimeout);

			const socket = createConnection({ host, port, keepAlive: true, signal });

			if (this.options.socketIdleTimeout) {
				socket.setTimeout(this.options.socketIdleTimeout);
			}

			// If timeout is 0, then the existing idle timeout is disabled.
			socket.on('timeout', () => {
				socket.end();
			});

			socket.once('connect', () => {
				resolve(socket);
			});

			socket.once('error', (error) => {
				socket.destroy();
				reject(error);
			});
		});
	}

	private get_dkim_addr(addr: Address, selector?: string): Address | null {
		if (addr.ipKind === IPKind.None && addr.hostname) {
			selector = selector ? selector : this.options.dkimSelector;
			return new Address(`${selector}._domainkey.${addr.hostname}`);
		}
		return null;
	}

	public async getDkimRecord(resolveOptions: ResolveOptions): Promise<TXTResult | null> {
		const addr = Address.loadFromTarget(resolveOptions.target);

		const dkimAddr = this.get_dkim_addr(addr, resolveOptions.dkimSelector);

		if (dkimAddr) {
			resolveOptions.target = dkimAddr;
			return await this.getTxtRecord(resolveOptions);
		}

		return null;
	}

	private get_dmarc_addr(addr: Address): Address | null {
		//  RFC 7489
		if (addr.ipKind === IPKind.None && addr.hostname) {
			return new Address(`_dmarc.${addr.hostname}`);
		}
		return null;
	}

	public async getDmarcRecord(resolveOptions: ResolveOptions): Promise<TXTResult | null> {
		const addr = Address.loadFromTarget(resolveOptions.target);

		const dmarcAddr = this.get_dmarc_addr(addr);

		if (dmarcAddr) {
			resolveOptions.target = dmarcAddr;
			return await this.getTxtRecord(resolveOptions);
		}

		return null;
	}

	private get_mta_sts_addr(addr: Address): Address | null {
		if (addr.ipKind === IPKind.None && addr.hostname) {
			return new Address(`_mta-sts.${addr.hostname}`);
		}
		return null;
	}

	public async getMtaStsRecord(resolveOptions: ResolveOptions): Promise<TXTResult | null> {
		const addr = Address.loadFromTarget(resolveOptions.target);
		const mtaStsAddr = this.get_mta_sts_addr(addr);

		if (mtaStsAddr) {
			const opts = { ...resolveOptions };
			opts.target = mtaStsAddr;
			return await this.getTxtRecord(opts);
		}

		return null;
	}

	public async getTxtRecord(resolveOptions: ResolveOptions): Promise<TXTResult | null> {
		let lastError: Error;
		try {
			return await this.getTxtRecordWithFailover(resolveOptions);
		} catch (error) {
			lastError = error as Error;
		}

		if (resolveOptions.preferDomainNS !== true) {
			for (const resolver of this.failoverResolvers) {
				try {
					return await this.getTxtRecordWithFailover(resolveOptions, resolver);
				} catch (error) {
					lastError = error as Error;
				}
			}
		}

		const err = lastError as NodeJS.ErrnoException | undefined;
		const code = err?.code;

		if (code === DNS_ERRORS.NODATA || code === DNS_ERRORS.NOTFOUND) {
			return null;
		}

		throw lastError;
	}

	private async getTxtRecordWithFailover(resolveOptions: ResolveOptions, fallback?: DNSResolver): Promise<TXTResult> {
		resolveOptions.target = Address.loadFromTarget(resolveOptions.target);
		let resolver = fallback ? fallback : this.resolver;
		if ((this.options.useDomainNS || resolveOptions.preferDomainNS) && !fallback) {
			resolver = await this.getNsResolver(resolveOptions.target);
		}
		const txtRecords = await resolver.resolveTxt(resolveOptions.target.hostname);
		const flatRecords = txtRecords.flat();

		const result = new TXTResult();
		for (let flatRecord of flatRecords) {
			flatRecord = flatRecord?.trim();
			if (!flatRecord) continue;
			const record = new TXTRecord(flatRecord);
			result.records.push(record);
		}

		return result;
	}
}
