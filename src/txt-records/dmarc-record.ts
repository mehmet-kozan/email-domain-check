import { TXTRecord, TXTRecordKind } from './txt-record.js';

export class DMARCRecord extends TXTRecord {
	v = 'DMARC1';
	p?: string;
	sp?: string;
	rua?: string[];
	ruf?: string[];
	adkim?: string;
	aspf?: string;
	ri?: number;
	fo?: string[];
	pct?: number;
	rf?: string;

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
					if (this.v.toUpperCase() === 'DMARC1') {
						this.kind = TXTRecordKind.DMARC1;
					}
					break;
				case 'p':
					this.p = value; // none, quarantine, reject
					break;
				case 'sp':
					this.sp = value; // subdomain policy
					break;
				case 'rua':
					this.rua = value.split(',').map((s) => s.trim());
					break;
				case 'ruf':
					this.ruf = value.split(',').map((s) => s.trim());
					break;
				case 'pct':
					this.pct = parseInt(value, 10);
					break;
				case 'adkim':
					this.adkim = value; // r or s
					break;
				case 'aspf':
					this.aspf = value; // r or s
					break;
				case 'ri':
					this.ri = parseInt(value, 10);
					break;
				case 'fo':
					this.fo = value.split(':').map((s) => s.trim());
					break;
				case 'rf':
					this.rf = value;
					break;
				default:
					this[key] = value;
			}
		}
		return this;
	}

	public toString(): string {
		const parts: string[] = [`v=${this.v}`];

		if (this.p) parts.push(`p=${this.p}`);
		if (this.sp) parts.push(`sp=${this.sp}`);
		if (this.rua && this.rua.length > 0) parts.push(`rua=${this.rua.join(',')}`);
		if (this.ruf && this.ruf.length > 0) parts.push(`ruf=${this.ruf.join(',')}`);
		if (this.adkim) parts.push(`adkim=${this.adkim}`);
		if (this.aspf) parts.push(`aspf=${this.aspf}`);
		if (this.ri !== undefined) parts.push(`ri=${this.ri}`);
		if (this.fo && this.fo.length > 0) parts.push(`fo=${this.fo.join(':')}`);
		if (this.pct !== undefined) parts.push(`pct=${this.pct}`);
		if (this.rf) parts.push(`rf=${this.rf}`);

		const knownKeys = [...this.knownKeys, 'v', 'p', 'sp', 'rua', 'ruf', 'adkim', 'aspf', 'ri', 'fo', 'pct', 'rf'];

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
