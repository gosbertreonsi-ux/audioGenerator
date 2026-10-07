import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Gemini SDK safely if API key exists and is valid
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '') {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Notice: GoogleGenAI initialization skipped:', (err as Error).message);
    ai = null;
  }
}

// Helper for timeout-protected Gemini calls that cleanly absorbs background network rejections
async function callGeminiWithTimeout<T>(promise: Promise<T>, timeoutMs = 3800): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Gemini API call timed out')), timeoutMs);
  });
  // Absorb background rejection so undici late timeouts (HeadersTimeoutError) never trigger unhandled errors
  promise.catch(() => {});
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// 1. Vibe Analysis & Transformation Recommendation
app.post('/api/gemini/vibe-analysis', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { trackTitle, artist, bpm = 112, key = 'A Minor', duration = '3:24', energy = 'High', vocals = 'Detected', genre = 'Electronic' } = req.body || {};

  const fallbackData = {
    recommendedStyles: [
      {
        id: 'ultra_slowed_reverb',
        name: 'Ultra Slowed + Reverb',
        tag: 'Viral Night Drive',
        confidence: 96,
        reason: `With ${bpm} BPM and ${String(energy).toLowerCase()} energy, the melodic layers bloom when stretched by 32% with a 5.8s cathedral reverberation.`,
        suggestedSettings: { speed: 0.68, pitch: -3.2, reverbWet: 0.58, reverbDecay: 5.8, bassBoost: 4.5, stereoWidth: 1.35, pan8d: false }
      },
      {
        id: '8d_tunes_signature',
        name: '8D Tunes Official 360°',
        tag: '8D TUNES IMMERSION',
        confidence: 94,
        reason: `360° binaural circular headphone orbit with 4.8s room reflections and heavy sub-bass warmth matches high-retention streaming trends.`,
        suggestedSettings: { speed: 1.0, pitch: 0, reverbWet: 0.38, reverbDecay: 4.8, bassBoost: 4.8, stereoWidth: 1.75, pan8d: true, panSpeed: 0.11 }
      },
      {
        id: 'spatial_8d',
        name: '8D Spatial Audio',
        tag: 'Immersive Headphone Focus',
        confidence: 91,
        reason: `Vocal presence and stereo frequency spread lend themselves directly to binaural circular panning across 360-degree field.`,
        suggestedSettings: { speed: 1.0, pitch: 0, reverbWet: 0.28, reverbDecay: 2.4, bassBoost: 3.0, stereoWidth: 1.6, pan8d: true, panSpeed: 0.12 }
      },
      {
        id: 'nightcore_bright',
        name: 'Nightcore + Hyper Sparkle',
        tag: 'TikTok High Tempo',
        confidence: 84,
        reason: `Accelerating by 28% with crisp pitch transposition matches high-retention short-form dance and anime aesthetic edits.`,
        suggestedSettings: { speed: 1.28, pitch: 3.5, reverbWet: 0.18, reverbDecay: 1.6, bassBoost: 2.0, stereoWidth: 1.2, pan8d: false }
      }
    ],
    summary: `Analysis indicates strong emotional vocal contours in ${key} with spacious low-end headroom. Recommended primary pathway is Ultra Slowed + Reverb for YouTube long-form, complemented by 8D Audio for immersive headphones and a 15-second Nightcore cut for TikTok.`,
    soundSignature: 'Dark Melancholic Ambient with Heavy Sub Harmonics'
  };

  if (!ai) {
    return res.json(fallbackData);
  }

  try {
    const prompt = `You are the lead sound architect for MusicMotion AI. Analyze this musical track:
Title: "${trackTitle || 'Untitled Track'}"
Artist: "${artist || 'Independent Artist'}"
BPM: ${bpm}
Key: ${key}
Duration: ${duration}
Energy: ${energy}
Vocals: ${vocals}
Genre: ${genre}

Return valid JSON with:
{
  "recommendedStyles": [
    {
      "id": "ultra_slowed_reverb",
      "name": "Ultra Slowed + Reverb",
      "tag": "Short badge",
      "confidence": 95,
      "reason": "Detailed acoustic reason",
      "suggestedSettings": {
        "speed": 0.68,
        "pitch": -3.0,
        "reverbWet": 0.55,
        "reverbDecay": 5.5,
        "bassBoost": 4.0,
        "stereoWidth": 1.3,
        "pan8d": false
      }
    }
  ],
  "summary": "Overall synthesis",
  "soundSignature": "Acoustic descriptor"
}`;

    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed.recommendedStyles ? parsed : fallbackData);
  } catch (_error) {
    return res.json(fallbackData);
  }
});

// 2. One-Click Content Pack Generator ("MAKE IT A VIBE")
app.post('/api/gemini/content-pack', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { trackTitle = 'Midnight Horizon', artist = 'LEONCE', selectedStyle = 'Ultra Slowed + Reverb', genre = 'Melodic Electronic' } = req.body || {};

  const fallbackData = {
    youtubeTitle: `${trackTitle} — ${selectedStyle} (Official 8D Experience)`,
    youtubeAlternativeTitles: [
      `${trackTitle} [${selectedStyle}] // 3AM Night Drive`,
      `how ${trackTitle} sounds when driving alone in the rain [8D Audio]`,
      `${trackTitle} but it feels like you're floating in space`
    ],
    description: `🎧 Use headphones for the ultimate 360° binaural experience.\n\n` +
      `Track: ${trackTitle}\n` +
      `Artist: ${artist}\n` +
      `Treatment: ${selectedStyle}\n` +
      `Engine: Processed via MusicMotion AI DSP Engine\n\n` +
      `⏱ TIMESTAMPS:\n0:00 - Initial Descent\n0:45 - Atmospheric Drop\n1:42 - Peak Resonance\n2:50 - Outro & Reverberation\n\n` +
      `⚠️ RIGHTS & PERMISSIONS:\nProduced under creator authorization. All rights reserved to original copyright owners.`,
    tags: ['slowed', 'slowedandreverb', '8daudio', '8dtunes', 'nightdrive', 'aesthetic', 'ambientmusic', 'chillbeats', 'leonce'],
    tiktokCaption: `when the ${selectedStyle} version hits harder than the original 🌌 #slowedsongs #8daudio #nightdrive #aesthetic #leonce`,
    reelsCaption: `Floating through midnight frequencies. Which version do you want next? 🪐 #musicmotion #slowedsongs #vibes #8daudio`,
    bestMoments: [
      { title: 'The Vocal Drop', start: '00:42', end: '00:57', vibe: 'Viral TikTok Peak' },
      { title: 'Emotional Chorus', start: '01:25', end: '01:55', vibe: 'YouTube Short Hook' },
      { title: 'Sub-bass Climax', start: '02:18', end: '02:48', vibe: 'Reels Aesthetic' }
    ],
    thumbnailVisualPrompts: [
      'Moody cyberpunk car dashboard overlooking neon crimson highway at 2 AM with rain streaks',
      'Cinematic portrait of wandering silhouette engulfed in deep red embers and smoke',
      'Minimalist dark typography album cover with floating celestial geometry',
      'Analog VHS tape aesthetic with retro anime night cityscape'
    ]
  };

  if (!ai) {
    return res.json(fallbackData);
  }

  try {
    const prompt = `You are a viral music publishing strategist for MusicMotion AI. Generate an exhaustive YouTube, TikTok, and Instagram content pack for:
Track: "${trackTitle}"
Artist: "${artist}"
Style Treatment: "${selectedStyle}"
Genre: "${genre}"

Return valid JSON with:
{
  "youtubeTitle": "High CTR Title",
  "youtubeAlternativeTitles": ["Title 2", "Title 3", "Title 4"],
  "description": "Full rich description with timestamps and credits",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "tiktokCaption": "Catchy caption with hashtags",
  "reelsCaption": "Instagram caption",
  "bestMoments": [
    {"title": "Hook Name", "start": "00:35", "end": "00:50", "vibe": "Viral rationale"}
  ],
  "thumbnailVisualPrompts": ["Art concept 1", "Art concept 2", "Art concept 3", "Art concept 4"]
}`;

    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed.youtubeTitle ? parsed : fallbackData);
  } catch (_error) {
    return res.json(fallbackData);
  }
});

// 3. Custom Natural Language Style Creator ("Make it feel like driving alone at midnight in rain")
app.post('/api/gemini/custom-style', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { feelingPrompt = '' } = req.body || {};
  const p = String(feelingPrompt).toLowerCase();

  // Smart contextual DSP synthesizer based on prompt keywords
  let speed = 0.75;
  let pitch = -3.0;
  let reverbWet = 0.55;
  let reverbDecay = 5.5;
  let bassBoost = 5.0;
  let pan8d = true;
  let panSpeed = 0.1;
  let lofiCutoff = 18000;
  let styleName = 'Midnight Vibe';
  let soundProfile = 'Dark Spatial Ambient';

  if (p.includes('rain') || p.includes('alone') || p.includes('midnight') || p.includes('drive')) {
    styleName = 'Midnight Rainfall';
    soundProfile = '3AM Rainy Highway 8D';
    speed = 0.74;
    pitch = -2.8;
    reverbWet = 0.62;
    reverbDecay = 6.2;
    bassBoost = 5.5;
    lofiCutoff = 3800;
  } else if (p.includes('fast') || p.includes('speed') || p.includes('hyper') || p.includes('anime')) {
    styleName = 'Hyper Velocity';
    soundProfile = 'Sped-Up Crystal Air';
    speed = 1.30;
    pitch = 3.5;
    reverbWet = 0.2;
    reverbDecay = 1.8;
    bassBoost = 2.0;
    pan8d = false;
  } else if (p.includes('drill') || p.includes('trap') || p.includes('808') || p.includes('sub')) {
    styleName = 'Sub-Bass Orbit';
    soundProfile = 'Heavy 808 Spatial Trap';
    speed = 0.88;
    pitch = -2.0;
    bassBoost = 8.5;
    reverbWet = 0.35;
    panSpeed = 0.15;
  } else if (p.includes('lofi') || p.includes('lo-fi') || p.includes('tape') || p.includes('nostalg')) {
    styleName = 'Cassette Warmth';
    soundProfile = 'Analog Tape Nostalgia';
    speed = 0.82;
    pitch = -1.5;
    lofiCutoff = 3200;
    reverbWet = 0.4;
  } else if (p.includes('8d') || p.includes('headphone') || p.includes('surround')) {
    styleName = '8D Binaural Orbit';
    soundProfile = '360° Headphone Immersion';
    speed = 1.0;
    pitch = 0;
    pan8d = true;
    panSpeed = 0.12;
    reverbWet = 0.42;
    reverbDecay = 4.8;
    bassBoost = 4.5;
  }

  const fallbackData = {
    styleName,
    soundProfile,
    description: `Sonic treatment crafted from "${feelingPrompt}": ${Math.round(speed * 100)}% tempo, ${pitch > 0 ? `+${pitch}` : pitch}st pitch, and ${pan8d ? '360° 8D headphone orbit' : 'wide stereo'}.`,
    settings: {
      speed,
      pitch,
      reverbWet,
      reverbDecay,
      bassBoost,
      stereoWidth: 1.4,
      pan8d,
      panSpeed,
      lofiCutoff
    }
  };

  if (!ai) {
    return res.json(fallbackData);
  }

  try {
    const prompt = `Translate this sonic feeling prompt into audio DSP parameters for MusicMotion AI:
User Prompt: "${feelingPrompt}"

Return valid JSON with:
{
  "styleName": "Creative 2-word Style Name",
  "soundProfile": "Short audio aesthetic descriptor",
  "description": "How this setting crafts the psychological mood",
  "settings": {
    "speed": 0.75,
    "pitch": -3.0,
    "reverbWet": 0.5,
    "reverbDecay": 5.0,
    "bassBoost": 4.0,
    "stereoWidth": 1.3,
    "pan8d": true,
    "panSpeed": 0.1,
    "lofiCutoff": 4200
  }
}`;

    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed.settings ? parsed : fallbackData);
  } catch (_error) {
    return res.json(fallbackData);
  }
});

// 4. Rights & Licensing Audit
app.post('/api/gemini/rights-audit', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { source = 'Master Track', ownershipType = '', notes = '' } = req.body || {};
  const isGreen = ownershipType.includes('original master') || ownershipType.includes('Public Domain');
  const isYellow = ownershipType.includes('written permission') || ownershipType.includes('Creative Commons');

  const fallbackData = {
    status: isGreen ? 'GREEN' : isYellow ? 'YELLOW' : 'RED',
    badge: isGreen ? 'Cleared for Monetization' : isYellow ? 'Attribution & Terms Required' : 'Potential Copyright Restriction',
    analysis: isGreen 
      ? 'You have documented original master rights. Content is fully cleared for YouTube Content ID, TikTok Sound Library, and commercial distribution.'
      : 'Warning: Speed adjustments (Slowed, Sped Up) and audio effects (Reverb, 8D) do NOT constitute fair use or copyright transfer. Ensure you hold a direct synchronization or derivative license before publishing commercially.',
    checklist: [
      { label: 'Original Master Recording Authorization', passed: isGreen || isYellow },
      { label: 'Derivative Audio Work Permissions', passed: isGreen },
      { label: 'Public Video Distribution Rights', passed: isGreen || isYellow }
    ],
    recommendation: isGreen
      ? 'Safe to publish directly with automated Content ID metadata.'
      : 'Include clear creator credits and ensure monetization is disabled unless explicit written synchronization clearance is attached.'
  };

  if (!ai) {
    return res.json(fallbackData);
  }

  try {
    const prompt = `Evaluate copyright licensing status for music publishing:
Source: "${source}"
Claimed Ownership: "${ownershipType}"
User Notes: "${notes || 'No extra notes'}"

Return valid JSON:
{
  "status": "GREEN" | "YELLOW" | "RED",
  "badge": "Clearance badge",
  "analysis": "Legal analysis",
  "checklist": [
    {"label": "Direct Master Rights Owned or Licensed", "passed": true},
    {"label": "Publishing / Synchronization Clearance", "passed": true},
    {"label": "Derivative Work Transformation Authorization", "passed": false}
  ],
  "recommendation": "Step-by-step guidance"
}`;

    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed.status ? parsed : fallbackData);
  } catch (_error) {
    return res.json(fallbackData);
  }
});

// API 404 handler to ensure API requests never receive Vite's HTML
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Setup Vite middlewares or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  // Global error handler
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error handled:', (err as Error)?.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MusicMotion AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
