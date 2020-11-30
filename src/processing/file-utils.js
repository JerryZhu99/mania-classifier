const crypto = require('crypto');
const { promises: fs, lstatSync } = require('fs');
const path = require('path');
const { parseBeatmap } = require('./parser');

async function loadBeatmap(fileName) {
  const file = await fs.readFile(fileName, { encoding: 'utf-8' });
  const md5 = crypto.createHash('md5')
    .update(file)
    .digest('hex')
    .toString();
  return { ...parseBeatmap(file), md5 };
}

async function loadFolder(folderName) {
  const folder = await fs.readdir(folderName);
  const files = folder.filter(e => e.endsWith('.osu'));
  const results = await Promise.all(files.map(e => loadBeatmap(path.join(folderName, e)).catch(e => (null))));
  return results.filter(e => e != null);
}

async function loadFolderNested(outerFolderName) {
  const outer = (await fs.readdir(outerFolderName)).map(e => path.join(outerFolderName, e));
  const folders = outer.filter(e => lstatSync(e).isDirectory);
  const maps = [];
  for (let folder of folders) {
    maps.push(await loadFolder(folder));
  }
  return [].concat(...maps);
}

module.exports = {
  loadBeatmap,
  loadFolder,
  loadFolderNested,
}