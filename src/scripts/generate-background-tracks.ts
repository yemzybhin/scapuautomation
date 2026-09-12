import fs from 'fs';
import path from 'path';

/**
 * Generates original ambient beds for placard videos.
 *
 * These are synthesised here rather than downloaded so the audio is unambiguously
 * ours: a lot of music sold as "royalty free" is still registered in YouTube's
 * Content ID, which would generate claims across an automated channel. Licensed
 * tracks can simply be dropped into public/audio alongside these.
 */

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 24;
const PEAK = 0.6;

type TrackSpec = {
  name: string;
  // Chord roots in Hz, one per bar.
  progression: number[];
  // Relative volumes of root, third/fourth and fifth partials.
  voicing: number[];
  // Slow tremolo rate in Hz.
  drift: number;
  brightness: number;
};

const TRACKS: TrackSpec[] = [
  { name: 'calm-air', progression: [130.81, 146.83, 110.0, 123.47], voicing: [1, 0.55, 0.4], drift: 0.06, brightness: 0.25 },
  { name: 'warm-lift', progression: [174.61, 196.0, 146.83, 164.81], voicing: [1, 0.6, 0.45], drift: 0.09, brightness: 0.35 },
  { name: 'steady-pulse', progression: [98.0, 110.0, 123.47, 110.0], voicing: [1, 0.5, 0.55], drift: 0.14, brightness: 0.3 },
  { name: 'focus-min', progression: [146.83, 146.83, 164.81, 130.81], voicing: [1, 0.35, 0.5], drift: 0.05, brightness: 0.2 },
  { name: 'soft-glow', progression: [110.0, 130.81, 146.83, 164.81], voicing: [1, 0.5, 0.38], drift: 0.08, brightness: 0.28 },
];

const writeWav = (filePath: string, left: Float32Array, right: Float32Array) => {
  const frames = left.length;
  const dataBytes = frames * 2 * 2;
  const buffer = Buffer.alloc(44 + dataBytes);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < frames; i += 1) {
    buffer.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(left[i] * 32767))), 44 + i * 4);
    buffer.writeInt16LE(
      Math.max(-32767, Math.min(32767, Math.round(right[i] * 32767))),
      44 + i * 4 + 2,
    );
  }

  fs.writeFileSync(filePath, buffer);
};

const renderTrack = (spec: TrackSpec) => {
  const frames = SAMPLE_RATE * DURATION_SECONDS;
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  const barSeconds = DURATION_SECONDS / spec.progression.length;

  for (let i = 0; i < frames; i += 1) {
    const time = i / SAMPLE_RATE;
    const barIndex = Math.min(spec.progression.length - 1, Math.floor(time / barSeconds));
    const nextRoot = spec.progression[(barIndex + 1) % spec.progression.length];
    const root = spec.progression[barIndex];
    const positionInBar = (time % barSeconds) / barSeconds;

    // Crossfade between chords so nothing clicks at the bar line.
    const blend = Math.min(1, Math.max(0, (positionInBar - 0.82) / 0.18));

    let sample = 0;

    for (const [partial, weight] of spec.voicing.entries()) {
      const ratio = [1, 1.5, 2][partial];
      const current = Math.sin(2 * Math.PI * root * ratio * time);
      const upcoming = Math.sin(2 * Math.PI * nextRoot * ratio * time);
      const blended = current * (1 - blend) + upcoming * blend;
      // A touch of the octave above adds air without adding edge.
      const air = Math.sin(2 * Math.PI * root * ratio * 2 * time) * spec.brightness * 0.18;

      sample += (blended + air) * weight;
    }

    const tremolo = 0.88 + 0.12 * Math.sin(2 * Math.PI * spec.drift * time);
    const fadeIn = Math.min(1, time / 2.5);
    const fadeOut = Math.min(1, (DURATION_SECONDS - time) / 2.5);
    const envelope = tremolo * fadeIn * fadeOut;
    const value = (sample / spec.voicing.length) * envelope;

    // Slight stereo offset keeps the pad wide rather than centred and flat.
    left[i] = value * 0.98;
    right[i] = value * 0.98 * (0.97 + 0.03 * Math.sin(2 * Math.PI * 0.03 * time));
  }

  let peak = 0;
  for (let i = 0; i < frames; i += 1) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }

  const gain = peak > 0 ? PEAK / peak : 1;
  for (let i = 0; i < frames; i += 1) {
    left[i] *= gain;
    right[i] *= gain;
  }

  return { left, right };
};

const outputDir = path.join(process.cwd(), 'public', 'audio');
fs.mkdirSync(outputDir, { recursive: true });

for (const spec of TRACKS) {
  const { left, right } = renderTrack(spec);
  const filePath = path.join(outputDir, `${spec.name}.wav`);
  writeWav(filePath, left, right);
  console.log('wrote', path.basename(filePath), (fs.statSync(filePath).size / 1024 / 1024).toFixed(2), 'MB');
}
