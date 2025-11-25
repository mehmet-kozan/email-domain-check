export type { MxRecord } from "node:dns";

export interface DomainCheckerOptions {
	customDnsServers?: string[];
	dkimSelector?: string;
	useCache?: boolean;
	smtpConnectionTimeout?: number;
	dnsConnectionTimeout?: number;
	useDomainNameServers?: boolean;
	ignoreIPv6?: boolean;
}
