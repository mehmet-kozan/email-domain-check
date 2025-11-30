import { describe, expect, it } from 'vitest';
import { BIMIRecord } from '../../src/txt-records/bimi-record.js';
import { BIMI } from './records.data.js';

describe('getDkimRecord', () => {
	it('parse bimi', () => {
		const bimi = new BIMIRecord(BIMI.cnn);
		const raw = bimi.toString();
		expect(bimi).not.toBeNull();
		expect(raw.length).toBe(BIMI.cnn.length);
	});
});
