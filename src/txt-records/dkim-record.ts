import { TXTRecord, TXTRecordKind } from './txt-record.js';

export class DKIMRecord extends TXTRecord {
	v?: string;
	k?: string;
	p?: string;
	h?: string[];
	s?: string[];
	t?: string[];
	n?: string;

	constructor(raw: string, domain?: string) {
		super(raw, domain);

		// Class field initializers run after super(), overwriting values set by parse() called in super().
		// We must re-parse to restore the values if raw was provided.
		this.parse(raw);
	}

	public parse(raw: string): this {
		const parts = raw
			.split(';')
			.map((p) => p.trim())
			.filter((p) => p);

		for (const part of parts) {
			const [key, value] = part.split('=').map((s) => s.trim());
			if (!key || !value) continue;

			switch (key.toLowerCase()) {
				case 'v':
					this.v = value;
					if (this.v.toUpperCase() === 'DKIM1') {
						this.kind = TXTRecordKind.DKIM1;
					}
					break;
				case 'k':
					this.k = value; // key type (rsa, ed25519)
					break;
				case 'p':
					this.p = value; // public key
					break;
				case 'h':
					this.h = value.split(':').map((s) => s.trim()); // hash algorithms
					break;
				case 's':
					this.s = value.split(':').map((s) => s.trim()); // service types
					break;
				case 't':
					this.t = value.split(':').map((s) => s.trim()); // flags
					break;
				case 'n':
					this.n = value; // notes
					break;
				default:
					this[key] = value;
			}
		}
		return this;
	}

	public toString(): string {
		const parts: string[] = [];

		if (this.v) parts.push(`v=${this.v}`);
		if (this.k) parts.push(`k=${this.k}`);
		if (this.p) parts.push(`p=${this.p}`);
		if (this.h && this.h.length > 0) parts.push(`h=${this.h.join(':')}`);
		if (this.s && this.s.length > 0) parts.push(`s=${this.s.join(':')}`);
		if (this.t && this.t.length > 0) parts.push(`t=${this.t.join(':')}`);
		if (this.n) parts.push(`n=${this.n}`);

		const knownKeys = [...this.knownKeys, 'v', 'k', 'p', 'h', 's', 't', 'n'];

		for (const key of Object.keys(this)) {
			if (knownKeys.includes(key)) continue;

			const value = this[key];
			if (typeof value === 'string' || typeof value === 'number') {
				parts.push(`${key}=${value}`);
			}
		}

		return parts.join('; ');
	}
}
