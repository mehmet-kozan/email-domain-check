import forge from 'node-forge';
import { TXTRecord, TXTRecordKind } from './txt-record.js';

interface BimiData {
	locationPath?: string;
	authorityPath?: string;
	locationData: Buffer<ArrayBuffer> | null;
	authorityData: Buffer<ArrayBuffer> | null;
	svgContent?: string;
	pemContent?: string;
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
			this.errors.push('BIMI record is missing required fields: version (v) or location (l).');
			return false;
		}

		const data = await this.downloadBimi();
		if (data.locationData === null) {
			this.errors.push(`Failed to download BIMI SVG image from: ${this.l}`);
			return false;
		}

		// Validate SVG content
		if (!data.svgContent?.includes('<svg') || !data.svgContent?.includes('http://www.w3.org/2000/svg')) {
			this.errors.push('BIMI location does not contain a valid SVG document with the required XML namespace.');
			return false;
		}

		if (this.a && data.authorityData === null) {
			this.errors.push(`Failed to download BIMI authority evidence (VMC) from: ${this.a}`);
			return false;
		}

		if (data.authorityData) {
			return this.validateVmc(data.pemContent);
		}

		return true;
	}

	private validateVmc(pemContent: string | undefined): boolean {
		if (!pemContent?.includes('-----BEGIN CERTIFICATE-----')) {
			this.errors.push('BIMI authority evidence (VMC) is not a valid PEM certificate.');
			return false;
		}

		try {
			const cert = forge.pki.certificateFromPem(pemContent);
			const now = new Date();

			if (now < cert.validity.notBefore || now > cert.validity.notAfter) {
				this.errors.push(`BIMI VMC certificate is expired or not yet valid. Valid from: ${cert.validity.notBefore} to ${cert.validity.notAfter}`);
				return false;
			}

			const vmcExtensionOid = '1.3.6.1.5.5.7.1.12';
			const vmcExtension = cert.extensions.find((ext) => ext.id === vmcExtensionOid);

			if (!vmcExtension) {
				this.errors.push('Certificate is missing the Verified Mark Extension (OID: 1.3.6.1.5.5.7.1.12), so it is not a valid VMC.');
				return false;
			}

			return this.validateLogotypeExtension(vmcExtension.value);
		} catch (error) {
			this.errors.push(`Invalid BIMI VMC certificate: ${(error as Error).message}`);
			return false;
		}
	}

	private validateLogotypeExtension(derValue: string): boolean {
		try {
			const asn1 = forge.asn1.fromDer(derValue);

			if (asn1.type !== forge.asn1.Type.SEQUENCE) {
				this.errors.push('VMC extension is not a valid ASN.1 SEQUENCE.');
				return false;
			}

			if (!Array.isArray(asn1.value)) {
				this.errors.push('VMC extension value is not a constructed type.');
				return false;
			}
			const asn1Value = asn1.value as forge.asn1.Asn1[];

			const subjectLogo = asn1Value.find((val: forge.asn1.Asn1) => val.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && val.type === 2);

			if (!subjectLogo) {
				this.errors.push('VMC extension does not contain a subjectLogo (tag [2]).');
				return false;
			}

			if (!subjectLogo.value || !Array.isArray(subjectLogo.value) || subjectLogo.value.length === 0) {
				this.errors.push('subjectLogo is empty or invalid.');
				return false;
			}

			const logotypeInfo = (subjectLogo.value as forge.asn1.Asn1[])[0];

			if (logotypeInfo.tagClass !== forge.asn1.Class.CONTEXT_SPECIFIC || logotypeInfo.type !== 0) {
				this.errors.push('subjectLogo must be of type direct (tag [0]).');
				return false;
			}

			if (!logotypeInfo.value || !Array.isArray(logotypeInfo.value) || logotypeInfo.value.length === 0) {
				this.errors.push('LogotypeData is empty or invalid.');
				return false;
			}

			const logotypeData = (logotypeInfo.value as forge.asn1.Asn1[])[0];
			if (logotypeData.type !== forge.asn1.Type.SEQUENCE) {
				this.errors.push('LogotypeData must be a SEQUENCE.');
				return false;
			}

			if (!Array.isArray(logotypeData.value)) {
				this.errors.push('LogotypeData value is not a constructed type.');
				return false;
			}
			const logotypeDataValue = logotypeData.value as forge.asn1.Asn1[];

			const imageSeq = logotypeDataValue.find((val: forge.asn1.Asn1) => val.type === forge.asn1.Type.SEQUENCE);

			if (!imageSeq) {
				this.errors.push('LogotypeData does not contain an image sequence.');
				return false;
			}

			if (!Array.isArray(imageSeq.value)) {
				this.errors.push('Image sequence value is not a constructed type.');
				return false;
			}
			const imageSeqValue = imageSeq.value as forge.asn1.Asn1[];

			return this.hasSvgMediaType(imageSeqValue);
		} catch (e) {
			this.errors.push(`Failed to parse VMC extension ASN.1: ${(e as Error).message}`);
			return false;
		}
	}

	private hasSvgMediaType(imageSeqValue: forge.asn1.Asn1[]): boolean {
		for (const logotypeImage of imageSeqValue) {
			if (logotypeImage.type !== forge.asn1.Type.SEQUENCE) continue;
			if (!Array.isArray(logotypeImage.value)) continue;

			const logotypeImageValue = logotypeImage.value as forge.asn1.Asn1[];
			if (logotypeImageValue.length === 0) continue;

			const firstElement = logotypeImageValue[0];
			let mediaType: forge.asn1.Asn1 | undefined;

			if (firstElement.type === forge.asn1.Type.SEQUENCE) {
				if (Array.isArray(firstElement.value) && firstElement.value.length > 0) {
					mediaType = (firstElement.value as forge.asn1.Asn1[])[0];
				}
			} else if (firstElement.type === forge.asn1.Type.IA5STRING) {
				mediaType = firstElement;
			}

			if (mediaType && mediaType.type === forge.asn1.Type.IA5STRING) {
				if (mediaType.value === 'image/svg+xml') {
					return true;
				}
			}
		}

		this.errors.push('VMC subjectLogo does not contain an entry with mediaType "image/svg+xml".');
		return false;
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
