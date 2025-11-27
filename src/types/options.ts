import type { Target } from '../address.js';

export interface DomainCheckerOptions {
	server?: string[];
	dkimSelector?: string;
	useCache?: boolean;
	cacheTTL?: number;
	smtpTimeout?: number;
	dnsTimeout?: number;
	httpTimeout?: number;
	// RFC 5321
	socketIdleTimeout?: number;
	useDomainNS?: boolean;
	useMtaSts?: boolean;
	ignoreIPv6?: boolean;
	tries?: number;
	failoverServers?: Array<string[]>;
	blockLocalIPs?: boolean;
	deliveryPort?: number;
}

const defaultKeys = ['dkimSelector', 'smtpTimeout', 'dnsTimeout', 'httpTimeout', 'tries', 'useDomainNS', 'useMtaSts', 'failoverServers', 'blockLocalIPs', 'deliveryPort'] as const;

export type SafeDCOptions = Required<Pick<DomainCheckerOptions, (typeof defaultKeys)[number]>> & DomainCheckerOptions;

export function setSafeDCOptions(opts?: DomainCheckerOptions): SafeDCOptions {
	if (opts === undefined) opts = {};
	opts.dkimSelector = opts?.dkimSelector ?? 'default';
	opts.smtpTimeout = opts?.smtpTimeout ?? 10000;
	opts.httpTimeout = opts?.httpTimeout ?? 8000;
	opts.dnsTimeout = opts?.dnsTimeout ?? 5000;
	opts.tries = opts?.tries ?? 3;
	opts.useDomainNS = opts?.useDomainNS ?? false;
	opts.useMtaSts = opts?.useMtaSts ?? false;
	opts.failoverServers = opts?.failoverServers ?? [
		['1.1.1.1', '1.0.0.1'],
		['8.8.8.8', '8.8.4.4'],
	];
	opts.blockLocalIPs = opts?.blockLocalIPs ?? false;
	opts.deliveryPort = opts?.deliveryPort ?? 25;

	return opts as SafeDCOptions;
}

export interface ResolveOptions {
	target: Target;
	useCache?: boolean;
	preferDomainNS?: boolean;
	dkimSelector?: string;
}
