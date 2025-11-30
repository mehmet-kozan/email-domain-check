import { describe, expect, it } from 'vitest';
import { BIMIRecord, TXTRecordKind } from '../../../src/txt-records/index.js';
import { BIMI } from './records.data.js';

describe('BIMIRecord', () => {
	it('parse bimi', () => {
		const bimiObj = new BIMIRecord(BIMI.cnn);
		const raw = bimiObj.toString();

		expect(bimiObj).not.toBeNull();
		expect(bimiObj).instanceOf(BIMIRecord);
		expect(bimiObj.kind).toBe(TXTRecordKind.BIMI1);
		expect(raw.length).toBe(BIMI.cnn.length);

		const bimiRawObj = new BIMIRecord(raw);
		expect(bimiRawObj.toString().length).toBe(bimiObj.toString().length);
		expect(bimiRawObj.kind).toBe(bimiObj.kind);
		expect(bimiRawObj.v).toBe(bimiObj.v);
		expect(bimiRawObj.a).toBe(bimiObj.a);
		expect(bimiRawObj.l).toBe(bimiObj.l);
	});
});
