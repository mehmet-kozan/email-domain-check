import type { ResolverOptions } from "node:dns";
import dns from "node:dns/promises";

export enum ResolverKind {
	System = 0,
	Custom = 1,
	Failover = 2,
	FailoverSystem = 3,
	HostNameServer = 4,
}

export interface DNSResolverOptions extends ResolverOptions {
	kind?: ResolverKind;
	nsHosts?: string[];
}

export class DNSResolver extends dns.Resolver {
	public kind: ResolverKind = ResolverKind.System;
	public nsHosts: string[] = [];

	constructor(options?: DNSResolverOptions | undefined) {
		super(options);

		if (options?.kind) {
			this.kind = options.kind;
		}

		if (options?.nsHosts) {
			this.nsHosts = options.nsHosts;
		}
	}
}
