import React from 'react';
import {staticFile, continueRender, delayRender} from 'remotion';

// =====================================================================================
// Track B kit · "a phrase you say every day" (from 26 Nov 2026, runs beside One Word = Track A)
// Look: light cream paper, a faceless stick figure living a small story, one line of English
// and its Arabic under it, key word in orange. Minimal: one idea on screen at a time.
// Zones (1080×1920): series label 190 · captions 280–640 · story 660–1440 (ground line 1440)
// · bottom 25% stays quiet (platform UI covers it).
// =====================================================================================

export const FPS = 30, W = 1080, H = 1920;
export const GROUND = 1440, CX = 540;
export const C = {
  bg: '#f4ecdf', bg2: '#eadcc6', ink: '#25221f', acc: '#d8692d', accL: '#f2a565', teal: '#3f7b8c', tealL: '#8db7c2',
  mute: '#9c8f7d', ground: '#dfceb2', ground2: '#d2bd9c', sun: '#f3cf98', white: '#fffaf2', dark: '#3a3633',
};

// ---------- fonts (OFL: Poppins, Cairo; see public/fonts/trackb) ----------
const FONTS: [string, string, string][] = [
  ['TBPop5', 'poppins-latin-500-normal.woff2', '500'], ['TBPop6', 'poppins-latin-600-normal.woff2', '600'],
  ['TBPop7', 'poppins-latin-700-normal.woff2', '700'], ['TBCairo7', 'cairo-arabic-700-normal.woff2', '700'],
  ['TBCairo8', 'cairo-arabic-800-normal.woff2', '800'], ['TBCairoL', 'cairo-latin-700-normal.woff2', '700'],
  ['TBAmiriQ', 'fonts/AmiriQuran.ttf', '400'],   // B02+: Qur'anic text from quran/verse.py (Uthmani marks); OFL
];
let fontsAsked = false;
export const loadFonts = () => {
  if (fontsAsked || typeof document === 'undefined') return; fontsAsked = true;
  const h = delayRender('trackb-fonts');
  Promise.all(FONTS.map(([fam, file, weight]) => new FontFace(fam, `url(${staticFile(file.includes('/') ? file : 'fonts/trackb/' + file)})`, {weight})
    .load().then((f) => (document as any).fonts.add(f)))).then(() => continueRender(h)).catch((e) => {console.error(e); continueRender(h);});
};
export const FT = {en: 'TBPop6', enB: 'TBPop7', enM: 'TBPop5', ar: 'TBCairo7, TBCairoL, TBPop6', arB: 'TBCairo8, TBCairoL, TBPop7', quran: 'TBAmiriQ'};

// ---------- easing / timing ----------
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const inOut = (x: number) => {x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;};
export const outBack = (x: number) => {x = clamp(x); const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);};
export const k = (t: number, a: number, d: number, e: (x: number) => number = outCubic) => e((t - a) / d);
export const win = (t: number, a: number, b: number, fi = 0.3, fo = 0.3) => (t < a || t > b ? 0 : clamp(Math.min(fi ? (t - a) / fi : 1, fo ? (b - t) / fo : 1)));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------- timeline ----------
export type Word = [string, number, number];
export type Line = {text: string; words: Word[]; start: number; end: number};
export const tl = (TL: any) => {
  const L: Line[] = TL.lines;
  const norm = (s: string) => s.toLowerCase().replace(/[,.?'’…“”:!]/g, '');
  const wt = (i: number, w: string) => {for (const [x, s] of L[i].words) if (norm(x).startsWith(w)) return s; return L[i].start;};
  return {L, ST: L.map((l) => l.start), wt, VEND: TL.voice_end as number, TOTAL: TL.total as number};
};

// ---------- background: paper, soft sun, dunes, ground ----------
export const Backdrop: React.FC<{t: number; sun?: number; sunX?: number; dusk?: number}> = ({t, sun = 1, sunX = 760, dusk = 0}) => {
  const drift = Math.sin(t * 0.25) * 6;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="tbsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dusk ? '#e9d6c0' : C.bg} /><stop offset="0.7" stopColor={C.bg2} /><stop offset="1" stopColor={C.bg2} />
        </linearGradient>
        <radialGradient id="tbsun"><stop offset="0" stopColor={C.sun} stopOpacity={0.95} /><stop offset="0.55" stopColor={C.sun} stopOpacity={0.35} /><stop offset="1" stopColor={C.sun} stopOpacity={0} /></radialGradient>
        <filter id="tbgrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="linear" slope="0.06" /></feComponentTransfer></filter>
      </defs>
      <rect width={W} height={H} fill="url(#tbsky)" />
      {sun > 0 && <circle cx={sunX} cy={GROUND - 120 + drift} r={330} fill="url(#tbsun)" opacity={sun} />}
      {sun > 0 && <circle cx={sunX} cy={GROUND - 120 + drift} r={110} fill={C.sun} opacity={0.55 * sun} />}
      <path d={`M0 ${GROUND - 70} C 220 ${GROUND - 130}, 420 ${GROUND - 40}, 640 ${GROUND - 90} S 960 ${GROUND - 60}, ${W} ${GROUND - 110} L ${W} ${GROUND} L 0 ${GROUND} Z`} fill={C.ground} opacity={0.75} />
      <path d={`M0 ${GROUND - 25} C 260 ${GROUND - 70}, 520 ${GROUND - 10}, 760 ${GROUND - 45} S 1000 ${GROUND - 20}, ${W} ${GROUND - 40} L ${W} ${GROUND} L 0 ${GROUND} Z`} fill={C.ground2} opacity={0.55} />
      <rect x={0} y={GROUND} width={W} height={H - GROUND} fill={C.ground} />
      <line x1={0} x2={W} y1={GROUND} y2={GROUND} stroke={C.ink} strokeOpacity={0.35} strokeWidth={3} />
      <rect width={W} height={H} filter="url(#tbgrain)" />
    </svg>
  );
};

// ---------- the stick figure ----------
// Angles are absolute degrees from straight DOWN; positive turns toward +x (the figure's front when facing right).
// arms/legs = [upper, lower]. torso lean: 0 upright, + leans forward (+x). head: extra tilt on top of lean.
export type Pose = {lean: number; head: number; aL: [number, number]; aR: [number, number]; lL: [number, number]; lR: [number, number]; seat: number};
export const P: Record<string, Pose> = {
  stand: {lean: 0, head: 0, aL: [-9, -4], aR: [9, 4], lL: [-5, -3], lR: [5, 3], seat: 0},
  takbir: {lean: 0, head: -4, aL: [-118, -172], aR: [118, 172], lL: [-5, -3], lR: [5, 3], seat: 0},
  folded: {lean: 0, head: 8, aL: [8, 128], aR: [16, 122], lL: [-5, -3], lR: [5, 3], seat: 0},
  lookup: {lean: -4, head: -28, aL: [-12, -6], aR: [12, 6], lL: [-5, -3], lR: [5, 3], seat: 0},
  cower: {lean: -16, head: 18, aL: [125, 175], aR: [140, 185], lL: [-14, 6], lR: [16, -4], seat: 0},
  pulled: {lean: 18, head: 6, aL: [-30, -15], aR: [78, 84], lL: [-22, -10], lR: [20, 6], seat: 0},
  small: {lean: 8, head: 30, aL: [-4, 6], aR: [4, -6], lL: [-4, -2], lR: [4, 2], seat: 0},
  reach: {lean: 6, head: -22, aL: [-15, -8], aR: [150, 165], lL: [-8, -6], lR: [6, 10], seat: 0},
  kneel: {lean: 22, head: 30, aL: [10, 30], aR: [20, 40], lL: [70, -5], lR: [92, 0], seat: 0},
  ruku: {lean: 86, head: 4, aL: [-36, -30], aR: [-28, -24], lL: [-2, -2], lR: [4, 4], seat: 0},
  sujud: {lean: 118, head: -45, aL: [60, 92], aR: [66, 95], lL: [10, -90], lR: [14, -88], seat: 0},
  sit: {lean: -6, head: 6, aL: [-32, -22], aR: [-24, -16], lL: [95, 88], lR: [92, 84], seat: 1},
  hug: {lean: 28, head: 52, aL: [62, 160], aR: [72, 170], lL: [118, -8], lR: [126, -2], seat: 1},
  // B02 (27 Nov 2026)
  flex: {lean: -4, head: -12, aL: [-22, -10], aR: [92, 178], lL: [-8, -4], lR: [8, 4], seat: 0},          // showing his strength
  leanOn: {lean: 10, head: 6, aL: [-12, -6], aR: [52, 48], lL: [-6, -3], lR: [10, 5], seat: 0},          // leaning on a stack
  proud: {lean: -8, head: -20, aL: [-26, -14], aR: [36, -150], lL: [-7, -4], lR: [7, 4], seat: 0},       // hand on chest, chin up
  carry: {lean: 42, head: 14, aL: [-150, 158], aR: [-138, 168], lL: [-18, -6], lR: [26, 8], seat: 0},    // bent under a load on his back
  dua: {lean: 2, head: -10, aL: [30, 104], aR: [44, 116], lL: [-5, -3], lR: [5, 3], seat: 0},            // hands open in front, asking
  think: {lean: 2, head: 10, aL: [14, 70], aR: [26, 172], lL: [-5, -3], lR: [5, 3], seat: 0},            // hand to chin
};
export const lerpPose = (a: Pose, b: Pose, p: number): Pose => {
  p = clamp(p); const m = (x: number, y: number) => mix(x, y, p);
  return {lean: m(a.lean, b.lean), head: m(a.head, b.head), aL: [m(a.aL[0], b.aL[0]), m(a.aL[1], b.aL[1])], aR: [m(a.aR[0], b.aR[0]), m(a.aR[1], b.aR[1])],
    lL: [m(a.lL[0], b.lL[0]), m(a.lL[1], b.lL[1])], lR: [m(a.lR[0], b.lR[0]), m(a.lR[1], b.lR[1])], seat: m(a.seat, b.seat)};
};
// walking: swing legs and arms around a base pose
export const walk = (base: Pose, phase: number, amt = 1): Pose => {
  const s = Math.sin(phase), c = Math.cos(phase);
  return {...base, lean: base.lean + 4 * amt,
    lL: [base.lL[0] + 26 * s * amt, base.lL[0] + 26 * s * amt - 22 * Math.max(0, -c) * amt],
    lR: [base.lR[0] - 26 * s * amt, base.lR[0] - 26 * s * amt - 22 * Math.max(0, c) * amt],
    aL: [base.aL[0] - 22 * s * amt, base.aL[1] - 30 * s * amt], aR: [base.aR[0] + 22 * s * amt, base.aR[1] + 30 * s * amt]};
};
const v = (deg: number, len: number) => [Math.sin((deg * Math.PI) / 180) * len, Math.cos((deg * Math.PI) / 180) * len];
export const figureJoints = (pose: Pose) => {
  const TH = 82, SH = 82, TO = 118, UA = 64, LA = 60, HR = 31;
  // legs from hip at (0,0)
  const leg = ([a, b]: [number, number]) => {const [x1, y1] = v(a, TH); const [x2, y2] = v(b, SH); return {knee: [x1, y1], foot: [x1 + x2, y1 + y2]};};
  const L = leg(pose.lL), R = leg(pose.lR);
  // standing: lowest foot on the ground; seated: hip rests on the ground
  const standY = -Math.max(L.foot[1], R.foot[1]);
  const hipY = mix(standY, -16, pose.seat);
  const [tx, ty] = v(180 - pose.lean, TO);
  const neck = [tx, ty];
  const [hx, hy] = v(180 - pose.lean - pose.head, HR + 12);
  const head = [neck[0] + hx, neck[1] + hy];
  const sh = [neck[0] * 0.9, neck[1] * 0.9];
  const arm = ([a, b]: [number, number]) => {const [x1, y1] = v(a, UA); const [x2, y2] = v(b, LA); return {el: [sh[0] + x1, sh[1] + y1], hand: [sh[0] + x1 + x2, sh[1] + y1 + y2]};};
  return {hipY, L, R, neck, head, HR, sh, AL: arm(pose.aL), AR: arm(pose.aR)};
};
export const Figure: React.FC<{x: number; y?: number; pose: Pose; s?: number; c?: string; o?: number; flip?: boolean; heart?: number; heartXY?: [number, number]}> = ({x, y = GROUND, pose, s = 1, c = C.ink, o = 1, flip, heart = 0}) => {
  if (o <= 0.001) return null;
  const j = figureJoints(pose);
  const P2 = (p: number[]) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const sw = 13;
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s}) translate(0 ${j.hipY})`} opacity={o}>
      <g stroke={c} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={`M0 0 L${P2(j.L.knee)}`} strokeWidth={sw} /><path d={`M${P2(j.L.knee)} L${P2(j.L.foot)}`} strokeWidth={sw * 0.8} />
        <path d={`M0 0 L${P2(j.R.knee)}`} strokeWidth={sw} /><path d={`M${P2(j.R.knee)} L${P2(j.R.foot)}`} strokeWidth={sw * 0.8} />
        <path d={`M0 0 L${P2(j.neck)}`} strokeWidth={sw * 1.12} />
        <path d={`M${P2(j.sh)} L${P2(j.AL.el)}`} strokeWidth={sw * 0.88} /><path d={`M${P2(j.AL.el)} L${P2(j.AL.hand)}`} strokeWidth={sw * 0.72} />
        <path d={`M${P2(j.sh)} L${P2(j.AR.el)}`} strokeWidth={sw * 0.88} /><path d={`M${P2(j.AR.el)} L${P2(j.AR.hand)}`} strokeWidth={sw * 0.72} />
      </g>
      <circle cx={j.head[0]} cy={j.head[1]} r={j.HR} fill={c} />
      {heart > 0 && <Heart x={j.neck[0] * 0.62} y={j.neck[1] * 0.62} r={15} o={heart} />}
    </g>
  );
};
// where a figure's chest sits on screen (for things that travel to / from the heart)
export const chestAt = (x: number, pose: Pose, s = 1, y = GROUND, flip = false) => {
  const j = figureJoints(pose); return [x + (flip ? -1 : 1) * j.neck[0] * 0.62 * s, y + (j.hipY + j.neck[1] * 0.62) * s];
};
export const headAt = (x: number, pose: Pose, s = 1, y = GROUND, flip = false) => {
  const j = figureJoints(pose); return [x + (flip ? -1 : 1) * j.head[0] * s, y + (j.hipY + j.head[1]) * s];
};

// ---------- small drawn things ----------
export const Heart: React.FC<{x: number; y: number; r: number; o?: number; c?: string; glow?: number}> = ({x, y, r, o = 1, c = C.acc, glow = 0.6}) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    {glow > 0 && <circle r={r * 2.6} fill={c} opacity={0.18 * glow} />}
    <path d={`M0 ${r * 0.9} C ${-r * 1.4} ${-r * 0.1}, ${-r * 0.75} ${-r * 1.15}, 0 ${-r * 0.45} C ${r * 0.75} ${-r * 1.15}, ${r * 1.4} ${-r * 0.1}, 0 ${r * 0.9} Z`} fill={c} />
  </g>
);
// a dark storm cloud (fear)
export const Cloud: React.FC<{x: number; y: number; s: number; o?: number; t: number}> = ({x, y, s, o = 1, t}) => {
  const b = [[-120, 10, 80], [-40, -40, 105], [70, -20, 95], [140, 30, 70], [0, 40, 90], [-150, 50, 55]];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      {b.map(([bx, by, r], i) => <circle key={i} cx={bx + Math.sin(t * 1.3 + i) * 4} cy={by + Math.cos(t * 1.1 + i) * 4} r={r} fill={C.dark} />)}
      {[[-90, 120], [-20, 140], [50, 125], [110, 110]].map(([lx, ly], i) => <line key={i} x1={lx} y1={ly} x2={lx - 14} y2={ly + 60 + 10 * Math.sin(t * 5 + i)} stroke={C.dark} strokeWidth={9} strokeLinecap="round" opacity={0.55} />)}
    </g>
  );
};
// a glowing phone (desire)
export const Phone: React.FC<{x: number; y: number; s: number; o?: number; t: number; rot?: number}> = ({x, y, s, o = 1, t, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <circle r={150} fill={C.accL} opacity={0.22 + 0.08 * Math.sin(t * 4)} />
    <rect x={-58} y={-100} width={116} height={200} rx={20} fill={C.ink} />
    <rect x={-48} y={-86} width={96} height={164} rx={10} fill={C.acc} />
    {[0, 1, 2].map((i) => <rect key={i} x={-34} y={-66 + i * 40} width={68 - i * 14} height={16} rx={8} fill={C.white} opacity={0.85} />)}
    <circle cx={30} cy={-80} r={12} fill={C.white} stroke={C.acc} strokeWidth={5} />
  </g>
);
// trophy on a podium (success)
export const Trophy: React.FC<{x: number; y: number; s: number; o?: number; t: number}> = ({x, y, s, o = 1, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <circle cy={-250} r={140} fill={C.sun} opacity={0.5 + 0.1 * Math.sin(t * 3)} />
    <rect x={-90} y={-110} width={180} height={110} fill={C.ink} />
    <path d="M-60 -300 L60 -300 L50 -230 C 40 -190, -40 -190, -50 -230 Z" fill="#e6a93b" />
    <path d="M-60 -285 C -105 -285, -100 -230, -48 -228 M60 -285 C 105 -285, 100 -230, 48 -228" stroke="#e6a93b" strokeWidth={10} fill="none" />
    <rect x={-10} y={-200} width={20} height={55} fill="#e6a93b" /><rect x={-45} y={-150} width={90} height={22} rx={4} fill="#e6a93b" />
    {[0, 1, 2, 3].map((i) => {const a = t * 1.5 + i * 1.57; return <circle key={i} cx={Math.cos(a) * 120} cy={-250 + Math.sin(a) * 50} r={6} fill={C.white} opacity={0.8} />;})}
  </g>
);
// a heavy boulder (a sin that feels bigger than mercy)
export const Boulder: React.FC<{x: number; y: number; s: number; o?: number}> = ({x, y, s, o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M-170 0 L-190 -90 L-130 -200 L-20 -250 L110 -215 L185 -120 L175 0 Z" fill={C.dark} />
    <path d="M-60 -200 L-30 -120 L-70 -60 M60 -170 L30 -100 L75 -40" stroke="#5c5651" strokeWidth={8} fill="none" strokeLinecap="round" />
  </g>
);
// a thought bubble with a little drawing in it
export const Bubble: React.FC<{x: number; y: number; r: number; o?: number; from?: [number, number]; children?: React.ReactNode; fill?: string; ink?: string}> = ({x, y, r, o = 1, from, children, fill = C.white, ink = C.ink}) => (
  <g opacity={o}>
    {from && [0.25, 0.5].map((f, i) => <circle key={i} cx={mix(from[0], x, f)} cy={mix(from[1], y, f)} r={8 + i * 6} fill={fill} stroke={ink} strokeWidth={4} />)}
    <circle cx={x} cy={y} r={r} fill={fill} stroke={ink} strokeWidth={5} />
    <g transform={`translate(${x} ${y})`}>{children}</g>
  </g>
);
// tiny pictograms for bubbles (drawn, ink)
export const Glyph: React.FC<{kind: 'clock' | 'phone' | 'bill' | 'chat'; s?: number; c?: string}> = ({kind, s = 1, c = C.ink}) => {
  const st = {stroke: c, strokeWidth: 7, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <g transform={`scale(${s})`}>
      {kind === 'clock' && <><circle r={30} {...st} /><path d="M0 -16 L0 0 L13 9" {...st} /></>}
      {kind === 'phone' && <><rect x={-18} y={-32} width={36} height={64} rx={7} {...st} /><circle cy={22} r={3} fill={c} /></>}
      {kind === 'bill' && <><path d="M-22 -30 L22 -30 L22 30 L-22 30 Z" {...st} /><path d="M-12 -14 L12 -14 M-12 0 L12 0 M-12 14 L4 14" {...st} /></>}
      {kind === 'chat' && <><path d="M-30 -20 Q -30 -30 -20 -30 L 20 -30 Q 30 -30 30 -20 L 30 8 Q 30 18 20 18 L -6 18 L -20 30 L -18 18 L -20 18 Q -30 18 -30 8 Z" {...st} /></>}
    </g>
  );
};
// a label in small caps on an object
export const Tag: React.FC<{x: number; y: number; text: string; o?: number; c?: string; size?: number}> = ({x, y, text, o = 1, c = C.white, size = 30}) =>
  o <= 0.001 ? null : <text x={x} y={y} textAnchor="middle" fontFamily={FT.enB} fontSize={size} letterSpacing={4} fill={c} opacity={o}>{text}</text>;

// ---------- bilingual captions ----------
// English appears word by word as it is spoken (line 0 is fully visible from frame 1: the hook),
// the Arabic line fades in under it. Key words take the accent colour in both languages.
export const Captions: React.FC<{t: number; L: Line[]; ar: string[]; keyEn: string[][]; keyAr: string[][]; top?: number; hide?: (i: number) => boolean; size?: number; force?: number; o?: number; ink?: string; inkAr?: string; quranParts?: string[]}> = ({t, L, ar, keyEn, keyAr, top = 285, hide, size = 58, force, o = 1, ink = C.ink, inkAr = '#4a4540', quranParts = []}) => {
  let i = -1; for (let n = 0; n < L.length; n++) if (t >= L[n].start - 0.12) i = n;
  if (i < 0) i = 0;
  if (force !== undefined) i = force;
  if (hide && hide(i)) return null;
  const line = L[i], nextStart = i + 1 < L.length ? L[i + 1].start - 0.12 : 1e9;
  const fadeOut = (force !== undefined ? 1 : clamp((nextStart - t) / 0.1)) * o;
  const isKey = (w: string) => keyEn[i]?.some((kw) => w.toLowerCase().replace(/[^a-z’']/g, '').startsWith(kw.toLowerCase()));
  const arT = ar[i] ?? '';
  const arIn = i === 0 ? 1 : k(t, line.start - 0.05, 0.3);
  // split Arabic around key phrases
  const parts: {s: string; key: boolean}[] = [];
  {let rest = arT; const keys = [...quranParts, ...(keyAr[i] ?? [])];
    while (rest.length) {
      let best = -1, kw = '';
      for (const q of keys) {const p = rest.indexOf(q); if (p >= 0 && (best < 0 || p < best)) {best = p; kw = q;}}
      if (best < 0) {parts.push({s: rest, key: false}); break;}
      if (best > 0) parts.push({s: rest.slice(0, best), key: false});
      parts.push({s: kw, key: true}); rest = rest.slice(best + kw.length);
    }}
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: fadeOut}}>
      <div style={{fontFamily: FT.en, fontSize: size, lineHeight: 1.22, color: ink, textAlign: 'center', letterSpacing: -0.5}}>
        {line.words.map(([w, s], n) => {
          const p = i === 0 || force !== undefined ? 1 : k(t, s - 0.08, 0.16);
          return <span key={n} style={{display: 'inline-block', marginRight: '0.26em', opacity: p, transform: `translateY(${(1 - p) * 14}px)`, color: isKey(w) ? C.acc : ink,
            fontFamily: isKey(w) ? FT.enB : FT.en}}>{w}</span>;
        })}
      </div>
      <div dir="rtl" lang="ar" style={{fontFamily: FT.ar, fontSize: size * 0.86, lineHeight: 1.5, color: inkAr, textAlign: 'center', opacity: arIn}}>
        {parts.map((p, n) => {const q = quranParts.includes(p.s); return <span key={n} style={{color: p.key ? C.acc : undefined, fontFamily: q ? FT.quran : p.key ? FT.arB : undefined, fontSize: q ? '1.3em' : undefined}}>{p.s}</span>;})}
      </div>
    </div>
  );
};

// big Arabic phrase (the episode's phrase), e.g. اللهُ أَكْبَرُ — typed from trackb/phrases.json only
export const BigArabic: React.FC<{text: string; x: number; y: number; size: number; o?: number; c?: string; glow?: number; scale?: number}> = ({text, x, y, size, o = 1, c = C.acc, glow = 0, scale = 1}) =>
  o <= 0.001 ? null : (
    <div dir="rtl" lang="ar" style={{position: 'absolute', left: x - 500, width: 1000, top: y - size * 0.8, textAlign: 'center', fontFamily: FT.arB, fontSize: size, lineHeight: 1.6,
      color: c, opacity: o, transform: `scale(${scale})`, transformOrigin: `500px ${size * 0.8}px`, textShadow: glow ? `0 0 ${40 * glow}px rgba(243,170,90,${0.7 * glow})` : undefined}}>{text}</div>
  );

// series label at the top (quiet)
export const SeriesLabel: React.FC<{text: string; o?: number; c?: string}> = ({text, o = 1, c = C.mute}) => (
  <div style={{position: 'absolute', top: 178, left: 0, right: 0, textAlign: 'center', fontFamily: FT.enM, fontSize: 24, letterSpacing: 7, color: c, opacity: o}}>{text}</div>
);


// =====================================================================================
// KIT v2 (26 Nov 2026, after Ahmed: "the animation, motion graphics, transitions are not close").
// What changed and why (reference: @osama_alsadeq_ reels, frame by frame):
//  - a CAMERA over a wide WORLD: scenes sit along the ground; moving between them = the camera travelling
//    with the figure, pushing in and pulling back (no fades in place);
//  - a MOOD per section (dawn / dusk / gold / night) that the whole world lerps between;
//  - the figure WALKS with planted feet (leg phase driven by distance), with follow-through (head lag),
//    overshoot on pose changes and a motion trail when it moves fast;
//  - world pieces: parallax mountains, rain, stars, sun, sprouts, a drawn dome;
//  - the Arabic phrase enters word by word (never letter by letter);
//  - smaller captions, more empty space: the picture leads.
// =====================================================================================

export type Mood = {sky1: string; sky2: string; ground: string; ground2: string; mtn: string; ink: string; cap: string; capAr: string; sun: string};
export const MOODS: Record<string, Mood> = {
  dawn: {sky1: '#f4ecdf', sky2: '#eadcc6', ground: '#dfceb2', ground2: '#d2bd9c', mtn: '#dccbb0', ink: '#25221f', cap: '#25221f', capAr: '#4a4540', sun: '#f3cf98'},
  dusk: {sky1: '#e2dcd4', sky2: '#cfc6bb', ground: '#c9beb0', ground2: '#bbaf9f', mtn: '#c4b9ab', ink: '#25221f', cap: '#25221f', capAr: '#4a4540', sun: '#e9cfae'},
  gold: {sky1: '#fbeacd', sky2: '#f5d3a0', ground: '#e9d0a7', ground2: '#dec194', mtn: '#ecd2a8', ink: '#25221f', cap: '#25221f', capAr: '#4a4540', sun: '#f7b765'},
  night: {sky1: '#121b30', sky2: '#1f2b47', ground: '#1b253c', ground2: '#243149', mtn: '#26344f', ink: '#f1e6d2', cap: '#f4ead8', capAr: '#d9cdb8', sun: '#f3cf98'},
};
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const lerpColor = (a: string, b: string, p: number) => {const A = hex(a), B = hex(b); p = clamp(p);
  return '#' + A.map((x, i) => Math.round(mix(x, B[i], p)).toString(16).padStart(2, '0')).join('');};
export const lerpMood = (a: Mood, b: Mood, p: number): Mood => {const o: any = {}; for (const key of Object.keys(a)) o[key] = lerpColor((a as any)[key], (b as any)[key], p); return o;};
// mood track: [[time, moodName], ...] ascending; crossfade length xf seconds centred on each time
export const moodAt = (t: number, track: [number, string][], xf = 0.7): Mood => {
  let m = MOODS[track[0][1]];
  for (let i = 1; i < track.length; i++) {const [tt, name] = track[i]; const p = inOut((t - (tt - xf / 2)) / xf); if (p > 0) m = lerpMood(m, MOODS[name], p);}
  return m;
};

// camera: keyframes [time, x, y, zoom]; x,y = world point shown at screen centre-x / screen y 960
export type CamKey = [number, number, number, number];
export const camAt = (t: number, keys: CamKey[], e: (x: number) => number = inOut) => {
  if (t <= keys[0][0]) return {x: keys[0][1], y: keys[0][2], z: keys[0][3]};
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, x0, y0, z0] = keys[i - 1], [t1, x1, y1, z1] = keys[i]; const p = e((t - t0) / (t1 - t0));
    // zoom interpolates in log space so push-ins and pull-backs feel even
    return {x: mix(x0, x1, p), y: mix(y0, y1, p), z: Math.exp(mix(Math.log(z0), Math.log(z1), p))};
  }
  const l = keys[keys.length - 1]; return {x: l[1], y: l[2], z: l[3]};
};
export type Cam = {x: number; y: number; z: number};
export const toScreen = (c: Cam, wx: number, wy: number) => [W / 2 + (wx - c.x) * c.z, 960 + (wy - c.y) * c.z];
export const camTransform = (c: Cam) => `translate(${W / 2} 960) scale(${c.z}) translate(${-c.x} ${-c.y})`;

// the sky and far layers (screen space with parallax) + the ground (world space, inside the camera group)
export const Sky: React.FC<{m: Mood; cam: Cam; t: number; sunX?: number; sunY?: number; sun?: number; stars?: number}> = ({m, cam, t, sunX = 0, sunY = 0, sun = 0, stars = 0}) => {
  const par = (k: number) => ({x: W / 2 - cam.x * cam.z * k, z: mix(1, cam.z, 0.5)});
  const mtn = (k: number, amp: number, base: number, seed: number, col: string, o: number) => {
    const p = par(k); const pts: string[] = []; const step = 60;
    const off = ((p.x % 1200) + 1200) % 1200;
    for (let x = -1200; x <= W + 1200; x += step) {
      const wx = x - off; const n = Math.sin((x + seed) * 0.004) * 0.6 + Math.sin((x + seed * 3) * 0.011) * 0.3 + Math.sin((x + seed) * 0.023) * 0.1;
      pts.push(`${(wx).toFixed(0)},${(base - amp * (0.5 + 0.5 * n)).toFixed(0)}`);
    }
    const gy = 960 + (GROUND - cam.y) * cam.z;
    return <path d={`M${pts[0].split(',')[0]} ${gy + 40} L${pts.join(' L')} L${(W + 1200 - off).toFixed(0)} ${gy + 40} Z`} fill={col} opacity={o} />;
  };
  const gy = 960 + (GROUND - cam.y) * cam.z;
  const [sx, sy] = toScreen(cam, sunX, sunY);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="v2sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={m.sky1} /><stop offset="0.75" stopColor={m.sky2} /></linearGradient>
        <radialGradient id="v2sun"><stop offset="0" stopColor={m.sun} stopOpacity={0.9} /><stop offset="0.5" stopColor={m.sun} stopOpacity={0.3} /><stop offset="1" stopColor={m.sun} stopOpacity={0} /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#v2sky)" />
      {stars > 0 && Array.from({length: 46}).map((_, i) => {const x = (i * 271.3) % W, y = 90 + ((i * 167.9) % 900); const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
        return <circle key={i} cx={x} cy={y} r={1.6 + (i % 3)} fill="#fff6e4" opacity={stars * (0.35 + 0.55 * tw)} />;})}
      {sun > 0 && <><circle cx={sx} cy={sy} r={420 * cam.z + 160} fill="url(#v2sun)" opacity={sun} /><circle cx={sx} cy={sy} r={(110 * cam.z + 30)} fill={m.sun} opacity={0.75 * sun} /></>}
      {mtn(0.18, 260, gy - 70, 11, m.mtn, 0.55)}
      {mtn(0.42, 150, gy - 20, 47, lerpColor(m.mtn, m.ground2, 0.5), 0.75)}
    </svg>
  );
};
// ground band inside the camera group (world coordinates)
export const Ground: React.FC<{m: Mood; x0?: number; x1?: number}> = ({m, x0 = -4000, x1 = 9000}) => (
  <g>
    <path d={(() => {const p: string[] = []; for (let x = x0; x <= x1; x += 80) p.push(`${x},${(GROUND - 30 - 22 * Math.sin(x * 0.006) - 10 * Math.sin(x * 0.017)).toFixed(0)}`); return `M${x0} ${GROUND} L${p.join(' L')} L${x1} ${GROUND} Z`;})()} fill={m.ground2} opacity={0.7} />
    <rect x={x0} y={GROUND} width={x1 - x0} height={2400} fill={m.ground} />
    <line x1={x0} x2={x1} y1={GROUND} y2={GROUND} stroke={m.ink} strokeOpacity={0.3} strokeWidth={3} />
  </g>
);

// walking with planted feet: phase comes from distance travelled (a half cycle covers 2·L·sin(A))
export const walkByDistance = (base: Pose, dist: number, s = 1, amt = 1, ampDeg = 26): Pose => {
  const L = 164 * s; const phase = (dist * Math.PI) / Math.max(1, 2 * L * Math.sin((ampDeg * Math.PI) / 180));
  return walk(base, phase, amt);
};
// a move along the ground from x0 to x1 between t0 and t1 (eased), returning x and the walking pose
export const stroll = (t: number, t0: number, t1: number, x0: number, x1: number, base: Pose, s = 1) => {
  const p = inOut((t - t0) / (t1 - t0)); const x = mix(x0, x1, p); const moving = t > t0 && t < t1;
  const amt = moving ? Math.min(1, Math.sin(Math.PI * clamp((t - t0) / (t1 - t0))) * 1.6) : 0;
  return {x, pose: moving ? walkByDistance(base, Math.abs(x - x0), s, amt) : base, flip: x1 < x0};
};
// pose change with a little overshoot (follow-through)
export const settle = (a: Pose, b: Pose, t: number, t0: number, d = 0.45) => lerpPose(a, b, outBack(clamp((t - t0) / d)) as number);

// rain falling from y0 to the ground over [xa, xb] (world)
export const Rain: React.FC<{t: number; xa: number; xb: number; y0: number; o?: number; c?: string; n?: number}> = ({t, xa, xb, y0, o = 1, c = '#5d6670', n = 34}) => o <= 0 ? null : (
  <g opacity={o} stroke={c} strokeWidth={5} strokeLinecap="round">
    {Array.from({length: n}).map((_, i) => {const sp = 900 + (i % 5) * 120; const ph = (i * 0.137) % 1; const span = GROUND - y0;
      const y = y0 + ((t * sp / span + ph) % 1) * span; const x = xa + ((i * 97.3) % (xb - xa)) - (y - y0) * 0.12;
      return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 34} />;})}
  </g>
);
// a sprout that grows (0→1)
export const Sprout: React.FC<{x: number; p: number; h?: number; c?: string; leaf?: string}> = ({x, p, h = 120, c = '#25221f', leaf = '#6f9a6a'}) => p <= 0 ? null : (
  <g transform={`translate(${x} ${GROUND})`}>
    <path d={`M0 0 C 6 ${-h * 0.4}, -6 ${-h * 0.7}, 0 ${-h}`} stroke={c} strokeWidth={6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(p * 1.4)} />
    {[0.45, 0.75, 1].map((f, i) => {const q = clamp((p - 0.3 - i * 0.18) / 0.3); return q > 0 && <ellipse key={i} cx={(i % 2 ? -1 : 1) * 20 * q} cy={-h * f} rx={22 * q} ry={10 * q} fill={leaf} transform={`rotate(${(i % 2 ? 30 : -30)} ${(i % 2 ? -1 : 1) * 20 * q} ${-h * f})`} />;})}
  </g>
);
// a dome drawn over someone (protection / shelter), p 0→1 draws it
export const Dome: React.FC<{x: number; r: number; p: number; c?: string; o?: number}> = ({x, r, p, c = C.acc, o = 1}) => p <= 0 ? null : (
  <g opacity={o}>
    <path d={`M${x - r} ${GROUND} A ${r} ${r * 1.1} 0 0 1 ${x + r} ${GROUND}`} stroke={c} strokeWidth={7} fill={c} fillOpacity={0.08 * clamp(p * 2 - 1)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(p)} strokeLinecap="round" />
  </g>
);
// the phrase, word by word (RTL). enter[i] = time each word arrives; words drop in with a small overshoot
export const PhraseWords: React.FC<{words: string[]; enter: number[]; t: number; y: number; size: number; o?: number; scale?: number; glow?: number; c?: string; out?: number; font?: string; swell?: number[]; stroke?: number}> = ({words, enter, t, y, size, o = 1, scale = 1, glow = 0, c = C.acc, out = 0, font = FT.arB, swell, stroke = 0}) => o <= 0.001 ? null : (
  <div dir="rtl" lang="ar" style={{position: 'absolute', left: 0, right: 0, top: y - size * 0.8, display: 'flex', justifyContent: 'center', gap: size * 0.28, opacity: o,
    transform: `scale(${scale})`, transformOrigin: `540px ${size * 0.8}px`}}>
    {words.map((w, i) => {const p = clamp((t - enter[i]) / 0.42); const e = outBack(p); const q = clamp(out * Math.max(1.6, 1 + 0.3 * words.length) - i * 0.3);
      return <span key={i} style={{display: 'inline-block', fontFamily: font, fontSize: size, lineHeight: 1.6, color: c, opacity: clamp(p * 2.5) * (1 - q),
        transform: `translateY(${(1 - e) * -70 + q * -40}px) scale(${(0.7 + 0.3 * e) * (1 + (swell?.[i] ?? 0))})`, textShadow: glow ? `0 0 ${40 * glow}px rgba(243,170,90,${0.7 * glow})` : undefined, WebkitTextStroke: stroke ? `${stroke}px ${c}` : undefined}}>{w}</span>;})}
  </div>
);


// =====================================================================================
// B02 props (27 Nov 2026): flat, inked, simple. (y = the ground line under the thing unless noted)
// =====================================================================================
export const Dumbbell: React.FC<{x: number; y: number; s?: number; rot?: number; o?: number; c?: string}> = ({x, y, s = 1, rot = 0, o = 1, c = C.ink}) => o <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>   {/* centred on (x, y) */}
    <rect x={-70} y={-7} width={140} height={14} rx={6} fill={c} />
    {[-1, 1].map((d) => <g key={d}><rect x={d * 52 - 13} y={-42} width={26} height={84} rx={8} fill={c} /><rect x={d * 76 - 10} y={-30} width={20} height={60} rx={7} fill={C.acc} /></g>)}
  </g>
);
// a stack of books; n = how many have landed (fractional = the top one falling in)
export const Books: React.FC<{x: number; n: number; s?: number; o?: number}> = ({x, n, s = 1, o = 1}) => {
  const cols = [C.teal, C.acc, '#8a6a4a', C.teal, '#c9a24a', C.acc, '#8a6a4a'], W0 = [170, 150, 176, 158, 166, 146, 160];
  return o <= 0.001 ? null : (
    <g transform={`translate(${x} ${GROUND}) scale(${s})`} opacity={o}>
      {Array.from({length: Math.ceil(n)}).map((_, i) => {const f = clamp(n - i); const yy = -(i + 1) * 40 - (1 - outBack(f)) * 260; const w = W0[i % 7];
        return <g key={i} opacity={clamp(f * 3)} transform={`translate(${(i % 2 ? 8 : -6)} ${yy}) rotate(${(i % 3 - 1) * 2})`}>
          <rect x={-w / 2} y={0} width={w} height={36} rx={4} fill={cols[i % 7]} stroke={C.ink} strokeWidth={5} />
          <line x1={-w / 2 + 14} x2={w / 2 - 14} y1={12} y2={12} stroke={C.white} strokeWidth={4} opacity={0.7} />
        </g>;})}
    </g>
  );
};
export const Star: React.FC<{x: number; y: number; r: number; o?: number; c?: string; glow?: number}> = ({x, y, r, o = 1, c = '#e6a93b', glow = 0.5}) => o <= 0.001 || r <= 0 ? null : (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    {glow > 0 && <circle r={r * 1.9} fill={C.sun} opacity={0.35 * glow} />}
    <path d={Array.from({length: 10}).map((_, i) => {const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.45 : r; return `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;}).join(' ') + ' Z'}
      fill={c} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);
// a door standing on the road; open 0→1 swings the leaf, light pours out
export const Door: React.FC<{x: number; open: number; o?: number; light?: number; ink?: string}> = ({x, open, o = 1, light = 1, ink = C.ink}) => {
  const w = 210, h = 380, lo = clamp(open) * light;
  return o <= 0.001 ? null : (
    <g transform={`translate(${x} ${GROUND})`} opacity={o}>
      {lo > 0 && <>
        <circle cx={0} cy={-h / 2} r={420} fill={C.sun} opacity={0.35 * lo} />
        <path d={`M${-w / 2} 0 L${w / 2} 0 L${-w / 2 - 520} 60 L${-w / 2 - 620} 60 Z`} fill={C.sun} opacity={0.55 * lo} />
      </>}
      <rect x={-w / 2} y={-h} width={w} height={h} fill={lo > 0 ? '#fff1d2' : '#d9c8ab'} />
      {lo > 0 && <rect x={-w / 2} y={-h} width={w} height={h} fill={C.sun} opacity={0.7 * lo} />}
      {/* the leaf, hinged on the left, swinging toward us */}
      <g transform={`translate(${-w / 2} 0) scale(${1 - 0.86 * clamp(open)} 1)`}>
        <rect x={0} y={-h} width={w} height={h} fill={C.teal} stroke={ink} strokeWidth={7} />
        <rect x={24} y={-h + 30} width={w - 48} height={h * 0.38} rx={6} fill="none" stroke={ink} strokeWidth={5} opacity={0.5} />
        <circle cx={w - 30} cy={-h * 0.46} r={9} fill={C.acc} />
      </g>
      <rect x={-w / 2 - 12} y={-h - 14} width={w + 24} height={h + 14} fill="none" stroke={ink} strokeWidth={10} strokeLinejoin="round" />
    </g>
  );
};
// a cold, distant tower on a hill (what the basmalah says you are NOT walking up to)
export const Tower: React.FC<{x: number; sink?: number; o?: number; t: number}> = ({x, sink = 0, o = 1, t}) => o <= 0.001 ? null : (
  <g opacity={o}>
    <path d={`M${x - 900} ${GROUND} C ${x - 500} ${GROUND - 40}, ${x - 300} ${GROUND - 300}, ${x} ${GROUND - 320} C ${x + 300} ${GROUND - 300}, ${x + 500} ${GROUND - 40}, ${x + 900} ${GROUND} Z`} fill="#9aa3ad" />
    <g transform={`translate(0 ${sink * 1300})`}>
      <path d={`M${x - 110} ${GROUND - 300} L${x - 70} ${GROUND - 1350} L${x + 70} ${GROUND - 1350} L${x + 110} ${GROUND - 300} Z`} fill="#5d6874" />
      <path d={`M${x - 70} ${GROUND - 1350} L${x} ${GROUND - 1480} L${x + 70} ${GROUND - 1350} Z`} fill="#4a5460" />
      {[0, 1, 2, 3].map((i) => <line key={i} x1={x - 60 + i * 40} x2={x - 60 + i * 40} y1={GROUND - 1300} y2={GROUND - 360} stroke="#4a5460" strokeWidth={6} opacity={0.6} />)}
    </g>
    {/* cold wind */}
    {[0, 1, 2, 3, 4].map((i) => {const ph = ((t * 0.45 + i * 0.21) % 1); const yy = GROUND - 1200 + i * 190;
      return <path key={'w' + i} d={`M${x + 600 - ph * 1400} ${yy} q 80 -26 160 0 t 160 0`} stroke="#c9d3dc" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.8 * Math.sin(Math.PI * ph)} />;})}
  </g>
);
export const Lantern: React.FC<{x: number; y: number; s?: number; o?: number; glow?: number; t: number}> = ({x, y, s = 1, o = 1, glow = 1, t}) => o <= 0.001 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>   {/* y = bottom of the lantern */}
    <circle cy={-60} r={130} fill={C.sun} opacity={(0.4 + 0.06 * Math.sin(t * 6)) * glow} />
    <path d="M-34 -10 L34 -10 L44 0 L-44 0 Z" fill={C.ink} />
    <rect x={-30} y={-104} width={60} height={94} rx={8} fill="#ffe3a8" stroke={C.ink} strokeWidth={6} />
    <path d="M0 -40 C -12 -58, 6 -70, 0 -86 C 14 -70, 12 -52, 0 -40 Z" fill={C.acc} />
    <path d="M-38 -104 L38 -104 L22 -124 L-22 -124 Z" fill={C.ink} />
    <path d="M-12 -124 C -12 -150, 12 -150, 12 -124" stroke={C.ink} strokeWidth={6} fill="none" />
  </g>
);
// a prayer mat seen from the side (a thin strip on the ground)
export const Mat: React.FC<{x: number; w?: number; o?: number; p?: number}> = ({x, w = 300, o = 1, p = 1}) => o <= 0.001 || p <= 0 ? null : (
  <g opacity={o}><rect x={x - (w / 2) * p} y={GROUND - 10} width={w * p} height={14} rx={5} fill={C.teal} stroke={C.ink} strokeWidth={4} />
    <rect x={x - (w / 2) * p + 10} y={GROUND - 6} width={Math.max(0, w * p - 20)} height={4} fill={C.acc} opacity={0.8} /></g>
);
// a looping arrow (reciting on autopilot, from memory)
export const LoopGlyph: React.FC<{rot?: number; s?: number; c?: string}> = ({rot = 0, s = 1, c = C.ink}) => (
  <g transform={`scale(${s}) rotate(${rot})`} fill="none" stroke={c} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 -18 A 30 30 0 1 0 28 12" /><path d="M28 -34 L25 -16 L42 -12" />
  </g>
);


// =====================================================================================
// B03 props (28 Nov 2026): flat, inked, simple. (x, y = centre of the bottom edge unless noted)
// =====================================================================================
export const Gift: React.FC<{x: number; y: number; s?: number; o?: number; rot?: number; glow?: number; c?: string}> = ({x, y, s = 1, o = 1, rot = 0, glow = 0, c = C.acc}) => o <= 0.001 || s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    {glow > 0 && <circle cy={-60} r={120} fill={C.sun} opacity={0.45 * glow} />}
    <rect x={-60} y={-100} width={120} height={100} rx={6} fill={c} stroke={C.ink} strokeWidth={6} />
    <rect x={-70} y={-124} width={140} height={30} rx={6} fill={c} stroke={C.ink} strokeWidth={6} />
    <rect x={-11} y={-124} width={22} height={124} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <path d="M0 -124 C -30 -170, -70 -150, -40 -126 M0 -124 C 30 -170, 70 -150, 40 -126" stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
  </g>
);
export const Briefcase: React.FC<{x: number; y: number; s?: number; o?: number; rot?: number; glow?: number}> = ({x, y, s = 1, o = 1, rot = 0, glow = 0}) => o <= 0.001 || s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    {glow > 0 && <circle cy={-55} r={120} fill={C.sun} opacity={0.45 * glow} />}
    <path d="M-30 -104 L-30 -122 Q -30 -132 -20 -132 L 20 -132 Q 30 -132 30 -122 L 30 -104" stroke={C.ink} strokeWidth={8} fill="none" />
    <rect x={-80} y={-106} width={160} height={106} rx={12} fill="#8a6a4a" stroke={C.ink} strokeWidth={6} />
    <line x1={-80} x2={80} y1={-62} y2={-62} stroke={C.ink} strokeWidth={5} />
    <rect x={-14} y={-72} width={28} height={20} rx={4} fill={C.acc} stroke={C.ink} strokeWidth={4} />
  </g>
);
export const GradCap: React.FC<{x: number; y: number; s?: number; o?: number; rot?: number; glow?: number; t?: number}> = ({x, y, s = 1, o = 1, rot = 0, glow = 0, t = 0}) => o <= 0.001 || s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>   {/* y = bottom of the cap band */}
    {glow > 0 && <circle cy={-40} r={115} fill={C.sun} opacity={0.45 * glow} />}
    <path d="M-48 0 L-48 -34 L48 -34 L48 0 Q 0 16 -48 0 Z" fill={C.ink} />
    <path d="M0 -76 L104 -44 L0 -12 L-104 -44 Z" fill={C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M0 -44 L78 -40 L${80 + 3 * Math.sin(t * 3)} 6`} stroke={C.acc} strokeWidth={5} fill="none" strokeLinecap="round" />
    <circle cx={80 + 3 * Math.sin(t * 3)} cy={12} r={9} fill={C.acc} />
  </g>
);
// a self-built pedestal of stones; n = how many have landed, crumble 0→1 scatters them
export const Blocks: React.FC<{x: number; n: number; crumble?: number; s?: number; o?: number}> = ({x, n, crumble = 0, s = 1, o = 1}) => o <= 0.001 || n <= 0 ? null : (
  <g transform={`translate(${x} ${GROUND}) scale(${s})`} opacity={o}>
    {Array.from({length: Math.ceil(n)}).map((_, i) => {const f = clamp(n - i); const w = 200 - i * 14; const yy = -(i + 1) * 58 - (1 - outBack(f)) * 200;
      const dir = i % 2 ? 1 : -1; const cx = dir * crumble * (60 + i * 55), cy = crumble * crumble * (i + 1) * 58 * 0.95, cr = dir * crumble * (20 + i * 9);
      return <g key={i} opacity={clamp(f * 3) * (1 - clamp((crumble - 0.7) / 0.3))} transform={`translate(${cx} ${yy + cy}) rotate(${cr})`}>
        <rect x={-w / 2} y={0} width={w} height={54} rx={6} fill="#a49686" stroke={C.ink} strokeWidth={5} />
        <path d={`M${-w / 2 + 30} 14 L${-w / 2 + 60} 30 M${w / 2 - 50} 10 L${w / 2 - 30} 36`} stroke={C.ink} strokeWidth={4} opacity={0.4} strokeLinecap="round" />
      </g>;})}
  </g>
);
// bars closing around a heart (screen/world space centre x, y); open 0→1 the bars fall away
export const HeartCage: React.FC<{x: number; y: number; r: number; open?: number; o?: number; c?: string}> = ({x, y, r, open = 0, o = 1, c = C.ink}) => o <= 0.001 ? null : (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    {[-2, -1, 0, 1, 2].map((i) => {const fx = i * r * 0.42; const fall = clamp(open * 1.3 - Math.abs(i) * 0.1);
      return <line key={i} x1={fx + i * fall * 50} y1={-r * 1.1 + fall * 260} x2={fx + i * fall * 80} y2={r * 1.1 + fall * 260} stroke={c} strokeWidth={7} strokeLinecap="round" opacity={1 - fall} />;})}
    <rect x={-r * 1.05} y={-r * 1.15 + open * 200} width={r * 2.1} height={10} rx={4} fill={c} opacity={1 - clamp(open * 1.5)} />
    <rect x={-r * 1.05} y={r * 1.08 + open * 280} width={r * 2.1} height={10} rx={4} fill={c} opacity={1 - clamp(open * 1.5)} />
  </g>
);
// many worlds in the sky (world space); p 0→1 they pop in one by one
export const Worlds: React.FC<{p: number; t: number; o?: number; list: [number, number, number, string, boolean][]}> = ({p, t, o = 1, list}) => o <= 0.001 || p <= 0 ? null : (
  <g opacity={o}>
    {list.map(([wx, wy, r, col, ring], i) => {const q = outBack(clamp(p * list.length * 0.6 - i * 0.5)); if (q <= 0) return null; const yy = wy + 10 * Math.sin(t * 0.9 + i);
      return <g key={i} transform={`translate(${wx} ${yy}) scale(${q})`}>
        <circle r={r * 1.6} fill={col} opacity={0.15} />
        {ring && <ellipse rx={r * 1.7} ry={r * 0.42} fill="none" stroke={C.ink} strokeWidth={6} transform="rotate(-18)" />}
        <circle r={r} fill={col} stroke={C.ink} strokeWidth={6} />
        <path d={`M${-r * 0.6} ${-r * 0.2} q ${r * 0.4} ${-r * 0.25} ${r * 0.8} 0`} stroke={C.white} strokeWidth={5} fill="none" opacity={0.6} strokeLinecap="round" />
        {ring && <path d={`M${-r * 1.7 * 0.95} ${r * 0.42 * 0.3} A ${r * 1.7} ${r * 0.42} 0 0 0 ${r * 1.7 * 0.95} ${-r * 0.42 * 0.3}`} fill="none" stroke={C.ink} strokeWidth={6} transform="rotate(-18)" />}
      </g>;})}
  </g>
);
// a glowing dot rising (a blessing returned to its Source)
export const Rise: React.FC<{x: number; y: number; r?: number; o?: number}> = ({x, y, r = 14, o = 1}) => o <= 0.001 ? null : (
  <g opacity={o}><circle cx={x} cy={y} r={r * 3} fill={C.sun} opacity={0.35} /><circle cx={x} cy={y} r={r} fill={C.white} /></g>
);
