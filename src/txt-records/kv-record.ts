import { TXTRecord, TXTRecordKind } from './txt-record.js';

export const KV_REGEX = /^([^=]+)=(.+)$/;

export class KVRecord extends TXTRecord {
	key?: string;
	value?: string;

	public parse(raw: string): this {
		this.raw = raw;
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
