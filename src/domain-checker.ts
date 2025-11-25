import { Resolver } from "node:dns/promises";
import { Address, type Target } from "./address.js";
import { DNS_ERRORS, type DomainCheckerOptions, type MxRecord } from "./types.js";

export class DomainChecker {
	private options: DomainCheckerOptions;
	private resolver: Resolver;
	private failoverResolvers: Resolver[] = [];

	constructor(options?: DomainCheckerOptions) {
		const defaultOptions: DomainCheckerOptions = {
			dkimSelector: "mx",
			smtpTimeout: 5000,
			dnsTimeout: -1,
			useTargetNameServer: false,
			tries: 4,
			failoverServers: [
				["1.1.1.1", "1.0.0.1"],
				["8.8.8.8", "8.8.4.4"],
			],
		};

		this.options = { ...defaultOptions, ...(options ?? {}) };

		this.resolver = new Resolver({
			timeout: this.options.dnsTimeout,
			tries: this.options.tries,
		});
		if (this.options.server) {
			this.resolver.setServers(this.options.server);
		}

		for (const server of this.options.failoverServers) {
			const resolver = new Resolver({
				timeout: this.options.dnsTimeout,
				tries: this.options.tries,
			});

			if (this.options.server) {
				if (server.includes(this.options.server[0])) {
					continue;
				}
			}

			resolver.setServers(server);
			this.failoverResolvers.push(resolver);
		}

		if (this.options.server) {
			const defaultResolver = new Resolver({
				timeout: this.options.dnsTimeout,
				tries: this.options.tries,
			});
			this.failoverResolvers.push(defaultResolver);
		}
	}

	private async getNsResolver(hostname: string): Promise<Resolver> {
		try {
			const nsHosts = await this.resolver.resolveNs(hostname); // ["ns1.example.net", ...]
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

			const resolver = new Resolver({
				timeout: this.options.dnsTimeout,
				tries: this.options.tries,
			});
			if (ips.length > 0) {
				resolver.setServers(ips);
			} // else leave resolver with system servers as fallback
			return resolver;
		} catch {
			// fallback: sistem resolver
			return this.resolver;
		}
	}

	public async hasMxRecord(target: Target): Promise<boolean> {
		const addr = Address.loadFromTarget(target);

		try {
			const addresses = await this.getMxRecord(addr.hostname);
			return Array.isArray(addresses) && addresses.length > 0;
		} catch {
			return false;
		}
	}

	public async getMxRecord(target: Target): Promise<MxRecord[]> {
		const addr = Address.loadFromTarget(target);

		let lastError: Error;
		try {
			return await this.getMxRecordWithFallback(addr);
		} catch (error) {
			lastError = error as Error;
		}

		for (const resolver of this.failoverResolvers) {
			try {
				return await this.getMxRecordWithFallback(addr, resolver);
			} catch (error) {
				lastError = error as Error;
			}
		}

		throw lastError;
	}

	private async getMxRecordWithFallback(target: Address, fallback?: Resolver): Promise<MxRecord[]> {
		try {
			let resolver = fallback ? fallback : this.resolver;
			if (this.options.useTargetNameServer && !fallback) {
				resolver = await this.getNsResolver(target.hostname);
			}
			const result = await resolver.resolveMx(target.hostname);
			return result;
		} catch (error) {
			if (error instanceof Error && "code" in error) {
				// TODO SERVFAIL ise fallback dns kullan
				// || error.code === SERVFAIL
				if (error.code === DNS_ERRORS.NODATA || error.code === DNS_ERRORS.NOTFOUND) {
					return [];
				}

				throw error;
			}

			throw new Error(String(error));
		}
	}

	public async getNameServers(target: Target): Promise<string[]> {
		const addr = Address.loadFromTarget(target);

		const nsHosts = await this.resolver.resolveNs(addr.hostname);

		return nsHosts;
	}
}
