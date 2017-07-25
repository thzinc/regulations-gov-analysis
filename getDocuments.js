const fs = require('fs-extra');
const path = require('path');

module.exports = function getDocuments(docketId) {
    const documentsPath = path.join(__dirname, 'dockets', docketId, 'documents');
    return fs.readdir(documentsPath)
        .then(filenames => filenames.map(filename => path.join(documentsPath, filename)))
        .then(function* (files) {
            for (let i = 0; i < files.length; i += 1) {
                yield fs.readJson(files[i]);
            }
        });
}
