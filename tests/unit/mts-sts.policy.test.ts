import { describe, expect, it } from 'vitest';
import { getMtaStsPolicy } from 'email-domain-check';

describe('getMtaStsPolicy', () => {
	it('returns valid sts policy', async () => {
		const policy = await getMtaStsPolicy('mehmet.kozan@gmail.com');
		expect(policy).not.toBeNull();
		expect(policy?.version).toBe('STSv1');
		expect(policy?.mode).toBe('enforce');
	});
});
