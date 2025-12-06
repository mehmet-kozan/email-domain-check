import { Address, IPKind, type Target } from './address.js';

export interface MtaStsPolicy {
	version: string;
	mode: 'enforce' | 'testing' | 'none';
	mx: string[];
	max_age: number;
}

export async function getMtaStsPolicy(target: Target, timeoutMs: number = 8000): Promise<MtaStsPolicy | null> {
	const addr = Address.loadFromTarget(target);

	if (addr.ipKind !== IPKind.None) {
		return null;
	}

	try {
		const url = `https://mta-sts.${addr.hostname}/.well-known/mta-sts.txt`;
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'User-Agent': 'email-domain-check',
			},
			signal: AbortSignal.timeout(timeoutMs),
		});

		if (!response.ok) {
			return null;
		}

		const text = await response.text();
		return parseMtaStsPolicy(text);
	} catch {
		return null;
	}
}

export function isMxAllowed(mxHost: string, policy: MtaStsPolicy): boolean {
	return policy.mx.some((pattern) => {
		if (pattern.startsWith('*.')) {
			// Wildcard match: *.example.com
			const suffix = pattern.slice(1); // .example.com
			return mxHost.endsWith(suffix);
		} else {
			// Exact match
			return mxHost === pattern;
		}
	});
}

function parseMtaStsPolicy(policyText: string): MtaStsPolicy | null {
	const lines = policyText
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#'));

	const policy: Partial<MtaStsPolicy> = {
		mx: [],
	};

	for (const line of lines) {
		const [key, value] = line.split(':').map((s) => s.trim());

		if (!key || !value) continue;

		switch (key.toLowerCase()) {
			case 'version':
				policy.version = value;
				break;
			case 'mode':
				if (value === 'enforce' || value === 'testing' || value === 'none') {
					policy.mode = value;
				}
				break;
			case 'mx':
				policy.mx?.push(value);
				break;
			case 'max_age':
				policy.max_age = parseInt(value, 10);
				break;
		}
	}

	if (policy.version && policy.mode && policy.mx && policy.max_age !== undefined) {
		return policy as MtaStsPolicy;
	}

	return null;
}
