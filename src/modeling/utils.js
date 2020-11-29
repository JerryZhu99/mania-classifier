


// util function to normalize a value between a given range.
function normalize(value, min, max) {
  if (min === undefined || max === undefined) {
    return value;
  }
  return (value - min) / (max - min);
}


function normalizeFn(ranges) {
  const { minOD, maxOD, minHP, maxHP, minLN, maxLN, minJack, maxJack, categories } = ranges

  const transform = (e) => {
    const values = [
      normalize(e.overallDifficulty, minOD, maxOD),
      normalize(e.hpDrain, minHP, maxHP),
      normalize(e.lnPercent, minLN, maxLN),
      normalize(e.jackPercent, minJack, maxJack),
    ];
    return { xs: values, ys: categories.indexOf(e.type) };
  }
  return transform
}

module.exports = {
  normalizeFn,
}