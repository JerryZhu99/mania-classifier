const tf = require('@tensorflow/tfjs-node');

const { processRawData } = require('./src/processing/map-processor');
const { trainModel, loadTrainingDataRanges } = require('./src/modeling/train');

const { loadBeatmap, loadFolderNested } = require('./src/processing/file-utils');
const { normalizeFn } = require('./src/modeling/utils');
const { range } = require('@tensorflow/tfjs-node');
const { writeCollectionDB } = require('./src/processing/collections');

const args = process.argv.slice(2);

(async () => {
  let process = args.includes('-p');
  let train = args.includes('-t');
  let load = args.includes('-l');
  let save = args.includes('-s');
  let file = args.includes('-f');
  let directory = args.includes('-d');
  let model = null;

  if (process) {
    console.log('Beginning Raw Data Processing');
    await processRawData();
    console.log('Completed Raw Data Processing');
  }

  if (load) {
    console.log('Loading Model');
    model = await tf.loadLayersModel('file://model/model.json')
    console.log('Loaded Model');
  }

  if (train) {
    console.log('Beginning Model Training');
    model = await trainModel();
    console.log('Completed Model Training');
  }

  if (save) {
    console.log('Saving Model');
    await model.save('file://model');
    console.log('Saved Model');
  }

  if (file) {
    const map = await loadBeatmap(args[args.indexOf('-f') + 1])
    const ranges = await loadTrainingDataRanges();
    const normalizedData = normalizeFn(ranges)(map)['xs']
    const prediction = model.predict(tf.tensor(normalizedData, [1, ranges.attributes.length]));
    const result = await prediction.array();
    for (let i in ranges.categories) {
      const category = ranges.categories[i];
      const probability = result[0][i].toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 });
      console.log(`${category}: ${probability}`);
    }
  }

  if (directory) {
    const maps = await loadFolderNested(args[args.indexOf('-d') + 1]);
    const ranges = await loadTrainingDataRanges();
    const normalizedData = maps.map(e => normalizeFn(ranges)(e)['xs'])
    const prediction = await model.predict(tf.tensor(normalizedData, [maps.length, ranges.attributes.length])).array();

    const collections = ranges.categories.map((name) => ({
      name: 'ml - ' + name,
      hashes: [],
    }))

    for (let i = 0; i < maps.length; i++) {
      const map = maps[i];
      const probabilities = prediction[i];
      const maxProb = Math.max(...probabilities);
      const categoryIndex = probabilities.indexOf(maxProb)
      if (categoryIndex == -1) {
        console.error(map.metadata);
        console.error(probabilities)
        continue;
      }
      const category = ranges.categories[categoryIndex];
      console.log(`${map.metadata}: ${category}`);

      collections[categoryIndex].hashes.push(map.md5);
    }
    console.log(collections)
    writeCollectionDB(collections)
  }

})();

