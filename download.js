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
    let count = 0;
    do {
        let page;
        for (let remainingTries = 3; remainingTries > 0; remainingTries -= 1) {
            const url = `${baseUrl}/documents.json?api_key=${apiKey}&dktid=${docketId}&sb=docId&so=ASC&rpp=${resultsPerPage}&po=${pageNum * resultsPerPage}`;
            try {
                const response = await fetch(url);
                page = await response.json();
                break;
            }
            catch (err) {
                console.error(`(Remaining retries: ${remainingTries}) Error requesting ${url}: ${err}`);
            }
        }

        if (!page.documents || !page.documents.length) break;

        await Promise.all(page.documents
            .map(document =>
                fs.outputJson(path.join(__dirname, 'dockets', docketId, 'documents', `${document.documentId}.json`), document)));

        count += page.documents.length;
        console.info(`Retrieved ${page.documents.length} documents. (${count} of ${page.totalNumRecords})`)

        pageNum += 1;
    } while (true);
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
    await fs.outputJson(path.join(__dirname, 'dockets', docket.docketId, `${docket.docketId}.json`), docket);
    await getDocuments(apiKey, requestedDocketId);
}

main();