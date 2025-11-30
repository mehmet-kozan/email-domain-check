import { TXTRecord, TXTRecordKind } from './txt-record.js';

export const KV_REGEX = /^([^=]+)=(.+)$/;

export class KVRecord extends TXTRecord {
	key?: string;
	value?: string;

	constructor(raw?: string) {
		super(raw);
		// Class field initializers run after super(), overwriting values set by parse() called in super().
		// We must re-parse to restore the values if raw was provided.
		if (raw) {
			this.parse(raw);
		}
	}

	public parse(raw: string): this {
		const match = raw.match(KV_REGEX);
		if (match) {
			this.kind = TXTRecordKind.KV;
			this.key = match[1].trim();
			this.value = match[2].trim();
		} else {
			this.errors.push('Invalid key-value format.');
		}
		return this;
	}

	public toString(): string {
		return this.key && this.value ? `${this.key}=${this.value}` : '';
	}
}
