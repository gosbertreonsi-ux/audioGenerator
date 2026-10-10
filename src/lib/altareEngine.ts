// Project Altare-Builder: Future Bass / Wave / Trap Automated Remix Engine
// Synthesizes the signature "Altare" production aesthetic:
// - 140-150 BPM Future Bass / Hybrid Trap rhythmic grid
// - Ethereal low-pass filtered Reese bass & ambient cinematic string pads
// - Escalating snare rolls & white noise risers
// - Aggressive sidechained supersaws & punchy 808 sub-bass drops
// - Automated melodic vocal chop loop generator from isolated user vocal stem
// - Brickwall mastering limiter targeting -9 LUFS

export interface AltareRemixConfig {
  tempo: 140 | 145 | 150;
  key: 'A Minor' | 'F Minor' | 'C Minor' | 'D Minor' | 'E Minor' | 'G Minor';
  progression: string;
  energy: number; // 0.0 (Chill Wave) to 1.0 (Heavy Festival Trap)
  vocalPitchShift: -12 | 0 | 12; // semitones (Deep Formant, Normal, Nightcore)
  vocalChopDensity: 'sparse' | 'rhythmic' | 'rapid';
  sidechainDepth: number; // 0.0 to 1.0
  reeseCutoff: number; // 80 to 450 Hz
  distortionDrive: number; // 0.0 to 1.0
  muteOriginalBeat: boolean;
  muteOriginalWords: boolean;
  masterLoudnessTarget: number; // -9 LUFS
}

export const DEFAULT_ALTARE_CONFIG: AltareRemixConfig = {
  tempo: 145,
  key: 'A Minor',
  progression: 'i - VI - III - VII (Altare Signature Anthem)',
  energy: 0.85,
  vocalPitchShift: 0,
  vocalChopDensity: 'rhythmic',
  sidechainDepth: 0.88,
  reeseCutoff: 220,
  distortionDrive: 0.45,
  muteOriginalBeat: true,
  muteOriginalWords: false,
  masterLoudnessTarget: -9,
};

// Root frequencies for minor keys (Hz)
export const ALTARE_KEY_NOTES: Record<string, { root: number; chords: number[][] }> = {
  'A Minor': {
    root: 220.0, // A3
    // i (Am), VI (F), III (C), VII (G)
    chords: [
      [220.0, 261.63, 329.63, 440.0, 523.25], // Am (A3, C4, E4, A4, C5)
      [174.61, 220.0, 261.63, 349.23, 440.0],  // F (F3, A3, C4, F4, A4)
      [130.81, 196.0, 261.63, 329.63, 392.0],  // C (C3, G3, C4, E4, G4)
      [196.0, 246.94, 293.66, 392.0, 493.88]   // G (G3, B3, D4, G4, B4)
    ]
  },
  'F Minor': {
    root: 174.61, // F3
    // i (Fm), VI (Db), III (Ab), VII (Eb)
    chords: [
      [174.61, 207.65, 261.63, 349.23, 415.30],
      [138.59, 174.61, 207.65, 277.18, 349.23],
      [207.65, 261.63, 311.13, 415.30, 523.25],
      [155.56, 196.0, 233.08, 311.13, 392.0]
    ]
  },
  'C Minor': {
    root: 130.81, // C3
    // i (Cm), VI (Ab), III (Eb), VII (Bb)
    chords: [
      [130.81, 155.56, 196.0, 261.63, 311.13],
      [207.65, 261.63, 311.13, 415.30, 523.25],
      [155.56, 196.0, 233.08, 311.13, 392.0],
      [116.54, 146.83, 174.61, 233.08, 293.66]
    ]
  },
  'D Minor': {
    root: 146.83, // D3
    // i (Dm), VI (Bb), III (F), VII (C)
    chords: [
      [146.83, 174.61, 220.0, 293.66, 349.23],
      [116.54, 146.83, 174.61, 233.08, 293.66],
      [174.61, 220.0, 261.63, 349.23, 440.0],
      [130.81, 164.81, 196.0, 261.63, 329.63]
    ]
  },
  'E Minor': {
    root: 164.81, // E3
    // i (Em), VI (C), III (G), VII (D)
    chords: [
      [164.81, 196.0, 246.94, 329.63, 392.0],
      [130.81, 164.81, 196.0, 261.63, 329.63],
      [196.0, 246.94, 293.66, 392.0, 493.88],
      [146.83, 185.0, 220.0, 293.66, 370.0]
    ]
  },
  'G Minor': {
    root: 196.0, // G3
    // i (Gm), VI (Eb), III (Bb), VII (F)
    chords: [
      [196.0, 233.08, 293.66, 392.0, 466.16],
      [155.56, 196.0, 233.08, 311.13, 392.0],
      [116.54, 146.83, 174.61, 233.08, 293.66],
      [174.61, 220.0, 261.63, 349.23, 440.0]
    ]
  }
};

export class AltareEngine {
  private static cachedBuffer: AudioBuffer | null = null;
  private static cachedConfigHash: string = '';

  /**
   * Generates a complete synchronized Altare backing arrangement buffer:
   * - 0:00 - 0:30 (Intro/Verse): Ambient pads, ethereal Reese bass, clock ticks
   * - 0:30 - 0:45 (Build-up): Highpass sweep, accelerating snare rolls, pitch risers
   * - 0:45 - 1:15 (Climax Drop): Sidechained supersaws, heavy 808 sub kick combo
   * - 1:15 - 1:30 (Outro): Reverb wash & filtered Reese descent
   */
  public static generateArrangementBuffer(
    ctx: BaseAudioContext,
    config: AltareRemixConfig,
    durationSeconds = 75 // 1 minute 15 seconds full arrangement
  ): AudioBuffer {
    const hash = `${config.tempo}-${config.key}-${config.energy}-${config.sidechainDepth}-${config.reeseCutoff}-${durationSeconds}`;
    if (this.cachedBuffer && this.cachedConfigHash === hash && this.cachedBuffer.sampleRate === ctx.sampleRate) {
      return this.cachedBuffer;
    }

    const rate = ctx.sampleRate;
    const len = Math.ceil(durationSeconds * rate);
    const buf = ctx.createBuffer(2, len, rate);
    const left = buf.getChannelData(0);
    const right = buf.getChannelData(1);

    const bpm = config.tempo;
    const beatInterval = 60 / bpm; // e.g. ~0.4137s at 145 BPM
    const barInterval = beatInterval * 4; // ~1.655s per bar

    const keyData = ALTARE_KEY_NOTES[config.key] || ALTARE_KEY_NOTES['A Minor'];
    const chordList = keyData.chords;

    // Phase timestamps (in seconds)
    const introEnd = 30.0;
    const buildEnd = 45.0;
    const dropEnd = 70.0;

    // Reese detune frequency offset (Hz)
    const reeseDetune = 0.75;
    const reeseCutoff = config.reeseCutoff;

    // Supersaw detuning offsets for 7 voices
    const supersawDetunes = [-0.035, -0.02, -0.008, 0, 0.008, 0.02, 0.035];

    for (let i = 0; i < len; i++) {
      const t = i / rate;
      const barNum = Math.floor(t / barInterval);
      const chord = chordList[barNum % chordList.length];
      const rootHz = chord[0];
      const barPhase = (t % barInterval) / barInterval; // 0.0 to 1.0 within bar
      const beatPhase = (t % beatInterval) / beatInterval; // 0.0 to 1.0 within beat

      let mixL = 0;
      let mixR = 0;

      // ============================================================
      // 1. INTRO / AMBIENT VERSE (0:00 - 0:30)
      // ============================================================
      if (t < introEnd) {
        // A. Ethereal Strings / Ambient Pad
        for (let c = 0; c < chord.length; c++) {
          const freq = chord[c];
          const padL = Math.sin(2 * Math.PI * freq * t) * 0.035;
          const padR = Math.sin(2 * Math.PI * freq * 1.002 * t + 0.5) * 0.035;
          mixL += padL;
          mixR += padR;
        }

        // B. Ethereal Low-Pass Reese Bass (pulsing detuned saws)
        const reeseFreq = rootHz * 0.5; // low octave
        const saw1 = (2 * ((t * reeseFreq) % 1) - 1);
        const saw2 = (2 * ((t * (reeseFreq + reeseDetune)) % 1) - 1);
        const reeseRaw = (saw1 + saw2) * 0.5;
        // Soft low-pass feel
        const reeseEnv = Math.min(1.0, t / 4.0); // smooth fade in
        const reeseGain = (reeseCutoff / 500) * 0.22 * reeseEnv;
        mixL += reeseRaw * reeseGain;
        mixR += reeseRaw * reeseGain;

        // C. Crisp Metallic Clock-Tick Percussion (on every quarter beat)
        if (t > 4.0) {
          const tickT = (t % beatInterval);
          if (tickT < 0.025) {
            const tickImpulse = (Math.random() * 2 - 1) * Math.exp(-tickT * 180);
            mixL += tickImpulse * 0.08;
            mixR += tickImpulse * 0.06;
          }
        }
      }

      // ============================================================
      // 2. THE BUILD-UP (0:30 - 0:45)
      // ============================================================
      else if (t >= introEnd && t < buildEnd) {
        const buildProgress = (t - introEnd) / (buildEnd - introEnd); // 0.0 to 1.0

        // A. Filtered Rising Ambient Chord Pad with Automated High-Pass
        const hpCutoffMult = 1.0 + buildProgress * 3.0;
        for (let c = 0; c < chord.length; c++) {
          const freq = chord[c] * hpCutoffMult;
          const pad = Math.sin(2 * Math.PI * freq * t) * (0.04 + buildProgress * 0.04);
          mixL += pad;
          mixR += pad * 0.9;
        }

        // B. Escalating Snare Roll Acceleration:
        // 0:30 - 0:36: 1/4 notes
        // 0:36 - 0:41: 1/8 notes
        // 0:41 - 0:44: 1/16 notes
        // 0:44 - 0:44.75: 1/32 notes
        // 0:44.75 - 0:45: Pre-drop silent gap!
        if (t < buildEnd - 0.25) {
          let subdiv = 1; // quarter notes
          if (t >= 44.0) subdiv = 8; // 32nd notes
          else if (t >= 41.0) subdiv = 4; // 16th notes
          else if (t >= 36.0) subdiv = 2; // 8th notes

          const subBeatInterval = beatInterval / subdiv;
          const snareT = t % subBeatInterval;
          if (snareT < 0.08) {
            const snareTone = Math.sin(2 * Math.PI * 195 * snareT) * Math.exp(-snareT * 40);
            const snareNoise = (Math.random() * 2 - 1) * Math.exp(-snareT * 35);
            const snareAmp = (0.08 + buildProgress * 0.24);
            const snareHit = (snareTone * 0.4 + snareNoise * 0.6) * snareAmp;
            mixL += snareHit;
            mixR += snareHit;
          }
        }

        // C. White Noise Pitch Riser Sweep
        const riserFreq = 200 + Math.pow(buildProgress, 2) * 8000;
        const riserNoise = (Math.random() * 2 - 1) * Math.sin(2 * Math.PI * riserFreq * t);
        const riserAmp = buildProgress * 0.12;
        mixL += riserNoise * riserAmp;
        mixR += riserNoise * riserAmp * 1.1;
      }

      // ============================================================
      // 3. THE CLIMAX DROP (0:45 - 1:15)
      // ============================================================
      else if (t >= buildEnd && t < dropEnd) {
        const dropT = t - buildEnd;
        const beatInBar = (dropT / beatInterval) % 4; // 0, 1, 2, 3

        // A. Sidechain Pumping Envelope (Ducks every beat for Future Bass drop)
        // Duck curve: drops sharply to 0.12 when kick hits, rapidly rises back to 1.0
        const kickDist = beatPhase; // 0 at kick, 1 before next
        const sidechainDuck = 1.0 - config.sidechainDepth * Math.exp(-kickDist * 6.5);

        // B. Aggressive Detuned Supersaws (7 unison voices per chord note)
        let supersawTotalL = 0;
        let supersawTotalR = 0;
        for (let c = 0; c < chord.length; c++) {
          const baseFreq = chord[c];
          for (let v = 0; v < supersawDetunes.length; v++) {
            const detunedFreq = baseFreq * (1.0 + supersawDetunes[v]);
            const sawSample = (2 * ((t * detunedFreq) % 1) - 1);
            // Alternate pan
            if (v % 2 === 0) supersawTotalL += sawSample;
            else supersawTotalR += sawSample;
          }
        }
        const supersawNorm = (supersawTotalL + supersawTotalR) / (chord.length * supersawDetunes.length);
        const supersawOut = supersawNorm * (0.28 + config.energy * 0.16) * sidechainDuck;
        mixL += supersawOut * 1.1;
        mixR += supersawOut * 0.95;

        // C. Heavy Clean 808 Sub-Bass Kick Combo
        // Kick on beats 0, 1.5, 2.5, 3 (Syncopated Hybrid Trap pattern)
        const isTrapKick = (beatInBar < 0.22) || 
                           (beatInBar > 1.45 && beatInBar < 1.68) || 
                           (beatInBar > 2.45 && beatInBar < 2.68);

        if (isTrapKick) {
          const kickSubT = (t % (beatInterval * 0.5));
          if (kickSubT < 0.25) {
            // Pitch slide: 120Hz down to 44Hz (808 fundamental)
            const pitchEnv = 44 + 76 * Math.exp(-kickSubT * 28);
            const subWave = Math.sin(2 * Math.PI * pitchEnv * kickSubT);
            // Saturation drive
            const saturatedSub = Math.tanh(subWave * (1.2 + config.distortionDrive * 1.5));
            const subEnv = Math.exp(-kickSubT * 4.5);
            const subFinal = saturatedSub * subEnv * 0.42;
            mixL += subFinal;
            mixR += subFinal;
          }
        }

        // D. Trap Snare on Beat 2 and 4 (Half-Time Drop Hit)
        if ((beatInBar > 1.95 && beatInBar < 2.15) || (beatInBar > 3.95 && beatInBar < 4.15)) {
          const snareSubT = (t % beatInterval);
          if (snareSubT < 0.15) {
            const sTone = Math.sin(2 * Math.PI * 220 * snareSubT) * Math.exp(-snareSubT * 30);
            const sSnap = (Math.random() * 2 - 1) * Math.exp(-snareSubT * 45);
            const snareFinal = (sTone * 0.4 + sSnap * 0.6) * 0.32;
            mixL += snareFinal;
            mixR += snareFinal;
          }
        }

        // E. Rolling Trap Hi-Hats (16th notes with stereo tick)
        const hihatT = (t % (beatInterval / 4));
        if (hihatT < 0.035) {
          const hatNoise = (Math.random() * 2 - 1) * Math.exp(-hihatT * 95) * 0.045;
          mixL += hatNoise;
          mixR += hatNoise * 1.2;
        }
      }

      // ============================================================
      // 4. OUTRO (0:70 - 1:15)
      // ============================================================
      else {
        const outroProgress = (t - dropEnd) / (durationSeconds - dropEnd);
        const fade = Math.max(0, 1.0 - outroProgress);
        // Soft reverb pad descent
        for (let c = 0; c < chord.length; c++) {
          const pad = Math.sin(2 * Math.PI * chord[c] * t) * 0.04 * fade;
          mixL += pad;
          mixR += pad;
        }
      }

      // Soft limiting
      left[i] = Math.max(-0.95, Math.min(0.95, mixL));
      right[i] = Math.max(-0.95, Math.min(0.95, mixR));
    }

    this.cachedBuffer = buf;
    this.cachedConfigHash = hash;
    return buf;
  }

  /**
   * Generates a Melodic Vocal Chop Loop from user's isolated vocal buffer
   * Slices vowel anchors, dynamically pitches & time-quantizes them into the
   * signature Altare future bass melodic lead!
   */
  public static generateVocalChopLead(
    ctx: BaseAudioContext,
    vocalBuffer: AudioBuffer,
    config: AltareRemixConfig,
    durationSeconds = 75
  ): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = Math.ceil(durationSeconds * rate);
    const outBuf = ctx.createBuffer(2, len, rate);
    const outL = outBuf.getChannelData(0);
    const outR = outBuf.getChannelData(1);

    const inL = vocalBuffer.getChannelData(0);
    const inR = vocalBuffer.numberOfChannels > 1 ? vocalBuffer.getChannelData(1) : inL;
    const inLen = vocalBuffer.length;

    const bpm = config.tempo;
    const beatInterval = 60 / bpm;
    const stepInterval = beatInterval / 2; // 1/8th note slice grid

    // Detect energetic slices in user vocal buffer
    const slicePoints: number[] = [];
    const windowSize = Math.floor(rate * 0.25); // 250ms chunks
    for (let pos = 0; pos < inLen - windowSize; pos += windowSize) {
      let energy = 0;
      for (let s = 0; s < windowSize; s += 64) {
        energy += Math.abs(inL[pos + s]);
      }
      if (energy > 5.0) {
        slicePoints.push(pos);
      }
    }
    if (slicePoints.length === 0) {
      slicePoints.push(0);
    }

    const keyData = ALTARE_KEY_NOTES[config.key] || ALTARE_KEY_NOTES['A Minor'];
    const chordList = keyData.chords;

    // Vocal Chops are most prominent during the Drop (0:45 - 1:15) and subtle in Verse
    const dropStart = 45.0;
    const dropEnd = 70.0;

    // Pitch multiplier from semitones
    const pitchFactor = Math.pow(2, config.vocalPitchShift / 12);

    for (let tSec = dropStart; tSec < dropEnd; tSec += stepInterval) {
      const stepIdx = Math.floor((tSec - dropStart) / stepInterval);
      // Rhythmic syncopation: don't play on every slice
      const isHit = config.vocalChopDensity === 'rapid' 
        ? true 
        : config.vocalChopDensity === 'sparse' 
          ? (stepIdx % 4 === 0 || stepIdx % 4 === 3) 
          : (stepIdx % 8 !== 2 && stepIdx % 8 !== 6);

      if (!isHit) continue;

      // Select slice
      const sliceIdx = stepIdx % slicePoints.length;
      const srcStart = slicePoints[sliceIdx];
      const sliceDuration = Math.min(stepInterval * 0.85, 0.35); // short gated slice
      const sliceSamples = Math.floor(sliceDuration * rate);

      const outStartSample = Math.floor(tSec * rate);

      // Pitch contour
      const barNum = Math.floor(tSec / (beatInterval * 4));
      const chord = chordList[barNum % chordList.length];
      const targetNote = chord[(stepIdx % chord.length)];
      const notePitchRatio = (targetNote / 440.0) * pitchFactor;

      for (let s = 0; s < sliceSamples; s++) {
        const outIdx = outStartSample + s;
        if (outIdx >= len) break;

        const srcIdx = Math.floor(srcStart + s * notePitchRatio);
        if (srcIdx >= inLen) break;

        // Envelope (smooth attack, fast release)
        const env = Math.min(1.0, s / 180) * Math.pow(1.0 - (s / sliceSamples), 1.5);
        const sampleL = inL[srcIdx] * env * 1.15;
        const sampleR = inR[srcIdx] * env * 1.15;

        // Add with stereo ping-pong delay feel
        outL[outIdx] = Math.max(-0.95, Math.min(0.95, outL[outIdx] + sampleL));
        outR[outIdx] = Math.max(-0.95, Math.min(0.95, outR[outIdx] + sampleR * 0.95));
      }
    }

    return outBuf;
  }
}
