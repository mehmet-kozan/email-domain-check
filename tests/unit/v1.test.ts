import { mxCheck } from "email-domain-check";
import { describe, expect, it } from "vitest";

describe("general test default export", () => {
	it("returns false for invalid domain", { timeout: 10000 }, async () => {
		const result = await mxCheck("mehmet.kozan@gmailililil.com");
		expect(result).toBe(false);
	});

	it("returns true for valid domain", async () => {
		const result = await mxCheck("mehmet.kozan@gmail.com");
		expect(result).toBe(true);
	});
});
