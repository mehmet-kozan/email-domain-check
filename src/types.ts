export type { MxRecord } from "node:dns";

export interface DomainCheckerOptions {
	server?: string[];
	dkimSelector?: string;
	useCache?: boolean;
	smtpTimeout?: number;
	dnsTimeout?: number;
	useTargetNameServer?: boolean;
	ignoreIPv6?: boolean;
	tries: number;
	failoverServers: Array<string[]>;
}
