import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame, continueRender, delayRender} from 'remotion';
import TL from './timeline_ep04.json';
import EX from '../excerpts.json';

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

// ---------- scene A: hook — the scale of judgement ----------
const SY = 840; // beam height of the scale
const Scale: React.FC<{p: number; o?: number; tilt?: number}> = ({p, o = 1, tilt = 0}) => {
  const bx = 190, hang = 118, pw = 62; // half beam, string drop, pan half-width
  const pan = (x: number) => `M ${x - pw} ${SY + hang} A ${pw} ${pw * 0.52} 0 0 0 ${x + pw} ${SY + hang}`;
  const str = (x: number) => `M ${x - pw} ${SY + hang} L ${x} ${SY + 6} L ${x + pw} ${SY + hang}`;
  return (
    <g opacity={o} transform={`rotate(${tilt} ${CX} ${SY})`}>
      <Line d={`M ${CX} ${SY + 12} L ${CX} ${SY + 300}`} p={k(p, 0, 0.5)} w={3} c={GOLD} o={0.9} />
      <Line d={`M ${CX - 96} ${SY + 318} L ${CX + 96} ${SY + 318}`} p={k(p, 0.2, 0.4)} w={3} c={GOLD} o={0.9} />
      <Line d={`M ${CX - 46} ${SY + 318} Q ${CX} ${SY + 268} ${CX + 46} ${SY + 318}`} p={k(p, 0.25, 0.4)} w={2} c={GOLD} o={0.7} />
      <Line d={`M ${CX - bx} ${SY} L ${CX + bx} ${SY}`} p={k(p, 0.1, 0.5)} w={3} c={GOLDL} o={0.95} />
      <Line d={str(CX - bx)} p={k(p, 0.35, 0.45)} w={1.75} c={GOLD} o={0.75} />
      <Line d={str(CX + bx)} p={k(p, 0.35, 0.45)} w={1.75} c={GOLD} o={0.75} />
      <Line d={pan(CX - bx)} p={k(p, 0.55, 0.45)} w={2.5} c={GOLDL} o={0.9} />
      <Line d={pan(CX + bx)} p={k(p, 0.55, 0.45)} w={2.5} c={GOLDL} o={0.9} />
      <circle cx={CX} cy={SY} r={9} fill={INK} stroke={GOLDL} strokeWidth={2} opacity={clamp(p * 3)} />
      <path d={star8(CX, SY - 34, 14, Math.PI / 8)} fill="url(#goldF)" opacity={clamp(p * 2 - 0.6)} />
    </g>
  );
};
const Hook: React.FC<{t: number}> = ({t}) => {
  const sc = 1.05 - 0.05 * k(t, 0, 1.4, outExpo);
  const pr = k(t, wt(1, 'prophet') - 0.1, 0.7, outCubic);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 400, width: W, textAlign: 'center', fontFamily: F.cinzel, fontSize: 50, letterSpacing: 12, color: CREAM, opacity: 0.94}}>YOU WEREN’T ASKED</div>
      <div style={{position: 'absolute', top: 462, width: W, textAlign: 'center', transform: `scale(${sc})`}}>
        <span style={{fontFamily: F.cinzelB, fontSize: 132, letterSpacing: 4, lineHeight: '170px', ...goldText, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,.55))'}}>TO JUDGE.</span>
      </div>
      <Svg>
        <circle cx={CX} cy={SY + 140} r={300} fill="url(#haloW)" opacity={0.22 * (1 - pr)} />
        <Scale p={1} o={1 - 0.62 * pr} />
      </Svg>
    </AbsoluteFill>
  );
};

// ---------- scene B: al-balāgh — the message delivered to every light ----------
const NB = 8, RB = 200;
const RINGB = new Array(NB).fill(0).map((_, j) => {const a = -Math.PI / 2 + (j * 2 * Math.PI) / NB; return [CX + RB * Math.cos(a), CY + RB * Math.sin(a)];});
const Deliver: React.FC<{t: number; t0: number; waves: number[]; tAcc?: number; hearts?: number}> = ({t, t0, waves, tAcc, hearts}) => {
  const src = k(t, t0, 0.6, outExpo);
  const lit = (j: number) => waves.reduce((m, w) => Math.max(m, k(t, w + 0.55 + j * 0.03, 0.35)), 0);
  const acc = tAcc ? k(t, tAcc, 1.1, inOut) : 0;
  const hr = hearts !== undefined ? k(t, hearts, 0.6) : 0;
  return (
    <AbsoluteFill>
      <Svg>
        {tAcc && <Line d={`M ${CX} ${CY - 272} A 272 272 0 1 1 ${CX - 0.1} ${CY - 272}`} p={acc} w={1.5} c={GOLDL} o={0.55} />}
        {RINGB.map(([x, y], j) => {
          const ux = (x - CX) / RB, uy = (y - CY) / RB;
          const d = `M ${CX + ux * 34} ${CY + uy * 34} L ${CX + ux * (RB - 30)} ${CY + uy * (RB - 30)}`;
          const ray = k(t, t0 + 0.3 + j * 0.05, 0.5);
          return <g key={j}>
            <path d={d} stroke={GOLD} strokeWidth={1.5} strokeDasharray="3 10" strokeLinecap="round" fill="none" opacity={0.45 * ray} />
            {waves.map((w, wi) => {const u = (t - w - j * 0.03) / 0.55; if (u <= 0 || u >= 1) return null; const r = mix(34, RB - 30, outCubic(u));
              return <Light key={wi} x={CX + ux * r} y={CY + uy * r} r={5} c="#fff6dc" halo={1} />;})}
            {hr > 0 && <circle cx={x} cy={y} r={24} stroke={GOLD} strokeWidth={1.5} fill="none" opacity={0.6 * hr} />}
            <Light x={x} y={y} r={8} c={lit(j) > 0.5 ? CREAM : SLATE} cool={lit(j) < 0.5} o={k(t, t0 + 0.15 + j * 0.06, 0.4) * (0.55 + 0.45 * lit(j))} halo={0.45 + 0.55 * lit(j)} />
          </g>;
        })}
        <g transform={`translate(${CX} ${CY}) scale(${src}) translate(${-CX} ${-CY})`}>
          <circle cx={CX} cy={CY} r={130} fill="url(#haloW)" opacity={0.55} />
          <path d={star8(CX, CY, 26, Math.PI / 8)} fill="url(#goldF)" stroke={GOLDL} strokeWidth={1.2} />
          <circle cx={CX} cy={CY} r={6} fill="#fff6dc" />
        </g>
      </Svg>
    </AbsoluteFill>
  );
};
const WordBlock: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[3] - 0.25, t1 = ST[5] - 0.4; const a = win(t, t0, t1, 0.3, 0.3); if (a <= 0) return null;
  const p = k(t, t0, 0.8, outExpo), m = k(t, ST[4] - 0.2, 0.6, outExpo);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <div dir="rtl" lang="ar" style={{position: 'absolute', top: 352, width: W, textAlign: 'center', fontFamily: F.ar, fontSize: 168, lineHeight: '270px',
        transform: `translateY(${(1 - p) * 24}px) scale(${0.96 + 0.04 * p})`, opacity: p,
        color: '#efc874', textShadow: '0 6px 22px rgba(0,0,0,.55), 0 0 40px rgba(241,208,138,.25)'}}>البَلَاغ</div>
      <Reveal p={m} style={{left: 0, top: 628, width: W, textAlign: 'center'}}>
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 46, color: CREAM, opacity: 0.92}}>al-balāgh · to deliver the message</div>
      </Reveal>
    </AbsoluteFill>
  );
};

// ---------- scene C: deliver — not force, not search, not judge ----------
const Icon: React.FC<{x: number; kind: number; p: number; s: number}> = ({x, kind, p, s}) => {
  const y = 1196; if (p <= 0) return null;
  return (
    <g opacity={p}>
      {kind === 0 && <><Line d={`M ${x - 38} ${y} L ${x + 30} ${y}`} p={1} w={2.5} c={CREAM} o={0.85} /><Line d={`M ${x + 12} ${y - 18} L ${x + 32} ${y} L ${x + 12} ${y + 18}`} p={1} w={2.5} c={CREAM} o={0.85} /></>}
      {kind === 1 && <><circle cx={x - 8} cy={y - 8} r={22} stroke={CREAM} strokeWidth={2.5} fill="none" opacity={0.85} /><Line d={`M ${x + 8} ${y + 8} L ${x + 32} ${y + 32}`} p={1} w={3} c={CREAM} o={0.85} /></>}
      {kind === 2 && <><Line d={`M ${x - 34} ${y - 14} L ${x + 34} ${y - 14}`} p={1} w={2.5} c={CREAM} o={0.85} /><Line d={`M ${x} ${y - 24} L ${x} ${y + 30}`} p={1} w={2.5} c={CREAM} o={0.85} />
        <Line d={`M ${x - 46} ${y + 10} A 13 7 0 0 0 ${x - 20} ${y + 10}`} p={1} w={2} c={CREAM} o={0.85} /><Line d={`M ${x + 20} ${y + 10} A 13 7 0 0 0 ${x + 46} ${y + 10}`} p={1} w={2} c={CREAM} o={0.85} />
        <Line d={`M ${x - 33} ${y - 14} L ${x - 33} ${y + 10}`} p={1} w={1.25} c={CREAM} o={0.6} /><Line d={`M ${x + 33} ${y - 14} L ${x + 33} ${y + 10}`} p={1} w={1.25} c={CREAM} o={0.6} /></>}
      <circle cx={x} cy={y} r={58} stroke={GOLD} strokeWidth={1.5} fill="none" opacity={0.45} />
      <Line d={`M ${x - 41} ${y + 41} L ${x + 41} ${y - 41}`} p={s} w={3} c={GOLDL} o={0.95} />
    </g>
  );
};
const Heart: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[7] - 0.55, tD = ST[7], tF = wt(8, 'force') - 0.1, tS = wt(9, 'search') - 0.1, tJ = wt(10, 'judgement') - 0.2;
  const ring = k(t, t0, 0.8, inOut), msg = k(t, tD - 0.1, 0.55, outCubic), y = 930;
  const force = k(t, tF, 0.35, outCubic) * (1 - k(t, tF + 0.5, 0.5));
  const scan = win(t, tS, tS + 1.2, 0.3, 0.4), rot = (t - tS) * 120;
  const ping = (t0p: number) => {const u = (t - t0p) / 0.8; return u > 0 && u < 1 ? u : 0;};
  return (
    <AbsoluteFill>
      <Svg>
        <circle cx={CX} cy={y} r={180} fill="url(#haloW)" opacity={0.3 * ring} />
        <Line d={`M ${CX} ${y - 118} A 118 118 0 1 1 ${CX - 0.1} ${y - 118}`} p={ring} w={2.5} c={GOLDL} o={0.9} />
        <Light x={CX} y={y} r={14} c={CREAM} o={ring} halo={0.7 + 0.3 * msg} />
        {/* the message arrives and rests at the edge */}
        <Line d={`M 140 ${y} L ${CX - 146} ${y}`} p={msg} w={2.5} c={GOLD} o={0.9} />
        {msg > 0 && <Light x={mix(140, CX - 146, msg)} y={y} r={6} c="#fff6dc" halo={1} />}
        {/* force: three pushes stop short of the ring */}
        {[-0.75, -0.5, -0.25].map((f, j) => {const an = f * Math.PI, dx = Math.cos(an), dy = Math.sin(an), r0 = 300, r = mix(r0, 152, force);
          const hx = CX + dx * r, hy = y + dy * r, px = -dy, py = dx;
          return force > 0 && <g key={j} opacity={force}><path d={`M ${CX + dx * r0} ${y + dy * r0} L ${hx} ${hy}`} stroke={SLATE} strokeWidth={2.5} strokeLinecap="round" fill="none" />
            <path d={`M ${hx + dx * 16 + px * 12} ${hy + dy * 16 + py * 12} L ${hx} ${hy} L ${hx + dx * 16 - px * 12} ${hy + dy * 16 - py * 12}`} stroke={SLATE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" /></g>;})}
        {/* search: a scanning ring that cannot see inside */}
        {scan > 0 && <circle cx={CX} cy={y} r={164} stroke={SLATE} strokeWidth={2} strokeDasharray="6 14" fill="none" opacity={0.7 * scan} transform={`rotate(${rot} ${CX} ${y})`} />}
        {[tF + 0.3, tS + 0.5, tJ + 0.4].map((tp, j) => {const u = ping(tp); return u > 0 && <circle key={j} cx={CX} cy={y} r={mix(118, 150, outCubic(u))} stroke={GOLDL} strokeWidth={2} fill="none" opacity={(1 - u) * 0.6} />;})}
        <Icon x={CX - 210} kind={0} p={k(t, tF - 0.05, 0.35)} s={k(t, tF + 0.35, 0.3)} />
        <Icon x={CX} kind={1} p={k(t, tS - 0.05, 0.35)} s={k(t, tS + 0.45, 0.3)} />
        <Icon x={CX + 210} kind={2} p={k(t, tJ - 0.05, 0.35)} s={k(t, tJ + 0.5, 0.3)} />
      </Svg>
    </AbsoluteFill>
  );
};

// ---------- scene D: one who reminds — points to the light, holds no tether ----------
const Remind: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[11] - 0.3, tR = wt(11, 'remind') - 0.1, tRs = wt(12, 'reminds'), tC = wt(13, 'not') - 0.1, tTh = wt(13, 'control') + 0.05;
  const y = 1110, xa = 330, xb = 750, sx = CX, sy = 880;
  const ap = k(t, t0, 0.6), star = k(t, t0 + 0.2, 0.8, outBack), point = k(t, tR, 0.8, inOut), hear = k(t, tRs - 0.1, 0.6);
  const teth = k(t, tC, 0.5, inOut), brk = k(t, tTh, 0.7, outCubic);
  const ux = (sx - xa) / Math.hypot(sx - xa, sy - y), uy = (sy - y) / Math.hypot(sx - xa, sy - y);
  const len = Math.hypot(sx - xa, sy - y) - 34 - 44;
  const mid = (xa + xb) / 2, gap = 70 * brk;
  return (
    <AbsoluteFill>
      <Svg>
        <g transform={`translate(${sx} ${sy}) scale(${star}) translate(${-sx} ${-sy})`}>
          <circle cx={sx} cy={sy} r={120} fill="url(#haloW)" opacity={0.6} />
          <path d={star8(sx, sy, 30, Math.PI / 8)} fill="url(#goldF)" stroke={GOLDL} strokeWidth={1.2} />
        </g>
        <Line d={`M ${xa + ux * 34} ${y + uy * 34} L ${xa + ux * (34 + len)} ${y + uy * (34 + len)}`} p={point} w={2.5} c={GOLDL} o={0.85} />
        {point > 0.02 && point < 0.99 && <Light x={xa + ux * (34 + len * point)} y={y + uy * (34 + len * point)} r={5} c="#fff6dc" halo={1} />}
        {hear > 0 && hear < 1 && <circle cx={xb} cy={y} r={mix(30, 90, outCubic(hear))} stroke={GOLDL} strokeWidth={2} fill="none" opacity={(1 - hear) * 0.6} />}
        {teth > 0 && <>
          <path d={`M ${xa + 34} ${y} L ${mid - gap / 2} ${y}`} stroke={SLATE} strokeWidth={2} strokeDasharray="4 10" strokeLinecap="round" fill="none" opacity={0.75 * (1 - brk)} style={{clipPath: `inset(0 ${(1 - teth) * 100}% 0 0)`}} />
          <path d={`M ${mid + gap / 2} ${y} L ${xb - 34} ${y}`} stroke={SLATE} strokeWidth={2} strokeDasharray="4 10" strokeLinecap="round" fill="none" opacity={0.75 * (1 - brk)} style={{clipPath: `inset(0 ${(1 - teth) * 100}% 0 0)`}} />
        </>}
        <Light x={xa} y={y} r={12} c={GOLDL} o={ap} halo={0.8} />
        <Light x={xb} y={y + 6 * Math.sin(t * 1.3) * brk} r={12} c={CREAM} o={ap} halo={0.6 + 0.4 * hear} cool={hear < 0.5} />
      </Svg>
    </AbsoluteFill>
  );
};

// ---------- scene E: the hard part — no one may enclose another's conscience ----------
const ROWX = [-2, -1, 0, 1, 2].map((j) => CX + j * 150);
const SEG = 14;
const Conscience: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[14] - 0.3, tC = wt(16, 'how') - 0.1, tAu = wt(17, 'authority') + 0.2, tCo = wt(17, 'over') - 0.05, y = 990;
  const draw = k(t, tC, tAu - tC, inOut), brk = k(t, tCo, 0.9, outCubic);
  return (
    <AbsoluteFill>
      <Svg>
        {ROWX.map((x, j) => {const a = k(t, t0 + 0.2 + j * 0.12, 0.5);
          return <g key={j}>
            <Line d={`M ${x} ${y - 46} A 46 46 0 1 1 ${x - 0.1} ${y - 46}`} p={a} w={1.75} c={GOLD} o={0.7} />
            <Light x={x} y={y} r={9} c={j % 2 ? SLATE : CREAM} cool={j % 2 === 1} o={a * (0.75 + 0.25 * brk)} halo={0.5 + 0.4 * brk} />
          </g>;})}
        {new Array(SEG).fill(0).map((_, j) => {
          const a0 = (j / SEG) * 2 * Math.PI - Math.PI / 2, a1 = ((j + 0.72) / SEG) * 2 * Math.PI - Math.PI / 2, am = (a0 + a1) / 2;
          const rx = 410 + 70 * brk, ry = 160 + 40 * brk, dx = Math.cos(am) * 0, dy = 0;
          const p0 = [CX + dx + rx * Math.cos(a0), y + dy + ry * Math.sin(a0)], p1 = [CX + dx + rx * Math.cos(a1), y + dy + ry * Math.sin(a1)];
          const vis = clamp((draw * SEG - j) * 1.0);
          return vis > 0 && <path key={j} d={`M ${p0[0]} ${p0[1]} A ${rx} ${ry} 0 0 1 ${p1[0]} ${p1[1]}`} stroke={SLATE} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.8 * vis * (1 - brk)} />;
        })}
      </Svg>
    </AbsoluteFill>
  );
};

// ---------- scene F: one moment vs the whole journey ----------
const JP = (u: number): [number, number] => [170 + 740 * u, CY + 150 * Math.sin(3 * Math.PI * u + Math.PI / 2) - 40 * (u - 0.5)];
const JPATH = 'M ' + new Array(121).fill(0).map((_, j) => JP(j / 120).map((v) => v.toFixed(1)).join(' ')).join(' L ');
const Journey: React.FC<{t: number}> = ({t}) => {
  const t0 = ST[18] - 0.3, tM = wt(18, 'moment') - 0.2, tJ = wt(19, 'sees') - 0.1;
  const lens = k(t, t0 + 0.1, 0.6, outBack) * (1 - k(t, tJ + 0.6, 0.6)), whole = k(t, tJ, 1.25, inOut);
  const [mx, my] = JP(0.5), [hx, hy] = JP(whole);
  return (
    <AbsoluteFill>
      <Svg>
        <defs><clipPath id="lensC"><circle cx={mx} cy={my} r={78} /></clipPath></defs>
        <path d={JPATH} stroke={GOLD} strokeWidth={1.5} strokeDasharray="2 12" strokeLinecap="round" fill="none" opacity={0.25 * k(t, tJ - 0.4, 0.5)} />
        <g clipPath="url(#lensC)"><path d={JPATH} stroke={GOLDL} strokeWidth={3} fill="none" opacity={lens} /></g>
        <circle cx={mx} cy={my} r={78 * clamp(lens * 1.2)} stroke={CREAM} strokeWidth={2} fill="none" opacity={0.75 * lens} />
        <Line d={JPATH} p={whole} w={3} c={GOLDL} o={0.95} />
        {whole > 0.01 && <Light x={hx} y={hy} r={9} c="#fff6dc" halo={1} />}
        <Light x={mx} y={my} r={9} c={CREAM} o={Math.max(lens, k(t, tM, 0.4) * (1 - whole * 0.6))} halo={0.8} />
        {[JP(0), JP(1)].map(([x, y], j) => <circle key={j} cx={x} cy={y} r={7} fill={GOLDL} opacity={whole > (j ? 0.98 : 0.01) ? 1 : 0} />)}
      </Svg>
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
  [-1, ST[2] - 0.3, Hook],
  [ST[2] - 0.35, ST[7] - 0.3, ({t}) => <Deliver t={t} t0={ST[2] - 0.2} waves={[wt(4, 'deliver') - 0.15, wt(5, 'deliver') - 0.15]} tAcc={wt(6, 'us') - 0.2} />],
  [ST[7] - 0.6, ST[11] - 0.3, Heart],
  [ST[11] - 0.35, ST[14] - 0.3, Remind],
  [ST[14] - 0.35, ST[18] - 0.05, Conscience],
  [ST[18] - 0.1, ST[20] + 0.05, Journey],
  [ST[20] - 0.0, VEND + 0.25, ({t}) => <Deliver t={t} t0={ST[20] - 0.2} waves={[wt(21, 'deliver') - 0.2]} hearts={wt(20, 'hearts') - 0.2} />],
];
const Frame: React.FC<{t: number; noEnd?: boolean}> = ({t, noEnd}) => {
  const dim = win(t, ST[14] - 0.4, ST[18] - 0.2, 0.6, 0.8);
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
