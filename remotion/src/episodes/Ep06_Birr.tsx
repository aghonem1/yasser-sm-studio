import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame, continueRender, delayRender} from 'remotion';
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
  ['YFPlex', 'YF-Plex.ttf'], ['Amiri', 'Amiri-Bold.ttf'], ['AmiriQuran', 'AmiriQuran.ttf'],
];
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  Promise.all(FONTS.map(([fam, file, style, weight]) => {
    const f = new FontFace(fam, `url(${staticFile('fonts/' + file)})`, {style: style ?? 'normal', weight: weight ?? 'normal'});
    return f.load().then((ff) => (document as any).fonts.add(ff));
  })).then(() => continueRender(h)).catch((e) => {console.error(e); continueRender(h);});
}
const F = {cinzel: 'YFCinzel', cinzelB: 'YFCinzelB', body: 'YFSpectralSB, SpectralFull', it: 'YFCormIt, CormFull', plex: 'YFPlex', ar: 'Amiri', quran: 'AmiriQuran'};

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
// STORYBOARD (line → picture → what it says). Through-line object: the SCALE on the first step of a
// two-step staircase (step 1 = FAIR / qist, step 2 = MORE / birr).
//  0 Don't stop at being fair     → DON'T STOP / AT FAIR. on frame 1; staircase: the scale stands on step 1 (FAIR),
//                                   a raised "stop" hand blocks the way up; a ban ring is drawn over the hand
//  1 The Qur'an asks you for more → an arrow climbs from FAIR to the empty step 2: "?" → MORE
//  2 It's one word:               → "1 WORD" disc in the top zone
//  3 birr                         → Arabic بِرّ on top; a giving hand-and-heart draws on step 2, label BIRR
//  4 Generous kindness            → "birr · generous kindness" under the word; step 2 glows
//  5–7 60:8 (verse window: calm)  → card; under it "GOD DOES NOT… FORBID" with FORBID struck out; then, as named: ♥ KINDNESS ✓ · ⚖ JUSTICE ✓, then who it covers:
//                                   crossed swords with a ban (NOT FOUGHT YOU), a home with the exit arrow banned (NOT DRIVEN OUT)
//  8 Two words, side by side      → split panel: قِسْط | بِرّ, a scale | a giving hand-and-heart
//  9 qist: justice                → left panel lights: JUSTICE
// 10 birr: kindness               → right panel lights: KINDNESS
// 11 justice prevents harm        → split: a person (point of light); an arrow of harm flies at him and is stopped by the
//                                   raised hand of JUSTICE, ✗ on the arrow (NO HARM)
// 12 kindness moves us to help    → second person sunk low; a cupped hand lifts him up, arrow up (HELP)
// 13 keeps the balance straight   → big scale tilted; it levels exactly on "straight", ✓
// 14 fills life with warmth       → hearts drop into both pans (balance kept), a sun rises behind, the frame turns warm
// 15 hard part                    → THE HARD PART (dim)
// 16 if difference made kindness wrong → two homes in different colours (neighbours of different faiths), a giving
//                                   hand-and-heart between them; on "wrong" a red ✗ lands on it (the "if")
// 17 the Qur'an would not have permitted birr → as the line starts the ✗ is lifted off, the Book + "BUT THE QUR'AN PERMITS بِرّ" ✓ (60:8), the link glows
// 18 So be just                   → callback to the staircase: the scale on step 1 gets ✓ BE JUST
// 19 Then go further              → the arrow climbs to step 2
// 20 care, goodwill, active help  → ticked list CARE ✓ GOODWILL ✓ ACTIVE HELP ✓, step 2 lights
// 21 Don't stop at fair           → callback to frame 1: DON'T STOP / AT FAIR. returns, the stop hand is banned again
// 22 a new word every day         → end card: book cover + "A NEW WORD EVERY DAY"
// SILENT TEST: muted, the staircase (FAIR → MORE), the ticks/bans, the scale vs. the helping hand and the ✗ → ✓ on
// kindness across difference carry the argument. No picture here would fit under a different line unchanged.
// =====================================================================================
const RED = '#d9624f';
const Lbl: React.FC<{x: number; y: number; w?: number; p: number; size?: number; c?: string; align?: 'left' | 'center'; children: React.ReactNode}> = ({x, y, w = 600, p, size = 34, c = CREAM, align = 'left', children}) =>
  p <= 0 ? null : <Reveal p={p} style={{left: align === 'center' ? x - w / 2 : x, top: y, width: w, textAlign: align}}>
    <div style={{fontFamily: F.cinzelB, fontSize: size, letterSpacing: size * 0.12, lineHeight: 1.18, color: c}}>{children}</div></Reveal>;
const Halo: React.FC<{x: number; y: number; r: number; o: number}> = ({x, y, r, o}) => o <= 0 ? null :
  <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: o,
    background: 'radial-gradient(closest-side, rgba(241,208,138,.30), rgba(241,208,138,.08) 55%, rgba(241,208,138,0))'}} />;
const Sub: React.FC<{children: React.ReactNode; size?: number}> = ({children, size = 32}) => <span style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: size, letterSpacing: 0, color: CREAM}}>{children}</span>;
const bigTxt = (size: number): React.CSSProperties => ({fontFamily: F.cinzelB, fontSize: size, letterSpacing: 4, ...goldText, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,.55))'});

// ---------- the staircase (through-line) ----------
const S1X = 385, S1Y = 1080, S2X = 760, S2Y = 880;
const STAIR = 'M 110 1236 L 210 1236 L 210 1080 L 560 1080 L 560 880 L 965 880';
const ARROW = 'M 430 905 C 440 760 560 700 680 735';
const Stairs: React.FC<{p: number; arrow: number; glow2: number}> = ({p, arrow, glow2}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
    <path d="M 210 1236 L 210 1080 L 560 1080 L 560 880 L 965 880 L 965 1236 Z" fill="rgba(13,23,42,.55)" opacity={clamp(p * 1.5)} />
    <Line d={STAIR} p={p} w={6} c={GOLD} o={0.95} />
    <Line d={ARROW} p={arrow} w={6} c={GOLDL} o={0.95} />
    {arrow > 0.95 && <path d="M 652 712 L 684 736 L 648 754" stroke={GOLDL} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={clamp((arrow - 0.95) * 20)} />}
  </svg>
);
const GiveHeart: React.FC<{x: number; y: number; s: number; p: number; glow?: number}> = ({x, y, s, p, glow = 0}) => p <= 0 ? null : <>
  <Halo x={x} y={y} r={s * 0.95} o={0.35 * p + 0.65 * glow} />
  <Icon name="heart-handshake" x={x} y={y} size={s} p={p} sw={6} c={GOLDL} />
</>;

// ---------- scene A: hook + staircase + one word ----------
const HookText: React.FC<{t: number; a0?: number; a1?: number}> = ({t, a0 = -1, a1 = ST[2] - 0.35}) => {
  const a = t < 0.01 && a0 < 0 ? 1 : win(t, a0, a1, a0 < 0 ? 0 : 0.35, 0.3); if (a <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: a}}>
      <div style={{position: 'absolute', top: 392, width: W, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 92, letterSpacing: 6, lineHeight: '120px', color: CREAM,
        filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.55))'}}>DON'T STOP</div>
      <div style={{position: 'absolute', top: 510, width: W, textAlign: 'center'}}><span style={{...bigTxt(132), lineHeight: '170px'}}>AT FAIR.</span></div>
    </AbsoluteFill>
  );
};
const Hook: React.FC<{t: number}> = ({t}) => {
  const ban = k(t, wt(0, 'stop') - 0.1, 0.55, outCubic);
  const arrow = k(t, ST[1] - 0.1, 0.8, inOut), q = 1 - k(t, ST[3] - 0.25, 0.3), more = k(t, wt(1, 'more') - 0.1, 0.5);
  const gh = k(t, ST[3] - 0.15, 0.8), lblB = k(t, ST[3] + 0.05, 0.5), gen = k(t, ST[4] - 0.1, 0.6);
  return (
    <AbsoluteFill>
      <Stairs p={1} arrow={arrow} glow2={gen} />
      <Halo x={S1X} y={1000} r={170} o={0.55} />
      <Icon name="scale" x={S1X - 20} y={995} size={150} p={1} sw={6} c={GOLDL} />
      <Icon name="hand-stop" x={505} y={1000} size={105} p={1} sw={6} c={CREAM} o={1 - 0.35 * ban} />
      <Mark kind="ban" x={505} y={1000} size={150} p={ban} sw={10} />
      <Lbl x={S1X} y={1112} w={340} p={1} align="center" c={CREAM} size={40}>FAIR<br /><Sub size={30}>qist</Sub></Lbl>
      <div style={{position: 'absolute', left: S2X - 100, top: 720, width: 200, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 130, lineHeight: '150px',
        color: GOLDL, opacity: (0.35 + 0.65 * arrow) * q}}>?</div>
      <GiveHeart x={S2X} y={795} s={165} p={gh} glow={gen} />
      <Lbl x={S2X} y={930} w={380} p={more * (1 - lblB)} align="center" c={GOLDL} size={44}>MORE</Lbl>
      <Lbl x={S2X} y={930} w={380} p={lblB} align="center" c={GOLDL} size={44}>BIRR<br /><Sub size={30}>{gen > 0 ? 'generous kindness' : ''}</Sub></Lbl>
    </AbsoluteFill>
  );
};
const OneWordDisc: React.FC<{t: number}> = ({t}) => {
  const a = win(t, ST[2] - 0.2, ST[3] - 0.3, 0.3, 0.25); if (a <= 0) return null; const one = k(t, wt(2, 'one') - 0.1, 0.5, outBack);
  return <div style={{position: 'absolute', left: CX - 140, top: 400, width: 280, height: 280, borderRadius: '50%', border: `5px solid ${GOLDL}`, opacity: a,
    transform: `scale(${0.6 + 0.4 * one})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(241,208,138,.25)'}}>
    <div style={{fontFamily: F.cinzelB, fontSize: 140, lineHeight: '140px', ...goldText}}>1</div>
    <div style={{fontFamily: F.cinzelB, fontSize: 32, letterSpacing: 6, color: CREAM}}>WORD</div>
  </div>;
};
const WordBlock: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[3] - 0.25, t1 = ST[5] - 0.3; const a = win(t, t0, t1, 0.3, 0.3); if (a <= 0) return null;
  const p = k(t, t0, 0.8, outExpo), m = k(t, ST[4] - 0.1, 0.6, outExpo);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <div dir="rtl" lang="ar" style={{position: 'absolute', top: 415, width: W, textAlign: 'center', fontFamily: F.ar, fontSize: 170, lineHeight: '230px', color: '#efc874',
        transform: `translateY(${(1 - p) * 24}px) scale(${0.96 + 0.04 * p})`, opacity: p, textShadow: '0 6px 22px rgba(0,0,0,.55), 0 0 40px rgba(241,208,138,.25)'}}>بِرّ</div>
      <Reveal p={m} style={{left: 0, top: 650, width: W, textAlign: 'center'}}>
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 46, color: CREAM}}>birr · generous kindness</div>
      </Reveal>
    </AbsoluteFill>
  );
};

// ---------- scene B: 60:8 (verse window: calm) ----------
const Verse: React.FC<{t: number}> = ({t}) => {
  const tK = wt(5, 'kindness'), tJ = wt(5, 'justice'), tF = wt(6, 'fought'), tH = wt(7, 'homes'), tD = wt(7, 'driven');
  const a1 = k(t, tK - 0.15, 0.7), a2 = k(t, tJ - 0.15, 0.7), a3 = k(t, ST[6] - 0.05, 0.8), a4 = k(t, ST[7] - 0.1, 0.8);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 1010, width: W, textAlign: 'center', opacity: k(t, ST[5] + 0.1, 0.5) * (1 - k(t, ST[6] - 0.45, 0.35))}}>
        <div style={{fontFamily: F.cinzelB, fontSize: 30, letterSpacing: 6, color: CREAM, opacity: 0.8, marginBottom: 6}}>GOD DOES NOT…</div>
        <StrikeIn p={k(t, wt(5, 'forbid') + 0.1, 0.45)} sw={10}><span style={{fontFamily: F.cinzelB, fontSize: 86, letterSpacing: 6, color: CREAM}}>FORBID</span></StrikeIn></div>
      <GiveHeart x={320} y={835} s={140} p={a1} />
      <Lbl x={320} y={920} w={380} p={a1} align="center" c={GOLDL} size={32}>KINDNESS</Lbl>
      <Mark kind="check" x={430} y={870} size={70} p={k(t, tK + 0.25, 0.4)} sw={9} />
      <Halo x={760} y={835} r={130} o={0.4 * a2} />
      <Icon name="scale" x={760} y={835} size={140} p={a2} sw={6} c={GOLDL} />
      <Lbl x={760} y={920} w={380} p={a2} align="center" c={GOLDL} size={32}>JUSTICE</Lbl>
      <Mark kind="check" x={870} y={870} size={70} p={k(t, tJ + 0.25, 0.4)} sw={9} />
      <div style={{position: 'absolute', left: 150, top: 985, width: 780, height: 1.5, opacity: 0.45 * a3, background: `linear-gradient(90deg, ${CREAM}00, ${CREAM}, ${CREAM}00)`}} />
      <Lbl x={CX} y={1002} w={700} p={a3} align="center" c={CREAM} size={26}>TOWARDS THOSE WHO HAVE…</Lbl>
      <Icon name="swords" x={320} y={1105} size={115} p={a3} sw={6} c={CREAM} />
      <Mark kind="ban" x={320} y={1105} size={150} p={k(t, tF - 0.05, 0.6)} sw={9} />
      <Lbl x={320} y={1180} w={420} p={k(t, tF - 0.1, 0.5)} align="center" c={CREAM} size={28}>NOT FOUGHT YOU</Lbl>
      <Icon name="home" x={735} y={1105} size={115} p={a4} sw={6} c={CREAM} />
      <Icon name="arrow-right" x={835} y={1115} size={70} p={k(t, tD - 0.1, 0.4)} sw={6} c={CREAM} />
      <Mark kind="ban" x={835} y={1112} size={95} p={k(t, tH - 0.15, 0.55)} sw={8} />
      <Lbl x={760} y={1180} w={420} p={k(t, tD - 0.1, 0.5)} align="center" c={CREAM} size={28}>NOT DRIVEN OUT</Lbl>
    </AbsoluteFill>
  );
};

// ---------- scene C: two words side by side ----------
const Pair: React.FC<{t: number}> = ({t}) => {
  const a = k(t, ST[8] - 0.1, 0.7, outExpo), b = k(t, wt(8, 'side') - 0.1, 0.7, outExpo);
  const L = k(t, wt(9, 'justice') - 0.1, 0.5), R = k(t, wt(10, 'kindness') - 0.1, 0.5);
  const fL = 0.55 + 0.45 * clamp(L * 2) * (1 - 0.4 * R), fR = 0.55 + 0.45 * R;
  return (
    <AbsoluteFill>
      <div dir="rtl" lang="ar" style={{position: 'absolute', left: 300 - 260, top: 380, width: 520, textAlign: 'center', fontFamily: F.ar, fontSize: 150, lineHeight: '220px',
        color: '#efc874', opacity: a * fL, transform: `translateY(${(1 - a) * 20}px)`, textShadow: '0 6px 22px rgba(0,0,0,.55)'}}>قِسْط</div>
      <div dir="rtl" lang="ar" style={{position: 'absolute', left: 780 - 260, top: 380, width: 520, textAlign: 'center', fontFamily: F.ar, fontSize: 150, lineHeight: '220px',
        color: '#efc874', opacity: b * fR, transform: `translateY(${(1 - b) * 20}px)`, textShadow: '0 6px 22px rgba(0,0,0,.55)'}}>بِرّ</div>
      <Lbl x={300} y={615} w={400} p={a} align="center" c={CREAM} size={30}><Sub size={44}>qist</Sub></Lbl>
      <Lbl x={780} y={615} w={400} p={b} align="center" c={CREAM} size={30}><Sub size={44}>birr</Sub></Lbl>
      <div style={{position: 'absolute', left: CX - 2, top: 420, width: 4, height: 800 * Math.max(a, b), background: `linear-gradient(180deg, ${CREAM}00, ${CREAM}88, ${CREAM}00)`}} />
      <Halo x={300} y={930} r={210} o={0.7 * L * (1 - 0.5 * R)} />
      <div style={{opacity: fL}}><Icon name="scale" x={300} y={930} size={230} p={a} sw={6} c={GOLDL} /></div>
      <div style={{opacity: fR}}><GiveHeart x={780} y={930} s={230} p={b} glow={R} /></div>
      <Lbl x={300} y={1105} w={440} p={L} align="center" c={GOLDL} size={42}>JUSTICE</Lbl>
      <Lbl x={780} y={1105} w={440} p={R} align="center" c={GOLDL} size={42}>KINDNESS</Lbl>
    </AbsoluteFill>
  );
};

// ---------- scene D: what each one does ----------
const Does: React.FC<{t: number}> = ({t}) => {
  const t1 = ST[11], tP = wt(11, 'prevents'), tH = wt(11, 'harming'), t2 = ST[12], tHelp = wt(12, 'help');
  const l = k(t, t1 - 0.1, 0.6, outExpo), hand = k(t, tP - 0.15, 0.45, outBack), fly = k(t, t1 + 0.1, Math.max(0.6, tH - t1 - 0.1), inOut), x = k(t, tH + 0.05, 0.4);
  const r = k(t, t2 - 0.1, 0.6, outExpo), lift = k(t, tHelp - 0.25, 0.8, inOut);
  const ax = mix(70, 168, fly) - 10 * x;
  const py = mix(1175, 965, lift);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: CX - 2, top: 420, width: 4, height: 800 * Math.max(l, r), background: `linear-gradient(180deg, ${CREAM}00, ${CREAM}88, ${CREAM}00)`}} />
      <Lbl x={290} y={440} w={460} p={l} align="center" c={GOLDL} size={50}>JUSTICE<br /><Sub size={40}>prevents harm</Sub></Lbl>
      <Lbl x={790} y={440} w={460} p={r} align="center" c={GOLDL} size={50}>KINDNESS<br /><Sub size={40}>moves us to help</Sub></Lbl>
      {/* left: harm stopped */}
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: l}}>
        <g transform={`translate(${ax} 1000) rotate(${8 * x})`}>
          <path d="M -60 0 L 40 0" stroke={RED} strokeWidth={7} strokeLinecap="round" opacity={0.9} />
          <path d="M 22 -16 L 44 0 L 22 16" stroke={RED} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M -60 0 L -78 -14 M -60 0 L -78 14" stroke={RED} strokeWidth={5} strokeLinecap="round" />
        </g>
      </svg>
      <Icon name="hand-stop" x={265} y={1000} size={150 * (0.7 + 0.3 * hand)} p={hand} sw={6} c={GOLDL} />
      <Svg><Light x={410} y={1000} r={18} o={l} /></Svg>
      <Mark kind="x" x={140} y={1000} size={90} p={x} sw={10} />
      <Lbl x={290} y={1150} w={420} p={k(t, tH, 0.5)} align="center" c={CREAM} size={32}>NO HARM</Lbl>
      {/* right: lifted up */}
      <Svg><Light x={790} y={py - 22} r={18} o={r} /></Svg>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: r}}>
        <path d={`M 715 ${py - 20} Q 790 ${py + 55} 865 ${py - 20}`} stroke={GOLDL} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d={`M 700 ${py - 30} L 715 ${py - 20} M 880 ${py - 30} L 865 ${py - 20}`} stroke={GOLDL} strokeWidth={7} fill="none" strokeLinecap="round" />
      </svg>
      <Icon name="arrow-down" x={930} y={1060} size={90} p={k(t, tHelp - 0.2, 0.5)} sw={6} c={GOLDL} rot={180} />
      <Lbl x={790} y={1150} w={420} p={k(t, tHelp - 0.1, 0.5)} align="center" c={GOLDL} size={32}>HELP</Lbl>
    </AbsoluteFill>
  );
};

// ---------- scene E: the balance kept straight, then filled with warmth ----------
const Balance: React.FC<{t: number}> = ({t}) => {
  const t1 = ST[13], tS = wt(13, 'straight'), t2 = ST[14], tW = wt(14, 'warmth');
  const sc = k(t, t1 - 0.2, 0.8), lev = k(t, tS - 0.3, 0.6, inOut);
  const ang = (t < tS - 0.3 ? 11 * Math.cos((t - t1) * 3.2) * 0.4 + 7 : 11) * (1 - lev);
  const top1 = k(t, t1 - 0.1, 0.5, outExpo) * (1 - k(t, t2 - 0.3, 0.3)), top2 = k(t, t2 - 0.1, 0.5, outExpo);
  const hearts = k(t, wt(14, 'fills') - 0.1, 0.7, outCubic), sun = k(t, wt(14, 'life') - 0.2, 1.2, outCubic), warm = k(t, tW - 0.3, 0.9);
  const rad = (ang * Math.PI) / 180, Lx = CX - 270 * Math.cos(rad), Ly = 840 - 270 * Math.sin(rad), Rx = CX + 270 * Math.cos(rad), Ry = 840 + 270 * Math.sin(rad);
  const pan = (x: number, y: number) => `M ${x} ${y} L ${x - 75} ${y + 150} M ${x} ${y} L ${x + 75} ${y + 150} M ${x - 95} ${y + 150} Q ${x} ${y + 215} ${x + 95} ${y + 150} Z`;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: -200, top: 500, width: 1480, height: 1000, opacity: warm,
        background: 'radial-gradient(closest-side, rgba(236,170,80,.30), rgba(236,170,80,.10) 55%, rgba(236,170,80,0))'}} />
      <Halo x={CX} y={mix(1150, 790, sun)} r={260} o={sun} />
      <Icon name="sun" x={CX} y={mix(1150, 760, sun)} size={170} p={sun} sw={5} c={GOLDL} o={sun} />
      <div style={{position: 'absolute', top: 430, width: W, textAlign: 'center', opacity: top1}}>
        <div style={{...bigTxt(96)}}>JUSTICE</div><div style={{marginTop: -6}}><Sub size={46}>keeps the balance straight</Sub></div></div>
      <div style={{position: 'absolute', top: 430, width: W, textAlign: 'center', opacity: top2}}>
        <div style={{...bigTxt(96)}}>KINDNESS</div><div style={{marginTop: -6}}><Sub size={46}>fills life with warmth</Sub></div></div>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <Line d={`M ${CX} 1215 L ${CX} 840`} p={sc} w={7} c={GOLD} o={0.95} />
        <Line d={`M ${CX - 130} 1220 L ${CX + 130} 1220`} p={sc} w={7} c={GOLD} o={0.95} />
        {sc > 0.3 && <>
          <path d={`M ${Lx} ${Ly} L ${Rx} ${Ry}`} stroke={GOLDL} strokeWidth={7} strokeLinecap="round" opacity={clamp((sc - 0.3) * 2)} />
          <path d={pan(Lx, Ly)} stroke={CREAM} strokeWidth={4} fill="rgba(13,23,42,.6)" strokeLinejoin="round" opacity={clamp((sc - 0.3) * 2)} />
          <path d={pan(Rx, Ry)} stroke={CREAM} strokeWidth={4} fill="rgba(13,23,42,.6)" strokeLinejoin="round" opacity={clamp((sc - 0.3) * 2)} />
          <circle cx={CX} cy={840} r={12} fill={GOLDL} />
        </>}
      </svg>
      {[Lx, Rx].map((x, j) => {const y = (j ? Ry : Ly) + 150; const d = clamp(hearts * 1.3 - 0.3 * j);
        return <Icon key={j} name="heart" x={x} y={mix(y - 260, y - 22, outCubic(d))} size={84} p={d > 0 ? 1 : 0} sw={6} c={GOLDL} o={clamp(d * 3)} />;})}
      <Mark kind="check" x={CX + 200} y={1150} size={110} p={k(t, tS + 0.05, 0.45)} sw={11} />
    </AbsoluteFill>
  );
};

// ---------- scene F: the hard part — if difference made kindness wrong… ----------
const Hard: React.FC<{t: number}> = ({t}) => {
  const tH = ST[15], t16 = ST[16], tD = wt(16, 'difference'), tK = wt(16, 'kindness'), tWr = wt(16, 'wrong'), t17 = ST[17], tP = wt(17, 'permitted');
  const head = k(t, tH - 0.1, 0.6, outExpo) * (1 - k(t, t16 - 0.35, 0.35));
  const top1 = k(t, t16 - 0.1, 0.5, outExpo) * (1 - k(t, t17 - 0.3, 0.3)), top2 = k(t, t17 - 0.1, 0.5, outExpo);
  const homes = k(t, tD - 0.2, 0.7), link = k(t, tK - 0.2, 0.7), xx = k(t, tWr - 0.05, 0.45), lift = k(t, t17 + 0.25, 0.45, inOut);
  const ok = k(t, t17 + 0.7, 0.45), glow = k(t, t17 + 0.7, 0.8);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 560, width: W, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 92, letterSpacing: 6, opacity: head, ...goldText,
        transform: `scale(${0.94 + 0.06 * head})`}}>THE HARD PART</div>
      <div style={{position: 'absolute', top: 420, width: W, textAlign: 'center', opacity: top1, fontFamily: F.cinzelB, fontSize: 54, letterSpacing: 3, lineHeight: '74px', color: CREAM}}>
        IF DIFFERENCE MADE<br /><span style={goldText}>KINDNESS</span> <span style={{color: RED}}>WRONG…</span></div>
      <div style={{position: 'absolute', top: 395, width: W, textAlign: 'center', opacity: top2, fontFamily: F.cinzelB, fontSize: 50, letterSpacing: 3, lineHeight: '70px', color: CREAM}}>
        BUT THE QUR'AN PERMITS</div>
      <div dir="rtl" lang="ar" style={{position: 'absolute', top: 515, width: W, textAlign: 'center', opacity: top2, fontFamily: F.ar, fontSize: 115, lineHeight: '165px', color: '#efc874',
        textShadow: '0 6px 22px rgba(0,0,0,.55)'}}>بِرّ</div>
      <Mark kind="check" x={CX + 130} y={615} size={100} p={ok} sw={11} />
      <div style={{opacity: Math.max(homes, top2)}}>
        <Icon name="home" x={250} y={1000} size={190} p={homes} sw={6} c={GOLDL} />
        <Icon name="home" x={830} y={1000} size={190} p={homes} sw={6} c={SLATE} glow={0} />
        <Lbl x={CX} y={1150} w={860} p={homes} align="center" c={CREAM} size={28}>NEIGHBOURS · DIFFERENT FAITHS</Lbl>
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <Line d="M 350 1000 L 440 1000" p={link} w={4} c={GOLDL} o={0.8} dash="2 12" />
          <Line d="M 640 1000 L 730 1000" p={link} w={4} c={GOLDL} o={0.8} dash="2 12" />
        </svg>
        <GiveHeart x={CX} y={995} s={170} p={link} glow={glow} />
        <div style={{opacity: 1 - lift, transform: `translateY(${-90 * lift}px)`}}><Mark kind="x" x={CX} y={995} size={190} p={xx} sw={13} /></div>
        <Icon name="book-2" x={CX} y={800} size={100} p={k(t, t17, 0.6)} sw={5} c={GOLDL} />
        <Lbl x={CX} y={1200} w={500} p={k(t, t17 + 0.7, 0.5)} align="center" c={GOLDL} size={26}>60:8</Lbl>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene G: close — be just, then go further; callback to frame 1 ----------
const CARE = [{w: 'care', label: 'CARE'}, {w: 'goodwill', label: 'GOODWILL'}, {w: 'active', label: 'ACTIVE HELP'}];
const Close: React.FC<{t: number}> = ({t}) => {
  const t18 = ST[18], t19 = ST[19], t20 = ST[20], t21 = ST[21], tStop = wt(21, 'stop');
  const okS = k(t, wt(18, 'just') + 0.05, 0.45), arrow = k(t, t19 - 0.1, 0.8, inOut), lit = k(t, t20 - 0.2, 0.9);
  const top18 = k(t, t18 + 0.05, 0.5, outExpo) * (1 - k(t, t19 - 0.3, 0.3)), top19 = k(t, t19 - 0.1, 0.5, outExpo) * (1 - k(t, t20 - 0.3, 0.3));
  const list = 1 - k(t, t21 - 0.35, 0.3), hand = k(t, t21 - 0.1, 0.5, outExpo), ban = k(t, tStop - 0.05, 0.55, outCubic);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 470, width: W, textAlign: 'center', opacity: top18}}><span style={bigTxt(110)}>BE JUST</span></div>
      <div style={{position: 'absolute', top: 440, width: W, textAlign: 'center', opacity: top19}}>
        <div style={{fontFamily: F.cinzelB, fontSize: 60, letterSpacing: 5, color: CREAM}}>THEN</div><div style={bigTxt(100)}>GO FURTHER</div></div>
      <div style={{opacity: list}}>{CARE.map((q, j) => {const tw = wt(20, q.w), a = k(t, tw - 0.15, 0.45, outExpo);
        return <div key={j} style={{position: 'absolute', left: 0, top: 0, opacity: a, transform: `translateX(${(1 - a) * -30}px)`}}>
          <div style={{position: 'absolute', left: 330, top: 420 + j * 92, fontFamily: F.cinzelB, fontSize: 54, letterSpacing: 4, lineHeight: '70px', whiteSpace: 'nowrap', ...goldText}}>{q.label}</div>
          <Mark kind="check" x={270} y={455 + j * 92} size={70} p={k(t, tw + 0.15, 0.4)} sw={9} />
        </div>;})}</div>
      <Stairs p={1} arrow={arrow} glow2={lit} />
      <Halo x={S1X} y={1000} r={170} o={0.55} />
      <Icon name="scale" x={S1X - 20} y={995} size={150} p={1} sw={6} c={GOLDL} />
      <Mark kind="check" x={S1X + 110} y={930} size={90} p={okS * (1 - hand)} sw={10} />
      <Lbl x={S1X} y={1112} w={340} p={1} align="center" c={CREAM} size={40}>FAIR<br /><Sub size={30}>qist</Sub></Lbl>
      <GiveHeart x={S2X} y={795} s={165} p={1} glow={lit} />
      <Lbl x={S2X} y={930} w={380} p={1} align="center" c={GOLDL} size={44}>BIRR<br /><Sub size={30}>generous kindness</Sub></Lbl>
      <div style={{opacity: hand}}>
        <Icon name="hand-stop" x={505} y={1000} size={105} p={hand} sw={6} c={CREAM} o={1 - 0.35 * ban} />
        <Mark kind="ban" x={505} y={1000} size={150} p={ban} sw={10} />
      </div>
    </AbsoluteFill>
  );
};

const SCN: [number, number, React.FC<{t: number}>][] = [
  [-1, ST[5] - 0.3, Hook],
  [ST[5] - 0.35, ST[8] - 0.3, Verse],
  [ST[8] - 0.35, ST[11] - 0.3, Pair],
  [ST[11] - 0.35, ST[13] - 0.3, Does],
  [ST[13] - 0.35, ST[15] - 0.3, Balance],
  [ST[15] - 0.35, ST[18] + 0.2, Hard],
  [ST[18] - 0.05, VEND + 0.25, Close],
];
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

// ---------- assembly ----------
const Frame: React.FC<{t: number; noEnd?: boolean}> = ({t, noEnd}) => {
  const dim = win(t, ST[15] - 0.4, ST[18] - 0.2, 0.6, 0.8);
  return (
    <AbsoluteFill>
      <Background t={t} dim={dim} />
      {t < VEND + 0.35 && <>
        {SCN.map(([a0, a1, C], j) => {
          const a = j === 0 ? (t <= a1 - 0.3 ? 1 : clamp((a1 - t) / 0.3)) : win(t, a0, a1, 0.35, 0.3); if (a <= 0) return null;
          const push = 1 + 0.02 * clamp((t - Math.max(a0, 0)) / (a1 - Math.max(a0, 0))) + (j === 0 ? 0 : 0.03 * (1 - k(t, a0, 0.5, outCubic)));
          return <AbsoluteFill key={j} style={{opacity: a, transform: `scale(${push})`, transformOrigin: `${CX}px ${CY}px`}}><C t={t} /></AbsoluteFill>;
        })}
        <HookText t={t} />
        <HookText t={t} a0={ST[21] - 0.1} a1={VEND + 0.3} />
        <OneWordDisc t={t} />
        <WordBlock t={t} />
        <Card t={t} t0={ST[5] - 0.15} t1={ST[8] - 0.4} refTxt={'SURAH AL-MUMTAHANAH  ·  60:8'} ar={(EX as any)['60:8']} hl={[1, 2]} fs={50} lh={96}
          lines={['“God does not forbid you from treating with kindness', 'and justice those who have not fought you because', 'of your faith or driven you from your homes.”']} />
        {LINES.map((_, i) => (i >= 1 && i <= 21 ? <Caption key={i} t={t} i={i} /> : null))}
        <Chrome t={t} />
      </>}
      {!noEnd && <EndCard t={t} />}
      <Sweep t={t} t0={ST[3] - 0.55} />
      <Sweep t={t} t0={ST[15] - 0.5} />
      <Sweep t={t} t0={VEND - 0.3} d={1.1} />
    </AbsoluteFill>
  );
};

export const Ep06: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const loop = clamp((t - (TOTAL - 0.5)) / 0.4);
  return (
    <AbsoluteFill style={{background: INK}}>
      <Frame t={t} />
      {loop > 0 && <AbsoluteFill style={{opacity: loop}}><Frame t={0} noEnd /></AbsoluteFill>}
    </AbsoluteFill>
  );
};
