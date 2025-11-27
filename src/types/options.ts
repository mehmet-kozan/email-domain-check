import type { Target } from '../address.js';

export interface DomainCheckerOptions {
	server?: string[];
	dkimSelector?: string;
	useCache?: boolean;
	cacheTTL?: number;
	smtpTimeout?: number;
	dnsTimeout?: number;
	useHostNameServer?: boolean;
	useMtaSts?: boolean;
	ignoreIPv6?: boolean;
	tries?: number;
	failoverServers?: Array<string[]>;
	blockLocalIPs?: boolean;
	deliveryPort?: number;
}

export interface ResolveOptions {
	target: Target;
	useCache?: boolean;
	useOnlyHostNameServer?: boolean;
	dkimSelector?: string;
}
