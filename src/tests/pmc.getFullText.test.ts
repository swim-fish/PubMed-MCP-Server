import test from 'node:test';
import assert from 'node:assert/strict';
import { PMCClient } from '../api/pmc.js';
import { normalizePMCID, parseXML } from '../api/utils.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';


const SAMPLE_PMCID = 'PMC8401147';

test('getFullText returns article metadata and body', { timeout: 30000 }, async () => {
    const client = new PMCClient(process.env.NCBI_API_KEY);

    const xmlData = await fs.readFile(path.join(process.cwd(), 'src', 'tests', 'data', `${SAMPLE_PMCID}.xml`), 'utf-8');

    // parse the XML data
    const parsedData = await parseXML(xmlData);
    const article = client.parseFullTextArticle(parsedData, SAMPLE_PMCID);

    // assertions
    const expectedPMCID = normalizePMCID(SAMPLE_PMCID);
    assert.equal(article.pmcid, expectedPMCID);
    assert.ok(article.title.length > 0, 'title should be populated');
    assert.ok(article.authors.length >= 0, 'authors array should exist');
});
