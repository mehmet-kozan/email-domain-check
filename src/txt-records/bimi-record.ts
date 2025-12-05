import { BimiCheckResult, CheckStatus } from '../check-results/index.js';
import { checkBimiCert } from './bimi-cert-check.js';
import { checkBimiSvg } from './bimi-svg-check.js';
import { TXTRecord, TXTRecordKind } from './txt-record.js';

export interface BimiData {
	locationPath?: string;
	authorityPath?: string;
	locationData: Buffer<ArrayBuffer> | null;
	authorityData: Buffer<ArrayBuffer> | null;
	svgContent?: string;
	pemContent?: string;
}

export class BIMIRecord extends TXTRecord {
	//Version, Identifies the record retrieved as a BIMI record. It must be the first tag in the record.
	v?: string;
	// Locations(logo url), Comma separated list of base URLs representing the location of the brand indicator files.
	l?: string;
	// Trust Authorities(certificate url), Optional Validation Information for verifying bimi locations.
	a?: string;

	constructor(raw: string, domain?: string, ns?: Array<string>) {
		super(raw, domain, ns);

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

	public async check(): Promise<BimiCheckResult> {
		const result = new BimiCheckResult(this.domain, this.ns);

		if (this.kind !== TXTRecordKind.BIMI1) {
			result.checks[100].status = CheckStatus.Error;
			return result;
		}
		result.checks[100].status = CheckStatus.Ok;
		result.version = this.v;

		if (!this.v || !this.l) {
			result.logs.push('BIMI record is missing required fields: version (v) or location (l).');
			result.checks[150].status = CheckStatus.Error;
			return result;
		}
		result.checks[150].status = CheckStatus.Ok;
		result.locations = [this.l];

		// Check if location URL ends with .svg
		try {
			const url = new URL(this.l);
			if (!url.pathname.toLowerCase().endsWith('.svg')) {
				result.logs.push('BIMI location URL must end with .svg extension.');
				result.checks[160].status = CheckStatus.Error;
				return result;
			}
			result.checks[160].status = CheckStatus.Ok;
		} catch {
			result.logs.push('Invalid BIMI location URL.');
			result.checks[160].status = CheckStatus.Error;
			return result;
		}

		const data = await this.downloadBimi();
		if (data.locationData === null) {
			result.logs.push(`Failed to download BIMI SVG image from: ${this.l}`);
			result.checks[200].status = CheckStatus.Error;
			return result;
		}
		result.checks[200].status = CheckStatus.Ok;

		const isSVGValid = checkBimiSvg(data.locationData);

		if (isSVGValid) {
			result.checks[250].status = CheckStatus.Ok;
		} else {
			result.checks[250].status = CheckStatus.Error;
		}

		if (this.a) {
			result.authorities = this.a;
			if (data.authorityData && data.pemContent) {
				result.checks[300].status = CheckStatus.Ok;

				checkBimiCert(data.pemContent, result);
				return result;
				//return this.validateVmc(data.pemContent, result);
			} else {
				result.logs.push(`Failed to download BIMI authority evidence (VMC) from: ${this.a}`);
				result.checks[300].status = CheckStatus.Error;
				return result;
			}
		}

		return result;
	}

	public async downloadBimi(): Promise<BimiData> {
		const result: BimiData = {
			locationPath: this.l,
			authorityPath: this.a,
			locationData: await this.downloadBuffer(this.l),
			authorityData: await this.downloadBuffer(this.a),
		};

		if (result.locationData) {
			result.svgContent = result.locationData.toString('utf-8');
		}

		if (result.authorityData) {
			result.pemContent = result.authorityData.toString('utf-8');
		}

		return result;
	}
}
