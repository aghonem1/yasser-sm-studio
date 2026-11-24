import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, continueRender, delayRender, spring} from 'remotion';
import TL from './timeline_ep06.json';
import EX from '../excerpts.json';
import {Icon, Mark, Strike, StrikeIn} from '../lib/icons';

// =====================================================================================
// One Word · 06 · birr — same design system as Ep04 (reference)
//  - a person is a point of light; justice = the scale on the first step, kindness (birr) = the step above it
//  - crisp vector only: no blur filters; halos are radial gradients
//  - one focal graphic per scene, centred on (540, 975); fixed zones:
//    chrome 230–330 · card/word 372–700 · graphic 700–1260 · captions 1290–1490 · bar 1512
// =====================================================================================

export const FPS = 30;
export const W = 1080, H = 1920;
type Word = [string, number, number];
const LINES: {text: string; words: Word[]; start: number; end: number}[] = (TL as any).lines;
const ST = LINES.map((l) => l.start);
const VEND: number = (TL as any).voice_end;
export const TOTAL: number = (TL as any).total;

const INK = '#070c17', NAVY = '#0d172a', GOLD = '#c9a457', GOLDL = '#f1d08a', CREAM = '#efe7d6', SLATE = '#9fb2d0', SAND = '#d9b48a', BROWN = '#8c6629';
const CX = 540, CY = 975;

// ---------- fonts ----------
const FONTS: [string, string, string?, string?][] = [
  ['YFCinzel', 'YF-Cinzel.ttf'], ['YFCinzelB', 'YF-CinzelB.ttf'], ['YFSpectralSB', 'YF-SpectralSB.ttf'],
  ['SpectralFull', 'Spectral-SemiBold-full.ttf'], ['YFCormIt', 'YF-CormorantIt.ttf'], ['CormFull', 'CormorantGaramond-Italic.ttf', 'italic', '600'],
  ['YFPlex', 'YF-Plex.ttf'], ['Amiri', 'Amiri-Bold.ttf'], ['AmiriQuran', 'AmiriQuran.ttf'], ['SchB', 'ScheherazadeNew-Bold.ttf'],
];
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  Promise.all(FONTS.map(([fam, file, style, weight]) => {
    const f = new FontFace(fam, `url(${staticFile('fonts/' + file)})`, {style: style ?? 'normal', weight: weight ?? 'normal'});
    return f.load().then((ff) => (document as any).fonts.add(ff));
  })).then(() => continueRender(h)).catch((e) => {console.error(e); continueRender(h);});
}
const F = {cinzel: 'YFCinzel', cinzelB: 'YFCinzelB', body: 'YFSpectralSB, SpectralFull', it: 'YFCormIt, CormFull', plex: 'YFPlex', ar: 'Amiri', quran: 'AmiriQuran', arw: 'SchB, Amiri'};

// ---------- easing / timing ----------
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
const inOut = (x: number) => {x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;};
const outBack = (x: number) => {x = clamp(x); const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);};
const k = (t: number, a: number, d: number, e: (x: number) => number = outCubic) => e((t - a) / d);
const win = (t: number, a: number, b: number, fi = 0.35, fo = 0.25) => (t < a || t > b ? 0 : clamp(Math.min(fi ? (t - a) / fi : 1, fo ? (b - t) / fo : 1)));
const norm = (s: string) => s.toLowerCase().replace(/[,.?'…“”:]/g, '');
const wt = (i: number, w: string) => {for (const [x, s] of LINES[i].words) if (norm(x).startsWith(w)) return s; return ST[i];};
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------- vector primitives ----------
const star8 = (cx: number, cy: number, R: number, rot = 0) => {
  const p: string[] = []; const ri = R * 0.7654;
  for (let j = 0; j < 16; j++) {const a = rot + (j * Math.PI) / 8 - Math.PI / 2; const r = j % 2 ? ri : R; p.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);}
  return 'M' + p.join(' L') + ' Z';
};
const Line: React.FC<{d: string; p: number; w?: number; c?: string; o?: number; dash?: string}> = ({d, p, w = 2, c = GOLD, o = 0.8, dash}) =>
  p <= 0 ? null : dash ? <path d={d} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeDasharray={dash} opacity={o * clamp(p * 3)}
    style={{clipPath: `inset(0 ${(1 - clamp(p)) * 100}% 0 0)`}} />
    : <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(p)} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={o} />;
// a person = a point of light (crisp core + gradient halo)
const Light: React.FC<{x: number; y: number; r?: number; c?: string; o?: number; halo?: number; cool?: boolean}> = ({x, y, r = 7, c = CREAM, o = 1, halo = 1, cool}) =>
  o <= 0.001 ? null : (
    <g opacity={o}>
      {halo > 0 && <circle cx={x} cy={y} r={r * 5} fill={cool ? 'url(#haloC)' : 'url(#haloW)'} opacity={halo} />}
      <circle cx={x} cy={y} r={r} fill={c} />
      <circle cx={x - r * 0.28} cy={y - r * 0.28} r={r * 0.38} fill="#fff" opacity={0.55} />
    </g>
  );
const Defs = () => (
  <defs>
    <radialGradient id="haloW"><stop offset="0" stopColor={GOLDL} stopOpacity={0.55} /><stop offset="0.35" stopColor={GOLDL} stopOpacity={0.16} /><stop offset="1" stopColor={GOLDL} stopOpacity={0} /></radialGradient>
    <radialGradient id="haloC"><stop offset="0" stopColor={SLATE} stopOpacity={0.5} /><stop offset="0.35" stopColor={SLATE} stopOpacity={0.14} /><stop offset="1" stopColor={SLATE} stopOpacity={0} /></radialGradient>
    <linearGradient id="goldF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6dfa3" /><stop offset="0.55" stopColor="#d9ac55" /><stop offset="1" stopColor="#a87a2c" /></linearGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" /><feColorMatrix type="saturate" values="0" /></filter>
  </defs>
);
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}><Defs />{children}</svg>
);
// masked line reveal for type
const Reveal: React.FC<{p: number; style?: React.CSSProperties; children: React.ReactNode}> = ({p, style, children}) => (
  <div style={{position: 'absolute', overflow: 'hidden', paddingBottom: 10, ...style}}>
    <div style={{transform: `translateY(${(1 - p) * 105}%)`, opacity: clamp(p * 1.6)}}>{children}</div>
  </div>
);
const goldText: React.CSSProperties = {background: 'linear-gradient(180deg,#f8e4ad 0%,#e3b862 48%,#b4832f 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'};

// ---------- background ----------
const Background: React.FC<{t: number; dim: number}> = ({t, dim}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${INK} 0%, ${NAVY} 46%, ${INK} 100%)`}}>
    <div style={{position: 'absolute', left: -240, top: 420, width: 1560, height: 1100,
      background: 'radial-gradient(closest-side, rgba(40,62,104,.55) 0%, rgba(40,62,104,0) 100%)', opacity: 1 - 0.5 * dim}} />
    <div style={{position: 'absolute', left: -560, top: 1180, width: 2200, height: 1200,
      background: 'radial-gradient(closest-side, rgba(222,166,82,.30) 0%, rgba(222,166,82,.10) 45%, rgba(222,166,82,0) 100%)', opacity: (1 - 0.75 * dim) * (0.9 + 0.1 * Math.sin(t * 0.6))}} />
    <Svg><rect width={W} height={H} filter="url(#grain)" opacity={0.045} /></Svg>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(7,12,23,0) 52%, rgba(4,7,14,.78) 100%)'}} />
  </AbsoluteFill>
);
const Sweep: React.FC<{t: number; t0: number; d?: number}> = ({t, t0, d = 0.9}) => {
  const p = (t - t0) / d; if (p <= 0 || p >= 1) return null;
  return <AbsoluteFill style={{mixBlendMode: 'screen', opacity: Math.sin(p * Math.PI) * 0.55,
    background: `linear-gradient(105deg, rgba(0,0,0,0) ${mix(-30, 100, inOut(p))}%, rgba(241,208,138,.28) ${mix(-15, 115, inOut(p))}%, rgba(0,0,0,0) ${mix(0, 130, inOut(p))}%)`}} />;
};

// ---------- chrome ----------
const Chrome: React.FC<{t: number; bar?: boolean}> = ({t, bar = true}) => (
  <AbsoluteFill>
    <div style={{position: 'absolute', top: 236, width: W, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24}}>
      <div style={{width: 170, height: 1.5, background: `linear-gradient(90deg, ${GOLD}00, ${GOLD})`}} />
      <div style={{fontFamily: F.cinzelB, fontSize: 32, letterSpacing: 11, color: GOLD}}>YASSER FARES</div>
      <div style={{width: 170, height: 1.5, background: `linear-gradient(90deg, ${GOLD}, ${GOLD}00)`}} />
    </div>
    <div style={{position: 'absolute', top: 290, width: W, textAlign: 'center', fontFamily: F.cinzel, fontSize: 23, letterSpacing: 7, color: CREAM, opacity: 0.72}}>
      ONE WORD &nbsp;·&nbsp; 06 &nbsp;·&nbsp; FROM THE MIRROR</div>
    {bar && <div style={{position: 'absolute', top: 1512, left: 160, width: W - 320, height: 2, background: 'rgba(201,164,87,.18)', borderRadius: 2}}>
      <div style={{width: `${clamp(t / VEND) * 100}%`, height: 2, background: GOLDL, borderRadius: 2}} /></div>}
  </AbsoluteFill>
);

// ---------- verse card ----------
const Card: React.FC<{t: number; t0: number; t1: number; refTxt: string; ar: string; hl: number[]; lines: string[]; fs?: number; lh?: number}> = ({t, t0, t1, refTxt, ar, hl, lines, fs = 58, lh = 108}) => {
  const a = win(t, t0, t1, 0.35, 0.3); if (a <= 0) return null;
  const s = k(t, t0, 0.6, outExpo); const words = ar.split(' ');
  return (
    <div style={{position: 'absolute', top: 384, left: 96, width: 888, opacity: a, transform: `translateY(${(1 - s) * 28}px)`,
      background: 'linear-gradient(180deg,#f6eedc,#ece0c4)', borderRadius: 14, padding: '22px 38px 24px', textAlign: 'center',
      boxShadow: `inset 0 0 0 1.5px ${GOLD}, inset 0 0 0 7px #f3e9d3, inset 0 0 0 8px ${GOLD}77, 0 26px 60px rgba(0,0,0,.55)`}}>
      <div style={{fontFamily: F.cinzelB, fontSize: 23, letterSpacing: 6, color: BROWN}}>{refTxt}</div>
      <div dir="rtl" lang="ar" style={{fontFamily: F.quran, fontSize: fs, lineHeight: `${lh}px`, color: NAVY, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', columnGap: 16}}>
        <span style={{color: BROWN}}>{'﴿'}</span>
        {words.map((w, j) => {const p = k(t, t0 + 0.2 + 0.1 * j, 0.45, outCubic);
          if (w === '|') return <span key={j} style={{display: 'inline-block', opacity: p, color: BROWN, fontFamily: F.ar, fontSize: fs * 0.62}}>{'۝'}</span>;
          return <span key={j} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 10}px)`, color: hl.includes(j) ? '#a06a0c' : NAVY}}>{w}</span>;})}
        <span style={{color: BROWN}}>{'﴾'}</span>
      </div>
      <div style={{fontFamily: F.it, fontSize: 35, lineHeight: 1.2, color: '#2c3550'}}>{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
    </div>
  );
};

// ---------- captions: balanced rows, words revealed as spoken ----------
const KEY: Record<number, string> = {1: 'more.', 2: 'word:', 3: 'birr.', 4: 'kindness.', 5: 'kindness', 6: 'fought', 7: 'homes.”', 8: 'Two', 9: 'justice.',
  10: 'kindness.', 11: 'harming', 12: 'help', 13: 'balance', 14: 'warmth.', 15: 'hard', 16: 'wrong,', 17: 'birr.', 18: 'just.', 19: 'further:', 20: 'goodwill,', 21: 'fair.'};
const rows = (ws: Word[], key: string): Word[][] => {
  const L = (w: string) => (w === key ? 1.4 : 1) * w.length + 1; const tot = ws.reduce((s, w) => s + L(w[0]), 0);
  if (tot <= 25) return [ws];
  let best = 1, bd = 1e9, acc = 0;
  for (let j = 1; j < ws.length; j++) {acc += L(ws[j - 1][0]); const d = Math.abs(acc - (tot - acc)); if (d < bd) {bd = d; best = j;}}
  return [ws.slice(0, best), ws.slice(best)];
};
const Caption: React.FC<{t: number; i: number}> = ({t, i}) => {
  const nxt = i + 1 < LINES.length ? ST[i + 1] - 0.1 : VEND - 0.05;
  const a = win(t, ST[i] - 0.12, nxt, 0.12, 0.16); if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 1290, left: 60, width: W - 120, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: a}}>
      {rows(LINES[i].words, KEY[i]).map((r, ri) => (
        <div key={ri} style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', columnGap: 15, height: 86}}>
          {r.map(([w, s], j) => {
            const p = k(t, s - 0.08, 0.28, outCubic); const key = w === KEY[i];
            return <span key={j} style={{fontFamily: key ? F.it : F.body, fontSize: key ? 88 : 62, lineHeight: '86px', fontStyle: key ? 'italic' : 'normal', fontWeight: key ? 600 : 400,
              display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 16}px)`, paddingRight: key ? 6 : 0,
              ...(key ? goldText : {color: CREAM}), filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.6))'}}>{w}</span>;
          })}
        </div>
      ))}
    </div>
  );
};


// =====================================================================================
// v2 (24 Nov, Ahmed: "premium motion, no overlaps"): same brand, new motion system.
//  - no generic cross-fades between scenes: every hand-off is a motivated transition
//    (zoom-through into a light, shared-object FLIP, tiles that become panels, panels that become the
//    pans of a scale, pull-back reveal), with sub-frame motion blur on the fast moves
//  - kinetic type: per-letter masked rises with stagger + tracking settle; exits leave upward, letters staggered
//  - springs for arrivals (overshoot + settle), quint in-out for camera moves, nothing linear
//  - 2.5D staircase (top / front / side faces), bespoke drawings (scale with chains, houses, cupped hands)
//  - strict zones, one element per slot, hand-offs are sequential (out finishes before in) → no overlaps
//
// STORYBOARD (line → picture → what it says). Through-line: a POINT OF LIGHT that climbs from the scale (FAIR)
// to the step above (BIRR), crosses the bridge between two homes, and climbs again at the end.
//  0 Don't stop at being fair     → frame 1: DON'T STOP / AT FAIR. over a 2.5D two-step staircase; the scale stands on
//                                   step 1 (FAIR) behind a rope barrier; on "stop" the rope unhooks and swings open
//  1 The Qur'an asks you for more → light from above falls on step 2; the point of light climbs a dotted path to it; "?" → MORE
//  2 It's one word:               → ONE WORD over step 2; the light on step 2 swells
//  3 birr                         → zoom-through into that light → بِرّ written right-to-left by a pen of light
//  4 Generous kindness            → "birr" / GENEROUS KINDNESS; warmth spreads behind the word
//  5–7 60:8 (verse window: calm)  → the word flies into the card (its own word in the verse lights up); under it
//                                   GOD DOES NOT FORBID (FORBID struck), then tiles JUSTICE ✓ | KINDNESS ✓, then who:
//                                   NOT FOUGHT YOU (swords struck) | NOT DRIVEN OUT (exit struck)
//  8 Two words, side by side      → the two tiles grow into two tall panels: قِسْط | بِرّ
//  9 / 10 qist: justice / birr: kindness → the named panel comes forward and lights, the other steps back
// 11 justice prevents harm        → left panel: an arrow of harm flies at a person (point of light) and breaks on a gold wall
// 12 kindness moves us to help    → right panel: cupped hands lift a person up
// 13 keeps the balance straight   → the panels fold down into the pans of one big scale; the beam rocks and settles level ✓
// 14 fills life with warmth       → a heart drops into each pan (still level), warm light rises behind the scale
// 15 hard part                    → push into darkness: THE HARD PART
// 16 if difference made kindness wrong → two homes (gold / slate: neighbours of different faiths), a bridge of light, a heart
//                                   crossing it; on "wrong" a red barrier slams down mid-bridge
// 17 the Qur'an would not have permitted birr → BUT THE QUR'AN PERMITS بِرّ ✓: the barrier breaks and falls, the heart
//                                   reaches the other home and its windows light up
// 18 So be just                   → pull back to the staircase: BE JUST, ✓ on the scale
// 19 Then go further              → THEN GO FURTHER: the point of light climbs to step 2 again
// 20 care, goodwill, active help  → ticked list, step 2 fills with light, a heart settles there
// 21 Don't stop at fair           → callback to frame 1: DON'T STOP / AT FAIR. returns over the open rope
// 22 a new word every day         → end card
// SILENT TEST: muted, the open rope + climbing light (go beyond fair), the struck FORBID, the two panels (scale vs. hands),
// the stopped arrow vs. the lift, the level scale filled with hearts and the barrier that breaks between two homes
// carry the argument. Each picture is tied to its own line.
// =====================================================================================
const RED = '#d9624f';
const quint = (x: number) => {x = clamp(x); return x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2;};
const outQuint = (x: number) => 1 - Math.pow(1 - clamp(x), 5);
const inQuint = (x: number) => Math.pow(clamp(x), 5);
const sp = (t: number, t0: number, damping = 13, stiffness = 140, mass = 0.9) =>
  t < t0 ? 0 : spring({frame: (t - t0) * FPS, fps: FPS, config: {damping, stiffness, mass}});
const lerp = mix;

// ---------- kinetic type ----------
// per-letter masked rise (in) and staggered lift (out); tracking settles from wide to set
const KType: React.FC<{text: string; t: number; tin: number; tout?: number; size: number; font?: string; color?: React.CSSProperties;
  ls?: number; gap?: number; italic?: boolean; weight?: number; lh?: number}> =
  ({text, t, tin, tout = 1e9, size, font = F.cinzelB, color = {color: CREAM}, ls = 0.08, gap = 0.028, italic, weight, lh = 1.15}) => {
  if (t < tin - 0.05 || t > tout + 0.6) return null;
  const chars = Array.from(text); const n = chars.length;
  const track = 1 - outQuint((t - tin) / 0.9);
  return (
    <span style={{display: 'inline-block', whiteSpace: 'pre', fontFamily: font, fontSize: size, lineHeight: `${size * lh}px`, fontStyle: italic ? 'italic' : 'normal',
      fontWeight: weight ?? (italic ? 600 : 400), letterSpacing: `${ls + 0.12 * track}em`}}>
      {chars.map((c, i) => {
        const pin = outQuint((t - tin - i * gap) / 0.55), pout = inQuint((t - tout - (n - 1 - i) * gap * 0.25) / 0.3);
        if (pin <= 0.001 || pout >= 0.999) return <span key={i} style={{display: 'inline-block', visibility: 'hidden'}}>{c === ' ' ? ' ' : c}</span>;
        return <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.14em 0.2em 0.24em', margin: '-0.14em -0.2em -0.24em'}}>
          <span style={{display: 'inline-block', transform: `translateY(${(1 - pin) * 140 - pout * 140}%)`, opacity: clamp(pin * 1.4) * (1 - pout), ...color}}>{c === ' ' ? ' ' : c}</span>
        </span>;
      })}
    </span>
  );
};
const Line1: React.FC<{y: number; children: React.ReactNode; x?: number; w?: number; align?: 'center' | 'left'}> = ({y, children, x = 0, w = W, align = 'center'}) =>
  <div style={{position: 'absolute', left: x, top: y, width: w, textAlign: align, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.55))'}}>{children}</div>;
const GOLDT: React.CSSProperties = goldText;

// ---------- drawings ----------
// 2.5D staircase: step 1 (front x 170–560, y 1080–1240), step 2 (front x 560–950, y 880–1240); depth (+60, −40)
const S1 = {x: 365, top: 1060}, S2 = {x: 785, top: 860};
const Stairs: React.FC<{p: number; glow2: number; lit1?: number}> = ({p, glow2, lit1 = 0}) => {
  const e = (d: string, q: number, w = 4, c = GOLD, o = 0.95) => <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(q)} stroke={c} strokeWidth={w}
    fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={o} />;
  const f = clamp(p * 1.4);
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id="front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a2a47" /><stop offset="1" stopColor="#0a1222" /></linearGradient>
        <linearGradient id="topf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#2b3a5c" /><stop offset="1" stopColor="#1b2742" /></linearGradient>
        <linearGradient id="side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0d1629" /><stop offset="1" stopColor="#070c17" /></linearGradient>
        <linearGradient id="topLit" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#f1d08a" stopOpacity={0.55} /><stop offset="1" stopColor="#f1d08a" stopOpacity={0.1} /></linearGradient>
        <radialGradient id="pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#f1d08a" stopOpacity={0.5} /><stop offset="1" stopColor="#f1d08a" stopOpacity={0} /></radialGradient>
      </defs>
      <g opacity={f}>
        {/* contact shadow on the ground */}
        <ellipse cx={590} cy={1246} rx={470} ry={18} fill="#000" opacity={0.35} />
        <path d="M 170 1080 L 560 1080 L 560 1240 L 170 1240 Z" fill="url(#front)" />
        <path d="M 170 1080 L 560 1080 L 620 1040 L 230 1040 Z" fill="url(#topf)" />
        <path d="M 170 1080 L 560 1080 L 620 1040 L 230 1040 Z" fill="url(#topLit)" opacity={lit1} />
        <path d="M 950 880 L 1010 840 L 1010 1200 L 950 1240 Z" fill="url(#side)" />
        <path d="M 560 880 L 950 880 L 950 1240 L 560 1240 Z" fill="url(#front)" />
        <path d="M 560 880 L 950 880 L 1010 840 L 620 840 Z" fill="url(#topf)" />
        <path d="M 560 880 L 950 880 L 1010 840 L 620 840 Z" fill="url(#topLit)" opacity={glow2} />
        <ellipse cx={S2.x} cy={860} rx={210} ry={26} fill="url(#pool)" opacity={glow2} />
      </g>
      {e('M 120 1240 L 1050 1240', p, 3, GOLD, 0.6)}
      {e('M 170 1240 L 170 1080 L 560 1080 L 560 880 L 950 880 L 950 1240', p, 5, GOLDL)}
      {e('M 170 1080 L 230 1040 L 560 1040 M 560 880 L 620 840 L 1010 840 L 950 880 M 1010 840 L 1010 1200 L 950 1240', p * 1.2 - 0.2, 3, GOLD, 0.7)}
    </svg>
  );
};
// a balance scale drawn from parts: base, post, finial, beam (rotates), chains, pans
const Scale: React.FC<{cx: number; base: number; h: number; arm: number; p: number; ang?: number; load?: number; dip?: number; children?: (lx: number, ly: number, rx: number, ry: number) => React.ReactNode}> =
  ({cx, base, h, arm, p, ang = 0, load = 0, dip = 0, children}) => {
  const top = base - h, a = (ang * Math.PI) / 180;
  const lx = cx - arm * Math.cos(a), ly = top - arm * Math.sin(a), rx = cx + arm * Math.cos(a), ry = top + arm * Math.sin(a);
  const ch = h * 0.45 + dip, pw = arm * 0.42;
  const d = (q: number) => clamp(q);
  const pan = (x: number, y: number) => `M ${x - pw} ${y + ch} Q ${x} ${y + ch + pw * 0.55} ${x + pw} ${y + ch} Z`;
  const sw = Math.max(3, h * 0.022);
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs><linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8e4ad" /><stop offset="0.55" stopColor="#d9ac55" /><stop offset="1" stopColor="#a87a2c" /></linearGradient></defs>
      <path d={`M ${cx - h * 0.28} ${base} L ${cx + h * 0.28} ${base} L ${cx + h * 0.12} ${base - h * 0.07} L ${cx - h * 0.12} ${base - h * 0.07} Z`} fill="url(#gm)" opacity={d(p * 3)} />
      <path d={`M ${cx} ${base - h * 0.07} L ${cx} ${top}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d(p * 2 - 0.2)} stroke="#e3b862" strokeWidth={sw * 1.6} strokeLinecap="round" />
      {p > 0.5 && <g opacity={d((p - 0.5) * 3)}>
        <path d={`M ${lx} ${ly} L ${rx} ${ry}`} stroke="#ecc471" strokeWidth={sw * 1.5} strokeLinecap="round" />
        <circle cx={cx} cy={top - sw * 2.4} r={sw * 2.2} fill="url(#gm)" />
        <circle cx={lx} cy={ly} r={sw * 1.2} fill={GOLDL} /><circle cx={rx} cy={ry} r={sw * 1.2} fill={GOLDL} />
        {[[lx, ly], [rx, ry]].map(([x, y], j) => <g key={j}>
          <path d={`M ${x} ${y} L ${x - pw * 0.92} ${y + ch} M ${x} ${y} L ${x + pw * 0.92} ${y + ch}`} stroke={CREAM} strokeWidth={sw * 0.55} opacity={0.75} />
          <path d={pan(x, y)} fill="rgba(13,23,42,.75)" stroke="url(#gm)" strokeWidth={sw} strokeLinejoin="round" />
        </g>)}
        {children && children(lx, ly + ch, rx, ry + ch)}
      </g>}
    </svg>
  );
};
// filled heart with gradient (drawn, not an icon)
const Heart: React.FC<{x: number; y: number; s: number; o?: number; glow?: number}> = ({x, y, s, o = 1, glow = 0.5}) => o <= 0 ? null : (
  <svg width={s * 2} height={s * 2} viewBox="-50 -50 100 100" style={{position: 'absolute', left: x - s, top: y - s, overflow: 'visible', opacity: o,
    filter: `drop-shadow(0 0 ${18 * glow}px rgba(241,208,138,${0.7 * glow}))`}}>
    <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8e4ad" /><stop offset="1" stopColor="#c8913a" /></linearGradient></defs>
    <path d="M 0 30 C -40 4 -42 -28 -20 -32 C -8 -34 -2 -26 0 -18 C 2 -26 8 -34 20 -32 C 42 -28 40 4 0 30 Z" fill="url(#hg)" />
    <path d="M -22 -22 C -30 -16 -28 -6 -22 0" stroke="#fff6dc" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
  </svg>
);
// a person = point of light (crisp core + halo); halo is a gradient div so it can sit in any layer
const Dot: React.FC<{x: number; y: number; r?: number; o?: number; warm?: boolean}> = ({x, y, r = 14, o = 1, warm = true}) => o <= 0 ? null : <>
  <div style={{position: 'absolute', left: x - r * 6, top: y - r * 6, width: r * 12, height: r * 12, borderRadius: '50%', opacity: o,
    background: `radial-gradient(closest-side, ${warm ? 'rgba(241,208,138,.45)' : 'rgba(159,178,208,.4)'}, rgba(241,208,138,0))`}} />
  <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: o,
    background: 'radial-gradient(circle at 35% 35%, #fff, #f6e2b0 45%, #e0b562 100%)', boxShadow: '0 0 18px rgba(241,208,138,.8)'}} />
</>;
const Glow: React.FC<{x: number; y: number; r: number; o: number; c?: string}> = ({x, y, r, o, c = '241,208,138'}) => o <= 0 ? null :
  <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: o,
    background: `radial-gradient(closest-side, rgba(${c},.38), rgba(${c},.12) 50%, rgba(${c},0))`}} />;
// sample a point along a cubic path (for things that travel)
const cubic = (p0: number[], p1: number[], p2: number[], p3: number[], s: number) => {
  const u = 1 - s; return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * s * p1[k] + 3 * u * s * s * p2[k] + s * s * s * p3[k]);
};
const CLIMB = [[300, 866], [330, 700], [640, 660], [S2.x, 790]];
const climbD = `M ${CLIMB[0][0]} ${CLIMB[0][1]} C ${CLIMB[1][0]} ${CLIMB[1][1]} ${CLIMB[2][0]} ${CLIMB[2][1]} ${CLIMB[3][0]} ${CLIMB[3][1]}`;
const Climb: React.FC<{p: number; o?: number}> = ({p, o = 1}) => {
  if (p <= 0) return null;
  const pts: number[][] = []; for (let i = 0; i <= 34; i++) pts.push(cubic(CLIMB[0], CLIMB[1], CLIMB[2], CLIMB[3], i / 34));
  const n = Math.floor(clamp(p) * 34);
  const [hx, hy] = cubic(CLIMB[0], CLIMB[1], CLIMB[2], CLIMB[3], clamp(p));
  return <>
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
      {pts.slice(0, n).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.2} fill={GOLDL} opacity={0.55 + 0.45 * (i / 34)} />)}
    </svg>
    <Dot x={hx} y={hy} r={12} o={o} />
  </>;
};
// rope barrier on step 1: posts at x 470 / 545 (top surface y ≈ 1058); the right end unhooks and swings
const Rope: React.FC<{t: number; tOpen: number; p?: number}> = ({t, tOpen, p = 1}) => {
  const L = 470, R = 545, base = 1062, top = 978;
  const s = t < tOpen ? 0 : (t - tOpen);
  // damped pendulum: angle of the free rope hanging from the left post (0 = still hooked)
  const fall = clamp(s / 0.28), theta = s <= 0 ? 0 : (1 - Math.exp(-3.2 * s) * Math.cos(9 * s)) * 1;   // 0 → 1 (hanging)
  const hooked = s <= 0;
  const endX = hooked ? R : lerp(R, L + 6, clamp(theta)), endY = hooked ? top : lerp(top, top + 74, clamp(theta));
  const sag = hooked ? 26 : lerp(26, 6, fall);
  const midX = (L + endX) / 2 + (hooked ? 0 : -6 * Math.sin(s * 9) * Math.exp(-3 * s)), midY = (top + endY) / 2 + sag;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: p}}>
      <defs><linearGradient id="post" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#a87a2c" /><stop offset="0.5" stopColor="#f6dfa3" /><stop offset="1" stopColor="#a87a2c" /></linearGradient></defs>
      {[L, R].map((x, j) => <g key={j}>
        <rect x={x - 6} y={top} width={12} height={base - top} rx={4} fill="url(#post)" />
        <circle cx={x} cy={top - 6} r={10} fill="url(#post)" />
        <rect x={x - 14} y={base - 8} width={28} height={8} rx={3} fill="url(#post)" />
      </g>)}
      <path d={`M ${L} ${top + 4} Q ${midX} ${midY} ${endX} ${endY + 4}`} stroke="#b84a3b" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d={`M ${L} ${top + 1} Q ${midX} ${midY - 3} ${endX} ${endY + 1}`} stroke="#e9806d" strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.7} />
    </svg>
  );
};
// a small 2.5D house with windows that can light up
const House: React.FC<{x: number; y: number; s: number; p: number; edge: string; lit: number}> = ({x, y, s, p, edge, lit}) => {
  if (p <= 0) return null; const w = s, h = s * 0.7, r = s * 0.45, dx = s * 0.22, dy = -s * 0.14;
  const q = outQuint(p);
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: clamp(p * 2)}}>
      <defs><linearGradient id="hfront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a2a47" /><stop offset="1" stopColor="#0a1222" /></linearGradient></defs>
      <g transform={`translate(${x} ${y + (1 - q) * 40}) scale(${0.9 + 0.1 * q})`}>
        <ellipse cx={dx / 2} cy={4} rx={w * 0.7} ry={10} fill="#000" opacity={0.35} />
        <path d={`M ${w / 2} 0 L ${w / 2 + dx} ${dy} L ${w / 2 + dx} ${-h + dy} L ${w / 2} ${-h} Z`} fill="#0a1222" />
        <path d={`M ${-w / 2} 0 L ${w / 2} 0 L ${w / 2} ${-h} L ${-w / 2} ${-h} Z`} fill="url(#hfront)" stroke={edge} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M ${-w / 2 - 12} ${-h} L 0 ${-h - r} L ${w / 2 + 12} ${-h} Z`} fill="#16223b" stroke={edge} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M 0 ${-h - r} L ${dx} ${-h - r + dy} L ${w / 2 + 12 + dx} ${-h + dy} L ${w / 2 + 12} ${-h} Z`} fill="#0d1629" stroke={edge} strokeWidth={2} opacity={0.9} />
        <rect x={-w * 0.12} y={-h * 0.5} width={w * 0.24} height={h * 0.5} rx={3} fill={lit > 0 ? `rgba(241,208,138,${0.25 + 0.7 * lit})` : '#0a1222'} stroke={edge} strokeWidth={3} />
        {[-0.3, 0.3].map((k, j) => <rect key={j} x={k * w - w * 0.09} y={-h * 0.82} width={w * 0.18} height={h * 0.2} rx={2}
          fill={`rgba(241,208,138,${0.08 + 0.85 * lit})`} stroke={edge} strokeWidth={2.5} />)}
      </g>
    </svg>
  );
};
// glass tile (used in the verse, then grows into the two panels)
const Glass: React.FC<{x: number; y: number; w: number; h: number; o: number; active?: number; children?: React.ReactNode}> = ({x, y, w, h, o, active = 0, children}) => o <= 0 ? null : (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: o, borderRadius: 26, overflow: 'hidden',
    background: `linear-gradient(160deg, rgba(36,52,86,${0.55 + 0.2 * active}), rgba(10,17,32,.72))`,
    boxShadow: `inset 0 0 0 1.5px rgba(241,208,138,${0.28 + 0.5 * active}), 0 24px 50px rgba(0,0,0,.45), 0 0 ${50 * active}px rgba(241,208,138,${0.18 * active})`}}>
    <div style={{position: 'absolute', left: -w * 0.2, top: -h * 0.6, width: w * 0.9, height: h * 1.2, background: 'radial-gradient(closest-side, rgba(241,208,138,.10), rgba(241,208,138,0))'}} />
    {children}
  </div>
);
const CheckMark: React.FC<{x: number; y: number; s: number; p: number}> = ({x, y, s, p}) => <Mark kind="check" x={x} y={y} size={s} p={p} sw={Math.max(6, s * 0.1)} />;

// ---------- scene A: hook → more → one word (staircase) ----------
const SceneStairs: React.FC<{t: number; close?: boolean}> = ({t, close}) => {
  // timings for the opening and for the callback at the end
  const tRope = close ? -1 : wt(0, 'stop') - 0.05;
  const climb = close ? quint((t - ST[19] + 0.05) / 1.3) : quint((t - ST[1] + 0.05) / 1.5);
  const glow2 = close ? clamp(0.35 + 0.65 * outQuint((t - ST[20] + 0.2) / 1.0)) : outQuint((t - ST[1] - 0.1) / 1.0) * (0.8 + 0.2 * outQuint((t - wt(2, 'word')) / 0.6));
  const q = close ? 0 : 1 - outQuint((t - wt(1, 'more') + 0.15) / 0.3);
  const ray = close ? glow2 : outQuint((t - ST[1] - 0.1) / 1.1);
  const swell = close ? 0 : outQuint((t - wt(2, 'word') + 0.1) / 0.8);
  const okS = close ? sp(t, wt(18, 'just') + 0.05, 12, 160) : 0;
  const heart = close ? sp(t, wt(20, 'goodwill') - 0.1, 11, 120) : 0;
  return (
    <AbsoluteFill>
      {/* light falling on step 2 from above (stays below the headline zone) */}
      <div style={{position: 'absolute', left: 560, top: 700, width: 460, height: 190, opacity: 0.55 * ray,
        background: 'linear-gradient(180deg, rgba(241,208,138,0), rgba(241,208,138,.30))', clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0 100%)'}} />
      <Stairs p={1} glow2={glow2} lit1={close ? 0.35 * okS : 0} />
      <Glow x={S1.x - 65} y={960} r={170} o={0.55} />
      <Scale cx={S1.x - 65} base={1058} h={170} arm={88} p={1} ang={0} />
      <Rope t={t} tOpen={close ? -10 : tRope} />
      {/* labels on the front faces */}
      <Line1 y={1112} x={170} w={390}><span style={{fontFamily: F.cinzelB, fontSize: 40, letterSpacing: '0.16em', color: CREAM}}>FAIR</span>
        <div style={{marginTop: -6}}><span style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 30, color: SLATE}}>qist</span></div></Line1>
      {close && <CheckMark x={500} y={1150} s={70} p={okS} />}
      <div style={{position: 'absolute', left: 560, top: 920, width: 390, textAlign: 'center'}}>
        {!close && <div style={{position: 'absolute', left: 0, top: -30, width: 390, fontFamily: F.cinzelB, fontSize: 120, lineHeight: '140px', color: GOLDL, opacity: (0.3 + 0.5 * ray) * q}}>?</div>}
        {close ? <><div style={{fontFamily: F.cinzelB, fontSize: 44, letterSpacing: '0.16em', ...GOLDT}}>BIRR</div>
            <div style={{marginTop: -4}}><span style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 30, color: CREAM}}>generous kindness</span></div></>
          : <KType text="MORE" t={t} tin={wt(1, 'more') - 0.1} size={52} color={GOLDT} />}
      </div>
      <Climb p={climb} />
      {/* the light on step 2 swells (one word) */}
      <Glow x={S2.x} y={790} r={120 + 220 * swell} o={swell} />
      {close && <Heart x={S2.x} y={790 - 18 * (1 - heart)} s={50 * (0.6 + 0.4 * heart)} o={clamp(heart * 2)} glow={0.6 + 0.4 * glow2} />}
    </AbsoluteFill>
  );
};
const HookHead: React.FC<{t: number; tin?: number; tout: number}> = ({t, tin, tout}) => {
  // tin undefined → fully present on frame 1 (no reveal)
  const pre = tin === undefined;
  return <>
    <Line1 y={398}>{pre ? <span style={{fontFamily: F.cinzelB, fontSize: 92, letterSpacing: '0.08em', color: CREAM, opacity: 1 - inQuint((t - tout) / 0.35),
      display: 'inline-block', transform: `translateY(${-40 * inQuint((t - tout) / 0.35)}px)`}}>DON'T STOP</span>
      : <KType text="DON'T STOP" t={t} tin={tin!} tout={tout} size={92} />}</Line1>
    <Line1 y={510}>{pre ? <span style={{...bigTxt(132), lineHeight: '170px', opacity: 1 - inQuint((t - tout - 0.05) / 0.35), display: 'inline-block',
      transform: `translateY(${-40 * inQuint((t - tout - 0.05) / 0.35)}px)`}}>AT FAIR.</span>
      : <KType text="AT FAIR." t={t} tin={tin! + 0.12} tout={tout + 0.05} size={132} color={GOLDT} />}</Line1>
  </>;
};
const bigTxt = (size: number): React.CSSProperties => ({fontFamily: F.cinzelB, fontSize: size, letterSpacing: '0.04em', ...goldText, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,.55))'});
const OneWord: React.FC<{t: number}> = ({t}) => (
  <Line1 y={470}><KType text="ONE WORD" t={t} tin={wt(2, 'one') - 0.1} tout={ST[3] - 0.5} size={64} color={GOLDT} /></Line1>
);

// ---------- scene B: the word, written by a pen of light ----------
const SceneWord: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[3] - 0.12;
  const w = quint((t - t0) / 0.75), settle = sp(t, t0, 15, 110);
  const fly = quint((t - (ST[5] - 0.45)) / 0.6);
  const warm = outQuint((t - ST[4] + 0.1) / 1.2);
  const x0 = CX, y0 = 920, x1 = 590, y1 = 470;
  const ax = lerp(x0, x1, fly), ay = lerp(y0, y1, fly), as = lerp(1, 0.22, fly);
  const sub = 1 - outQuint((t - (ST[5] - 0.55)) / 0.25);
  return (
    <AbsoluteFill>
      <Glow x={CX} y={930} r={260 + 260 * warm} o={(0.45 + 0.55 * warm) * (1 - fly)} />
      <div dir="rtl" lang="ar" style={{position: 'absolute', left: ax - 400, top: ay - 210, width: 800, height: 420, textAlign: 'center', fontFamily: F.arw, fontSize: 250, lineHeight: '420px',
        color: '#efc874', transform: `scale(${as * (1.06 - 0.06 * settle)})`, opacity: 1 - inQuint((fly - 0.75) / 0.25),
        clipPath: `inset(0 0 0 ${(1 - w) * 100}%)`, textShadow: '0 10px 30px rgba(0,0,0,.55), 0 0 60px rgba(241,208,138,.35)'}}>بِرّ</div>
      {w > 0 && w < 1 && <div style={{position: 'absolute', left: lerp(CX + 130, CX - 130, w) - 3, top: 760, width: 6, height: 320, borderRadius: 6,
        background: 'linear-gradient(180deg, rgba(255,246,220,0), #fff6dc, rgba(255,246,220,0))', boxShadow: '0 0 30px 8px rgba(241,208,138,.6)'}} />}
      <div style={{opacity: sub}}>
        <Line1 y={1100}><KType text="birr" t={t} tin={ST[3] + 0.25} size={70} font={F.it} italic color={GOLDT} ls={0.02} /></Line1>
        <Line1 y={1190}><KType text="GENEROUS KINDNESS" t={t} tin={ST[4] - 0.1} size={46} color={{color: CREAM}} gap={0.022} /></Line1>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene C: 60:8 (verse window: calm moves only) + scene D: the two panels ----------
// tile layout under the card: row 1 (y 770–930): JUSTICE (left) · KINDNESS (right); row 2 (y 1010–1170)
const TL1 = {x: 90, y: 770, w: 430, h: 160}, TR1 = {x: 560, y: 770, w: 430, h: 160};
const TL2 = {x: 90, y: 1010, w: 430, h: 160}, TR2 = {x: 560, y: 1010, w: 430, h: 160};
const PL = {x: 80, y: 400, w: 440, h: 860}, PR = {x: 560, y: 400, w: 440, h: 860};
const rectMix = (a: typeof PL, b: typeof PL, p: number) => ({x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p)});
const Tile: React.FC<{r: typeof PL; o: number; icon: React.ReactNode; label: string; sub?: string; tick: number; strike?: number}> = ({r, o, icon, label, sub, tick, strike = 0}) => (
  <Glass x={r.x} y={r.y} w={r.w} h={r.h} o={o}>
    <div style={{position: 'absolute', left: r.w / 2 - 60, top: 12, width: 120, height: 84}}>{icon}</div>
    {strike > 0 && <div style={{position: 'absolute', left: r.w / 2 - 52, top: 84, width: 130 * strike, height: 8, borderRadius: 8, background: RED,
      transform: 'rotate(-28deg)', transformOrigin: 'left center', boxShadow: '0 0 12px rgba(217,98,79,.6)'}} />}
    <div style={{position: 'absolute', left: 0, top: 100, width: r.w, textAlign: 'center', whiteSpace: 'nowrap'}}>
      <span style={{fontFamily: F.cinzelB, fontSize: 30, letterSpacing: '0.1em', color: CREAM}}>{label}</span>
      {sub && <span style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 30, color: GOLDL}}>{'  ·  ' + sub}</span>}
    </div>
    <div style={{position: 'absolute', right: 22, top: 16, width: 56, height: 56}}><CheckMark x={28} y={28} s={52} p={tick} /></div>
  </Glass>
);
const IconAt: React.FC<{name: string; s: number; p: number; c?: string}> = ({name, s, p, c = GOLDL}) =>
  <div style={{position: 'absolute', left: 0, top: 0, width: 120, height: 84}}><Icon name={name} x={60} y={42} size={s} p={p} sw={5} c={c} /></div>;

const SceneVerse: React.FC<{t: number}> = ({t}) => {
  const tF = wt(5, 'forbid'), tK = wt(5, 'kindness'), tJ = wt(5, 'justice'), tFo = wt(6, 'fought'), tD = wt(7, 'driven'), tH = wt(7, 'homes');
  const fIn = outQuint((t - ST[5] - 0.15) / 0.6), fOut = inQuint((t - tK + 0.6) / 0.35), st = outQuint((t - tF - 0.08) / 0.4);
  const k1 = outQuint((t - tJ + 0.15) / 0.6), k2 = outQuint((t - tK + 0.15) / 0.6);
  const h2 = outQuint((t - ST[6] + 0.1) / 0.5), r1 = outQuint((t - ST[6] + 0.05) / 0.6), r2 = outQuint((t - ST[7] + 0.05) / 0.6);
  const out2 = inQuint((t - ST[8] + 0.55) / 0.3);
  const grow = quint((t - ST[8] + 0.3) / 0.75);
  const before = t < ST[8] - 0.3;
  return (
    <AbsoluteFill>
      {/* GOD DOES NOT FORBID (struck) */}
      {fOut < 1 && <div style={{position: 'absolute', top: 820, width: W, textAlign: 'center', opacity: fIn * (1 - fOut), transform: `translateY(${(1 - fIn) * 24 - fOut * 30}px)`}}>
        <div style={{fontFamily: F.cinzelB, fontSize: 30, letterSpacing: '0.3em', color: SLATE}}>GOD DOES NOT</div>
        <div style={{position: 'relative', display: 'inline-block', fontFamily: F.cinzelB, fontSize: 104, letterSpacing: '0.08em', color: CREAM, marginTop: 6}}>FORBID
          <div style={{position: 'absolute', left: -14, top: '50%', height: 10, marginTop: -5, width: `calc(${st * 100}% + 28px)`, borderRadius: 10, background: RED,
            boxShadow: '0 0 16px rgba(217,98,79,.55)'}} /></div>
      </div>}
      {before ? <>
        <Tile r={{...TL1, y: TL1.y + (1 - k1) * 30}} o={k1} icon={<Scale cx={60} base={80} h={74} arm={34} p={k1} />} label="JUSTICE" sub="qist" tick={outQuint((t - tJ - 0.3) / 0.4)} />
        <Tile r={{...TR1, y: TR1.y + (1 - k2) * 30}} o={k2} icon={<Heart x={60} y={44} s={34} />} label="KINDNESS" sub="birr" tick={outQuint((t - tK - 0.3) / 0.4)} />
      </> : null}
      <div style={{opacity: 1 - out2, transform: `translateY(${out2 * 40}px)`}}>
        <div style={{position: 'absolute', top: 955, width: W, textAlign: 'center', opacity: h2, fontFamily: F.cinzelB, fontSize: 26, letterSpacing: '0.3em', color: SLATE}}>TOWARDS THOSE WHO HAVE</div>
        <Tile r={{...TL2, y: TL2.y + (1 - r1) * 30}} o={r1} icon={<IconAt name="swords" s={72} p={r1} c={CREAM} />} label="NOT FOUGHT YOU" tick={0}
          strike={outQuint((t - tFo - 0.05) / 0.4)} />
        <Tile r={{...TR2, y: TR2.y + (1 - r2) * 30}} o={r2} icon={<IconAt name="door-enter" s={72} p={r2} c={CREAM} />} label="NOT DRIVEN OUT" tick={0}
          strike={outQuint((t - tH + 0.1) / 0.4)} />
      </div>
      {!before && <ScenePanels t={t} grow={grow} />}
    </AbsoluteFill>
  );
};
// the tiles grow into two tall panels; panels hold qist | birr, then what each one does
const ScenePanels: React.FC<{t: number; grow?: number}> = ({t, grow = 1}) => {
  const L = rectMix(TL1, PL, grow), R = rectMix(TR1, PR, grow);
  const aL = outQuint((t - wt(9, 'justice') + 0.15) / 0.5), aR = outQuint((t - wt(10, 'kindness') + 0.15) / 0.5);
  const focL = t < ST[9] - 0.1 ? 0.6 : t < ST[10] - 0.1 ? 1 : t < ST[11] - 0.4 ? 0.45 : 0.85;
  const focR = t < ST[10] - 0.1 ? 0.6 : 1;
  const swap = quint((t - ST[11] + 0.45) / 0.55);              // words → what they do
  const c1 = outQuint((t - ST[8] + 0.1) / 0.6);
  const fold = quint((t - ST[13] + 0.55) / 0.6);                // panels fold down into the pans
  const lvl = (a: number) => ({opacity: a, transform: `translateY(${(1 - a) * 26}px)`});
  // does: justice (left) and kindness (right)
  const t11 = ST[11], tP = wt(11, 'prevents'), tHm = wt(11, 'harming'), tHelp = wt(12, 'help');
  const wall = sp(t, tP - 0.2, 11, 170), fly = quint((t - t11 - 0.1) / Math.max(0.6, tHm - t11 + 0.05)), hit = t > tHm + 0.05 ? t - tHm - 0.05 : -1;
  const lift = quint((t - tHelp + 0.35) / 0.9), hands = outQuint((t - ST[12] + 0.05) / 0.5);
  const ax = lerp(L.x - 40, L.x + 140, fly);
  return (
    <AbsoluteFill style={{opacity: 1 - clamp(fold * 1.5), transform: `scale(${1 - 0.3 * fold}, ${1 - 0.85 * fold})`, transformOrigin: `${CX}px 1000px`}}>
      <Glass x={L.x} y={L.y} w={L.w} h={L.h} o={1} active={grow * (focL - 0.45) * 1.8}>
        <div style={{position: 'absolute', inset: 0, opacity: grow * focL, transform: `scale(${0.97 + 0.03 * focL})`}}>
          <div style={{opacity: 1 - swap, transform: `translateY(${-swap * 80}px)`}}>
            <div dir="rtl" lang="ar" style={{position: 'absolute', left: 0, top: 50, width: L.w, textAlign: 'center', fontFamily: F.arw, fontSize: 130, lineHeight: '200px', color: '#efc874', ...lvl(c1)}}>قِسْط</div>
            <div style={{position: 'absolute', left: 0, top: 250, width: L.w, textAlign: 'center', fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 42, color: CREAM, ...lvl(c1)}}>qist</div>
            <Scale cx={L.w / 2} base={640} h={230} arm={110} p={c1} />
            <div style={{position: 'absolute', left: 0, top: 700, width: L.w, textAlign: 'center'}}><KType text="JUSTICE" t={t} tin={wt(9, 'justice') - 0.1} size={46} color={GOLDT} /></div>
          </div>
          {swap > 0 && <div style={{opacity: swap, transform: `translateY(${(1 - swap) * 80}px)`}}>
            <div style={{position: 'absolute', left: 0, top: 40, width: L.w, textAlign: 'center'}}>
              <div style={{fontFamily: F.cinzelB, fontSize: 46, letterSpacing: '0.1em', ...GOLDT}}>JUSTICE</div>
              <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 36, color: CREAM}}>prevents harm</div></div>
            {/* harm arrow (with motion streak) breaks on a gold wall */}
            <svg width={L.w} height={L.h} style={{position: 'absolute', left: 0, top: 0}}>
              {hit < 0 ? <g transform={`translate(${ax - L.x} 470)`}>
                <path d="M -150 0 L -40 0" stroke={RED} strokeWidth={6} strokeLinecap="round" opacity={0.25 * (1 - fly) + 0.1} />
                <path d="M -60 0 L 30 0" stroke={RED} strokeWidth={8} strokeLinecap="round" />
                <path d="M 12 -18 L 36 0 L 12 18" stroke={RED} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g> : <g opacity={1 - clamp(hit / 0.8)}>
                <g transform={`translate(${140 - 30 * clamp(hit * 3)} ${470 + 240 * hit * hit}) rotate(${-70 * clamp(hit * 2)})`}><path d="M -60 0 L -10 0" stroke={RED} strokeWidth={8} strokeLinecap="round" /></g>
                <g transform={`translate(${160 - 10 * clamp(hit * 3)} ${470 + 300 * hit * hit}) rotate(${80 * clamp(hit * 2)})`}><path d="M -6 0 L 26 0 M 8 -18 L 30 0 L 8 18" stroke={RED} strokeWidth={8} fill="none" strokeLinecap="round" /></g>
              </g>}
              <rect x={210 - 9} y={470 - 130 * wall} width={18} height={260 * wall} rx={9} fill="url(#gm)" opacity={clamp(wall * 2)} />
            </svg>
            <Glow x={210} y={470} r={110} o={hit >= 0 ? Math.max(0, 0.9 - hit) : 0} />
            <Dot x={330} y={470} r={16} o={swap} />
            <div style={{position: 'absolute', left: 0, top: 700, width: L.w, textAlign: 'center'}}><KType text="NO HARM" t={t} tin={tHm + 0.1} size={40} color={{color: CREAM}} /></div>
          </div>}
        </div>
      </Glass>
      <Glass x={R.x} y={R.y} w={R.w} h={R.h} o={1} active={grow * (focR - 0.45) * 1.8 * (t < ST[11] - 0.4 || t > ST[12] - 0.2 ? 1 : 0.5)}>
        <div style={{position: 'absolute', inset: 0, opacity: grow * (t > ST[11] - 0.4 && t < ST[12] - 0.2 ? 0.5 : focR), transform: `scale(${0.97 + 0.03 * focR})`}}>
          <div style={{opacity: 1 - swap, transform: `translateY(${-swap * 80}px)`}}>
            <div dir="rtl" lang="ar" style={{position: 'absolute', left: 0, top: 50, width: R.w, textAlign: 'center', fontFamily: F.arw, fontSize: 130, lineHeight: '200px', color: '#efc874', ...lvl(c1)}}>بِرّ</div>
            <div style={{position: 'absolute', left: 0, top: 250, width: R.w, textAlign: 'center', fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 42, color: CREAM, ...lvl(c1)}}>birr</div>
            <Glow x={R.w / 2} y={520} r={180} o={aR} />
            <Heart x={R.w / 2} y={520} s={95 * (0.9 + 0.1 * c1)} o={c1} glow={0.4 + 0.6 * aR} />
            <div style={{position: 'absolute', left: 0, top: 700, width: R.w, textAlign: 'center'}}><KType text="KINDNESS" t={t} tin={wt(10, 'kindness') - 0.1} size={46} color={GOLDT} /></div>
          </div>
          {swap > 0 && <div style={{opacity: swap, transform: `translateY(${(1 - swap) * 80}px)`}}>
            <div style={{position: 'absolute', left: 0, top: 40, width: R.w, textAlign: 'center', ...lvl(outQuint((t - ST[12] + 0.15) / 0.5))}}>
              <div style={{fontFamily: F.cinzelB, fontSize: 46, letterSpacing: '0.1em', ...GOLDT}}>KINDNESS</div>
              <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 36, color: CREAM}}>moves us to help</div></div>
            {/* cupped hands lift a person up */}
            {(() => {const y = lerp(600, 430, lift), cx = R.w / 2; return <>
              {lift > 0.02 && lift < 0.98 && <div style={{position: 'absolute', left: cx - 3, top: y + 30, width: 6, height: 150 * Math.sin(lift * Math.PI), borderRadius: 6,
                background: 'linear-gradient(180deg, rgba(241,208,138,.6), rgba(241,208,138,0))'}} />}
              <Dot x={cx} y={y - 20} r={16} o={Math.max(hands, 0.6 * swap)} />
              <svg width={R.w} height={R.h} style={{position: 'absolute', left: 0, top: 0, opacity: hands}}>
                <path d={`M ${cx - 95} ${y - 20} C ${cx - 95} ${y + 40} ${cx - 40} ${y + 52} ${cx} ${y + 52} C ${cx + 40} ${y + 52} ${cx + 95} ${y + 40} ${cx + 95} ${y - 20}`}
                  stroke="url(#gm)" strokeWidth={9} fill="none" strokeLinecap="round" />
                <path d={`M ${cx - 95} ${y - 20} L ${cx - 112} ${y - 40} M ${cx + 95} ${y - 20} L ${cx + 112} ${y - 40}`} stroke="url(#gm)" strokeWidth={9} fill="none" strokeLinecap="round" />
                <path d={`M ${cx - 60} ${y + 48} L ${cx - 70} ${y + 110} M ${cx + 60} ${y + 48} L ${cx + 70} ${y + 110}`} stroke="url(#gm)" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.8} />
              </svg>
            </>;})()}
            <div style={{position: 'absolute', left: 0, top: 700, width: R.w, textAlign: 'center'}}><KType text="HELP" t={t} tin={tHelp + 0.05} size={40} color={GOLDT} /></div>
          </div>}
        </div>
      </Glass>
    </AbsoluteFill>
  );
};

// ---------- scene F: one big scale (the panels became its pans) ----------
const SceneBalance: React.FC<{t: number}> = ({t}) => {
  const t1 = ST[13], tS = wt(13, 'straight'), t2 = ST[14];
  const draw = outQuint((t - t1 + 0.35) / 0.9);
  const lev = sp(t, tS - 0.15, 9, 110);
  const ang = t < tS - 0.15 ? 7 + 3 * Math.sin((t - t1) * 3.2) : 7 * (1 - lev);
  const hL = sp(t, wt(14, 'fills') - 0.05, 10, 150), hR = sp(t, wt(14, 'fills') + 0.15, 10, 150);
  const dip = 10 * Math.max(0, Math.min(hL, hR) > 0.2 ? 1 : 0) * Math.min(1, Math.min(hL, hR));
  const sun = outQuint((t - wt(14, 'life') + 0.2) / 1.4), warm = outQuint((t - wt(14, 'warmth') + 0.4) / 1.0);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: -300, top: 450, width: 1680, height: 1200, opacity: 0.9 * warm,
        background: 'radial-gradient(closest-side, rgba(236,170,80,.32), rgba(236,170,80,.10) 55%, rgba(236,170,80,0))'}} />
      <Glow x={CX} y={lerp(1250, 900, sun)} r={330} o={sun} />
      <div style={{position: 'absolute', left: CX - 140, top: lerp(1250, 900, sun) - 140, width: 280, height: 280, borderRadius: '50%', opacity: 0.55 * sun,
        background: 'radial-gradient(circle, rgba(255,236,190,.55), rgba(241,208,138,.15) 60%, rgba(241,208,138,0) 72%)'}} />
      <Line1 y={420}><KType text="JUSTICE" t={t} tin={t1 - 0.1} tout={t2 - 0.45} size={104} color={GOLDT} /></Line1>
      <Line1 y={548}><KType text="keeps the balance straight" t={t} tin={t1 + 0.15} tout={t2 - 0.45} size={46} font={F.it} italic gap={0.012} ls={0} /></Line1>
      <Line1 y={420}><KType text="KINDNESS" t={t} tin={t2 - 0.05} tout={ST[15] - 0.75} size={104} color={GOLDT} /></Line1>
      <Line1 y={548}><KType text="fills life with warmth" t={t} tin={t2 + 0.2} tout={ST[15] - 0.75} size={46} font={F.it} italic gap={0.012} ls={0} /></Line1>
      <Scale cx={CX} base={1225} h={420} arm={290} p={draw} ang={ang} dip={dip}>
        {(lx, ly, rx, ry) => <>
          {[[lx, ly, hL], [rx, ry, hR]].map(([x, y, h], j) => h <= 0 ? null : <g key={j} transform={`translate(${x} ${lerp(y - 330, y - 30, Math.min(1, h)) + (h > 1 ? (h - 1) * 40 : 0)})`} opacity={clamp(h * 3)}>
            <path d="M 0 30 C -40 4 -42 -28 -20 -32 C -8 -34 -2 -26 0 -18 C 2 -26 8 -34 20 -32 C 42 -28 40 4 0 30 Z" transform="scale(1.1)" fill="url(#gm)"
              style={{filter: 'drop-shadow(0 0 12px rgba(241,208,138,.7))'}} />
          </g>)}
        </>}
      </Scale>
      <CheckMark x={CX + 230} y={1170} s={100} p={outQuint((t - tS - 0.1) / 0.45)} />
    </AbsoluteFill>
  );
};

// ---------- scene G: the hard part — two homes, a bridge, a barrier ----------
const BRIDGE = [[300, 1070], [420, 860], [660, 860], [780, 1070]];
const SceneHard: React.FC<{t: number}> = ({t}) => {
  const tH = ST[15], t16 = ST[16], tD = wt(16, 'difference'), tK = wt(16, 'kindness'), tWr = wt(16, 'wrong'), t17 = ST[17];
  const homes = outQuint((t - tD + 0.25) / 0.8), br = quint((t - tK + 0.4) / 0.9);
  const slam = sp(t, tWr - 0.08, 10, 220), brk = t > t17 + 0.25 ? t - t17 - 0.25 : -1;
  const go1 = quint((t - tK + 0.1) / 1.0) * 0.45;                       // heart travels to mid-bridge, stops at the barrier
  const go2 = brk >= 0 ? 0.45 + 0.55 * quint(brk / 0.9) : go1;
  const [hx, hy] = cubic(BRIDGE[0], BRIDGE[1], BRIDGE[2], BRIDGE[3], go2);
  const lit = outQuint((t - t17 - 1.05) / 0.5), gold = outQuint((t - t17 - 0.3) / 0.6);
  const ok = sp(t, t17 + 0.75, 11, 170);
  return (
    <AbsoluteFill>
      <Line1 y={560}><KType text="THE HARD PART" t={t} tin={tH - 0.05} tout={t16 - 0.5} size={92} color={GOLDT} /></Line1>
      <Line1 y={405}><KType text="IF DIFFERENCE MADE" t={t} tin={t16 - 0.05} tout={t17 - 0.6} size={54} /></Line1>
      <Line1 y={480}><span><KType text="KINDNESS " t={t} tin={wt(16, 'kindness') - 0.15} tout={t17 - 0.6} size={54} color={GOLDT} />
        <KType text="WRONG…" t={t} tin={tWr - 0.1} tout={t17 - 0.6} size={54} color={{color: RED}} /></span></Line1>
      <Line1 y={400}><KType text="BUT THE QUR'AN PERMITS" t={t} tin={t17 - 0.05} size={50} /></Line1>
      <div dir="rtl" lang="ar" style={{position: 'absolute', left: CX - 200, top: 452, width: 400, textAlign: 'center', fontFamily: F.arw, fontSize: 130, lineHeight: '182px', color: '#efc874',
        opacity: outQuint((t - t17 - 0.2) / 0.5), transform: `translateY(${(1 - outQuint((t - t17 - 0.2) / 0.5)) * 20}px)`, textShadow: '0 6px 22px rgba(0,0,0,.55)'}}>بِرّ</div>
      <CheckMark x={CX + 150} y={572} s={90} p={clamp(ok)} />
      <div style={{position: 'absolute', left: 0, top: 672, width: W, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 22, letterSpacing: '0.24em', color: SLATE, opacity: outQuint((t - t17 - 0.9) / 0.5)}}>SURAH 60:8</div>
      <House x={210} y={1080} s={170} p={homes} edge={GOLDL} lit={0.3} />
      <House x={870} y={1080} s={170} p={clamp(homes * 1.2 - 0.1)} edge={SLATE} lit={lit} />
      <Line1 y={1130}><span style={{fontFamily: F.cinzelB, fontSize: 24, letterSpacing: '0.24em', color: CREAM, opacity: homes * 0.85}}>NEIGHBOURS · DIFFERENT FAITHS</span></Line1>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={`M ${BRIDGE[0][0]} ${BRIDGE[0][1]} C ${BRIDGE[1][0]} ${BRIDGE[1][1]} ${BRIDGE[2][0]} ${BRIDGE[2][1]} ${BRIDGE[3][0]} ${BRIDGE[3][1]}`} pathLength={1}
          strokeDasharray="1 1" strokeDashoffset={1 - br} stroke={gold > 0 ? GOLDL : GOLD} strokeWidth={6 + 4 * gold} fill="none" strokeLinecap="round"
          opacity={0.7 + 0.3 * gold} style={{filter: `drop-shadow(0 0 ${14 * gold}px rgba(241,208,138,.8))`}} />
        {/* the barrier: slams down mid-bridge; breaks into three pieces that fall */}
        {slam > 0 && (brk < 0 ? <g opacity={clamp(slam * 4)} transform={`translate(${CX} ${lerp(800, 900, Math.min(1, slam)) + (slam > 1 ? (slam - 1) * 30 : 0)})`}>
          <rect x={-14} y={-110} width={28} height={180} rx={8} fill={RED} style={{filter: 'drop-shadow(0 0 14px rgba(217,98,79,.6))'}} />
          <path d="M -46 -60 L 46 30 M 46 -60 L -46 30" stroke={RED} strokeWidth={10} strokeLinecap="round" opacity={0.9} />
        </g> : [0, 1, 2].map((j) => <rect key={j} x={CX - 14 + (j - 1) * 30 * brk} y={790 + j * 60 + 500 * brk * brk} width={28} height={58} rx={8} fill={RED}
          transform={`rotate(${(j - 1) * 50 * brk} ${CX} ${820 + j * 60})`} opacity={1 - clamp(brk / 0.7)} />))}
      </svg>
      {br > 0.2 && <Heart x={hx} y={hy - 34} s={36} o={clamp((br - 0.2) * 3)} glow={0.5 + 0.5 * gold} />}
    </AbsoluteFill>
  );
};

// ---------- close: headlines over the staircase ----------
const CARE = [{w: 'care', label: 'CARE'}, {w: 'goodwill', label: 'GOODWILL'}, {w: 'active', label: 'ACTIVE HELP'}];
const CloseHeads: React.FC<{t: number}> = ({t}) => <>
  <Line1 y={470}><KType text="BE JUST" t={t} tin={ST[18] + 0.0} tout={ST[19] - 0.4} size={120} color={GOLDT} /></Line1>
  <Line1 y={418}><KType text="THEN" t={t} tin={ST[19] - 0.05} tout={ST[20] - 0.4} size={60} /></Line1>
  <Line1 y={500}><KType text="GO FURTHER" t={t} tin={ST[19] + 0.1} tout={ST[20] - 0.38} size={104} color={GOLDT} /></Line1>
  {CARE.map((q, j) => {const tw = wt(20, q.w);
    return <div key={j} style={{position: 'absolute', left: 310, top: 410 + j * 92}}>
      <div style={{position: 'absolute', left: -70, top: 4}}><CheckMark x={30} y={30} s={64} p={outQuint((t - tw - 0.1) / 0.4) * (1 - inQuint((t - ST[21] + 0.45) / 0.3))} /></div>
      <KType text={q.label} t={t} tin={tw - 0.12} tout={ST[21] - 0.5 + j * 0.03} size={58} color={GOLDT} /></div>;})}
  <HookHead t={t} tin={ST[21] - 0.1} tout={1e9} />
</>;

// ---------- scene timeline + transitions ----------
type Scn = {a: number; b: number; C: React.FC<{t: number}>; tin?: (t: number) => React.CSSProperties; tout?: (t: number) => React.CSSProperties; blur?: [number, number][]};
const zoomThrough = (t0: number, d: number, ox: number, oy: number) => (t: number): React.CSSProperties => {
  const p = inQuint((t - t0) / d); return {transform: `scale(${1 + 2.2 * p})`, transformOrigin: `${ox}px ${oy}px`, opacity: 1 - clamp((p - 0.55) / 0.45)};
};
const StairsOpen: React.FC<{t: number}> = ({t}) => <SceneStairs t={t} />;
const StairsClose: React.FC<{t: number}> = ({t}) => <SceneStairs t={t} close />;
const SCN: Scn[] = [
  {a: -1, b: ST[3] + 0.05, C: StairsOpen, tout: zoomThrough(ST[3] - 0.5, 0.55, S2.x, 790), blur: [[ST[3] - 0.4, ST[3] + 0.05]]},
  {a: ST[3] - 0.15, b: ST[5] + 0.2, C: SceneWord, tin: (t) => {const p = outQuint((t - ST[3] + 0.15) / 0.5); return {transform: `scale(${0.82 + 0.18 * p})`, opacity: clamp(p * 2)};},
    blur: [[ST[5] - 0.45, ST[5] + 0.1]]},
  {a: ST[5] - 0.1, b: ST[11] - 0.2, C: SceneVerse, blur: [[ST[8] - 0.3, ST[8] + 0.4]]},
  {a: ST[11] - 0.2, b: ST[13] - 0.02, C: ScenePanels, blur: [[ST[11] - 0.45, ST[11] + 0.15], [ST[13] - 0.55, ST[13]]]},
  {a: ST[13] - 0.35, b: ST[15] - 0.06, C: SceneBalance, tout: (t) => {const p = quint((t - ST[15] + 0.5) / 0.42); return {transform: `scale(${1 + 0.35 * p})`, opacity: 1 - p, filter: `brightness(${1 - 0.6 * p})`};},
    blur: [[ST[15] - 0.45, ST[15] - 0.05]]},
  {a: ST[15] - 0.1, b: ST[18] - 0.1, C: SceneHard, tout: (t) => {const p = quint((t - ST[18] + 0.5) / 0.38); return {transform: `scale(${1 - 0.45 * p})`, opacity: 1 - p};},
    blur: [[ST[18] - 0.5, ST[18] - 0.1]]},
  {a: ST[18] - 0.12, b: VEND + 0.3, C: StairsClose, tin: (t) => {const p = quint((t - ST[18] + 0.12) / 0.55); return {transform: `scale(${1.6 - 0.6 * p})`, opacity: clamp(p * 2)};},
    blur: [[ST[18] - 0.12, ST[18] + 0.3]]},
];
// screen-level text owned by the opening / close
const Heads: React.FC<{t: number}> = ({t}) => <>
  {t < ST[2] + 0.2 && <HookHead t={t} tout={ST[2] - 0.45} />}
  {t > ST[2] - 0.3 && t < ST[3] + 0.3 && <OneWord t={t} />}
  {t > ST[18] - 0.2 && t < VEND + 0.4 && <CloseHeads t={t} />}
</>;
const SceneLayer: React.FC<{s: Scn; t: number}> = ({s, t}) => {
  if (t < s.a || t >= s.b) return null;
  const style: React.CSSProperties = {...(s.tin ? s.tin(t) : {}), ...(s.tout ? s.tout(t) : {})};
  if (s.tin && s.tout) {const a = s.tin(t), b = s.tout(t); style.opacity = (a.opacity as number ?? 1) * (b.opacity as number ?? 1);}
  const C = s.C;
  const inBlur = (s.blur ?? []).some(([a, b]) => t >= a && t <= b);
  if (!inBlur) return <AbsoluteFill style={style}><C t={t} /></AbsoluteFill>;
  // sub-frame motion blur: 6 samples across a 180° shutter
  const N = 6, sh = 0.5 / FPS;
  return <AbsoluteFill>{new Array(N).fill(0).map((_, i) => {const ti = t - sh * (i / (N - 1));
    const st: React.CSSProperties = {...(s.tin ? s.tin(ti) : {}), ...(s.tout ? s.tout(ti) : {})};
    const base = (st.opacity as number) ?? 1;
    return <AbsoluteFill key={i} style={{...st, opacity: base / (i + 1)}}><C t={ti} /></AbsoluteFill>;})}</AbsoluteFill>;
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const te = t - VEND; if (te < -0.25) return null;
  const a = clamp((te + 0.25) / 0.35), q = k(t, VEND + 0.05, 0.8, outExpo), q2 = k(t, VEND + 0.35, 0.7, outExpo);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <Background t={t} dim={0} />
      <Chrome t={t} bar={false} />
      <div style={{position: 'absolute', left: CX - 420, top: 360, width: 840, height: 840, borderRadius: '50%', opacity: q,
        background: 'radial-gradient(circle, rgba(241,208,138,.22) 0%, rgba(241,208,138,0) 62%)'}} />
      <Img src={staticFile('img/the-mirror.jpg')} style={{position: 'absolute', height: 620, left: '50%', top: 392, borderRadius: 4,
        transform: `translateX(-50%) translateY(${(1 - q) * 30}px)`, opacity: q, boxShadow: '0 30px 70px rgba(0,0,0,.7), 0 0 0 1px rgba(241,208,138,.35)'}} />
      <Reveal p={q2} style={{left: 0, top: 1046, width: W, textAlign: 'center'}}>
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 52, ...goldText}}>The World Sees Islam Through Us</div>
      </Reveal>
      <div style={{position: 'absolute', top: 1146, left: (W - 760) / 2, width: 760, height: 96, borderRadius: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg,#f3d48e,#d6a54c)', fontFamily: F.cinzelB, fontSize: 34, letterSpacing: 5, color: INK, opacity: q2,
        transform: `scale(${0.96 + 0.04 * k(t, VEND + 0.45, 0.5, outBack)})`, boxShadow: '0 12px 30px rgba(0,0,0,.45)'}}>A NEW WORD EVERY DAY</div>
      <div style={{position: 'absolute', top: 1290, width: W, textAlign: 'center', fontFamily: F.plex, fontSize: 38, letterSpacing: 1, color: CREAM, opacity: 0.85 * q2}}>yasserfares.com</div>
    </AbsoluteFill>
  );
};

const Frame: React.FC<{t: number; noEnd?: boolean}> = ({t, noEnd}) => {
  const dim = win(t, ST[15] - 0.4, ST[18] - 0.2, 0.6, 0.8);
  const flash = Math.max(0, 1 - Math.abs(t - ST[3] + 0.06) / 0.16);       // the zoom-through lands in light
  return (
    <AbsoluteFill>
      <Background t={t} dim={dim} />
      {t < VEND + 0.35 && <>
        {SCN.map((s, j) => <SceneLayer key={j} s={s} t={t} />)}
        <Heads t={t} />
        <Card t={t} t0={ST[5] - 0.15} t1={ST[8] - 0.55} refTxt={'SURAH AL-MUMTAHANAH  ·  60:8'} ar={(EX as any)['60:8']} hl={[1, 2]} fs={50} lh={96}
          lines={['“God does not forbid you from treating with kindness', 'and justice those who have not fought you because', 'of your faith or driven you from your homes.”']} />
        {LINES.map((_, i) => (i >= 1 && i <= 21 ? <Caption key={i} t={t} i={i} /> : null))}
        <Chrome t={t} />
      </>}
      {flash > 0 && <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 48%, rgba(255,244,214,.95), rgba(241,208,138,.55) 45%, rgba(241,208,138,0) 80%)', opacity: flash}} />}
      {!noEnd && <EndCard t={t} />}
      <Sweep t={t} t0={VEND - 0.3} d={1.1} />
    </AbsoluteFill>
  );
};

export const Ep06: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  // loop: the end card leaves first, then frame 1 returns (no double exposure)
  const out = clamp((t - (TOTAL - 0.55)) / 0.25), back = clamp((t - (TOTAL - 0.3)) / 0.25);
  return (
    <AbsoluteFill style={{background: INK}}>
      <AbsoluteFill style={{opacity: 1 - out}}><Frame t={t} /></AbsoluteFill>
      {out > 0 && <AbsoluteFill style={{opacity: out}}><Background t={0} dim={0} /></AbsoluteFill>}
      {back > 0 && <AbsoluteFill style={{opacity: back}}><Frame t={0} noEnd /></AbsoluteFill>}
    </AbsoluteFill>
  );
};
