import { DomainChecker } from 'email-domain-check';
import { describe, expect, it } from 'vitest';

describe('getDkimRecord', () => {
	const checker = new DomainChecker();

	it('returns valid dkim record', async () => {
		const result = await checker.getDkimRecord({
			target: 'mehmet.kozan@cambly.com',
			dkimSelector: 'k1',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');
	});
});
