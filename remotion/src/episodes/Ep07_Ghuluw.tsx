import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, continueRender, delayRender, spring} from 'remotion';
import TL from './timeline_ep07.json';
import EX from '../excerpts.json';
import {Icon, Mark, Strike, StrikeIn} from '../lib/icons';

// =====================================================================================
// One Word · 07 · ghuluw — same design system as Ep04 (reference) and the Ep06 v2 motion system
//  - a person is a point of light; God's limit is a gold line drawn across the ground; beyond it the ground turns red
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
      ONE WORD &nbsp;·&nbsp; 07 &nbsp;·&nbsp; FROM THE MIRROR</div>
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
const KEY: Record<number, string> = {1: 'far', 2: 'word', 3: 'ghuluw.', 4: 'beyond', 5: 'says:', 6: 'excess', 7: 'Notice:', 8: 'weaken', 9: 'cross',
  10: 'start?', 11: 'piece', 12: 'whole.', 13: 'cloud,', 14: 'darkness.', 15: 'hard', 16: 'protecting', 17: 'intolerance.', 18: 'condemnation.', 19: 'hostility.',
  20: 'obedience.', 21: 'faithful.'};
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
// STORYBOARD (line → picture → what it says). Written before animating (RUNBOOK §5a).
// Through-line: GOD'S LIMIT, a gold line drawn across a 2.5D ground, and a POINT OF LIGHT (a person) that walks over it.
// The line returns as the boundary bar (4), the ring of "your religion" (6–9), the rim of the whole faith (10–12),
// the line every word crosses in the swaps (17–19) and the ground again at the end (16, 20–21).
//  0 Don't confuse extreme with faithful → frame 1: EXTREME / ISN'T FAITHFUL. over the ground: near side FAITHFUL (gold),
//                                         far side EXTREME (red hatch), the light stands inside the line
//  1 Going too far is not more faith      → the light walks forward over the line, the line flashes red; MORE FAITH? appears
//                                         over the far side and is struck out on "not"
//  2 The Qur'an has a word for it         → ONE WORD; the camera pushes in on the crossing point of the line
//  3 ghuluw                               → zoom-through into the line → غُلُوّ written right-to-left by a pen of light
//  4 Passing beyond the proper boundary   → the word rises; a gold boundary bar stands up and an arrow runs past it, the part
//                                         past the bar turns red: PASSING BEYOND | THE BOUNDARY
//  5–6 4:171 (verse window: calm)         → the word flies into the card (تَغۡلُواْ lights up); under it a gold ring = YOUR RELIGION
//                                         with the light inside; on "excess" an arrow drifts out past the ring and a ban ring draws
//  7 Notice                               → the card leaves, the ring rises; a magnifier settles on it
//  8 doesn't ask you to weaken commitment → row ✗ WEAKEN YOUR COMMITMENT: the light dims and shrinks, ✗ and strike, it shines again
//  9 asks you not to cross the line       → row ✓ DON'T CROSS THE LINE: the light moves to the ring, the ring glows and holds it, ✓
// 10 So how does it start?                → the ring grows into the rim of a disc; six pieces fly in (mercy, justice, warning,
//                                         knowledge, wisdom, repentance) = THE WHOLE FAITH
// 11 One piece of the faith               → one piece (WARNING, bell) pulls out and lights; the others dim
// 12 held up as the whole                 → that piece is lifted to the centre and swells to fill the disc; the rest becomes
//                                         dashed ghosts; “THIS IS THE WHOLE FAITH.”
// 13 Like one dark cloud                  → a viewfinder framed tight on one dark cloud: ONE DARK CLOUD
// 14 calling the whole sky darkness       → “THE WHOLE SKY IS DARKNESS.” then the pull-back (scale reveal): the cloud shrinks inside
//                                         the viewfinder and the whole sky appears: SUNLIGHT, RAIN, STARS; DARKNESS is struck out
// 15 Here's the hard part                 → push into the dark: THE HARD PART
// 16 crosses the line, thinks he protects → the ground again: the light carries a shield and walks over the line; a thought
//                                         bubble says I'M PROTECTING IT; on "protecting" a red ✗ lands on the crossing point
// 17–19 three swaps                       → a vertical gold line down the screen, WITHIN | BEYOND; each word crosses it and turns:
//                                         COMMITMENT (anchor) → INTOLERANCE (ban), ADVICE (speech) → CONDEMNATION (gavel),
//                                         DISAGREEMENT (two speeches) → HOSTILITY (swords)
// 20 beyond the limit ≠ greater obedience → the ground: the light goes over the line once more; GREATER OBEDIENCE? over the far
//                                         side is struck on "not"; the light walks back inside and the line turns gold again
// 21 Extreme isn't faithful               → callback to frame 1: EXTREME / ISN'T FAITHFUL. ✓ on FAITHFUL, ✗ on EXTREME
// 22 A new word, every day                → end card
// SILENT TEST: muted, the walk over the gold line (and the line turning red), the struck MORE FAITH / GREATER OBEDIENCE,
// the arrow past the bar, the ✗ / ✓ rows under the ring, one piece swelling to replace the whole disc, the dark cloud
// that turns out to be a corner of a bright sky, the shield carried over the line and the three words that change colour
// as they cross the line carry the argument. Each picture is tied to its own line.
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
  ls?: number; gap?: number; italic?: boolean; weight?: number; lh?: number; tr?: number}> =
  ({text, t, tin, tout = 1e9, size, font = F.cinzelB, color = {color: CREAM}, ls = 0.08, gap = 0.028, italic, weight, lh = 1.15, tr = 0.12}) => {
  if (t < tin - 0.05 || t > tout + 0.6) return null;
  const chars = Array.from(text); const n = chars.length;
  const track = 1 - outQuint((t - tin) / 0.9);
  return (
    <span style={{display: 'inline-block', whiteSpace: 'pre', fontFamily: font, fontSize: size, lineHeight: `${size * lh}px`, fontStyle: italic ? 'italic' : 'normal',
      fontWeight: weight ?? (italic ? 600 : 400), letterSpacing: `${ls + tr * track}em`}}>
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


// ---------- drawings shared with Ep06 ----------
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


// ---------- the ground: a 2.5D floor with God's limit drawn across it ----------
const GY0 = 1235, GY1 = 830, LIM = 0.5;
const gy = (d: number) => lerp(GY0, GY1, d);
const ghs = (d: number) => lerp(470, 250, d);
const LY = gy(LIM);
const redMix = (r: number) => `rgb(${Math.round(lerp(241, 217, r))},${Math.round(lerp(208, 98, r))},${Math.round(lerp(138, 79, r))})`;
const Ground: React.FC<{t: number; p?: number; d: number; red: number; dotO?: number; shield?: number; lbl?: number; trail?: [number, number]; xMark?: number}> =
  ({t, p = 1, d, red, dotO = 1, shield = 0, lbl = 1, trail, xMark = 0}) => {
  const q = (dd: number, side: number) => `${CX + side * ghs(dd)},${gy(dd)}`;
  const near = `M ${q(0, -1)} L ${q(0, 1)} L ${q(LIM, 1)} L ${q(LIM, -1)} Z`;
  const far = `M ${q(LIM, -1)} L ${q(LIM, 1)} L ${q(1, 1)} L ${q(1, -1)} Z`;
  const dotY = gy(d) - lerp(20, 12, d), dotR = lerp(17, 11, d);
  const beyond = d > LIM;
  const lc = redMix(red);
  const lw = 8 + 3 * red;
  return (
    <AbsoluteFill style={{opacity: clamp(p * 2)}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id="gNear" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#f1d08a" stopOpacity={0.16} /><stop offset="1" stopColor="#f1d08a" stopOpacity={0.05} /></linearGradient>
          <linearGradient id="gFar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#d9624f" stopOpacity={0.16} /><stop offset="1" stopColor="#d9624f" stopOpacity={0.03} /></linearGradient>
          <clipPath id="farClip"><path d={far} /></clipPath>
        </defs>
        <ellipse cx={CX} cy={GY0 + 6} rx={500} ry={16} fill="#000" opacity={0.35} />
        <path d={near} fill="url(#gNear)" />
        <path d={far} fill="url(#gFar)" />
        <g clipPath="url(#farClip)" opacity={0.22}>
          {new Array(16).fill(0).map((_, j) => <path key={j} d={`M ${200 + j * 50} ${GY1 - 10} L ${120 + j * 50} ${LY + 10}`} stroke={RED} strokeWidth={3} />)}
        </g>
        {/* perspective guides */}
        {[-1, -0.5, 0, 0.5, 1].map((u, j) => <path key={j} d={`M ${CX + u * ghs(0)} ${GY0} L ${CX + u * ghs(1)} ${GY1}`} stroke={GOLD} strokeWidth={2}
          opacity={0.22 * clamp(p * 1.5)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(p * 1.3)} />)}
        <path d={`M ${q(0, -1)} L ${q(0, 1)}`} stroke={GOLD} strokeWidth={3} opacity={0.55} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(p)} />
        <path d={`M ${q(1, -1)} L ${q(1, 1)}`} stroke={RED} strokeWidth={2} opacity={0.35} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(p)} />
        {/* footsteps: gold inside, red beyond */}
        {trail && (() => {const [a, b] = trail; const n = 9; const out: React.ReactNode[] = [];
          for (let j = 0; j <= n; j++) {const dd = lerp(a, b, j / n); if ((b > a && dd > d) || (b < a && dd < d)) break;
            out.push(<ellipse key={j} cx={CX + (j % 2 ? 9 : -9)} cy={gy(dd)} rx={lerp(7, 4, dd)} ry={lerp(3.5, 2, dd)} fill={dd > LIM ? RED : GOLDL} opacity={0.75} />);}
          return out;})()}
        {/* God's limit */}
        <path d={`M ${CX - ghs(LIM) - 20} ${LY} L ${CX + ghs(LIM) + 20} ${LY}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(p * 1.2)}
          stroke={lc} strokeWidth={lw} strokeLinecap="round" style={{filter: `drop-shadow(0 0 ${10 + 10 * red}px ${red > 0.3 ? 'rgba(217,98,79,.7)' : 'rgba(241,208,138,.7)'})`}} />
        {[-1, 1].map((sd, j) => <g key={j} opacity={clamp(p * 2 - 0.6)}>
          <rect x={CX + sd * (ghs(LIM) + 20) - 6} y={LY - 54} width={12} height={54} rx={4} fill={lc} />
          <circle cx={CX + sd * (ghs(LIM) + 20)} cy={LY - 60} r={10} fill={lc} />
        </g>)}
      </svg>
      <div style={{position: 'absolute', left: CX + ghs(LIM) - 170, top: LY - 96, width: 200, textAlign: 'right', fontFamily: F.cinzelB, fontSize: 22, letterSpacing: '0.2em',
        color: red > 0.5 ? RED : GOLDL, opacity: 0.85 * clamp(p * 2 - 0.8)}}>GOD'S LIMIT</div>
      <div style={{position: 'absolute', left: 0, top: gy(0.1) - 26, width: W, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 44, letterSpacing: '0.22em',
        transform: 'scaleY(0.78)', ...GOLDT, opacity: lbl}}>FAITHFUL</div>
      <div style={{position: 'absolute', left: 0, top: gy(0.9) - 20, width: W, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 32, letterSpacing: '0.22em',
        transform: 'scaleY(0.78)', color: RED, opacity: 0.9 * lbl}}>EXTREME</div>
      <Dot x={CX} y={dotY} r={dotR} o={dotO} warm={!beyond} />
      {shield > 0 && <Icon name="shield-heart" x={CX + 34} y={dotY - 6} size={lerp(58, 40, d)} p={shield} sw={4} c={GOLDL} />}
      {xMark > 0 && <Mark kind="x" x={CX} y={LY} size={110} p={xMark} sw={12} />}
    </AbsoluteFill>
  );
};
// walk: depth d over time (quint ease)
const walk = (t: number, t0: number, dur: number, a: number, b: number) => lerp(a, b, quint((t - t0) / dur));
const crossRed = (t: number, d: number, tBack = 1e9) => (d > LIM ? 1 : 0) * (1 - outQuint((t - tBack) / 0.5));

// ---------- scene A: the ground (open) ----------
const SceneOpen: React.FC<{t: number}> = ({t}) => {
  const t1 = ST[1], tFar = wt(1, 'far'), tNot = wt(1, 'not');
  const d = walk(t, t1 - 0.05, tFar - t1 + 0.55, 0.3, 0.72);
  const red = sp(t, t1 - 0.05 + (tFar - t1 + 0.55) * 0.5, 12, 160) * (d > LIM ? 1 : 0);
  const mf = outQuint((t - tFar - 0.05) / 0.45), st = outQuint((t - tNot + 0.05) / 0.35);
  const mfo = 1 - inQuint((t - ST[2] + 0.4) / 0.3);
  const push = quint((t - ST[2]) / (ST[3] - ST[2]));
  return (
    <AbsoluteFill style={{transform: `scale(${1 + 0.22 * push})`, transformOrigin: `${CX}px ${LY}px`}}>
      <Ground t={t} d={d} red={red} trail={[0.3, 0.72]} />
      {mf > 0 && <div style={{position: 'absolute', top: 700, width: W, textAlign: 'center', opacity: mf * mfo, transform: `translateY(${(1 - mf) * 20}px)`}}>
        <StrikeIn p={st}><span style={{fontFamily: F.cinzelB, fontSize: 58, letterSpacing: '0.08em', ...GOLDT}}>MORE FAITH?</span></StrikeIn></div>}
    </AbsoluteFill>
  );
};
const HookHead: React.FC<{t: number; tin?: number; tout: number}> = ({t, tin, tout}) => {
  const pre = tin === undefined;
  const o1 = 1 - inQuint((t - tout) / 0.35), o2 = 1 - inQuint((t - tout - 0.05) / 0.35);
  return <>
    <Line1 y={392}>{pre ? <span style={{fontFamily: F.cinzelB, fontSize: 118, letterSpacing: '0.08em', color: CREAM, opacity: o1, display: 'inline-block',
      transform: `translateY(${-40 * (1 - o1)}px)`}}>EXTREME</span> : <KType text="EXTREME" t={t} tin={tin!} tout={tout} size={118} tr={0.05} />}</Line1>
    <Line1 y={530}>{pre ? <span style={{...bigTxt(86), lineHeight: '120px', opacity: o2, display: 'inline-block', transform: `translateY(${-40 * (1 - o2)}px)`}}>ISN'T FAITHFUL.</span>
      : <KType text="ISN'T FAITHFUL." t={t} tin={tin! + 0.12} tout={tout + 0.05} size={86} color={GOLDT} ls={0.04} tr={0.03} />}</Line1>
  </>;
};
const bigTxt = (size: number): React.CSSProperties => ({fontFamily: F.cinzelB, fontSize: size, letterSpacing: '0.04em', ...goldText, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,.55))'});
const OneWord: React.FC<{t: number}> = ({t}) => (
  <Line1 y={450}><KType text="ONE WORD" t={t} tin={wt(2, 'word') - 0.25} tout={ST[3] - 0.5} size={84} color={GOLDT} /></Line1>
);

// ---------- scene B: the word, then the boundary it passes ----------
const SceneWord: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[3] - 0.12;
  const w = quint((t - t0) / 0.7), settle = sp(t, t0, 15, 110);
  const rise = quint((t - ST[4] + 0.25) / 0.6);
  const fly = quint((t - (ST[5] - 0.4)) / 0.6);
  const x0 = CX, y0 = lerp(880, 560, rise), x1 = 640, y1 = 478;
  const ax = lerp(x0, x1, fly), ay = lerp(y0, y1, fly), as = lerp(lerp(1, 0.62, rise), 0.2, fly);
  const sub = 1 - outQuint((t - ST[4] + 0.35) / 0.25);
  // diagram (line 4)
  const bar = sp(t, ST[4] - 0.05, 12, 150), arr = quint((t - wt(4, 'beyond') + 0.25) / 0.9);
  const dOut = inQuint((t - ST[5] + 0.3) / 0.3);
  const BX = 600, AY = 1030, AX0 = 170, AX1 = 930, ax2 = lerp(AX0, AX1, arr);
  return (
    <AbsoluteFill>
      <Glow x={CX} y={y0 + 10} r={300} o={0.7 * (1 - fly) * (1 - 0.5 * rise)} />
      <div dir="rtl" lang="ar" style={{position: 'absolute', left: ax - 400, top: ay - 210, width: 800, height: 420, textAlign: 'center', fontFamily: F.arw, fontSize: 240, lineHeight: '420px',
        color: '#efc874', transform: `scale(${as * (1.06 - 0.06 * settle)})`, opacity: 1 - inQuint((fly - 0.75) / 0.25),
        clipPath: `inset(0 0 0 ${(1 - w) * 100}%)`, textShadow: '0 10px 30px rgba(0,0,0,.55), 0 0 60px rgba(241,208,138,.35)'}}>غُلُوّ</div>
      {w > 0 && w < 1 && <div style={{position: 'absolute', left: lerp(CX + 150, CX - 150, w) - 3, top: 720, width: 6, height: 320, borderRadius: 6,
        background: 'linear-gradient(180deg, rgba(255,246,220,0), #fff6dc, rgba(255,246,220,0))', boxShadow: '0 0 30px 8px rgba(241,208,138,.6)'}} />}
      <div style={{opacity: sub}}>
        <Line1 y={1110}><KType text="ghuluw" t={t} tin={ST[3] + 0.2} size={76} font={F.it} italic color={GOLDT} ls={0.02} /></Line1>
      </div>
      {/* line 4: the boundary and the arrow that runs past it */}
      <div style={{opacity: 1 - dOut}}>
        <Line1 y={704}><KType text="passing beyond the proper boundary" t={t} tin={ST[4] + 0.05} size={50} font={F.it} italic gap={0.01} ls={0} color={{color: CREAM}} /></Line1>
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <rect x={BX - 10} y={AY - 140 * Math.min(1, bar)} width={20} height={280 * Math.min(1, bar)} rx={10} fill="url(#goldF)" opacity={clamp(bar * 2)}
            style={{filter: 'drop-shadow(0 0 14px rgba(241,208,138,.6))'}} />
          {arr > 0 && <>
            <path d={`M ${AX0} ${AY} L ${Math.min(ax2, BX)} ${AY}`} stroke={GOLDL} strokeWidth={10} strokeLinecap="round" />
            {ax2 > BX && <path d={`M ${BX} ${AY} L ${ax2} ${AY}`} stroke={RED} strokeWidth={10} strokeLinecap="round" />}
            <path d={`M ${ax2 - 30} ${AY - 26} L ${ax2 + 4} ${AY} L ${ax2 - 30} ${AY + 26}`} stroke={ax2 > BX ? RED : GOLDL} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>}
        </svg>
        <div style={{position: 'absolute', left: BX - 200, top: AY + 160, width: 400, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 26, letterSpacing: '0.22em', color: GOLDL,
          opacity: clamp(bar * 2 - 0.6)}}>THE BOUNDARY</div>
        <div style={{position: 'absolute', left: BX + 40, top: AY - 74, width: 360, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 26, letterSpacing: '0.2em', color: RED,
          opacity: outQuint((t - wt(4, 'beyond') - 0.35) / 0.4)}}>PASSING BEYOND</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene C: 4:171 (calm) → notice → ✗ weaken / ✓ don't cross ----------
const RING0 = {x: CX, y: 1010, r: 170}, RING1 = {x: CX, y: 745, r: 135};
const Ring: React.FC<{x: number; y: number; r: number; p: number; glow?: number; label?: number}> = ({x, y, r, p, glow = 0, label = 1}) => (
  <>
    <Glow x={x} y={y} r={r * 1.6} o={0.35 + 0.5 * glow} />
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <circle cx={x} cy={y} r={r} fill="rgba(13,23,42,.55)" opacity={clamp(p * 2)} />
      <circle cx={x} cy={y} r={r} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(p)} stroke={GOLDL} strokeWidth={7 + 3 * glow} fill="none"
        transform={`rotate(-90 ${x} ${y})`} style={{filter: `drop-shadow(0 0 ${10 + 18 * glow}px rgba(241,208,138,.75))`}} />
    </svg>
    <div style={{position: 'absolute', left: x - r, top: y - r * 0.52, width: 2 * r, textAlign: 'center', fontFamily: F.cinzelB, fontSize: r * 0.13, letterSpacing: '0.16em',
      color: CREAM, opacity: clamp(p * 2 - 1) * label}}>YOUR RELIGION</div>
  </>
);
const Row: React.FC<{y: number; o: number; kind: 'x' | 'check'; mark: number; strike?: number; text: string}> = ({y, o, kind, mark, strike = 0, text}) => o <= 0 ? null : (
  <div style={{position: 'absolute', left: 140, top: y - 44, width: 800, height: 88, opacity: o, transform: `translateY(${(1 - o) * 24}px)`}}>
    <Glass x={0} y={0} w={800} h={88} o={1} active={kind === 'check' ? mark : 0} />
    <Mark kind={kind} x={56} y={44} size={58} p={mark} sw={9} />
    <div style={{position: 'absolute', left: 104, top: 0, height: 88, display: 'flex', alignItems: 'center'}}>
      <StrikeIn p={strike}><span style={{fontFamily: F.cinzelB, fontSize: 38, letterSpacing: '0.07em', color: kind === 'check' ? GOLDL : CREAM}}>{text}</span></StrikeIn></div>
  </div>
);
const SceneVerse: React.FC<{t: number}> = ({t}) => {
  const tEx = wt(6, 'excess');
  const rIn = outQuint((t - ST[5] - 0.05) / 0.9);
  const up = quint((t - ST[7] + 0.35) / 0.6);
  const R = {x: lerp(RING0.x, RING1.x, up), y: lerp(RING0.y, RING1.y, up), r: lerp(RING0.r, RING1.r, up)};
  const ex = outCubic((t - tEx + 0.1) / 1.1), ban = outCubic((t - tEx - 0.75) / 0.8), exOut = outQuint((t - ST[7] + 0.5) / 0.35);
  const mag = sp(t, ST[7] - 0.05, 12, 140), magOut = inQuint((t - ST[8] + 0.2) / 0.3);
  // row 1: weaken (light dims), row 2: don't cross (light goes to the ring and is held)
  const r1 = outQuint((t - ST[8] + 0.05) / 0.45), tWk = wt(8, 'weaken'), tCm = wt(8, 'commitment');
  const dim = outQuint((t - tWk + 0.05) / 0.45) * (1 - outQuint((t - tCm - 0.55) / 0.5));
  const x1 = outQuint((t - tCm - 0.05) / 0.4);
  const r2 = outQuint((t - ST[9] + 0.05) / 0.45), tCr = wt(9, 'cross'), tLn = wt(9, 'line');
  const go = quint((t - tCr + 0.35) / 0.5), back = sp(t, tCr + 0.15, 9, 160);
  const dx = (R.r - 22) * (go - (go >= 1 ? 0.45 * Math.min(1, back) : 0));
  const held = outQuint((t - tCr) / 0.4), ok = outQuint((t - tLn - 0.05) / 0.4);
  return (
    <AbsoluteFill>
      <div style={{opacity: rIn}}>
        <Ring x={R.x} y={R.y} r={R.r} p={rIn} glow={held * 0.8} />
        <Dot x={R.x + dx} y={R.y + R.r * 0.18} r={16 * (1 - 0.5 * dim)} o={1 - 0.6 * dim} />
        <div style={{position: 'absolute', left: R.x - 200, top: R.y + R.r + 16, width: 400, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 22, letterSpacing: '0.24em',
          color: GOLDL, opacity: 0.8 * rIn}}>GOD'S LIMIT</div>
      </div>
      {/* "excess": a slow arrow drifts past the ring, a ban ring draws (verse window: whooshes only) */}
      {ex > 0 && <div style={{opacity: 1 - exOut}}>
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <path d={`M ${R.x + 30} ${R.y + R.r * 0.18} L ${lerp(R.x + 30, R.x + R.r + 120, ex)} ${R.y + R.r * 0.18}`} stroke={ex > 0.5 ? RED : GOLDL} strokeWidth={8} strokeLinecap="round" />
        </svg>
        <Mark kind="ban" x={R.x + R.r + 150} y={R.y + R.r * 0.18} size={96} p={ban} sw={9} />
        <div style={{position: 'absolute', left: R.x + R.r + 60, top: R.y - R.r * 0.3, width: 180, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 26, letterSpacing: '0.18em',
          color: RED, opacity: ban}}>EXCESS</div>
      </div>}
      <Line1 y={420}><KType text="NOTICE" t={t} tin={ST[7] - 0.1} tout={ST[8] - 0.35} size={84} color={GOLDT} /></Line1>
      {mag > 0 && magOut < 1 && <Icon name="search" x={lerp(880, R.x + R.r * 1.02, Math.min(1, mag))} y={lerp(560, R.y - R.r * 0.85, Math.min(1, mag))} size={110} p={clamp(mag * 1.4)}
        o={1 - magOut} sw={5} c={GOLDL} />}
      <Row y={1050} o={r1} kind="x" mark={x1} strike={x1} text="WEAKEN YOUR COMMITMENT" />
      <Row y={1168} o={r2} kind="check" mark={ok} text="DON'T CROSS THE LINE" />
    </AbsoluteFill>
  );
};

// ---------- scene D: the whole faith, and one piece held up as the whole ----------
const PIECES = [{icon: 'bell', label: 'WARNING'}, {icon: 'heart', label: 'MERCY'}, {icon: 'scale', label: 'JUSTICE'}, {icon: 'book', label: 'KNOWLEDGE'},
  {icon: 'bulb', label: 'WISDOM'}, {icon: 'refresh', label: 'REPENTANCE'}];
const DISC = {x: CX, y: 965, r: 235};
const wedgeD = (R: number, a0: number, a1: number, ox: number, oy: number) =>
  `M ${-ox} ${-oy} L ${R * Math.cos(a0) - ox} ${R * Math.sin(a0) - oy} A ${R} ${R} 0 0 1 ${R * Math.cos(a1) - ox} ${R * Math.sin(a1) - oy} Z`;
const ScenePieces: React.FC<{t: number}> = ({t}) => {
  const grow = quint((t - ST[10] + 0.2) / 0.6);
  const cx = DISC.x, cy = lerp(RING1.y, DISC.y, grow), R = lerp(RING1.r, DISC.r, grow);
  const tP = wt(11, 'piece'), lift = sp(t, tP - 0.25, 13, 120), hold = quint((t - ST[12] + 0.05) / 0.7);
  const ghost = outQuint((t - ST[12] - 0.1) / 0.6);
  return (
    <AbsoluteFill>
      <Line1 y={420}><KType text="HOW DOES IT START?" t={t} tin={ST[10] - 0.05} tout={ST[11] - 0.4} size={66} tr={0.03} /></Line1>
      <Line1 y={430}><KType text="ONE PIECE" t={t} tin={tP - 0.15} tout={ST[12] - 0.35} size={84} color={GOLDT} /></Line1>
      <Line1 y={412}><KType text="“THIS IS THE" t={t} tin={ST[12] - 0.05} tout={ST[13] - 0.75} size={64} font={F.it} italic ls={0.01} color={{color: CREAM}} /></Line1>
      <Line1 y={492}><KType text="WHOLE FAITH.”" t={t} tin={ST[12] + 0.15} tout={ST[13] - 0.72} size={86} color={GOLDT} ls={0.04} tr={0.03} /></Line1>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <circle cx={cx} cy={cy} r={R + 6} stroke={GOLDL} strokeWidth={7} fill="none" opacity={1 - 0.75 * ghost} strokeDasharray={ghost > 0.05 ? '14 14' : undefined}
          style={{filter: 'drop-shadow(0 0 10px rgba(241,208,138,.6))'}} />
      </svg>
      {PIECES.map((pc, j) => {
        const a0 = -Math.PI / 2 - Math.PI / 6 + (j * Math.PI) / 3, a1 = a0 + Math.PI / 3, m = (a0 + a1) / 2;
        const fin = quint((t - ST[10] - 0.25 - j * 0.11) / 0.55);
        const off = 260 * (1 - fin);
        const isOne = j === 0;
        const lift1 = isOne ? Math.min(1.1, lift) : 0;
        const cR = R * 0.58;
        const gx = cx + Math.cos(m) * (cR + off + 46 * lift1), gy2 = cy + Math.sin(m) * (cR + off + 46 * lift1);
        // piece 0 then travels to the centre and swells to fill the disc
        const px = isOne ? lerp(gx, cx, hold) : gx, py = isOne ? lerp(gy2, cy + 30, hold) : gy2;
        const sc = isOne ? 1 + 1.25 * hold : 1;
        const o = clamp(fin * 2) * (isOne ? 1 : (t > tP - 0.25 ? lerp(1, 0.28, outQuint((t - tP + 0.25) / 0.4)) : 1) * (1 - 0.92 * ghost));
        const ox = Math.cos(m) * cR, oy = Math.sin(m) * cR;
        return <div key={j} style={{position: 'absolute', left: px, top: py, width: 0, height: 0, opacity: o, transform: `scale(${sc})`}}>
          <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <path d={wedgeD(R - 6, a0 + 0.03, a1 - 0.03, ox, oy)} fill={isOne && lift > 0.05 ? '#3a2c17' : 'rgba(20,32,56,.9)'} stroke={isOne && lift > 0.05 ? GOLDL : GOLD}
              strokeWidth={isOne ? 4 + 2 * clamp(lift) : 3} strokeLinejoin="round" strokeDasharray={!isOne && ghost > 0.05 ? '10 10' : undefined}
              style={{filter: isOne && lift > 0.05 ? `drop-shadow(0 0 ${22 * clamp(lift)}px rgba(241,208,138,.7))` : undefined}} />
          </svg>
          <Icon name={pc.icon} x={0} y={-12} size={isOne ? 66 : 58} p={fin} sw={4} c={isOne ? GOLDL : CREAM} />
          <div style={{position: 'absolute', left: -90, top: 30, width: 180, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 17, letterSpacing: '0.12em',
            color: isOne ? GOLDL : CREAM, opacity: 0.9}}>{pc.label}</div>
        </div>;
      })}
      <div style={{position: 'absolute', left: 0, top: DISC.y + DISC.r + 22, width: W, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 28, letterSpacing: '0.24em', color: CREAM,
        opacity: outQuint((t - ST[10] - 0.9) / 0.5) * (1 - outQuint((t - tP + 0.3) / 0.3))}}>THE WHOLE FAITH</div>
    </AbsoluteFill>
  );
};

// ---------- scene E: one dark cloud → the whole sky (scale reveal) ----------
const SKY = {x: 70, y: 640, w: 940, h: 610};
const CLOUD = [300, 330];
const cloudD = 'M -120 40 C -175 40 -178 -28 -118 -32 C -112 -92 -30 -104 -6 -52 C 14 -112 112 -100 108 -28 C 168 -34 178 40 120 40 Z';
const SceneSky: React.FC<{t: number}> = ({t}) => {
  const tW = wt(14, 'whole'), tD = wt(14, 'darkness');
  const pull = quint((t - tW + 0.15) / 1.05);
  const s = lerp(2.7, 1, pull);
  const tgt = [lerp(SKY.w / 2, CLOUD[0], pull), lerp(SKY.h / 2, CLOUD[1], pull)];
  const tx = tgt[0] - CLOUD[0] * s, ty = tgt[1] - CLOUD[1] * s;
  const pIn = outQuint((t - ST[13] + 0.15) / 0.5);
  const lab = (d: number) => outQuint((t - tW - 0.65 - d) / 0.4);
  const rain = (t * 520) % 90;
  const vf = {cx: SKY.x + tgt[0], cy: SKY.y + tgt[1], hw: 165 * s, hh: 105 * s};
  const corner = (sx: number, sy: number) => `M ${vf.cx + sx * vf.hw} ${vf.cy + sy * (vf.hh - 40)} L ${vf.cx + sx * vf.hw} ${vf.cy + sy * vf.hh} L ${vf.cx + sx * (vf.hw - 40)} ${vf.cy + sy * vf.hh}`;
  return (
    <AbsoluteFill>
      <Line1 y={430}><KType text="ONE DARK CLOUD" t={t} tin={wt(13, 'one') - 0.1} tout={wt(14, 'calling') - 0.35} size={72} /></Line1>
      <Line1 y={418}><KType text="“THE WHOLE SKY IS" t={t} tin={wt(14, 'calling') - 0.05} size={58} font={F.it} italic ls={0.01} color={{color: CREAM}} /></Line1>
      <Line1 y={492}><StrikeIn p={outQuint((t - tD - 0.25) / 0.35)} sw={12}><KType text="DARKNESS.”" t={t} tin={tD - 0.1} size={92} color={{color: '#8fa0bd'}} /></StrikeIn></Line1>
      <Glass x={SKY.x} y={SKY.y} w={SKY.w} h={SKY.h} o={pIn}>
        <div style={{position: 'absolute', left: 0, top: 0, width: SKY.w, height: SKY.h, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${s})`}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: SKY.w, height: SKY.h, background: 'linear-gradient(180deg, rgba(60,86,130,.55), rgba(20,32,56,.2))'}} />
          <svg width={SKY.w} height={SKY.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {/* sunlight */}
            <g transform="translate(760 150)">
              {new Array(12).fill(0).map((_, j) => {const a = (j * Math.PI) / 6 + t * 0.15; return <path key={j} d={`M ${Math.cos(a) * 74} ${Math.sin(a) * 74} L ${Math.cos(a) * 104} ${Math.sin(a) * 104}`}
                stroke={GOLDL} strokeWidth={7} strokeLinecap="round" />;})}
              <circle r={58} fill="url(#goldF)" style={{filter: 'drop-shadow(0 0 30px rgba(241,208,138,.8))'}} />
            </g>
            {/* stars */}
            {[[120, 90, 18], [215, 60, 12], [470, 70, 16], [560, 150, 11], [880, 360, 14], [90, 470, 12], [620, 520, 13]].map(([x, y, r], j) =>
              <path key={j} d={star8(x, y, r, 0.2)} fill={GOLDL} opacity={0.85 + 0.15 * Math.sin(t * 3 + j)} />)}
            {/* rain from a light cloud */}
            <g transform="translate(700 420) scale(0.8)">
              <path d={cloudD} fill="rgba(239,231,214,.85)" stroke={CREAM} strokeWidth={4} />
              {new Array(7).fill(0).map((_, j) => {const x = -100 + j * 34, y0 = 60 + ((rain + j * 27) % 90);
                return <path key={j} d={`M ${x} ${y0} L ${x - 6} ${y0 + 22}`} stroke="#9fc3e8" strokeWidth={6} strokeLinecap="round" opacity={0.9} />;})}
            </g>
            {/* the one dark cloud */}
            <g transform={`translate(${CLOUD[0]} ${CLOUD[1]})`}>
              <path d={cloudD} fill="#2b3245" stroke="#56627c" strokeWidth={5} />
              <path d="M -70 -8 C -40 -30 10 -30 40 -10" stroke="#3d475e" strokeWidth={8} fill="none" strokeLinecap="round" />
            </g>
          </svg>
          {[['SUNLIGHT', 760, 280, 0], ['STARS', 330, 108, 0.12], ['RAIN', 700, 540, 0.24]].map(([txt, x, y, d], j) =>
            <div key={j} style={{position: 'absolute', left: (x as number) - 150, top: y as number, width: 300, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 30, letterSpacing: '0.2em',
              color: GOLDL, opacity: lab(d as number), transform: `translateY(${(1 - lab(d as number)) * 14}px)`}}>{txt}</div>)}
        </div>
      </Glass>
      {/* viewfinder stays on the cloud: it shrinks as the camera pulls back */}
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: pIn * (1 - 0.5 * pull)}}>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], j) => <path key={j} d={corner(a, b)} stroke={CREAM} strokeWidth={6} fill="none" strokeLinecap="round" />)}
      </svg>
    </AbsoluteFill>
  );
};

// ---------- scene F: the hard part → he crosses the line while he thinks he protects it ----------
const SceneCross: React.FC<{t: number}> = ({t}) => {
  const tC = wt(16, 'crosses'), tPr = wt(16, 'protecting'), tTh = wt(16, 'thinking');
  const gIn = outQuint((t - ST[16] + 0.25) / 0.6);
  const d = walk(t, tC - 0.25, 1.4, 0.3, 0.72);
  const red = crossRed(t, d);
  const sh = outQuint((t - ST[16] + 0.1) / 0.5);
  const bub = sp(t, tTh - 0.2, 13, 150), prot = outQuint((t - tTh + 0.05) / 0.5);
  const xm = outQuint((t - tPr - 0.45) / 0.35);
  const outAll = inQuint((t - ST[17] + 0.45) / 0.3);
  return (
    <AbsoluteFill style={{opacity: 1 - outAll}}>
      <Line1 y={560}><KType text="THE HARD PART" t={t} tin={ST[15] - 0.05} tout={ST[16] - 0.5} size={92} color={GOLDT} tr={0.03} /></Line1>
      <div style={{opacity: gIn, transform: `translateY(${(1 - gIn) * 40}px)`}}>
        <Ground t={t} d={d} red={red} shield={sh} trail={[0.3, 0.72]} xMark={xm} />
      </div>
      {/* thought bubble */}
      {bub > 0 && <div style={{position: 'absolute', left: 150, top: 400, width: 780, height: 190, opacity: clamp(bub * 2), transform: `scale(${0.85 + 0.15 * Math.min(1.05, bub)})`, transformOrigin: '50% 100%'}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 100, background: 'linear-gradient(160deg, rgba(36,52,86,.8), rgba(10,17,32,.85))',
          boxShadow: `inset 0 0 0 2px rgba(241,208,138,.55), 0 20px 50px rgba(0,0,0,.45)`}} />
        {[[360, 228, 20], [380, 270, 13], [394, 300, 8]].map(([x, y, r], j) => <div key={j} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%',
          background: 'rgba(24,36,62,.9)', boxShadow: 'inset 0 0 0 2px rgba(241,208,138,.55)'}} />)}
        <Icon name="shield-heart" x={120} y={100} size={110} p={prot} sw={5} c={GOLDL} />
        <div style={{position: 'absolute', left: 200, top: 0, height: 200, display: 'flex', alignItems: 'center'}}>
          <KType text="I'M PROTECTING IT" t={t} tin={tTh + 0.05} size={40} color={GOLDT} gap={0.02} /></div>
      </div>}
    </AbsoluteFill>
  );
};

// ---------- scene G: three words cross the line and turn ----------
const SWAPS = [{a: 'COMMITMENT', ia: 'anchor', b: 'INTOLERANCE', ib: 'ban', w: 'intolerance'}, {a: 'ADVICE', ia: 'message-circle', b: 'CONDEMNATION', ib: 'gavel', w: 'condemnation'},
  {a: 'DISAGREEMENT', ia: 'messages', b: 'HOSTILITY', ib: 'swords', w: 'hostility'}];
const SceneSwap: React.FC<{t: number}> = ({t}) => {
  const ln = quint((t - ST[17] + 0.2) / 0.6), hd = outQuint((t - ST[17]) / 0.5);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={`M ${CX} 470 L ${CX} 1240`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ln} stroke={GOLDL} strokeWidth={8} strokeLinecap="round"
          style={{filter: 'drop-shadow(0 0 12px rgba(241,208,138,.7))'}} />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 404, width: CX - 30, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 30, letterSpacing: '0.24em', color: GOLDL, opacity: hd}}>WITHIN</div>
      <div style={{position: 'absolute', left: CX + 30, top: 404, width: CX - 30, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 30, letterSpacing: '0.24em', color: RED, opacity: hd}}>BEYOND</div>
            {SWAPS.map((s, j) => {
        const i = 17 + j, y = 640 + j * 245;
        const aIn = outQuint((t - ST[i] + 0.1) / 0.45), tB = wt(i, 'becomes'), tW2 = wt(i, s.w);
        const tr = quint((t - tB + 0.05) / 0.55), bIn = sp(t, tW2 - 0.05, 12, 160), aDim = outQuint((t - tW2) / 0.5);
        const axp = lerp(320, 720, tr);
        return <div key={j}>
          <div style={{opacity: aIn * (1 - 0.55 * aDim), transform: `translateY(${(1 - aIn) * 20}px)`}}>
            <Icon name={s.ia} x={270} y={y - 46} size={84} p={aIn} sw={5} c={GOLDL} />
            <div style={{position: 'absolute', left: 30, top: y + 12, width: 480, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 38, letterSpacing: '0.06em', color: CREAM}}>{s.a}</div>
          </div>
          {tr > 0 && tr < 1 && <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <path d={`M ${axp - 70} ${y - 46} L ${axp} ${y - 46}`} stroke={axp > CX ? RED : GOLDL} strokeWidth={8} strokeLinecap="round" opacity={0.85} />
            <circle cx={axp} cy={y - 46} r={12} fill={axp > CX ? RED : GOLDL} style={{filter: 'drop-shadow(0 0 12px rgba(241,208,138,.8))'}} />
          </svg>}
          {bIn > 0 && <div style={{opacity: clamp(bIn * 2), transform: `scale(${0.8 + 0.2 * Math.min(1.08, bIn)})`, transformOrigin: `810px ${y}px`}}>
            <Icon name={s.ib} x={810} y={y - 46} size={84} p={clamp(bIn)} sw={5} c={RED} glow={0} />
            <div style={{position: 'absolute', left: CX + 20, top: y + 12, width: 500, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 38, letterSpacing: '0.06em', color: RED}}>{s.b}</div>
          </div>}
        </div>;
      })}
    </AbsoluteFill>
  );
};

// ---------- scene H: the ground again → greater obedience? → back inside → callback ----------
const SceneClose: React.FC<{t: number}> = ({t}) => {
  const t20 = ST[20], tNot = wt(20, 'not'), tOb = wt(20, 'obedience');
  const out1 = walk(t, t20 - 0.05, 1.2, 0.3, 0.72), back = quint((t - LINES[20].end + 0.1) / 0.8);
  const d = lerp(out1, 0.3, back);
  const red = (d > LIM ? 1 : 0) * sp(t, t20 + 0.45, 12, 160);
  const gIn = outQuint((t - t20 + 0.2) / 0.55);
  const go = outQuint((t - wt(20, 'limit') - 0.1) / 0.45), st = outQuint((t - tNot + 0.05) / 0.35);
  const goOut = inQuint((t - tOb - 0.55) / 0.3);
  const okF = outQuint((t - wt(21, 'faithful') - 0.05) / 0.4), xE = outQuint((t - wt(21, 'isn') + 0.05) / 0.4);
  return (
    <AbsoluteFill style={{opacity: gIn, transform: `translateY(${(1 - gIn) * 40}px)`}}>
      <Ground t={t} d={d} red={red} trail={back > 0 ? undefined : [0.3, 0.72]} />
      {go > 0 && goOut < 1 && <div style={{position: 'absolute', top: 700, width: W, textAlign: 'center', opacity: go * (1 - goOut), transform: `translateY(${(1 - go) * 20}px)`}}>
        <StrikeIn p={st}><span style={{fontFamily: F.cinzelB, fontSize: 54, letterSpacing: '0.06em', ...GOLDT}}>GREATER OBEDIENCE?</span></StrikeIn></div>}
      <CheckMark x={CX + 215} y={gy(0.1) - 4} s={70} p={okF} />
      <Mark kind="x" x={CX + 140} y={gy(0.9) - 2} size={52} p={xE} sw={8} />
    </AbsoluteFill>
  );
};



type Scn = {a: number; b: number; C: React.FC<{t: number}>; tin?: (t: number) => React.CSSProperties; tout?: (t: number) => React.CSSProperties; blur?: [number, number][]};
const zoomThrough = (t0: number, d: number, ox: number, oy: number) => (t: number): React.CSSProperties => {
  const p = inQuint((t - t0) / d); return {transform: `scale(${1 + 2.2 * p})`, transformOrigin: `${ox}px ${oy}px`, opacity: 1 - clamp((p - 0.55) / 0.45)};
};
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


// ---------- scene schedule ----------
const SCN: Scn[] = [
  {a: -1, b: ST[3] + 0.05, C: SceneOpen, tout: zoomThrough(ST[3] - 0.5, 0.55, CX, LY), blur: [[ST[3] - 0.4, ST[3] + 0.05]]},
  {a: ST[3] - 0.15, b: ST[5] + 0.25, C: SceneWord, tin: (t) => {const p = outQuint((t - ST[3] + 0.15) / 0.5); return {transform: `scale(${0.82 + 0.18 * p})`, opacity: clamp(p * 2)};},
    blur: [[ST[5] - 0.4, ST[5] + 0.15]]},
  {a: ST[5] - 0.1, b: ST[10] + 0.02, C: SceneVerse, tout: (t) => {const p = outQuint((t - ST[10] + 0.25) / 0.25); return {opacity: 1 - p};}},
  {a: ST[10] - 0.2, b: ST[13] - 0.05, C: ScenePieces, tout: (t) => {const p = quint((t - ST[13] + 0.4) / 0.38); return {transform: `scale(${1 + 0.5 * p})`, opacity: 1 - p};},
    blur: [[ST[13] - 0.4, ST[13] - 0.05]]},
  {a: ST[13] - 0.2, b: ST[15] - 0.06, C: SceneSky, tin: (t) => {const p = outQuint((t - ST[13] + 0.2) / 0.45); return {transform: `scale(${1.25 - 0.25 * p})`, opacity: clamp(p * 1.5)};},
    tout: (t) => {const p = quint((t - ST[15] + 0.5) / 0.42); return {transform: `scale(${1 + 0.35 * p})`, opacity: 1 - p, filter: `brightness(${1 - 0.6 * p})`};},
    blur: [[ST[15] - 0.45, ST[15] - 0.05]]},
  {a: ST[15] - 0.1, b: ST[17] - 0.12, C: SceneCross},
  {a: ST[17] - 0.2, b: ST[20] - 0.1, C: SceneSwap, tout: (t) => {const p = inQuint((t - ST[20] + 0.45) / 0.35); return {opacity: 1 - p, transform: `translateY(${-30 * p}px)`};}},
  {a: ST[20] - 0.2, b: VEND + 0.3, C: SceneClose},
];
const Heads: React.FC<{t: number}> = ({t}) => <>
  {t < ST[2] + 0.2 && <HookHead t={t} tout={ST[2] - 0.45} />}
  {t > ST[2] - 0.3 && t < ST[3] + 0.3 && <OneWord t={t} />}
  {t > ST[21] - 0.3 && t < VEND + 0.4 && <HookHead t={t} tin={ST[21] - 0.1} tout={1e9} />}
</>;

const Frame: React.FC<{t: number; noEnd?: boolean}> = ({t, noEnd}) => {
  const dim = win(t, ST[15] - 0.4, ST[17] - 0.2, 0.6, 0.8);
  const flash = Math.max(0, 1 - Math.abs(t - ST[3] + 0.06) / 0.16);       // the zoom-through lands in light
  return (
    <AbsoluteFill>
      <Background t={t} dim={dim} />
      {t < VEND + 0.35 && <>
        {SCN.map((s, j) => <SceneLayer key={j} s={s} t={t} />)}
        <Heads t={t} />
        <Card t={t} t0={ST[5] - 0.15} t1={ST[7] - 0.3} refTxt={'SURAH AL-NISA  ·  4:171'} ar={(EX as any)['4:171']} hl={[1]} fs={64} lh={110}
          lines={['“Do not go to excess in your religion.”']} />
        {LINES.map((_, i) => (i >= 1 && i <= 21 ? <Caption key={i} t={t} i={i} /> : null))}
        <Chrome t={t} />
      </>}
      {flash > 0 && <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 48%, rgba(255,244,214,.95), rgba(241,208,138,.55) 45%, rgba(241,208,138,0) 80%)', opacity: flash}} />}
      {!noEnd && <EndCard t={t} />}
      <Sweep t={t} t0={VEND - 0.3} d={1.1} />
    </AbsoluteFill>
  );
};

export const Ep07: React.FC = () => {
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

