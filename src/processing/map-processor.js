
const { promises: fs } = require('fs');

const { loadFolder } = require('./file-utils')

async function processRawData() {
  const chordjack = await loadFolder('data/raw/chordjack');
  const stream = await loadFolder('data/raw/stream');

  let data = [
    ...chordjack.map(e => ({ ...e, type: "chordjack" })),
    ...stream.map(e => ({ ...e, type: "stream" })),
  ]

  await fs.writeFile('data/processed/output.json', JSON.stringify(data, null, 2));

  const minOD = Math.min(...data.map(e => e.overallDifficulty));
  const maxOD = Math.max(...data.map(e => e.overallDifficulty));
  const minHP = Math.min(...data.map(e => e.hpDrain));
  const maxHP = Math.max(...data.map(e => e.hpDrain));
  const minLN = Math.min(...data.map(e => e.lnPercent));
  const maxLN = Math.max(...data.map(e => e.lnPercent));
  const minJack = Math.min(...data.map(e => e.jackPercent));
  const maxJack = Math.max(...data.map(e => e.jackPercent));

  const categories = data.map(e => e.type).filter((e, i, a) => a.indexOf(e) == i);

  const ranges = {
    minOD,
    maxOD,
    minHP,
    maxHP,
    minLN,
    maxLN,
    minJack,
    maxJack,
    categories,
  }

  await fs.writeFile('data/processed/ranges.json', JSON.stringify(ranges, null, 2));

}

module.exports = {
  processRawData,
}