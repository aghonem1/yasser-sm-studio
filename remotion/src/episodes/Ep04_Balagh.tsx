import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame, continueRender, delayRender} from 'remotion';
import TL from './timeline_ep04.json';
import EX from '../excerpts.json';
import {Icon, Mark, Strike, StrikeIn} from '../lib/icons';

// =====================================================================================
// One Word · 04 · al-balāgh — same design system as Ep03 (reference)
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
      ONE WORD &nbsp;·&nbsp; 04 &nbsp;·&nbsp; FROM THE MIRROR</div>
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
const KEY: Record<number, string> = {1: 'Prophet', 2: 'job:', 3: 'al-balāgh.', 4: 'deliver', 5: 'deliver', 6: 'account.”', 7: 'Deliver.', 8: 'force', 9: 'search', 10: 'judgement.',
  11: 'remind', 12: 'reminds.', 13: 'control', 14: 'hard', 15: 'control', 16: 'anyone', 17: 'consciences?', 18: 'moment.', 19: 'journey.', 20: 'hearts.', 21: 'deliver.'};
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
// v2 STORYBOARD — every line gets a picture that explains it (silent test):
//  0 judge?            → gavel raised, swings, freezes; JUDGE struck out
//  1 not even Prophet  → ban ring over the gavel
//  2 one job           → the Book + a "1 JOB" counter
//  3–4 al-balāgh       → Arabic word; the job becomes a sealed letter
//  5–6 13:40 (card)    → diagram: YOURS = deliver (letter) | HIS = account (scale)
//  7–10 deliver / not  → checklist: ✓ deliver, ✗ force into hearts, ✗ search souls, ✗ pronounce judgement
//  11–13 88:21–22      → bell = reminder; chain hand→heart breaks (not appointed to control)
//  14–17 hard part     → logic ladder: the Prophet (no crown) ↓ anyone after him (crown?) → crown falls off the heart
//  18–19 moment/journey→ viewfinder on one point, pull back to the whole winding road
//  20–21 close         → JUDGE struck again; the letter is delivered and opens into light
// =====================================================================================
const RED = '#d9624f';
const Lbl: React.FC<{x: number; y: number; w?: number; p: number; size?: number; c?: string; align?: 'left' | 'center'; pill?: boolean; children: React.ReactNode}> = ({x, y, w = 600, p, size = 34, c = CREAM, align = 'left', pill, children}) =>
  p <= 0 ? null : <Reveal p={p} style={{left: align === 'center' ? x - w / 2 : x, top: y, width: w, textAlign: align}}>
    <div style={{fontFamily: F.cinzelB, fontSize: size, letterSpacing: size * 0.12, lineHeight: 1.18, color: c}}>
      {pill ? <span style={{background: 'rgba(7,12,23,.82)', padding: '6px 18px', borderRadius: 30, border: '1px solid rgba(241,208,138,.35)'}}>{children}</span> : children}</div></Reveal>;
const Halo: React.FC<{x: number; y: number; r: number; o: number}> = ({x, y, r, o}) => o <= 0 ? null :
  <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: o,
    background: 'radial-gradient(closest-side, rgba(241,208,138,.30), rgba(241,208,138,.08) 55%, rgba(241,208,138,0))'}} />;

// ---------- scene A: hook ----------
const Hook: React.FC<{t: number}> = ({t}) => {
  const tJ = wt(0, 'judge'), tN = ST[1];
  const swing = k(t, 0.35, Math.max(0.4, tJ - 0.35), inOut);                 // raised → almost striking
  const rot = mix(-26, -2, swing) + (t > tJ ? 2 * Math.sin((t - tJ) * 30) * Math.exp(-(t - tJ) * 6) : 0);
  const strike = k(t, tJ + 0.15, 0.35, outCubic), ban = k(t, tN + 0.1, 0.8, outCubic);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 392, width: W, textAlign: 'center', fontFamily: F.cinzel, fontSize: 48, letterSpacing: 10, color: CREAM}}>YOU WEREN'T ASKED</div>
      <div style={{position: 'absolute', top: 452, width: W, textAlign: 'center'}}>
        <span style={{fontFamily: F.cinzelB, fontSize: 124, letterSpacing: 4, lineHeight: '170px', ...goldText, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,.55))'}}>TO </span>
        <StrikeIn p={strike}><span style={{fontFamily: F.cinzelB, fontSize: 124, letterSpacing: 4, lineHeight: '170px', ...goldText, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,.55))'}}>JUDGE.</span></StrikeIn>
      </div>
      <Halo x={CX} y={1000} r={330} o={0.6 + 0.4 * ban} />
      <div style={{position: 'absolute', left: 250, top: 1185, width: 580, height: 5, borderRadius: 4, background: `linear-gradient(90deg, ${GOLD}00, ${GOLD}, ${GOLD}00)`}} />
      <Icon name="gavel" x={CX} y={1000} size={400} p={1} rot={rot} sw={7} />
      <Mark kind="ban" x={CX} y={1000} size={470} p={ban} sw={11} />
    </AbsoluteFill>
  );
};

// ---------- scene B: one job → al-balāgh → a sealed letter ----------
const OneJob: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[2] - 0.25, tOne = wt(2, 'one'), tW = ST[3], tD = ST[4];
  const book = k(t, t0, 0.9), one = k(t, tOne - 0.1, 0.5, outBack), out1 = 1 - k(t, tW - 0.35, 0.35);
  const env = k(t, tW - 0.1, 0.9, inOut), seal = k(t, wt(4, 'deliver') - 0.1, 0.45, outBack), fly = k(t, wt(4, 'message') - 0.1, 0.6, inOut);
  return (
    <AbsoluteFill>
      <div style={{opacity: out1}}>
        <Halo x={360} y={985} r={250} o={0.7 * book} />
        <Icon name="book-2" x={360} y={985} size={330} p={book} sw={6} />
        <div style={{position: 'absolute', left: 620, top: 820, width: 300, height: 300, borderRadius: '50%', border: `5px solid ${GOLDL}`, opacity: one,
          transform: `scale(${0.6 + 0.4 * one})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(241,208,138,.25)'}}>
          <div style={{fontFamily: F.cinzelB, fontSize: 150, lineHeight: '150px', ...goldText}}>1</div>
          <div style={{fontFamily: F.cinzelB, fontSize: 34, letterSpacing: 6, color: CREAM}}>JOB</div>
        </div>
      </div>
      <Halo x={CX - 60 * fly} y={1000} r={300} o={0.8 * env} />
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `translateX(${fly * 40}px)`}}>
        <Icon name="mail" x={CX} y={1000} size={420} p={env} sw={6} />
        {seal > 0 && <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <g transform={`translate(${CX} ${1032}) scale(${seal})`}><circle r={46} fill="#9b2f2a" stroke={GOLDL} strokeWidth={3} />
            <path d={star8(0, 0, 26, Math.PI / 8)} fill="none" stroke={GOLDL} strokeWidth={3} /></g></svg>}
        {[0, 1, 2].map((j) => <div key={j} style={{position: 'absolute', left: 170 - j * 40, top: 925 + j * 70, height: 6, borderRadius: 4, width: 150 * fly * (1 - 0.25 * j),
          background: `linear-gradient(90deg, ${GOLDL}00, ${GOLDL})`, opacity: fly * (1 - k(t, wt(4, 'message') + 0.6, 0.4))}} />)}
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
        transform: `translateY(${(1 - p) * 24}px) scale(${0.96 + 0.04 * p})`, opacity: p, textShadow: '0 6px 22px rgba(0,0,0,.55), 0 0 40px rgba(241,208,138,.25)'}}>البَلَاغ</div>
      <Reveal p={m} style={{left: 0, top: 636, width: W, textAlign: 'center'}}>
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 48, color: CREAM}}>delivering the message</div>
      </Reveal>
    </AbsoluteFill>
  );
};

// ---------- scene C: 13:40 — yours / His (verse window: calm motion only) ----------
const Split: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[5] - 0.2, tHis = ST[6];
  const L = k(t, t0 + 0.2, 0.8), div = k(t, tHis - 0.4, 0.7, inOut), R = k(t, tHis - 0.1, 0.9);
  return (
    <AbsoluteFill>
      <Halo x={300} y={960} r={230} o={0.6 * L} />
      <Icon name="mail" x={300} y={950} size={300} p={L} sw={6} />
      <Lbl x={300} y={1125} w={420} p={k(t, t0 + 0.6, 0.6)} align="center" c={GOLDL}>YOURS<br /><span style={{fontSize: 26, color: CREAM}}>DELIVER IT</span></Lbl>
      <div style={{position: 'absolute', left: CX - 2, top: 790, width: 4, height: 420 * div, background: `linear-gradient(180deg, ${CREAM}00, ${CREAM}aa, ${CREAM}00)`}} />
      <Halo x={780} y={960} r={230} o={0.6 * R} />
      <Icon name="scale" x={780} y={950} size={300} p={R} sw={6} c={CREAM} />
      <Lbl x={780} y={1125} w={420} p={k(t, tHis + 0.4, 0.6)} align="center" c={CREAM}>HIS<br /><span style={{fontSize: 26}}>THE ACCOUNT</span></Lbl>
    </AbsoluteFill>
  );
};

// ---------- scene D: the checklist ----------
const ROWS = [
  {i: 7, y: 470, icon: 'mail', label: 'DELIVER', ok: true},
  {i: 8, y: 680, icon: 'heart', label: 'FORCE IT INTO HEARTS', ok: false},
  {i: 9, y: 890, icon: 'heart-search', label: 'SEARCH SOULS', ok: false},
  {i: 10, y: 1100, icon: 'gavel', label: 'PRONOUNCE JUDGEMENT', ok: false},
];
const Checklist: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    {ROWS.map((r, j) => {
      const t0 = ST[r.i] - 0.15, ap = k(t, t0, 0.5, outExpo), mk = k(t, (j === 0 ? ST[r.i] + 0.25 : ST[r.i + 1] - 0.55), 0.45, outCubic);
      const ix = 230, push = j === 1 ? Math.sin(clamp((t - t0 - 0.2) / 0.8) * Math.PI) : 0;
      const scan = j === 2 ? Math.sin((t - t0) * 5) * 28 * clamp((t - t0) / 0.4) * (1 - mk) : 0;
      const tap = j === 3 ? -22 * Math.max(0, Math.sin((t - t0 - 0.3) * 9)) * (1 - mk) : 0;
      return (
        <div key={j} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: ap, transform: `translateX(${(1 - ap) * -40}px)`}}>
          <div style={{position: 'absolute', left: 120, top: r.y - 85, width: 840, height: 170, borderRadius: 22, background: 'rgba(13,23,42,.55)',
            border: `1.5px solid ${r.ok ? GOLD : 'rgba(239,231,214,.22)'}`}} />
          <Icon name={r.icon} x={ix + scan} y={r.y} size={120} p={k(t, t0, 0.7)} sw={5} c={r.ok ? GOLDL : CREAM} rot={tap} />
          {j === 1 && <Icon name="hand-grab" x={ix - 95 + 60 * push} y={r.y + 10} size={90} p={k(t, t0 + 0.1, 0.5)} sw={5} c={CREAM} o={1 - mk} />}
          <div style={{position: 'absolute', left: 330, top: r.y - 26, lineHeight: '52px'}}>
            {r.ok ? <span style={{fontFamily: F.cinzelB, fontSize: 52, letterSpacing: 4, ...goldText}}>{r.label}</span>
              : <StrikeIn p={mk} sw={7}><span style={{fontFamily: F.cinzelB, fontSize: 31, letterSpacing: 2, color: CREAM, opacity: 1 - 0.45 * mk}}>{r.label}</span></StrikeIn>}</div>
          <Mark kind={r.ok ? 'check' : 'x'} x={900} y={r.y} size={110} p={mk} sw={r.ok ? 12 : 11} />
        </div>
      );
    })}
  </AbsoluteFill>
);

// ---------- scene E: 88:21–22 — remind, don't control (verse window: calm motion only) ----------
const Remind: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[11] - 0.2, tR = wt(12, 'reminds'), tC = ST[13], tBreak = wt(13, 'control');
  const bell = k(t, t0 + 0.2, 0.9), ring = t > tR - 0.2 && t < tR + 1.4 ? 9 * Math.sin((t - tR) * 16) * Math.exp(-(t - tR + 0.2) * 2.2) : 0;
  const ch = k(t, tC - 0.1, 0.7), brk = k(t, tBreak + 0.15, 0.6, outCubic), out = k(t, tC - 0.4, 0.5);
  return (
    <AbsoluteFill>
      <div style={{opacity: 1 - out}}>
        <Halo x={CX} y={980} r={280} o={0.7 * bell} />
        <Icon name="bell" x={CX} y={980} size={330} p={bell} sw={6} rot={ring} />
        <Lbl x={CX} y={1170} w={700} p={k(t, tR - 0.1, 0.6)} align="center" c={GOLDL}>ONE WHO REMINDS</Lbl>
      </div>
      <div style={{opacity: out}}>
        <Icon name={brk > 0.5 ? 'hand-stop' : 'hand-grab'} x={230} y={990} size={190} p={1} sw={5} c={CREAM} />
        <Halo x={850} y={990} r={210} o={0.4 + 0.5 * brk} />
        <Icon name="heart" x={850} y={990 - 30 * brk} size={210} p={ch} sw={6} />
        {[0, 1, 2, 3].map((j) => {const x = 330 + j * 115, drop = j === 1 || j === 2 ? brk : 0;
          return <Icon key={j} name={'link'} x={x + (j < 2 ? -30 : 30) * brk} y={990 + 120 * drop * drop} size={110} p={k(t, tC + j * 0.08, 0.4)} sw={5} c={CREAM}
            o={1 - 0.8 * drop} rot={45 + (j < 2 ? -40 : 40) * brk} />;})}
        <Lbl x={CX} y={1170} w={760} p={k(t, tBreak + 0.3, 0.6)} align="center" c={CREAM}>NOT HIS TO CONTROL</Lbl>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene F: the hard part — the logic ladder ----------
const Ladder: React.FC<{t: number}> = ({t}) => {
  const tH = ST[14], tP = ST[15], tA = ST[16], tC = ST[17], tFall = wt(17, 'consciences');
  const head = k(t, tH - 0.1, 0.6, outExpo) * (1 - k(t, tP - 0.3, 0.4));
  const top = k(t, tP, 0.7, outExpo), arrow = k(t, tA - 0.3, 0.5, inOut), low = k(t, tA, 0.7, outExpo), heart = k(t, tA + 0.3, 0.6), fall = k(t, tFall + 0.1, 0.9, (x) => x * x);
  const q = k(t, tC + 0.2, 0.5, outBack);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 560, width: W, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 92, letterSpacing: 6, opacity: head, ...goldText,
        transform: `scale(${0.94 + 0.06 * head})`}}>THE HARD PART</div>
      {/* top rung */}
      <div style={{position: 'absolute', left: 140, top: 440, width: 800, height: 190, borderRadius: 22, border: `1.5px solid ${GOLD}`, background: 'rgba(13,23,42,.6)', opacity: top,
        transform: `translateY(${(1 - top) * 20}px)`}} />
      <Icon name="crown" x={265} y={535} size={120} p={top} sw={5} c={GOLDL} o={top} />
      <Mark kind="ban" x={265} y={535} size={150} p={k(t, wt(15, 'not') - 0.1, 0.6)} sw={8} />
      <Lbl x={360} y={478} w={560} p={top} size={38} c={GOLDL}>THE PROPHET ﷺ<br /><span style={{fontFamily: F.it, fontStyle: 'italic', fontSize: 34, letterSpacing: 0, color: CREAM}}>not appointed to control</span></Lbl>
      {/* arrow down */}
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <Line d={`M ${CX} 650 L ${CX} 760`} p={arrow} w={5} c={CREAM} o={0.9} />
        {arrow > 0.95 && <path d={`M ${CX - 22} 740 L ${CX} 766 L ${CX + 22} 740`} stroke={CREAM} strokeWidth={5} fill="none" strokeLinecap="round" />}
      </svg>
      {/* low rung */}
      <div style={{position: 'absolute', left: 140, top: 790, width: 800, height: 150, borderRadius: 22, border: `1.5px solid rgba(239,231,214,.35)`, background: 'rgba(13,23,42,.6)', opacity: low,
        transform: `translateY(${(1 - low) * 20}px)`}} />
      <Lbl x={175} y={842} w={560} p={low} size={40}>ANYONE AFTER HIM</Lbl>
      <div style={{position: 'absolute', left: 790, top: 770, fontFamily: F.cinzelB, fontSize: 170, lineHeight: '190px', color: RED, opacity: q, transform: `scale(${0.6 + 0.4 * q})`}}>?</div>
      {/* the crown over the heart */}
      <Halo x={CX} y={1120} r={150} o={0.6 * heart} />
      <Icon name="heart" x={CX} y={1140} size={150} p={heart} sw={6} />
      <Icon name="crown" x={CX + 120 * fall} y={1030 + 260 * fall} size={120} p={heart} sw={5} c={CREAM} rot={70 * fall} o={heart * (1 - fall)} />
    </AbsoluteFill>
  );
};

// ---------- scene G: a single moment / the whole journey ----------
const ROAD = 'M 540 1240 C 330 1150 800 1070 610 980 C 420 890 760 820 560 740 C 410 680 690 620 540 560 C 440 515 600 470 540 430';
const Journey: React.FC<{t: number}> = ({t}) => {
  const tW = ST[19] - 0.1, zoom = k(t, tW, 1.3, inOut), road = k(t, ST[18] - 0.3, 1.0);
  const fx = 610, fy = 980;                                 // the single moment, on the road
  const s = mix(3.0, 1.0, zoom); const tx = (CX - fx) * (1 - zoom), ty = (980 - fy) * (1 - zoom);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: 'inset(372px 0 655px 0)'}}><div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `translate(${tx}px, ${ty}px) scale(${s})`, transformOrigin: `${fx}px ${fy}px`}}>
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <path d={ROAD} stroke="rgba(239,231,214,.12)" strokeWidth={46} fill="none" strokeLinecap="round" />
          <Line d={ROAD} p={road} w={3} c={GOLDL} o={0.9} dash={undefined} />
          <circle cx={540} cy={1240} r={10} fill={CREAM} opacity={zoom} />
          <circle cx={540} cy={430} r={60} fill="url(#haloW)" opacity={zoom} /><circle cx={540} cy={430} r={12} fill="#fff6dc" opacity={zoom} />
          <circle cx={fx} cy={fy} r={9 / s * 1.6} fill="#fff6dc" />
        </svg>
      </div></div>
      <Icon name="viewfinder" x={CX + (fx - CX) * zoom} y={980 + (fy - 980) * zoom} size={mix(300, 110, zoom)} p={k(t, ST[18] - 0.1, 0.6)} sw={5} c={CREAM} glow={0} />
      <Lbl x={CX} y={1170} w={700} p={k(t, ST[18], 0.6) * (1 - zoom)} align="center" c={CREAM} pill>A SINGLE MOMENT</Lbl>
      <Lbl x={870} y={860} w={340} p={k(t, tW + 0.9, 0.6)} align="center" c={GOLDL}>THE WHOLE<br />JOURNEY</Lbl>
    </AbsoluteFill>
  );
};

// ---------- scene H: close — not judge, deliver ----------
const Close: React.FC<{t: number}> = ({t}) => {
  const tJ = wt(20, 'judge'), tD = ST[21], tDel = wt(21, 'deliver');
  const a1 = k(t, ST[20] - 0.1, 0.5, outExpo), st = k(t, tJ + 0.2, 0.4), ban = k(t, wt(20, 'hearts'), 0.7);
  const a2 = k(t, tD - 0.1, 0.6, outExpo), open = k(t, tDel, 0.5, outCubic), rays = k(t, tDel + 0.2, 1.0, outCubic);
  const swap = k(t, tD - 0.3, 0.4);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 410, width: W, textAlign: 'center', opacity: a1 * (1 - swap)}}>
        <StrikeIn p={st} sw={12}><span style={{fontFamily: F.cinzelB, fontSize: 130, letterSpacing: 6, color: CREAM}}>JUDGE</span></StrikeIn></div>
      <div style={{position: 'absolute', top: 410, width: W, textAlign: 'center', opacity: a2, transform: `translateY(${(1 - a2) * 30}px)`}}>
        <span style={{fontFamily: F.cinzelB, fontSize: 130, letterSpacing: 6, ...goldText, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,.55))'}}>DELIVER</span></div>
      <div style={{opacity: a1 * (1 - swap)}}>
        <Icon name="gavel" x={420} y={950} size={240} p={a1} sw={6} c={CREAM} rot={-6} />
        <Icon name="heart" x={680} y={1010} size={200} p={a1} sw={6} />
        <Mark kind="ban" x={550} y={980} size={470} p={ban} sw={11} />
      </div>
      <div style={{opacity: a2}}>
        <Halo x={CX} y={980} r={260 + 160 * rays} o={0.5 + 0.5 * rays} />
        {rays > 0 && <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          {new Array(12).fill(0).map((_, j) => {const an = -Math.PI / 2 + (j - 5.5) * 0.17, r0 = 120, r1 = 120 + 220 * rays;
            return <path key={j} d={`M ${CX + r0 * Math.cos(an)} ${930 + r0 * Math.sin(an)} L ${CX + r1 * Math.cos(an)} ${930 + r1 * Math.sin(an)}`} stroke={GOLDL} strokeWidth={3}
              strokeLinecap="round" opacity={0.7 * (1 - 0.4 * rays)} />;})}
        </svg>}
        <Icon name={open > 0.5 ? 'mail-opened' : 'mail'} x={CX} y={1000} size={330} p={a2} sw={6} />
        <Mark kind="check" x={CX + 210} y={1150} size={130} p={k(t, tDel + 0.3, 0.5)} sw={12} />
      </div>
    </AbsoluteFill>
  );
};

const SCN: [number, number, React.FC<{t: number}>][] = [
  [-1, ST[2] - 0.3, Hook],
  [ST[2] - 0.35, ST[5] - 0.3, OneJob],
  [ST[5] - 0.35, ST[7] - 0.3, Split],
  [ST[7] - 0.35, ST[11] - 0.3, Checklist],
  [ST[11] - 0.35, ST[14] - 0.3, Remind],
  [ST[14] - 0.35, ST[18] - 0.15, Ladder],
  [ST[18] - 0.2, ST[20] - 0.1, Journey],
  [ST[20] - 0.15, VEND + 0.25, Close],
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
        transform: `scale(${0.96 + 0.04 * k(t, VEND + 0.45, 0.5, outBack)})`, boxShadow: '0 12px 30px rgba(0,0,0,.45)'}}>FOLLOW FOR THE NEXT WORD</div>
      <div style={{position: 'absolute', top: 1290, width: W, textAlign: 'center', fontFamily: F.plex, fontSize: 38, letterSpacing: 1, color: CREAM, opacity: 0.85 * q2}}>yasserfares.com</div>
    </AbsoluteFill>
  );
};

// ---------- assembly ----------
const Frame: React.FC<{t: number; noEnd?: boolean}> = ({t, noEnd}) => {
  const dim = win(t, ST[14] - 0.4, ST[18] - 0.2, 0.6, 0.8);
  return (
    <AbsoluteFill>
      <Background t={t} dim={dim} />
      {t < VEND + 0.35 && <>
        {SCN.map(([a0, a1, C], j) => {
          const a = j === 0 ? (t <= a1 - 0.3 ? 1 : clamp((a1 - t) / 0.3)) : win(t, a0, a1, 0.35, 0.3); if (a <= 0) return null;
          const push = 1 + 0.02 * clamp((t - Math.max(a0, 0)) / (a1 - Math.max(a0, 0))) + (j === 0 ? 0 : 0.03 * (1 - k(t, a0, 0.5, outCubic)));
          return <AbsoluteFill key={j} style={{opacity: a, transform: `scale(${push})`, transformOrigin: `${CX}px ${CY}px`}}><C t={t} /></AbsoluteFill>;
        })}
        <WordBlock t={t} />
        <Card t={t} t0={ST[5] - 0.15} t1={ST[7] - 0.4} refTxt={'SURAH AL-RA‘D  ·  13:40'} ar={(EX as any)['13:40']} hl={2}
          lines={['“Your duty is only to deliver the message,', 'and it is for Us to call them to account.”']} />
        <Card t={t} t0={ST[11] - 0.15} t1={ST[14] - 0.4} refTxt={'SURAH AL-GHASHIYAH  ·  88:21–22'} ar={(EX as any)['88:21'] + ' | ' + (EX as any)['88:22']} hl={3} fs={44} lh={100}
          lines={['“So remind them; you are only one who reminds.', 'You are not appointed to control them.”']} />
        {LINES.map((_, i) => (i >= 1 ? <Caption key={i} t={t} i={i} /> : null))}
        <Chrome t={t} />
      </>}
      {!noEnd && <EndCard t={t} />}
      <Sweep t={t} t0={ST[2] - 0.55} />
      <Sweep t={t} t0={ST[14] - 0.5} />
      <Sweep t={t} t0={VEND - 0.3} d={1.1} />
    </AbsoluteFill>
  );
};

export const Ep04: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const loop = clamp((t - (TOTAL - 0.5)) / 0.4);
  return (
    <AbsoluteFill style={{background: INK}}>
      <Frame t={t} />
      {loop > 0 && <AbsoluteFill style={{opacity: loop}}><Frame t={0} noEnd /></AbsoluteFill>}
    </AbsoluteFill>
  );
};
