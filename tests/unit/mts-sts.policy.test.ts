import { describe, expect, it } from 'vitest';
import { getMtaStsPolicy } from '../../src/mta-sts.js';

describe('general test default export', () => {
	it('returns true for valid domain', async () => {
		const policy = await getMtaStsPolicy('mehmet.kozan@gmail.com');
		expect(policy).not.toBeNull();
		expect(policy?.version).toBe('STSv1');
		expect(policy?.mode).toBe('enforce');
	});
});
