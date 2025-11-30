import { TXTRecord, TXTRecordKind } from './txt-record.js';

interface BimiData {
	locationPath?: string;
	authorityPath?: string;
	locationData: Buffer<ArrayBuffer> | null;
	authorityData: Buffer<ArrayBuffer> | null;
}

export class BIMIRecord extends TXTRecord {
	v?: string;
	l?: string; // location (logo url)
	a?: string; // authority (certificate url)

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
					if (this.v.toUpperCase() === 'BIMI1') {
						this.kind = TXTRecordKind.BIMI1;
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

		const knownKeys = [...this.knownKeys, 'v', 'l', 'a'];

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

	public override async isValid(): Promise<boolean> {
		if (!(await super.isValid())) return false;
		if (!this.v || !this.l) {
			this.errors.push(`required field empty.`);
			return false;
		}

		const data = await this.downloadBimi();
		if (data.locationData === null) {
			this.errors.push(`required data empty.`);
			return false;
		}

		if (this.a && data.authorityData === null) {
			this.errors.push(`required data empty.`);
			return false;
		}

		return true;
	}

	public async downloadBimi(): Promise<BimiData> {
		return {
			locationPath: this.l,
			authorityPath: this.a,
			locationData: await this.downloadBuffer(this.l),
			authorityData: await this.downloadBuffer(this.a),
		};
	}
}
