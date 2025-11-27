import { DomainChecker, TXTResult } from 'email-domain-check';
import { describe, expect, it } from 'vitest';

describe('general test default export', () => {
	const checker = new DomainChecker();

	it('returns true for valid domain', async () => {
		const result = await checker.getDkimRecord({
			target: 'mehmet.kozan@cambly.com',
			dkimSelector: 'k1',
		});
		expect(result).not.toBeNull();
		expect(result).toBeInstanceOf(TXTResult);
		expect(result?.records.length).toBe(1);
	});
});
