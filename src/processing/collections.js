
const { promises: fs } = require('fs');

const encodeULEB = (value) => {
  let bytes = [];
  do {
    let byte = 0b01111111 & value;
    value >>= 7;
    if (value != 0) /* more bytes to come */
      byte |= 0b10000000;
    bytes.push(byte);
  } while (value != 0);
  return Buffer.from(bytes);
}

const encodeString = (str) => {
  return Buffer.concat([Buffer.from([0x0b]), encodeULEB(str.length), Buffer.from(str)]);
}

const encodeInteger = (val) => {
  let buf = Buffer.alloc(4);
  buf.writeUInt32LE(val, 0);
  return buf;
}

async function writeCollectionDB(collections) {
  const version = encodeInteger(20201126);
  const count = encodeInteger(collections.length);

  let data = Buffer.concat([
    version,
    count,
    ...collections.map(({ name, hashes }) => Buffer.concat([
      encodeString(name),
      encodeInteger(hashes.length),
      ...hashes.map(encodeString),
    ]))
  ]);

  fs.writeFile('output/collections.db', data, "binary");
}

module.exports = {
  writeCollectionDB,
}