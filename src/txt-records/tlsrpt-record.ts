import { TXTRecord, TXTRecordKind } from './txt-record.js';

export class TLSRPTRecord extends TXTRecord {
	v = 'TLSRPTv1';
	rua = '';

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
					this.v = value.toLowerCase();
					if (this.v === 'tlsrptv1') {
						this.kind = TXTRecordKind.TLSRPTv1;
					}
					break;
				case 'rua':
					this.rua = value; // Reporting URI(s)
					break;
				default:
					this[key] = value;
			}
		}
		return this;
	}

	public toString(): string {
		const parts: string[] = [`v=${this.v}`];

		if (this.rua) parts.push(`rua=${this.rua}`);

		const knownKeys = ['raw', 'errors', 'v', 'rua', 'kind'];

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
