import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, continueRender, delayRender, spring} from 'remotion';
import TL from './timeline_ep09.json';
import EX from '../excerpts.json';
import {Icon, Mark, Strike, StrikeIn} from '../lib/icons';

// =====================================================================================
// One Word · 09 · qisṭ — same design system as Ep04 (reference) and Ep08 (kinetic type, drawn objects, solid arrows)
//  - a person is a point of light; a reply is a speech bubble that travels between two people
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
      ONE WORD &nbsp;·&nbsp; 09 &nbsp;·&nbsp; FROM THE MIRROR</div>
    {bar && <div style={{position: 'absolute', top: 1512, left: 160, width: W - 320, height: 2, background: 'rgba(201,164,87,.18)', borderRadius: 2}}>
      <div style={{width: `${clamp(t / VEND) * 100}%`, height: 2, background: GOLDL, borderRadius: 2}} /></div>}
  </AbsoluteFill>
);

// ---------- verse card ----------
const Card: React.FC<{t: number; t0: number; t1: number; refTxt: string; ar: string; hl: number[]; lines: string[]; fs?: number; lh?: number; hlT?: [number, number][]}> = ({t, t0, t1, refTxt, ar, hl, lines, fs = 58, lh = 108, hlT = []}) => {
  const a = win(t, t0, t1, 0.12, 0.12); if (a <= 0) return null;
  const s = k(t, t0, 0.45, outExpo); const words = ar.split(' ');
  return (
    <div style={{position: 'absolute', top: 384, left: 96, width: 888, opacity: a, transform: `translateY(${(1 - s) * 24}px) scale(${0.97 + 0.03 * s})`,
      background: 'linear-gradient(180deg,#f6eedc,#ece0c4)', borderRadius: 14, padding: '22px 38px 24px', textAlign: 'center',
      boxShadow: `inset 0 0 0 1.5px ${GOLD}, inset 0 0 0 7px #f3e9d3, inset 0 0 0 8px ${GOLD}77, 0 26px 60px rgba(0,0,0,.55)`}}>
      <div style={{fontFamily: F.cinzelB, fontSize: 23, letterSpacing: 6, color: BROWN}}>{refTxt}</div>
      <div dir="rtl" lang="ar" style={{fontFamily: F.quran, fontSize: fs, lineHeight: `${lh}px`, color: NAVY, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', columnGap: 16}}>
        <span style={{color: BROWN}}>{'﴿'}</span>
        {words.map((w, j) => {const p = k(t, t0 + 0.2 + 0.1 * j, 0.45, outCubic);
          if (w === '|') return <span key={j} style={{display: 'inline-block', opacity: p, color: BROWN, fontFamily: F.ar, fontSize: fs * 0.62}}>{'۝'}</span>;
          const lit = hl.includes(j) || hlT.some(([jj, tt]) => jj === j && t >= tt);
          return <span key={j} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 10}px)`, color: lit ? '#a06a0c' : NAVY, transition: 'none'}}>{w}</span>;})}
        <span style={{color: BROWN}}>{'﴾'}</span>
      </div>
      <div style={{fontFamily: F.it, fontSize: 35, lineHeight: 1.2, color: '#2c3550'}}>{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
    </div>
  );
};

// ---------- captions: balanced rows, words revealed as spoken ----------
const KEY: Record<number, string> = {1: 'testify', 2: 'asks', 3: 'qisṭ.', 4: 'God', 5: 'believe,', 6: 'justice', 7: 'yourselves,', 8: 'parents', 9: 'due.',
  10: 'wrong,', 11: 'right.', 12: 'God,', 13: 'hard', 14: 'goodness', 15: 'differs', 16: 'scale', 17: 'faults', 18: 'true,', 19: 'disliked.', 20: 'stranger:', 21: 'measure'};
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
const CheckMark: React.FC<{x: number; y: number; s: number; p: number}> = ({x, y, s, p}) => <Mark kind="check" x={x} y={y} size={s} p={p} sw={Math.max(6, s * 0.1)} />;const bigTxt = (size: number): React.CSSProperties => ({fontFamily: F.cinzelB, fontSize: size, letterSpacing: '0.04em', ...goldText, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,.55))'});

// ---------- the reply: a speech bubble (through-line) ----------
type BKind = 'gold' | 'cream' | 'red';
const bubbleD = (w: number, h: number, r: number, tx: number, dir: number) =>
  `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${tx + 26} L ${tx + (dir > 0 ? 36 : -16)} ${h + 30} L ${tx} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
const Bubble: React.FC<{x: number; y: number; w: number; h: number; kind: BKind; o?: number; s?: number; tail?: number; glow?: number; icon?: string; label?: string;
  fs?: number; dim?: number}> = ({x, y, w, h, kind, o = 1, s = 1, tail = 1, glow = 0, icon, label, fs = 34, dim = 0}) => {
  if (o <= 0.001 || s <= 0.001) return null;
  const stroke = kind === 'gold' ? GOLDL : kind === 'red' ? RED : CREAM;
  const fill = kind === 'gold' ? 'url(#bubG)' : kind === 'red' ? 'rgba(60,24,22,.85)' : 'rgba(20,32,56,.92)';
  const txt = kind === 'gold' ? INK : kind === 'red' ? '#f3c2b8' : CREAM;
  const tx = tail > 0 ? w * 0.2 : w * 0.8 - 26;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: o * (1 - 0.6 * dim), transform: `scale(${s})`, transformOrigin: '50% 100%'}}>
      <svg width={w} height={h + 34} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible',
        filter: glow > 0 ? `drop-shadow(0 0 ${26 * glow}px rgba(241,208,138,${0.75 * glow}))` : 'drop-shadow(0 10px 24px rgba(0,0,0,.45))'}}>
        <defs><linearGradient id="bubG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8e4ad" /><stop offset="1" stopColor="#d6a54c" /></linearGradient></defs>
        <path d={bubbleD(w, h, Math.min(34, h * 0.3), tx, tail)} fill={fill} stroke={stroke} strokeWidth={kind === 'gold' ? 4 : 4} strokeLinejoin="round" />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14}}>
        {icon && <div style={{position: 'relative', width: h * 0.52, height: h * 0.52}}><Icon name={icon} x={h * 0.26} y={h * 0.26} size={h * 0.52} p={1} sw={Math.max(3, h * 0.035)} c={txt} glow={0} /></div>}
        {label && <span style={{fontFamily: F.cinzelB, fontSize: fs, letterSpacing: '0.08em', color: txt, whiteSpace: 'nowrap'}}>{label}</span>}
      </div>
    </div>
  );
};
const Tag: React.FC<{x: number; y: number; p: number; c?: string; size?: number; w?: number; children: React.ReactNode}> = ({x, y, p, c = CREAM, size = 26, w = 420, children}) => p <= 0 ? null :
  <div style={{position: 'absolute', left: x - w / 2, top: y, width: w, textAlign: 'center', fontFamily: F.cinzelB, fontSize: size, letterSpacing: '0.2em', color: c,
    opacity: clamp(p), transform: `translateY(${(1 - clamp(p)) * 14}px)`}}>{children}</div>;
const Person: React.FC<{x: number; y: number; p: number; label?: string; warm?: boolean; r?: number; lo?: number; ls?: number}> = ({x, y, p, label, warm = true, r = 22, lo = 1, ls = 28}) => p <= 0 ? null : <>
  <Dot x={x} y={y} r={r * (0.6 + 0.4 * clamp(p))} o={clamp(p * 1.5)} warm={warm} />
  {label && <Tag x={x} y={y + r + 22} p={p * lo} size={ls} c={warm ? GOLDL : SLATE}>{label}</Tag>}
</>;
// a solid arrow along a quadratic curve, drawn on with p; filled head oriented along the curve
const Arrow: React.FC<{x0: number; y0: number; cx: number; cy: number; x1: number; y1: number; p: number; c?: string; w?: number}> = ({x0, y0, cx, cy, x1, y1, p, c = GOLDL, w = 12}) => {
  if (p <= 0) return null;
  const q = (u: number) => [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1];
  const u = clamp(p), n = 40, pts: string[] = [];
  for (let i = 0; i <= n; i++) {const [x, y] = q((u * i) / n); pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);}
  const [ex, ey] = q(u), [bx, by] = q(Math.max(0, u - 0.02)); const an = Math.atan2(ey - by, ex - bx);
  const hl = w * 3.2, hw = w * 2.2;
  const tip = [ex + Math.cos(an) * hl * 0.55, ey + Math.sin(an) * hl * 0.55];
  const l = [ex - Math.cos(an) * hl * 0.45 + Math.cos(an + Math.PI / 2) * hw, ey - Math.sin(an) * hl * 0.45 + Math.sin(an + Math.PI / 2) * hw];
  const r = [ex - Math.cos(an) * hl * 0.45 - Math.cos(an + Math.PI / 2) * hw, ey - Math.sin(an) * hl * 0.45 - Math.sin(an + Math.PI / 2) * hw];
  return <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, filter: 'drop-shadow(0 0 12px rgba(241,208,138,.55))'}}>
    <polyline points={pts.join(' ')} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M ${tip[0]} ${tip[1]} L ${l[0]} ${l[1]} L ${r[0]} ${r[1]} Z`} fill={c} stroke={c} strokeWidth={3} strokeLinejoin="round" opacity={clamp(u * 4)} />
  </svg>;
};

// =====================================================================================
// STORYBOARD (line → picture → what it says). Written before animating (RUNBOOK §5a).
// Through-line: THE SCALE (qisṭ). A drawn gold balance that is on frame 1 tipped towards YOUR PARENTS, is levelled by the Qur'an's
// command, stands small under the verse, hands every person his due, is pulled by a group's rope and freed, turns into a LENS when
// prejudice takes over, comes back true for the loved and the disliked, and ends level with YOUR PARENTS against A STRANGER.
//  0 Your parents are wrong.               → frame 1 at full brightness: YOUR PARENTS / ARE WRONG. + قِسْط (large) + "qisṭ · justice";
//                                          the scale swinging, its left pan (two lights = YOUR PARENTS) heavier, right pan = a TRUTH
//                                          plaque. Red ✗ by the parents on "wrong" (motion in the first second, no branding first)
//  1 Would you still testify against them? → headline swaps to TESTIFY / AGAINST THEM?; a raised hand (the witness) rises from the TRUTH pan
//  2 The Qur'an asks you to.               → the beam swings level: ✓ by TESTIFY; tag THE QUR'AN ASKS
//  3 One word: qisṭ.                       → headline lifts away, ONE WORD; the Arabic word swells; root tiles ق · س · ط (qāf sīn ṭā)
//  4 God says: (verse window)             → the word and its root tiles stay (music already off)
//  5–8 4:135 (verse window: calm)          → card (بِٱلۡقِسۡطِ gold; أَنفُسِكُمۡ / ٱلۡوَٰلِدَيۡنِ / ٱلۡأَقۡرَبِينَ turn gold as they are read);
//                                          under it the small scale draws on "justice"; three tiles on their words:
//                                          YOURSELF (user) · YOUR PARENTS (users) · YOUR RELATIVES (home); the beam stays level
//  9 Qisṭ: … every person his rightful due  → QISṬ; the big scale; five people appear on "every person"; a gold coin flies from the pans
//                                          to each one on "gives … due", each gets ✓: EVERY PERSON'S RIGHTFUL DUE
// 10–11 admit someone close is wrong /     → split panel: SOMEONE CLOSE (warm light, home) ✗ WRONG | AN OPPONENT (cool light) ✓ RIGHT
//       an opponent is right                 headline ADMIT IT
// 12 A witness for God, not group prejudice → YOU stand at the scale's top with a raised hand; a GROUP (cluster of cool lights) pulls the
//                                          left pan down with a rope; on "not" the rope is cut ✗, the beam swings level; FOR GOD ✓
// 13 Here's the hard part                  → the light dims: THE HARD PART
// 14–15 prejudice overlooks goodness in    → THEM (cool light) with three goodness chips HONEST · KIND · FAIR; YOUR eye (top left) closes into
//       anyone who differs                   eye-off: PREJUDICE; a dark veil slides over the chips; tag DIFFERS FROM YOU
// 16–17 scale of justice → a lens that     → the scale returns with RELIGION under it: A SCALE OF JUSTICE, struck on "stops"; the scale
//       sees only faults                     shrinks away and a magnifying LENS swings over THEM; three red ✗ faults inside it: ONLY FAULTS
// 18–19 a scale that stays true, loved or   → the scale back, big: STAYS TRUE ✓; LOVED (warm light + heart) drops into the left pan,
//       disliked                             DISLIKED (cool light) into the right; the beam wobbles and settles level
// 20–21 Your parents, or a stranger: the   → callback to frame 1: the same scale and word; YOUR PARENTS (left) vs A STRANGER (right),
//       measure doesn't change               level; headline SAME MEASURE ✓
// 22–23 follow line                        → end card: the book, ONE QUR'ANIC WORD A DAY / Follow so you don't miss tomorrow's
// SILENT TEST: muted, the tipped scale with the parents ✗, the levelled beam, the three gold verse words and tiles, the coins reaching
// every person, the ✗ WRONG | ✓ RIGHT panels, the cut rope, the veil over goodness, the scale turning into a lens of red ✗ and the
// level scale for loved and disliked carry the argument. Each picture belongs to its own line.
// =====================================================================================

// ---------- the scale (through-line) ----------
const SC = {L: 300, C: 150};
const panRim = (x: number, y: number, s: number, a: number, side: -1 | 1) => {
  const r = (a * Math.PI) / 180; const L = SC.L * s;
  return [x + side * L * Math.cos(r), y + side * L * Math.sin(r) + SC.C * s];   // centre of the pan's rim
};
// damped swing towards a target angle (deg)
const swing = (t: number, t0: number, from: number, to: number, f = 5.5, d = 2.2) => {
  if (t < t0) return from; const u = t - t0;
  return to + (from - to) * Math.exp(-d * u) * Math.cos(f * u);
};
const Scale: React.FC<{x: number; y: number; s?: number; a?: number; o?: number; pop?: number; glow?: number; dim?: number}> = ({x, y, s = 1, a = 0, o = 1, pop = 1, glow = 0.4, dim = 0}) => {
  if (o <= 0.001 || pop <= 0.001) return null;
  const L = SC.L * s, C = SC.C * s, r = (a * Math.PI) / 180;
  const ends = [-1, 1].map((sd) => [x + sd * L * Math.cos(r), y + sd * L * Math.sin(r)]);
  const P = 330 * s;   // pillar height
  const sc = Math.min(1.04, pop);
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: o * (1 - 0.45 * dim),
      transform: `scale(${sc})`, transformOrigin: `${x}px ${y + P}px`, filter: `drop-shadow(0 0 ${16 * glow}px rgba(241,208,138,${0.5 * glow})) drop-shadow(0 14px 22px rgba(0,0,0,.5))`}}>
      <defs>
        <linearGradient id="scG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#a87a2c" /><stop offset="0.45" stopColor="#f6dfa3" /><stop offset="1" stopColor="#a87a2c" /></linearGradient>
        <linearGradient id="scV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6dfa3" /><stop offset="1" stopColor="#b5852f" /></linearGradient>
      </defs>
      {/* base and pillar */}
      <path d={`M ${x - 130 * s} ${y + P + 26 * s} Q ${x} ${y + P - 18 * s} ${x + 130 * s} ${y + P + 26 * s} Z`} fill="url(#scV)" stroke={GOLDL} strokeWidth={3} />
      <rect x={x - 70 * s} y={y + P - 8 * s} width={140 * s} height={16 * s} rx={6 * s} fill="url(#scV)" stroke={GOLDL} strokeWidth={2} />
      <rect x={x - 11 * s} y={y - 6 * s} width={22 * s} height={P} rx={8 * s} fill="url(#scG)" stroke={GOLDL} strokeWidth={2} />
      {/* chains and pans (they hang straight down from the beam ends) */}
      {ends.map(([ex, ey], j) => (
        <g key={j}>
          <line x1={ex} y1={ey} x2={ex - 100 * s} y2={ey + C} stroke={GOLDL} strokeWidth={3} opacity={0.9} />
          <line x1={ex} y1={ey} x2={ex + 100 * s} y2={ey + C} stroke={GOLDL} strokeWidth={3} opacity={0.9} />
          <path d={`M ${ex - 125 * s} ${ey + C} Q ${ex} ${ey + C + 78 * s} ${ex + 125 * s} ${ey + C} Z`} fill="url(#scV)" stroke={GOLDL} strokeWidth={3} />
          <circle cx={ex} cy={ey} r={9 * s} fill={GOLDL} />
        </g>
      ))}
      {/* beam with pointer */}
      <g transform={`rotate(${a} ${x} ${y})`}>
        <rect x={x - L - 6 * s} y={y - 9 * s} width={2 * L + 12 * s} height={18 * s} rx={9 * s} fill="url(#scV)" stroke={GOLDL} strokeWidth={2} />
        <path d={`M ${x} ${y - 70 * s} L ${x - 10 * s} ${y - 8 * s} L ${x + 10 * s} ${y - 8 * s} Z`} fill={GOLDL} />
      </g>
      <circle cx={x} cy={y} r={20 * s} fill="url(#scV)" stroke={GOLDL} strokeWidth={3} />
      <circle cx={x} cy={y - 92 * s} r={13 * s} fill="url(#scV)" stroke={GOLDL} strokeWidth={2} />
    </svg>
  );
};
// a raised hand: the witness
const Witness: React.FC<{x: number; y: number; p: number; size?: number}> = ({x, y, p, size = 130}) => p <= 0 ? null : <>
  <Glow x={x} y={y} r={size * 0.9} o={0.6 * clamp(p)} />
  <Icon name="hand-stop" x={x} y={y + (1 - clamp(p)) * 30} size={size * Math.min(1.05, 0.6 + 0.4 * p)} p={clamp(p * 1.3)} sw={7} c={GOLDL} />
</>;
const Plaque: React.FC<{x: number; y: number; text: string; o?: number; w?: number}> = ({x, y, text, o = 1, w = 190}) => o <= 0 ? null :
  <div style={{position: 'absolute', left: x - w / 2, top: y - 58, width: w, height: 58, opacity: o, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(180deg,#f6eedc,#e3d3ad)', boxShadow: `inset 0 0 0 2px ${GOLD}, 0 8px 18px rgba(0,0,0,.45)`, fontFamily: F.cinzelB, fontSize: 30, letterSpacing: '0.12em', color: NAVY}}>{text}</div>;
const ArWord: React.FC<{y: number; size: number; o?: number; zoom?: number}> = ({y, size, o = 1, zoom = 0}) => o <= 0 ? null : (
  <div style={{opacity: o}}>
    <Glow x={CX} y={y + size * 0.7} r={size * 1.5 + 60 * zoom} o={0.55 + 0.25 * zoom} />
    <div dir="rtl" lang="ar" style={{position: 'absolute', left: 0, top: y, width: W, height: size * 1.5, textAlign: 'center', fontFamily: F.arw, fontSize: size, lineHeight: `${size * 1.5}px`,
      color: '#efc874', transform: `scale(${1 + 0.18 * zoom})`, transformOrigin: '50% 60%', textShadow: `0 10px 30px rgba(0,0,0,.55), 0 0 ${60 + 40 * zoom}px rgba(241,208,138,${0.35 + 0.25 * zoom})`}}>قِسْط</div>
  </div>
);

// ---------- scene A: hook (frame 1) → testify → the Qur'an asks → one word ----------
const HX = CX, HY = 960, HS = 0.85;
const SceneHook: React.FC<{t: number}> = ({t}) => {
  const tW = wt(0, 'wrong'), tT = wt(1, 'testify'), tA = wt(2, 'asks');
  const head1 = 1 - inQuint((t - ST[1] + 0.3) / 0.28);
  const a = t < ST[2] - 0.1 ? -13 + 5 * Math.cos(t * 4.2) * Math.exp(-0.9 * t) : swing(t, ST[2] - 0.1, -13 + 5 * Math.cos((ST[2] - 0.1) * 4.2) * Math.exp(-0.9 * (ST[2] - 0.1)), 0, 4.5, 2.4);
  const x1 = outQuint((t - tW + 0.05) / 0.35);
  const hand = sp(t, tT - 0.2, 12, 150);
  const ok = outQuint((t - tA - 0.1) / 0.4);
  const out = quint((t - ST[3] + 0.4) / 0.3);          // headline, scale leave for "one word"
  const zoom = quint((t - wt(3, 'qisṭ') + 0.4) / 0.6);
  const leave = inQuint((t - ST[5] + 0.45) / 0.3);       // word and tiles stay through "God says:", fade before the card arrives
  const [lx, ly] = panRim(HX, HY, HS, a, -1), [rx, ry] = panRim(HX, HY, HS, a, 1);
  const tiles = [['ق', 'qāf'], ['س', 'sīn'], ['ط', 'ṭā']];
  return (
    <AbsoluteFill>
      <div style={{opacity: head1, transform: `translateY(${-40 * (1 - head1)}px)`}}>
        <Line1 y={384}><span style={{fontFamily: F.cinzelB, fontSize: 84, letterSpacing: '0.06em', color: CREAM}}>YOUR PARENTS</span></Line1>
        <Line1 y={478}><span style={{display: 'inline-block', ...bigTxt(104), lineHeight: '124px'}}>ARE WRONG.</span></Line1>
      </div>
      <div style={{opacity: 1 - out, transform: `translateY(${-50 * out}px)`}}>
        <Line1 y={380}><KType text="TESTIFY" t={t} tin={ST[1] - 0.12} size={108} color={GOLDT} /></Line1>
        <Line1 y={500}><KType text="AGAINST THEM?" t={t} tin={ST[1] + 0.25} size={72} /></Line1>
        <CheckMark x={890} y={448} s={92} p={ok} />
      </div>
      <Line1 y={440}><KType text="ONE WORD" t={t} tin={ST[3] - 0.02} tout={ST[5] - 0.55} size={84} color={GOLDT} /></Line1>
      <div style={{opacity: 1 - leave}}>
        <ArWord y={600 + 40 * zoom} size={150} zoom={zoom} />
        <Line1 y={800 + 70 * zoom}><span style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 50 + 8 * zoom, color: CREAM}}>qisṭ · <span style={GOLDT}>justice</span></span></Line1>
        {tiles.map(([c, n], j) => {
          const p = sp(t, wt(3, 'qisṭ') + 0.05 + j * 0.16, 12, 170);
          return p <= 0 ? null : <div key={j} style={{position: 'absolute', left: 810 - j * 270 - 80, top: 1010, width: 160, height: 200, opacity: clamp(p * 2), transform: `scale(${Math.min(1.05, 0.7 + 0.3 * p)})`}}>
            <Glass x={0} y={0} w={160} h={200} o={1} active={0.6} />
            <div dir="rtl" lang="ar" style={{position: 'absolute', top: 8, width: 160, textAlign: 'center', fontFamily: F.ar, fontSize: 96, lineHeight: '130px', color: GOLDL}}>{c}</div>
            <div style={{position: 'absolute', top: 140, width: 160, textAlign: 'center', fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 38, color: CREAM}}>{n}</div>
          </div>;
        })}
      </div>
      <div style={{opacity: 1 - out}}>
        <Scale x={HX} y={HY} s={HS} a={a} glow={0.35 + 0.5 * ok} />
        <Dot x={lx - 38} y={ly - 24} r={18} /><Dot x={lx + 38} y={ly - 24} r={18} />
        <Tag x={lx} y={ly + 60} p={1} c={GOLDL} size={26} w={330}>YOUR PARENTS</Tag>
        <Plaque x={rx} y={ry - 2} text="TRUTH" />
        <Witness x={rx} y={ry - 140} p={hand} size={120} />
        <Mark kind="x" x={lx - 150} y={ly - 70} size={78} p={x1} sw={11} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene B: 4:135 (verse window: calm) ----------
const SceneVerse: React.FC<{t: number}> = ({t}) => {
  const pin = outQuint((t - ST[5] - 0.1) / 0.5);
  const sIn = sp(t, ST[5] + 0.35, 14, 120), jg = win(t, wt(6, 'justice') - 0.1, wt(6, 'justice') + 1.2, 0.2, 0.6);
  const a = 3 * Math.sin((t - ST[5]) * 1.6) * Math.exp(-0.35 * Math.max(0, t - ST[5]));
  const T = [['user', 'YOURSELF', wt(7, 'yourselves')], ['users', 'YOUR PARENTS', wt(8, 'parents')], ['home', 'YOUR RELATIVES', wt(8, 'relatives')]] as const;
  return (
    <AbsoluteFill style={{opacity: pin}}>
      <Scale x={CX} y={952} s={0.45} a={a} pop={sIn} glow={0.4 + 0.8 * jg} />
      {T.map(([ic, lb, tt], j) => {
        const p = outQuint((t - tt + 0.15) / 0.45);
        return p <= 0 ? null : <div key={j} style={{position: 'absolute', left: 70 + j * 320, top: 1124, width: 300, height: 140, opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>
          <Glass x={0} y={0} w={300} h={140} o={1} active={0.5 * p} />
          <Icon name={ic} x={150} y={50} size={66} p={p} sw={5} c={GOLDL} />
          <div style={{position: 'absolute', top: 92, width: 300, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 25, letterSpacing: '0.08em', color: CREAM}}>{lb}</div>
        </div>;
      })}
    </AbsoluteFill>
  );
};

// ---------- scene C: every person his rightful due ----------
const PPL = [170, 355, 540, 725, 910];
const SceneDue: React.FC<{t: number}> = ({t}) => {
  const pin = outQuint((t - ST[9] + 0.15) / 0.4);
  const sIn = sp(t, ST[9] - 0.1, 13, 140);
  const tE = wt(9, 'every'), tG = wt(9, 'gives'), tD = wt(9, 'due');
  const tag = outQuint((t - wt(9, 'rightful') + 0.1) / 0.4);
  const SY = 690, S = 0.62;
  const [lx, ly] = panRim(CX, SY, S, 0, -1), [rx, ry] = panRim(CX, SY, S, 0, 1);
  return (
    <AbsoluteFill style={{opacity: pin}}>
      <Line1 y={410}><KType text="QISṬ" t={t} tin={ST[9] - 0.1} size={96} color={GOLDT} /></Line1>
      <Scale x={CX} y={SY} s={S} a={0} pop={sIn} glow={0.5} />
      {[lx, rx].map((px, j) => <div key={j} style={{position: 'absolute', left: px - 46, top: ly - 34, width: 92, height: 30, borderRadius: 15, opacity: clamp(sIn * 2),
        background: 'linear-gradient(180deg,#f8e4ad,#c8913a)', boxShadow: '0 0 14px rgba(241,208,138,.6)'}} />)}
      {PPL.map((x, j) => {
        const p = sp(t, tE - 0.2 + j * 0.08, 12, 160);
        const f = inOut((t - tG - j * 0.22) / 0.75);   // a coin flies from a pan to this person
        const land = f >= 1;
        const [sx, sy] = j < 2 ? [lx, ly - 30] : j > 2 ? [rx, ry - 30] : [CX, ly - 30];
        const cx_ = lerp(sx, x, f), cy_ = lerp(sy, 1140, f) - 160 * Math.sin(f * Math.PI);
        const ck = outQuint((t - Math.max(tD - 0.3, tG + j * 0.22 + 0.75)) / 0.3);
        const ring = sp(t, tG + j * 0.22 + 0.72, 10, 170);
        return <div key={j}>
          <Person x={x} y={1140} p={p} r={22} />
          {f > 0 && !land && <div style={{position: 'absolute', left: cx_ - 20, top: cy_ - 20, width: 40, height: 40, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #fff6dc, #e8bd68 55%, #a87a2c)', boxShadow: `0 0 0 3px ${GOLD}, 0 0 16px rgba(241,208,138,.8)`}} />}
          {ring > 0 && <div style={{position: 'absolute', left: x - 50, top: 1140 - 50, width: 100, height: 100, borderRadius: '50%', opacity: clamp(ring * 2),
            transform: `scale(${Math.min(1.08, 0.5 + 0.5 * ring)})`, boxShadow: `inset 0 0 0 4px ${GOLDL}, 0 0 24px rgba(241,208,138,.55)`}} />}
          <CheckMark x={x} y={1040} s={52} p={ck} />
        </div>;
      })}
      <Tag x={CX} y={1218} p={tag} c={GOLDL} size={28} w={900}>EVERY PERSON'S RIGHTFUL DUE</Tag>
    </AbsoluteFill>
  );
};

// ---------- scene D: someone close is wrong | an opponent is right ----------
const SceneAdmit: React.FC<{t: number}> = ({t}) => {
  const L = sp(t, ST[10] - 0.1, 12, 150), R = sp(t, wt(11, 'opponent') - 0.35, 12, 150);
  const div = outQuint((t - ST[10]) / 0.5);
  const mW = outQuint((t - wt(10, 'wrong') + 0.02) / 0.35), mR = outQuint((t - wt(11, 'right') + 0.02) / 0.35);
  return (
    <AbsoluteFill>
      <Line1 y={410}><KType text="ADMIT IT" t={t} tin={ST[10] - 0.05} size={92} color={GOLDT} /></Line1>
      <div style={{position: 'absolute', left: CX - 2, top: 620, width: 4, height: 640 * div, background: `linear-gradient(180deg, ${CREAM}00, ${CREAM}88, ${CREAM}00)`}} />
      <div style={{opacity: clamp(L * 2), transform: `scale(${Math.min(1.04, 0.8 + 0.2 * L)})`, transformOrigin: '290px 900px', position: 'absolute', left: 0, top: 0, width: W, height: H}}>
        <Tag x={290} y={640} p={1} c={CREAM} size={30} w={440}>SOMEONE CLOSE</Tag>
        <Icon name="home" x={290} y={850} size={250} p={clamp(L * 1.3)} sw={7} c={GOLDL} />
        <Dot x={290} y={900} r={26} />
        <Tag x={250} y={1080} p={mW} c={RED} size={46} w={300}>WRONG</Tag>
        <Mark kind="x" x={410} y={1108} size={64} p={mW} sw={10} />
      </div>
      <div style={{opacity: clamp(R * 2), transform: `scale(${Math.min(1.04, 0.8 + 0.2 * R)})`, transformOrigin: '790px 900px', position: 'absolute', left: 0, top: 0, width: W, height: H}}>
        <Tag x={790} y={640} p={1} c={SLATE} size={30} w={440}>AN OPPONENT</Tag>
        <Icon name="swords" x={790} y={830} size={170} p={clamp(R * 1.3)} sw={6} c={SLATE} glow={0} />
        <Dot x={790} y={960} r={26} warm={false} />
        <Tag x={760} y={1080} p={mR} c={GOLDL} size={46} w={300}>RIGHT</Tag>
        <CheckMark x={915} y={1108} s={70} p={mR} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene E: a witness for God, not for group prejudice ----------
const GRP = [[150, 1150], [215, 1190], [120, 1215], [190, 1250], [255, 1240]];
const SceneWitness: React.FC<{t: number}> = ({t}) => {
  const pin = outQuint((t - ST[12] + 0.15) / 0.4);
  const tN = wt(12, 'not'), tG = wt(12, 'group');
  const cut = outQuint((t - tN + 0.05) / 0.3);
  const a = t < tN ? -14 + 1.5 * Math.sin(t * 5) : swing(t, tN, -14, 0, 5, 2.6);
  const SY = 780, S = 0.72;
  const [lx, ly] = panRim(CX, SY, S, a, -1);
  const out = inQuint((t - ST[13] + 0.4) / 0.28);
  const rope = (1 - cut);
  const hand = sp(t, wt(12, 'witness') - 0.25, 12, 150);
  const st = outQuint((t - tG - 0.1) / 0.35), ok = outQuint((t - wt(12, 'god') - 0.1) / 0.4);
  return (
    <AbsoluteFill style={{opacity: pin * (1 - out)}}>
      <Line1 y={410}><KType text="FOR GOD" t={t} tin={wt(12, 'god') - 0.2} size={96} color={GOLDT} /></Line1>
      <CheckMark x={880} y={466} s={84} p={ok} />
      <Scale x={CX} y={SY} s={S} a={a} glow={0.5} />
      <Witness x={CX} y={SY - 170} p={hand} size={120} />
      <Tag x={CX + 125} y={SY - 190} p={hand} c={GOLDL} size={26} w={160}>YOU</Tag>
      {/* the rope from the left pan to the group, cut on "not" */}
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={`M ${lx} ${ly + 30} Q ${lx - 40} ${(ly + 1150) / 2 + 40} 200 1140`} stroke={SAND} strokeWidth={7} fill="none" strokeDasharray="14 9" opacity={rope} />
        {cut > 0 && <path d={`M ${lx} ${ly + 30} L ${lx - 10} ${ly + 30 + 120 * (1 - cut * 0.4)}`} stroke={SAND} strokeWidth={7} strokeDasharray="14 9" opacity={1 - cut} />}
      </svg>
      {cut > 0 && cut < 1 && <Mark kind="x" x={lx - 30} y={ly + 160} size={70} p={cut} sw={10} />}
      {GRP.map(([x, y], j) => <Dot key={j} x={x} y={y} r={14} warm={false} o={1 - 0.5 * cut} />)}
      <div style={{position: 'absolute', left: 290, top: 1180, width: 420, opacity: clamp(pin)}}>
        <StrikeIn p={st} sw={9}><span style={{fontFamily: F.cinzelB, fontSize: 30, letterSpacing: '0.1em', color: SLATE}}>GROUP PREJUDICE</span></StrikeIn>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene F: the hard part ----------
const SceneHard: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    <Line1 y={720}><KType text="THE HARD PART" t={t} tin={ST[13] - 0.05} tout={ST[14] - 0.45} size={96} color={GOLDT} tr={0.03} /></Line1>
  </AbsoluteFill>
);

// ---------- scene G: prejudice overlooks goodness → the scale becomes a lens of faults ----------
const CHIPS = [{x: 280, y: 760, icon: 'heart-handshake', label: 'HONEST'}, {x: 800, y: 760, icon: 'heart', label: 'KIND'}, {x: 540, y: 1130, icon: 'scale', label: 'FAIR'}];
const Lens: React.FC<{x: number; y: number; r: number; o: number; rot?: number; children?: React.ReactNode}> = ({x, y, r, o, rot = 0, children}) => o <= 0 ? null : (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: o}}>
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', filter: 'drop-shadow(0 16px 26px rgba(0,0,0,.55))'}}>
      <g transform={`rotate(${rot} ${x} ${y})`}>
        <rect x={x - 20} y={y + r + 6} width={40} height={150} rx={18} fill="url(#lensH)" stroke={GOLDL} strokeWidth={3} />
      </g>
      <defs><linearGradient id="lensH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7a5524" /><stop offset="0.5" stopColor="#c9a457" /><stop offset="1" stopColor="#6e4b1e" /></linearGradient>
        <radialGradient id="lensG" cx="0.4" cy="0.35"><stop offset="0" stopColor="rgba(190,210,240,.20)" /><stop offset="1" stopColor="rgba(60,80,120,.30)" /></radialGradient></defs>
    </svg>
    <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', overflow: 'hidden',
      boxShadow: `inset 0 0 0 14px ${GOLD}, inset 0 0 0 18px ${GOLDL}, inset 0 0 40px rgba(190,210,240,.25)`}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 2 * r, height: 2 * r, background: 'radial-gradient(circle at 38% 30%, rgba(255,255,255,.14), rgba(120,140,180,.10) 60%, rgba(20,30,50,.25))'}} />
      {children}
    </div>
  </div>
);
const ScenePrejudice: React.FC<{t: number}> = ({t}) => {
  const pin = outQuint((t - ST[14] + 0.15) / 0.4);
  const tO = wt(14, 'overlook'), tD = wt(15, 'differs');
  const eye = sp(t, ST[14] - 0.05, 12, 150), shut = t > tO - 0.05;
  const veil = inOut((t - tO + 0.05) / 0.7);
  const diff = outQuint((t - tD + 0.1) / 0.4);
  // line 16: the scale of justice, struck; line 17: it becomes a lens over THEM, faults magnified
  const sc = sp(t, ST[16] - 0.1, 13, 140), strike = outQuint((t - wt(16, 'justice') - 0.1) / 0.35);
  const toLens = inOut((t - ST[17] + 0.05) / 0.6), lens = sp(t, wt(17, 'lens') - 0.3, 12, 120);
  const faults = [0, 1, 2].map((j) => outQuint((t - wt(17, 'faults') + 0.1 - j * 0.16) / 0.3));
  const part1 = 1 - inQuint((t - ST[16] + 0.35) / 0.3);    // chips and eye leave for the scale
  const out = inQuint((t - ST[18] + 0.38) / 0.28);
  const lx = lerp(760, 540, clamp(lens)), ly = lerp(700, 900, clamp(lens));
  return (
    <AbsoluteFill style={{opacity: pin * (1 - out)}}>
      <div style={{opacity: part1}}>
        <Line1 y={410}><KType text="PREJUDICE" t={t} tin={ST[14] - 0.05} size={92} color={{color: RED}} /></Line1>
        {CHIPS.map((c, j) => {
          const p = sp(t, ST[14] + 0.25 + j * 0.2, 12, 160);
          return <div key={j} style={{position: 'absolute', left: c.x - 150, top: c.y - 60, width: 300, height: 120, opacity: clamp(p * 2) * (1 - 0.45 * veil), filter: `grayscale(${veil})`,
            transform: `scale(${Math.min(1.05, 0.7 + 0.3 * p)})`}}>
            <Glass x={0} y={0} w={300} h={120} o={1} active={0.7 * (1 - veil)} />
            <Icon name={c.icon} x={66} y={60} size={64} p={clamp(p)} sw={5} c={GOLDL} />
            <div style={{position: 'absolute', left: 110, top: 0, height: 120, display: 'flex', alignItems: 'center', fontFamily: F.cinzelB, fontSize: 36, letterSpacing: '0.06em', color: CREAM}}>{c.label}</div>
          </div>;
        })}
        {/* the veil of prejudice slides over the goodness */}
        <div style={{position: 'absolute', left: 0, top: 640, width: W, height: 640, opacity: 0.9, clipPath: `inset(0 ${(1 - veil) * 100}% 0 0)`,
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(5,9,18,.75), rgba(5,9,18,.55) 60%, rgba(5,9,18,0) 100%)'}} />
        <Person x={CX} y={930} p={pin} warm={false} r={30} label="THEM" lo={1 - diff} />
        <Tag x={CX} y={982} p={diff} c={SLATE} size={30} w={560}>DIFFERS FROM YOU</Tag>
        <Icon name={shut ? 'eye-off' : 'eye'} x={150} y={600} size={110} p={clamp(eye * 1.4)} sw={6} c={shut ? RED : GOLDL} glow={0} />
      </div>
      <div style={{opacity: 1 - part1}}>
        <div style={{opacity: 1 - toLens}}>
          <Line1 y={410}><StrikeIn p={strike} sw={11}><KType text="A SCALE OF JUSTICE" t={t} tin={wt(16, 'scale') - 0.3} size={70} color={GOLDT} tr={0.03} /></StrikeIn></Line1>
          <Scale x={CX} y={720} s={0.8} a={0} pop={sc} glow={0.45} o={1} />
          <Tag x={CX} y={1040} p={clamp(sc)} c={CREAM} size={34} w={400}>RELIGION</Tag>
        </div>
        <div style={{opacity: toLens}}>
          <Line1 y={410}><KType text="ONLY FAULTS" t={t} tin={wt(17, 'faults') - 0.25} size={92} color={{color: RED}} /></Line1>
          <Line1 y={410}><KType text="A LENS" t={t} tin={ST[17] + 0.05} tout={wt(17, 'faults') - 0.55} size={92} /></Line1>
          <Person x={540} y={900} p={1} warm={false} r={22} />
          <Lens x={lx} y={ly} r={250} o={clamp(lens * 2)} rot={-30}>
            <div style={{position: 'absolute', left: 250 - 45, top: 250 - 45, width: 90, height: 90, borderRadius: '50%', opacity: 0.9,
              background: 'radial-gradient(circle at 35% 35%, #fff, #c9d6ea 45%, #8aa0c4 100%)', boxShadow: '0 0 30px rgba(159,178,208,.7)'}} />
            {faults.map((p, j) => <Mark key={j} kind="x" x={[110, 390, 250][j]} y={[150, 170, 400][j]} size={96} p={p} sw={13} />)}
          </Lens>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene H: a scale that stays true, loved or disliked ----------
const SceneTrue: React.FC<{t: number}> = ({t}) => {
  const pin = outQuint((t - ST[18] + 0.15) / 0.4), sIn = sp(t, ST[18] - 0.1, 13, 140);
  const tL = wt(19, 'loved'), tD = wt(19, 'disliked');
  const dl = sp(t, tL - 0.3, 12, 150), dd = sp(t, tD - 0.3, 12, 150);
  const a = t < tL - 0.1 ? 0 : t < tD - 0.1 ? swing(t, tL - 0.1, -9, 0, 6, 3.2) : swing(t, tD - 0.1, 9, 0, 6, 3.2);
  const SY = 760, S = 0.85;
  const [lx, ly] = panRim(CX, SY, S, a, -1), [rx, ry] = panRim(CX, SY, S, a, 1);
  const ok = outQuint((t - wt(18, 'true') - 0.05) / 0.4);
  const out = inQuint((t - ST[20] + 0.38) / 0.28);
  return (
    <AbsoluteFill style={{opacity: pin * (1 - out)}}>
      <Line1 y={410}><KType text="STAYS TRUE" t={t} tin={wt(18, 'stays') - 0.25} size={96} color={GOLDT} /></Line1>
      <Scale x={CX} y={SY} s={S} a={a} pop={sIn} glow={0.35 + 0.4 * ok} />
      <Mark kind="check" x={CX} y={SY - 150} size={90} p={ok} sw={11} />
      <div style={{opacity: clamp(dl * 2), transform: `translateY(${(1 - Math.min(1, dl)) * -120}px)`}}>
        <Dot x={lx} y={ly - 30} r={26} />
        <Heart x={lx} y={ly - 96} s={34} glow={0.6} />
        <Tag x={lx} y={ly + 66} p={1} c={GOLDL} size={32} w={300}>LOVED</Tag>
      </div>
      <div style={{opacity: clamp(dd * 2), transform: `translateY(${(1 - Math.min(1, dd)) * -120}px)`}}>
        <Dot x={rx} y={ry - 30} r={26} warm={false} />
        <Tag x={rx} y={ry + 66} p={1} c={SLATE} size={32} w={300}>DISLIKED</Tag>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene I: callback to frame 1 ----------
const SceneCallback: React.FC<{t: number}> = ({t}) => {
  const enter = outQuint((t - ST[20] + 0.12) / 0.3);
  const tS = wt(20, 'stranger'), tM = wt(21, 'measure');
  const str = sp(t, tS - 0.3, 12, 150);
  const a = t < tS - 0.1 ? -13 : swing(t, tS - 0.1, -13, 0, 5, 2.6);
  const same = outQuint((t - tM + 0.1) / 0.4), ok = outQuint((t - wt(21, 'change') - 0.05) / 0.4);
  const [lx, ly] = panRim(HX, HY, HS, a, -1), [rx, ry] = panRim(HX, HY, HS, a, 1);
  return (
    <AbsoluteFill style={{opacity: enter, transform: `scale(${1.04 - 0.04 * enter})`, transformOrigin: `${CX}px 800px`}}>
      <div style={{opacity: 1 - inQuint((t - tM + 0.45) / 0.3)}}>
        <Line1 y={384}><span style={{fontFamily: F.cinzelB, fontSize: 84, letterSpacing: '0.06em', color: CREAM}}>YOUR PARENTS</span></Line1>
        <Line1 y={482}><KType text="OR A STRANGER" t={t} tin={tS - 0.45} size={78} color={{color: SLATE}} /></Line1>
      </div>
      <Line1 y={420}><KType text="SAME MEASURE" t={t} tin={tM - 0.12} size={92} color={GOLDT} /></Line1>
      <ArWord y={600} size={150} />
      <Line1 y={800}><span style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 50, color: CREAM}}>qisṭ · <span style={GOLDT}>justice</span></span></Line1>
      <Scale x={HX} y={HY} s={HS} a={a} glow={0.35 + 0.5 * ok} />
      <Dot x={lx - 38} y={ly - 24} r={18} /><Dot x={lx + 38} y={ly - 24} r={18} />
      <Tag x={lx} y={ly + 60} p={1} c={GOLDL} size={26} w={330}>YOUR PARENTS</Tag>
      <div style={{opacity: clamp(str * 2), transform: `translateY(${(1 - Math.min(1, str)) * -100}px)`}}>
        <Dot x={rx} y={ry - 24} r={20} warm={false} />
        <Tag x={rx} y={ry + 60} p={1} c={SLATE} size={26} w={330}>A STRANGER</Tag>
      </div>
    </AbsoluteFill>
  );
};
type Scn = {a: number; b: number; C: React.FC<{t: number}>; tin?: (t: number) => React.CSSProperties; tout?: (t: number) => React.CSSProperties};
const SceneLayer: React.FC<{s: Scn; t: number}> = ({s, t}) => {
  if (t < s.a || t >= s.b) return null;
  const a = s.tin ? s.tin(t) : {}, b = s.tout ? s.tout(t) : {};
  const style: React.CSSProperties = {...a, ...b, opacity: ((a.opacity as number) ?? 1) * ((b.opacity as number) ?? 1)};
  if (a.transform && b.transform) style.transform = `${a.transform} ${b.transform}`;
  const C = s.C;
  return <AbsoluteFill style={style}><C t={t} /></AbsoluteFill>;
};
const fadeOut = (t1: number, d = 0.2) => (t: number): React.CSSProperties => ({opacity: 1 - inQuint((t - t1 + d) / d)});
const fadeIn = (t0: number, d = 0.4) => (t: number): React.CSSProperties => {const p = outQuint((t - t0) / d); return {opacity: clamp(p * 1.5), transform: `scale(${0.97 + 0.03 * p})`};};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const te = t - VEND; if (te < -0.25) return null;
  const a = clamp((te + 0.25) / 0.35), q = k(t, VEND + 0.05, 0.8, outExpo), q2 = k(t, VEND + 0.35, 0.7, outExpo), q3 = k(t, LINES[23].start - 0.1, 0.6, outExpo);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <Background t={t} dim={0} />
      <Chrome t={t} bar={false} />
      <div style={{position: 'absolute', left: CX - 420, top: 340, width: 840, height: 840, borderRadius: '50%', opacity: q,
        background: 'radial-gradient(circle, rgba(241,208,138,.22) 0%, rgba(241,208,138,0) 62%)'}} />
      <Img src={staticFile('img/the-mirror.jpg')} style={{position: 'absolute', height: 580, left: '50%', top: 380, borderRadius: 4,
        transform: `translateX(-50%) translateY(${(1 - q) * 30}px)`, opacity: q, boxShadow: '0 30px 70px rgba(0,0,0,.7), 0 0 0 1px rgba(241,208,138,.35)'}} />
      <Reveal p={q2} style={{left: 0, top: 1000, width: W, textAlign: 'center'}}>
        <div style={{fontFamily: F.cinzelB, fontSize: 50, letterSpacing: '0.08em', ...goldText}}>ONE QUR'ANIC WORD A DAY</div>
      </Reveal>
      <Reveal p={q3} style={{left: 0, top: 1084, width: W, textAlign: 'center'}}>
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 54, color: CREAM}}>Follow so you don't miss tomorrow's.</div>
      </Reveal>
      <div style={{position: 'absolute', top: 1200, width: W, textAlign: 'center', fontFamily: F.plex, fontSize: 36, letterSpacing: 1, color: CREAM, opacity: 0.8 * q2}}>yasserfares.com</div>
    </AbsoluteFill>
  );
};

// ---------- scene schedule ----------
const SCN: Scn[] = [
  {a: -1, b: ST[5] + 0.05, C: SceneHook},
  {a: ST[5] - 0.15, b: ST[9] - 0.05, C: SceneVerse, tout: fadeOut(ST[9] - 0.05, 0.22)},
  {a: ST[9] - 0.2, b: ST[10] - 0.05, C: SceneDue, tout: fadeOut(ST[10] - 0.05)},
  {a: ST[10] - 0.2, b: ST[12] - 0.05, C: SceneAdmit, tin: fadeIn(ST[10] - 0.2), tout: fadeOut(ST[12] - 0.05)},
  {a: ST[12] - 0.2, b: ST[13] - 0.05, C: SceneWitness},
  {a: ST[13] - 0.15, b: ST[14] - 0.05, C: SceneHard},
  {a: ST[14] - 0.2, b: ST[18] - 0.05, C: ScenePrejudice},
  {a: ST[18] - 0.2, b: ST[20] - 0.05, C: SceneTrue},
  {a: ST[20] - 0.13, b: VEND - 0.22, C: SceneCallback, tout: fadeOut(VEND - 0.22, 0.2)},
];

const Frame: React.FC<{t: number; noEnd?: boolean}> = ({t, noEnd}) => {
  const dim = win(t, ST[13] - 0.4, ST[14] - 0.1, 0.6, 0.8);
  return (
    <AbsoluteFill>
      <Background t={t} dim={dim} />
      {t < VEND + 0.35 && <>
        {SCN.map((s, j) => <SceneLayer key={j} s={s} t={t} />)}
        <Card t={t} t0={ST[5] - 0.15} t1={ST[9] - 0.3} refTxt={'SURAH AL-NISA  ·  4:135'} ar={(EX as any)['4:135']} hl={[5]} fs={46} lh={84}
          hlT={[[10, wt(7, 'yourselves') - 0.05], [12, wt(8, 'parents') - 0.05], [13, wt(8, 'relatives') - 0.05]]}
          lines={['“O you who believe, stand firmly for justice', 'as witnesses for God, even if it is against', 'yourselves, your parents or your closest relatives.”']} />
        {LINES.map((_, i) => (i >= 1 && i <= 21 ? <Caption key={i} t={t} i={i} /> : null))}
        <Chrome t={t} />
      </>}
      {!noEnd && <EndCard t={t} />}
    </AbsoluteFill>
  );
};

export const Ep09: React.FC = () => {
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
