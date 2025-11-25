import net from "node:net";
import { domainToASCII } from "node:url";
import ipaddr from "ipaddr.js";

export type Target = string | URL | Address;

export enum IPKind {
	None = 0,
	IPv4 = 4,
	IPv6 = 6,
}

export class Address {
	public readonly source: string;
	public readonly ipKind: IPKind;
	public readonly user?: string;
	public readonly hostname: string;

	constructor(target: string, source?: string) {
		this.source = source ?? target;

		const atPos = target.indexOf("@");

		if (atPos >= 0) {
			this.user = target.slice(0, atPos);
			const domainPart = target.slice(atPos + 1);
			this.ipKind = net.isIP(domainPart) as IPKind;

			if (this.ipKind !== IPKind.None) {
				this.hostname = domainPart;
			} else {
				// RFC 5321 / RFC 5322
				// Check if the domain looks like an IP literal. IP addresses need to be enclosed in square brackets
				//     user@[127.0.0.1]
				//     user@[IPv6:2001:db8:1ff::a0b:dbd0]
				if (/^\[(ipv6:)?[^\]]+\]$/i.test(domainPart)) {
					const cleanDomain = domainPart.replace(/^\[(ipv6:)?|\]$/gi, "");
					this.ipKind = net.isIP(cleanDomain) as IPKind;
					if (this.ipKind !== IPKind.None) {
						this.hostname = cleanDomain;
					} else {
						throw new Error(`Parse error source:${domainPart}`);
					}
				} else {
					const noDot = domainPart.replace(/\.$/, "");
					this.hostname = domainToASCII(noDot).toLowerCase();
				}
			}
		} else {
			this.ipKind = net.isIP(target) as IPKind;
			if (this.ipKind !== IPKind.None) {
				this.hostname = target;
			} else {
				const noDot = target.replace(/\.$/, "");
				this.hostname = domainToASCII(noDot).toLowerCase();
			}
		}
	}

	public static loadFromUrl(url: string | URL): Address {
		let source: string;
		if (typeof url === "string") {
			source = url;
			url = new URL(url);
		} else {
			source = url.href;
		}

		return new Address(url.hostname, source);
	}

	public static loadFromTarget(target: Target): Address {
		if (target instanceof Address) {
			return target;
		} else if (target instanceof URL) {
			return Address.loadFromUrl(target);
		} else {
			return new Address(target);
		}
	}

	public get isIP(): boolean {
		return this.ipKind !== IPKind.None;
	}

	public get hasPunycode(): boolean {
		if (this.hostname) {
			return this.hostname.split(".").some((part) => part.startsWith("xn--"));
		}
		return false;
	}

	// Special IPv4 address ranges.
	// See also https://en.wikipedia.org/wiki/Reserved_IP_addresses
	public get isReserved(): boolean {
		if (!this.isIP) return false;

		try {
			const parsed = ipaddr.parse(this.hostname);
			const range = parsed.range(); // e.g. 'unicast','private','loopback','linkLocal','multicast','uniqueLocal','global', ...
			// IPv4: consider as reserved if not 'unicast'
			if (this.ipKind === IPKind.IPv4) {
				return range !== "unicast";
			}
			// IPv6: consider as reserved if not 'unicast'
			if (this.ipKind === IPKind.IPv6) {
				return range !== "unicast";
			}
		} catch {
			// If parsing fails, assume it's not reserved
		}

		return false;
	}
}
