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
];
let fontsAsked = false;
export const loadFonts = () => {
  if (fontsAsked || typeof document === 'undefined') return; fontsAsked = true;
  const h = delayRender('trackb-fonts');
  Promise.all(FONTS.map(([fam, file, weight]) => new FontFace(fam, `url(${staticFile('fonts/trackb/' + file)})`, {weight})
    .load().then((f) => (document as any).fonts.add(f)))).then(() => continueRender(h)).catch((e) => {console.error(e); continueRender(h);});
};
export const FT = {en: 'TBPop6', enB: 'TBPop7', enM: 'TBPop5', ar: 'TBCairo7, TBCairoL, TBPop6', arB: 'TBCairo8, TBCairoL, TBPop7'};

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
  hug: {lean: 28, head: 52, aL: [62, 160], aR: [72, 170], lL: [118, -8], lR: [126, -2], seat: 1},
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
  const limb = (a: number[], b: number[], cc: number[]) => `M${P2(a)} L${P2(b)} L${P2(cc)}`;
  const sw = 13;
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s}) translate(0 ${j.hipY})`} opacity={o}>
      <g stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={limb([0, 0], j.L.knee, j.L.foot)} />
        <path d={limb([0, 0], j.R.knee, j.R.foot)} />
        <path d={`M0 0 L${P2(j.neck)}`} />
        <path d={limb(j.sh, j.AL.el, j.AL.hand)} />
        <path d={limb(j.sh, j.AR.el, j.AR.hand)} />
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
export const Bubble: React.FC<{x: number; y: number; r: number; o?: number; from?: [number, number]; children?: React.ReactNode}> = ({x, y, r, o = 1, from, children}) => (
  <g opacity={o}>
    {from && [0.25, 0.5].map((f, i) => <circle key={i} cx={mix(from[0], x, f)} cy={mix(from[1], y, f)} r={8 + i * 6} fill={C.white} stroke={C.ink} strokeWidth={4} />)}
    <circle cx={x} cy={y} r={r} fill={C.white} stroke={C.ink} strokeWidth={5} />
    <g transform={`translate(${x} ${y})`}>{children}</g>
  </g>
);
// tiny pictograms for bubbles (drawn, ink)
export const Glyph: React.FC<{kind: 'clock' | 'phone' | 'bill' | 'chat'; s?: number}> = ({kind, s = 1}) => {
  const st = {stroke: C.ink, strokeWidth: 7, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <g transform={`scale(${s})`}>
      {kind === 'clock' && <><circle r={30} {...st} /><path d="M0 -16 L0 0 L13 9" {...st} /></>}
      {kind === 'phone' && <><rect x={-18} y={-32} width={36} height={64} rx={7} {...st} /><circle cy={22} r={3} fill={C.ink} /></>}
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
export const Captions: React.FC<{t: number; L: Line[]; ar: string[]; keyEn: string[][]; keyAr: string[][]; top?: number; hide?: (i: number) => boolean; size?: number; force?: number; o?: number}> = ({t, L, ar, keyEn, keyAr, top = 285, hide, size = 58, force, o = 1}) => {
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
  {let rest = arT; const keys = keyAr[i] ?? [];
    while (rest.length) {
      let best = -1, kw = '';
      for (const q of keys) {const p = rest.indexOf(q); if (p >= 0 && (best < 0 || p < best)) {best = p; kw = q;}}
      if (best < 0) {parts.push({s: rest, key: false}); break;}
      if (best > 0) parts.push({s: rest.slice(0, best), key: false});
      parts.push({s: kw, key: true}); rest = rest.slice(best + kw.length);
    }}
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: fadeOut}}>
      <div style={{fontFamily: FT.en, fontSize: size, lineHeight: 1.22, color: C.ink, textAlign: 'center', letterSpacing: -0.5}}>
        {line.words.map(([w, s], n) => {
          const p = i === 0 || force !== undefined ? 1 : k(t, s - 0.08, 0.16);
          return <span key={n} style={{display: 'inline-block', marginRight: '0.26em', opacity: p, transform: `translateY(${(1 - p) * 14}px)`, color: isKey(w) ? C.acc : C.ink,
            fontFamily: isKey(w) ? FT.enB : FT.en}}>{w}</span>;
        })}
      </div>
      <div dir="rtl" lang="ar" style={{fontFamily: FT.ar, fontSize: size * 0.86, lineHeight: 1.5, color: '#4a4540', textAlign: 'center', opacity: arIn}}>
        {parts.map((p, n) => <span key={n} style={{color: p.key ? C.acc : undefined, fontFamily: p.key ? FT.arB : undefined}}>{p.s}</span>)}
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
export const SeriesLabel: React.FC<{text: string; o?: number}> = ({text, o = 1}) => (
  <div style={{position: 'absolute', top: 178, left: 0, right: 0, textAlign: 'center', fontFamily: FT.enM, fontSize: 26, letterSpacing: 7, color: C.mute, opacity: o}}>{text}</div>
);
