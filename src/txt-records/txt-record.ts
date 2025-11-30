export enum TXTRecordKind {
	None = 0,
	Custom = 1,
	KV = 2,
	SPF1 = 20,
	DKIM1 = 30,
	DMARC1 = 40,
	STSv1 = 50,
	BIMI1 = 60,
	TLSRPTv1 = 70,
}

export abstract class TXTRecord {
	public domain?: string;
	public raw: string;
	public errors: string[] = [];
	public kind: TXTRecordKind;

	// Index signature to allow dynamic properties (tags) and methods
	// biome-ignore lint/suspicious/noExplicitAny: <base record type>
	[key: string]: any;

	protected knownKeys: string[] = ['domain', 'raw', 'errors', 'kind', 'knownKeys'];

	constructor(raw: string, domain?: string) {
		this.domain = domain;
		this.raw = raw;
		this.kind = TXTRecordKind.None;
	}

	/**
	 * Parses the raw DNS record string and assigns it to object properties.
	 */
	public abstract parse(raw: string): this;

	/**
	 * Reconstructs the DNS record string from object properties.
	 */
	public abstract toString(): string;

	/**
	 * Checks if the record is valid (basic check).
	 * Subclasses can override this.
	 */
	public async isValid(): Promise<boolean> {
		return this.errors.length === 0 && this.kind !== TXTRecordKind.None;
	}

	protected async downloadText(url?: string, timeout: number = 8000): Promise<string | null> {
		if (!url) return null;
		const result = await this.download(url, true, timeout);
		if (typeof result === 'string') {
			return result;
		}
		return null;
	}

	protected async downloadBuffer(url?: string, timeout: number = 8000): Promise<Buffer<ArrayBuffer> | null> {
		if (!url) return null;
		const result = await this.download(url, false, timeout);
		if (typeof result !== 'string') {
			return result;
		}
		return null;
	}

	private async download(url: string, text: boolean, timeout: number): Promise<Buffer<ArrayBuffer> | string | null> {
		try {
			const urlObjs = new URL(url);
			const response = await fetch(urlObjs, {
				method: 'GET',
				// TODO AKAMAI does some strange UA based filtering that messes up the request
				headers: {
					//'User-Agent': 'email-domain-check',
				},
				signal: AbortSignal.timeout(timeout),
			});

			if (!response.ok) {
				return null;
			}

			if (text) {
				return response.text();
			}

			const buffer = await response.arrayBuffer();
			return Buffer.from(buffer);
		} catch {
			return null;
		}
	}
}
