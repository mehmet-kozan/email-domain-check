export enum TXTKind {
	Custom = 0,
	DKIM = 1,
	SPF = 2,
	DMARC = 3,
	STS = 4,
	CustomKeyValue = 5,
}

export class TXTResult {
	public records: TXTRecord[] = [];

	public getSTSPolicyId(): string | null {
		for (const record of this.records) {
			if (record.kind === TXTKind.STS) {
				const id = record.policy.get('id');
				if (typeof id === 'string' && id) {
					return id;
				}
			}
		}

		return null;
	}
}

export class TXTRecord {
	public raw: string;
	public key: string;
	public value: string;
	public kind: TXTKind;
	public policy: Map<string, string | string[] | boolean | number> = new Map();

	constructor(raw: string) {
		this.raw = raw;
		this.key = '';
		this.value = this.raw;
		this.kind = TXTKind.Custom;
		this.parse();
	}

	private parse(): void {
		// Check for SPF record
		if (this.raw.startsWith('v=spf1')) {
			this.kind = TXTKind.SPF;
			this.key = 'spf';
			this.value = this.raw;
			this.parseSPF();
			return;
		}

		// Check for DMARC record
		if (this.raw.startsWith('v=DMARC1')) {
			this.kind = TXTKind.DMARC;
			this.key = 'dmarc';
			this.value = this.raw;
			this.parseDMARC();
			return;
		}

		// Check for DKIM record
		if (this.raw.includes('p=') && (this.raw.startsWith('v=DKIM1') || this.raw.includes('k='))) {
			this.kind = TXTKind.DKIM;
			this.key = 'dkim';
			this.value = this.raw;
			this.parseDKIM();
			return;
		}

		// Check for MTA-STS record
		if (this.raw.startsWith('v=STSv1')) {
			this.kind = TXTKind.STS;
			this.key = 'mta-sts';
			this.value = this.raw;
			this.parseMTASTS();
			return;
		}

		// Check for key=value format
		const keyValueMatch = this.raw.match(/^([^=]+)=(.+)$/);
		if (keyValueMatch) {
			this.kind = TXTKind.CustomKeyValue;
			this.key = keyValueMatch[1].trim();
			this.value = keyValueMatch[2].trim();
		}
	}

	private parseSPF(): void {
		// Split by whitespace
		const parts = this.raw.split(/\s+/);

		for (const part of parts) {
			// Version
			if (part.startsWith('v=')) {
				this.policy.set('v', part.substring(2));
				continue;
			}

			// Remove qualifier prefix (+, -, ~, ?)
			const qualifier = part[0];
			const mechanism = ['+', '-', '~', '?'].includes(qualifier) ? part.substring(1) : part;

			// Parse mechanisms
			if (mechanism === 'a' || mechanism === 'A') {
				this.policy.set('a', true);
			} else if (mechanism === 'mx' || mechanism === 'MX') {
				this.policy.set('mx', true);
			} else if (mechanism === 'all') {
				this.policy.set('all', qualifier === '-' ? 'fail' : qualifier === '~' ? 'softfail' : 'pass');
			} else if (mechanism.startsWith('include:')) {
				const includes = (this.policy.get('include') as string[]) || [];
				includes.push(mechanism.substring(8));
				this.policy.set('include', includes);
			} else if (mechanism.startsWith('ip4:')) {
				const ip4s = (this.policy.get('ip4') as string[]) || [];
				ip4s.push(mechanism.substring(4));
				this.policy.set('ip4', ip4s);
			} else if (mechanism.startsWith('ip6:')) {
				const ip6s = (this.policy.get('ip6') as string[]) || [];
				ip6s.push(mechanism.substring(4));
				this.policy.set('ip6', ip6s);
			} else if (mechanism.startsWith('a:')) {
				this.policy.set('a:domain', mechanism.substring(2));
			} else if (mechanism.startsWith('mx:')) {
				this.policy.set('mx:domain', mechanism.substring(3));
			} else if (mechanism.startsWith('ptr')) {
				this.policy.set('ptr', true);
			} else if (mechanism.startsWith('exists:')) {
				this.policy.set('exists', mechanism.substring(7));
			} else if (mechanism.startsWith('redirect=')) {
				this.policy.set('redirect', mechanism.substring(9));
			} else if (mechanism.startsWith('exp=')) {
				this.policy.set('exp', mechanism.substring(4));
			}
		}
	}

	private parseDMARC(): void {
		// Split by semicolon
		const parts = this.raw
			.split(';')
			.map((p) => p.trim())
			.filter((p) => p);

		for (const part of parts) {
			const [key, value] = part.split('=').map((s) => s.trim());
			if (!key || !value) continue;

			switch (key.toLowerCase()) {
				case 'v':
					this.policy.set('v', value);
					break;
				case 'p':
					this.policy.set('p', value); // none, quarantine, reject
					break;
				case 'sp':
					this.policy.set('sp', value); // subdomain policy
					break;
				case 'rua':
					this.policy.set(
						'rua',
						value.split(',').map((s) => s.trim()),
					);
					break;
				case 'ruf':
					this.policy.set(
						'ruf',
						value.split(',').map((s) => s.trim()),
					);
					break;
				case 'pct':
					this.policy.set('pct', parseInt(value, 10));
					break;
				case 'adkim':
					this.policy.set('adkim', value); // r or s
					break;
				case 'aspf':
					this.policy.set('aspf', value); // r or s
					break;
				case 'ri':
					this.policy.set('ri', parseInt(value, 10));
					break;
				case 'fo':
					this.policy.set('fo', value);
					break;
				case 'rf':
					this.policy.set('rf', value);
					break;
				default:
					this.policy.set(key, value);
			}
		}
	}

	private parseDKIM(): void {
		// Split by semicolon
		const parts = this.raw
			.split(';')
			.map((p) => p.trim())
			.filter((p) => p);

		for (const part of parts) {
			const [key, value] = part.split('=').map((s) => s.trim());
			if (!key || !value) continue;

			switch (key.toLowerCase()) {
				case 'v':
					this.policy.set('v', value);
					break;
				case 'k':
					this.policy.set('k', value); // key type (rsa, ed25519)
					break;
				case 'p':
					this.policy.set('p', value); // public key
					break;
				case 'h':
					this.policy.set(
						'h',
						value.split(':').map((s) => s.trim()),
					); // hash algorithms
					break;
				case 's':
					this.policy.set(
						's',
						value.split(':').map((s) => s.trim()),
					); // service types
					break;
				case 't':
					this.policy.set(
						't',
						value.split(':').map((s) => s.trim()),
					); // flags
					break;
				case 'n':
					this.policy.set('n', value); // notes
					break;
				default:
					this.policy.set(key, value);
			}
		}
	}

	private parseMTASTS(): void {
		// Split by semicolon
		const parts = this.raw
			.split(';')
			.map((p) => p.trim())
			.filter((p) => p);

		for (const part of parts) {
			const [key, value] = part.split('=').map((s) => s.trim());
			if (!key || !value) continue;

			switch (key.toLowerCase()) {
				case 'v':
					this.policy.set('v', value); // STSv1
					break;
				case 'id':
					this.policy.set('id', value); // unique identifier (timestamp/version)
					break;
				default:
					this.policy.set(key, value);
			}
		}
	}

	public isValid(): boolean {
		return this.raw.length > 0;
	}

	public toString(): string {
		return this.raw;
	}
}
