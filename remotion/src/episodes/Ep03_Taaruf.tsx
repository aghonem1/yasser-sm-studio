import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame, continueRender, delayRender} from 'remotion';
import TL from './timeline_ep03.json';
import EX from '../excerpts.json';

// =====================================================================================
// One Word · 03 — v2 "constellation" design system
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
      ONE WORD &nbsp;·&nbsp; 03 &nbsp;·&nbsp; FROM THE MIRROR</div>
    {bar && <div style={{position: 'absolute', top: 1512, left: 160, width: W - 320, height: 2, background: 'rgba(201,164,87,.18)', borderRadius: 2}}>
      <div style={{width: `${clamp(t / VEND) * 100}%`, height: 2, background: GOLDL, borderRadius: 2}} /></div>}
  </AbsoluteFill>
);

// ---------- verse card ----------
const Card: React.FC<{t: number; t0: number; t1: number; refTxt: string; ar: string; hl: number; lines: string[]}> = ({t, t0, t1, refTxt, ar, hl, lines}) => {
  const a = win(t, t0, t1, 0.35, 0.3); if (a <= 0) return null;
  const s = k(t, t0, 0.6, outExpo); const words = ar.split(' ');
  return (
    <div style={{position: 'absolute', top: 384, left: 96, width: 888, opacity: a, transform: `translateY(${(1 - s) * 28}px)`,
      background: 'linear-gradient(180deg,#f6eedc,#ece0c4)', borderRadius: 14, padding: '22px 38px 24px', textAlign: 'center',
      boxShadow: `inset 0 0 0 1.5px ${GOLD}, inset 0 0 0 7px #f3e9d3, inset 0 0 0 8px ${GOLD}77, 0 26px 60px rgba(0,0,0,.55)`}}>
      <div style={{fontFamily: F.cinzelB, fontSize: 23, letterSpacing: 6, color: BROWN}}>{refTxt}</div>
      <div dir="rtl" lang="ar" style={{fontFamily: F.quran, fontSize: 58, lineHeight: '108px', color: NAVY, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', columnGap: 16}}>
        <span style={{color: BROWN}}>{'﴿'}</span>
        {words.map((w, j) => {const p = k(t, t0 + 0.2 + 0.1 * j, 0.45, outCubic);
          return <span key={j} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 10}px)`, color: j === hl ? '#a06a0c' : NAVY}}>{w}</span>;})}
        <span style={{color: BROWN}}>{'﴾'}</span>
      </div>
      <div style={{fontFamily: F.it, fontSize: 35, lineHeight: 1.2, color: '#2c3550'}}>{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
    </div>
  );
};

// ---------- captions: balanced rows, words revealed as spoken ----------
const KEY: Record<number, string> = {4: 'tribes,', 5: 'lita‘ārafū.', 6: 'know', 7: 'despise.', 8: 'fight.', 9: 'know', 10: 'honoured', 11: 'race.', 12: 'nation.',
  13: 'Adam.', 14: 'hard', 15: 'agree', 16: 'differ.', 17: 'disagree', 18: 'wrong', 19: 'faith,', 20: 'creation.'};
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

// ---------- scene A: hook ----------
const PairLabel: React.FC<{x: number; y: number; p: number; l1: string; l2: string; c: string}> = ({x, y, p, l1, l2, c}) => (
  <Reveal p={p} style={{left: x - 220, top: y, width: 440, textAlign: 'center'}}>
    <div style={{fontFamily: F.cinzelB, fontSize: 31, letterSpacing: 5, lineHeight: '42px', color: c}}>{l1}<br />{l2}</div>
  </Reveal>
);
const Hook: React.FC<{t: number}> = ({t}) => {
  const pB = k(t, ST[2] - 0.05, 0.6, outExpo), pE = k(t, ST[3] + 0.15, 0.6, outExpo), pAli = k(t, ST[1] - 0.05, 0.6, outExpo), pOr = k(t, ST[3] - 0.05, 0.5);
  const sc = 1.05 - 0.05 * k(t, 0, 1.4, outExpo);
  const y = 965;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 392, width: W, textAlign: 'center', fontFamily: F.cinzel, fontSize: 46, letterSpacing: 12, color: CREAM, opacity: 0.92}}>THERE ARE ONLY</div>
      <div style={{position: 'absolute', top: 446, width: W, textAlign: 'center', transform: `scale(${sc})`}}>
        <span style={{fontFamily: F.cinzelB, fontSize: 134, letterSpacing: 4, lineHeight: '170px', ...goldText, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,.55))'}}>TWO KINDS</span>
      </div>
      <div style={{position: 'absolute', top: 618, width: W, textAlign: 'center', fontFamily: F.cinzel, fontSize: 58, letterSpacing: 10, color: CREAM}}>OF PEOPLE.</div>
      <Svg>
        <circle cx={300} cy={y} r={92} stroke={GOLD} strokeWidth={1.5} fill="none" opacity={0.35} />
        <circle cx={780} cy={y} r={92} stroke={SLATE} strokeWidth={1.5} fill="none" opacity={0.35} />
        <Line d={`M 300 ${y - 92} A 92 92 0 1 1 299.9 ${y - 92}`} p={pB} w={2.5} c={GOLDL} o={0.9} />
        <Line d={`M 780 ${y - 92} A 92 92 0 1 1 779.9 ${y - 92}`} p={pE} w={2.5} c={SLATE} o={0.9} />
        <Light x={300} y={y} r={17} c={GOLDL} o={0.8 + 0.2 * pB} halo={0.6 + 0.4 * pB} />
        <Light x={780} y={y} r={17} c={CREAM} o={0.8 + 0.2 * pE} halo={0.6 + 0.4 * pE} cool />
      </Svg>
      <div style={{position: 'absolute', top: y - 44, width: W, textAlign: 'center', fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 64, color: CREAM,
        opacity: pOr * 0.9, transform: `translateY(${(1 - pOr) * 12}px)`}}>or</div>
      <PairLabel x={300} y={y + 118} p={pB} l1="YOUR BROTHER" l2="IN FAITH" c={GOLDL} />
      <PairLabel x={780} y={y + 118} p={pE} l1="YOUR EQUAL" l2="IN CREATION" c={CREAM} />
      <Reveal p={pAli} style={{left: 0, top: 1218, width: W, textAlign: 'center'}}>
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 44, color: GOLDL}}>— Imam Ali ibn Abi Talib</div>
      </Reveal>
    </AbsoluteFill>
  );
};

// ---------- scene B: peoples & tribes → constellation ----------
const NC = 8, RO = 232;
const CL = new Array(NC).fill(0).map((_, j) => {const a = -Math.PI / 2 + Math.PI / 8 + (j * 2 * Math.PI) / NC; return [CX + RO * Math.cos(a), CY + RO * Math.sin(a)];});
const HEX = [[0, 0], ...new Array(6).fill(0).map((_, j) => [25 * Math.cos((j * Math.PI) / 3 + Math.PI / 6), 25 * Math.sin((j * Math.PI) / 3 + Math.PI / 6)])];
const TONES = [GOLDL, SLATE, CREAM, SAND];
const DOTS = CL.flatMap(([cx, cy], c) => HEX.map(([dx, dy], j) => ({c, tx: cx + dx, ty: cy + dy,
  sx: 150 + random('sx' + c + j) * 780, sy: 720 + random('sy' + c + j) * 520, d: random('d' + c + j)})));
const Tribes: React.FC<{t: number}> = ({t}) => {
  const tA = ST[4] - 0.1, tG0 = wt(4, 'peoples') - 0.5, tG1 = wt(4, 'tribes') + 0.35;
  const tOct = wt(6, 'know') - 0.35, tStar0 = ST[7] - 0.1, tStar1 = ST[9] + 0.5, tCore = wt(9, 'know');
  const disc = k(t, tG1 - 0.25, 0.5);
  const core = k(t, tCore, 0.7, outBack), pulse = clamp((t - tCore) / 1.2);
  return (
    <AbsoluteFill>
      <Svg>
        {CL.map(([x1, y1], j) => {const [x2, y2] = CL[(j + 1) % NC]; return <Line key={'o' + j} d={`M ${x1} ${y1} L ${x2} ${y2}`} p={k(t, tOct + j * 0.06, 0.55, inOut)} w={2} c={GOLD} o={0.75} />;})}
        {CL.map(([x1, y1], j) => {const [x2, y2] = CL[(j + 3) % NC]; const d0 = mix(tStar0, tStar1 - 0.6, j / (NC - 1));
          return <Line key={'s' + j} d={`M ${x1} ${y1} L ${x2} ${y2}`} p={k(t, d0, 0.6, inOut)} w={1.75} c={GOLDL} o={0.55} />;})}
        {pulse > 0 && pulse < 1 && <circle cx={CX} cy={CY} r={mix(60, 330, outCubic(pulse))} stroke={GOLDL} strokeWidth={2} fill="none" opacity={(1 - pulse) * 0.5} />}
        {core > 0 && <g transform={`translate(${CX} ${CY}) scale(${core}) translate(${-CX} ${-CY})`}>
          <circle cx={CX} cy={CY} r={150} fill="url(#haloW)" opacity={0.6} />
          <path d={star8(CX, CY, 58, Math.PI / 8)} fill="url(#goldF)" stroke={GOLDL} strokeWidth={1.5} />
          <circle cx={CX} cy={CY} r={11} fill="#fff6dc" />
        </g>}
        {CL.map(([x, y], j) => <g key={'c' + j} opacity={disc}>
          <circle cx={x} cy={y} r={46} fill={INK} opacity={0.92} />
          <circle cx={x} cy={y} r={46} stroke={TONES[j % 4] === SLATE ? SLATE : GOLD} strokeWidth={1.5} fill="none" opacity={0.55} />
        </g>)}
        {DOTS.map((d, j) => {
          const ap = k(t, tA + d.d * 0.9, 0.5, outCubic); const g = k(t, tG0 + d.c * 0.07, tG1 - tG0, inOut);
          const x = mix(d.sx, d.tx, g), y = mix(d.sy, d.ty, g) + (1 - g) * 6 * Math.sin(t * 1.4 + d.d * 6);
          const tone = TONES[d.c % 4];
          return <Light key={j} x={x} y={y} r={6.5} c={tone} o={ap} halo={0.7} cool={tone === SLATE} />;
        })}
      </Svg>
    </AbsoluteFill>
  );
};
const WordBlock: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[5] - 0.25, t1 = ST[7] - 0.4; const a = win(t, t0, t1, 0.3, 0.3); if (a <= 0) return null;
  const p = k(t, t0, 0.8, outExpo), m = k(t, wt(6, 'know') - 0.25, 0.6, outExpo);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <div dir="rtl" lang="ar" style={{position: 'absolute', top: 360, width: W, textAlign: 'center', fontFamily: F.ar, fontSize: 158, lineHeight: '260px',
        transform: `translateY(${(1 - p) * 24}px) scale(${0.96 + 0.04 * p})`, opacity: p,
        color: '#efc874', textShadow: '0 6px 22px rgba(0,0,0,.55), 0 0 40px rgba(241,208,138,.25)'}}>لِتَعَارَفُوا</div>
      <Reveal p={m} style={{left: 0, top: 640, width: W, textAlign: 'center'}}>
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 46, color: CREAM, opacity: 0.92}}>so that you may know one another</div>
      </Reveal>
    </AbsoluteFill>
  );
};

// ---------- scene C: the children of Adam ----------
const NR = 48, RR = 232;
const RING = new Array(NR).fill(0).map((_, j) => {const a = -Math.PI / 2 + (j * 2 * Math.PI) / NR; return {a, tone: TONES[(j * 3 + Math.floor(j / 4)) % 4]};});
const arcPath = (a0: number, a1: number, r: number) => `M ${CX + r * Math.cos(a0)} ${CY + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${CX + r * Math.cos(a1)} ${CY + r * Math.sin(a1)}`;
const Honoured: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[10] - 0.3, tH = wt(10, 'honoured'), tR = ST[11], tN = ST[12], tA = ST[13];
  const inner = k(t, t0 + 0.2, 1.0, inOut), fill = k(t, tH - 0.1, 0.6), all = k(t, tA + 0.1, 0.6);
  const rot = (t - t0) * 0.05;
  const inArc = (j: number, s: number) => {const d = (j - s + NR) % NR; return d < 8;};
  const pulse = clamp((t - tA - 0.1) / 1.4);
  return (
    <AbsoluteFill>
      <Svg>
        <g transform={`rotate(${(rot * 180) / Math.PI} ${CX} ${CY})`}>
          <Line d={`M ${CX} ${CY - 160} A 160 160 0 1 1 ${CX - 0.1} ${CY - 160}`} p={inner} w={1.5} c={GOLD} o={0.5} />
          <Line d={star8(CX, CY, 96, Math.PI / 8)} p={inner} w={2} c={GOLDL} o={0.85} />
          <path d={star8(CX, CY, 96, Math.PI / 8)} fill="url(#goldF)" opacity={0.9 * fill} />
          <circle cx={CX} cy={CY} r={200} fill="url(#haloW)" opacity={0.35 * fill + 0.3 * all} />
          {t >= tR - 0.1 && t < tA + 0.2 && <Line d={arcPath(RING[t < tN - 0.1 ? 0 : 24].a - 0.05, RING[(t < tN - 0.1 ? 0 : 24) + 7].a + 0.05, RR + 30)} p={k(t, t < tN - 0.1 ? tR - 0.1 : tN - 0.1, 0.5)} w={2} c={GOLDL} o={0.8 * (1 - all)} />}
          {RING.map((l, j) => {
            const ap = k(t, t0 + 0.2 + (j / NR) * 1.2, 0.4);
            let lvl = 0.45 + 0.4 * fill;
            if (t >= tR - 0.1 && t < tN - 0.1) lvl = inArc(j, 0) ? 1 : 0.18;
            else if (t >= tN - 0.1 && t < tA) lvl = inArc(j, 24) ? 1 : 0.18;
            lvl = mix(lvl, 1, all);
            return <Light key={j} x={CX + RR * Math.cos(l.a)} y={CY + RR * Math.sin(l.a)} r={6.5} c={l.tone} o={ap * lvl} halo={0.6} cool={l.tone === SLATE} />;
          })}
        </g>
        {pulse > 0 && pulse < 1 && <circle cx={CX} cy={CY} r={mix(RR, RR + 90, outCubic(pulse))} stroke={GOLDL} strokeWidth={2} fill="none" opacity={(1 - pulse) * 0.6} />}
      </Svg>
    </AbsoluteFill>
  );
};

// ---------- scene D: the real test ----------
const LG = [[150, 1000], [222, 928], [248, 1045], [318, 982], [196, 1100]];
const RG = [[762, 982], [832, 925], [858, 1048], [930, 990], [884, 1105]];
const Bridge: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[14] - 0.3, tK = wt(15, 'kind') - 0.1, tAg = wt(15, 'agree'), tT = wt(16, 'test') - 0.1, tD = wt(16, 'differ');
  const appear = (j: number, side: number) => k(t, t0 + 0.25 + j * 0.06 + side * 0.25, 0.45);
  const near = [[0, 1], [1, 3], [0, 2], [2, 3], [0, 4], [2, 4]];
  const arcP = k(t, tT, tD + 0.35 - tT, inOut), warm = k(t, tD + 0.2, 0.6);
  const ax = (u: number) => {const x0 = 318, y0 = 982, x2 = 762, y2 = 982, cx = 540, cy = 740; return [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x2, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y2];};
  const [hx, hy] = ax(arcP);
  return (
    <AbsoluteFill>
      <Svg>
        {near.map(([a, b], j) => <Line key={j} d={`M ${LG[a][0]} ${LG[a][1]} L ${LG[b][0]} ${LG[b][1]}`} p={k(t, tK + j * 0.12, 0.3)} w={1.75} c={GOLDL} o={0.7} />)}
        {near.map(([a, b], j) => <Line key={'r' + j} d={`M ${RG[a][0]} ${RG[a][1]} L ${RG[b][0]} ${RG[b][1]}`} p={k(t, tAg + j * 0.08, 0.3)} w={1.75} c={SLATE} o={0.55} />)}
        <path d="M 318 982 Q 540 740 762 982" stroke={GOLD} strokeWidth={1.5} strokeDasharray="3 12" strokeLinecap="round" fill="none" opacity={0.35 * k(t, tT - 0.6, 0.5) * (1 - warm)} />
        <Line d="M 318 982 Q 540 740 762 982" p={arcP} w={3} c={GOLDL} o={0.95} />
        {arcP > 0.02 && arcP < 0.995 && <Light x={hx} y={hy} r={6} c="#fff6dc" halo={1} />}
        {LG.map(([x, y], j) => <Light key={'l' + j} x={x} y={y} r={8.5} c={GOLDL} o={appear(j, 0) * (0.65 + 0.35 * k(t, tK, 0.6))} halo={0.7} />)}
        {RG.map(([x, y], j) => <Light key={'g' + j} x={x} y={y} r={8.5} c={mix(0, 1, warm) > 0.5 ? CREAM : SLATE} o={appear(j, 1) * (0.55 + 0.45 * warm)} halo={0.5 + 0.5 * warm} cool />)}
        {warm > 0 && warm < 1 && <circle cx={846} cy={1010} r={mix(70, 170, warm)} stroke={GOLDL} strokeWidth={2} fill="none" opacity={(1 - warm) * 0.6} />}
      </Svg>
    </AbsoluteFill>
  );
};

// ---------- scene E: disagree, but do not wrong ----------
const Two: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[17] - 0.3, tDis = wt(17, 'disagree'), tWr = wt(18, 'wrong') - 0.15, pB = k(t, ST[19] - 0.05, 0.6, outExpo), pE = k(t, ST[20] + 0.15, 0.6, outExpo);
  const ap = k(t, t0 + 0.1, 0.6), split = k(t, tDis - 0.1, 0.5), join = k(t, tWr, 0.7, inOut), y = 965;
  const xl = 300 - 10 * split * (1 - join), xr = 780 + 10 * split * (1 - join);
  return (
    <AbsoluteFill>
      <Svg>
        <circle cx={xl} cy={y} r={92} stroke={GOLD} strokeWidth={1.5} fill="none" opacity={0.25 * ap} />
        <circle cx={xr} cy={y} r={92} stroke={SLATE} strokeWidth={1.5} fill="none" opacity={0.25 * ap} />
        <Line d={`M ${CX} ${y - 120} L ${CX} ${y + 120}`} p={split} w={2} c={CREAM} o={0.7 * (1 - 0.75 * join)} dash="4 12" />
        <Line d={`M ${xl + 26} ${y} L ${xr - 26} ${y}`} p={join} w={2.5} c={GOLDL} o={0.9} />
        <Line d={`M ${xl} ${y - 92} A 92 92 0 1 1 ${xl - 0.1} ${y - 92}`} p={pB} w={2.5} c={GOLDL} o={0.9} />
        <Line d={`M ${xr} ${y - 92} A 92 92 0 1 1 ${xr - 0.1} ${y - 92}`} p={pE} w={2.5} c={SLATE} o={0.9} />
        <Light x={xl} y={y} r={17} c={GOLDL} o={ap} halo={0.6 + 0.4 * join} />
        <Light x={xr} y={y} r={17} c={CREAM} o={ap} halo={0.6 + 0.4 * join} cool />
      </Svg>
      <PairLabel x={300} y={y + 118} p={pB} l1="YOUR BROTHER" l2="IN FAITH" c={GOLDL} />
      <PairLabel x={780} y={y + 118} p={pE} l1="YOUR EQUAL" l2="IN CREATION" c={CREAM} />
    </AbsoluteFill>
  );
};

// ---------- end card ----------
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
const SCN: [number, number, React.FC<{t: number}>][] = [
  [-1, ST[4] - 0.3, Hook], [ST[4] - 0.35, ST[10] - 0.3, Tribes], [ST[10] - 0.35, ST[14] - 0.3, Honoured], [ST[14] - 0.35, ST[17] - 0.3, Bridge], [ST[17] - 0.35, VEND + 0.25, Two]];
const Frame: React.FC<{t: number; noEnd?: boolean}> = ({t, noEnd}) => {
  const dim = win(t, ST[14] - 0.4, ST[17] - 0.2, 0.6, 0.8);
  return (
    <AbsoluteFill>
      <Background t={t} dim={dim} />
      {t < VEND + 0.35 && <>
        {SCN.map(([a0, a1, C], j) => {
          const a = j === 0 ? (t <= a1 - 0.3 ? 1 : clamp((a1 - t) / 0.3)) : win(t, a0, a1, 0.4, 0.3); if (a <= 0) return null;
          const push = 1 + 0.025 * clamp((t - Math.max(a0, 0)) / (a1 - Math.max(a0, 0))) + (j === 0 ? 0 : 0.02 * (1 - k(t, a0, 0.6, outCubic)));
          return <AbsoluteFill key={j} style={{opacity: a, transform: `scale(${push})`, transformOrigin: `${CX}px ${CY}px`}}><C t={t} /></AbsoluteFill>;
        })}
        <WordBlock t={t} />
        <Card t={t} t0={ST[7] - 0.15} t1={ST[10] - 0.4} refTxt={'SURAH AL-HUJURAT  ·  49:13'} ar={(EX as any)['49:13']} hl={3}
          lines={['“…and made you into peoples and tribes', 'so that you may come to know one another.”']} />
        <Card t={t} t0={ST[10] - 0.15} t1={ST[14] - 0.4} refTxt={'SURAH AL-ISRA  ·  17:70'} ar={(EX as any)['17:70']} hl={1} lines={['“We have certainly honoured the children of Adam.”']} />
        {LINES.map((_, i) => (i >= 4 ? <Caption key={i} t={t} i={i} /> : null))}
        <Chrome t={t} />
      </>}
      {!noEnd && <EndCard t={t} />}
      <Sweep t={t} t0={ST[4] - 0.55} />
      <Sweep t={t} t0={ST[10] - 0.5} />
      <Sweep t={t} t0={VEND - 0.3} d={1.1} />
    </AbsoluteFill>
  );
};

export const Ep03: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const loop = clamp((t - (TOTAL - 0.5)) / 0.4);
  return (
    <AbsoluteFill style={{background: INK}}>
      <Frame t={t} />
      {loop > 0 && <AbsoluteFill style={{opacity: loop}}><Frame t={0} noEnd /></AbsoluteFill>}
    </AbsoluteFill>
  );
};
