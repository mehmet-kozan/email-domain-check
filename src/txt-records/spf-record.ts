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

	public parse(raw: string): this {
		this.raw = raw;

		const parts = raw.split(/\s+/);

		for (const part of parts) {
			if (part.startsWith('v=')) {
				this.v = part.substring(2).toLowerCase();
				if (this.v === 'spf1') {
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
}
