import type { Target } from './address.js';

/**
 * Options for DomainChecker behavior.
 *
 * @interface DomainCheckerOptions
 * @property {string[]} [server] - Custom DNS servers to use for lookups.
 * @property {string} [dkimSelector='default'] - Default DKIM selector to use when none provided.
 * @property {boolean} [useCache] - Enable DNS caching.
 * @property {number} [cacheTTL] - Cache TTL in milliseconds.
 * @property {number} [smtpTimeout=10000] - SMTP connection timeout in milliseconds.
 * @property {number} [dnsTimeout=5000] - DNS query timeout in milliseconds.
 * @property {number} [httpTimeout=8000] - HTTP request timeout in milliseconds.
 * @property {number} [socketIdleTimeout] - RFC 5321 socket idle timeout in milliseconds.
 * @property {boolean} [useDomainNS=false] - Query the domain's authoritative nameservers first.
 * @property {boolean} [useMtaSts=false] - Enable MTA-STS related lookups.
 * @property {boolean} [ignoreIPv6] - Ignore IPv6 addresses when resolving.
 * @property {number} [tries=3] - Number of retry attempts for operations.
 * @property {Array<string[]>} [failoverServers=[['1.0.0.1','1.1.1.1'],['8.8.4.4','8.8.8.8']]] - Fallback DNS resolver groups.
 * @property {boolean} [blockLocalIPs=false] - Block local/private IP addresses from results.
 * @property {number} [deliveryPort=25] - Default SMTP delivery port.
 */
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
	opts.server = opts.server ?? ['1.1.1.1', '1.0.0.1'];
	opts.failoverServers = opts.failoverServers ?? [
		['1.1.1.1', '1.0.0.1'],
		['8.8.8.8', '8.8.4.4'],
	];
	opts.blockLocalIPs = opts?.blockLocalIPs ?? false;
	opts.deliveryPort = opts?.deliveryPort ?? 25;
	opts.ignoreIPv6 = opts?.ignoreIPv6 ?? false;

	return opts as SafeDCOptions;
}

/**
 * Options for individual DNS/record resolution calls.
 *
 * @interface ResolveOptions
 * @property {Target} target - The target hostname, email or IP to resolve.
 * @property {boolean} [useCache] - Use the library DNS cache when available.
 * @property {boolean} [preferDomainNS=false] - Prefer querying the domain's authoritative nameservers first.
 * @property {string} [dkimSelector] - DKIM selector to use for DKIM lookups (overrides default).
 */
export interface ResolveOptions {
	target: Target;
	useCache?: boolean;
	preferDomainNS?: boolean;
	dkimSelector?: string;
	bimiSelector?: string;
}
