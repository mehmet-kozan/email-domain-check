import { DomainChecker } from 'email-domain-check';
import { describe, expect, it } from 'vitest';

describe('getStsRecord', () => {
	const checker = new DomainChecker();

	it('valid sts record', async () => {
		const result = await checker.getStsRecord({
			target: 'mehmet.kozan@gmail.com',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');
	});
});
