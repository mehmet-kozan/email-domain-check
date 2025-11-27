import net from 'node:net';
import { domainToASCII } from 'node:url';

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

	constructor(mailOrHost: string) {
		this.source = mailOrHost;

		const atPos = mailOrHost.indexOf('@');

		if (atPos >= 0) {
			//email literal
			this.user = mailOrHost.slice(0, atPos);
			const domainPart = mailOrHost.slice(atPos + 1);
			this.ipKind = net.isIP(domainPart) as IPKind;

			if (this.ipKind !== IPKind.None) {
				this.hostname = domainPart;
			} else {
				// RFC 5321 / RFC 5322
				// Check if the domain looks like an IP literal. IP addresses need to be enclosed in square brackets
				//     user@[127.0.0.1]
				//     user@[IPv6:2001:db8:1ff::a0b:dbd0]
				if (/^\[(ipv6:)?[^\]]+\]$/i.test(domainPart)) {
					const cleanDomain = domainPart.replace(/^\[(ipv6:)?|\]$/gi, '');
					this.ipKind = net.isIP(cleanDomain) as IPKind;
					if (this.ipKind !== IPKind.None) {
						this.hostname = cleanDomain;
					} else {
						throw new Error(`Parse error source:${domainPart}`);
					}
				} else {
					const noDot = domainPart.replace(/\.$/, '');
					this.hostname = domainToASCII(noDot).toLowerCase();
				}
			}
		} else {
			// hostname literal
			this.ipKind = net.isIP(mailOrHost) as IPKind;
			if (this.ipKind !== IPKind.None) {
				this.hostname = mailOrHost;
			} else {
				const noDot = mailOrHost.replace(/\.$/, '');
				this.hostname = domainToASCII(noDot).toLowerCase();
			}
		}
	}

	// public static loadFromUrl(url: string | URL): Address {
	// 	let source: string;
	// 	if (typeof url === "string") {
	// 		source = url;
	// 		url = new URL(url);
	// 	} else {
	// 		source = url.href;
	// 	}

	// 	return new Address(url.hostname, source);
	// }

	public static loadFromTarget(target: Target): Address {
		if (target instanceof Address) {
			return target;
		} else if (target instanceof URL) {
			return new Address(target.hostname);
		} else {
			return new Address(target);
		}
	}

	public get isIP(): boolean {
		return this.ipKind !== IPKind.None;
	}

	public get hasPunycode(): boolean {
		if (this.hostname) {
			return this.hostname.split('.').some((part) => part.startsWith('xn--'));
		}
		return false;
	}

	// Special IPv4 address ranges.
	// See also https://en.wikipedia.org/wiki/Reserved_IP_addresses
	public get isLocal(): boolean {
		if (this.ipKind === IPKind.IPv4) {
			const parts = this.hostname.split('.').map(Number);

			// Loopback: 127.0.0.0/8
			if (parts[0] === 127) return true;

			// Private: 10.0.0.0/8
			if (parts[0] === 10) return true;

			// Private: 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
			if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

			// Private: 192.168.0.0/16
			if (parts[0] === 192 && parts[1] === 168) return true;

			// Unspecified/This network: 0.0.0.0/8
			if (parts[0] === 0) return true;

			// Link-local: 169.254.0.0/16
			if (parts[0] === 169 && parts[1] === 254) return true;
		} else if (this.ipKind === IPKind.IPv6) {
			const lower = this.hostname.toLowerCase();

			// Loopback: ::1
			if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;

			// Link-local: fe80::/10
			if (lower.startsWith('fe80:')) return true;

			// Unique local: fc00::/7
			if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

			// Unspecified: ::
			if (lower === '::') return true;
		} else {
			if (this.hostname === 'localhost') return true;
		}

		return false;
	}
}
