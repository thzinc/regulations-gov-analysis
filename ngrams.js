const getDocuments = require('./getDocuments');
const Tokenizer = require('sentence-tokenizer');
const Ngram = require('node-ngram');
const stemmer = require('stemmer');
const fs = require('fs-extra');
const path = require('path');

async function main() {
    const [_node, _script, requestedDocketId] = process.argv;
    const gen = await getDocuments(requestedDocketId);

    const ngram = new Ngram();
    const ngrams = {
        1: {},
        2: {},
        3: {},
        4: {},
        5: {},
        6: {},
    };
    let i = 0;
    for (let promise of gen) {
        if (i++ == 10000) break;
        const {
            documentType,
            documentId,
            commentText,
        } = await promise;
        if (documentType !== 'Public Submission') continue;

        try {
            const tokenizer = new Tokenizer(documentId, documentId);
            tokenizer.setEntry(commentText);

            tokenizer.getSentences().forEach((sentence, sentenceIndex) => {
                Object.keys(ngrams).forEach(n => {
                    ngram.ngram(sentence, n)
                        .filter(a => a.length == n)
                        .map(a => a.map(stemmer).join(' '))
                        .forEach(ng => {
                            const curr = ngrams[n][ng] || [];
                            curr.push(documentId);
                            ngrams[n][ng] = curr;
                        });
                });
            });
        } catch (err) {
            console.error(`Caught error while processing ${documentId}`, err);
        }
    }
    
    await fs.outputJson(path.join(__dirname, 'dockets', requestedDocketId, 'ngrams.json'), ngrams);
}

main();