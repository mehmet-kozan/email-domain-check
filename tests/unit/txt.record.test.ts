import { DomainChecker, TXTQueryResult } from 'email-domain-check';
import { describe, expect, it } from 'vitest';

describe('getTxtRecord', () => {
	const checker = new DomainChecker();

	it('returns true for valid domain', async () => {
		const result = await checker.getTxtRecord({
			target: 'mehmet.kozan@gmail.com',
		});
		expect(result).not.toBeNull();
		expect(result).toBeInstanceOf(TXTQueryResult);
		expect(result?.dnsRecords.length).toBe(3);
	});
});
