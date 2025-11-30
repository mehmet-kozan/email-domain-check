import { BIMIRecord } from './bimi-record.js';
import { CustomRecord } from './custom-record.js';
import { DKIMRecord } from './dkim-record.js';
import { DMARCRecord } from './dmarc-record.js';
import { KV_REGEX, KVRecord } from './kv-record.js';
import { SPFRecord } from './spf-record.js';
import { STSRecord } from './sts-record.js';
import { TXTRecord, TXTRecordKind } from './txt-record.js';

export { BIMIRecord, KVRecord as CustomKVRecord, KV_REGEX, CustomRecord, DKIMRecord, SPFRecord, STSRecord, TXTRecord, TXTRecordKind };

export class TXTQueryResult {
	rawRecords: string[];
	dnsRecords: TXTRecord[] = [];
	public errors: string[] = [];

	constructor(chunks: string[][]) {
		this.rawRecords = chunks.flat();
		this.parse(this.rawRecords);
		this.check();
	}

	private check() {}

	public isValid(): boolean {
		return this.errors.length === 0;
	}

	public getCustomRecords(): CustomRecord[] | null {
		const result: CustomRecord[] = [];
		for (const record of this.dnsRecords) {
			if (record instanceof CustomRecord) {
				result.push(record);
			}
		}
		return result.length > 0 ? result : null;
	}

	public getSingleKVRecord(key: string): KVRecord | null {
		const result: KVRecord[] = [];
		for (const record of this.dnsRecords) {
			if (record instanceof KVRecord) {
				if (record.key === key) {
					result.push(record);
				}
			}
		}
		return result.length > 0 ? result[result.length - 1] : null;
	}

	public getAllKVRecords(): KVRecord[] | null {
		const result: KVRecord[] = [];
		for (const record of this.dnsRecords) {
			if (record instanceof KVRecord) {
				result.push(record);
			}
		}
		return result.length > 0 ? result : null;
	}

	public getSpfRecord(): SPFRecord | null {
		const result: SPFRecord[] = [];
		for (const record of this.dnsRecords) {
			if (record instanceof SPFRecord) {
				result.push(record);
			}
		}
		return result.length > 0 ? result[result.length - 1] : null;
	}

	public getDkimRecord(): DKIMRecord | null {
		const result: DKIMRecord[] = [];
		for (const record of this.dnsRecords) {
			if (record instanceof DKIMRecord) {
				result.push(record);
			}
		}
		return result.length > 0 ? result[result.length - 1] : null;
	}

	public getDmarcRecord(): DMARCRecord | null {
		const result: DMARCRecord[] = [];
		for (const record of this.dnsRecords) {
			if (record instanceof DMARCRecord) {
				result.push(record);
			}
		}
		return result.length > 0 ? result[result.length - 1] : null;
	}

	public getStsRecord(): STSRecord | null {
		const result: STSRecord[] = [];
		for (const record of this.dnsRecords) {
			if (record instanceof STSRecord) {
				result.push(record);
			}
		}
		return result.length > 0 ? result[result.length - 1] : null;
	}

	public getBimiRecord(): BIMIRecord | null {
		const result: BIMIRecord[] = [];
		for (const record of this.dnsRecords) {
			if (record instanceof BIMIRecord) {
				result.push(record);
			}
		}
		return result.length > 0 ? result[result.length - 1] : null;
	}

	public parse(rawRecords: string[]): void {
		for (let rawRecord of rawRecords) {
			rawRecord = rawRecord.trim();
			if (!rawRecord) continue;

			if (rawRecord.startsWith('v=spf')) {
				const record = new SPFRecord(rawRecord);
				this.dnsRecords.push(record);
				return;
			}

			// Check for BIMI record
			if (rawRecord.startsWith('v=BIMI')) {
				const record = new BIMIRecord(rawRecord);
				this.dnsRecords.push(record);
				return;
			}

			// Check for DMARC record
			if (rawRecord.startsWith('v=DMARC')) {
				const record = new DMARCRecord(rawRecord);
				this.dnsRecords.push(record);
				return;
			}

			// Check for MTA-STS record
			if (rawRecord.startsWith('v=STS')) {
				const record = new STSRecord(rawRecord);
				this.dnsRecords.push(record);
				return;
			}

			// Check for DKIM record
			if (rawRecord.includes('p=') && (rawRecord.startsWith('v=DKIM') || rawRecord.includes('k='))) {
				const record = new DKIMRecord(rawRecord);
				this.dnsRecords.push(record);
				return;
			}

			// Custom KV record key=value
			if (KV_REGEX.test(rawRecord)) {
				const record = new KVRecord(rawRecord);
				this.dnsRecords.push(record);
				return;
			}

			const record = new CustomRecord(rawRecord);
			this.dnsRecords.push(record);
		}
	}
}
