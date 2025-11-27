import { DomainChecker, TXTResult } from 'email-domain-check';
import { describe, expect, it } from 'vitest';

describe('general test default export', () => {
	const checker = new DomainChecker();

	it('returns true for valid domain', async () => {
		const result = await checker.getMtaStsRecord({
			target: 'mehmet.kozan@gmail.com',
		});
		expect(result).not.toBeNull();
		expect(result).toBeInstanceOf(TXTResult);
		expect(result?.records.length).toBe(1);
	});
});
