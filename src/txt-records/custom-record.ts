import { TXTRecord, TXTRecordKind } from './txt-record.js';

export class CustomRecord extends TXTRecord {
	value?: string;

	public parse(raw: string): this {
		this.kind === TXTRecordKind.Custom;
		this.raw = raw;
		this.value = raw;
		return this;
	}

	public toString(): string {
		return this.value || '';
	}
}
