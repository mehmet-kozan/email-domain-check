import { DomainChecker } from 'email-domain-check';
import { describe, expect, it } from 'vitest';

describe('getDmarcRecord', () => {
	const checker = new DomainChecker();

	it('returns valid dmarc record', async () => {
		const result = await checker.getDmarcRecord({
			target: 'mehmet.kozan@gmail.com',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');
	});
});
