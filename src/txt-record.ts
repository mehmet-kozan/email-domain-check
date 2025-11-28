export enum RecordKind {
	Custom = 0,
	CustomKV = 1,
	SPF1 = 2,
	DKIM1 = 3,
	DMARC1 = 4,
	STSv1 = 5,
	BIMI1 = 6,
}

export interface CustomRecord {
	raw: string;
	errors: string[];
	value: string;
}

export interface BIMIRecord {
	raw: string;
	errors: string[];
	v: string;
	l?: string; // location (logo url)
	a?: string; // authority (certificate url)
	[key: string]: string | string[] | undefined;
}

export interface SPF1Record {
	raw: string;
	errors: string[];
	v: string;
	a?: boolean;
	mx?: boolean;
	all?: string;
	include?: string[];
	ip4?: string[];
	ip6?: string[];
	ptr?: boolean;
	exists?: string;
	redirect?: string;
	exp?: string;
	'a:domain'?: string;
	'mx:domain'?: string;
	[key: string]: string | string[] | boolean | number | undefined;
}

export interface DMARC1Record {
	raw: string;
	errors: string[];
	v: string;
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
	[key: string]: string | string[] | number | undefined;
}

export interface DKIM1Record {
	raw: string;
	errors: string[];
	v?: string;
	k?: string;
	p?: string;
	h?: string[];
	s?: string[];
	t?: string[];
	n?: string;
	[key: string]: string | string[] | undefined;
}

export interface STSv1Record {
	raw: string;
	errors: string[];
	v: string;
	id: string;
	[key: string]: string | string[] | undefined;
}

export interface CustomKVRecord {
	raw: string;
	errors: string[];
	key: string;
	value: string;
}

export class TXTResult {
	public records: TXTRecord[] = [];

	public getCustomRecords(): CustomRecord[] | null {
		let result: CustomRecord[] | null = null;

		for (const record of this.records) {
			if (record.kind === RecordKind.Custom) {
				result = result ?? [];
				result.push(record.parsed as CustomRecord);
			}
		}

		return result;
	}

	public getBIMI(): BIMIRecord | null {
		let result: BIMIRecord | null = null;
		let count = 0;

		for (const record of this.records) {
			if (record.kind === RecordKind.BIMI1) {
				count++;
				result = record.parsed as BIMIRecord;
			}
		}

		if (count > 1 && result !== null) {
			result.errors.push(`Multiple BIMI records.`);
		}

		return result;
	}

	public getSPF(): SPF1Record | null {
		let result: SPF1Record | null = null;
		let count = 0;

		for (const record of this.records) {
			if (record.kind === RecordKind.SPF1) {
				count++;
				result = record.parsed as SPF1Record;
			}
		}

		if (count > 1 && result !== null) {
			result.errors.push(`Multiple spf records.`);
		}

		return result;
	}

	public getDMARC(): DMARC1Record | null {
		let result: DMARC1Record | null = null;
		let count = 0;

		for (const record of this.records) {
			if (record.kind === RecordKind.DMARC1) {
				count++;
				result = record.parsed as DMARC1Record;
			}
		}

		if (count > 1 && result !== null) {
			result.errors.push(`Multiple DMARC records.`);
		}

		return result;
	}

	public getDKIM(): DKIM1Record | null {
		let result: DKIM1Record | null = null;
		let count = 0;

		for (const record of this.records) {
			if (record.kind === RecordKind.DKIM1) {
				count++;
				result = record.parsed as DKIM1Record;
			}
		}

		if (count > 1 && result !== null) {
			result.errors.push(`Multiple DKIM records.`);
		}

		return result;
	}

	public getSTS(): STSv1Record | null {
		let result: STSv1Record | null = null;
		let count = 0;

		for (const record of this.records) {
			if (record.kind === RecordKind.STSv1) {
				count++;
				result = record.parsed as STSv1Record;
			}
		}

		if (count > 1 && result !== null) {
			result.errors.push(`Multiple MTA-STS records.`);
		}

		return result;
	}

	public getCustomKVRecord(key?: string): CustomKVRecord | null {
		let result: CustomKVRecord[] | null = null;

		for (const record of this.records) {
			if (record.kind === RecordKind.CustomKV) {
				const parsed = record.parsed as CustomKVRecord;

				if (parsed.key === key) {
					result = result ?? [];
					result.push(parsed);
				}
			}
		}

		if (result !== null && result.length > 1) {
			result[0].errors.push(`Multiple unique key.`);
		}

		return result ? result[0] : null;
	}

	public getAllKVRecord(): CustomKVRecord[] | null {
		let result: CustomKVRecord[] | null = null;

		for (const record of this.records) {
			if (record.kind === RecordKind.CustomKV) {
				const parsed = record.parsed as CustomKVRecord;

				result = result ?? [];
				result.push(parsed);
			}
		}

		return result;
	}
}

export class TXTRecord {
	public raw: string;
	public kind: RecordKind;
	public parsed: CustomRecord | SPF1Record | DMARC1Record | DKIM1Record | STSv1Record | CustomKVRecord | BIMIRecord | null = null;

	constructor(raw: string) {
		this.raw = raw;
		this.kind = RecordKind.Custom;
		this.parse();
	}

	private parse(): void {
		// Check for SPF record
		if (this.raw.startsWith('v=spf1')) {
			this.kind = RecordKind.SPF1;
			this.parsed = this.parseSPF1(this.raw);
			return;
		}

		// Check for BIMI record
		if (this.raw.startsWith('v=BIMI1')) {
			this.kind = RecordKind.BIMI1;
			this.parsed = this.parseBIMI1(this.raw);
			return;
		}

		// Check for DMARC record
		if (this.raw.startsWith('v=DMARC1')) {
			this.kind = RecordKind.DMARC1;
			this.parsed = this.parseDMARC1(this.raw);
			return;
		}

		// Check for DKIM record
		if (this.raw.includes('p=') && (this.raw.startsWith('v=DKIM1') || this.raw.includes('k='))) {
			this.kind = RecordKind.DKIM1;
			this.parsed = this.parseDKIM1(this.raw);
			return;
		}

		// Check for MTA-STS record
		if (this.raw.startsWith('v=STSv1')) {
			this.kind = RecordKind.STSv1;
			this.parsed = this.parseSTSv1(this.raw);
			return;
		}

		// Check for key=value format
		const keyValueMatch = this.raw.match(/^([^=]+)=(.+)$/);
		if (keyValueMatch) {
			this.kind = RecordKind.CustomKV;
			this.parsed = {
				raw: this.raw,
				errors: [],
				key: keyValueMatch[1].trim(),
				value: keyValueMatch[2].trim(),
			} as CustomKVRecord;
			return;
		}

		this.kind = RecordKind.Custom;
		this.parsed = {
			raw: this.raw,
			errors: [],
			value: this.raw,
		} as CustomRecord;
	}

	public parseSPF1(raw: string): SPF1Record {
		const spf: SPF1Record = {
			raw: raw,
			errors: [],
			valid: raw.length > 0,
			v: 'spf1',
		};

		if (raw.length < 8) {
			spf.errors.push('Raw record empty.');
		}

		const parts = raw.split(/\s+/);

		for (const part of parts) {
			if (part.startsWith('v=')) {
				spf.v = part.substring(2);
				continue;
			}

			// Remove qualifier prefix (+, -, ~, ?)
			const qualifier = part[0];
			const hasQualifier = ['+', '-', '~', '?'].includes(qualifier);
			const mechanism = hasQualifier ? part.substring(1) : part;
			const qChar = hasQualifier ? qualifier : '+';

			if (mechanism.toLowerCase() === 'a') {
				spf.a = true;
			} else if (mechanism.toLowerCase() === 'mx') {
				spf.mx = true;
			} else if (mechanism.toLowerCase() === 'all') {
				spf.all = qChar === '-' ? 'fail' : qChar === '~' ? 'softfail' : 'pass';
			} else if (mechanism.startsWith('include:')) {
				spf.include = spf.include || [];
				spf.include.push(mechanism.substring(8));
			} else if (mechanism.startsWith('ip4:')) {
				spf.ip4 = spf.ip4 || [];
				spf.ip4.push(mechanism.substring(4));
			} else if (mechanism.startsWith('ip6:')) {
				spf.ip6 = spf.ip6 || [];
				spf.ip6.push(mechanism.substring(4));
			} else if (mechanism.startsWith('a:')) {
				spf['a:domain'] = mechanism.substring(2);
			} else if (mechanism.startsWith('mx:')) {
				spf['mx:domain'] = mechanism.substring(3);
			} else if (mechanism.startsWith('ptr')) {
				spf.ptr = true;
			} else if (mechanism.startsWith('exists:')) {
				spf.exists = mechanism.substring(7);
			} else if (mechanism.startsWith('redirect=')) {
				spf.redirect = mechanism.substring(9);
			} else if (mechanism.startsWith('exp=')) {
				spf.exp = mechanism.substring(4);
			}
		}

		return spf;
	}

	public parseBIMI1(raw: string): BIMIRecord {
		const bimi: BIMIRecord = {
			raw: raw,
			errors: [],
			v: 'BIMI1',
		};

		const parts = raw
			.split(';')
			.map((p) => p.trim())
			.filter((p) => p);

		for (const part of parts) {
			const [key, value] = part.split('=').map((s) => s.trim());
			if (!key || !value) continue;

			switch (key.toLowerCase()) {
				case 'v':
					bimi.v = value;
					break;
				case 'l':
					bimi.l = value; // Logo URL
					break;
				case 'a':
					bimi.a = value; // Authority Evidence (VMC URL)
					break;
				default:
					bimi[key] = value;
			}
		}
		return bimi;
	}

	public parseDMARC1(raw: string): DMARC1Record {
		const dmarc: DMARC1Record = {
			raw: raw,
			errors: [],
			v: 'DMARC1',
		};

		const parts = raw
			.split(';')
			.map((p) => p.trim())
			.filter((p) => p);

		for (const part of parts) {
			const [key, value] = part.split('=').map((s) => s.trim());
			if (!key || !value) continue;

			switch (key.toLowerCase()) {
				case 'v':
					dmarc.v = value;
					break;
				case 'p':
					dmarc.p = value; // none, quarantine, reject
					break;
				case 'sp':
					dmarc.sp = value; // subdomain policy
					break;
				case 'rua':
					dmarc.rua = value.split(',').map((s) => s.trim());
					break;
				case 'ruf':
					dmarc.ruf = value.split(',').map((s) => s.trim());
					break;
				case 'pct':
					dmarc.pct = parseInt(value, 10);
					break;
				case 'adkim':
					dmarc.adkim = value; // r or s
					break;
				case 'aspf':
					dmarc.aspf = value; // r or s
					break;
				case 'ri':
					dmarc.ri = parseInt(value, 10);
					break;
				case 'fo':
					dmarc.fo = value.split(':').map((s) => s.trim());
					break;
				case 'rf':
					dmarc.rf = value;
					break;
				default:
					dmarc[key] = value;
			}
		}
		return dmarc;
	}

	public parseDKIM1(raw: string): DKIM1Record {
		const dkim: DKIM1Record = {
			raw: raw,
			errors: [],
		};

		const parts = raw
			.split(';')
			.map((p) => p.trim())
			.filter((p) => p);

		for (const part of parts) {
			const [key, value] = part.split('=').map((s) => s.trim());
			if (!key || !value) continue;

			switch (key.toLowerCase()) {
				case 'v':
					dkim.v = value;
					break;
				case 'k':
					dkim.k = value; // key type (rsa, ed25519)
					break;
				case 'p':
					dkim.p = value; // public key
					break;
				case 'h':
					dkim.h = value.split(':').map((s) => s.trim()); // hash algorithms
					break;
				case 's':
					dkim.s = value.split(':').map((s) => s.trim()); // service types
					break;
				case 't':
					dkim.t = value.split(':').map((s) => s.trim()); // flags
					break;
				case 'n':
					dkim.n = value; // notes
					break;
				default:
					dkim[key] = value;
			}
		}
		return dkim;
	}

	public parseSTSv1(raw: string): STSv1Record {
		const sts: STSv1Record = {
			raw: raw,
			errors: [],
			v: 'STSv1',
			id: '',
		};

		const parts = raw
			.split(';')
			.map((p) => p.trim())
			.filter((p) => p);

		for (const part of parts) {
			const [key, value] = part.split('=').map((s) => s.trim());
			if (!key || !value) continue;

			switch (key.toLowerCase()) {
				case 'v':
					sts.v = value; // STSv1
					break;
				case 'id':
					sts.id = value; // unique identifier (timestamp/version)
					break;
				default:
					sts[key] = value;
			}
		}
		return sts;
	}

	public isValid(): boolean {
		return this.raw.length > 0;
	}

	public toString(): string {
		return this.raw;
	}
}
