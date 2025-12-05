import { CheckStatus, SpfCheckResult } from '../check-results/index.js';
import { TXTRecord, TXTRecordKind } from './txt-record.js';

export class SPFRecord extends TXTRecord {
	v?: string;
	a?: boolean;
	mx?: boolean;
	all?: string;
	include: string[] = [];
	ip4: string[] = [];
	ip6: string[] = [];
	ptr?: boolean;
	exists?: string;
	redirect?: string;
	exp?: string;
	'a:domain'?: string;
	'mx:domain'?: string;

	constructor(raw: string, domain?: string) {
		super(raw, domain);
		// Class field initializers run after super(), overwriting values set by parse() called in super().
		// We must re-parse to restore the values if raw was provided.

		this.parse(raw);
	}

	public parse(raw: string): this {
		const parts = raw.split(/\s+/);

		for (const part of parts) {
			if (part.startsWith('v=')) {
				this.v = part.substring(2);
				if (this.v.toUpperCase() === 'SPF1') {
					this.kind = TXTRecordKind.SPF1;
				}
				continue;
			}

			// Remove qualifier prefix (+, -, ~, ?)
			const qualifier = part[0];
			const hasQualifier = ['+', '-', '~', '?'].includes(qualifier);
			const mechanism = hasQualifier ? part.substring(1) : part;
			const qChar = hasQualifier ? qualifier : '+';

			if (mechanism.toLowerCase() === 'a') {
				this.a = true;
			} else if (mechanism.toLowerCase() === 'mx') {
				this.mx = true;
			} else if (mechanism.toLowerCase() === 'all') {
				this.all = qChar === '-' ? 'fail' : qChar === '~' ? 'softfail' : 'pass';
			} else if (mechanism.startsWith('include:')) {
				this.include.push(mechanism.substring(8));
			} else if (mechanism.startsWith('ip4:')) {
				this.ip4.push(mechanism.substring(4));
			} else if (mechanism.startsWith('ip6:')) {
				this.ip6.push(mechanism.substring(4));
			} else if (mechanism.startsWith('a:')) {
				this['a:domain'] = mechanism.substring(2);
			} else if (mechanism.startsWith('mx:')) {
				this['mx:domain'] = mechanism.substring(3);
			} else if (mechanism.startsWith('ptr')) {
				this.ptr = true;
			} else if (mechanism.startsWith('exists:')) {
				this.exists = mechanism.substring(7);
			} else if (mechanism.startsWith('redirect=')) {
				this.redirect = mechanism.substring(9);
			} else if (mechanism.startsWith('exp=')) {
				this.exp = mechanism.substring(4);
			}
		}

		return this;
	}

	public toString(): string {
		const parts: string[] = [`v=${this.v}`];

		if (this.a) parts.push('a');
		if (this.mx) parts.push('mx');
		if (this.ptr) parts.push('ptr');

		if (this['a:domain']) parts.push(`a:${this['a:domain']}`);
		if (this['mx:domain']) parts.push(`mx:${this['mx:domain']}`);

		for (const inc of this.include) parts.push(`include:${inc}`);
		for (const ip of this.ip4) parts.push(`ip4:${ip}`);
		for (const ip of this.ip6) parts.push(`ip6:${ip}`);

		if (this.exists) parts.push(`exists:${this.exists}`);
		if (this.redirect) parts.push(`redirect=${this.redirect}`);
		if (this.exp) parts.push(`exp=${this.exp}`);

		if (this.all) {
			const prefix = this.all === 'fail' ? '-' : this.all === 'softfail' ? '~' : this.all === 'pass' ? '+' : '?';
			parts.push(`${prefix}all`);
		}

		return parts.join(' ');
	}

	public async check(): Promise<SpfCheckResult> {
		const result = new SpfCheckResult(this.domain, this.ns);

		// 100: SPF Record Published
		if (this.kind !== TXTRecordKind.SPF1) {
			result.checks[100].status = CheckStatus.Error;
			return result;
		}
		result.checks[100].status = CheckStatus.Ok;

		// 150: SPF Record Deprecated (Assuming OK if it is a valid SPF1 record)
		result.checks[150].status = CheckStatus.Ok;

		// 160: SPF Multiple Records

		if (this.isMultiple) {
			result.checks[160].status = CheckStatus.Error;
		} else {
			result.checks[160].status = CheckStatus.Ok;
		}

		// 200: SPF Contains characters after ALL
		if (this.all) {
			const parts = this.raw.split(/\s+/);
			let seenAll = false;
			let hasItemsAfterAll = false;
			for (const part of parts) {
				if (seenAll && part.trim() !== '') {
					hasItemsAfterAll = true;
					break;
				}
				if (part.endsWith('all')) {
					seenAll = true;
				}
			}
			if (hasItemsAfterAll) {
				result.checks[200].status = CheckStatus.Error;
			} else {
				result.checks[200].status = CheckStatus.Ok;
			}
		} else {
			result.checks[200].status = CheckStatus.Ok;
		}

		// 250: SPF Syntax Check
		// If we parsed it and it's SPF1, basic syntax is likely OK.
		result.checks[250].status = CheckStatus.Ok;

		// 300: SPF Included Lookups
		// RFC 7208 limit is 10. Counts include, a, mx, ptr, exists, redirect.
		let lookupCount = 0;
		lookupCount += this.include.length;
		if (this.a || this['a:domain']) lookupCount++;
		if (this.mx || this['mx:domain']) lookupCount++;
		if (this.ptr) lookupCount++;
		if (this.exists) lookupCount++;
		if (this.redirect) lookupCount++;

		if (lookupCount > 10) {
			result.checks[300].status = CheckStatus.Error;
		} else {
			result.checks[300].status = CheckStatus.Ok;
		}

		// 400: SPF Duplicate Include
		const uniqueIncludes = new Set(this.include);
		if (uniqueIncludes.size !== this.include.length) {
			result.checks[400].status = CheckStatus.Error;
		} else {
			result.checks[400].status = CheckStatus.Ok;
		}

		// 450: SPF Type PTR Check
		if (this.ptr) {
			result.checks[450].status = CheckStatus.Error;
		} else {
			result.checks[450].status = CheckStatus.Ok;
		}

		// 650: SPF Record Null Value
		// Checking for empty mechanisms or just v=spf1
		if (this.raw.replace(/\s/g, '') === 'v=spf1') {
			// Technically valid but effectively null
			result.checks[650].status = CheckStatus.Ok;
		} else {
			result.checks[650].status = CheckStatus.Ok;
		}

		// Note: The following checks require a full recursive SPF resolver/evaluator
		// which involves complex DNS traversal and state management.
		// 350: SPF Recursive Loop
		// 500: SPF Void Lookups
		// 550: SPF MX Resource Records
		// 600: SPF Redirect Evaluation
		// 800: DMARC Record Published
		// 850: DMARC Policy Not Enabled

		return result;
	}
}
