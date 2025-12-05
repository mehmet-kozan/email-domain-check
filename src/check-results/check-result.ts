import type forge from 'node-forge';

export enum CheckStatus {
	None = 0,
	Ok = 1,
	Error = 2,
	Warn = 3,
}

export interface CheckTest {
	code: number;
	test: string;
	statusOk: string;
	statusProblem: string;
	status: CheckStatus;
}

export type CertInfo = {
	subject: forge.pki.CertificateField[];
	issuer: forge.pki.CertificateField[];
	validFrom: Date;
	validTo: Date;
	serial: string;
	algorithm: string;
};

export abstract class CheckResult {
	public domain?: string;
	public abstract checks: Record<number, CheckTest>;
	public ns?: Array<string>;
	public checkDate: Date;
	public logs: string[] = [];

	constructor(domain?: string, ns?: Array<string>) {
		this.domain = domain;
		this.checkDate = new Date();
		this.ns = ns;
	}
}
