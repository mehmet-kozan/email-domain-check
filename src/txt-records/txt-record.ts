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
	public raw?: string;
	public errors: string[] = [];
	public kind: TXTRecordKind;

	// Index signature to allow dynamic properties (tags) and methods
	// biome-ignore lint/suspicious/noExplicitAny: <base record type>
	[key: string]: any;

	protected knownKeys: string[] = ['raw', 'errors', 'kind', 'knownKeys'];

	constructor(raw?: string) {
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
	public isValid(): boolean {
		return this.errors.length === 0 && this.kind !== TXTRecordKind.None;
	}
}
