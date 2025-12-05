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
	domain?: string;
	ns?: string[];
	rawRecords: string[];
	dnsRecords: TXTRecord[] = [];

	constructor(chunks: string[][], domain?: string, ns?: string[]) {
		this.domain = domain;
		this.ns = ns;
		this.rawRecords = chunks.flat();
		this.parse(this.rawRecords);
		this.check();
	}

	private check() {
		//Multiple records found. Only one is allowed.
		this.validateSingleRecord();
		this.validateSingleKVRecord();
	}

	private validateSingleRecord() {
		const keyCounts = new Map<string, number>();
		for (const record of this.dnsRecords) {
			record.allRecords = this.dnsRecords;
			if (record instanceof KVRecord) continue;
			if (record instanceof CustomRecord) continue;

			// Use the constructor name (e.g., 'SPFRecord', 'DMARCRecord') as the key
			// or use a specific property if you want to group by content.
			// To get the string representation: record.toString() or record.raw
			const key = record.constructor.name;
			keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
		}

		// Logic to mark multiples as errors
		for (const [key, count] of keyCounts) {
			if (count > 1) {
				for (const record of this.dnsRecords) {
					if (record.constructor.name === key) {
						record.isMultiple = true;
					}
				}
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
				for (const record of records) {
					if (record.key === key) {
						record.isMultiple = true;
					}
				}
			}
		}
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

	public getSpfRecord(): SPFRecord | null {
		const records = this.dnsRecords.filter((r) => r instanceof SPFRecord) as SPFRecord[];
		return records.length > 0 ? records[records.length - 1] : null;
	}

	public getDkimRecord(): DKIMRecord | null {
		const records = this.dnsRecords.filter((r) => r instanceof DKIMRecord) as DKIMRecord[];
		return records.length > 0 ? records[records.length - 1] : null;
	}

	public getDmarcRecord(): DMARCRecord | null {
		const records = this.dnsRecords.filter((r) => r instanceof DMARCRecord) as DMARCRecord[];
		return records.length > 0 ? records[records.length - 1] : null;
	}

	public getStsRecord(): STSRecord | null {
		const records = this.dnsRecords.filter((r) => r instanceof STSRecord) as STSRecord[];
		return records.length > 0 ? records[records.length - 1] : null;
	}

	public getBimiRecord(): BIMIRecord | null {
		const records = this.dnsRecords.filter((r) => r instanceof BIMIRecord) as BIMIRecord[];
		return records.length > 0 ? records[records.length - 1] : null;
	}

	public getTLSRPTRecord(): TLSRPTRecord | null {
		const records = this.dnsRecords.filter((r) => r instanceof TLSRPTRecord) as TLSRPTRecord[];
		return records.length > 0 ? records[records.length - 1] : null;
	}

	public parse(rawRecords: string[]): void {
		for (let rawRecord of rawRecords) {
			rawRecord = rawRecord.trim();
			if (!rawRecord) continue;

			// Normalize for case-insensitive checking
			const upperRecord = rawRecord.toUpperCase();

			if (upperRecord.startsWith('V=SPF')) {
				const record = new SPFRecord(rawRecord, this.domain);
				this.dnsRecords.push(record);
				continue;
			}

			// Check for BIMI record
			if (upperRecord.startsWith('V=BIMI')) {
				const record = new BIMIRecord(rawRecord, this.domain, this.ns);
				this.dnsRecords.push(record);
				continue;
			}

			// Check for DMARC record
			if (upperRecord.startsWith('V=DMARC')) {
				const record = new DMARCRecord(rawRecord, this.domain);
				this.dnsRecords.push(record);
				continue;
			}

			// Check for MTA-STS record
			if (upperRecord.startsWith('V=STS')) {
				const record = new STSRecord(rawRecord, this.domain);
				this.dnsRecords.push(record);
				continue;
			}

			// Check for TLSRPT record
			if (upperRecord.startsWith('V=TLSRPT')) {
				const record = new TLSRPTRecord(rawRecord, this.domain);
				this.dnsRecords.push(record);
				continue;
			}

			// Check for DKIM record
			if (upperRecord.includes('P=') && (upperRecord.startsWith('V=DKIM') || upperRecord.includes('K='))) {
				const record = new DKIMRecord(rawRecord, this.domain);
				this.dnsRecords.push(record);
				continue;
			}

			// Custom KV record key=value
			if (KV_REGEX.test(rawRecord)) {
				const record = new KVRecord(rawRecord, this.domain);
				this.dnsRecords.push(record);
				continue;
			}

			const record = new CustomRecord(rawRecord, this.domain);
			this.dnsRecords.push(record);
		}
	}
}
