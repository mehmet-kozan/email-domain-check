import { CheckResult, CheckStatus } from './check-result.js';

export class SpfCheckResult extends CheckResult {
	checks = {
		100: {
			code: 100,
			test: 'SPF Record Published',
			statusOk: 'SPF Record found',
			statusProblem: 'SPF Record not found',
			status: CheckStatus.None,
		},
		150: {
			code: 150,
			test: 'SPF Record Deprecated',
			statusOk: 'No deprecated records found',
			statusProblem: 'Deprecated SPF records found',
			status: CheckStatus.None,
		},
		160: {
			code: 160,
			test: 'SPF Multiple Records',
			statusOk: 'Less than two records found',
			statusProblem: 'Multiple SPF records found',
			status: CheckStatus.None,
		},
		200: {
			code: 200,
			test: 'SPF Contains characters after ALL',
			statusOk: "No items after 'ALL'.",
			statusProblem: "There are items after 'ALL'.",
			status: CheckStatus.None,
		},
		250: {
			code: 250,
			test: 'SPF Syntax Check',
			statusOk: 'The record is valid',
			statusProblem: 'The record is invalid',
			status: CheckStatus.None,
		},
		300: {
			code: 300,
			test: 'SPF Included Lookups',
			statusOk: 'Number of included lookups is OK',
			statusProblem: 'Too many included lookups',
			status: CheckStatus.None,
		},
		350: {
			code: 350,
			test: 'SPF Recursive Loop',
			statusOk: 'No Recursive Loops on Includes',
			statusProblem: 'Recursive loop detected in includes',
			status: CheckStatus.None,
		},
		400: {
			code: 400,
			test: 'SPF Duplicate Include',
			statusOk: 'No Duplicate Includes Found',
			statusProblem: 'Duplicate includes found',
			status: CheckStatus.None,
		},
		450: {
			code: 450,
			test: 'SPF Type PTR Check',
			statusOk: 'No type PTR found',
			statusProblem: 'Type PTR records found',
			status: CheckStatus.None,
		},
		500: {
			code: 500,
			test: 'SPF Void Lookups',
			statusOk: 'Number of void lookups is OK',
			statusProblem: 'Excessive void lookups found',
			status: CheckStatus.None,
		},
		550: {
			code: 550,
			test: 'SPF MX Resource Records',
			statusOk: 'Number of MX Resource Records is OK',
			statusProblem: 'MX Resource Records count is not OK',
			status: CheckStatus.None,
		},
		600: {
			code: 600,
			test: 'SPF Redirect Evaluation',
			statusOk: 'Redirect Domain has a valid SPF Record',
			statusProblem: 'Redirect Domain has no valid SPF Record',
			status: CheckStatus.None,
		},
		650: {
			code: 650,
			test: 'SPF Record Null Value',
			statusOk: 'No Null DNS Lookups found',
			statusProblem: 'Null DNS Lookups found',
			status: CheckStatus.None,
		},
		800: {
			code: 800,
			test: 'DMARC Record Published',
			statusOk: 'DMARC Record found',
			statusProblem: 'DMARC Record not found',
			status: CheckStatus.None,
		},
		850: {
			code: 850,
			test: 'DMARC Policy Not Enabled',
			statusOk: 'DMARC Quarantine/Reject policy enabled',
			statusProblem: 'DMARC policy not set to quarantine/reject',
			status: CheckStatus.None,
		},
	};

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
