import { BIMIRecord } from './bimi-record.js';
import { CustomRecord } from './custom-record.js';
import { DKIMRecord } from './dkim-record.js';
import { DMARCRecord } from './dmarc-record.js';
import { KV_REGEX, KVRecord } from './kv-record.js';
import { SPFRecord } from './spf-record.js';
import { STSRecord } from './sts-record.js';
import { TLSRPTRecord } from './tlsrpt-record.js';
import { TXTRecord, TXTRecordKind } from './txt-record.js';

export { BIMIRecord, KVRecord, CustomRecord, DKIMRecord, SPFRecord, STSRecord, TXTRecord, TXTRecordKind, TLSRPTRecord, DMARCRecord };

export class TXTQueryResult {
	rawRecords: string[];
	dnsRecords: TXTRecord[] = [];
	public errors: string[] = [];

	constructor(chunks: string[][]) {
		this.rawRecords = chunks.flat();
		this.parse(this.rawRecords);
		this.check();
	}

	private check() {
		this.validateSingleRecord(SPFRecord, 'SPF');
		this.validateSingleRecord(DMARCRecord, 'DMARC');
		this.validateSingleRecord(STSRecord, 'MTA-STS');
		this.validateSingleRecord(BIMIRecord, 'BIMI');
		this.validateSingleRecord(TLSRPTRecord, 'TLS-RPT');
		this.validateSingleRecord(DKIMRecord, 'DKIM');
		this.validateSingleKVRecord();
	}

	// biome-ignore lint/suspicious/noExplicitAny: Generic constructor type
	private validateSingleRecord(recordClass: new (...args: any[]) => TXTRecord, name: string) {
		const records: TXTRecord[] = this.dnsRecords.filter((r) => r instanceof recordClass);
		if (records.length > 1) {
			const error = `Multiple ${name} records found. Only one is allowed.`;
			this.errors.push(error);

			for (const record of records) {
				record.errors.push(error);
			}
		}
	}

	private validateSingleKVRecord() {
		const records: KVRecord[] = this.dnsRecords.filter((r) => r instanceof KVRecord);

		const keyCounts = new Map<string, number>();

		for (const record of records) {
			if (record.key) {
				keyCounts.set(record.key, (keyCounts.get(record.key) || 0) + 1);
			}
		}

		for (const [key, count] of keyCounts) {
			if (count > 1) {
				const error = `Multiple records found for key '${key}'. Only one is allowed.`;
				this.errors.push(error);

				for (const record of records) {
					if (record.key === key) {
						record.errors.push(error);
					}
				}
			}
		}
	}

	public isValid(): boolean {
		const hasRecordErrors = this.dnsRecords.some((r) => !r.isValid());
		return this.errors.length === 0 && !hasRecordErrors;
	}

	public getCustomRecords(): CustomRecord[] | null {
		const result: CustomRecord[] = this.dnsRecords.filter((r) => r instanceof CustomRecord);
		return result?.length > 0 ? result : null;
	}

	public getSingleKVRecord(key: string): KVRecord | null {
		const result: KVRecord[] = this.dnsRecords.filter((r) => r instanceof KVRecord && r.key === key);
		return result?.length > 0 ? result[result.length - 1] : null;
	}

	public getAllKVRecords(): KVRecord[] | null {
		const result: KVRecord[] = this.dnsRecords.filter((r) => r instanceof KVRecord);
		return result?.length > 0 ? result : null;
	}

	// Generic helper to reduce code duplication
	// biome-ignore lint/suspicious/noExplicitAny: Generic constructor type
	private getRecord<T extends TXTRecord>(type: new (...args: any[]) => T): T | null {
		const records = this.dnsRecords.filter((r) => r instanceof type) as T[];
		return records.length > 0 ? records[records.length - 1] : null;
	}

	public getSpfRecord(): SPFRecord | null {
		return this.getRecord(SPFRecord);
	}

	public getDkimRecord(): DKIMRecord | null {
		return this.getRecord(DKIMRecord);
	}

	public getDmarcRecord(): DMARCRecord | null {
		return this.getRecord(DMARCRecord);
	}

	public getStsRecord(): STSRecord | null {
		return this.getRecord(STSRecord);
	}

	public getBimiRecord(): BIMIRecord | null {
		return this.getRecord(BIMIRecord);
	}

	public getTLSRPTRecord(): TLSRPTRecord | null {
		return this.getRecord(TLSRPTRecord);
	}

	public parse(rawRecords: string[]): void {
		for (let rawRecord of rawRecords) {
			rawRecord = rawRecord.trim();
			if (!rawRecord) continue;

			// Normalize for case-insensitive checking
			const upperRecord = rawRecord.toUpperCase();

			if (upperRecord.startsWith('V=SPF')) {
				const record = new SPFRecord(rawRecord);
				this.dnsRecords.push(record);
				continue;
			}

			// Check for BIMI record
			if (upperRecord.startsWith('V=BIMI')) {
				const record = new BIMIRecord(rawRecord);
				this.dnsRecords.push(record);
				continue;
			}

			// Check for DMARC record
			if (upperRecord.startsWith('V=DMARC')) {
				const record = new DMARCRecord(rawRecord);
				this.dnsRecords.push(record);
				continue;
			}

			// Check for MTA-STS record
			if (upperRecord.startsWith('V=STS')) {
				const record = new STSRecord(rawRecord);
				this.dnsRecords.push(record);
				continue;
			}

			// Check for TLSRPT record
			if (upperRecord.startsWith('V=TLSRPT')) {
				const record = new TLSRPTRecord(rawRecord);
				this.dnsRecords.push(record);
				continue;
			}

			// Check for DKIM record
			if (upperRecord.includes('P=') && (upperRecord.startsWith('V=DKIM') || upperRecord.includes('K='))) {
				const record = new DKIMRecord(rawRecord);
				this.dnsRecords.push(record);
				continue;
			}

			// Custom KV record key=value
			if (KV_REGEX.test(rawRecord)) {
				const record = new KVRecord(rawRecord);
				this.dnsRecords.push(record);
				continue;
			}

			const record = new CustomRecord(rawRecord);
			this.dnsRecords.push(record);
		}
	}
}
