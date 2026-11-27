import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, continueRender, delayRender, spring} from 'remotion';
import TL from './timeline_ep10.json';
import EX from '../excerpts.json';
import {Icon, Mark, Strike, StrikeIn} from '../lib/icons';

// =====================================================================================
// One Word · 10 · ṣāliḥ — same design system as Ep04 (reference), Ep08 and Ep09 (kinetic type, drawn objects, solid arrows)
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
      ONE WORD &nbsp;·&nbsp; 10 &nbsp;·&nbsp; FROM THE MIRROR</div>
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
const KEY: Record<number, string> = {1: 'righteous?', 2: 'neighbour.', 3: 'ṣāliḥ.', 4: 'root:', 5: 'sound:', 6: 'life.', 7: 'safely.', 8: 'beneficial.',
  9: 'appearance.', 10: 'effect.', 11: 'God', 12: 'righteous', 13: 'root.', 14: 'fruit.', 15: 'hard', 16: 'pray', 17: 'harm', 18: 'fruit?', 19: 'proof.',
  20: 'sign', 21: 'safe', 22: 'Prayer', 23: 'honesty', 24: 'safe:', 25: 'ṣāliḥ.', 26: 'goodness', 27: 'work,', 28: 'below.'};
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
// Through-line: THE TREE (ṣāliḥ: faith is the root, righteous conduct is its fruit), with the PRAYER MAT + CLOCK and the NEIGHBOUR'S
// HOUSE from frame 1. The mat and the house open the episode, the tree carries the argument (roots / fruit / no fruit / fruit named),
// and the mat and the house come back joined by a gold arrow at the end (callback).
//  0 Hours of prayer,                    → frame 1 at full brightness: HOURS OF PRAYER, + صَالِح; a drawn prayer mat with a clock whose
//                                          hands spin (motion from frame 1, no branding first)
//  1 and still not righteous?            → NOT RIGHTEOUS? rises in gold under the headline; a red "?" stamps beside it
//  2 Ask your neighbour.                 → the mat and clock slide left; the neighbour's HOUSE draws on at the right, tag YOUR NEIGHBOUR
//  3 One word: ṣāliḥ.                    → headline, mat and house lift away: ONE WORD; the Arabic word swells to the centre, "ṣāliḥ · righteous"
//  4 Its root: ṣād, lām, ḥā,             → three glass tiles ص · ل · ح pop in on each spoken letter name
//  5 means sound: fit for its purpose.   → SOUND; a key travels into a lock, the lock opens ✓: FIT FOR ITS PURPOSE
//  6 Land is ṣāliḥah … produce life.     → three-panel list starts: LAND, a seedling grows out of the soil ✓ PRODUCES LIFE
//  7 Water is ṣāliḥ … used safely.       → panel 2: WATER, a drop falls into a glass that fills ✓ SAFE TO USE
//  8 A deed is ṣāliḥ … right, beneficial → panel 3: A DEED, a giving hand sends out ripples ✓ BENEFICIAL
//  9 So it's not merely appearance.      → split: APPEARANCE (an ornate empty frame with a sparkle) struck ✗
// 10 It's about the effect.              → THE EFFECT: ripples spreading from one point ✓
// 11–12 God says: 2:277 (verse window)   → card (ٱلصَّٰلِحَٰتِ turns gold on "righteous"); calm: under it a small tree draws on, roots on
//                                          "believe", branches and leaves on "righteous deeds"
// 13 Faith is the root.                  → the tree large; the roots glow: FAITH = ROOT
// 14 Righteous conduct is its fruit.     → gold fruit pop on the branches: CONDUCT = FRUIT
// 15 Here's the hard part.               → the light dims: THE HARD PART
// 16 A person may pray for a long time,  → the mat and clock again (hands spinning): PRAYS FOR HOURS
// 17 and still harm his neighbour.       → a red jagged bolt from the mat to the house, the house cracks ✗: HARMS HIS NEIGHBOUR
// 18 Roots, but no fruit?                → the tree again, roots glowing, branches bare; dashed empty circles where fruit should be
// 19 The claim has no visible proof.     → a magnifier sweeps the bare branches, finds nothing: NO VISIBLE PROOF ✗
// 20 One sign of righteousness:          → ONE SIGN; the house, large
// 21 your neighbour feels safe          → a shield with a heart pops over the door, a warm light at the door ✓ YOUR NEIGHBOUR FEELS SAFE
// 22 Prayer is a righteous deed.         → the tree in leaf: a fruit labelled PRAYER ✓
// 23 So is honesty at work.              → a second fruit HONESTY AT WORK ✓: RIGHTEOUS DEEDS
// 24 Hours of prayer, and a neighbour   → callback to frame 1: HOURS OF PRAYER + A SAFE NEIGHBOUR; mat and clock left, house with the shield
//    who feels safe:                       right, joined by a solid gold arrow
// 25 that is ṣāliḥ.                      → the Arabic word returns over the pair with ✓
// 26–28 end question                     → WHERE IS GOODNESS HARDER?; two choice cards AT WORK (colleagues) | NEXT DOOR (house), OR between;
//                                          TELL ME BELOW with a speech bubble and a down arrow
// 29–30 follow line                      → end card: the book, ONE QUR'ANIC WORD A DAY / Follow for tomorrow's.
// SILENT TEST: muted, the spinning clock over the mat and the house, the three ✓ panels (life, safe, benefit), the struck APPEARANCE vs
// ✓ EFFECT, the tree's glowing roots and its fruit, the bolt and crack, the bare tree under a magnifier, the shield over the door and the
// fruit named PRAYER and HONESTY AT WORK carry the argument. Each picture belongs to its own line.
// =====================================================================================

const SALIH = 'صَالِح';
const ArW: React.FC<{y: number; size: number; o?: number; zoom?: number; x?: number}> = ({y, size, o = 1, zoom = 0, x = 0}) => o <= 0 ? null : (
  <div style={{opacity: o}}>
    <Glow x={CX + x} y={y + size * 0.75} r={size * 1.4 + 60 * zoom} o={0.5 + 0.25 * zoom} />
    <div dir="rtl" lang="ar" style={{position: 'absolute', left: x, top: y, width: W, height: size * 1.5, textAlign: 'center', fontFamily: F.arw, fontSize: size, lineHeight: `${size * 1.5}px`,
      color: '#efc874', transform: `scale(${1 + 0.12 * zoom})`, transformOrigin: '50% 60%', textShadow: `0 10px 30px rgba(0,0,0,.55), 0 0 ${60 + 40 * zoom}px rgba(241,208,138,${0.35 + 0.25 * zoom})`}}>{SALIH}</div>
  </div>
);
const Translit: React.FC<{y: number; o?: number; size?: number}> = ({y, o = 1, size = 50}) => o <= 0 ? null :
  <Line1 y={y}><span style={{opacity: o, fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: size, color: CREAM}}>ṣāliḥ · <span style={GOLDT}>righteous</span></span></Line1>;

// ---------- drawings ----------
// prayer mat: rounded rug with a mihrab arch, inner border and fringe (drawn, not an icon)
const Mat: React.FC<{x: number; y: number; w?: number; h?: number; p?: number; o?: number; glow?: number}> = ({x, y, w = 230, h = 330, p = 1, o = 1, glow = 0.4}) => {
  if (o <= 0 || p <= 0) return null;
  const x0 = x - w / 2, y0 = y - h / 2, iw = w - 36, ix = x0 + 18, iy = y0 + 18, ih = h - 36;
  const arch = `M ${ix + 20} ${iy + ih * 0.62} V ${iy + ih * 0.3} Q ${ix + 20} ${iy + 14} ${x} ${iy + 10} Q ${ix + iw - 20} ${iy + 14} ${ix + iw - 20} ${iy + ih * 0.3} V ${iy + ih * 0.62}`;
  return <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: o * clamp(p * 1.5), filter: `drop-shadow(0 0 ${14 * glow}px rgba(241,208,138,${0.5 * glow})) drop-shadow(0 14px 22px rgba(0,0,0,.5))`}}>
    <defs><linearGradient id="matG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a3a5e" /><stop offset="1" stopColor="#16213a" /></linearGradient></defs>
    <rect x={x0} y={y0} width={w} height={h} rx={14} fill="url(#matG)" stroke={GOLDL} strokeWidth={5} />
    <rect x={ix} y={iy} width={iw} height={ih} rx={8} fill="none" stroke={GOLD} strokeWidth={3} opacity={0.9} />
    <Line d={arch} p={p} w={5} c={GOLDL} o={1} />
    <path d={`M ${x} ${iy + ih * 0.36} l 10 16 l -10 16 l -10 -16 Z`} fill={GOLDL} opacity={clamp(p * 2 - 1)} />
    {Array.from({length: 7}).map((_, j) => <line key={j} x1={ix + 16 + j * (iw - 32) / 6} y1={iy + ih * 0.78} x2={ix + 16 + j * (iw - 32) / 6 + 0.01} y2={iy + ih * 0.78}
      stroke={GOLD} strokeWidth={8} strokeLinecap="round" opacity={clamp(p * 2 - 1)} />)}
    {Array.from({length: 11}).map((_, j) => <line key={'f' + j} x1={x0 + 12 + j * (w - 24) / 10} y1={y0 + h} x2={x0 + 12 + j * (w - 24) / 10} y2={y0 + h + 16} stroke={GOLD} strokeWidth={3} strokeLinecap="round" />)}
  </svg>;
};
// clock whose hands spin: hours passing
const Clock: React.FC<{x: number; y: number; r: number; t: number; p?: number; speed?: number}> = ({x, y, r, t, p = 1, speed = 1}) => p <= 0 ? null : (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: clamp(p * 1.5), filter: 'drop-shadow(0 0 10px rgba(241,208,138,.35))'}}>
    <circle cx={x} cy={y} r={r} fill="rgba(13,23,42,.9)" stroke={GOLDL} strokeWidth={6} />
    {Array.from({length: 12}).map((_, j) => {const a = (j * Math.PI) / 6; const r1 = r * (j % 3 ? 0.82 : 0.74);
      return <line key={j} x1={x + Math.sin(a) * r1} y1={y - Math.cos(a) * r1} x2={x + Math.sin(a) * r * 0.9} y2={y - Math.cos(a) * r * 0.9} stroke={GOLD} strokeWidth={j % 3 ? 3 : 5} strokeLinecap="round" />;})}
    <line x1={x} y1={y} x2={x + Math.sin(t * 0.55 * speed) * r * 0.5} y2={y - Math.cos(t * 0.55 * speed) * r * 0.5} stroke={GOLDL} strokeWidth={8} strokeLinecap="round" />
    <line x1={x} y1={y} x2={x + Math.sin(t * 6.6 * speed) * r * 0.74} y2={y - Math.cos(t * 6.6 * speed) * r * 0.74} stroke={CREAM} strokeWidth={5} strokeLinecap="round" />
    <circle cx={x} cy={y} r={7} fill={GOLDL} />
  </svg>
);
// the neighbour's house (icon drawn large) with optional crack and shield
const House: React.FC<{x: number; y: number; size: number; p: number; crack?: number; shield?: number; light?: number; o?: number}> = ({x, y, size, p, crack = 0, shield = 0, light = 0, o = 1}) => p <= 0 || o <= 0 ? null : (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: o}}>
    <Glow x={x} y={y} r={size * 0.75} o={0.45 * clamp(p)} />
    <Icon name="home" x={x} y={y} size={size} p={clamp(p * 1.2)} sw={Math.max(6, size * 0.026)} c={GOLDL} />
    {light > 0 && <Dot x={x} y={y + size * 0.2} r={size * 0.06} o={light} />}
    {crack > 0 && <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <path d={`M ${x + size * 0.05} ${y - size * 0.28} L ${x - size * 0.06} ${y - size * 0.12} L ${x + size * 0.07} ${y + 0.0 * size} L ${x - size * 0.04} ${y + size * 0.14} L ${x + size * 0.05} ${y + size * 0.3}`}
        pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(crack)} stroke={RED} strokeWidth={8} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>}
    {shield > 0 && <div style={{transform: `scale(${Math.min(1.06, 0.5 + 0.5 * shield)})`, transformOrigin: `${x}px ${y - size * 0.62}px`, opacity: clamp(shield * 2), position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <Glow x={x} y={y - size * 0.62} r={size * 0.42} o={0.8} />
      <Icon name="shield-heart" x={x} y={y - size * 0.62} size={size * 0.42} p={1} sw={6} c={GOLDL} glow={0.8} />
    </div>}
  </div>
);
// the tree (through-line). Ground at (x, y); s scales it. Branches, leaves, fruit and roots draw separately.
const TB = ['M 0 -150 C -50 -175 -105 -195 -150 -245', 'M 0 -168 C 50 -195 110 -212 152 -262', 'M 0 -228 C -18 -265 -48 -298 -70 -332',
  'M 0 -228 C 24 -272 54 -300 82 -340', 'M -80 -190 C -95 -228 -92 -262 -100 -298', 'M 86 -205 C 104 -238 122 -268 116 -306'];
const TR = ['M 0 0 C -30 40 -90 62 -150 112', 'M 0 0 C 30 40 100 56 162 102', 'M 0 0 C -10 50 -30 100 -42 160', 'M 0 0 C 10 60 40 110 62 152',
  'M -90 64 C -112 92 -112 122 -124 152', 'M 102 58 C 122 86 132 112 128 142'];
const LEAF: [number, number, number][] = [[-150, -250, -40], [-128, -232, 20], [-104, -300, -20], [-84, -268, 40], [-70, -338, -10], [-44, -300, 30], [-20, -270, -30],
  [152, -268, 40], [130, -244, -20], [118, -310, 20], [96, -282, -40], [84, -346, 10], [50, -306, -30], [22, -278, 30], [0, -330, 0], [-30, -350, -30], [30, -360, 30], [0, -250, 10]];
const FRUIT: [number, number][] = [[-138, -222], [142, -238], [-60, -312], [70, -318], [0, -296]];
const Tree: React.FC<{x: number; y: number; s: number; trunk: number; roots: number; branch: number; leaves: number; fruit?: number[]; rootGlow?: number;
  slots?: number; o?: number; dimRoots?: number}> = ({x, y, s, trunk, roots, branch, leaves, fruit = [], rootGlow = 0, slots = 0, o = 1}) => {
  if (o <= 0) return null;
  return <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: o, overflow: 'visible', filter: 'drop-shadow(0 12px 20px rgba(0,0,0,.45))'}}>
    <defs>
      <radialGradient id="soilR" cx="0.5" cy="0.12" r="0.6"><stop offset="0" stopColor="#4a3824" stopOpacity={0.75} /><stop offset="0.6" stopColor="#3a2c1c" stopOpacity={0.35} /><stop offset="1" stopColor="#3a2c1c" stopOpacity={0} /></radialGradient>
      <radialGradient id="fruitG" cx="0.35" cy="0.3"><stop offset="0" stopColor="#fff2cc" /><stop offset="0.5" stopColor="#e8bd68" /><stop offset="1" stopColor="#a87a2c" /></radialGradient>
      <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9cf8a" /><stop offset="1" stopColor="#9c7a34" /></linearGradient>
    </defs>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={18} rx={280} ry={150} fill="url(#soilR)" opacity={clamp(trunk * 2 + roots * 2)} />
      <line x1={-230} y1={0} x2={230} y2={0} stroke={SAND} strokeWidth={3 / s} opacity={0.55 * clamp(trunk * 2 + roots * 2)} />
      {rootGlow > 0 && <ellipse cx={0} cy={80} rx={190} ry={95} fill="url(#haloW)" opacity={rootGlow} />}
      {TR.map((d, j) => <path key={j} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(roots * 1.4 - j * 0.08)} stroke={rootGlow > 0.3 ? GOLDL : GOLD}
        strokeWidth={(j < 4 ? 11 : 7) / Math.sqrt(s)} fill="none" strokeLinecap="round" />)}
      <path d="M 0 2 C -6 -80 6 -160 0 -236" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(trunk)} stroke="url(#leafG)" strokeWidth={30} fill="none" strokeLinecap="round" />
      <path d="M 0 2 C -6 -80 6 -160 0 -236" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(trunk)} stroke={GOLDL} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.6} />
      {TB.map((d, j) => <path key={j} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(branch * 1.5 - j * 0.1)} stroke={GOLDL}
        strokeWidth={j < 2 ? 12 : 9} fill="none" strokeLinecap="round" />)}
      {LEAF.map(([lx, ly, r], j) => {const p = clamp(leaves * 1.8 - j * 0.045); return p <= 0 ? null :
        <ellipse key={j} cx={lx} cy={ly} rx={24 * p} ry={12 * p} transform={`rotate(${r} ${lx} ${ly})`} fill="url(#leafG)" stroke={GOLDL} strokeWidth={1.5} opacity={0.88} />;})}
      {slots > 0 && FRUIT.map(([fx, fy], j) => <g key={'s' + j} opacity={slots}><circle cx={fx} cy={fy + 14} r={26} fill="rgba(13,23,42,.6)" stroke={CREAM} strokeWidth={4} strokeDasharray="8 7" opacity={0.85} />
        <text x={fx} y={fy + 27} textAnchor="middle" fontFamily="YFCinzelB" fontSize={34} fill={RED}>?</text></g>)}
      {fruit.map((p, j) => p <= 0 || j >= FRUIT.length ? null : <g key={'f' + j} transform={`translate(${FRUIT[j][0]} ${FRUIT[j][1] + 14}) scale(${Math.min(1.08, p)})`}>
        <circle r={36} fill="url(#haloW)" opacity={0.9} />
        <circle r={24} fill="url(#fruitG)" stroke={GOLDL} strokeWidth={2} />
        <path d="M 0 -24 C 2 -32 6 -36 10 -38" stroke={GOLDL} strokeWidth={3} fill="none" strokeLinecap="round" />
        <circle cx={-8} cy={-8} r={6} fill="#fff" opacity={0.6} />
      </g>)}
    </g>
  </svg>;
};
const Ripples: React.FC<{x: number; y: number; t: number; t0: number; r: number; o?: number}> = ({x, y, t, t0, r, o = 1}) => t < t0 || o <= 0 ? null : (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
    {[0, 1, 2].map((j) => {const u = ((t - t0) * 0.55 + j / 3) % 1; const fadeIn = clamp((t - t0 - j * 0.35) / 0.3);
      return <circle key={j} cx={x} cy={y} r={r * (0.15 + 0.85 * u)} fill="none" stroke={GOLDL} strokeWidth={5} opacity={fadeIn * (1 - u) * 0.9} />;})}
  </svg>
);
const Glass2 = Glass;

// ---------- scene A: hook (frame 1) → ask your neighbour → one word → root → sound / fit ----------
const SceneHook: React.FC<{t: number}> = ({t}) => {
  const tN = wt(2, 'neighbour');
  const slide = inOut((t - ST[2] + 0.15) / 0.55);              // mat moves left for the house
  const house = sp(t, ST[2] - 0.05, 13, 130);
  const out = quint((t - ST[3] + 0.5) / 0.3);                 // headline, mat, house leave for "one word"
  const z = inOut((t - ST[3] + 0.2) / 0.6);                     // the word moves to the centre and grows
  const tiles = [['ص', 'ṣād', wt(4, 'ṣād')], ['ل', 'lām', wt(4, 'lām')], ['ح', 'ḥā', wt(4, 'ḥā')]] as const;
  const tilesOut = inQuint((t - ST[5] + 0.3) / 0.28);
  const leave = inQuint((t - ST[6] + 0.4) / 0.3);
  // line 5: SOUND; key into lock; FIT FOR ITS PURPOSE
  const kIn = sp(t, ST[5] - 0.05, 14, 110), tF = wt(5, 'fit');
  const kx = lerp(200, 430, inOut((t - ST[5] - 0.2) / (tF - ST[5] + 0.1)));
  const open = t > tF + 0.15, ok = outQuint((t - tF - 0.15) / 0.4), lab = outQuint((t - tF + 0.05) / 0.4);
  const mx = lerp(CX, 320, slide);
  return (
    <AbsoluteFill style={{opacity: 1 - leave}}>
      <div style={{opacity: 1 - out, transform: `translateY(${-40 * out}px)`}}>
        <Line1 y={384}><span style={{fontFamily: F.cinzelB, fontSize: 82, letterSpacing: '0.06em', color: CREAM}}>HOURS OF PRAYER,</span></Line1>
        <Line1 y={482}><KType text="NOT RIGHTEOUS?" t={t} tin={ST[1] - 0.1} size={80} color={GOLDT} /></Line1>
        <Clock x={mx} y={852} r={64} t={t} />
        <Mat x={mx} y={1105} w={240} h={320} />
        <House x={790} y={1030} size={330} p={house} />
        <Tag x={790} y={1225} p={outQuint((t - tN + 0.25) / 0.4)} c={GOLDL} size={30} w={460}>YOUR NEIGHBOUR</Tag>
      </div>
      <Line1 y={420}><KType text="ONE WORD" t={t} tin={ST[3] - 0.24} tout={wt(5, 'sound') - 0.45} size={84} color={GOLDT} /></Line1>
      <Line1 y={420}><KType text="SOUND" t={t} tin={wt(5, 'sound') - 0.15} size={96} color={GOLDT} /></Line1>
      <ArW y={lerp(598, 560, z)} size={lerp(112, 150, z)} zoom={z} />
      <Translit y={790} o={outQuint((t - wt(3, 'ṣāliḥ') + 0.1) / 0.4)} />
      <div style={{opacity: 1 - tilesOut}}>
        {tiles.map(([c, n, tt], j) => {
          const p = sp(t, tt - 0.12, 12, 170);
          return p <= 0 ? null : <div key={j} style={{position: 'absolute', left: 810 - j * 270 - 80, top: 960, width: 160, height: 210, opacity: clamp(p * 2), transform: `scale(${Math.min(1.05, 0.7 + 0.3 * p)})`}}>
            <Glass x={0} y={0} w={160} h={210} o={1} active={0.6} />
            <div dir="rtl" lang="ar" style={{position: 'absolute', top: 6, width: 160, textAlign: 'center', fontFamily: F.ar, fontSize: 100, lineHeight: '136px', color: GOLDL}}>{c}</div>
            <div style={{position: 'absolute', top: 146, width: 160, textAlign: 'center', fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 40, color: CREAM}}>{n}</div>
          </div>;
        })}
      </div>
      {kIn > 0 && <div style={{opacity: clamp(kIn * 2)}}>
        <Glow x={650} y={1040} r={200} o={0.4 + 0.4 * ok} />
        <Icon name={open ? 'lock-open' : 'lock'} x={660} y={1030} size={270} p={clamp(kIn * 1.3)} sw={8} c={GOLDL} />
        {!open && <Icon name="key" x={kx - 20} y={1060} size={170} p={clamp(kIn * 1.3)} sw={7} c={CREAM} rot={45} glow={0} />}
        <CheckMark x={850} y={930} s={90} p={ok} />
        <Tag x={CX} y={1190} p={lab} c={GOLDL} size={32} w={900}>FIT FOR ITS PURPOSE</Tag>
      </div>}
    </AbsoluteFill>
  );
};

// ---------- scene B: land · water · deed (three-panel list) ----------
const PAN = [{x: 60, ln: 6, h: 'LAND', r: 'PRODUCES LIFE'}, {x: 390, ln: 7, h: 'WATER', r: 'SAFE TO USE'}, {x: 720, ln: 8, h: 'A DEED', r: 'BENEFICIAL'}];
const ScenePanels: React.FC<{t: number}> = ({t}) => {
  const top = outQuint((t - ST[6] + 0.2) / 0.4);
  const PY = 640, PH = 560;
  return (
    <AbsoluteFill>
      <ArW y={372} size={96} o={top} />
      {PAN.map((pn, j) => {
        const p = sp(t, ST[pn.ln] - 0.12, 13, 140);
        if (p <= 0) return null;
        const ck = outQuint((t - (pn.ln === 6 ? wt(6, 'life') : pn.ln === 7 ? wt(7, 'safely') : wt(8, 'beneficial')) + 0.05) / 0.35);
        const cx = pn.x + 150, cy = PY + 270;
        const g = clamp((t - ST[pn.ln] - 0.25) / 1.4);
        return <div key={j} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: clamp(p * 2), transform: `translateY(${(1 - Math.min(1, p)) * 30}px)`}}>
          <Glass x={pn.x} y={PY} w={300} h={PH} o={1} active={0.25 + 0.5 * ck} />
          <div style={{position: 'absolute', left: pn.x, top: PY + 28, width: 300, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 38, letterSpacing: '0.1em', color: CREAM}}>{pn.h}</div>
          {j === 0 && <>
            <div style={{position: 'absolute', left: pn.x + 30, top: cy + 110, width: 240, height: 46, borderRadius: 20, background: 'linear-gradient(180deg,#6b5132,#3a2c1c)', boxShadow: `inset 0 3px 0 ${SAND}88`}} />
            <Icon name="seedling" x={cx} y={cy + 110 - 95 * Math.min(1, outBack(g))} size={210 * (0.3 + 0.7 * outBack(g))} p={clamp(g * 1.6)} sw={7} c={GOLDL} />
          </>}
          {j === 1 && (() => {
            const fall = clamp((t - ST[7] - 0.2) / 0.7), fill = clamp((t - ST[7] - 0.85) / 1.2);
            return <>
              <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
                <path d={`M ${cx - 90} ${cy - 50} L ${cx - 66} ${cy + 150} Q ${cx} ${cy + 164} ${cx + 66} ${cy + 150} L ${cx + 90} ${cy - 50}`} fill="rgba(159,178,208,.10)" stroke={CREAM} strokeWidth={5} strokeLinejoin="round" />
                <clipPath id="glassClip"><path d={`M ${cx - 90} ${cy - 50} L ${cx - 66} ${cy + 150} Q ${cx} ${cy + 164} ${cx + 66} ${cy + 150} L ${cx + 90} ${cy - 50} Z`} /></clipPath>
                <rect x={cx - 100} y={cy + 155 - 170 * fill} width={160} height={170} fill="rgba(150,190,235,.45)" clipPath="url(#glassClip)" />
              </svg>
              {fall < 1 && fall > 0 && <Icon name="droplet" x={cx} y={lerp(cy - 190, cy + 30, inQuint(fall) * 0.3 + fall * 0.7)} size={90} p={1} sw={6} c="#bcd4f0" glow={0} />}
            </>;
          })()}
          {j === 2 && <>
            <Ripples x={cx} y={cy + 30} t={t} t0={wt(8, 'effect') - 0.2} r={150} />
            <Icon name="heart-handshake" x={cx} y={cy + 30} size={175} p={clamp(g * 1.6)} sw={7} c={GOLDL} />
          </>}
          <div style={{position: 'absolute', left: pn.x, top: PY + 432, width: 300, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 27, letterSpacing: '0.04em', color: GOLDL, opacity: ck}}>{pn.r}</div>
          <CheckMark x={cx} y={PY + 505} s={60} p={ck} />
        </div>;
      })}
    </AbsoluteFill>
  );
};

// ---------- scene C: appearance ✗ | the effect ✓ ----------
const SceneEffect: React.FC<{t: number}> = ({t}) => {
  const L = sp(t, ST[9] - 0.1, 13, 140), R = sp(t, ST[10] - 0.15, 13, 140);
  const xL = outQuint((t - wt(9, 'appearance') - 0.1) / 0.35), ok = outQuint((t - wt(10, 'effect') + 0.05) / 0.4);
  const div = outQuint((t - ST[10] + 0.1) / 0.5);
  return (
    <AbsoluteFill>
      <div style={{opacity: 1 - inQuint((t - ST[10] + 0.42) / 0.25)}}><Line1 y={410}><StrikeIn p={xL} sw={11}><KType text="APPEARANCE" t={t} tin={ST[9] - 0.05} size={84} color={{color: CREAM}} /></StrikeIn></Line1></div>
      <Line1 y={410}><KType text="THE EFFECT" t={t} tin={ST[10] - 0.12} size={96} color={GOLDT} /></Line1>
      <div style={{position: 'absolute', left: CX - 2, top: 640, width: 4, height: 600 * div, background: `linear-gradient(180deg, ${CREAM}00, ${CREAM}88, ${CREAM}00)`}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: clamp(L * 2) * (1 - 0.45 * clamp(R)), transform: `scale(${Math.min(1.04, 0.8 + 0.2 * L)})`, transformOrigin: '290px 930px'}}>
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, filter: 'drop-shadow(0 0 12px rgba(241,208,138,.4))'}}>
          <rect x={150} y={720} width={280} height={360} rx={10} fill="rgba(20,32,56,.6)" stroke={GOLDL} strokeWidth={9} />
          <rect x={172} y={742} width={236} height={316} rx={6} fill="none" stroke={GOLD} strokeWidth={3} />
          {[[150, 720], [430, 720], [150, 1080], [430, 1080]].map(([x, y], j) => <circle key={j} cx={x} cy={y} r={14} fill={GOLDL} />)}
        </svg>
        <Icon name="sparkles" x={290} y={900} size={120} p={clamp(L * 1.4)} sw={5} c={CREAM} glow={0.2} />
        <Tag x={290} y={1110} p={1} c={CREAM} size={30} w={420}>HOW IT LOOKS</Tag>
        <Mark kind="x" x={420} y={760} size={74} p={xL} sw={11} />
      </div>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: clamp(R * 2), transform: `scale(${Math.min(1.04, 0.8 + 0.2 * R)})`, transformOrigin: '790px 930px'}}>
        <Ripples x={790} y={900} t={t} t0={ST[10] - 0.1} r={200} />
        <Dot x={790} y={900} r={22} />
        <Tag x={790} y={1110} p={1} c={GOLDL} size={30} w={420}>WHAT IT DOES</Tag>
        <CheckMark x={930} y={760} s={80} p={ok} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene D: 2:277 (verse window: calm) → faith is the root, conduct is its fruit ----------
const SceneVerseTree: React.FC<{t: number}> = ({t}) => {
  const tB = wt(12, 'believe'), tR = wt(12, 'righteous');
  const big = inOut((t - ST[13] + 0.35) / 0.7);                // after the card leaves, the tree grows to the full zone
  const x = CX, y = lerp(1128, 1060, big), s = lerp(0.95, 1.22, big);
  const trunk = clamp((t - ST[12] - 0.1) / 1.0), roots = clamp((t - tB + 0.2) / 1.1);
  const branch = clamp((t - wt(12, 'do') + 0.1) / 1.0), leaves = clamp((t - tR) / 1.4);
  const rg = win(t, wt(13, 'root') - 0.25, ST[14] + 0.6, 0.35, 0.5);
  const fr = [0, 1, 2, 3, 4].map((j) => sp(t, wt(14, 'fruit') - 0.3 + j * 0.12, 11, 170));
  const lR = outQuint((t - wt(13, 'root') + 0.15) / 0.4), lF = outQuint((t - wt(14, 'fruit') + 0.05) / 0.4);
  return (
    <AbsoluteFill>
      <Line1 y={410}><KType text="FAITH" t={t} tin={ST[13] - 0.05} tout={ST[14] - 0.4} size={96} color={GOLDT} /></Line1>
      <Line1 y={410}><KType text="CONDUCT" t={t} tin={ST[14] - 0.1} size={96} color={GOLDT} /></Line1>
      <Tree x={x} y={y} s={s} trunk={trunk} roots={roots} branch={branch} leaves={leaves} fruit={fr} rootGlow={rg} />
      <div style={{position: 'absolute', left: 50, top: 1090, width: 300, opacity: lR * (1 - 0.5 * lF)}}>
        <div style={{fontFamily: F.cinzelB, fontSize: 38, letterSpacing: '0.12em', color: GOLDL, textAlign: 'left'}}>FAITH</div>
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 50, color: CREAM, textAlign: 'left'}}>the root</div>
      </div>
      <div style={{position: 'absolute', right: 50, top: 640, width: 300, opacity: lF, transform: `translateY(${(1 - lF) * 14}px)`}}>
        <div style={{fontFamily: F.cinzelB, fontSize: 38, letterSpacing: '0.12em', color: GOLDL, textAlign: 'right'}}>CONDUCT</div>
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 50, color: CREAM, textAlign: 'right'}}>the fruit</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene E: the hard part ----------
const SceneHard: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    <Line1 y={720}><KType text="THE HARD PART" t={t} tin={ST[15] - 0.05} tout={ST[16] - 0.45} size={96} color={GOLDT} tr={0.03} /></Line1>
  </AbsoluteFill>
);

// ---------- scene F: prays for hours, still harms his neighbour ----------
const SceneHarm: React.FC<{t: number}> = ({t}) => {
  const m = sp(t, ST[16] - 0.1, 13, 140), hs = sp(t, wt(17, 'harm') - 0.5, 13, 140);
  const tH = wt(17, 'harm');
  const bolt = clamp((t - tH + 0.12) / 0.35), crack = clamp((t - tH - 0.15) / 0.35), x1 = outQuint((t - wt(17, 'neighbour') + 0.05) / 0.35);
  const pts = [[425, 1040], [500, 985], [532, 1050], [600, 995], [650, 1045]];
  const dpath = 'M ' + pts.map((p) => p.join(' ')).join(' L ');
  return (
    <AbsoluteFill>
      <Line1 y={400}><KType text="PRAYS FOR HOURS" t={t} tin={ST[16] - 0.05} size={74} color={{color: CREAM}} /></Line1>
      <Line1 y={500}><KType text="HARMS HIS NEIGHBOUR" t={t} tin={ST[17] - 0.05} size={64} color={{color: RED}} /></Line1>
      <div style={{opacity: clamp(m * 2), transform: `scale(${Math.min(1.04, 0.85 + 0.15 * m)})`, transformOrigin: '300px 1000px', position: 'absolute', left: 0, top: 0, width: W, height: H}}>
        <Clock x={290} y={800} r={64} t={t} speed={1.3} />
        <Mat x={290} y={1065} w={240} h={320} />
      </div>
      <House x={810} y={1030} size={340} p={hs} crack={crack} />
      {bolt > 0 && <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, filter: 'drop-shadow(0 0 12px rgba(217,98,79,.6))'}}>
        <path d={dpath} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - bolt} stroke={RED} strokeWidth={11} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </svg>}
      <Mark kind="x" x={985} y={850} size={80} p={x1} sw={12} />
    </AbsoluteFill>
  );
};

// ---------- scene G: roots, but no fruit → no visible proof ----------
const SceneBare: React.FC<{t: number}> = ({t}) => {
  const p = sp(t, ST[18] - 0.15, 13, 140);
  const sl = outQuint((t - wt(18, 'fruit') + 0.1) / 0.4);
  const tP = wt(19, 'visible');
  const mg = inOut((t - ST[19] + 0.1) / 1.4), mo = win(t, ST[19] - 0.2, ST[20] - 0.2, 0.25, 0.25);
  const xP = outQuint((t - wt(19, 'proof') + 0.02) / 0.35);
  const mx = lerp(330, 760, mg), my = 760 - 60 * Math.sin(mg * Math.PI);
  return (
    <AbsoluteFill style={{opacity: clamp(p * 2)}}>
      <Line1 y={410}><KType text="NO FRUIT?" t={t} tin={ST[18] - 0.05} tout={tP - 0.5} size={96} color={GOLDT} /></Line1>
      <Line1 y={410}><KType text="NO VISIBLE PROOF" t={t} tin={tP - 0.2} size={74} color={{color: RED}} /></Line1>
      <Tree x={CX} y={1060} s={1.22} trunk={1} roots={1} branch={1} leaves={0} rootGlow={0.85} slots={sl} />
      {mo > 0 && <div style={{opacity: mo}}><Icon name="search" x={mx} y={my} size={190} p={1} sw={7} c={CREAM} glow={0.3} /></div>}
      <Mark kind="x" x={880} y={600} size={70} p={xP} sw={11} />
    </AbsoluteFill>
  );
};

// ---------- scene H: one sign: your neighbour feels safe ----------
const SceneSafe: React.FC<{t: number}> = ({t}) => {
  const h = sp(t, ST[20] - 0.1, 13, 140), sh = sp(t, wt(21, 'safe') - 0.3, 11, 160);
  const lt = outQuint((t - wt(21, 'neighbour') + 0.1) / 0.4), ok = outQuint((t - wt(21, 'around') - 0.05) / 0.4);
  return (
    <AbsoluteFill>
      <Line1 y={410}><KType text="ONE SIGN" t={t} tin={ST[20] - 0.05} size={96} color={GOLDT} /></Line1>
      <House x={CX} y={1030} size={400} p={h} shield={sh} light={lt} />
      <Tag x={CX} y={1225} p={ok} c={GOLDL} size={34} w={960}>YOUR NEIGHBOUR FEELS SAFE</Tag>
      <CheckMark x={820} y={1140} s={80} p={ok} />
    </AbsoluteFill>
  );
};

// ---------- scene I: the deeds are the fruit: prayer, honesty at work ----------
const SceneDeeds: React.FC<{t: number}> = ({t}) => {
  const p = sp(t, ST[22] - 0.15, 13, 140);
  const f1 = sp(t, wt(22, 'prayer') - 0.15, 11, 170), f2 = sp(t, wt(23, 'honesty') - 0.15, 11, 170);
  const c1 = outQuint((t - wt(22, 'deed') + 0.05) / 0.35), c2 = outQuint((t - wt(23, 'work') + 0.05) / 0.35);
  const S = 1.22, GX = CX, GY = 1060;
  const fp = (j: number) => [GX + FRUIT[j][0] * S, GY + (FRUIT[j][1] + 14) * S];
  const [ax, ay] = fp(0), [bx, by] = fp(1);
  return (
    <AbsoluteFill style={{opacity: clamp(p * 2)}}>
      <Line1 y={410}><KType text="RIGHTEOUS DEEDS" t={t} tin={ST[22] - 0.05} size={74} color={GOLDT} /></Line1>
      <Tree x={GX} y={GY} s={S} trunk={1} roots={1} branch={1} leaves={clamp(p)} fruit={[f1, f2]} rootGlow={0.35} />
      <div style={{position: 'absolute', left: 40, top: ay + 46, width: 360, opacity: clamp(f1 * 2)}}>
        <div style={{fontFamily: F.cinzelB, fontSize: 40, letterSpacing: '0.1em', color: GOLDL}}>PRAYER</div>
      </div>
      <CheckMark x={ax - 80} y={ay - 10} s={62} p={c1} />
      <div style={{position: 'absolute', right: 40, top: by + 46, width: 380, textAlign: 'right', opacity: clamp(f2 * 2)}}>
        <div style={{fontFamily: F.cinzelB, fontSize: 36, letterSpacing: '0.06em', color: GOLDL, lineHeight: 1.15}}>HONESTY<br />AT WORK</div>
      </div>
      <CheckMark x={bx + 80} y={by - 10} s={62} p={c2} />
    </AbsoluteFill>
  );
};

// ---------- scene J: callback to frame 1 ----------
const SceneCallback: React.FC<{t: number}> = ({t}) => {
  const enter = outQuint((t - ST[24] + 0.12) / 0.3);
  const arr = clamp((t - wt(24, 'neighbour') + 0.25) / 0.6);
  const sh = sp(t, wt(24, 'safe') - 0.25, 11, 160);
  const sw2 = quint((t - ST[25] + 0.45) / 0.25), wd = sp(t, ST[25] - 0.2, 12, 140), ok = outQuint((t - wt(25, 'ṣāliḥ') - 0.1) / 0.4);
  return (
    <AbsoluteFill style={{opacity: enter, transform: `scale(${1.04 - 0.04 * enter})`, transformOrigin: `${CX}px 800px`}}>
      <div style={{opacity: 1 - sw2, transform: `translateY(${-30 * sw2}px)`}}>
        <Line1 y={384}><span style={{fontFamily: F.cinzelB, fontSize: 82, letterSpacing: '0.06em', color: CREAM}}>HOURS OF PRAYER,</span></Line1>
        <Line1 y={482}><KType text="A SAFE NEIGHBOUR" t={t} tin={wt(24, 'neighbour') - 0.3} size={74} color={GOLDT} /></Line1>
      </div>
      {wd > 0 && <div style={{opacity: clamp(wd * 2), transform: `scale(${Math.min(1.05, 0.7 + 0.3 * wd)})`, transformOrigin: `${CX}px 480px`}}>
        <ArW y={370} size={132} zoom={0.5} />
      </div>}
      <CheckMark x={850} y={500} s={80} p={ok} />
      <Clock x={290} y={800} r={64} t={t} />
      <Mat x={290} y={1065} w={240} h={320} />
      <House x={810} y={1030} size={340} p={1} shield={sh} light={1} />
      <Arrow x0={430} y0={1010} cx={560} cy={880} x1={640} y1={1000} p={arr} w={11} />
    </AbsoluteFill>
  );
};

// ---------- scene K: the end question ----------
const SceneAsk: React.FC<{t: number}> = ({t}) => {
  const a = sp(t, ST[26] + 0.05, 12, 150), b = sp(t, ST[26] + 0.3, 12, 150);
  const ha = win(t, wt(27, 'work') - 0.15, wt(27, 'or') + 0.05, 0.15, 0.25), hb = win(t, wt(27, 'door') - 0.2, ST[28] + 0.1, 0.15, 0.25);
  const or = outQuint((t - wt(27, 'or') + 0.05) / 0.3);
  const tell = sp(t, ST[28] - 0.1, 12, 150);
  const Card2: React.FC<{x: number; p: number; icon: string; label: string; hi: number}> = ({x, p, icon, label, hi}) => p <= 0 ? null :
    <div style={{position: 'absolute', left: x, top: 660, width: 400, height: 430, opacity: clamp(p * 2), transform: `scale(${Math.min(1.04, 0.75 + 0.25 * p) + 0.05 * hi})`}}>
      <Glass x={0} y={0} w={400} h={430} o={1} active={0.3 + 0.7 * hi} />
      <Icon name={icon} x={200} y={185} size={210} p={clamp(p * 1.3)} sw={7} c={GOLDL} />
      <div style={{position: 'absolute', top: 340, width: 400, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 44, letterSpacing: '0.08em', color: CREAM}}>{label}</div>
    </div>;
  return (
    <AbsoluteFill>
      <Line1 y={384}><KType text="WHERE IS GOODNESS" t={t} tin={ST[26] - 0.08} size={62} color={{color: CREAM}} /></Line1>
      <Line1 y={470}><KType text="HARDER?" t={t} tin={wt(26, 'harder') - 0.15} size={104} color={GOLDT} /></Line1>
      <Card2 x={70} p={a} icon="users" label="AT WORK" hi={ha} />
      <Card2 x={610} p={b} icon="home" label="NEXT DOOR" hi={hb} />
      {or > 0 && <div style={{position: 'absolute', left: CX - 46, top: 830, width: 92, height: 92, borderRadius: '50%', opacity: or, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: NAVY, boxShadow: `inset 0 0 0 3px ${GOLD}`, fontFamily: F.cinzelB, fontSize: 32, color: GOLDL}}>OR</div>}
      {tell > 0 && <div style={{opacity: clamp(tell * 2)}}>
        <Icon name="message-circle" x={300} y={1180} size={86} p={clamp(tell * 1.3)} sw={6} c={GOLDL} />
        <div style={{position: 'absolute', left: 360, top: 1150, fontFamily: F.cinzelB, fontSize: 44, letterSpacing: '0.1em', ...GOLDT}}>TELL ME BELOW</div>
        <Icon name="arrow-down" x={890} y={1180 + 8 * Math.sin(t * 6)} size={70} p={1} sw={7} c={GOLDL} />
      </div>}
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
const fadeIn = (t0: number, d = 0.35) => (t: number): React.CSSProperties => {const p = outQuint((t - t0) / d); return {opacity: clamp(p * 1.5), transform: `scale(${0.97 + 0.03 * p})`};};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const te = t - VEND; if (te < -0.25) return null;
  const a = clamp((te + 0.25) / 0.35), q = k(t, VEND + 0.05, 0.8, outExpo), q2 = k(t, VEND + 0.35, 0.7, outExpo), q3 = k(t, LINES[30].start - 0.1, 0.6, outExpo);
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
        <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 56, color: CREAM}}>Follow for tomorrow's.</div>
      </Reveal>
      <div style={{position: 'absolute', top: 1200, width: W, textAlign: 'center', fontFamily: F.plex, fontSize: 36, letterSpacing: 1, color: CREAM, opacity: 0.8 * q2}}>yasserfares.com</div>
    </AbsoluteFill>
  );
};

// ---------- scene schedule ----------
const SCN: Scn[] = [
  {a: -1, b: ST[6] + 0.05, C: SceneHook},
  {a: ST[6] - 0.2, b: ST[9] - 0.05, C: ScenePanels, tout: fadeOut(ST[9] - 0.05, 0.22)},
  {a: ST[9] - 0.2, b: ST[11] - 0.05, C: SceneEffect, tin: fadeIn(ST[9] - 0.2), tout: fadeOut(ST[11] - 0.05)},
  {a: ST[11] + 0.1, b: ST[15] - 0.05, C: SceneVerseTree, tout: fadeOut(ST[15] - 0.05, 0.22)},
  {a: ST[15] - 0.15, b: ST[16] - 0.05, C: SceneHard},
  {a: ST[16] - 0.2, b: ST[18] - 0.05, C: SceneHarm, tout: fadeOut(ST[18] - 0.05)},
  {a: ST[18] - 0.2, b: ST[20] - 0.05, C: SceneBare, tout: fadeOut(ST[20] - 0.05)},
  {a: ST[20] - 0.2, b: ST[22] - 0.05, C: SceneSafe, tin: fadeIn(ST[20] - 0.2), tout: fadeOut(ST[22] - 0.05)},
  {a: ST[22] - 0.2, b: ST[24] - 0.05, C: SceneDeeds, tout: fadeOut(ST[24] - 0.05)},
  {a: ST[24] - 0.13, b: ST[26] - 0.05, C: SceneCallback, tout: fadeOut(ST[26] - 0.05)},
  {a: ST[26] - 0.2, b: VEND - 0.22, C: SceneAsk, tin: fadeIn(ST[26] - 0.2), tout: fadeOut(VEND - 0.22, 0.2)},
];

const Frame: React.FC<{t: number; noEnd?: boolean}> = ({t, noEnd}) => {
  const dim = win(t, ST[15] - 0.4, ST[16] - 0.1, 0.6, 0.8);
  return (
    <AbsoluteFill>
      <Background t={t} dim={dim} />
      {t < VEND + 0.35 && <>
        {SCN.map((s, j) => <SceneLayer key={j} s={s} t={t} />)}
        <Card t={t} t0={ST[11] - 0.15} t1={ST[13] - 0.35} refTxt={'SURAH AL-BAQARAH  ·  2:277'} ar={(EX as any)['2:277']} hl={[]} fs={58} lh={100}
          hlT={[[4, wt(12, 'righteous') - 0.05]]} lines={['“Surely, those who believe', 'and do righteous deeds…”']} />
        {LINES.map((_, i) => (i >= 1 && i <= 28 ? <Caption key={i} t={t} i={i} /> : null))}
        <Chrome t={t} />
      </>}
      {!noEnd && <EndCard t={t} />}
    </AbsoluteFill>
  );
};

export const Ep10: React.FC = () => {
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
