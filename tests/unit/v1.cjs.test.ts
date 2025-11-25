import { describe, expect, it } from "vitest";

const { DomainChecker } = require("../../dist/cjs/index.js");

describe("DomainChecker (CJS) - basic checks", () => {
    const checker = new DomainChecker();
    it("returns false for invalid domain", { timeout: 10000 }, async () => {
        const result = await checker.hasMxRecord("mehmet.kozan@gmailililil.com");
        expect(result).toBe(false);
    });

    it("returns true for valid domain", async () => {
        const result = await checker.hasMxRecord("mehmet.kozan@gmail.com");
        expect(result).toBe(true);
    });
});
