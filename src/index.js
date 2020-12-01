const tf = require('@tensorflow/tfjs');

const { parseBeatmap } = require('./processing/parser');
const { normalizeFn } = require('./modeling/utils');

const ranges = require('../data/processed/ranges.json');

async function init() {
  const MODEL_URL = 'model/model.json';

  const model = await tf.loadLayersModel(MODEL_URL);

  const form = document.getElementById('form');
  const fileInput = document.getElementById('file-input');
  const resetButton = document.getElementById('reset');
  const output = document.getElementById('output');
  const outputTable = document.getElementById('output-table');

  form.addEventListener('reset', () => {
    output.innerHTML = '';
    outputTable.innerHTML = '';
  })

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = async function (evt) {
        try {
          output.innerHTML = 'Processing File...';
          const map = await parseBeatmap(evt.target.result);
          const normalizedData = normalizeFn(ranges)(map)['xs']
          const prediction = model.predict(tf.tensor(normalizedData, [1, ranges.attributes.length]));
          const [probabilities] = await prediction.array();

          const maxProb = Math.max(...probabilities);
          const categoryIndex = probabilities.indexOf(maxProb);
          output.innerHTML = 'Type: ' + ranges.categories[categoryIndex];

          const formatPercent = e => e.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 });

          const items = ranges.categories.map((name, i) => ({
            name,
            prob: probabilities[i],
            formattedProb: formatPercent(probabilities[i]),
          }));

          items.sort((a, b) => b.prob - a.prob);

          outputTable.innerHTML = `<tr><th>Category</th><th>Probability</th></tr>`
            + items.map(({ name, formattedProb }) => `<tr><td>${name}</td><td align='right'>${formattedProb}</td></tr>`).join('');
        } catch (e) {
          console.error(e);
          output.innerHTML = 'Error Processing File';
        }
      }


      reader.onerror = function (evt) {
        output.innerHTML = 'Error Reading File';
      }
    }
  });

}

init();