import { DomainChecker } from 'email-domain-check';
import { describe, expect, it } from 'vitest';

const IS_SERVER = process.env.IS_SERVER;

describe('general test default export', () => {
	const checker = new DomainChecker();

	it('returns true for valid domain', { timeout: 60000 }, async () => {
		if (IS_SERVER) {
			const result = await checker.getSmtpConnection('mehmet.kozan@gmail.com');
			expect(result).not.toBeNull();
		} else {
			await expect(checker.getSmtpConnection('mehmet.kozan@gmail.com')).rejects.toThrow();
		}
	});
});
