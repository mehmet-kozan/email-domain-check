import forge from 'node-forge';
import { type BimiCheckResult, type CertInfo, CheckStatus } from '../check-results/index.js';
import { RootStore } from './bimi-root-store.js';

export function checkBimiCert(pemContent: string, result: BimiCheckResult): boolean {
	try {
		// 1. Extract all certificates from PEM content (Chain: Leaf -> Intermediate -> Root)
		const pemBlocks = pemContent.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g);

		if (!pemBlocks || pemBlocks.length === 0) {
			result.logs.push('No certificates found in PEM content.');
			result.checks[350].status = CheckStatus.Error;
			return false;
		}

		result.checks[400].status = CheckStatus.Ok;
		const certs = pemBlocks.map((block) => forge.pki.certificateFromPem(block));
		const leafCert = certs[0]; // The first certificate is always the actual VMC (Leaf) certificate

		const isValidExtension = validateCertExtension(leafCert, result.logs);
		if (!isValidExtension) {
			result.checks[450].status = CheckStatus.Error;
			return false;
		}
		result.checks[450].status = CheckStatus.Ok;

		const certInfo = result.setCertInfo(certs);
		const isValidDate = validateCertDate(certInfo);

		if (!isValidDate) {
			result.checks[500].status = CheckStatus.Error;
			return false;
		}
		result.checks[500].status = CheckStatus.Ok;

		// 2. Signature Validation
		if (!validateChainSignature(certs)) {
			result.checks[550].status = CheckStatus.Error;
			return false;
		}

		result.checks[550].status = CheckStatus.Ok;
	} catch (error) {
		result.checks[400].status = CheckStatus.Error;
		result.logs.push(`Invalid BIMI VMC certificate: ${(error as Error).message}`);
		return false;
	}

	return true;
}

function validateChainSignature(certs: forge.pki.Certificate[]): boolean {
	// Get RootStore singleton instance
	const rootStore = RootStore.getInstance();

	// Verify chain (Leaf -> Intermediate -> ... -> Root)
	// RootStore checks if the chain reaches a trusted root using trusted root certificates on disk.
	const isChainValid = rootStore.verifyChain(certs);

	if (!isChainValid) {
		return false;
		// If full chain validation fails (e.g., Root CA missing),
		// let's at least check if the chain within the file (Leaf -> Intermediate) is consistent.
		// This is a "partial" validation but better than nothing.

		// if (certs.length >= 2) {
		// 	const leaf = certs[0];
		// 	const issuer = certs[2];
		// 	try {
		// 		const verified = leaf.verify(issuer);
		// 		if (verified) {
		// 			this.errors.push('Warning: The certificate chain is internally consistent, but it does not chain up to a trusted Root CA in our store.');
		// 			// We return false because full validation failed, but we add the warning above.
		// 			// If you want to consider "self-contained" chains valid, you can set this to true.
		// 			return false;
		// 		}
		// 	} catch (e) {
		// 		debugger;
		// 		// swallow, actual error will be given below
		// 	}
		// }

		// this.errors.push('BIMI VMC certificate chain validation failed. The certificate is not trusted by the known Root CAs.');
		// return false;
	}

	return true;
}

function validateCertDate(info: CertInfo): boolean {
	const now = new Date();

	// from..to
	if (info.validFrom < now && info.validTo > now) {
		return true;
	}

	return false;
}

function validateCertExtension(leafCert: forge.pki.Certificate, logs: string[]): boolean {
	try {
		const vmcExtensionOid = '1.3.6.1.5.5.7.1.12';
		const vmcExtension = leafCert.extensions.find((ext) => ext.id === vmcExtensionOid);
		if (!vmcExtension) {
			logs.push('Certificate is missing the Verified Mark Extension (OID: 1.3.6.1.5.5.7.1.12), so it is not a valid VMC.');
			return false;
		}

		const derValue: string = vmcExtension.value;
		const asn1 = forge.asn1.fromDer(derValue);

		if (asn1.type !== forge.asn1.Type.SEQUENCE) {
			logs.push('VMC extension is not a valid ASN.1 SEQUENCE.');
			return false;
		}

		if (!Array.isArray(asn1.value)) {
			logs.push('VMC extension value is not a constructed type.');
			return false;
		}
		const asn1Value = asn1.value as forge.asn1.Asn1[];

		const subjectLogo = asn1Value.find((val: forge.asn1.Asn1) => val.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && val.type === 2);

		if (!subjectLogo) {
			logs.push('VMC extension does not contain a subjectLogo (tag [2]).');
			return false;
		}

		if (!subjectLogo.value || !Array.isArray(subjectLogo.value) || subjectLogo.value.length === 0) {
			logs.push('subjectLogo is empty or invalid.');
			return false;
		}

		const logotypeInfo = (subjectLogo.value as forge.asn1.Asn1[])[0];

		if (logotypeInfo.tagClass !== forge.asn1.Class.CONTEXT_SPECIFIC || logotypeInfo.type !== 0) {
			logs.push('subjectLogo must be of type direct (tag [0]).');
			return false;
		}

		if (!logotypeInfo.value || !Array.isArray(logotypeInfo.value) || logotypeInfo.value.length === 0) {
			logs.push('LogotypeData is empty or invalid.');
			return false;
		}

		const logotypeData = (logotypeInfo.value as forge.asn1.Asn1[])[0];
		if (logotypeData.type !== forge.asn1.Type.SEQUENCE) {
			logs.push('LogotypeData must be a SEQUENCE.');
			return false;
		}

		if (!Array.isArray(logotypeData.value)) {
			logs.push('LogotypeData value is not a constructed type.');
			return false;
		}
		const logotypeDataValue = logotypeData.value as forge.asn1.Asn1[];

		const imageSeq = logotypeDataValue.find((val: forge.asn1.Asn1) => val.type === forge.asn1.Type.SEQUENCE);

		if (!imageSeq) {
			logs.push('LogotypeData does not contain an image sequence.');
			return false;
		}

		if (!Array.isArray(imageSeq.value)) {
			logs.push('Image sequence value is not a constructed type.');
			return false;
		}
		const imageSeqValue = imageSeq.value as forge.asn1.Asn1[];

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
	} catch {
		return false;
	}

	return false;
}
