import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('SZABLONY STRON/RENDER/HERO KLIP.mov');
const buf = fs.readFileSync(filePath);

console.log('File size:', buf.length, 'bytes');

const stsd = buf.indexOf(Buffer.from('stsd'));
if (stsd !== -1) {
  // stsd box structure: 4 bytes size, 4 bytes 'stsd', 4 bytes version/flags, 4 bytes entry count, then sample entry
  // sample entry: 4 bytes size, 4 bytes format (codec)
  const codec = buf.slice(stsd + 12, stsd + 16).toString('utf8');
  console.log('Codec:', codec);
}

const mvhd = buf.indexOf(Buffer.from('mvhd'));
if (mvhd !== -1) {
  const version = buf.readUInt8(mvhd + 4);
  const timescale = version === 0 ? buf.readUInt32BE(mvhd + 16) : buf.readUInt32BE(mvhd + 24);
  const duration = version === 0 ? buf.readUInt32BE(mvhd + 20) : Number(buf.readBigUInt64BE(mvhd + 28));
  console.log('Timescale:', timescale, 'Duration (ticks):', duration, 'Duration (s):', duration / timescale);
}

// Check tracks
let pos = 0;
while (pos < buf.length - 8) {
  const boxSize = buf.readUInt32BE(pos);
  const boxType = buf.slice(pos + 4, pos + 8).toString('latin1');
  if (boxSize < 8) break;
  if (boxType === 'moov') {
    console.log('Found moov at offset', pos, 'length', boxSize);
  }
  pos += boxSize;
}
