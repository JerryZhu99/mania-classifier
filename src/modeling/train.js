

const tf = require('@tensorflow/tfjs-node');

const { promises: fs } = require('fs')

const { normalizeFn } = require('./utils')


async function loadTrainingData() {
  return JSON.parse(await fs.readFile('data/processed/output.json'));
}

async function loadTrainingDataRanges() {
  return JSON.parse(await fs.readFile('data/processed/ranges.json'));
}

async function trainModel() {
  const data = await loadTrainingData();
  const ranges = await loadTrainingDataRanges();

  const categories = ranges.categories;
  const numClasses = categories.length;

  const transform = normalizeFn(ranges);

  const trainingData = await tf.data.array(data)
    .map(transform)
    .shuffle(data.length)
    .batch(100);

  const trainingValidationData = tf.data.array(data)
    .map(transform)
    .batch(data.length);


  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 250, activation: 'relu', inputShape: [4] }));
  model.add(tf.layers.dense({ units: 175, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 150, activation: 'relu' }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(),
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy']
  });


  function calcClassEval(classIndex, classSize, values) {
    let index = (classIndex * classSize * numClasses) + classIndex;
    let total = 0;
    for (let i = 0; i < classSize; i++) {
      total += values[index];
      index += numClasses;
    }
    return total / classSize;
  }



  async function evaluate(useTestData) {
    const results = {};
    await trainingValidationData.forEachAsync(pitchTypeBatch => {
      const values = model.predict(pitchTypeBatch.xs).dataSync();
      const classSize = data.length / numClasses;
      for (let i = 0; i < numClasses; i++) {
        results[categories[i]] = {
          training: calcClassEval(i, classSize, values)
        };
      }
    });
    return results;
  }


  const TIMEOUT_BETWEEN_EPOCHS_MS = 500;
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  let numTrainingIterations = 40;
  for (var i = 0; i < numTrainingIterations; i++) {
    console.log(`Training iteration : ${i + 1} / ${numTrainingIterations}`);
    await model.fitDataset(trainingData, { epochs: 1 });
    console.log('accuracyPerClass', await evaluate());
    await sleep(TIMEOUT_BETWEEN_EPOCHS_MS);
  }

  return model;
}

module.exports = {
  loadTrainingData,
  loadTrainingDataRanges,
  trainModel,
}