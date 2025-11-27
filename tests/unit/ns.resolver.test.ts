import { DNSResolver, DomainChecker, ResolverKind } from 'email-domain-check';
import { describe, expect, it } from 'vitest';

describe('getNsResolver', () => {
	const checker = new DomainChecker();

	it('returns valid nameservers aaa.mail.gmail.com', async () => {
		const resolver = await checker.getNsResolver('mehmet.kozan@aaa.mail.gmail.com');

		expect(resolver).toBeInstanceOf(DNSResolver);
		expect(resolver.kind).toBe(ResolverKind.HostNameServer);
		expect(resolver.nsHosts).toContain('ns1.google.com');
		expect(resolver.nsHosts).toContain('ns2.google.com');
		expect(resolver.nsHosts).toContain('ns3.google.com');
		expect(resolver.nsHosts).toContain('ns4.google.com');
	});
});
