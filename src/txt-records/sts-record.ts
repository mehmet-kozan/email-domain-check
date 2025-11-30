import { TXTRecord, TXTRecordKind } from './txt-record.js';

export class STSRecord extends TXTRecord {
	v = 'STSv1';
	id = '';

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
					this.v = value; // STSv1
					if (this.v.toUpperCase() === 'STSV1') {
						this.kind = TXTRecordKind.STSv1;
					}
					break;
				case 'id':
					this.id = value; // unique identifier (timestamp/version)
					break;
				default:
					this[key] = value;
			}
		}
		return this;
	}

	public toString(): string {
		const parts: string[] = [`v=${this.v}`];

		if (this.id) parts.push(`id=${this.id}`);

		const knownKeys = [...this.knownKeys, 'v', 'id'];

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
