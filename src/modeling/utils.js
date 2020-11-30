


// util function to normalize a value between a given range.
function normalize(value, min, max) {
  if (min === undefined || max === undefined) {
    return value;
  }
  return (value - min) / (max - min);
}


function normalizeFn(ranges) {
  const { attributes, categories } = ranges

  const transform = (e) => {
    const values = attributes.map(attr => (
      normalize(e[attr.name], attr.min, attr.max)
    ));
    return { xs: values, ys: categories.indexOf(e.type) };
  }
  return transform
}

module.exports = {
  normalizeFn,
}