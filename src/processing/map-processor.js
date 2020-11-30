
const { promises: fs } = require('fs');

const { loadFolder } = require('./file-utils')

async function processRawData() {
  const chordjack = await loadFolder('data/raw/chordjack');
  const stream = await loadFolder('data/raw/stream');
  const jumpstream = await loadFolder('data/raw/jumpstream');
  const longjack = await loadFolder('data/raw/longjack');
  const minijack = await loadFolder('data/raw/minijack');
  const vibro = await loadFolder('data/raw/vibro');
  const lnInverse = await loadFolder('data/raw/ln_inverse');
  const lnRelease = await loadFolder('data/raw/ln_release');
  const lnTech = await loadFolder('data/raw/ln_tech');
  const lnGeneric = await loadFolder('data/raw/ln_generic');

  let data = [
    ...chordjack.map(e => ({ ...e, type: "chordjack" })),
    ...stream.map(e => ({ ...e, type: "stream" })),
    ...jumpstream.map(e => ({ ...e, type: "jumpstream" })),
    ...longjack.map(e => ({ ...e, type: "longjack" })),
    ...minijack.map(e => ({ ...e, type: "minijack" })),
    ...vibro.map(e => ({ ...e, type: "vibro" })),
    ...lnInverse.map(e => ({ ...e, type: "ln_inverse" })),
    ...lnRelease.map(e => ({ ...e, type: "ln_release" })),
    ...lnTech.map(e => ({ ...e, type: "ln_mixed" })),
    ...lnGeneric.map(e => ({ ...e, type: "ln_mixed" })),
  ]

  await fs.writeFile('data/processed/output.json', JSON.stringify(data, null, 2));

  const attributeNames = [
    'overallDifficulty',
    'hpDrain',
    'length',
    'noteCount',
    'noteDensity',
    'chordDensity',
    'lnPercent',
    'jackPercent',
    'pureJackPercent',
    'chord1Percent',
    'chord2Percent',
    'chord3Percent',
    'chord4Percent',
  ]

  const attributes = attributeNames.map(e => ({
    name: e,
    min: Math.min(...data.map(map => map[e])),
    max: Math.max(...data.map(map => map[e])),
  }));

  const categories = data.map(e => e.type).filter((e, i, a) => a.indexOf(e) == i);

  const ranges = {
    attributes,
    categories,
  }

  await fs.writeFile('data/processed/ranges.json', JSON.stringify(ranges, null, 2));

}

module.exports = {
  processRawData,
}