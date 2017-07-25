const fs = require('fs-extra');
const path = require('path');
const stemmer = require('stemmer');
const Ngram = require('node-ngram');

const ngram = new Ngram();
const eo13792Review = [
    'Basin and Range',
    'Bears Ears',
    'Berryessa Snow Mountain',
    'Canyons of the Ancients',
    'Carrizo Plain',
    'Cascade Siskiyou',
    'Craters of the Moon',
    'Giant Sequoia',
    'Gold Butte',
    'Grand Canyon-Parashant',
    'Grand Staircase-Escalante',
    'Hanford Reach',
    'Ironwood Forest',
    'Mojave Trails',
    'Organ Mountains-Desert Peaks',
    'Rio Grande del Norte',
    'Sand to Snow',
    'San Gabriel Mountains',
    'Sonoran Desert',
    'Upper Missouri River Breaks',
    'Vermilion Cliffs',
]
    .map(s => ngram.ngram(s, 1)
        .map(stemmer)
        .join(' '))
    .reduce((o, k) => {
        o[k] = 1;
        return o;
    }, {});

const nmReview = [
    'Katahadin Woods and Waters',
]
    .map(s => ngram.ngram(s, 1)
        .map(stemmer)
        .join(' '))
    .reduce((o, k) => {
        o[k] = 1;
        return o;
    }, {});

const eo13795Review = [
    'Marianas Trench',
    'Northeast Canyons and Seamounts',
    'Pacific Remote Islands',
    'Papahanaumokuakea',
    'Rose Atoll',
]
    .map(s => ngram.ngram(s, 1)
        .map(stemmer)
        .join(' '))
    .reduce((o, k) => {
        o[k] = 1;
        return o;
    }, {});

async function main() {
    const [_node, _script, requestedDocketId] = process.argv;
    const filename = path.join(__dirname, 'dockets', requestedDocketId, 'ngrams.json');
    const ngrams = await fs.readJson(filename);

    Object.keys(ngrams).forEach(n => {
        const ngs = ngrams[n];
        const sorted = Object.keys(ngs)
            .map(word => ({
                word,
                count: ngs[word].length,
            }))
            .sort((a, b) => a.count > b.count ? -1 : 1);
        
        console.info(`Top ${n}-grams:\n`);
        sorted
            .slice(0, 10)
            .map((item, rank) => `${rank + 1}. ${item.word} (count: ${item.count})`)
            .forEach(s => console.info(s));
        console.info('');
        console.info(`Top ${n}-gram mentions:\n`);
        sorted
            .filter(item => eo13792Review[item.word]
                || nmReview[item.word]
                || eo13795Review[item.word])
            .map((item, rank) => `${rank + 1}. ${item.word} (count: ${item.count})`)
            .forEach(s => console.info(s));
        console.info('');
    });
}

main();

