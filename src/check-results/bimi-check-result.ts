import forge from 'node-forge';
import { type CertInfo, CheckResult, CheckStatus } from './check-result.js';

export class BimiCheckResult extends CheckResult {
	version?: string;
	locations?: Array<string>;
	authorities?: string;
	certInfo?: CertInfo;

	checks = {
		100: {
			code: 100,
			test: 'BIMI Record Published',
			statusOk: 'BIMI Record found',
			statusProblem: 'BIMI Record not found',
			status: CheckStatus.None,
		},
		150: {
			code: 150,
			test: 'BIMI Syntax Check',
			statusOk: 'The Record is Valid',
			statusProblem: 'The Record is Invalid',
			status: CheckStatus.None,
		},
		160: {
			code: 160,
			test: 'BIMI Location Extension',
			statusOk: 'BIMI Location is Valid.',
			statusProblem: 'BIMI Location is Invalid.',
			status: CheckStatus.None,
		},
		200: {
			code: 200,
			test: 'BIMI Download Image',
			statusOk: 'BIMI SVG image downloaded successfully',
			statusProblem: 'Failed to download BIMI SVG image',
			status: CheckStatus.None,
		},
		250: {
			code: 250,
			test: 'BIMI Image Format',
			statusOk: 'BIMI Image Format Correct',
			statusProblem: 'BIMI Image Format Incorrect',
			status: CheckStatus.None,
		},
		300: {
			code: 300,
			test: 'BIMI Download Certificate',
			statusOk: 'BIMI certificate downloaded successfully',
			statusProblem: 'Failed to download BIMI certificate',
			status: CheckStatus.None,
		},
		350: {
			code: 350,
			test: 'BIMI Certificate Syntax Check',
			statusOk: 'The Record is Valid',
			statusProblem: 'The Record is Invalid',
			status: CheckStatus.None,
		},
		400: {
			code: 400,
			test: 'BIMI Certificate Authority',
			statusOk: 'The certificate is valid',
			statusProblem: 'The certificate is invalid',
			status: CheckStatus.None,
		},
		450: {
			code: 450,
			test: 'BIMI Logo Validation',
			statusOk: 'BIMI Logo Validation Valid',
			statusProblem: 'BIMI Logo Validation Failed',
			status: CheckStatus.None,
		},
		500: {
			code: 500,
			test: 'BIMI Certificate Expiration',
			statusOk: 'The certificate is not expired.',
			statusProblem: 'The certificate is expired.',
			status: CheckStatus.None,
		},
		550: {
			code: 550,
			test: 'BIMI Certificate Issuer',
			statusOk: 'The Certificate is issued by a recognized MVA',
			statusProblem: 'The Certificate is not issued by a recognized MVA',
			status: CheckStatus.None,
		},
		800: {
			code: 800,
			test: 'DMARC Record Published BIMI Required',
			statusOk: 'DMARC Record found - Valid for BIMI',
			statusProblem: 'DMARC Record not found - Invalid for BIMI',
			status: CheckStatus.None,
		},
		850: {
			code: 850,
			test: 'DMARC Policy Not Enabled BIMI Required',
			statusOk: 'DMARC Quarantine/Reject policy enabled - Valid for BIMI',
			statusProblem:
				'DMARC Quarantine/Reject policy not enabled - Invalid for BIMI',
			status: CheckStatus.None,
		},
	};

	public setCertInfo(certs: forge.pki.Certificate[]): CertInfo {
		const leaf = certs[0];

		let maxValidFrom = leaf.validity.notBefore;
		let minValidTo = leaf.validity.notAfter;

		for (const cert of certs) {
			if (cert.validity.notBefore > maxValidFrom) {
				maxValidFrom = cert.validity.notBefore;
			}
			if (cert.validity.notAfter < minValidTo) {
				minValidTo = cert.validity.notAfter;
			}
		}

		this.certInfo = {
			subject: leaf.subject.attributes,
			issuer: leaf.issuer.attributes,
			validFrom: maxValidFrom,
			validTo: minValidTo,
			serial: leaf.serialNumber,
			algorithm: forge.pki.oids[leaf.signatureOid] || leaf.signatureOid,
		};

		return this.certInfo;
	}

	public isValid(): boolean {
		const keys = Object.keys(this.checks)
			.map((k) => Number.parseInt(k, 10))
			.sort((a, b) => a - b);

		for (const key of keys) {
			const check = this.checks[key as keyof typeof this.checks];
			if (check.status === CheckStatus.Error) {
				return false;
			}
		}

		return true;
	}
}
