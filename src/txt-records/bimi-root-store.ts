import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import forge from 'node-forge';

export class RootStore {
	private static instance: RootStore;
	public caStore: forge.pki.CAStore;

	private constructor() {
		this.caStore = forge.pki.createCaStore();
		this.loadCertificatesFromDisk();
	}

	public static getInstance(): RootStore {
		if (!RootStore.instance) {
			RootStore.instance = new RootStore();
		}
		return RootStore.instance;
	}

	private getDirname(): string {
		// Hem CJS hem ESM uyumlu __dirname tanımlaması
		let _dirname: string;
		try {
			// CommonJS ortamında __dirname mevcuttur
			_dirname = __dirname;
		} catch {
			// ESM ortamında __dirname yoktur.
			// TypeScript CJS target ile derlenirken 'import.meta' kullanımına izin vermez.
			// Bu yüzden runtime'da çalışması için new Function hilesi kullanıyoruz.
			const metaUrl = new Function('return import.meta.url')();
			_dirname = path.dirname(fileURLToPath(metaUrl));
		}

		return _dirname;
	}

	/**
	 * Klasördeki tüm .pem dosyalarını okur ve CA Store'a ekler.
	 */
	private loadCertificatesFromDisk() {
		try {
			const _dirname = this.getDirname();
			const _root_certs = path.join(_dirname, '../../root-certs');
			const files = fs.readdirSync(_root_certs);
			const pemFiles = files.filter((file) => file.endsWith('.pem'));

			for (const file of pemFiles) {
				if (file.startsWith('_')) continue;
				const filePath = path.join(_root_certs, file);
				const pemContent = fs.readFileSync(filePath, 'utf-8');
				this.addCertificate(pemContent, file);
			}

			if (pemFiles.length === 0) {
				console.warn(`RootStore: No .pem files found in ${_dirname}`);
			} else {
				//console.log(`RootStore: Loaded ${pemFiles.length} root certificates.`);
			}
		} catch (error) {
			console.error('RootStore: Failed to load certificates from disk.', error);
		}
	}

	public addCertificate(pemContent: string, sourceName: string = 'unknown') {
		try {
			// PEM içeriğinden sertifikayı parse et
			const cert = forge.pki.certificateFromPem(pemContent);
			this.caStore.addCertificate(cert);
		} catch (error) {
			console.error(`RootStore: Failed to parse certificate from ${sourceName}:`, error);
		}
	}

	/**
	 * Verilen sertifika zincirini (Leaf -> Intermediate -> ... -> Root) doğrular.
	 * @param chain Doğrulanacak sertifika zinciri (forge.pki.Certificate dizisi)
	 */
	public verifyChain(chain: forge.pki.Certificate[]): boolean {
		try {
			// forge.pki.verifyCertificateChain, CAStore'u kullanarak zinciri doğrular.
			// Zincir [Leaf, Intermediate, ...] sırasında olmalıdır.
			return forge.pki.verifyCertificateChain(this.caStore, chain);
		} catch (error) {
			console.error('Sertifika zinciri doğrulama hatası:', error);
			return false;
		}
	}
}
