import dns from "node:dns";

export type { MxRecord } from "node:dns";

export interface DomainCheckerOptions {
	server?: string[];
	dkimSelector?: string;
	useCache?: boolean;
	smtpTimeout?: number;
	dnsTimeout?: number;
	useTargetNameServer?: boolean;
	ignoreIPv6?: boolean;
	tries?: number;
	failoverServers?: Array<string[]>;
	blockReservedIPs?: boolean;
}

export const DNS_ERRORS = {
	NODATA: dns.NODATA, // No data: query completed but no records of requested type
	FORMERR: dns.FORMERR, // Format error: name server could not parse the query
	SERVFAIL: dns.SERVFAIL, // Server failure: general server-side failure
	NOTFOUND: dns.NOTFOUND, // Name error / NXDOMAIN: domain does not exist
	NOTIMP: dns.NOTIMP, // Not implemented: server does not support requested operation
	REFUSED: dns.REFUSED, // Refused: server refused to perform the operation
	BADQUERY: dns.BADQUERY, // Bad query: malformed query from client
	BADNAME: dns.BADNAME, // Bad name: invalid domain name in query
	BADFAMILY: dns.BADFAMILY, // Bad family: address family not supported (e.g., IPv6/IPv4 mismatch)
	BADRESP: dns.BADRESP, // Bad response: malformed response from server
	CONNREFUSED: dns.CONNREFUSED, // Connection refused: transport-level connection refused
	TIMEOUT: dns.TIMEOUT, // Timed out: operation exceeded allowed time
	EOF: dns.EOF, // Unexpected EOF from underlying stream/socket
	FILE: dns.FILE, // File error: problem reading/writing a file
	NOMEM: dns.NOMEM, // Out of memory
	DESTRUCTION: dns.DESTRUCTION, // Resolver destroyed while operation in progress
	BADSTR: dns.BADSTR, // Bad string: invalid string in input
	BADFLAGS: dns.BADFLAGS, // Bad flags provided to resolver API
	NONAME: dns.NONAME, // No name/host information available
	BADHINTS: dns.BADHINTS, // Bad hints passed to resolver (invalid auxiliary data)
	NOTINITIALIZED: dns.NOTINITIALIZED, // Resolver not initialized before use
	LOADIPHLPAPI: dns.LOADIPHLPAPI, // Windows: failed to load IP helper API
	ADDRGETNETWORKPARAMS: dns.ADDRGETNETWORKPARAMS, // Windows: failed to obtain network params
	CANCELLED: dns.CANCELLED, // Operation was canceled
};
