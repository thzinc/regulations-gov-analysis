const fs = require('fs-extra');
const path = require('path');
const sentiment = require('sentiment');
const Tokenizer = require('sentence-tokenizer');
const converter = require('json-2-csv');

function getDocuments(docketId) {
    const documentsPath = path.join(__dirname, 'dockets', docketId, 'documents');
    return fs.readdir(documentsPath)
        .then(filenames => filenames.map(filename => path.join(documentsPath, filename)))
        .then(function* (files) {
            for (let i = 0; i < files.length; i += 1) {
                yield fs.readJson(files[i]);
            }
        });
}

async function main() {
    const [_node, _script, requestedDocketId] = process.argv;
    const gen = await getDocuments(requestedDocketId);

    const analyses = [];
    for (let promise of gen) {
        const {
            documentType,
            documentId,
            commentText,
        } = await promise;
        if (documentType !== 'Public Submission') continue;

        try {
            const tokenizer = new Tokenizer(documentId, documentId);
            tokenizer.setEntry(commentText);

            const analysis = tokenizer.getSentences().map((sentence, sentenceIndex) => {
                const { score, comparative } = sentiment(sentence);

                return {
                    documentId,
                    sentenceIndex,
                    sentence,
                    sentiment: {
                        score,
                        comparative,
                    },
                };
            });

            analyses.push(...analysis);
        } catch (err) {
            console.error(`Caught error while processing ${documentId}`, err);
        }
    }
    
    await fs.outputJson(path.join(__dirname, 'dockets', requestedDocketId, 'analysis.json'), analyses);
}

main();