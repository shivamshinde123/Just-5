const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const DURATION = 1.2;
const BIT_DEPTH = 16;
const NUM_CHANNELS = 1;
const NUM_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

const samples = new Int16Array(NUM_SAMPLES);
const partials = [
  { freq: 880, weight: 1.0, decay: 4.5 },
  { freq: 1320, weight: 0.55, decay: 6.0 },
  { freq: 1760, weight: 0.35, decay: 8.0 },
  { freq: 2640, weight: 0.18, decay: 11.0 },
];
const attackSamples = Math.floor(SAMPLE_RATE * 0.012);

for (let i = 0; i < NUM_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  let value = 0;
  for (const p of partials) {
    value += p.weight * Math.sin(2 * Math.PI * p.freq * t) * Math.exp(-p.decay * t);
  }
  let envelope = 1;
  if (i < attackSamples) envelope = i / attackSamples;
  value *= envelope;
  const clipped = Math.max(-1, Math.min(1, value * 0.5));
  samples[i] = Math.round(clipped * 32767);
}

const dataSize = samples.length * 2;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(NUM_CHANNELS, 22);
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * (BIT_DEPTH / 8), 28);
buffer.writeUInt16LE(NUM_CHANNELS * (BIT_DEPTH / 8), 32);
buffer.writeUInt16LE(BIT_DEPTH, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);
for (let i = 0; i < samples.length; i++) {
  buffer.writeInt16LE(samples[i], 44 + i * 2);
}

const out = path.join(__dirname, '..', 'assets', 'sounds', 'chime.wav');
fs.writeFileSync(out, buffer);
console.log(`Wrote ${buffer.length} bytes to ${out}`);
