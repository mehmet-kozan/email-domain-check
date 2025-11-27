import { DomainChecker, TXTResult } from 'email-domain-check';
import { describe, expect, it } from 'vitest';

describe('getMxRecord', () => {
	const checker = new DomainChecker();

	it('cambly.com mk record', async () => {
		const result = await checker.getMxRecord({
			target: 'mehmet.kozan@cambly.com'
		});
		expect(result).not.toBeNull();
		expect(result?.length).not.toBe(0);
	});
});
