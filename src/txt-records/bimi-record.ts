import { TXTRecord, TXTRecordKind } from './txt-record.js';

export class BIMIRecord extends TXTRecord {
	v?: string;
	l?: string; // location (logo url)
	a?: string; // authority (certificate url)

	public parse(raw: string): this {
		this.raw = raw;

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
					if (this.v === 'BIMI1') {
						this.kind === TXTRecordKind.BIMI1;
					}
					break;
				case 'l':
					this.l = value; // Logo URL
					break;
				case 'a':
					this.a = value; // Authority Evidence (VMC URL)
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
		if (this.l) parts.push(`l=${this.l}`);
		if (this.a) parts.push(`a=${this.a}`);

		const knownKeys = ['raw', 'errors', 'v', 'l', 'a'];

		for (const key of Object.keys(this)) {
			if (knownKeys.includes(key)) continue;

			const value = this[key];
			if (Array.isArray(value)) {
				for (const v of value) {
					parts.push(`${key}=${v}`);
				}
			} else if (typeof value === 'string' || typeof value === 'number') {
				parts.push(`${key}=${value}`);
			}
		}

		return parts.join('; ');
	}
}
