import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Gemini SDK if API key exists
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Vibe Analysis & Transformation Recommendation
app.post('/api/gemini/vibe-analysis', async (req, res) => {
  try {
    const { trackTitle, artist, bpm, key, duration, energy, vocals, genre } = req.body;
    
    if (!ai) {
      // High-quality smart contextual fallback
      return res.json({
        recommendedStyles: [
          {
            id: 'ultra_slowed_reverb',
            name: 'Ultra Slowed + Reverb',
            tag: 'Viral Night Drive',
            confidence: 96,
            reason: `With ${bpm} BPM and ${energy.toLowerCase()} energy, the melodic layers bloom when stretched by 32% with a 5.8s cathedral reverberation.`,
            suggestedSettings: { speed: 0.68, pitch: -3.2, reverbWet: 0.58, reverbDecay: 5.8, bassBoost: 4.5, stereoWidth: 1.35, pan8d: false }
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
            reason: `Accelerating by 25% with crisp pitch transposition matches high-retention short-form dance and anime aesthetic edits.`,
            suggestedSettings: { speed: 1.25, pitch: 3.5, reverbWet: 0.18, reverbDecay: 1.6, bassBoost: 2.0, stereoWidth: 1.2, pan8d: false }
          }
        ],
        summary: `Analysis indicates strong emotional vocal contours in ${key} with spacious low-end headroom. Recommended primary pathway is Ultra Slowed + Reverb for YouTube long-form, complemented by 8D Audio for immersive headphones and a 15-second Nightcore cut for TikTok.`,
        soundSignature: 'Dark Melancholic Ambient with Heavy Sub Harmonics'
      });
    }

    const prompt = `You are the lead sound architect for MusicMotion AI. Analyze this musical track:
Title: "${trackTitle || 'Untitled Track'}"
Artist: "${artist || 'Independent Artist'}"
BPM: ${bpm || 112}
Key: ${key || 'A Minor'}
Duration: ${duration || '3:24'}
Energy: ${energy || 'High'}
Vocals: ${vocals || 'Detected'}
Genre: ${genre || 'Electronic / Melodic'}

Return a valid JSON object matching this schema:
{
  "recommendedStyles": [
    {
      "id": "ultra_slowed_reverb",
      "name": "Ultra Slowed + Reverb",
      "tag": "Short descriptive badge",
      "confidence": 95,
      "reason": "Detailed acoustic and psychological reason why this works",
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
  "summary": "Overall synthesis and creative advice",
  "soundSignature": "Acoustic texture descriptor"
}
Provide exactly 3 distinct styles from: Ultra Slowed + Reverb, 8D Spatial Audio, Nightcore, Lo-fi Nostalgia, Dark Atmosphere, Sub Bass Boost. Return only valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error in vibe-analysis:', error);
    res.status(500).json({ error: 'Failed to generate vibe analysis' });
  }
});

// 2. One-Click Content Pack Generator ("MAKE IT A VIBE")
app.post('/api/gemini/content-pack', async (req, res) => {
  try {
    const { trackTitle, artist, selectedStyle, genre } = req.body;

    if (!ai) {
      return res.json({
        youtubeTitle: `${trackTitle || 'Midnight Mirage'} — ${selectedStyle || 'Ultra Slowed + Reverb'} (Official Experience)`,
        youtubeAlternativeTitles: [
          `${trackTitle || 'Midnight Mirage'} [Ultra Slowed + Reverb] // 3AM Night Drive`,
          `how ${trackTitle || 'Midnight Mirage'} sounds when driving alone in the rain [8D Audio]`,
          `${trackTitle || 'Midnight Mirage'} but it feels like you're floating in space`
        ],
        description: `🎧 Use headphones for the ultimate experience.\n\n` +
          `Track: ${trackTitle || 'Midnight Mirage'}\n` +
          `Artist: ${artist || 'Alex Knight'}\n` +
          `Treatment: ${selectedStyle || 'Ultra Slowed + Reverb'}\n` +
          `Engine: Processed via MusicMotion AI DSP Engine\n\n` +
          `⏱ TIMESTAMPS:\n0:00 - Initial Descent\n0:45 - Atmospheric Drop\n1:42 - Peak Resonance\n2:50 - Outro & Reverberation\n\n` +
          `⚠️ RIGHTS & PERMISSIONS:\nProduced under creator authorization. All rights reserved to original copyright owners.`,
        tags: ['slowed', 'slowedandreverb', '8daudio', 'nightdrive', 'aesthetic', 'ambientmusic', 'chillbeats'],
        tiktokCaption: `when the ${selectedStyle || 'slowed + reverb'} version hits harder than the original 🌌 #slowedsongs #8daudio #nightdrive #aesthetic`,
        reelsCaption: `Floating through midnight frequencies. Which version do you want next? 🪐 #musicmotion #slowedsongs #vibes`,
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
      });
    }

    const prompt = `You are a viral music publishing strategist for MusicMotion AI. Generate an exhaustive YouTube, TikTok, and Instagram content pack for:
Track: "${trackTitle}"
Artist: "${artist}"
Style Treatment: "${selectedStyle}"
Genre: "${genre}"

Return valid JSON matching:
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error in content-pack:', error);
    res.status(500).json({ error: 'Failed to generate content pack' });
  }
});

// 3. Custom Natural Language Style Creator ("Make it feel like driving alone at midnight in rain")
app.post('/api/gemini/custom-style', async (req, res) => {
  try {
    const { feelingPrompt } = req.body;
    
    if (!ai) {
      return res.json({
        styleName: 'Midnight Rainfall',
        soundProfile: 'Dark Melancholic Ambient',
        description: 'Engineered for late night solitude with heavy low frequencies and wide spatial reflection.',
        settings: {
          speed: 0.74,
          pitch: -2.8,
          reverbWet: 0.62,
          reverbDecay: 6.2,
          bassBoost: 5.0,
          stereoWidth: 1.45,
          pan8d: true,
          panSpeed: 0.08,
          lofiCutoff: 3800
        }
      });
    }

    const prompt = `Translate this sonic feeling prompt into audio DSP parameters for MusicMotion AI:
User Prompt: "${feelingPrompt}"

Return valid JSON:
{
  "styleName": "Creative 2-word Style Name",
  "soundProfile": "Short audio aesthetic descriptor",
  "description": "How this setting crafts the psychological mood",
  "settings": {
    "speed": 0.75, // range 0.5 to 1.6
    "pitch": -3.0, // range -8 to +8 semitones
    "reverbWet": 0.5, // range 0.0 to 0.95
    "reverbDecay": 5.0, // range 0.5 to 10.0 seconds
    "bassBoost": 4.0, // range 0.0 to 12.0 dB
    "stereoWidth": 1.3, // range 0.5 to 2.0
    "pan8d": true, // boolean
    "panSpeed": 0.1, // range 0.04 to 0.4 Hz
    "lofiCutoff": 4200 // range 1200 to 18000 Hz (lowpass)
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error in custom-style:', error);
    res.status(500).json({ error: 'Failed to interpret custom style' });
  }
});

// 4. Rights & Licensing Audit
app.post('/api/gemini/rights-audit', async (req, res) => {
  try {
    const { source, ownershipType, notes } = req.body;

    const prompt = `Evaluate copyright licensing status for music publishing:
Source: "${source}"
Claimed Ownership: "${ownershipType}"
User Notes: "${notes || 'No extra notes'}"

Return valid JSON:
{
  "status": "GREEN" | "YELLOW" | "RED",
  "badge": "Safe to Monetize" | "Review Commercial Terms" | "High Risk / Prohibited",
  "analysis": "Clear legal reasoning explaining why slowing, speeding up, adding reverb, or 8D effect does NOT circumvent copyright law",
  "checklist": [
    {"label": "Direct Master Rights Owned or Licensed", "passed": true},
    {"label": "Publishing / Synchronization Clearance", "passed": true},
    {"label": "Derivative Work Transformation Authorization", "passed": false}
  ],
  "recommendation": "Step-by-step guidance on how the user can publish safely without DMCA strikes"
}`;

    if (!ai) {
      const isGreen = ownershipType === 'I own all original master & publishing rights' || ownershipType === 'Public Domain';
      const isYellow = ownershipType === 'I hold written permission from artist' || ownershipType === 'Creative Commons CC-BY';
      return res.json({
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
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error in rights-audit:', error);
    res.status(500).json({ error: 'Failed to analyze rights' });
  }
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

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MusicMotion AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
