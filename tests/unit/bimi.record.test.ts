import { DomainChecker } from 'email-domain-check';
import { describe, expect, it } from 'vitest';

describe('getDkimRecord', () => {
	const checker = new DomainChecker();

	it('returns valid dkim record', async () => {
		const result = await checker.getBimiRecord({
			target: 'cnn.com',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');

		const res = await result?.downloadBimi();
		debugger;
	});
});
