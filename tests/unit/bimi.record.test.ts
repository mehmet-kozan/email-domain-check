import { DomainChecker } from 'email-domain-check';
import { describe, expect, it } from 'vitest';

describe('validate bimi record', () => {
	const checker = new DomainChecker();

	it('paypal.com', async () => {
		const result = await checker.getBimiRecord({
			target: 'paypal.com',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');

		const checkResult = await result?.check();

		expect(checkResult?.isValid()).toBe(true);
	});

	it('cnn.com', async () => {
		const result = await checker.getBimiRecord({
			target: 'cnn.com',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');

		const checkResult = await result?.check();

		expect(checkResult?.isValid()).toBe(true);
	});

	it('linkedin.com', async () => {
		const result = await checker.getBimiRecord({
			target: 'linkedin.com',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');

		const checkResult = await result?.check();

		expect(checkResult?.isValid()).toBe(true);
	});

	it('airbnb.com', async () => {
		const result = await checker.getBimiRecord({
			target: 'airbnb.com',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');

		const checkResult = await result?.check();

		expect(checkResult?.isValid()).toBe(true);
	});

	it('bankofamerica.com', async () => {
		const result = await checker.getBimiRecord({
			target: 'bankofamerica.com',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');

		const checkResult = await result?.check();

		expect(checkResult?.isValid()).toBe(true);
	});

	it('groupon.com', async () => {
		const result = await checker.getBimiRecord({
			target: 'groupon.com',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');

		const checkResult = await result?.check();

		expect(checkResult?.isValid()).toBe(true);
	});

	it('chase.com', async () => {
		const result = await checker.getBimiRecord({
			target: 'chase.com',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');

		const checkResult = await result?.check();

		expect(checkResult?.isValid()).toBe(true);
	});

	it('paypal.com', async () => {
		const result = await checker.getBimiRecord({
			target: 'paypal.com',
		});
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('raw');
		expect(typeof result?.raw).toBe('string');

		const checkResult = await result?.check();

		expect(checkResult?.isValid()).toBe(true);
	});
});
