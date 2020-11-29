
function parseBeatmap(data) {
  const lines = data.split("\n").map(e => e.trim());

  const getProperty = (name) => (lines.find(e => e.startsWith(name)) || "").slice(name.length);

  const mode = parseInt(getProperty("Mode:"));
  if (mode !== 3) throw new Error("Invalid game mode");

  const title = getProperty("Title:");
  const artist = getProperty("Artist:");
  const creator = getProperty("Creator:");
  const version = getProperty("Version:");
  const beatmapId = getProperty("BeatmapID:");
  const beatmapSetId = getProperty("BeatmapSetID:");
  const overallDifficulty = parseFloat(getProperty("OverallDifficulty:"));
  const hpDrain = parseFloat(getProperty("HPDrainRate:"));
  const keyCount = parseFloat(getProperty("CircleSize:"));

  let objectIndex = lines.indexOf('[HitObjects]');
  let notes = lines
    .filter((e, i) => e != "" && i > objectIndex)
    .map(object => {
      let [x, y, time, type, hitSound, params] = object.split(",");
      x = parseInt(x);
      time = parseInt(time);
      type = parseInt(type);
      let endTime = time;
      let sample;
      let isLN = false;
      if ((type & 128) > 0) {
        isLN = true;
        [endTime, sample] = params.split(":");
        endTime = parseInt(endTime);
      }
      let column = Math.floor(x * keyCount / 512);
      return { time, endTime, column, isLN };
    });

  const lnPercent = notes.filter(e => e.isLN).length / Math.max(1, notes.length);
  const length = notes.length === 0 ? 0 : notes[notes.length - 1].endTime - notes[0].time;

  const metadata = formatMetadata({ artist, title, creator, version });

  let jackPercent = 0;
  {
    const maxDeltas = [];
    for (let i = 0; i < keyCount; i++) {
      let columnNotes = notes.filter(e => e.column == i);
      for (let j = 1; j < columnNotes.length; j++) {
        columnNotes[j].prev = columnNotes[j - 1];
      }
    }

    for (let i = 1; i < notes.length; i++) {
      const delta = Math.max(0, notes[i].time - notes[i - 1].time);
      for (let c = 0; c < keyCount; c++) {
        maxDeltas[c] = Math.max(delta, maxDeltas[c]);
      }

      if (notes[i].prev) {
        const maxDelta = maxDeltas[notes[i].column];
        const deltaColumn = notes[i].time - notes[i].prev.time;
        const emptyRatio = Math.min(1, (maxDelta / deltaColumn));
        notes[i].jackPercent = emptyRatio
      }
      maxDeltas[notes[i].column] = 0;
    }

    const jackNotes = notes.filter(e => Number.isFinite(e.jackPercent));
    if (jackNotes.length > 0) {
      jackPercent = jackNotes.map(e => e.jackPercent).reduce((a, b) => (a + b), 0) / jackNotes.length;
    }
  }


  return {
    metadata,
    title,
    artist,
    creator,
    version,
    beatmapId,
    beatmapSetId,
    overallDifficulty,
    hpDrain,
    keyCount,
    lnPercent,
    jackPercent,
    length,
  };
}

const formatMetadata = ({ artist, title, creator, version }) => `${artist} - ${title} (${creator}) [${version}]`;

module.exports = {
  parseBeatmap,
  formatMetadata,
}