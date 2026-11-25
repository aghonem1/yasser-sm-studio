import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, continueRender, delayRender} from 'remotion';
import TLV from './timeline_webinar01v.json';
import EX from '../excerpts.json';
import {Icon} from '../lib/icons';

// =====================================================================================
// Webinar teaser, long landscape version · "What Did Khadijah Know?"  (composition web01v)
// Paper-collage explainer look, approved by Ahmed on 23 Nov 2026 for THIS format only
// (reels and carousels stay navy/gold). Kraft board, torn paper, cut-out letters, tape,
// marker lines that "boil", highlighter swipes, torn-paper wipes between scenes.
// Paper moves on twos (15 fps) for a stop-motion feel; the camera and marker lines are smooth.
// Narration: story-telling read, Yasser's HeyGen voice (episodes/webinar01v).
// Source: week 4 of the seerah course outline only. Khadijah's words are never quoted.
// No faces, no people, no depiction of the Prophet ﷺ: a dashed path stands for the walk home.
// =====================================================================================
export const FPS = 30;
const W = 1920, H = 1080;
type Word = [string, number, number];
type Ln = {text: string; words: Word[]; start: number; end: number};
const TL = TLV as unknown as {lines: Ln[]; voice_end: number; total: number};
export const TOTAL_V = TL.total;
const S = TL.lines.map((l) => l.start);
const norm = (s: string) => s.toLowerCase().replace(/[,.?'…“”:‘’]/g, '');
const wt = (i: number, w: string, nth = 1) => {let n = 0; for (const [x, s] of TL.lines[i].words) if (norm(x).startsWith(w) && ++n === nth) return s; return S[i];};

const NAVY = '#16233f', CREAM = '#f1e7d0', MUSTARD = '#e3b23c', TERRA = '#c4553b', SLATE = '#5c6674', TEAL = '#2e6b6e', INKK = '#17181c', WHITE = '#fbf7ee', RED = '#c93a2b', PARCH = '#f4ead2', NOTE = '#8f2a17';

const FONTS: [string, string][] = [['Anton', 'anton-latin-400-normal.woff2'], ['Caveat', 'caveat-latin-700-normal.woff2'], ['YFPlex', 'YF-Plex.ttf'], ['SpectralFull', 'Spectral-SemiBold-full.ttf'], ['AmiriQuran', 'AmiriQuran.ttf']];
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  Promise.all(FONTS.map(([fam, file]) => new FontFace(fam, `url(${staticFile('fonts/' + file)})`).load().then((ff) => (document as any).fonts.add(ff))))
    .then(() => continueRender(h)).catch((e) => {console.error(e); continueRender(h);});
}

// ---------- time ----------
const TC = React.createContext({t: 0, t2: 0, f: 0});
const useT = () => React.useContext(TC);
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const inOut = (x: number) => {x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;};
const outBack = (x: number) => {x = clamp(x); const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);};
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------- torn paper ----------
const rng = (seed: number) => {let s = (seed * 9301 + 49297) % 233280; return () => {s = (s * 9301 + 49297) % 233280; return s / 233280;};};
type P = [number, number];
const roughen = (pts: P[], seed: number, amp: number, step = 20): P[] => {
  const r = rng(seed); const out: P[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; const len = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.max(1, Math.round(len / step));
    const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
    for (let j = 0; j < n; j++) {const u = j / n, d = (j === 0 ? 0.3 : 1) * (r() - 0.5) * 2 * amp; out.push([x0 + (x1 - x0) * u + nx * d, y0 + (y1 - y0) * u + ny * d]);}
  }
  return out;
};
const grow = (pts: P[], d: number): P[] => {const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([x, y]) => {const l = Math.hypot(x - cx, y - cy) || 1; return [x + ((x - cx) / l) * d, y + ((y - cy) / l) * d];});};
const poly = (pts: P[]) => `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
const rect = (w: number, h: number): P[] => [[0, 0], [w, 0], [w, h], [0, h]];
const circ = (r: number, n = 26): P[] => Array.from({length: n}, (_, i) => [r + r * Math.cos((i / n) * 2 * Math.PI), r + r * Math.sin((i / n) * 2 * Math.PI)] as P);

type Dir = 'up' | 'down' | 'left' | 'right';
type Anim = {at?: number; out?: number; dir?: Dir; dist?: number; lift_out?: boolean; soft?: boolean};
// paper pieces drop in on twos with a little overshoot, and fall away when they leave
const useEnter = ({at, out, dir = 'up', dist = 170, lift_out, soft}: Anim) => {
  const {t2: tq, t} = useT(); const t2 = soft ? t : tq;
  if (at !== undefined && t2 < at) return null;
  const p = at === undefined ? 1 : soft ? outCubic((t2 - at) / 0.85) : outBack((t2 - at) / 0.42), q = out === undefined ? 0 : clamp((t2 - out) / 0.3), qe = q * q;
  if (q >= 1) return null;
  const v = dir === 'up' ? [0, -1] : dir === 'down' ? [0, 1] : dir === 'left' ? [-1, 0] : [1, 0];
  return {dx: v[0] * dist * (1 - p), dy: v[1] * dist * (1 - p) + (lift_out ? -70 : 300) * qe, rot: (1 - p) * (soft ? 2 : 7) * (v[0] || v[1]) + (lift_out ? 0 : qe * 12), sc: 1 + 0.09 * (1 - p),
    o: (at === undefined ? 1 : soft ? clamp((t2 - at) / 0.4) : clamp((t2 - at) / 0.07 + 0.5)) * (1 - qe), lift: 1 + 1.8 * (1 - p)};
};
type PaperP = Anim & {x: number; y: number; w: number; h: number; c: string; pts?: P[]; rot?: number; seed?: number; amp?: number; core?: number; lift?: number; children?: React.ReactNode};
const Paper: React.FC<PaperP> = ({x, y, w, h, c, pts, rot = 0, seed = 1, amp = 4, core = 5, lift = 1, children, ...an}) => {
  const e = useEnter(an); if (!e) return null;
  const base = pts ?? rect(w, h), L = lift * e.lift;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: e.o, transform: `translate(${e.dx}px, ${e.dy}px) rotate(${rot + e.rot}deg) scale(${e.sc})`,
      filter: `drop-shadow(${3 * L}px ${7 * L}px ${6 * L}px rgba(40,24,6,.42))`}}>
      {core > 0 && <div style={{position: 'absolute', left: -20, top: -20, width: w + 40, height: h + 40, clipPath: poly(roughen(grow(base, core), seed + 7, amp * 1.3).map(([a, b]) => [a + 20, b + 20])), background: WHITE}} />}
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, clipPath: poly(roughen(base, seed, amp)), background: c}}>
        <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${staticFile('tex/grain.png')})`, mixBlendMode: 'multiply', opacity: 0.55}} />
        {children}
      </div>
    </div>
  );
};
const isDark = (c: string) => c === NAVY || c === INKK || c === SLATE || c === TEAL || c === TERRA;
// cut-out letters, one tile each, popping in one after another
const Cut: React.FC<Anim & {text: string; x: number; y: number; size: number; tiles: string[]; seed?: number; gap?: number; stagger?: number; shake?: [number, number]}> =
  ({text, x, y, size, tiles, seed = 3, gap = 6, stagger = 0.05, shake, at, out, dir = 'up', dist = 70, soft}) => {
    const {t2, f} = useT();
    const r = rng(seed); let cx = 0; const tw = (ch: string) => size * (ch === 'I' || ch === '.' || ch === '?' || ch === ' ' || ch === '’' || ch === '‘' ? 0.42 : ch === 'M' || ch === 'W' ? 0.82 : 0.62);
    const total = text.split('').reduce((s, ch) => s + tw(ch) + gap, -gap);
    const sk = shake && t2 >= shake[0] && t2 < shake[1] ? (shake[1] - t2) / (shake[1] - shake[0]) : 0;
    return <div style={{position: 'absolute', left: x - total / 2, top: y}}>{text.split('').map((ch, i) => {
      const w = tw(ch), left = cx; cx += w + gap; if (ch === ' ') return null;
      const rot = (r() - 0.5) * 7, dy = (r() - 0.5) * size * 0.07, c = tiles[Math.floor(r() * tiles.length) % tiles.length];
      const j = rng(seed * 31 + i * 7 + Math.floor(f / 2)); const jx = sk ? (j() - 0.5) * 16 * sk : 0, jy = sk ? (j() - 0.5) * 12 * sk : 0, jr = sk ? (j() - 0.5) * 9 * sk : 0;
      return <Paper key={i} x={left + jx} y={dy + jy} w={w} h={size * 1.16} c={c} rot={rot + jr} seed={seed + i * 3} amp={2.2} core={3} lift={0.7}
        at={at === undefined ? undefined : at + i * stagger} out={out} dir={dir} dist={dist} soft={soft}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton', fontSize: size, lineHeight: 1, color: isDark(c) ? CREAM : NAVY, paddingTop: size * 0.04}}>{ch}</div></Paper>;
    })}</div>;
  };
// masking tape with a handwritten label; it unrolls from the left
const Tape: React.FC<{x: number; y: number; w: number; rot?: number; size?: number; seed?: number; at?: number; out?: number; children: React.ReactNode}> = ({x, y, w, rot = -2, size = 44, seed = 2, at, out, children}) => {
  const {t2, t} = useT(); if (at !== undefined && t2 < at) return null;
  const p = at === undefined ? 1 : outCubic((t - at) / 0.28), q = out === undefined ? 0 : clamp((t2 - out) / 0.25); if (q >= 1) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: size * 1.5, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(1px 3px 3px rgba(40,24,6,.3))', opacity: 1 - q,
      clipPath: `inset(-10px ${(1 - p) * 100}% -10px -10px)`}}>
      <div style={{position: 'absolute', inset: 0, clipPath: poly(roughen(rect(w, size * 1.5), seed, 2.5, 9)), background: 'rgba(247,239,214,.92)'}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Caveat', fontSize: size, color: NAVY, whiteSpace: 'nowrap'}}>{children}</div>
    </div>
  );
};
const Strip: React.FC<Anim & {x: number; y: number; w: number; h?: number; c?: string; ink?: string; size?: number; rot?: number; seed?: number; font?: string; ls?: number; children: React.ReactNode}> =
  ({x, y, w, h = 84, c = NAVY, ink = CREAM, size = 46, rot = 0, seed = 4, font = 'Anton', ls = 2, children, ...an}) => (
    <Paper x={x} y={y} w={w} h={h} c={c} rot={rot} seed={seed} amp={3.5} {...an}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: size * 0.3, fontFamily: font, fontSize: size, letterSpacing: ls, color: ink, whiteSpace: 'nowrap'}}>{children}</div></Paper>
  );
// highlighter: a mustard swipe behind a word
const Hi: React.FC<{at?: number; children: React.ReactNode}> = ({at, children}) => {
  const {t} = useT(); const p = at === undefined ? 1 : outCubic((t - at) / 0.3);
  return <span style={{backgroundImage: `linear-gradient(${MUSTARD}, ${MUSTARD})`, backgroundRepeat: 'no-repeat', backgroundSize: `${p * 100}% 100%`, color: p > 0.4 ? INKK : 'inherit', padding: '0 12px', borderRadius: 3,
    transform: 'rotate(-1deg)', display: 'inline-block'}}>{children}</span>;
};
// handwriting that writes itself left to right
const Note: React.FC<{x: number; y: number; size?: number; rot?: number; c?: string; w?: number; at?: number; out?: number; dur?: number; align?: 'left' | 'center'; children: React.ReactNode}> =
  ({x, y, size = 54, rot = -3, c = NAVY, w = 600, at, out, dur = 0.55, align = 'left', children}) => {
    const {t} = useT(); if (at !== undefined && t < at) return null;
    const p = at === undefined ? 1 : clamp((t - at) / dur), q = out === undefined ? 0 : clamp((t - out) / 0.25); if (q >= 1) return null;
    return <div style={{position: 'absolute', left: x, top: y, width: w, fontFamily: 'Caveat', fontSize: size, lineHeight: 1.05, color: c, textAlign: align, transform: `rotate(${rot}deg)`, transformOrigin: 'left top',
      clipPath: `inset(-20px ${(1 - p) * 100}% -20px -20px)`, opacity: 1 - q}}>{children}</div>;
  };
// marker lines: drawn on, and they "boil" a little like hand-drawn animation
const Marks: React.FC<{children: React.ReactNode; id: string}> = ({children, id}) => {
  const {f} = useT();
  return <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <defs><filter id={`boil-${id}`} x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed={Math.floor(f / 4) % 9} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" /></filter></defs>
    <g filter={`url(#boil-${id})`}>{children}</g></svg>;
};
const Mk: React.FC<{d: string; c?: string; w?: number; at?: number; dur?: number; out?: number}> = ({d, c = NAVY, w = 7, at, dur = 0.35, out}) => {
  const {t} = useT(); if (at !== undefined && t < at) return null;
  const p = at === undefined ? 1 : clamp((t - at) / dur), q = out === undefined ? 0 : clamp((t - out) / 0.25); if (q >= 1) return null;
  return <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.92 * (1 - q)} />;
};
// a dotted path revealed along its length (prog 0..1 supplied by the scene)
const Dots: React.FC<{d: string; id: string; prog: number; c?: string; w?: number}> = ({d, id, prog, c = NAVY, w = 8}) => prog <= 0 ? null : <>
  <mask id={`m-${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}><path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(prog)} stroke="#fff" strokeWidth={w + 14} fill="none" strokeLinecap="round" /></mask>
  <path d={d} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeDasharray="3 26" mask={`url(#m-${id})`} opacity={0.92} /></>;
const Ico: React.FC<{name: string; x: number; y: number; size: number; at?: number; c?: string; sw?: number}> = ({name, x, y, size, at, c = NAVY, sw = 5}) => {
  const {t} = useT(); return <Icon name={name} x={x} y={y} size={size} p={at === undefined ? 1 : clamp((t - at) / 0.7)} c={c} sw={sw} glow={0} />;
};
const Big: React.FC<{y: number; size: number; c?: string; ls?: number; children: React.ReactNode}> = ({y, size, c = NAVY, ls = 3, children}) =>
  <div style={{position: 'absolute', left: 0, top: y, width: '100%', textAlign: 'center', fontFamily: 'Anton', fontSize: size, lineHeight: 1.04, color: c, letterSpacing: ls}}>{children}</div>;
const Hand: React.FC<{y: number; size: number; c?: string; children: React.ReactNode}> = ({y, size, c = NAVY, children}) =>
  <div style={{position: 'absolute', left: 0, top: y, width: '100%', textAlign: 'center', fontFamily: 'Caveat', fontSize: size, lineHeight: 1, color: c}}>{children}</div>;

// ---------- reusable cut-paper pictures ----------
const Mountain: React.FC<{x: number; y: number; at?: number; out?: number; soft?: boolean}> = ({x, y, at, out, soft}) => {
  const a = (d: number) => (at === undefined ? undefined : at + d);
  return <>
    <Paper x={x} y={y} w={620} h={400} c={SLATE} pts={[[20, 400], [290, 30], [600, 400]]} seed={31} amp={6} rot={-1} at={a(0)} out={out} dir="down" soft={soft} />
    <Paper x={x + 240} y={y + 100} w={470} h={300} c="#7d8794" pts={[[10, 300], [220, 20], [460, 300]]} seed={33} amp={6} rot={1.5} lift={0.8} at={a(0.16)} out={out} dir="down" soft={soft} />
    <Paper x={x + 210} y={y + 236} w={150} h={164} c={INKK} pts={[[10, 164], [14, 70], [40, 22], [76, 6], [112, 22], [138, 70], [142, 164]]} seed={35} amp={2.5} core={3} lift={0.4} at={a(0.34)} out={out} dir="down" dist={60} soft={soft} />
  </>;
};
const House: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => <>
  <Paper x={x} y={y + 40} w={360} h={280} c={CREAM} seed={41} amp={4} rot={1} at={at} dir="right" />
  <Paper x={x - 26} y={y} w={412} h={62} c="#b99b6b" seed={43} amp={3.5} rot={-0.6} lift={0.7} at={at + 0.14} dir="up" />
  <Paper x={x + 130} y={y + 156} w={96} h={166} c={NAVY} pts={[[4, 166], [4, 46], [48, 4], [92, 46], [92, 166]]} seed={45} amp={2} core={3} lift={0.4} at={at + 0.26} dir="down" dist={50} />
  <Paper x={x + 270} y={y + 108} w={56} h={64} c={MUSTARD} seed={47} amp={1.6} core={2} lift={0.3} at={at + 0.36} dir="up" dist={40} />
</>;
const Eye: React.FC<Anim & {x: number; y: number; s?: number; seed?: number}> = ({x, y, s = 1, seed = 91, ...an}) => {
  const A: P[] = [[0, 150], [90, 60], [220, 10], [320, 0], [420, 10], [550, 60], [640, 150], [550, 240], [420, 290], [320, 300], [220, 290], [90, 240]];
  const k = (p: P[]) => p.map(([a, b]) => [a * s, b * s] as P); const d = (dd: number) => (an.at === undefined ? undefined : an.at + dd);
  return <>
    <Paper x={x} y={y} w={640 * s} h={300 * s} c={CREAM} pts={k(A)} seed={seed} amp={3 * s + 1} core={4} {...an} />
    <Paper x={x + 200 * s} y={y + 30 * s} w={240 * s} h={240 * s} c={NAVY} pts={circ(120 * s)} seed={seed + 2} amp={2} core={0} lift={0.4} {...an} at={d(0.12)} dist={50} />
    <Paper x={x + 268 * s} y={y + 98 * s} w={104 * s} h={104 * s} c={MUSTARD} pts={circ(52 * s, 18)} seed={seed + 4} amp={1.5} core={0} lift={0.3} {...an} at={d(0.22)} dist={30} />
  </>;
};

// ---------- scenes ----------
const cam = (t: number, keys: [number, number, number, number][]) => {
  let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)], p = b[0] === a[0] ? 0 : inOut((t - a[0]) / (b[0] - a[0]));
  return {s: mix(a[1], b[1], p), x: mix(a[2], b[2], p), y: mix(a[3], b[3], p)};
};
// A · the walk home (lines 0–6)
const PATH = 'M 452 652 C 600 400, 1010 400, 1236 706';
const A_: React.FC = () => {
  const {t} = useT();
  const walk = mix(0, 0.42, clamp((t - (S[2] + 0.5)) / 1.6)) + 0.58 * inOut((t - (S[5] + 0.05)) / 1.1);
  return <>
    <Hand y={196} size={84} c={NOTE}><Note x={610} y={0} w={700} size={84} c={NOTE} rot={-3} at={0.5} out={S[1] - 0.2} align="center">come closer...</Note></Hand>
    <Cut text="AN OLD STORY" x={960} y={330} size={190} tiles={[CREAM, MUSTARD, CREAM, WHITE]} seed={6} gap={10} out={S[1] - 0.2} />
    <Mountain x={150} y={440} at={S[1] + 0.05} />
    <Tape x={250} y={852} w={330} rot={-3} seed={13} at={wt(2, 'cave') - 0.1}>the cave of Hira</Tape>
    <Cut text="TREMBLING." x={600} y={270} size={128} tiles={[MUSTARD, MUSTARD, CREAM, MUSTARD, TERRA]} seed={9} gap={8} at={wt(3, 'trembling') - 0.08} stagger={0.04} />
    <Strip x={700} y={452} w={470} h={74} c={CREAM} ink={NAVY} size={34} rot={3} seed={25} ls={1} at={wt(4, 'first') - 0.1} dir="right" out={S[5] + 0.1}>THE FIRST WORDS OF REVELATION</Strip>
    <House x={1270} y={520} at={S[5] - 0.05} />
    <Tape x={1380} y={852} w={170} rot={2.5} seed={15} at={S[5] + 0.6}>home</Tape>
    <Marks id="a">
      <Dots d={PATH} id="walk" prog={walk} />
      <Mk d="M 1196 664 L 1240 708 L 1178 720" w={8} at={S[5] + 1.1} dur={0.2} />
      {[[400, 640, 372, 606], [436, 628, 436, 590], [472, 640, 500, 606], [384, 668, 344, 656], [488, 668, 528, 656]].map(([x0, y0, x1, y1], i) =>
        <Mk key={i} d={`M ${x0} ${y0} L ${x1} ${y1}`} c={MUSTARD} w={8} at={S[4] + 0.15 + i * 0.14} dur={0.5} />)}
      <Mk d="M 1500 474 C 1492 490, 1486 500, 1478 514" c={NOTE} w={6} at={wt(6, 'his') - 0.1} dur={0.2} />
      <Mk d="M 1458 488 L 1476 518 L 1504 500" c={NOTE} w={6} at={wt(6, 'his') + 0.1} dur={0.15} />
    </Marks>
    <Note x={1250} y={410} size={56} c={NOTE} rot={-3} w={600} at={wt(6, 'first') - 0.1} dur={0.9}>the first to hear: his wife</Note>
  </>;
};
// B · her name (lines 7–8)
const B_: React.FC = () => <>
  <Tape x={1290} y={196} w={230} rot={4} seed={17} at={S[7] + 0.05}>his wife</Tape>
  <Cut text="KHADIJAH" x={960} y={260} size={250} tiles={[MUSTARD, MUSTARD, NAVY, MUSTARD]} seed={83} gap={12} at={wt(7, 'khadijah') - 0.25} />
  <Strip x={470} y={650} w={860} h={112} c={CREAM} ink={NAVY} size={62} rot={-1.2} seed={27} at={S[8] - 0.05} dir="left">AND SHE <Hi at={wt(8, 'reassures')}>REASSURES</Hi> HIM</Strip>
</>;
// C1 · not a guess (lines 9–10)
const C1_: React.FC = () => <>
  <Note x={470} y={150} size={92} c={NAVY} rot={-3} w={1000} at={S[9]} dur={0.7}>now... how could she be</Note>
  <Cut text="SO SURE?" x={960} y={280} size={250} tiles={[CREAM, WHITE, TERRA, CREAM]} seed={52} gap={12} at={wt(9, 'so') - 0.08} />
  <Tape x={470} y={590} w={250} rot={-5} seed={19} at={wt(10, 'her') - 0.05}>her answer</Tape>
  <Paper x={720} y={650} w={560} h={200} c={CREAM} rot={2} seed={54} amp={5} at={wt(10, 'answer') - 0.05} dir="down"><Big y={22} size={140}>A GUESS</Big></Paper>
  <Marks id="c1">
    <Mk d="M 690 768 C 880 744, 1100 760, 1310 736" c={RED} w={16} at={wt(10, 'not') - 0.05} dur={0.35} />
  </Marks>
</>;
// C2 · years of knowing him (lines 11–13)
const C2_: React.FC = () => {
  const {t} = useT(); const rb = outCubic((t - (wt(11, 'for') - 0.2)) / 0.9);
  return <>
    <Strip x={470} y={84} w={980} h={104} size={60} seed={56} rot={-0.8} at={S[11] - 0.05}>SHE HAD KNOWN HIM FOR <Hi at={wt(11, 'years')}>YEARS</Hi></Strip>
    <div style={{position: 'absolute', left: 150, top: 262, width: 1620, height: 66, clipPath: `inset(-20px ${(1 - rb) * 100}% -20px -20px)`}}>
      <Paper x={0} y={0} w={1620} h={66} c={CREAM} seed={58} amp={3} rot={-0.3} /></div>
    <Marks id="c2">
      {Array.from({length: 13}, (_, i) => <Mk key={i} d={`M ${230 + i * 122} ${276 + (i % 2) * 2} L ${232 + i * 122} ${314}`} w={5} at={wt(11, 'for') + 0.1 + i * 0.05} dur={0.1} />)}
      <Mk d="M 560 332 C 556 356, 566 380, 560 404" w={6} at={S[12] + 0.3} dur={0.2} />
      <Mk d="M 1360 332 C 1366 356, 1354 380, 1360 404" w={6} at={S[13] + 0.2} dur={0.2} />
    </Marks>
    <Paper x={290} y={420} w={540} h={440} c={MUSTARD} rot={-2} seed={60} amp={6} lift={1.3} at={S[12] + 0.05} dir="left">
      <Ico name="scale" x={270} y={150} size={210} at={S[12] + 0.3} sw={6} />
      <Big y={262} size={84}>IN TRADE</Big><Hand y={366} size={54}><Note x={40} y={0} w={460} size={54} rot={-2} align="center" at={wt(12, 'trusted') - 0.2}>the one she trusted</Note></Hand></Paper>
    <Paper x={1090} y={420} w={540} h={440} c={TERRA} rot={2} seed={62} amp={6} lift={1.3} at={S[13] + 0.05} dir="right">
      <Ico name="hearts" x={270} y={150} size={210} at={S[13] + 0.25} c={CREAM} sw={6} />
      <Big y={262} size={84} c={CREAM}>IN MARRIAGE</Big><Hand y={366} size={54} c={CREAM}><Note x={40} y={0} w={460} size={54} c={CREAM} rot={-2} align="center" at={S[13] + 0.45} dur={0.45}>her husband</Note></Hand></Paper>
  </>;
};
// D · the question (lines 14–15)
const D_: React.FC = () => <>
  <Note x={420} y={110} size={72} c={NOTE} rot={-2.5} w={1200} at={S[14] + 0.1} dur={1.6}>the question at the heart of this story</Note>
  <Eye x={640} y={250} at={wt(14, 'question') - 0.1} dir="up" />
  <Cut text="WHAT HAD SHE SEEN?" x={960} y={640} size={132} tiles={[CREAM, WHITE, MUSTARD, CREAM]} seed={64} gap={7} at={S[15] - 0.08} stagger={0.04} />
  <Marks id="d"><Mk d="M 380 830 C 700 846, 1200 816, 1540 838" c={TERRA} w={10} at={wt(15, 'seen')} dur={0.45} /></Marks>
</>;
// E · the Black Stone (lines 16–21)
const CLANS: [number, number, string, number, Dir][] = [[250, 250, TERRA, -5, 'left'], [230, 640, TEAL, 4, 'left'], [1390, 236, SLATE, 3, 'right'], [1430, 740, '#8a6d2f', -3, 'right']];
const E_: React.FC = () => {
  const o1 = S[17] - 0.3, calm = S[20] - 0.05;
  const eyes: [number, number, number, string][] = [[130, 250, 0.5, 'she'], [1440, 230, 0.5, 'not'], [200, 640, 0.5, 'only'], [1400, 650, 0.5, 'one'], [800, 180, 0.5, 'watching']];
  return <>
    {eyes.map(([x, y, s, w], i) => <Eye key={i} x={x} y={y} s={s} seed={93 + i * 6} at={i === 0 ? S[16] + 0.36 : Math.max(S[16] + 0.42, wt(16, w) - 0.08)} out={o1} dir={i % 2 ? 'right' : 'left'} dist={90} />)}
    <Strip x={520} y={470} w={880} h={110} size={62} seed={66} rot={-1} at={wt(16, 'only') + 0.1} out={o1} dir="down">NOT THE <Hi at={wt(16, 'only') + 0.4}>ONLY ONE</Hi> WATCHING</Strip>
    <Tape x={150} y={110} w={330} rot={-3} seed={21} at={S[17]} out={S[18] - 0.1}>before any of this...</Tape>
    <Strip x={510} y={64} w={900} h={104} size={62} seed={51} rot={-0.8} at={wt(17, 'quraysh') - 0.1}>QURAYSH REBUILD THE KA‘BAH</Strip>
    <Paper x={800} y={300} w={320} h={400} c={INKK} seed={53} amp={4} rot={-0.6} lift={1.4} at={wt(17, 'rebuilt') - 0.05} dir="up" dist={260} />
    <Paper x={792} y={372} w={336} h={44} c={MUSTARD} seed={55} amp={2.5} core={2} rot={-0.6} lift={0.4} at={wt(17, 'rebuilt') + 0.3} dir="left" dist={80} />
    {CLANS.map(([x, y, c, rot, dir], i) => <Paper key={i} x={x} y={y} w={250} h={110} c={c} rot={rot} seed={61 + i * 2} amp={4} at={S[18] + i * 0.12} dir={dir}>
      <Big y={18} size={58} c={CREAM} ls={4}>CLAN</Big></Paper>)}
    <Paper x={1082} y={606} w={64} h={64} c="#2b2c31" pts={circ(32, 18)} seed={57} amp={1} core={4} lift={0.5} at={wt(19, 'black') - 0.25} dir="up" dist={40} />
    <Marks id="e">
      <Mk d="M 380 380 l 14 40 l -22 34 l 26 38 l -20 36 l 22 40 l -16 34" c={RED} w={8} at={wt(18, 'dispute') - 0.1} dur={0.4} out={calm} />
      <Mk d="M 1610 366 l -16 44 l 24 40 l -26 44 l 22 40 l -20 46 l 18 44 l -14 40" c={RED} w={8} at={wt(18, 'dispute') + 0.05} dur={0.4} out={calm} />
      <Mk d="M 520 300 l 46 -16 l 40 22 l 44 -22 l 42 20 l 46 -20 l 40 18" c={RED} w={8} at={wt(18, 'dispute') + 0.2} dur={0.4} out={calm} />
      <Mk d="M 520 720 l 44 18 l 42 -22 l 44 22 l 40 -20 l 46 20" c={RED} w={8} at={wt(18, 'dispute') + 0.35} dur={0.4} out={calm} />
      <Mk d="M 1056 596 C 1040 640, 1080 700, 1136 690 C 1190 678, 1186 596, 1120 584 C 1090 580, 1066 588, 1052 606" c={RED} w={6} at={wt(19, 'black')} dur={0.45} out={calm} />
      <Mk d="M 1186 634 C 1230 610, 1250 580, 1270 548" c={RED} w={6} at={S[19] + 0.1} dur={0.25} out={calm} />
      <Mk d="M 1234 556 L 1272 544 L 1280 584" c={RED} w={6} at={S[19] + 0.3} dur={0.15} out={calm} />
      <Mk d="M 1196 330 L 1240 384 L 1330 268" c={TEAL} w={18} at={wt(20, 'accepted')} dur={0.4} />
      {[[500, 330, 1070, 622], [480, 690, 1066, 650], [1390, 320, 1150, 618], [1430, 770, 1156, 656]].map(([x0, y0, x1, y1], i) =>
        <Mk key={i} d={`M ${x0} ${y0} L ${x1} ${y1}`} c={MUSTARD} w={9} at={wt(21, 'every') - 0.05 + i * 0.1} dur={0.5} />)}
    </Marks>
    <Note x={1180} y={410} size={58} c={RED} rot={-5} w={420} at={S[19] + 0.15} dur={0.8} out={calm}>who places<br />the Black Stone?</Note>
    <Strip x={1190} y={420} w={600} h={90} c={CREAM} ink={NAVY} size={44} seed={68} rot={1.2} at={S[20] + 0.15} dir="right">THEY <Hi at={wt(20, 'accepted') + 0.2}>ACCEPTED</Hi> HIS JUDGEMENT</Strip>
    <Strip x={1200} y={536} w={600} h={90} c={MUSTARD} ink={NAVY} size={42} seed={70} rot={-1.4} at={wt(21, 'shared') - 0.15} dir="right">EVERY CLAN SHARED THE HONOUR</Strip>
  </>;
};
// F · Hira, step by step (lines 22–27)
const STEPS: [number, string, string, string, string, string, number][] = [
  [110, MUSTARD, 'moon', 'TRUTHFUL', 'DREAMS', NAVY, -2], [550, SLATE, 'mountain', 'A', 'RETREAT', CREAM, 1.5], [990, CREAM, 'book', 'SURAT', 'AL-‘ALAQ', NAVY, -1.5], [1430, TEAL, 'home', 'THE RETURN', 'HOME', CREAM, 2]];
const F_: React.FC = () => {
  const {t} = useT();
  const o1 = S[24] - 0.5, at = [S[24] + 0.05, S[25] + 0.05, S[26] + 0.05, wt(27, 'return') - 0.3];
  const v0 = wt(26, 'opening') - 0.05, v1 = wt(27, 'then') + 0.3;   // the verse sheet is on screen from v0 until v1 + 0.3
  const ar = ((EX as any)['96:1'] as string).split(' ');
  return <>
    <Mountain x={650} y={470} at={S[22] + 0.32} out={o1} soft />
    <Cut text="HIRA" x={960} y={170} size={230} tiles={[CREAM, MUSTARD, CREAM]} seed={72} gap={12} at={wt(22, 'hira') - 0.1} out={o1} stagger={0.12} soft />
    <Strip x={440} y={52} w={1040} h={96} size={56} seed={74} rot={0.6} at={S[23] - 0.02} soft>‘A’ISHAH TELLS IT, <Hi at={wt(23, 'step')}>STEP BY STEP</Hi></Strip>
    {STEPS.map(([x, c, ic, l1, l2, ink, rot], i) => <Paper key={i} x={x} y={250} w={380} h={540} c={c} rot={rot} seed={76 + i * 2} amp={6} lift={1.3} at={at[i] - 0.15} dir="up" dist={120} soft>
      <div style={{position: 'absolute', left: 24, top: 14, fontFamily: 'Anton', fontSize: 74, color: ink, opacity: 0.9}}>{i + 1}</div>
      <Ico name={ic} x={190} y={200} size={200} at={at[i] + 0.25} c={ink} sw={6} />
      <Big y={330} size={l1.length > 8 ? 62 : 72} c={ink}>{l1}</Big><Big y={410} size={l2.length > 7 ? 62 : 72} c={ink}>{l2}</Big></Paper>)}
    <Marks id="f">{[0, 1, 2].map((i) => <React.Fragment key={i}>
      <Mk d={`M ${STEPS[i][0] + 392} 520 C ${STEPS[i][0] + 410} 510, ${STEPS[i][0] + 424} 510, ${STEPS[i][0] + 440} 520`} w={7} at={at[i + 1] - 0.3} dur={0.2} />
      <Mk d={`M ${STEPS[i][0] + 424} 500 L ${STEPS[i][0] + 444} 520 L ${STEPS[i][0] + 422} 538`} w={7} at={at[i + 1] - 0.12} dur={0.12} /></React.Fragment>)}</Marks>
    <Tape x={1030} y={742} w={300} rot={-3} size={40} seed={23} at={v1 + 0.2}>the opening words</Tape>
    {/* the verse itself, on its own sheet; the music stops while it is on screen */}
    <Paper x={410} y={286} w={1100} h={390} c={PARCH} rot={-0.8} seed={78} amp={5} lift={2} at={v0} out={v1} lift_out dir="up" dist={300}>
      <div style={{position: 'absolute', left: 0, top: 44, width: '100%', textAlign: 'center', fontFamily: 'Anton', fontSize: 34, letterSpacing: 5, color: '#8c6629'}}>SURAH AL-‘ALAQ · 96:1</div>
      <div dir="rtl" lang="ar" style={{position: 'absolute', left: 0, top: 110, width: '100%', fontFamily: 'AmiriQuran', fontSize: 84, lineHeight: '190px', color: NAVY, display: 'flex', justifyContent: 'center', columnGap: 22, whiteSpace: 'nowrap'}}>
        <span style={{color: '#8c6629'}}>{'﴿'}</span>{ar.map((w, j) => <span key={j} style={{opacity: clamp((t - (v0 + 0.4 + j * 0.2)) / 0.3)}}>{w}</span>)}<span style={{color: '#8c6629'}}>{'﴾'}</span></div></Paper>
  </>;
};
// G · two responses, kept closed (lines 28–31)
const G_: React.FC = () => <>
  <Paper x={170} y={170} w={740} h={640} c={CREAM} rot={-2} seed={80} amp={6} lift={1.4} at={S[28] + 0.26} dir="left">
    <Big y={70} size={118}>KHADIJAH’S</Big><Big y={200} size={118}>ANSWER</Big>
    <Hand y={348} size={62}><Note x={60} y={0} w={620} size={62} rot={-2} align="center" c={NOTE} at={wt(29, 'from') - 0.1} dur={1.6}>from everything she had<br />witnessed in him</Note></Hand></Paper>
  <Tape x={150} y={176} w={250} rot={-8} seed={25} at={S[28] + 0.75}>she listens...</Tape>
  <Paper x={300} y={690} w={500} h={96} c={NAVY} rot={3} seed={82} amp={3.5} at={wt(29, 'witnessed') + 0.7} dir="down" dist={90}><Big y={20} size={46} c={CREAM} ls={2}>READ IT IN THE SESSION</Big></Paper>
  <Paper x={1010} y={170} w={740} h={640} c={SLATE} rot={2} seed={84} amp={6} lift={1.4} at={S[30] - 0.05} dir="right">
    <Hand y={64} size={82} c={CREAM}>a second voice</Hand>
    </Paper>
  <Paper x={1070} y={370} w={620} h={250} c={CREAM} rot={-1.5} seed={86} amp={5} at={wt(31, 'waraqah') - 0.1} dir="up" dist={200}><Big y={22} size={100}>WARAQAH</Big><Big y={128} size={88}>IBN NAWFAL</Big></Paper>
  <Paper x={1130} y={690} w={500} h={96} c={MUSTARD} rot={-3} seed={88} amp={3.5} at={wt(31, 'nawfal') + 0.7} dir="down" dist={90}><Big y={20} size={46} c={NAVY} ls={2}>READ IT IN THE SESSION</Big></Paper>
</>;
// H · who believed next (lines 32–36)
const H_: React.FC = () => {
  const names: [string, number, number, number, number][] = [['‘ALI', 210, 300, wt(33, 'ali'), -3], ['ZAYD IBN HARITHAH', 600, 680, wt(33, 'zayd'), 1.5], ['ABU BAKR', 1370, 400, wt(33, 'abu'), -2]];
  return <>
    <Cut text="WHO BELIEVED NEXT?" x={960} y={64} size={112} tiles={[CREAM, WHITE, MUSTARD, CREAM]} seed={90} gap={6} at={S[32] - 0.08} stagger={0.035} />
    <Paper x={740} y={258} w={440} h={116} c={MUSTARD} rot={1.5} seed={92} amp={4} at={S[32] + 0.75} dir="up"><Big y={16} size={70}>KHADIJAH</Big></Paper>
    <Tape x={1196} y={262} w={150} rot={6} size={40} seed={27} at={S[32] + 1.1}>first</Tape>
    {names.map(([n, x, w, tt, rot], i) => <Paper key={i} x={x} y={478} w={w} h={116} c={CREAM} rot={rot} seed={94 + i * 2} amp={4} at={tt - 0.08} dir="down" dist={120}><Big y={16} size={70}>{n}</Big></Paper>)}
    <Marks id="h">
      {names.map(([, x, w, tt], i) => <Mk key={i} d={`M ${960 + (i - 1) * 60} 384 C ${960 + (i - 1) * 60} 420, ${x + w / 2} 430, ${x + w / 2} 468`} w={6} at={tt - 0.3} dur={0.25} />)}
      <Mk d="M 1580 604 C 1590 640, 1596 668, 1590 700" w={6} at={S[34]} dur={0.2} />
      <Mk d="M 200 606 L 204 646 L 1300 652 L 1780 644 L 1784 606" c={RED} w={8} at={wt(35, 'who') - 0.2} dur={0.6} />
    </Marks>
    <Tape x={1380} y={706} w={420} rot={2} seed={29} at={S[34] + 0.1}>and those he invited</Tape>
    <Note x={470} y={662} size={96} c={RED} rot={-3} w={800} at={wt(35, 'who')} dur={0.8}>who came first?</Note>
    <Strip x={410} y={816} w={1100} h={100} size={54} seed={96} rot={-0.7} at={S[36] + 0.05} dir="down" dist={110}>THE REASONS <Hi at={wt(36, 'why')}>WHY</Hi> ARE WORTH HEARING</Strip>
  </>;
};
// I · the public call, two opposite answers (lines 37–42)
const I_: React.FC = () => <>
  <Strip x={560} y={64} w={800} h={100} size={58} seed={71} rot={0.7} at={S[37] + 0.25}>THE PUBLIC CALL AT SAFA</Strip>
  <Paper x={810} y={230} w={300} h={280} c={CREAM} rot={-3} seed={98} amp={5} at={S[37] - 0.05} out={S[38] - 0.15} dir="up"><Ico name="speakerphone" x={150} y={140} size={200} at={S[37] + 0.15} sw={6} /></Paper>
  <Paper x={200} y={250} w={640} h={470} c={MUSTARD} rot={-2.5} seed={73} amp={6} lift={1.4} at={S[38] + 0.1} dir="left">
    <Big y={96} size={132}>KHADIJAH</Big><Hand y={290} size={78}>reassured him</Hand></Paper>
  <Paper x={1080} y={250} w={640} h={470} c={SLATE} rot={2.5} seed={75} amp={6} lift={1.4} at={wt(38, 'someone') - 0.05} dir="right">
    <Hand y={290} size={72} c={CREAM}><Note x={40} y={0} w={560} size={72} c={CREAM} rot={-1} align="center" at={wt(39, 'very') - 0.2} dur={0.9}>a very different answer</Note></Hand></Paper>
  <Paper x={1310} y={300} w={180} h={230} c={CREAM} rot={6} seed={77} amp={3} at={wt(38, 'also') - 0.1} out={S[40] - 0.12} dir="up" dist={90}><Big y={10} size={190} c={TERRA}>?</Big></Paper>
  <Paper x={1100} y={330} w={600} h={170} c={INKK} rot={0.5} seed={79} amp={5} at={S[40] - 0.05} dir="up" dist={200}><Big y={20} size={112} c={CREAM}>ABU LAHAB</Big></Paper>
  <Strip x={470} y={770} w={980} h={96} c={CREAM} ink={NAVY} size={50} seed={81} rot={-1} at={S[41] - 0.02} dir="down" dist={100}>BOTH <Hi at={wt(41, 'knew')}>KNEW HIM</Hi> BEFORE REVELATION</Strip>
  <Marks id="i">
    <Mk d="M 1010 420 C 970 414, 930 420, 892 434" w={9} at={S[42]} dur={0.25} /><Mk d="M 928 400 L 888 436 L 938 456" w={9} at={S[42] + 0.22} dur={0.15} />
    <Mk d="M 910 560 C 950 566, 990 560, 1030 546" c={RED} w={9} at={wt(42, 'opposite')} dur={0.25} /><Mk d="M 994 580 L 1034 544 L 984 524" c={RED} w={9} at={wt(42, 'opposite') + 0.22} dur={0.15} />
  </Marks>
</>;
// J1 · the invitation and the route of the hour (lines 43–47)
const STOPS: [number, string, string, number, number][] = [[330, 'scale', 'the marketplace', wt(46, 'marketplace'), 330], [960, 'mountain', 'the mountain', wt(46, 'mountain'), 290], [1590, 'speakerphone', 'the first public call', wt(47, 'first'), 400]];
const J1_: React.FC = () => {
  const {t} = useT(); const o1 = S[45] - 0.2;
  return <>
    <Note x={250} y={120} size={110} c={NOTE} rot={-4} w={700} at={S[43]} dur={0.5} out={o1}>so join me...</Note>
    <Strip x={480} y={330} w={960} h={150} size={84} ls={4} seed={102} rot={-1.2} at={wt(43, 'one') - 0.1} out={o1} dir="up" dist={200}>ONE HOUR · LIVE · FREE</Strip>
    <Strip x={420} y={560} w={1080} h={108} c={CREAM} ink={NAVY} size={58} seed={108} rot={0.8} at={S[44] - 0.02} out={o1} dir="down" dist={110}>WE READ THE ACCOUNTS <Hi at={wt(44, 'together')}>TOGETHER</Hi></Strip>
    <Note x={470} y={110} size={84} c={NAVY} rot={-2} w={1100} at={S[45] + 0.1} dur={1.0}>one question, followed all the way</Note>
    <Marks id="j"><Dots d="M 330 520 C 520 470, 760 570, 960 520 C 1160 470, 1400 570, 1590 520" id="route" prog={inOut((t - (S[45] + 0.3)) / 1.6)} /></Marks>
    {STOPS.map(([x, ic, lb, tt, tw], i) => <React.Fragment key={i}>
      <Paper x={x - 140} y={380} w={280} h={280} c={CREAM} pts={circ(140, 30)} rot={i * 3 - 3} seed={110 + i * 2} amp={3} at={tt - 0.15} dir="up" dist={200}><Ico name={ic} x={140} y={140} size={170} at={tt + 0.1} sw={6} /></Paper>
      <Tape x={x - tw / 2} y={690} w={tw} rot={i === 1 ? 2 : -2} seed={31 + i} at={tt + 0.25}>{lb}</Tape></React.Fragment>)}
  </>;
};
// J2 · title card (lines 48–50 and the hold)
const J2_: React.FC = () => <>
  <Cut text="WHAT DID" x={960} y={150} size={128} tiles={[CREAM, WHITE]} seed={81} gap={8} at={S[48] + 0.24} />
  <Cut text="KHADIJAH" x={960} y={316} size={236} tiles={[MUSTARD, MUSTARD, NAVY, MUSTARD]} seed={83} gap={11} at={Math.max(S[48] + 0.5, wt(48, 'khadijah') - 0.12)} />
  <Cut text="KNOW?" x={960} y={612} size={128} tiles={[CREAM, WHITE, TERRA]} seed={85} gap={8} at={wt(48, 'know') - 0.05} />
  <Tape x={1010} y={800} w={700} rot={2.2} size={44} seed={19} at={wt(49, 'saturday') - 0.1}>Sat 9 January · 9 PM Singapore time</Tape>
  <Tape x={250} y={806} w={610} rot={-3} size={48} seed={17} at={wt(49, 'january') + 0.2}>a free live hour with Yasser Fares</Tape>
  <Strip x={610} y={920} w={700} h={96} size={46} font="YFPlex" ls={0.5} seed={87} rot={-0.6} at={S[50] + 0.2} dir="down" dist={120}>yasserfares.com/khadijah</Strip>
  {/* v5: the handwritten "save your seat" note and its arrow are gone; the address stands on its own (tone: we teach, we do not sell) */}
</>;

// ---------- assembly ----------
type Scn = {from: number; el: React.ReactNode; keys: [number, number, number, number][]; wipe?: string};
const C0: [number, number, number] = [1, 960, 540];
const push = (a: number, b: number, s1 = 1.045): [number, number, number, number][] => [[a, ...C0], [b, s1, 960, 540]];
const B = (i: number) => S[i] - 0.28;
const SCENES: Scn[] = [
  {from: -1, el: <A_ />, keys: [[0, 1.03, 960, 540], [S[1] - 0.1, 1.06, 960, 540], [S[1] + 0.9, 1.3, 560, 640], [S[5] - 0.25, 1.36, 580, 636], [S[5] + 0.95, 1, 960, 540], [B(7), 1.04, 960, 540]]},
  {from: B(7), el: <B_ />, keys: push(B(7), B(9), 1.06), wipe: NAVY},
  {from: B(9), el: <C1_ />, keys: push(B(9), B(11)), wipe: MUSTARD},
  {from: B(11), el: <C2_ />, keys: push(B(11), B(14)), wipe: CREAM},
  {from: B(14), el: <D_ />, keys: [[B(14), 1.12, 960, 420], [S[15], 1.0, 960, 540], [S[16] + 0.05, 1.04, 960, 540]], wipe: NAVY},
  {from: S[16] + 0.05, el: <E_ />, keys: [[S[16] + 0.05, 1, 960, 540], [S[19] - 0.3, 1.03, 960, 540], [S[19] + 0.5, 1.22, 1120, 600], [S[20] - 0.2, 1.24, 1120, 600], [S[20] + 0.6, 1, 960, 540], [S[22], 1.03, 960, 540]], wipe: TERRA},
  {from: S[22], el: <F_ />, keys: push(S[22], S[28] - 0.1, 1.03), wipe: NAVY},
  {from: S[28] - 0.1, el: <G_ />, keys: push(S[28] - 0.1, B(32)), wipe: MUSTARD},
  {from: B(32), el: <H_ />, keys: push(B(32), B(37), 1.03), wipe: CREAM},
  {from: B(37), el: <I_ />, keys: push(B(37), B(43)), wipe: TERRA},
  {from: B(43), el: <J1_ />, keys: push(B(43), S[48] - 0.12, 1.03), wipe: NAVY},
  {from: S[48] - 0.12, el: <J2_ />, keys: [[S[48] - 0.12, 1.08, 960, 500], [S[49], 1, 960, 540], [TL.total, 1.03, 960, 540]], wipe: MUSTARD},
];
const KEY: Record<number, string> = {0: 'old', 1: 'mountain.', 2: 'Hira.', 3: 'trembling.', 4: 'revelation.', 5: 'home.', 6: 'wife.', 7: 'Khadijah.', 8: 'reassures', 9: 'sure?', 10: 'guess.', 11: 'years.', 12: 'trade.',
  13: 'husband.', 14: 'question', 15: 'seen?', 16: 'only', 17: 'the Ka‘bah,', 18: 'dispute.', 19: 'Black', 20: 'accepted', 21: 'honour.', 22: 'Hira.', 23: 'step', 24: 'dreams.', 25: 'retreat.', 26: 'al-‘Alaq.',
  27: 'home.', 28: 'listens.', 29: 'witnessed', 30: 'second', 31: 'Waraqah', 32: 'next?', 34: 'invited.', 35: 'first', 36: 'why', 37: 'public,', 38: 'before', 39: 'different', 40: 'Lahab.', 41: 'knew', 42: 'opposite',
  43: 'free.', 44: 'together,', 45: 'question:', 46: 'mountain,', 47: 'call.', 48: 'Khadijah', 49: 'January.', 50: 'yasserfares.com'};
const Caption: React.FC = () => {
  const {t} = useT();
  let i = -1; for (let j = 0; j < S.length; j++) if (t >= S[j] - 0.12) i = j;
  if (i < 0 || t > TL.voice_end + 0.2) return null;
  const ln = TL.lines[i]; const hold = i + 1 < S.length ? S[i + 1] - 0.12 : TL.voice_end + 0.2; if (t > Math.min(hold, ln.end + 1.3)) return null;
  const w = clamp(ln.text.length * 21.5 + (KEY[i] ? 150 : 110), 420, 1640);
  return <Paper x={960 - w / 2} y={948} w={w} h={88} c={INKK} seed={200 + i} amp={3.5} rot={(i % 3 - 1) * 0.4}>
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', columnGap: 11, fontFamily: 'YFPlex, SpectralFull', fontSize: 40, color: WHITE, whiteSpace: 'pre'}}>
      {ln.words.map(([x, s], j) => {const k = x === KEY[i], on = clamp((t - (s - 0.06)) / 0.14);
        return <span key={j} style={{opacity: on, display: 'inline-block', ...(k ? {background: MUSTARD, color: INKK, padding: '0 10px', borderRadius: 3, transform: 'rotate(-1deg)'} : {})}}>{x}</span>;})}
    </div></Paper>;
};
// a torn sheet swept across the board; the scene changes while it covers the frame
const Wipe: React.FC<{at: number; c: string; n: number}> = ({at, c, n}) => {
  const {t2} = useT(); const p = (t2 - (at - 0.3)) / 0.6; if (p <= 0 || p >= 1) return null;
  const rev = n % 2 === 1, x = rev ? mix(2000, -2800, p) : mix(-2800, 2000, p);
  return <Paper x={x} y={-120} w={2700} h={1320} c={c} seed={300 + n} amp={16} core={14} rot={rev ? -2 : 2} lift={3} />;
};
export const Web01V: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS, t2 = (Math.floor(f / 2) * 2) / FPS;
  let si = 0; for (let j = 0; j < SCENES.length; j++) if (t2 >= SCENES[j].from) si = j;
  const sc = SCENES[si], c = cam(t, sc.keys), shift = Math.floor(f / 6) % 4;
  const fade = clamp((TL.total - t) / 0.45);
  return (
    <TC.Provider value={{t, t2, f}}>
      <AbsoluteFill style={{background: '#1c140b'}}><AbsoluteFill style={{opacity: fade}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${960 - c.x * c.s}px, ${540 - c.y * c.s}px) scale(${c.s})`}}>
          <div style={{position: 'absolute', left: -480, top: -270, width: 2880, height: 1620, backgroundImage: `url(${staticFile('tex/kraft.jpg')})`, backgroundSize: '1920px 1080px',
            backgroundPosition: `${[0, 3, -2, 1][shift]}px ${[0, -2, 2, 3][shift]}px`}} />
          <div key={si} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>{sc.el}</div>
        </div>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(40,24,6,0) 58%, rgba(40,24,6,.34) 100%)'}} />
        <Tape x={54} y={34} w={470} size={30} rot={-1.2} seed={11}>Yasser Fares · a free live session</Tape>
        <Caption />
        {SCENES.map((s, j) => (s.wipe ? <Wipe key={j} at={s.from} c={s.wipe} n={j} /> : null))}
      </AbsoluteFill></AbsoluteFill>
    </TC.Provider>
  );
};
