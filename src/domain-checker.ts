import { NODATA, NOTFOUND, SERVFAIL } from "node:dns";
import { Resolver } from "node:dns/promises";
import { Address, type Target } from "./address.js";
import type { DomainCheckerOptions, MxRecord } from "./types.js";

export class DomainChecker {
	private options: DomainCheckerOptions;
	private resolver: Resolver;

	constructor(options?: DomainCheckerOptions) {
		const defaultOptions: DomainCheckerOptions = {
			dkimSelector: "mx",
			smtpConnectionTimeout: 5000,
			dnsConnectionTimeout: -1,
			useDomainNameServers: true,
			tries: 4,
		};

		this.options = { ...defaultOptions, ...(options ?? {}) };

		this.resolver = new Resolver({
			timeout: this.options.dnsConnectionTimeout,
			tries: this.options.tries,
		});
		if (this.options.customDnsServers) {
			this.resolver.setServers(this.options.customDnsServers);
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
				timeout: this.options.dnsConnectionTimeout,
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

	public async getMxRecord(target: Target, fallback?: Resolver): Promise<MxRecord[]> {
		const addr = Address.loadFromTarget(target);

		try {
			let resolver = fallback ? fallback : this.resolver;
			if (this.options.useDomainNameServers && !fallback) {
				resolver = await this.getNsResolver(addr.hostname);
			}
			const result = await resolver.resolveMx(addr.hostname);
			return result;
		} catch (error) {
			if (error instanceof Error && "code" in error) {
				// TODO SERVFAIL ise fallback dns kullan
				if (error.code === NODATA || error.code === NOTFOUND || error.code === SERVFAIL) {
					return [];
				}
			}
			throw error;
		}
	}

	public async getNameServers(target: Target): Promise<string[]> {
		const addr = Address.loadFromTarget(target);

		const nsHosts = await this.resolver.resolveNs(addr.hostname);

		return nsHosts;
	}
}
