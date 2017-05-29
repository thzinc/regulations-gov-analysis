const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs-extra');
const baseUrl = 'https://api.data.gov/regulations/v3';

async function getDocket(apiKey, docketId) {
    const response = await fetch(`${baseUrl}/docket.json?api_key=${apiKey}&docketId=${docketId}`, { method: 'GET' });
    const docket = await response.json();
    return docket;
}

async function getDocuments(apiKey, docketId) {
    const resultsPerPage = 1000;
    let pageNum = 0;
    let documents = [];
    do {
        const response = await fetch(`${baseUrl}/documents.json?api_key=${apiKey}&dktid=${docketId}&sb=docId&so=ASC&rpp=${resultsPerPage}&po=${pageNum * resultsPerPage}`);
        const page = await response.json();

        if (!page.documents || !page.documents.length) break;

        documents = [...documents, ...page.documents];
        console.info(`Retrieved ${page.documents.length} documents. (${documents.length} of ${page.totalNumRecords})`)

        pageNum += 1;
    } while (true);

    return documents;
}

async function main() {
    const apiKey = process.env.REGULATIONS_GOV_API_KEY;
    if (!apiKey) {
        console.error('REGULATIONS_GOV_API_KEY environment key must be specified!');
        return;
    }

    const [_node, _script, requestedDocketId] = process.argv;
    if (!requestedDocketId) {
        console.error('Docket ID must be specified as command-line argument');
        return;
    }

    console.info(`Retrieving docket ${requestedDocketId}...`);

    const docket = await getDocket(apiKey, requestedDocketId);
    const documents = await getDocuments(apiKey, requestedDocketId);
    await fs.outputJson(path.join(__dirname, 'dockets', docket.docketId, `${docket.docketId}.json`), docket);
    await Promise.all(documents.map(document => fs.outputJson(path.join(__dirname, 'dockets', docket.docketId, 'documents', `${document.documentId}.json`), document)));
}

main();