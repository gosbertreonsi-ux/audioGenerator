import { VocalModel } from '../types';

type Category = VocalModel['category'];

const CATEGORY_TEMPLATES: {
  category: Category;
  company: string;
  hardware: string;
  archetypes: { name: string; tag: string; pitch: number; tune: number; verb: number; drive: number; desc: string }[];
}[] = [
  {
    category: 'Afrobeat & West African',
    company: 'Spaceship Collective / Mavin Records / YBNL / Starboy',
    hardware: 'Sony C-800G + Neve 1073 + Tube-Tech CL1B + Bricasti M7 + Lexicon 480L',
    archetypes: [
      { name: 'Burna Boy African Giant Baritone', tag: 'Deep African Baritone', pitch: -2, tune: 15, verb: 35, drive: 40, desc: 'Rich 110Hz chest resonance, bold Yoruba cadence, and warm analog harmonic valve saturation.' },
      { name: 'Wizkid Starboy Silky Falsetto', tag: 'Silky Airy Falsetto', pitch: 1, tune: 8, verb: 48, drive: 18, desc: 'Ultra-light vocal timbre, airy 14kHz shine, with smooth micro-pitch stereo width.' },
      { name: 'Rema Afro-Rave Melisma & Chants', tag: 'Indian-Afro Melisma', pitch: 2, tune: 4, verb: 52, drive: 22, desc: 'Fast quarter-tone melismatic pitch bends, sparkling top end, and exotic hypnotic vocal flutter.' },
      { name: 'Asake Fuji Choral Wall of Sound', tag: 'Fuji Street Choir Stack', pitch: 0, tune: 6, verb: 42, drive: 45, desc: 'Multi-tracked gang vocal choral spread with high-energy street cadence and 1176 slam.' },
      { name: 'Tiwa Savage Queen of Afrobeats', tag: 'Velvet R&B Afro Sheen', pitch: 1, tune: 12, verb: 40, drive: 16, desc: 'Pristine tube warmth, delicate silky high-register vibrato, and crystal-clear de-essing.' },
      { name: 'Fela Kuti Kalakuta Poly-Vocal Leader', tag: 'Afrobeat Pioneer Call & Response', pitch: 0, tune: 45, verb: 30, drive: 55, desc: 'Raw call-and-response horn bleed and Afrobeat pioneer spirit with vintage console grit.' },
      { name: 'Ayra Starr Celestial Gen-Z Sheen', tag: 'Hyper-Melodic Youth Star', pitch: 2, tune: 5, verb: 46, drive: 20, desc: 'Bright radio-ready vocal projection with modern hyper-tuned sheen and wide chorus double.' },
      { name: 'Omah Lay Midnight Afro-Soul', tag: 'Moody Late-Night Intimacy', pitch: -1, tune: 14, verb: 60, drive: 25, desc: 'Dark ambient room reflections, melancholic vocal delivery, and warm tape delay repeats.' },
      { name: 'CKay Emo-Afrobeats Whisper', tag: 'Binaural Romantic Whisper', pitch: 0, tune: 10, verb: 55, drive: 12, desc: 'Ultra-close acoustic proximity, breathy vocal delivery, and 360° binaural stereo whispers.' },
      { name: 'Davido OBO High-Energy Anthem', tag: 'Hype Throat Projection', pitch: 0, tune: 10, verb: 28, drive: 52, desc: 'Aggressive forward projection with punchy midrange presence designed to cut through stadium horns.' },
      { name: 'Tems Velvet Soul Alté Voice', tag: 'Deep Alté Contralto', pitch: -2, tune: 22, verb: 58, drive: 20, desc: 'Commanding contralto register with rich low-mids, tube saturation, and expansive hall reverb.' },
      { name: 'Yemi Alade Mama Africa Belt', tag: 'Dynamic Power Afro-Pop', pitch: 1, tune: 16, verb: 36, drive: 35, desc: 'Soaring dynamic vocal belt with brassy resonance and crisp stereo imaging.' },
    ]
  },
  {
    category: 'Amapiano & Southern African',
    company: 'Piano Hub / Sony Music SA / Kalawa Jazmee / Afrotainment',
    hardware: 'Neumann U87 Ai + SSL 4000E + Manley VOXBOX + Bricasti Plate',
    archetypes: [
      { name: 'Kabza De Small Soulful Piano Chants', tag: 'Ancestral Amapiano Chants', pitch: -1, tune: 12, verb: 55, drive: 28, desc: 'Deep ancestral melodic vocal chants sidechained to pump dynamically with heavy log drums.' },
      { name: 'Young Stunna Bacardi Vocal Chants', tag: 'Fast Bacardi Flow', pitch: 1, tune: 5, verb: 35, drive: 38, desc: 'High-speed syncopated Bacardi cadence with punchy opto-compression and crisp top-end bite.' },
      { name: 'Focalistic Pretoria Spitori Punch', tag: 'Spitori Street Slang', pitch: 0, tune: 8, verb: 22, drive: 48, desc: 'Energetic township vernacular flow with upfront vocal presence cutting through deep basslines.' },
      { name: 'DBN Gogo Sgija Bass Hug Vocals', tag: 'Hypnotic Sgija Hum', pitch: -3, tune: 10, verb: 62, drive: 30, desc: 'Sub-filtered vocal hums with wide hypnotic stereo chorus and cavernous atmospheric decay.' },
      { name: 'Daliwonga Velvety Amapiano Tenor', tag: 'Silky Piano Ballad Tenor', pitch: 0, tune: 7, verb: 48, drive: 18, desc: 'Smooth romantic tenor delivery drenched in warm Lexicon room reflections and gentle autotune.' },
      { name: 'Kamo Mphela High-Octane Dance Adlibs', tag: 'Rhythmic Dance Shouts', pitch: 2, tune: 4, verb: 30, drive: 42, desc: 'Rapid infectious dance calls and rhythmic syncopated shouts designed for high-energy Amapiano dancebreaks.' },
      { name: 'South African 3-Step House Vocalist', tag: 'Tribal Deep House 3-Step', pitch: 0, tune: 18, verb: 68, drive: 22, desc: 'Ethereal tribal deep house vocals floating across 3-step polyrhythmic delays and analog tape warmth.' },
      { name: 'Durban Gqom Dark Zulu War Chants', tag: 'Distorted Durban War Chant', pitch: -4, tune: 25, verb: 32, drive: 75, desc: 'Aggressive distorted heavy tribal chants designed for dark 127 BPM Durban Gqom kicks.' },
      { name: 'Kwaito Mandoza Heavy Grit Lead', tag: 'Gravel Township Grit', pitch: -3, tune: 40, verb: 20, drive: 65, desc: 'Gritty, deep gravel township voice with vintage analog tape saturation and punchy mono weight.' },
      { name: 'DJ Maphorisa Madumane Sing-Rap', tag: 'Amapiano Sing-Rap Hybrid', pitch: 0, tune: 3, verb: 38, drive: 32, desc: 'Melodic auto-tuned Amapiano rap hybrid with bright air band and stereo micro-pitch widening.' },
      { name: 'Uncle Waffles Amapiano Groove Whispers', tag: 'High-Energy DJ Vocal Drops', pitch: 1, tune: 10, verb: 45, drive: 25, desc: 'Punchy DJ vocal drops, infectious giggles, and rhythmic hype shouts over syncopated shakers.' },
      { name: 'Nasty C Durban Trap Flow', tag: 'Razor-Sharp Lyricism', pitch: 0, tune: 6, verb: 24, drive: 36, desc: 'Laser-accurate dynamic articulation with fast transient response and modern radio sheen.' },
    ]
  },
  {
    category: 'East & Central African',
    company: 'WCB Wasafi / Electromode / Sol Generation / Quartier Latin',
    hardware: 'AKG C12 VR + Neve 1073 + Fairchild 670 + EMT 250',
    archetypes: [
      { name: 'Diamond Platnumz Bongo Flava Melisma', tag: 'Arabesque Swahili Melisma', pitch: 1, tune: 8, verb: 44, drive: 24, desc: 'Sweet Arabesque coastal Swahili vocal vibrato with pristine radio polish and pitch agility.' },
      { name: 'Fally Ipupa Congolese Sebene Crooner', tag: 'Lingala Bel Canto Rumba', pitch: 0, tune: 14, verb: 50, drive: 20, desc: 'Romantic Lingala bel canto tenor with sweet tube warmth, gliding over Congolese sebene guitars.' },
      { name: 'Koffi Olomide Tcha Tcho Rumba Bass', tag: 'Deep Rumba Declamatory', pitch: -3, tune: 35, verb: 40, drive: 30, desc: 'Sultry, deep spoken rumba poetry and bass harmony with intimate acoustic chamber ambience.' },
      { name: 'Gengetone Nairobi Sheng Energy', tag: 'Street Sheng Party Bounce', pitch: 0, tune: 12, verb: 20, drive: 55, desc: 'Raw Nairobi street party cadence with saturated preamp drive and aggressive compressor pumping.' },
      { name: 'Sauti Sol 4-Part Kenyan Harmony', tag: 'Polyphonic Soul Harmonies', pitch: 0, tune: 25, verb: 55, drive: 15, desc: 'Rich acoustic 4-part polyphonic harmonies with organic room depth and warm acoustic guitar resonance.' },
      { name: 'Zuchu Swahili Coastal Harmony', tag: 'Coastal Taarab Grace', pitch: 1, tune: 10, verb: 48, drive: 18, desc: 'Sweet Taarab-infused melodic runs with shimmering plate reverb and delicate vocal flutter.' },
    ]
  },
  {
    category: 'North African & Maghreb',
    company: 'Barclay Records / Casablanca Urban / Cairo Sound Stage',
    hardware: 'Neumann U47 + Teletronix LA-2A + Lexicon 224',
    archetypes: [
      { name: 'Cheb Khaled King of Rai Microtone', tag: 'Algerian Rai Microtonal Runs', pitch: 0, tune: 20, verb: 55, drive: 35, desc: 'Emotive Algerian Rai vocal runs with quarter-tone inflections and analog tape slap.' },
      { name: 'El Grande Toto Casablanca Trap-Rai', tag: 'Maghreb Trap Auto-Tune', pitch: -1, tune: 3, verb: 45, drive: 40, desc: 'Auto-tuned Maghreb trap delivery with Moroccan Darija flow and dark sub-room depth.' },
      { name: 'Gnawa Master Guembri Trance Chants', tag: 'Trance Pentatonic Chants', pitch: -2, tune: 45, verb: 70, drive: 15, desc: 'Spiritual hypnotic pentatonic chanting with iron qraqeb echoes and cavernous sanctuary reflections.' },
      { name: 'Cairo Mahraganat Street Auto-Tune', tag: 'Hyper-Overdriven Electro-Shaabi', pitch: 2, tune: 0, verb: 30, drive: 80, desc: 'Hyper-saturated overdriven street autotune and festive shouting over fast electronic Shaabi beats.' },
    ]
  },
  {
    category: 'Words Only & Acapella Isolators',
    company: 'MusicMotion Neural Stem Extraction Engine',
    hardware: 'Neural Mid-Side Harmonic De-Mixer + Spectral Vocal Gate + Speech Formant Exciter',
    archetypes: [
      { name: 'Papaoutai Viral Afro-Acapella Extractor', tag: 'French Pop Acapella Isolate', pitch: 0, tune: 15, verb: 20, drive: 15, desc: 'Strips heavy electro-pop synth bass & kicks, isolating pristine French vocal words ("Papaoutai") ready for Afrobeat drums!' },
      { name: 'Pure Spoken Words & Syllable Soloist', tag: '100% Drum Transient Mute', pitch: 0, tune: 30, verb: 10, drive: 12, desc: 'Completely eliminates drum kicks, 808s, and cymbals, delivering 100% pure voice syllables and lyrics.' },
      { name: 'Studio Acapella Master Isolator', tag: 'Zero-Bleed Vocal Stem', pitch: 0, tune: 20, verb: 25, drive: 18, desc: 'Professional acapella extraction focusing on center vocal channel with high speech intelligibility.' },
      { name: 'Acapella Harmony & Chants Extractor', tag: 'Multi-Voice Choir Isolate', pitch: 0, tune: 15, verb: 40, drive: 14, desc: 'Preserves full stereo backing vocals, harmonies, and adlibs while silencing the underlying beat.' },
      { name: 'Radio Broadcast Speech Formant Cleaner', tag: 'Speech Formant Clarity', pitch: 0, tune: 25, verb: 12, drive: 22, desc: 'Enhances 2.8kHz-4kHz speech formants, suppresses background noise, and creates ultra-crisp spoken vocal presence.' },
    ]
  },
  {
    category: 'Pop & Billboard',
    company: 'Republic Records / Max Martin Studio',
    hardware: 'Sony C-800G + Neve 1073 + Tube-Tech CL1B + Bricasti M7',
    archetypes: [
      { name: 'Ariana Whistle & Air Sheen', tag: 'High-Octave Air', pitch: 2, tune: 12, verb: 45, drive: 15, desc: 'Ultra-crisp 16kHz air band boost with smooth de-essing and pristine silk sheen.' },
      { name: 'The Weeknd 80s Dark Lush', tag: 'Vintage Echo & Plate', pitch: 0, tune: 8, verb: 60, drive: 30, desc: 'Heavy EMT 140 plate reverberation with chorus widening and dark 80s harmonic tape warmth.' },
      { name: 'Dua Lipa Disco Sparkle', tag: 'Punchy Radio Lead', pitch: 0, tune: 15, verb: 30, drive: 25, desc: 'Tight dynamic FET compression with aggressive 3kHz forward presence and sparkling stereo double.' },
      { name: 'Billie Eilish Intimate ASMR', tag: 'Proximity Whisper', pitch: -1, tune: 25, verb: 15, drive: 10, desc: 'Extreme proximity effect, ultra-sensitive de-essing, binaural whispering close-mic presence.' },
      { name: 'Taylor Acoustic Golden Sheen', tag: 'Harmonic Tube Warmth', pitch: 0, tune: 35, verb: 35, drive: 12, desc: 'Warm Telefunken 251 valve harmonic saturation with gentle Pultec 10k air lift.' },
      { name: 'Bruno Mars 70s Analog Soul', tag: 'Vintage Tape Saturation', pitch: 0, tune: 40, verb: 40, drive: 45, desc: 'Studer A800 15ips tape saturation with warm chamber acoustics and natural dynamic flex.' },
      { name: 'Olivia Rodrigo Pop-Punk Bite', tag: 'Midrange Drive', pitch: 1, tune: 10, verb: 25, drive: 50, desc: 'Distorted double-tracking with aggressive 1176 British mode compression.' },
      { name: 'Post Malone Tremolo Shimmer', tag: 'LFO Pitch Vibrato', pitch: 0, tune: 6, verb: 55, drive: 20, desc: 'Rapid melodic vibrato modulation with wide stereo micro-pitch chorusing.' },
      { name: 'Harry Styles 60s British Chamber', tag: 'Abbey Road Space', pitch: 0, tune: 30, verb: 50, drive: 22, desc: 'Iconic Abbey Road Studio 2 acoustic echo chamber tone with smooth ribbon mic roll-off.' },
      { name: 'Rihanna Caribbean Sheen', tag: 'Crisp Island Brightness', pitch: 0, tune: 14, verb: 38, drive: 28, desc: 'Punchy forward clarity with slapback delay and subtle tape flutter.' },
      { name: 'Justin Bieber Modern R&B Pop', tag: 'Fast Pitch Tightness', pitch: 0, tune: 5, verb: 35, drive: 18, desc: 'Near-instantaneous Melodyne retune response with silky lexicon 480 digital reverb.' },
      { name: 'Lady Gaga Arena Anthem Choral', tag: 'Stadium Wall of Sound', pitch: 0, tune: 20, verb: 70, drive: 35, desc: 'Multi-layered stereo harmonizer with stadium hall reflections and bold high-mid projection.' }
    ]
  },
  {
    category: 'Hip-Hop & Trap',
    company: 'Cactus Jack / Epic Records / OVO Sound',
    hardware: 'Neumann U87 Ai + Avalon VT-737sp + Distressor EL8-X',
    archetypes: [
      { name: 'Travis Scott Cyber Distortion', tag: 'Hard Autotune + Flanger', pitch: -2, tune: 0, verb: 55, drive: 65, desc: '0ms hard retune speed through Roland Dimension D flanger and saturated guitar cabinet drive.' },
      { name: 'Playboi Carti Baby Voice Pitch', tag: 'Formant Shift Up (+4)', pitch: 4, tune: 0, verb: 30, drive: 40, desc: 'Radical +4 semitones formant transposition with bite-frequency clipping and fast stutter delay.' },
      { name: 'Drake Dark OVO Room', tag: 'Low-Pass Muffled Ambience', pitch: -1, tune: 12, verb: 50, drive: 20, desc: '4kHz low-pass muffled vocal bed layered with crisp center lead and subtle sub-octave.' },
      { name: 'Juice WRLD Emo-Trap Chorus', tag: 'Widened Doubler Spread', pitch: 0, tune: 5, verb: 48, drive: 35, desc: 'Emotional stereo micro-shift (+9 cents / -9 cents) with shimmering plate decay.' },
      { name: 'Future Supercharged Glitch', tag: 'Robotic Quantized Drift', pitch: -3, tune: 0, verb: 40, drive: 55, desc: 'Robotic quantizer with hard harmonic distortion and tempo-synced ping-pong feedback.' },
      { name: 'Lil Uzi Vert Hyper-Sparkle', tag: 'Bright Anime Lead', pitch: 2, tune: 2, verb: 45, drive: 30, desc: 'High-frequency harmonic exciter with hyper-tuned pitch stability and glossy digital air.' },
      { name: 'Kendrick Lamar Dual Persona Pitch', tag: 'Formant Modulation Double', pitch: -4, tune: 25, verb: 25, drive: 45, desc: 'Pitched-down alter-ego vocal track mixed parallel to natural lead with tape grit.' },
      { name: 'Young Thug Alien Formant Elastic', tag: 'Dynamic Pitch Stretch', pitch: 3, tune: 4, verb: 35, drive: 40, desc: 'Elastic pitch bending with vocal fry harmonic enhancement and crisp high-shelf boost.' },
      { name: 'Lil Baby Crisp Atlanta Punch', tag: 'Aggressive Opto-Comp', pitch: 0, tune: 7, verb: 22, drive: 28, desc: 'Punchy forward presence with fast attack 1176 FET limiting and tight room resonance.' },
      { name: 'Metro Boomin Sub-Vocal Drone', tag: 'Sub-Harmonic Growl', pitch: -12, tune: 0, verb: 65, drive: 75, desc: 'Full octave-down sub-bass vocal synthesis designed to rattle club subwoofers.' },
      { name: '21 Savage Cold Whisper Menace', tag: 'Dry Dead Room', pitch: -2, tune: 18, verb: 8, drive: 32, desc: 'Completely dry, in-your-face whisper compression with zero room reflections.' },
      { name: 'Gunna Drip Melodic Float', tag: 'Silk Autotune Glide', pitch: 1, tune: 3, verb: 42, drive: 15, desc: 'Effortless sliding pitch transitions with soft room convolution and high-end luster.' }
    ]
  },
  {
    category: 'R&B & Neo-Soul',
    company: 'Sony Music / Motown Records / Def Jam',
    hardware: 'AKG C12 + Manley VOXBOX + Teletronix LA-2A + Lexicon 224',
    archetypes: [
      { name: 'SZA Atmospheric Dream Haze', tag: 'Ethereal Space & Chorus', pitch: 0, tune: 18, verb: 65, drive: 15, desc: 'Vast shimmering space with subtle stereo pitch detuning and smooth low-mid warmth.' },
      { name: 'Frank Ocean Pitch Flutter', tag: 'Tape Wow & Flutter Drift', pitch: -1, tune: 22, verb: 40, drive: 28, desc: 'Vintage tape machine warble with gentle pitch modulation and nostalgic analog warmth.' },
      { name: 'Giveon Deep Velvet Baritone', tag: 'Sub-Harmonic Warmth', pitch: -3, tune: 30, verb: 30, drive: 20, desc: 'Rich 120Hz-250Hz proximity resonance tailored for deep baritone storytelling.' },
      { name: 'Summer Walker Lo-Fi Silk', tag: 'Mellow Tube Saturation', pitch: 0, tune: 14, verb: 45, drive: 22, desc: 'Silky smooth high-end attenuation with tube warmth and intimate vocal placement.' },
      { name: 'Daniel Caesar Organic Church Choral', tag: 'Cathedral Gospel Harmonies', pitch: 0, tune: 35, verb: 55, drive: 10, desc: 'Natural room acoustics with warm ribbon mic emulation and wide gospel ensemble spread.' },
      { name: 'Jhené Aiko Crystal Singing Bowl', tag: '432Hz Ambient Resonance', pitch: 1, tune: 16, verb: 75, drive: 8, desc: 'Ultra-pure ambient reverberation tailored to complement sound bath frequencies.' },
      { name: 'Brent Faiyaz Cold Independent Vibe', tag: 'Dry Close-Mic Presence', pitch: 0, tune: 10, verb: 20, drive: 35, desc: 'Minimal reverb, heavy opto-compression, raw and candid front-and-center vocal tone.' },
      { name: 'H.E.R. Soulful Dynamic Belt', tag: 'Pultec EQ Sweetening', pitch: 0, tune: 28, verb: 38, drive: 18, desc: 'Dynamic LA-2A optical leveling that preserves full emotional dynamic range.' },
      { name: 'Partynextdoor Dark Toxic Reverb', tag: 'Slurred Pitch Delay', pitch: -2, tune: 4, verb: 60, drive: 40, desc: 'Drenched in modulated digital delays with tuned autotune glide.' },
      { name: 'Kehlani Modern West Coast R&B', tag: 'Bright Punchy Lead', pitch: 0, tune: 12, verb: 32, drive: 24, desc: 'Bright radio polish with multi-band sidechain compression against the kick drum.' },
      { name: 'Leon Bridges Vintage Motown Mic', tag: 'RCA 44BX Ribbon Warmth', pitch: 0, tune: 45, verb: 35, drive: 50, desc: '1960s ribbon microphone frequency curve with natural harmonic clipping.' },
      { name: 'Snoh Aalegra Cinematic Velvet Noir', tag: 'Bond Soundtrack Elegance', pitch: 0, tune: 20, verb: 50, drive: 16, desc: 'Lush orchestral vocal treatment with smooth top-end roll-off and silky depth.' }
    ]
  },
  {
    category: 'Drill & UK',
    company: 'Warner Music UK / Atlantic UK / 0207 Def Jam',
    hardware: 'Shure SM7B + Chandler Limited TG2 + Empirical Labs Distressor',
    archetypes: [
      { name: 'Pop Smoke Heavy Sub Growl', tag: 'Gravel Throat Resonance', pitch: -4, tune: 15, verb: 25, drive: 60, desc: 'Deep chest resonance boost at 100Hz with gritty FET saturation and tight stereo double.' },
      { name: 'Central Cee Crisp Radio Sheen', tag: 'High-Velocity Clarity', pitch: 0, tune: 8, verb: 18, drive: 30, desc: 'Fast lyrical articulation with aggressive high-mid clarity and zero muddy build-up.' },
      { name: 'UK Drill 808 Pitch Slide Sync', tag: 'Gliding Pitch Shift', pitch: -2, tune: 2, verb: 30, drive: 45, desc: 'Pitched vocal chops timed to lock with sliding 808 sub-bass patterns.' },
      { name: 'Brooklyn Drill Octave Layer', tag: 'Lead + Sub Octave Blend', pitch: -12, tune: 5, verb: 28, drive: 50, desc: 'Parallel octave-down layer mixed under the main lead for intimidating vocal weight.' },
      { name: 'Russ Millions High Energy Drill', tag: 'Hyper-Compressed Sibilance', pitch: 1, tune: 6, verb: 20, drive: 38, desc: 'Heavy distressor distortion with pumping sidechain compression and bright bite.' },
      { name: 'Headie One Slang Flow Ambience', tag: 'Dark North London Echo', pitch: -1, tune: 14, verb: 42, drive: 26, desc: 'Subtle slapback delay with dark plate reflections capturing distinctive rhythmic cadences.' },
      { name: 'Digga D Aggressive Punch', tag: 'In-Your-Face Transients', pitch: 0, tune: 10, verb: 15, drive: 48, desc: 'Ultra-fast attack limiter bringing every breath and syllable to maximum impact.' },
      { name: 'Stormzy Grime Heavyweight', tag: 'British Abbey Road Punch', pitch: -1, tune: 20, verb: 32, drive: 36, desc: 'Booming presence with authoritative low-mids and stadium-scale room projection.' },
      { name: 'French Drill Phonk Pitch', tag: 'Filtered Lo-Fi Drive', pitch: -3, tune: 0, verb: 35, drive: 55, desc: 'Telephonic low-pass filtering combined with hard-tuned trap pitch glide.' },
      { name: 'Toronto Drill Dark Subdued', tag: 'Nocturnal Echo Chamber', pitch: -2, tune: 9, verb: 48, drive: 25, desc: 'Dark ambient room reflections with subtle pitch instability.' },
      { name: 'Dutch Drill Aggressive Saturation', tag: 'Overdriven Tube Mic', pitch: 0, tune: 11, verb: 22, drive: 58, desc: 'Heavy harmonic distortion calibrated for aggressive 144 BPM drill tempos.' }
    ]
  },
  {
    category: 'Hyperpop & Glitch',
    company: 'PC Music / Atlantic Records / Mad Decent',
    hardware: 'Antares Auto-Tune Pro + Soundtoys Little AlterBoy + iZotope Trash 2',
    archetypes: [
      { name: '100 Gecs Chipmunk Bitcrush', tag: 'Bitcrushed Formant (+7)', pitch: 7, tune: 0, verb: 20, drive: 85, desc: '8-bit sample rate reduction with extreme +7 semitones formant transposition.' },
      { name: 'SOPHIE Metallic Resonance Sheen', tag: 'Ring Modulator Gloss', pitch: 3, tune: 0, verb: 35, drive: 70, desc: 'Hyper-resonant comb filtering creating physical acoustic metallic sheen.' },
      { name: 'Charli XCX Cyber Pop Stutter', tag: '16th Note Glitch Chopper', pitch: 2, tune: 0, verb: 40, drive: 45, desc: 'Quantized tempo-synced vocal gating with neon-bright formant tuning.' },
      { name: 'Glaive Teen Angst Saturated Peak', tag: 'Overdriven Pre-Amp Clip', pitch: 1, tune: 4, verb: 32, drive: 65, desc: 'High-gain clipping with emotional dynamic spikes and bright digital EQ.' },
      { name: 'Ericdoa Melodic Sparkle Swarm', tag: 'Multi-Voice Micro-Chorusing', pitch: 2, tune: 0, verb: 44, drive: 35, desc: '6-voice stereo micro-pitch detuning with sparkling high-end harmonics.' },
      { name: 'PinkPantheress Drum & Bass Speed', tag: 'Sped Up (+25%) Airy Lead', pitch: 3, tune: 12, verb: 38, drive: 12, desc: 'Light, nimble bedroom-pop tone adapted for fast 170 BPM UK Garage breaks.' },
      { name: 'Bladee Autotune Frost Ethereal', tag: 'Scandinavian Ice Verb', pitch: -1, tune: 0, verb: 70, drive: 30, desc: 'Infinite decay frozen reverb with auto-tuned pitch quantization.' },
      { name: 'Ecco2k Angelic Falsetto Laser', tag: 'Formant Laser Boost', pitch: 5, tune: 0, verb: 60, drive: 25, desc: 'Ultra-high pitch register with pristine digital harmonics and zero mud.' },
      { name: 'Dorian Electra Gender-Bend Shift', tag: 'Dynamic Formant Automation', pitch: -5, tune: 0, verb: 30, drive: 50, desc: 'Deep baritone down-pitch contrasting with piercing high-formant doubles.' },
      { name: 'Drain Gang Lo-Fi Auto-Tune', tag: 'Swedish Cold Atmosphere', pitch: -2, tune: 0, verb: 65, drive: 40, desc: 'Heavy digital quantization submerged in cavernous icy reflections.' },
      { name: 'Anime Nightcore Sparkle Vocal', tag: '+4 Semitones Crystal Air', pitch: 4, tune: 0, verb: 25, drive: 20, desc: 'Clean pitch transposition with sweet high-register harmonic polish.' },
      { name: 'Midwxst Aggressive Digicore', tag: 'Square Wave Distortion', pitch: 1, tune: 0, verb: 28, drive: 75, desc: 'Square-wave saturation mixed with hyper-fast autotune transitions.' }
    ]
  },
  {
    category: 'Rock & Alternative',
    company: 'Interscope Records / Geffen / Sub Pop',
    hardware: 'Shure SM57 + Helios Type 69 + Fairchild 670 + Tape Echo',
    archetypes: [
      { name: 'Kurt Cobain Raw Grunge Slap', tag: 'Analog Console Overdrive', pitch: 0, tune: 50, verb: 25, drive: 65, desc: 'Warm analog console preamp clipping with classic 120ms tape slapback delay.' },
      { name: 'Deftones Ethereal Whisper Drive', tag: 'Shoegaze Reverb Wash', pitch: -1, tune: 40, verb: 75, drive: 45, desc: 'Intimate breathy vocals engulfed in massive distorted shoegaze reverb.' },
      { name: 'Arctic Monkeys Vintage Slap Tape', tag: 'Space Echo RE-201', pitch: 0, tune: 45, verb: 35, drive: 40, desc: 'Roland Space Echo tape flutter with British mid-frequency attitude.' },
      { name: 'Chester Bennington Aggressive Scream', tag: 'Parallel Distressor Squeeze', pitch: 0, tune: 35, verb: 30, drive: 70, desc: 'Parallel all-buttons-in limiter adding brutal harmonic bite without losing intelligibility.' },
      { name: 'Thom Yorke Haunting Radiohead Space', tag: 'Spring Reverb Resonance', pitch: 0, tune: 45, verb: 60, drive: 20, desc: 'Vintage spring reverb tank rattle with melancholy high-pass filter curve.' },
      { name: 'Julian Casablancas Lo-Fi Telephone', tag: 'Bandpass Filtered Peaking', pitch: 0, tune: 50, verb: 15, drive: 55, desc: 'Narrow 400Hz-3.5kHz bandpass filter emulating cheap practice amp distortion.' },
      { name: 'Hayley Williams Power Pop-Punk Sheen', tag: 'Punchy Solid-State EQ', pitch: 0, tune: 15, verb: 30, drive: 32, desc: 'Crisp, articulate top-end with high dynamic punch and stereo double tracking.' },
      { name: 'Jack White Raw Garage Fuzz', tag: 'Silvertone Tube Amp Drive', pitch: 0, tune: 50, verb: 20, drive: 80, desc: 'Pure harmonic fuzz saturation straight into a vintage 1960s 12-inch guitar speaker.' },
      { name: 'The Cure Goth Chorus Flanger', tag: '80s Stereo Flange Wash', pitch: 0, tune: 45, verb: 65, drive: 18, desc: 'Lush stereo flanging with long melancholic hall decay and dark EQ curve.' },
      { name: 'Fiona Apple Raw Dynamic Intimacy', tag: 'Unprocessed Ribbon Realism', pitch: 0, tune: 50, verb: 22, drive: 12, desc: 'Natural Coles 4038 ribbon microphone captures with pure honest dynamics.' },
      { name: 'Tame Impala Psychedelic Phase', tag: 'Slow Rotary & Phaser', pitch: 0, tune: 30, verb: 55, drive: 35, desc: 'Slow sweeping phaser pedal with tape echo and nostalgic 70s drum room bleed.' }
    ]
  },
  {
    category: 'Electronic & Dance',
    company: 'Spinnin Records / Armada / OWSLA / Ed Banger',
    hardware: 'Sennheiser MD 421 + TC-Helicon VoiceLive + Eventide H3000',
    archetypes: [
      { name: 'Daft Punk Prism Vocoder', tag: 'Sonnox 32-Band Vocoder', pitch: 0, tune: 0, verb: 45, drive: 50, desc: 'Iconic robotic harmonic vocoder driven by analog sawtooth synth carrier wave.' },
      { name: 'Fred Again Intimate Phone Chop', tag: 'Low-Pass Voice Memo Tone', pitch: -1, tune: 12, verb: 40, drive: 25, desc: 'Atmospheric smartphone voice memo timbre layered over driving club bass.' },
      { name: 'Skrillex Monster Formant Screamer', tag: 'Aggressive Comb Filter Sweep', pitch: -5, tune: 0, verb: 35, drive: 85, desc: 'High-speed formant filter sweeps mixed with heavy harmonic wavefolding.' },
      { name: 'Avicii Festival Anthem Choral', tag: 'Massive Choral Stack', pitch: 0, tune: 8, verb: 60, drive: 20, desc: '16-voice stereo chorus with massive hall reverb designed for 80,000-person festival singalongs.' },
      { name: 'Bicep Ambient UK Breakbeat Echo', tag: 'Endless Modulated Tail', pitch: 2, tune: 15, verb: 70, drive: 18, desc: 'Vocal chops filtered through infinite tape delay loops and lush analog stereo width.' },
      { name: 'Disclosure House Groove Chop', tag: 'Sidechained Short Verb', pitch: 1, tune: 5, verb: 25, drive: 30, desc: 'Punchy vocal chops heavily ducked by 4x4 kick drum sidechain with crisp high-end.' },
      { name: 'Calvin Harris Radio Dance Polish', tag: 'Maximalist Pop Brightness', pitch: 0, tune: 6, verb: 35, drive: 22, desc: 'Ultra-wide stereo doubler with bright SSL G-Master bus compression.' },
      { name: 'Kavinsky 80s Cyberpunk Vocoder', tag: 'Dark Synthwave Robot', pitch: -3, tune: 0, verb: 50, drive: 60, desc: 'Vintage Korg VC-10 vocoder with heavy analog detune and retro neon ambience.' },
      { name: 'Peggy Gou Korean House Hook', tag: 'Cool Chic Tape Warmth', pitch: 0, tune: 16, verb: 38, drive: 20, desc: 'Effortlessly cool, low-key melodic delivery with vintage analog console warmth.' },
      { name: 'Fisher Catchy Tech-House Hook', tag: 'Mono Punch Squeeze', pitch: -2, tune: 0, verb: 15, drive: 45, desc: 'Mono-focused high-impact vocal punch cutting cleanly through heavy rolling basslines.' },
      { name: 'Zedd Precision Pop Laser', tag: 'Pristine Digital Tuning', pitch: 0, tune: 2, verb: 32, drive: 15, desc: 'Surgically aligned time and pitch correction with laser-focused high-frequency shine.' },
      { name: 'Four Tet Organic Micro-Loop', tag: 'Pitched Granular Shimmer', pitch: 3, tune: 25, verb: 55, drive: 10, desc: 'Granular pitch scattering creating gentle shimmering ambient vocal textures.' }
    ]
  },
  {
    category: 'Cinematic & Choral',
    company: 'Sony Classical / Hollywood Scoring Stage / Abbey Road',
    hardware: 'Decca Tree Neumann M50 + Lexicon 960L + AMS Neve DFC',
    archetypes: [
      { name: 'Hans Zimmer Dark Dune Drone', tag: 'Deep Throat Bass Drone', pitch: -12, tune: 50, verb: 85, drive: 40, desc: 'Sub-harmonic chanting filtered through massive desert atmospheric acoustic impulse.' },
      { name: 'Gregorian Monastery Monks', tag: 'Ancient Abbey Stone Reverb', pitch: -5, tune: 50, verb: 80, drive: 5, desc: 'Authentic 6-second stone cathedral reverberation with pure modal acoustic chanting.' },
      { name: 'Blade Runner 2049 Replicant Voice', tag: 'Synthesized Android Tone', pitch: -4, tune: 0, verb: 65, drive: 55, desc: 'Cold synthetic speech harmonics blended with Yamaha CS-80 analog synth reflections.' },
      { name: 'Siren Mythological Echo', tag: 'Infinite Shimmering Decay', pitch: 2, tune: 20, verb: 90, drive: 10, desc: 'Otherworldly female choir tone echoing across misty ocean canyon convolution spaces.' },
      { name: 'Cathedral Solo Soprano', tag: 'Pristine 7s Hall Reflection', pitch: 4, tune: 40, verb: 75, drive: 2, desc: 'Solo soprano voice soaring inside historic European cathedral with zero digital artifacts.' },
      { name: 'Trailer Epic Braam Impact Voice', tag: 'Sub-Drop Harmonic Climax', pitch: -8, tune: 10, verb: 60, drive: 80, desc: 'Trailer brass hybrid roar created from distorted vocal fry and sub-octave transformers.' },
      { name: 'Nordic Folk Kulning Call', tag: 'High Meadow Projection', pitch: 3, tune: 35, verb: 65, drive: 15, desc: 'Traditional Scandinavian herding call with piercing high-register projection.' },
      { name: 'Enya Celtic Ethereal Multi-Stack', tag: '100-Track Choral Layer', pitch: 0, tune: 15, verb: 85, drive: 8, desc: 'Dozens of whispering vocal overdubs creating a soft velvet cloud of harmonic sound.' },
      { name: 'Dark Witchcraft Whispers', tag: 'Binaural Surround Creep', pitch: -2, tune: 30, verb: 50, drive: 35, desc: 'Multi-directional binaural whispering creeping from left, right, and behind listener ears.' },
      { name: 'Anime Mecha Pilot Radio', tag: 'Cockpit Intercom Static', pitch: 1, tune: 20, verb: 20, drive: 60, desc: 'Military cockpit intercom with bandpass squelch and analog radio noise.' },
      { name: 'Opera Diva Dramatic Projection', tag: 'Natural Bel Canto Power', pitch: 1, tune: 50, verb: 55, drive: 5, desc: 'Pure unassisted vocal projection filling a 3,000-seat opera auditorium.' }
    ]
  },
  {
    category: 'Retro & Vintage',
    company: 'Stax / Chess Records / Abbey Road REDD / Sun Studio',
    hardware: 'RCA 77-DX + Ampex 350 + EMT 140 Plate + Western Electric 300B',
    archetypes: [
      { name: '1950s Sun Studio Slapback', tag: 'Rockabilly Slap Tape', pitch: 0, tune: 50, verb: 30, drive: 50, desc: 'Iconic Memphis rockabilly slapback delay created by two synced reel-to-reel tape decks.' },
      { name: '1960s Abbey Road REDD Console', tag: 'Beatles British Valve', pitch: 0, tune: 50, verb: 45, drive: 35, desc: 'Tube amplifier warmth from EMI REDD.51 console paired with Fairchild 660 mono limiter.' },
      { name: '1970s Motown Velvet Saturation', tag: 'Detroit Hitsville USA', pitch: 0, tune: 50, verb: 40, drive: 40, desc: 'Custom 8-channel tube console overdrive with euphonic vocal saturation.' },
      { name: '1920s Gramophone 78 RPM Shellac', tag: 'Needle Crackle & Horn Bandpass', pitch: 0, tune: 50, verb: 10, drive: 70, desc: 'Acoustic horn recording bandwidth (500Hz-2.5kHz) with authentic shellac disc crackle.' },
      { name: '1980s Walkman Cassette Flutter', tag: 'Type I Ferric Tape Degrade', pitch: -1, tune: 40, verb: 25, drive: 45, desc: 'Cassette tape compression with gentle high-frequency roll-off and motor battery pitch sag.' },
      { name: '1930s Telephone Receiver Carbon Mic', tag: '300Hz-3kHz Bandpass Squelch', pitch: 0, tune: 50, verb: 5, drive: 65, desc: 'Carbon microphone diaphragm distortion with harsh harmonic resonance.' },
      { name: '1970s Dub Reggae King Tubby Echo', tag: 'Spring Reverb High-Pass Dub', pitch: -1, tune: 50, verb: 75, drive: 55, desc: 'High-pass filtered spring reverb thunderclaps with Roland Space Echo feedback loops.' },
      { name: '1940s Big Band Radio Broadcast', tag: 'AM Radio Valve Compression', pitch: 0, tune: 50, verb: 18, drive: 48, desc: 'Warm vacuum tube radio transmitter limiter with nostalgic midrange bloom.' },
      { name: '1990s MiniDisc Digital Artifacts', tag: 'ATRAC 1 Compression Glitch', pitch: 0, tune: 25, verb: 20, drive: 30, desc: 'Early lossy digital psychoacoustic compression giving unique crisp 90s edge.' },
      { name: '1960s French Ye-Ye Pop Echo', tag: 'Binson Echorec Magnetic Disk', pitch: 1, tune: 45, verb: 45, drive: 30, desc: 'Italian magnetic disk echo machine with rhythmic multi-head reflections.' },
      { name: '1950s Blue Note Jazz Club Booth', tag: 'Rudy Van Gelder Secret Hack', pitch: 0, tune: 50, verb: 32, drive: 25, desc: 'Intimate Hackensack living room acoustic with warm Neumann U47 tube magic.' }
    ]
  }
];

// Generate over 100 complete, fully detailed Vocal Models
export const ALL_VOCAL_MODELS: VocalModel[] = CATEGORY_TEMPLATES.flatMap((catGroup, groupIndex) =>
  catGroup.archetypes.map((arch, archIndex) => {
    const id = `vocal-${groupIndex * 15 + archIndex + 1}`;
    const popScore = 99 - Math.floor((groupIndex * 8 + archIndex * 1.5) % 25);
    return {
      id,
      name: arch.name,
      companyOrLabel: catGroup.company,
      category: catGroup.category,
      vocalistArchetype: arch.tag,
      description: arch.desc,
      hardwarePedigree: catGroup.hardware,
      settings: {
        pitchShift: arch.pitch,
        autotuneSpeed: arch.tune,
        formantShift: arch.pitch > 0 ? arch.pitch : 0,
        saturationDrive: arch.drive,
        reverbWet: arch.verb / 100,
        reverbDecay: Math.max(1.2, arch.verb * 0.08),
        airBandBoost: arch.pitch >= 0 ? 3.5 : 1.0,
        deEsserAmount: 60,
        doublerWidth: arch.verb > 40 ? 1.4 : 1.1,
        chorusRate: 0.8,
        compressionRatio: arch.drive > 40 ? '8:1' : '4:1',
      },
      tags: [arch.tag, catGroup.category.split(' ')[0], catGroup.company.split('/')[0].trim()],
      color: arch.drive > 50 ? '#ff3844' : arch.verb > 50 ? '#6366f1' : '#ec4899',
      popularityScore: popScore,
    };
  })
);
