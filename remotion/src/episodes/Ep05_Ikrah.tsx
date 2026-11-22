import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame, continueRender, delayRender} from 'remotion';
import TL from './timeline_ep05.json';
import EX from '../excerpts.json';
import {Icon, Mark, Strike, StrikeIn} from '../lib/icons';

// =====================================================================================
// One Word · 05 · ikrāh — same design system as Ep04 (reference)
//  - every person is a point of light; knowing one another = lines between lights
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
      ONE WORD &nbsp;·&nbsp; 05 &nbsp;·&nbsp; FROM THE MIRROR</div>
    {bar && <div style={{position: 'absolute', top: 1512, left: 160, width: W - 320, height: 2, background: 'rgba(201,164,87,.18)', borderRadius: 2}}>
      <div style={{width: `${clamp(t / VEND) * 100}%`, height: 2, background: GOLDL, borderRadius: 2}} /></div>}
  </AbsoluteFill>
);

// ---------- verse card ----------
const Card: React.FC<{t: number; t0: number; t1: number; refTxt: string; ar: string; hl: number; lines: string[]; fs?: number; lh?: number}> = ({t, t0, t1, refTxt, ar, hl, lines, fs = 58, lh = 108}) => {
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
          return <span key={j} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 10}px)`, color: j === hl ? '#a06a0c' : NAVY}}>{w}</span>;})}
        <span style={{color: BROWN}}>{'﴾'}</span>
      </div>
      <div style={{fontFamily: F.it, fontSize: 35, lineHeight: 1.2, color: '#2c3550'}}>{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
    </div>
  );
};

// ---------- captions: balanced rows, words revealed as spoken ----------
const KEY: Record<number, string> = {1: 'heart.', 2: 'word:', 3: 'ikrāh.', 4: 'Compulsion.', 5: 'compulsion', 6: 'clear', 7: 'words.', 8: 'belief.', 9: 'truth',
  10: 'believe,', 11: 'reject.”', 12: 'hard', 13: 'equal', 14: 'choose,', 15: 'force.', 16: 'wisdom', 17: 'beautifully.', 18: 'heart.'};
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
// STORYBOARD (line → picture → what it says). Through-line object: the LOCKED HEART.
//  0 Stop forcing faith          → STOP FORCING / FAITH. on frame 1; a grabbing hand shoves at a heart with a padlock; the lock holds
//  1 tongue, never the heart     → split panel: speech bubble "THE TONGUE · force wins it" ✓ | locked heart "THE HEART · never" ✗
//  2 one word                    → the Book + a "1 WORD" counter
//  3–4 ikrāh / Compulsion        → Arabic word on top; the hand closes round a small heart, label COMPULSION
//  5 no compulsion (2:256 card)  → ban ring drawn over the grabbing hand: NO COMPULSION   (verse window: calm)
//  6 right way clear from wrong  → a fork in the road: the right way lit gold ✓, the wrong way dim   (verse window: calm)
//  7 force can: say the words    → list "FORCE CAN…": ✓ SAY THE WORDS (speech bubble)
//  8 cannot create belief        → ✗ CREATE BELIEF struck out; the locked heart stays shut
//  9 truth is from your Lord     → a lamp shines down (18:29 card)   (verse window: calm)
// 10–11 may believe / may reject → two doors in that light: BELIEVE | REJECT, each opens as it is named   (verse window: calm)
// 12 hard part                   → THE HARD PART
// 13 not equal before God        → formula BELIEF = REJECTION, the "=" struck; a scale with a ✗: NOT EQUAL BEFORE GOD
// 14 we choose, we carry it      → split: signpost "WE CHOOSE" | a weight lowered onto an open hand "WE CARRY IT"
// 15 not opened by force         → FORCE struck on top; the hand yanks the padlock, it does not give: ✗
// 16 truth, wisdom, reflection   → ticked list TRUTH ✓ WISDOM ✓ SINCERE REFLECTION ✓ while a key travels to the lock; it turns, the heart opens
// 17 present the truth beautifully → swap FORCE → PRESENT; the open heart in full light
// 18 never force the heart       → callback to frame 1: the grabbing hand returns and is banned; the heart stays open
// 19 a new word every day        → end card: book cover + "A NEW WORD EVERY DAY"
// SILENT TEST: muted, the hook text, ticks/crosses, labels and the lock → key → open heart carry the argument.
// =====================================================================================
const RED = '#d9624f';
const Lbl: React.FC<{x: number; y: number; w?: number; p: number; size?: number; c?: string; align?: 'left' | 'center'; pill?: boolean; children: React.ReactNode}> = ({x, y, w = 600, p, size = 34, c = CREAM, align = 'left', pill, children}) =>
  p <= 0 ? null : <Reveal p={p} style={{left: align === 'center' ? x - w / 2 : x, top: y, width: w, textAlign: align}}>
    <div style={{fontFamily: F.cinzelB, fontSize: size, letterSpacing: size * 0.12, lineHeight: 1.18, color: c}}>
      {pill ? <span style={{background: 'rgba(7,12,23,.82)', padding: '6px 18px', borderRadius: 30, border: '1px solid rgba(241,208,138,.35)'}}>{children}</span> : children}</div></Reveal>;
const Halo: React.FC<{x: number; y: number; r: number; o: number}> = ({x, y, r, o}) => o <= 0 ? null :
  <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: o,
    background: 'radial-gradient(closest-side, rgba(241,208,138,.30), rgba(241,208,138,.08) 55%, rgba(241,208,138,0))'}} />;
const Sub: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 32, letterSpacing: 0, color: CREAM}}>{children}</span>;

// the through-line: a heart with a padlock on it
const LockHeart: React.FC<{x: number; y: number; s: number; p: number; open?: number; shake?: number; glow?: number}> = ({x, y, s, p, open = 0, shake = 0, glow = 0}) => p <= 0 ? null : (
  <>
    <Halo x={x} y={y} r={s * 0.9} o={0.3 * p + 0.7 * glow} />
    <Icon name="heart" x={x} y={y} size={s} p={p} sw={6} c={GOLDL} />
    <div style={{position: 'absolute', left: x - s * 0.19 + shake, top: y - s * 0.16, width: s * 0.38, height: s * 0.38, borderRadius: '50%',
      background: 'rgba(9,15,28,.94)', opacity: clamp(p * 2) * (1 - open)}} />
    <Icon name={open > 0.5 ? 'lock-open' : 'lock'} x={x + shake} y={y + s * 0.03} size={s * 0.3} p={clamp(p * 1.5 - 0.3)} sw={5} c={CREAM} rot={shake * 0.5} o={1 - clamp((open - 0.5) * 2) * 0.0} />
  </>
);
const bigTxt = (size: number): React.CSSProperties => ({fontFamily: F.cinzelB, fontSize: size, letterSpacing: 4, ...goldText, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,.55))'});

// ---------- scene A: hook (frame 1 at full brightness) ----------
const HookText: React.FC<{t: number}> = ({t}) => {
  const out = k(t, ST[2] - 0.6, 0.35);
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <div style={{position: 'absolute', top: 392, width: W, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 92, letterSpacing: 6, lineHeight: '120px', color: CREAM,
        filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.55))'}}>STOP FORCING</div>
      <div style={{position: 'absolute', top: 505, width: W, textAlign: 'center'}}><span style={{...bigTxt(150), lineHeight: '190px'}}>FAITH.</span></div>
    </AbsoluteFill>
  );
};
const Hook: React.FC<{t: number}> = ({t}) => {
  const t1 = ST[1], tT = wt(1, 'tongue'), tN = wt(1, 'never');
  const split = k(t, t1 - 0.25, 0.55, inOut);
  const shove = Math.max(0, Math.sin(t * 6.2)) ** 2;                       // the hand shoves, again and again
  const hit = Math.max(0, Math.sin(t * 6.2 - 0.6)) ** 6;
  return (
    <AbsoluteFill>
      <div style={{opacity: 1 - split}}>
        <Icon name="hand-grab" x={300 + 70 * shove} y={1010} size={270} p={1} sw={6} c={CREAM} rot={-8 + 6 * shove} />
        {[0, 1, 2].map((j) => <div key={j} style={{position: 'absolute', left: 455 + 70 * shove, top: 945 + j * 60, width: 70, height: 5, borderRadius: 4,
          background: `linear-gradient(90deg, ${CREAM}00, ${CREAM})`, opacity: 0.25 + 0.6 * shove}} />)}
        <LockHeart x={730} y={1000} s={340} p={1} shake={6 * hit} />
      </div>
      <div style={{opacity: split}}>
        <Halo x={300} y={960} r={210} o={0.6 * split} />
        <Icon name="message-circle" x={300} y={950} size={240} p={split} sw={6} c={CREAM} />
        <Mark kind="check" x={410} y={1050} size={110} p={k(t, tT + 0.15, 0.4)} sw={11} />
        <Lbl x={300} y={1118} w={440} p={k(t, t1 + 0.1, 0.5)} align="center" c={CREAM} size={36}>THE TONGUE<br /><Sub>force wins it</Sub></Lbl>
        <div style={{position: 'absolute', left: CX - 2, top: 790, width: 4, height: 420 * split, background: `linear-gradient(180deg, ${CREAM}00, ${CREAM}aa, ${CREAM}00)`}} />
        <LockHeart x={780} y={950} s={250} p={split} />
        <Mark kind="x" x={895} y={1050} size={100} p={k(t, tN + 0.1, 0.4)} sw={11} />
        <Lbl x={780} y={1118} w={440} p={k(t, tN - 0.05, 0.5)} align="center" c={GOLDL} size={36}>THE HEART<br /><Sub>never</Sub></Lbl>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene B: one word → ikrāh → the hand closes on a heart ----------
const OneWord: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[2] - 0.25, tOne = wt(2, 'one'), tW = ST[3], tC = ST[4];
  const book = k(t, t0, 0.9), one = k(t, tOne - 0.1, 0.5, outBack), out1 = 1 - k(t, tW - 0.35, 0.35);
  const hand = k(t, tW - 0.1, 0.8), close = k(t, tC - 0.15, 0.5, outCubic);
  return (
    <AbsoluteFill>
      <div style={{opacity: out1}}>
        <Halo x={360} y={985} r={250} o={0.7 * book} />
        <Icon name="book-2" x={360} y={985} size={330} p={book} sw={6} />
        <div style={{position: 'absolute', left: 620, top: 835, width: 300, height: 300, borderRadius: '50%', border: `5px solid ${GOLDL}`, opacity: one,
          transform: `scale(${0.6 + 0.4 * one})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(241,208,138,.25)'}}>
          <div style={{fontFamily: F.cinzelB, fontSize: 150, lineHeight: '150px', ...goldText}}>1</div>
          <div style={{fontFamily: F.cinzelB, fontSize: 34, letterSpacing: 6, color: CREAM}}>WORD</div>
        </div>
      </div>
      <div style={{opacity: hand}}>
        <Halo x={CX} y={1000} r={280} o={0.5 * hand} />
        <Icon name="heart" x={CX + 10} y={1010 + 10 * close} size={170 - 30 * close} p={hand} sw={6} c={GOLDL} />
        <Icon name="hand-grab" x={CX - 20} y={985} size={400 * (1 - 0.08 * close)} p={hand} sw={6} c={CREAM} rot={-6 + 8 * close} />
        <Lbl x={CX} y={1200} w={700} p={k(t, tC - 0.05, 0.5)} align="center" c={CREAM} size={40}>COMPULSION</Lbl>
      </div>
    </AbsoluteFill>
  );
};
const WordBlock: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[3] - 0.25, t1 = ST[5] - 0.3; const a = win(t, t0, t1, 0.3, 0.3); if (a <= 0) return null;
  const p = k(t, t0, 0.8, outExpo), m = k(t, ST[4] - 0.1, 0.6, outExpo);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <div dir="rtl" lang="ar" style={{position: 'absolute', top: 360, width: W, textAlign: 'center', fontFamily: F.ar, fontSize: 170, lineHeight: '260px', color: '#efc874',
        transform: `translateY(${(1 - p) * 24}px) scale(${0.96 + 0.04 * p})`, opacity: p, textShadow: '0 6px 22px rgba(0,0,0,.55), 0 0 40px rgba(241,208,138,.25)'}}>إِكْرَاه</div>
      <Reveal p={m} style={{left: 0, top: 636, width: W, textAlign: 'center'}}>
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 48, color: CREAM}}>ikrāh · compulsion</div>
      </Reveal>
    </AbsoluteFill>
  );
};

// ---------- scene C: 2:256 — no compulsion; the right way is clear (verse window: calm) ----------
const ROAD_L = 'M 540 1255 L 540 1150 C 540 1060 330 1040 300 880';
const ROAD_R = 'M 540 1150 C 540 1060 750 1040 780 880';
const NoForce: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[5] - 0.2, tR = ST[6];
  const ban = k(t, wt(5, 'compulsion') - 0.1, 0.9, outCubic), out = k(t, tR - 0.45, 0.4);
  const L = k(t, tR - 0.4, 1.0, outCubic), Rr = k(t, tR - 0.1, 1.0, outCubic), lit = k(t, wt(6, 'clear') - 0.1, 0.8);
  return (
    <AbsoluteFill>
      <div style={{opacity: 1 - out}}>
        <Halo x={CX} y={1010} r={250} o={0.5} />
        <Icon name="heart" x={CX + 8} y={1030} size={140} p={1} sw={6} c={GOLDL} />
        <Icon name="hand-grab" x={CX - 18} y={1005} size={330} p={1} sw={6} c={CREAM} rot={2} />
        <Mark kind="ban" x={CX} y={1010} size={420} p={ban} sw={11} />
        <Lbl x={CX} y={1205} w={700} p={k(t, t0 + 0.5, 0.6)} align="center" c={GOLDL} size={38}>NO COMPULSION</Lbl>
      </div>
      <div style={{opacity: out}}>
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <Line d={ROAD_R} p={Rr} w={16} c={SLATE} o={0.35} />
          <Line d={ROAD_L} p={L} w={16} c={GOLD} o={0.55 + 0.45 * lit} />
          <Line d={ROAD_L} p={L} w={4} c="#fff3cf" o={0.6 * lit} />
        </svg>
        <Halo x={300} y={840} r={150} o={0.9 * lit} />
        <Icon name="sun" x={300} y={835} size={110} p={L} sw={5} c={GOLDL} />
        <Icon name="moon" x={780} y={835} size={90} p={Rr} sw={5} c={SLATE} glow={0} o={0.75} />
        <Lbl x={210} y={1150} w={260} p={k(t, tR + 0.4, 0.6)} align="center" c={GOLDL} size={30}>THE RIGHT<br />WAY</Lbl>
        <Lbl x={870} y={1150} w={260} p={k(t, tR + 0.7, 0.6)} align="center" c={SLATE} size={30}>THE<br />WRONG</Lbl>
        <Mark kind="check" x={300} y={980} size={90} p={k(t, wt(6, 'clear') + 0.2, 0.5)} sw={10} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene D: what force can and cannot do ----------
const ForceCan: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[7] - 0.2, t2 = ST[8];
  const hd = k(t, t0, 0.5, outExpo), r1 = k(t, t0 + 0.25, 0.5, outExpo), m1 = k(t, wt(7, 'words') + 0.1, 0.45);
  const r2 = k(t, t2 - 0.15, 0.5, outExpo), m2 = k(t, wt(8, 'belief') + 0.05, 0.45);
  const bump = Math.max(0, Math.sin(clamp((t - t2 - 0.2) / 1.2) * Math.PI * 3)) * (1 - m2);
  return (
    <AbsoluteFill>
      <div style={{opacity: hd, transform: `translateY(${(1 - hd) * 20}px)`}}>
        <Icon name="hand-grab" x={250} y={505} size={130} p={hd} sw={5} c={CREAM} />
        <div style={{position: 'absolute', left: 345, top: 470, fontFamily: F.cinzelB, fontSize: 62, letterSpacing: 6, lineHeight: '72px', color: CREAM}}>FORCE CAN…</div>
      </div>
      {[{y: 760, p: r1, ok: true}, {y: 1020, p: r2, ok: false}].map((r, j) => (
        <div key={j} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: r.p, transform: `translateX(${(1 - r.p) * -40}px)`}}>
          <div style={{position: 'absolute', left: 110, top: r.y - 100, width: 860, height: 200, borderRadius: 22, background: 'rgba(13,23,42,.55)',
            border: `1.5px solid ${r.ok ? GOLD : 'rgba(239,231,214,.22)'}`}} />
          {r.ok ? <Icon name="message-circle" x={230} y={r.y} size={130} p={r.p} sw={5} c={GOLDL} />
            : <><LockHeart x={230} y={r.y} s={140} p={r.p} shake={4 * bump} />
              <Icon name="hand-grab" x={120 + 30 * bump} y={r.y + 8} size={80} p={r.p} sw={5} c={CREAM} o={1 - m2} /></>}
          <div style={{position: 'absolute', left: 340, top: r.y - 30, lineHeight: '60px'}}>
            {r.ok ? <span style={{fontFamily: F.cinzelB, fontSize: 50, letterSpacing: 3, ...goldText}}>SAY THE WORDS</span>
              : <StrikeIn p={m2} sw={8}><span style={{fontFamily: F.cinzelB, fontSize: 50, letterSpacing: 3, color: CREAM, opacity: 1 - 0.4 * m2}}>CREATE BELIEF</span></StrikeIn>}</div>
          <Mark kind={r.ok ? 'check' : 'x'} x={905} y={r.y} size={110} p={r.ok ? m1 : m2} sw={12} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ---------- scene E: 18:29 — the truth shines; two doors (verse window: calm) ----------
const Doors: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[9] - 0.2, tB = wt(10, 'believe'), tRj = wt(11, 'reject');
  const lamp = k(t, t0 + 0.2, 0.9), beam = k(t, wt(9, 'truth'), 1.0, inOut);
  const dL = k(t, ST[10] - 0.1, 0.8), dR = k(t, ST[11] - 0.1, 0.8), oL = k(t, tB - 0.05, 0.4), oR = k(t, tRj - 0.05, 0.4);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 120, top: 860, width: 840, height: 330, opacity: 0.55 * beam,
        background: 'linear-gradient(180deg, rgba(241,208,138,.30), rgba(241,208,138,0))', clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)'}} />
      <Halo x={CX} y={845} r={150} o={0.8 * lamp} />
      <Icon name="bulb" x={CX} y={840} size={120} p={lamp} sw={5} c={GOLDL} />
      <Icon name={oL > 0.5 ? 'door-enter' : 'door'} x={330} y={1060} size={230} p={dL} sw={6} c={GOLDL} />
      <Icon name={oR > 0.5 ? 'door-enter' : 'door'} x={750} y={1060} size={230} p={dR} sw={6} c={CREAM} />
      <Lbl x={330} y={1190} w={380} p={k(t, tB - 0.1, 0.5)} align="center" c={GOLDL} size={34}>MAY BELIEVE</Lbl>
      <Lbl x={750} y={1190} w={380} p={k(t, tRj - 0.1, 0.5)} align="center" c={CREAM} size={34}>MAY REJECT</Lbl>
    </AbsoluteFill>
  );
};

// ---------- scene F: the hard part — not equal; we choose and carry it ----------
const Hard: React.FC<{t: number}> = ({t}) => {
  const tH = ST[12], tE = ST[13], tQ = wt(13, 'equal'), tG = wt(13, 'god'), tC = ST[14];
  const head = k(t, tH - 0.1, 0.6, outExpo) * (1 - k(t, tE - 0.35, 0.35));
  const f = k(t, tE - 0.05, 0.6, outExpo) * (1 - k(t, tC - 0.35, 0.35)), st = k(t, tQ + 0.05, 0.4), x = k(t, tQ + 0.25, 0.45);
  const sc = k(t, tE + 0.2, 0.9);
  const ch = k(t, tC - 0.1, 0.6, outExpo), sign = k(t, tC - 0.1, 0.7), wgt = k(t, wt(14, 'carry') - 0.1, 0.7, outCubic), wl = k(t, wt(14, 'responsibility'), 0.5);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 560, width: W, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 92, letterSpacing: 6, opacity: head, ...goldText,
        transform: `scale(${0.94 + 0.06 * head})`}}>THE HARD PART</div>
      <div style={{opacity: f}}>
        <div style={{position: 'absolute', top: 440, width: W, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 26, fontFamily: F.cinzelB, letterSpacing: 3}}>
          <span style={{fontSize: 60, ...goldText}}>BELIEF</span>
          <span style={{position: 'relative', display: 'inline-block', fontSize: 120, lineHeight: '100px', color: CREAM}}>=
            {st > 0 && <span style={{position: 'absolute', left: '50%', top: '50%', width: 10, height: 130 * st, marginLeft: -5, marginTop: -65, borderRadius: 8, background: RED,
              transform: 'rotate(28deg)', boxShadow: '0 3px 10px rgba(0,0,0,.45)'}} />}</span>
          <span style={{fontSize: 60, color: CREAM}}>REJECTION</span>
        </div>
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <Line d={`M ${CX} 1180 L ${CX} 820`} p={sc} w={6} c={GOLD} o={0.9} />
          <Line d={`M ${CX - 110} 1185 L ${CX + 110} 1185`} p={sc} w={6} c={GOLD} o={0.9} />
          <Line d={`M 260 840 L 820 840`} p={sc} w={6} c={GOLDL} o={0.95} />
          <Line d={`M 260 840 L 190 990 M 260 840 L 330 990 M 820 840 L 750 990 M 820 840 L 890 990`} p={sc} w={3} c={CREAM} o={0.6} />
          <Line d={`M 170 990 Q 260 1050 350 990 Z`} p={sc} w={5} c={GOLDL} o={0.9} />
          <Line d={`M 730 990 Q 820 1050 910 990 Z`} p={sc} w={5} c={CREAM} o={0.9} />
          <circle cx={CX} cy={820} r={10 * sc} fill={GOLDL} />
        </svg>
        <Lbl x={260} y={1062} w={300} p={k(t, tE + 0.5, 0.5)} align="center" c={GOLDL} size={30}>BELIEF</Lbl>
        <Lbl x={820} y={1062} w={300} p={k(t, tE + 0.7, 0.5)} align="center" c={CREAM} size={30}>REJECTION</Lbl>
        <Mark kind="x" x={CX} y={960} size={150} p={x} sw={12} />
        <Lbl x={CX} y={622} w={800} p={k(t, tG - 0.15, 0.5)} align="center" c={CREAM} size={36}>NOT EQUAL BEFORE GOD</Lbl>
      </div>
      <div style={{opacity: ch}}>
        <Halo x={300} y={960} r={210} o={0.6 * sign} />
        <Icon name="direction-sign" x={300} y={950} size={260} p={sign} sw={6} c={GOLDL} />
        <Lbl x={300} y={1130} w={440} p={k(t, wt(14, 'choose') - 0.05, 0.5)} align="center" c={GOLDL} size={38}>WE CHOOSE</Lbl>
        <div style={{position: 'absolute', left: CX - 2, top: 790, width: 4, height: 420 * ch, background: `linear-gradient(180deg, ${CREAM}00, ${CREAM}aa, ${CREAM}00)`}} />
        <Icon name="hand-stop" x={780} y={1045} size={190} p={ch} sw={6} c={CREAM} />
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: wgt}}>
          <g transform={`translate(780 ${mix(760, 905, wgt)})`}>
            <path d="M -24 -62 A 24 24 0 0 1 24 -62" stroke={GOLDL} strokeWidth={7} fill="none" strokeLinecap="round" />
            <path d="M -70 30 L -48 -46 L 48 -46 L 70 30 Z" fill="rgba(13,23,42,.9)" stroke={GOLDL} strokeWidth={6} strokeLinejoin="round" />
          </g>
        </svg>
        <Lbl x={780} y={1130} w={440} p={k(t, wt(14, 'carry') - 0.05, 0.5)} align="center" c={CREAM} size={38}>WE CARRY IT<br /><Sub>{wl > 0 ? 'the responsibility' : ''}</Sub></Lbl>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene G: the lock — not force, but a key: truth, wisdom, reflection ----------
const KEYS = [{w: 'truth', label: 'TRUTH'}, {w: 'wisdom', label: 'WISDOM'}, {w: 'reflection', label: 'SINCERE REFLECTION'}];
const KeyScene: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[15] - 0.2, tF = wt(15, 'force'), t2 = ST[16], tRf = wt(16, 'reflection');
  const heart = k(t, t0, 0.7);
  const yank = t < t2 - 0.2 ? Math.max(0, Math.sin((t - t0) * 7)) ** 2 : 0, hit = t < t2 - 0.2 ? Math.max(0, Math.sin((t - t0) * 7 - 0.7)) ** 6 : 0;
  const handOut = k(t, t2 - 0.35, 0.4), fx = k(t, tF + 0.15, 0.4);
  const topF = k(t, t0, 0.5, outExpo) * (1 - k(t, t2 - 0.3, 0.3)), stF = k(t, tF + 0.1, 0.4);
  const key = k(t, t2 + 0.1, 0.6), travel = k(t, t2 + 0.3, Math.max(0.8, tRf - t2 - 0.3), inOut), turn = k(t, tRf + 0.05, 0.35, outCubic), open = k(t, tRf + 0.35, 0.3);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 450, width: W, textAlign: 'center', opacity: topF}}>
        <span style={{fontFamily: F.cinzelB, fontSize: 52, letterSpacing: 6, color: CREAM}}>BY </span>
        <StrikeIn p={stF} sw={12}><span style={{fontFamily: F.cinzelB, fontSize: 130, letterSpacing: 6, color: CREAM}}>FORCE</span></StrikeIn></div>
      {KEYS.map((q, j) => {const tw = wt(16, q.w), a = k(t, tw - 0.15, 0.45, outExpo);
        return <div key={j} style={{position: 'absolute', left: 0, top: 0, opacity: a, transform: `translateX(${(1 - a) * -30}px)`}}>
          <div style={{position: 'absolute', left: 250, top: 412 + j * 92, fontFamily: F.cinzelB, fontSize: 50, letterSpacing: 4, lineHeight: '70px', whiteSpace: 'nowrap', ...goldText}}>{q.label}</div>
          <Mark kind="check" x={195} y={447 + j * 92} size={70} p={k(t, tw + 0.15, 0.4)} sw={9} />
        </div>;})}
      <LockHeart x={CX} y={1000} s={400} p={heart} shake={8 * hit} open={open} glow={open} />
      <Icon name="hand-grab" x={250 + 90 * yank} y={1010} size={210} p={heart} sw={6} c={CREAM} rot={-10 + 8 * yank} o={1 - handOut} />
      <Mark kind="x" x={245} y={1185} size={100} p={fx * (1 - handOut)} sw={11} />
      <Icon name="key" x={mix(930, CX + 70, travel)} y={mix(1210, 1012, travel)} size={130} p={key} sw={6} c={GOLDL} rot={mix(-30, 0, travel) + 90 * turn} o={1 - open} />
      {open > 0 && <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {new Array(12).fill(0).map((_, j) => {const an = -Math.PI / 2 + (j - 5.5) * 0.2, r0 = 230, r1 = 230 + 90 * open;
          return <path key={j} d={`M ${CX + r0 * Math.cos(an)} ${990 + r0 * Math.sin(an)} L ${CX + r1 * Math.cos(an)} ${990 + r1 * Math.sin(an)}`} stroke={GOLDL} strokeWidth={3} strokeLinecap="round" opacity={0.7} />;})}
      </svg>}
    </AbsoluteFill>
  );
};

// ---------- scene H: close — FORCE → PRESENT; callback to the hook picture ----------
const Close: React.FC<{t: number}> = ({t}) => {
  const tP = wt(17, 'present'), tN = ST[18], tF = wt(18, 'force');
  const a1 = k(t, ST[17] - 0.15, 0.4, outExpo), st = k(t, ST[17] + 0.05, 0.3), swap = k(t, tP - 0.05, 0.35), a2 = k(t, tP, 0.5, outExpo);
  const rays = k(t, wt(17, 'beautifully'), 1.0, outCubic);
  const hand = k(t, tN - 0.1, 0.5, outExpo), ban = k(t, tF + 0.05, 0.6, outCubic);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 420, width: W, textAlign: 'center', opacity: a1 * (1 - swap)}}>
        <StrikeIn p={st} sw={12}><span style={{fontFamily: F.cinzelB, fontSize: 130, letterSpacing: 6, color: CREAM}}>FORCE</span></StrikeIn></div>
      <div style={{position: 'absolute', top: 420, width: W, textAlign: 'center', opacity: a2, transform: `translateY(${(1 - a2) * 30}px)`}}>
        <span style={{...bigTxt(124), letterSpacing: 6}}>PRESENT</span>
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 46, color: CREAM, marginTop: -6}}>the truth, beautifully</div></div>
      <Halo x={CX + 90 * hand} y={1000} r={300 + 120 * rays} o={0.6 + 0.4 * rays} />
      {rays > 0 && <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {new Array(14).fill(0).map((_, j) => {const an = -Math.PI / 2 + (j - 6.5) * 0.19, cx = CX + 90 * hand, r0 = 210, r1 = 210 + 120 * rays;
          return <path key={j} d={`M ${cx + r0 * Math.cos(an)} ${990 + r0 * Math.sin(an)} L ${cx + r1 * Math.cos(an)} ${990 + r1 * Math.sin(an)}`} stroke={GOLDL} strokeWidth={3}
            strokeLinecap="round" opacity={0.7 * (1 - 0.3 * rays)} />;})}
      </svg>}
      <LockHeart x={CX + 90 * hand} y={1000} s={340 + 60 * (1 - a1)} p={1} open={1} glow={0.6 + 0.4 * rays} />
      <div style={{opacity: hand}}>
        <Icon name="hand-grab" x={300} y={1010} size={250} p={hand} sw={6} c={CREAM} rot={-8} />
        <Mark kind="ban" x={300} y={1010} size={320} p={ban} sw={11} />
      </div>
    </AbsoluteFill>
  );
};

const SCN: [number, number, React.FC<{t: number}>][] = [
  [-1, ST[2] - 0.3, Hook],
  [ST[2] - 0.35, ST[5] - 0.3, OneWord],
  [ST[5] - 0.35, ST[7] - 0.3, NoForce],
  [ST[7] - 0.35, ST[9] - 0.3, ForceCan],
  [ST[9] - 0.35, ST[12] - 0.3, Doors],
  [ST[12] - 0.35, ST[15] - 0.3, Hard],
  [ST[15] - 0.35, ST[17] - 0.05, KeyScene],
  [ST[17] - 0.3, VEND + 0.25, Close],
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
  const dim = win(t, ST[12] - 0.4, ST[15] - 0.2, 0.6, 0.8);
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
        <WordBlock t={t} />
        <Card t={t} t0={ST[5] - 0.15} t1={ST[7] - 0.4} refTxt={'SURAH AL-BAQARAH  ·  2:256'} ar={(EX as any)['2:256']} hl={1} fs={46} lh={94}
          lines={['“There is no compulsion in religion.', 'The right way has become clear from the wrong.”']} />
        <Card t={t} t0={ST[9] - 0.15} t1={ST[12] - 0.4} refTxt={'SURAH AL-KAHF  ·  18:29'} ar={(EX as any)['18:29']} hl={5} fs={46} lh={94}
          lines={['“Say: The truth is from your Lord. Whoever wishes', 'may believe, and whoever wishes may reject.”']} />
        {LINES.map((_, i) => (i >= 1 && i <= 18 ? <Caption key={i} t={t} i={i} /> : null))}
        <Chrome t={t} />
      </>}
      {!noEnd && <EndCard t={t} />}
      <Sweep t={t} t0={ST[2] - 0.55} />
      <Sweep t={t} t0={ST[12] - 0.5} />
      <Sweep t={t} t0={VEND - 0.3} d={1.1} />
    </AbsoluteFill>
  );
};

export const Ep05: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const loop = clamp((t - (TOTAL - 0.5)) / 0.4);
  return (
    <AbsoluteFill style={{background: INK}}>
      <Frame t={t} />
      {loop > 0 && <AbsoluteFill style={{opacity: loop}}><Frame t={0} noEnd /></AbsoluteFill>}
    </AbsoluteFill>
  );
};
