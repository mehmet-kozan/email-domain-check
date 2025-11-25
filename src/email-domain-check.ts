import dns from "node:dns/promises";

export async function mxCheck(email: string): Promise<boolean> {
	try {
		if (typeof email !== "string") return false;
		const parts = email.split("@");
		if (parts.length !== 2 || !parts[1]) return false;
		const domain = parts[1];

		const addresses = await dns.resolveMx(domain);
		return Array.isArray(addresses) && addresses.length > 0;
	} catch {
		return false;
	}
}
