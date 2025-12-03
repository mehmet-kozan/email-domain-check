import type { CheckResult } from '../check-results/check-result.js';
import { TXTRecord, TXTRecordKind } from './txt-record.js';

export class CustomRecord extends TXTRecord {
	public check(): Promise<CheckResult> {
		throw new Error('Method not implemented.');
	}
	value?: string;

	constructor(raw: string, domain?: string) {
		super(raw, domain);

		// Class field initializers run after super(), overwriting values set by parse() called in super().
		// We must re-parse to restore the values if raw was provided.
		this.parse(raw);
	}

	public parse(raw: string): this {
		this.kind = TXTRecordKind.Custom;
		this.value = raw;
		return this;
	}

	public toString(): string {
		return this.value || '';
	}
}
