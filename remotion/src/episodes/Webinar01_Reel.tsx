import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, continueRender, delayRender, spring} from 'remotion';
import TL from './timeline_webinar01r.json';
import {Icon} from '../lib/icons';

// =====================================================================================
// Webinar 1 reel, v3 (9:16) · "What Did Khadijah Know?" · Saturday 9 January 2027, 9 PM Singapore time
// Same design system as the One Word reels (Ep07): crisp gold line art on navy, one focal drawing per scene, fixed zones:
//   chrome 230-330 · headline 380-690 · drawing 700-1260 · captions 1290-1490 · bar 1512
// Tone (Ahmed, 25 Nov): an educational, religious hour. We are glad to teach, not selling. So: no buttons, no pills, no
// "link in bio", no "register" line. The close is the teacher's invitation, the question, and the date in his own voice.
// No person is drawn: the story is told with a mountain, a path, a house and its lit doorway.
//
// STORYBOARD (line -> picture)
//  0 A man comes home from the cave of Hira, trembling -> frame 1: HE CAME HOME / TREMBLING. over a mountain and a house;
//                                                         a dotted path draws itself from the cave down to the door
//  1 the first words of revelation                     -> a quiet light opens at the cave
//  2 the first person to hear it is his wife, Khadijah -> the doorway of the house fills with warm light: FIRST TO HEAR
//  3 And she reassures him                             -> the headline changes to KHADIJAH / REASSURED HIM.
//  4 Her answer was not a guess                        -> HER ANSWER WAS / NOT A GUESS.
//  5 She had known him for years                       -> one long line of years draws across
//  6 in trade and in marriage                          -> two marks on that line: a scale (IN TRADE), two rings (IN MARRIAGE)
//  7 So what had she seen?                             -> the question alone, large, between two thin rules
//  8 Join me for one hour, live and free               -> an open book draws itself: ONE HOUR · LIVE · FREE
//  9 We will read the accounts together                -> lines of text fill the pages: WE READ THE ACCOUNTS / TOGETHER.
// 10 and follow this one question                      -> a question mark rises from the book
// 11 What did Khadijah know?                           -> the title
// 12-13 Saturday, the ninth of January. Nine p.m.      -> the date and the time, as he says them; then the address, quietly
// =====================================================================================

export const FPS = 30;
export const W = 1080, H = 1920;
type Word = [string, number, number];
const LINES: {text: string; words: Word[]; start: number; end: number}[] = (TL as any).lines;
const ST = LINES.map((l) => l.start);
const VEND: number = (TL as any).voice_end;
export const TOTAL_R: number = (TL as any).total;

const INK = '#070c17', NAVY = '#0d172a', GOLD = '#c9a457', GOLDL = '#f1d08a', CREAM = '#efe7d6', SLATE = '#9fb2d0';
const CX = 540;

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
      A FREE LIVE SESSION &nbsp;·&nbsp; SAT 9 JANUARY</div>
    {bar && <div style={{position: 'absolute', top: 1512, left: 160, width: W - 320, height: 2, background: 'rgba(201,164,87,.18)', borderRadius: 2}}>
      <div style={{width: `${clamp(t / VEND) * 100}%`, height: 2, background: GOLDL, borderRadius: 2}} /></div>}
  </AbsoluteFill>
);


// ---------- captions: balanced rows, words revealed as spoken ----------
const KEY: Record<number, string> = {0: 'trembling.', 1: 'revelation.', 2: 'Khadijah.', 3: 'reassures', 4: 'guess.', 5: 'years,', 6: 'marriage.', 7: 'seen?',
  8: 'hour,', 9: 'together,', 10: 'question:', 11: 'Khadijah', 12: 'January.', 13: 'Singapore'};
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


// ---------- small helpers ----------
const fade = (t: number, a: number, d = 0.4) => outQuint((t - a) / d);
const Label: React.FC<{x: number; y: number; w?: number; o: number; size?: number; c?: string; ls?: number; children: React.ReactNode}> = ({x, y, w = 520, o, size = 32, c = CREAM, ls = 0.2, children}) =>
  o <= 0 ? null : <div style={{position: 'absolute', left: x - w / 2, top: y + (1 - o) * 14, width: w, textAlign: 'center', fontFamily: F.cinzel, fontSize: size,
    letterSpacing: `${ls}em`, color: c, opacity: o, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,.6))'}}>{children}</div>;
const Halo: React.FC<{x: number; y: number; r: number; o: number}> = ({x, y, r, o}) => o <= 0 ? null :
  <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', opacity: o,
    background: 'radial-gradient(circle, rgba(241,208,138,.34) 0%, rgba(241,208,138,.10) 42%, rgba(241,208,138,0) 70%)'}} />;

// ---------- scene 1: the return (lines 0-3) ----------
const DOOR = 'M 824 1190 L 824 1118 Q 824 1086 852 1086 Q 880 1086 880 1118 L 880 1190';
const SceneReturn: React.FC<{t: number}> = ({t}) => {
  const path = inOut((t - wt(0, 'comes') + 0.1) / 1.9);
  const cave = fade(t, wt(1, 'first') - 0.1, 0.9), door = fade(t, wt(2, 'wife') - 0.15, 0.9), steady = fade(t, ST[3], 0.8);
  const breathe = 0.9 + 0.1 * Math.sin(t * 1.4);
  return (
    <AbsoluteFill>
      <Halo x={424} y={905} r={170} o={cave * 0.9 * breathe} />
      <Halo x={852} y={1140} r={150 + 60 * steady} o={door * (0.75 + 0.25 * steady) * breathe} />
      <Svg>
        <Line d="M 60 1190 L 1020 1190" p={1} w={2} o={0.35} />
        {/* the mountain */}
        <Line d="M 78 1190 L 258 884 L 304 938 L 374 762 L 482 988 L 524 944 L 660 1190" p={1} w={5} c={GOLDL} o={0.95} />
        <Line d="M 374 762 L 350 858 L 388 902 L 366 990" p={1} w={2.5} o={0.5} />
        <Line d="M 258 884 L 240 968 L 268 1010" p={1} w={2.5} o={0.4} />
        {/* the cave */}
        <path d="M 400 930 Q 400 884 424 884 Q 448 884 448 930 Z" fill={INK} opacity={0.9} />
        <path d="M 400 930 Q 400 884 424 884 Q 448 884 448 930 Z" fill="url(#goldF)" opacity={0.55 * cave} />
        <Line d="M 400 930 Q 400 884 424 884 Q 448 884 448 930" p={1} w={3.5} c={GOLDL} o={0.9} />
        {/* the path home */}
        <Line d="M 446 936 C 520 1010 548 1128 640 1156 S 780 1184 822 1186" p={path} w={4} c={CREAM} o={0.85} dash="2 16" />
        {/* the house */}
        <Line d="M 760 1190 L 760 1046 L 944 1046 L 944 1190" p={1} w={5} c={GOLDL} o={0.95} />
        <Line d="M 746 1046 L 958 1046" p={1} w={5} c={GOLDL} o={0.95} />
        <Line d="M 944 1190 L 944 1100 L 1004 1100 L 1004 1190" p={1} w={3} o={0.6} />
        <path d={DOOR + ' Z'} fill="url(#goldF)" opacity={door * 0.9} />
        <Line d={DOOR} p={1} w={4} c={GOLDL} o={0.95} />
        <rect x={784} y={1084} width={22} height={26} fill="url(#goldF)" opacity={0.25 + 0.6 * door} />
      </Svg>
      <Label x={368} y={1208} o={fade(t, -1)} size={32} c={CREAM} ls={0.16}>THE CAVE OF HIRA</Label>
      <Label x={852} y={1208} o={fade(t, wt(2, 'first') - 0.1)} size={32} c={GOLDL} w={400} ls={0.16}>FIRST TO HEAR</Label>
    </AbsoluteFill>
  );
};

// ---------- scene 2: years of knowing him (lines 4-6) ----------
const SceneYears: React.FC<{t: number}> = ({t}) => {
  const line = inOut((t - ST[5] + 0.1) / 1.4);
  const tT = wt(6, 'trade') - 0.1, tM = wt(6, 'marriage') - 0.1;
  const n1 = sp(t, tT), n2 = sp(t, tM);
  const X0 = 96, X1 = 984, Y = 1046;
  return (
    <AbsoluteFill>
      <Halo x={330} y={858} r={230} o={n1 * 0.55} />
      <Halo x={750} y={858} r={230} o={n2 * 0.55} />
      <Svg>
        <Line d={`M ${X0} ${Y} L ${X1} ${Y}`} p={line} w={5} c={GOLDL} o={0.95} />
        {line > 0.97 && <path d={`M ${X1 - 22} ${Y - 16} L ${X1 + 4} ${Y} L ${X1 - 22} ${Y + 16}`} stroke={GOLDL} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={fade(t, ST[5] + 1.25, 0.3)} />}
        {new Array(11).fill(0).map((_, j) => {const x = X0 + 44 + j * 80; const o = clamp((line * (X1 - X0) - (x - X0)) / 40);
          return <path key={j} d={`M ${x} ${Y - 12} L ${x} ${Y + 12}`} stroke={GOLD} strokeWidth={2.5} opacity={0.55 * o} />;})}
        {[[330, n1], [750, n2]].map(([x, n], j) => n <= 0 ? null : <g key={j}>
          <circle cx={x} cy={Y} r={18 * (n as number)} fill={INK} stroke={GOLDL} strokeWidth={5} />
          <circle cx={x} cy={Y} r={7 * (n as number)} fill={GOLDL} />
          <path d={`M ${x} ${Y - 28} L ${x} ${Y - 74}`} stroke={GOLD} strokeWidth={2.5} opacity={0.7 * (n as number)} strokeDasharray="3 9" strokeLinecap="round" />
        </g>)}
        {/* two rings for marriage */}
        {n2 > 0 && <g opacity={clamp(n2 * 1.5)}>
          <circle cx={712} cy={850} r={72} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - outQuint((t - tM) / 0.8)} stroke={GOLDL} strokeWidth={6} fill="none" strokeLinecap="round" />
          <circle cx={790} cy={850} r={72} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - outQuint((t - tM - 0.18) / 0.8)} stroke={GOLDL} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>}
      </Svg>
      <Icon name="scale" x={330} y={846} size={230} p={outQuint((t - tT) / 0.9)} sw={6} glow={0.3} />
      <Label x={330} y={1092} o={fade(t, tT + 0.1)} size={44} c={GOLDL} ls={0.14}>IN TRADE</Label>
      <Label x={750} y={1092} o={fade(t, tM + 0.1)} size={44} c={GOLDL} ls={0.14}>IN MARRIAGE</Label>
      <Label x={CX} y={1196} w={960} o={fade(t, wt(5, 'years') - 0.1) * 0.85} size={32}>YEARS OF KNOWING HIM</Label>
    </AbsoluteFill>
  );
};

// ---------- scene 3: the question (line 7) ----------
const SceneQuestion: React.FC<{t: number}> = ({t}) => {
  const a = wt(7, 'what') - 0.12, b = wt(7, 'she') - 0.12;
  const rule = inOut((t - ST[7]) / 0.9);
  const big: React.CSSProperties = {...goldText, paddingRight: 14};
  return (
    <AbsoluteFill>
      <Halo x={CX} y={965} r={470} o={fade(t, ST[7] - 0.1, 0.8) * 0.7} />
      <Svg>
        <Line d={`M ${CX - 250 * rule} 772 L ${CX + 250 * rule} 772`} p={rule > 0 ? 1 : 0} w={2.5} o={0.8} />
        <Line d={`M ${CX - 250 * rule} 1178 L ${CX + 250 * rule} 1178`} p={rule > 0 ? 1 : 0} w={2.5} o={0.8} />
      </Svg>
      {[['What had', a, 792], ['she seen?', b, 962]].map(([txt, t0, y], j) => {const p = outQuint((t - (t0 as number)) / 0.6);
        return <Reveal key={j} p={p} style={{left: 0, top: y as number, width: W, textAlign: 'center', paddingBottom: 30}}>
          <span style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 156, lineHeight: '176px', ...big, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.5))'}}>{txt}</span></Reveal>;})}
    </AbsoluteFill>
  );
};

// ---------- scene 4: the invitation (lines 8-10) ----------
const BOOK_L = 'M 540 900 C 474 868 366 866 262 896 L 262 1128 C 366 1098 474 1100 540 1132';
const BOOK_R = 'M 540 900 C 606 868 714 866 818 896 L 818 1128 C 714 1098 606 1100 540 1132';
const SceneBook: React.FC<{t: number}> = ({t}) => {
  const b = outQuint((t - ST[8] + 0.15) / 1.2), read = wt(9, 'read') - 0.1, q = outQuint((t - wt(10, 'question') + 0.3) / 0.7);
  return (
    <AbsoluteFill>
      <Halo x={CX} y={1010} r={500} o={b * 0.6} />
      <Svg><g transform="translate(540 1004) scale(1.24) translate(-540 -1010)">
        <Line d={BOOK_L} p={b} w={4.5} c={GOLDL} o={0.95} />
        <Line d={BOOK_R} p={b} w={4.5} c={GOLDL} o={0.95} />
        <Line d="M 540 900 L 540 1132" p={b} w={4} c={GOLDL} o={0.9} />
        <Line d="M 262 1128 C 366 1118 474 1124 540 1152 C 606 1124 714 1118 818 1128" p={outQuint((t - ST[8] - 0.2) / 1.1)} w={3} o={0.6} />
        {[0, 1, 2, 3].map((j) => {const y = 944 + j * 42; const p = outQuint((t - read - j * 0.16) / 0.7);
          return <g key={j}>
            <Line d={`M 304 ${y + 8} C 372 ${y - 12} 452 ${y - 12} 506 ${y + 8}`} p={p} w={3} c={CREAM} o={0.6} />
            <Line d={`M 574 ${y + 8} C 628 ${y - 12} 708 ${y - 12} 776 ${y + 8}`} p={outQuint((t - read - 0.3 - j * 0.16) / 0.7)} w={3} c={CREAM} o={0.6 * (1 - q)} />
          </g>;})}
      </g></Svg>
      {q > 0 && <div style={{position: 'absolute', left: 712 - 90, top: 912 + (1 - q) * 26, width: 180, textAlign: 'center', fontFamily: F.it, fontStyle: 'italic', fontWeight: 600,
        fontSize: 190, lineHeight: '200px', opacity: clamp(q * 1.3), ...goldText, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.5))'}}>?</div>}
    </AbsoluteFill>
  );
};

// ---------- scene 5: the title, the date in his voice, the address (lines 11-13 and the hold) ----------
const SceneTitle: React.FC<{t: number}> = ({t}) => {
  const rule = inOut((t - ST[11] - 0.5) / 0.9);
  const after = fade(t, VEND - 0.35, 0.7), after2 = fade(t, VEND - 0.05, 0.7);
  return (
    <AbsoluteFill>
      <Halo x={CX} y={760} r={520} o={fade(t, ST[11] - 0.2, 0.9) * 0.55} />
      <Line1 y={560}><KType text="WHAT DID" t={t} tin={ST[11] - 0.12} size={100} color={GOLDT} ls={0.05} tr={0.05} /></Line1>
      <Line1 y={690}><KType text="KHADIJAH KNOW?" t={t} tin={wt(11, 'khadijah') - 0.12} size={92} color={GOLDT} ls={0.03} tr={0.03} /></Line1>
      <Svg><Line d={`M ${CX - 130 * rule} 852 L ${CX + 130 * rule} 852`} p={rule > 0 ? 1 : 0} w={3} c={GOLDL} o={0.9} /></Svg>
      <Line1 y={900}><KType text="SATURDAY 9 JANUARY" t={t} tin={wt(12, 'saturday') - 0.12} size={62} ls={0.08} tr={0.05} /></Line1>
      <Line1 y={1004}><KType text="9:00 PM  ·  SINGAPORE TIME" t={t} tin={wt(13, 'nine') - 0.12} size={40} font={F.cinzel} color={{color: GOLDL}} ls={0.14} tr={0.05} gap={0.02} /></Line1>
      <div style={{position: 'absolute', top: 1118 + (1 - after) * 14, width: W, textAlign: 'center', fontFamily: F.plex, fontSize: 42, letterSpacing: 0.5, color: CREAM, opacity: after}}>yasserfares.com/khadijah</div>
      <Label x={CX} y={1196} w={1000} o={after2 * 0.75} size={25} ls={0.22}>ONE HOUR · ONLINE · NO BACKGROUND NEEDED</Label>
      <div style={{position: 'absolute', top: 1404, width: W, textAlign: 'center', fontFamily: F.plex, fontSize: 22, color: SLATE, opacity: 0.8 * after2}}>Narration: Yasser Fares (AI voice clone)</div>
    </AbsoluteFill>
  );
};

// ---------- headlines (zone 380-690) ----------
const Heads: React.FC<{t: number}> = ({t}) => {
  const o1 = ST[3] - 0.55;                       // "he came home trembling" leaves just before "And she reassures him"
  const pre1 = 1 - inQuint((t - o1) / 0.35);
  return <>
    {t < o1 + 0.5 && <>
      <Line1 y={404}><span style={{display: 'inline-block', fontFamily: F.cinzelB, fontSize: 76, letterSpacing: '0.12em', color: CREAM, opacity: pre1, transform: `translateY(${-36 * (1 - pre1)}px)`}}>HE CAME HOME</span></Line1>
      <Line1 y={500}><span style={{display: 'inline-block', fontFamily: F.cinzelB, fontSize: 124, letterSpacing: '0.04em', lineHeight: '150px', ...goldText, opacity: pre1, transform: `translateY(${-36 * (1 - pre1)}px)`}}>TREMBLING.</span></Line1>
    </>}
    {t > ST[3] - 0.3 && t < ST[4] + 0.2 && <>
      <Line1 y={404}><KType text="KHADIJAH" t={t} tin={ST[3] - 0.1} tout={ST[4] - 0.45} size={76} ls={0.12} /></Line1>
      <Line1 y={510}><KType text="REASSURED HIM." t={t} tin={wt(3, 'reassures') - 0.12} tout={ST[4] - 0.4} size={98} color={GOLDT} ls={0.03} tr={0.04} /></Line1>
    </>}
    {t > ST[4] - 0.3 && t < ST[7] + 0.2 && <>
      <Line1 y={404}><KType text="HER ANSWER WAS" t={t} tin={ST[4] - 0.1} tout={ST[7] - 0.5} size={70} ls={0.1} /></Line1>
      <Line1 y={504}><KType text="NOT A GUESS." t={t} tin={wt(4, 'not') - 0.12} tout={ST[7] - 0.45} size={112} color={GOLDT} ls={0.03} tr={0.04} /></Line1>
    </>}
    {t > ST[8] - 0.3 && t < ST[11] + 0.2 && <>
      <Line1 y={396}><KType text="ONE HOUR  ·  LIVE  ·  FREE" t={t} tin={wt(8, 'one') - 0.12} tout={ST[11] - 0.55} size={42} font={F.cinzel} ls={0.16} tr={0.06} gap={0.018} /></Line1>
      <Line1 y={476}><KType text="WE READ THE ACCOUNTS" t={t} tin={wt(9, 'read') - 0.15} tout={ST[11] - 0.5} size={62} color={GOLDT} ls={0.04} tr={0.04} gap={0.022} /></Line1>
      <Line1 y={562}><KType text="TOGETHER." t={t} tin={wt(9, 'together') - 0.12} tout={ST[11] - 0.45} size={104} color={GOLDT} ls={0.04} tr={0.04} /></Line1>
    </>}
  </>;
};

// ---------- schedule: every change is the same quiet cross-fade with a small settle ----------
type Scn = {a: number; b: number; C: React.FC<{t: number}>};
const SCN: Scn[] = [
  {a: -1, b: ST[4] - 0.1, C: SceneReturn},
  {a: ST[4] - 0.3, b: ST[7] - 0.1, C: SceneYears},
  {a: ST[7] - 0.3, b: ST[8] - 0.15, C: SceneQuestion},
  {a: ST[8] - 0.3, b: ST[11] - 0.15, C: SceneBook},
  {a: ST[11] - 0.3, b: 1e9, C: SceneTitle},
];
const SceneLayer: React.FC<{s: Scn; t: number; first?: boolean}> = ({s, t, first}) => {
  if (t < s.a || t >= s.b) return null;
  const pin = first ? 1 : outQuint((t - s.a) / 0.45), pout = inQuint((t - (s.b - 0.3)) / 0.3);
  const C = s.C;
  return <AbsoluteFill style={{opacity: clamp(pin * 1.3) * (1 - pout), transform: `scale(${0.97 + 0.03 * pin + 0.02 * pout})`, transformOrigin: `${CX}px 975px`}}><C t={t} /></AbsoluteFill>;
};
const Frame: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    <Background t={t} dim={0} />
    {SCN.map((s, j) => <SceneLayer key={j} s={s} t={t} first={j === 0} />)}
    <Heads t={t} />
    {LINES.map((_, i) => <Caption key={i} t={t} i={i} />)}
    <Chrome t={t} />
  </AbsoluteFill>
);

export const Web01R: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  // loop: the closing card dims, then frame 1 returns (no double exposure)
  const out = clamp((t - (TOTAL_R - 0.6)) / 0.28), back = clamp((t - (TOTAL_R - 0.32)) / 0.28);
  return (
    <AbsoluteFill style={{background: INK}}>
      <AbsoluteFill style={{opacity: 1 - out}}><Frame t={t} /></AbsoluteFill>
      {out > 0 && <AbsoluteFill style={{opacity: out}}><Background t={0} dim={0} /></AbsoluteFill>}
      {back > 0 && <AbsoluteFill style={{opacity: back}}><Frame t={0} /></AbsoluteFill>}
    </AbsoluteFill>
  );
};
