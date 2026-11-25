import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, continueRender, delayRender, spring} from 'remotion';
import TL from './timeline_ep08.json';
import EX from '../excerpts.json';
import {Icon, Mark, Strike, StrikeIn} from '../lib/icons';

// =====================================================================================
// One Word · 08 · aḥsan — same design system as Ep04 (reference) and the Ep06/07 motion system
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
      ONE WORD &nbsp;·&nbsp; 08 &nbsp;·&nbsp; FROM THE MIRROR</div>
    {bar && <div style={{position: 'absolute', top: 1512, left: 160, width: W - 320, height: 2, background: 'rgba(201,164,87,.18)', borderRadius: 2}}>
      <div style={{width: `${clamp(t / VEND) * 100}%`, height: 2, background: GOLDL, borderRadius: 2}} /></div>}
  </AbsoluteFill>
);

// ---------- verse card ----------
const Card: React.FC<{t: number; t0: number; t1: number; refTxt: string; ar: string; hl: number[]; lines: string[]; fs?: number; lh?: number}> = ({t, t0, t1, refTxt, ar, hl, lines, fs = 58, lh = 108}) => {
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
          return <span key={j} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 10}px)`, color: hl.includes(j) ? '#a06a0c' : NAVY}}>{w}</span>;})}
        <span style={{color: BROWN}}>{'﴾'}</span>
      </div>
      <div style={{fontFamily: F.it, fontSize: 35, lineHeight: 1.2, color: '#2c3550'}}>{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
    </div>
  );
};

// ---------- captions: balanced rows, words revealed as spoken ----------
const KEY: Record<number, string> = {1: 'command', 2: 'aḥsan.', 3: 'says:', 4: 'better,', 5: 'hostility', 6: 'friend.”', 7: 'Notice:', 8: 'good.', 9: 'better.',
  10: 'heal,', 11: 'peace.', 12: 'greeting.', 13: 'justice.', 14: 'kindness.', 15: 'hard', 16: 'can', 17: 'ought', 18: 'win', 19: 'lose', 20: 'break', 21: 'clearer.', 22: 'insult'};
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
// STORYBOARD (line → picture → what it says). Written before animating (RUNBOOK §5a).
// Through-line: THE REPLY, a speech bubble. A cream bubble = a good reply, a GOLD bubble = the better reply. It stands on the higher
// step in the hook, travels from YOU to THEM across the hostility in the verse, climbs the step in "notice", comes back bigger in the
// greeting, is the one ticked among the answers you can give, and lands on the top step again at the end.
//  0 Not good. Better.                  → frame 1 at full brightness: NOT GOOD. / BETTER. + أَحْسَن (large) + aḥsan; two steps: a small
//                                         cream bubble GOOD on the low step, a gold bubble BETTER on the high step. GOOD is struck by
//                                         0.8 s, BETTER pops on its word (motion in the first second, no branding animation first)
//  1 That's the Qur'an's command to you → a point of light (YOU) arrives on the high step beside the gold bubble: COMMAND · TO YOU
//  2 One word: aḥsan                     → the headline lifts away, ONE WORD; the Arabic word swells and glows; “better” under aḥsan
//  3–6 41:34 (verse window: calm)        → card; under it YOU and THEM, a jagged red line between them = HOSTILITY; the gold bubble
//                                         travels from YOU to THEM; on "close friend" the jagged line smooths into a gold arc, the two
//                                         lights come closer, THEM turns warm, a handshake-heart draws: CLOSE FRIEND
//  7 Notice                              → NOTICE + a magnifier
//  8 doesn't just say … something good   → the low step with the cream GOOD bubble; NOT JUST GOOD
//  9 It says: with what is better        → an arrow climbs to the high step, the gold BETTER bubble rises (calm: reads the verse)
// 10–11 heal, correct, bring peace       → the gold bubble moves up; three rows tick on their words: ✓ HEALS (bandage),
//                                         ✓ CORRECTS (pencil), ✓ BRINGS PEACE (handshake-heart)
// 12 Think of a greeting                 → THEM sends a cream bubble with a waving hand to YOU: A GREETING
// 13 Returning it is justice             → the same bubble goes back; equation row: [bubble] = [bubble]  ⚖ JUSTICE
// 14 … with something better = kindness  → the returning bubble grows and turns gold (gift); row 2: [bubble] < [BIG gold bubble]  ♥ KINDNESS
// 15 Here's the hard part                → the light dims: THE HARD PART
// 16 Not every answer you can give       → CAN GIVE: four answer bubbles pop in: INSULT (flame), ANGER (angry face), HUMILIATE (hammer),
//                                         BETTER (gold, handshake-heart)
// 17 is one you ought to give            → OUGHT TO GIVE: three get ✗ and dim, the gold one is ticked and grows
// 18–19 win the argument, lose the heart → split panel: THE ARGUMENT (trophy) WON ✓ | THE HEART (heart breaks, falls) LOST ✗
// 20 not to break the person             → a person (point of light) and a hammer above it; TO BREAK is struck, a ban ring on the hammer
// 21 make the truth clearer              → a fogged glass with TRUTH behind it; a wipe clears it on "clearer" (the mirror of the book)
// 22 Truth doesn't need insult           → TRUTH as a column; a crutch labelled INSULT props it; the crutch is pulled away and struck,
//                                         the column stands on its own ✓
// 23 Not good. Better.                   → callback to frame 1: the same headline, word and steps; GOOD struck again, BETTER pops
// 24 A new word, every day               → end card
// SILENT TEST: muted, the struck GOOD and the higher BETTER step, the bubble crossing the red line and the line turning gold, the
// rows of ticks, the equal / greater-than equations, the three crossed answers and the one ticked, WON vs LOST, the banned hammer,
// the fog wiped off TRUTH and the crutch taken away carry the argument. Each picture is tied to its own line.
// =====================================================================================
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
const Person: React.FC<{x: number; y: number; p: number; label?: string; warm?: boolean; r?: number; lo?: number}> = ({x, y, p, label, warm = true, r = 16, lo = 1}) => p <= 0 ? null : <>
  <Dot x={x} y={y} r={r * (0.6 + 0.4 * clamp(p))} o={clamp(p * 1.5)} warm={warm} />
  {label && <Tag x={x} y={y + 40} p={p * lo} size={24} c={warm ? GOLDL : SLATE}>{label}</Tag>}
</>;

// ---------- the two steps (hook + callback) ----------
const STEP = {lo: {x: 330, y: 1262, w: 300}, hi: {x: 750, y: 1196, w: 300}};
const Steps: React.FC<{p: number}> = ({p}) => p <= 0 ? null : (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: clamp(p * 2)}}>
    <path d={`M 150 ${STEP.lo.y} L ${STEP.lo.x + STEP.lo.w / 2 + 30} ${STEP.lo.y} L ${STEP.lo.x + STEP.lo.w / 2 + 30} ${STEP.hi.y} L 930 ${STEP.hi.y}`} pathLength={1}
      strokeDasharray="1 1" strokeDashoffset={1 - clamp(p)} stroke={GOLD} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round"
      style={{filter: 'drop-shadow(0 0 10px rgba(241,208,138,.45))'}} />
  </svg>
);
// hook composition: used on frame 1 (line 0) and as the callback (line 23)
const HookComp: React.FC<{t: number; li: number; first?: boolean}> = ({t, li, first}) => {
  const tG = wt(li, 'good'), tB = wt(li, 'better');
  const st = outQuint((t - tG - 0.02) / 0.3);
  const pop = sp(t, tB - 0.06, 9, 190), popS = 1 + 0.1 * Math.sin(Math.min(1, pop) * Math.PI) ;
  const enter = first ? 1 : outQuint((t - ST[li] + 0.15) / 0.45);
  const riseHi = first ? 1 : 1;
  const glowB = 0.35 + 0.65 * clamp(pop);
  const bob = Math.sin(t * 2.4) * 5;
  return (
    <AbsoluteFill style={{opacity: enter, transform: `scale(${1.04 - 0.04 * enter})`, transformOrigin: `${CX}px 800px`}}>
      <Line1 y={384}><StrikeIn p={st} sw={11}><span style={{fontFamily: F.cinzelB, fontSize: 96, letterSpacing: '0.06em', color: CREAM}}>NOT GOOD.</span></StrikeIn></Line1>
      <Line1 y={492}><span style={{display: 'inline-block', ...bigTxt(132), lineHeight: '150px', transform: `scale(${popS})`}}>BETTER.</span></Line1>
      <Glow x={CX} y={810} r={300} o={0.55 + 0.3 * clamp(pop)} />
      <div dir="rtl" lang="ar" style={{position: 'absolute', left: 0, top: 640, width: W, height: 320, textAlign: 'center', fontFamily: F.arw, fontSize: 196, lineHeight: '320px',
        color: '#efc874', textShadow: '0 10px 30px rgba(0,0,0,.55), 0 0 60px rgba(241,208,138,.35)'}}>أَحْسَن</div>
      <Line1 y={944}><span style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 52, color: CREAM}}>aḥsan · <span style={GOLDT}>better</span></span></Line1>
      <Steps p={1} />
      <Bubble x={STEP.lo.x} y={STEP.lo.y - 62 + bob * 0.4} w={200} h={84} kind="cream" label="GOOD" fs={30} dim={0.5 * st} />
      <Bubble x={STEP.hi.x} y={STEP.hi.y - 76 - 10 * clamp(pop) * riseHi} w={270} h={104} kind="gold" label="BETTER" fs={38} s={popS} glow={glowB} tail={-1} />
    </AbsoluteFill>
  );
};

// ---------- scene A: the hook (frame 1), the command to you, one word ----------
const SceneHook: React.FC<{t: number}> = ({t}) => {
  const tYou = wt(1, 'you'), tCmd = wt(1, 'command');
  const you = sp(t, tYou - 0.35, 13, 150);
  const cmd = outQuint((t - tCmd + 0.05) / 0.45);
  const out = quint((t - ST[2] + 0.25) / 0.5);          // headline + steps leave for "one word"
  const zoom = quint((t - wt(2, 'aḥsan') + 0.35) / 0.7);
  const leave = inQuint((t - ST[3] + 0.42) / 0.3);       // word fades before the card arrives
  const tG = wt(0, 'good'), st = outQuint((t - tG - 0.02) / 0.3);
  const pop = sp(t, wt(0, 'better') - 0.06, 9, 190), popS = 1 + 0.1 * Math.sin(Math.min(1, pop) * Math.PI);
  const bob = Math.sin(t * 2.4) * 5;
  return (
    <AbsoluteFill>
      <div style={{opacity: 1 - out, transform: `translateY(${-50 * out}px)`}}>
        <Line1 y={384}><StrikeIn p={st} sw={11}><span style={{fontFamily: F.cinzelB, fontSize: 96, letterSpacing: '0.06em', color: CREAM}}>NOT GOOD.</span></StrikeIn></Line1>
        <Line1 y={492}><span style={{display: 'inline-block', ...bigTxt(132), lineHeight: '150px', transform: `scale(${popS})`}}>BETTER.</span></Line1>
      </div>
      <Line1 y={440}><KType text="ONE WORD" t={t} tin={ST[2] - 0.05} tout={ST[3] - 0.55} size={84} color={GOLDT} /></Line1>
      <div style={{opacity: 1 - leave}}>
        <Glow x={CX} y={810} r={300 + 60 * zoom} o={0.55 + 0.3 * clamp(pop) + 0.2 * zoom} />
        <div dir="rtl" lang="ar" style={{position: 'absolute', left: 0, top: 640, width: W, height: 320, textAlign: 'center', fontFamily: F.arw, fontSize: 196, lineHeight: '320px',
          color: '#efc874', transform: `scale(${1 + 0.22 * zoom})`, transformOrigin: '50% 60%',
          textShadow: `0 10px 30px rgba(0,0,0,.55), 0 0 ${60 + 40 * zoom}px rgba(241,208,138,${0.35 + 0.25 * zoom})`}}>أَحْسَن</div>
        <Line1 y={944 + 40 * zoom}><span style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 52 + 10 * zoom, color: CREAM}}>aḥsan · <span style={GOLDT}>better</span></span></Line1>
      </div>
      <div style={{opacity: 1 - out}}>
        <Steps p={1} />
        <Bubble x={STEP.lo.x} y={STEP.lo.y - 62 + bob * 0.4} w={200} h={84} kind="cream" label="GOOD" fs={30} dim={0.5 * st} />
        <Bubble x={STEP.hi.x - 40 * clamp(you)} y={STEP.hi.y - 76 - 10 * clamp(pop)} w={270} h={104} kind="gold" label="BETTER" fs={38} s={popS} glow={0.35 + 0.65 * clamp(pop)} tail={-1} />
        <Person x={STEP.hi.x + 140} y={STEP.hi.y - 22} p={you} />
        <Tag x={STEP.hi.x + 20} y={STEP.hi.y + 22} p={cmd} c={GOLDL} size={22} w={460}>COMMAND · TO YOU</Tag>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene B: 41:34 (verse window: calm) — hostility becomes a close friend ----------
const zig = (x0: number, x1: number, y: number, amp: number, n = 9) => {let d = `M ${x0} ${y}`; for (let j = 1; j <= n; j++) {const x = lerp(x0, x1, j / n); d += ` L ${x} ${y + (j === n ? 0 : (j % 2 ? -amp : amp))}`;} return d;};
const SceneVerse: React.FC<{t: number}> = ({t}) => {
  const pin = outQuint((t - ST[3] - 0.1) / 0.8);
  const tH = wt(5, 'hostility'), tF = wt(6, 'friend');
  const host = outCubic((t - tH + 0.3) / 0.8);
  const heal = inOut((t - ST[6] + 0.05) / 1.0);
  const xa = lerp(250, 380, heal), xb = lerp(830, 700, heal), py = 1050;
  const fly = inOut((t - ST[4] - 0.1) / (ST[6] - ST[4] + 0.6));   // the reply crosses slowly
  const bx = lerp(xa + 40, xb - 90, fly), by = py - 150 - 60 * Math.sin(fly * Math.PI);
  const land = outCubic((t - tF + 0.3) / 0.5);
  const amp = 30 * (1 - heal), lc = heal < 0.5 ? RED : GOLDL;
  const hs = outCubic((t - wt(6, 'like') + 0.1) / 0.8);
  return (
    <AbsoluteFill style={{opacity: pin}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {host > 0 && <path d={zig(xa + 44, xb - 44, py, amp)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - host} stroke={lc} strokeWidth={7}
          fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.95} style={{filter: `drop-shadow(0 0 10px ${heal < 0.5 ? 'rgba(217,98,79,.6)' : 'rgba(241,208,138,.6)'})`}} />}
      </svg>
      <Tag x={CX} y={py + 34} p={host * (1 - heal * 2)} c={RED} size={24}>HOSTILITY</Tag>
      <Person x={xa} y={py} p={outQuint((t - ST[3]) / 0.6)} label="YOU" lo={1 - outQuint(heal / 0.4)} />
      <Person x={xb} y={py} p={outQuint((t - ST[3] - 0.15) / 0.6)} label="THEM" warm={heal > 0.5} lo={1 - outQuint(heal / 0.4)} />
      <Bubble x={bx} y={by} w={170 - 40 * land} h={72 - 16 * land} kind="gold" o={outQuint((t - ST[4] + 0.1) / 0.5) * (1 - land)} glow={0.6} tail={fly > 0.5 ? -1 : 1} />
      <Icon name="heart-handshake" x={CX} y={py - 150} size={150} p={hs} sw={6} c={GOLDL} />
      <Tag x={CX} y={py + 50} p={outQuint((t - wt(6, 'like') - 0.05) / 0.5)} c={GOLDL} size={30}>CLOSE FRIEND</Tag>
    </AbsoluteFill>
  );
};

// ---------- scene C: notice → not just good → better → heals, corrects, brings peace ----------
const RowI: React.FC<{y: number; o: number; icon: string; text: string; mark: number}> = ({y, o, icon, text, mark}) => o <= 0 ? null : (
  <div style={{position: 'absolute', left: 150, top: y - 50, width: 780, height: 100, opacity: o, transform: `translateX(${(1 - o) * -30}px)`}}>
    <Glass x={0} y={0} w={780} h={100} o={1} active={mark} />
    <Icon name={icon} x={70} y={50} size={62} p={o} sw={4} c={GOLDL} />
    <div style={{position: 'absolute', left: 130, top: 0, height: 100, display: 'flex', alignItems: 'center', fontFamily: F.cinzelB, fontSize: 40, letterSpacing: '0.08em', color: CREAM}}>{text}</div>
    <CheckMark x={705} y={50} s={64} p={mark} />
  </div>
);
const SceneNotice: React.FC<{t: number}> = ({t}) => {
  const mag = sp(t, ST[7] - 0.05, 12, 140), magOut = inQuint((t - ST[9] + 0.1) / 0.3);
  const lo = outQuint((t - ST[8] - 0.1) / 0.5), tGd = wt(8, 'good'), nj = outQuint((t - wt(8, 'just') + 0.05) / 0.45);
  const climb = inOut((t - ST[9] - 0.1) / 0.9), hi = outCubic((t - wt(9, 'better') + 0.4) / 0.8);
  const up = quint((t - ST[10] + 0.3) / 0.6);
  const loOut = 1 - outQuint((t - ST[10] + 0.4) / 0.35);
  const hx = lerp(STEP.hi.x, CX, up), hy = lerp(STEP.hi.y - 210, 560, up), hs = lerp(1, 0.95, up);
  const r1 = outQuint((t - ST[10] - 0.05) / 0.45), r2 = outQuint((t - ST[11] + 0.1) / 0.45), r3 = outQuint((t - wt(11, 'bring') + 0.1) / 0.45);
  const lift = -140;   // the steps sit higher here than in the hook
  return (
    <AbsoluteFill>
      <Line1 y={420}><KType text="NOTICE" t={t} tin={ST[7] - 0.1} tout={ST[8] + 0.2} size={84} color={GOLDT} /></Line1>
      <Line1 y={410}><KType text="NOT JUST GOOD" t={t} tin={wt(8, 'just') - 0.05} tout={ST[9] - 0.3} size={74} tr={0.03} /></Line1>
      <Line1 y={410}><KType text="BETTER" t={t} tin={wt(9, 'better') - 0.15} tout={ST[10] - 0.35} size={104} color={GOLDT} /></Line1>
      <div style={{opacity: loOut, transform: `translateY(${lift}px)`}}>
        <Steps p={lo} />
        <Bubble x={STEP.lo.x} y={STEP.lo.y - 62} w={220} h={90} kind="cream" label="GOOD" fs={32} o={lo} s={0.9 + 0.1 * lo} />
        <Tag x={STEP.lo.x} y={STEP.lo.y + 20} p={nj} c={CREAM} size={22}>NOT JUST THIS</Tag>
        {climb > 0 && <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <path d={`M ${STEP.lo.x + 60} ${STEP.lo.y - 125} L ${STEP.hi.x - 170} ${STEP.hi.y - 175}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - climb}
            stroke={GOLDL} strokeWidth={7} fill="none" strokeLinecap="round" />
          {climb > 0.95 && <path d={`M ${STEP.hi.x - 200} ${STEP.hi.y - 152} L ${STEP.hi.x - 168} ${STEP.hi.y - 176} L ${STEP.hi.x - 206} ${STEP.hi.y - 190}`} stroke={GOLDL} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>}
        <Glow x={STEP.hi.x} y={STEP.hi.y - 80} r={200} o={0.6 * hi} />
      </div>
      {mag > 0 && magOut < 1 && <Icon name="search" x={lerp(880, STEP.lo.x + 110, Math.min(1, mag))} y={lerp(620, STEP.lo.y - 120 + lift, Math.min(1, mag))} size={120}
        p={clamp(mag * 1.4)} o={1 - magOut} sw={5} c={GOLDL} />}
      <Bubble x={hx} y={hy + (up > 0 ? 0 : lift + 140)} w={290} h={112} kind="gold" label="BETTER" fs={40} o={hi} s={hs * (0.85 + 0.15 * hi)} glow={0.7 * hi} tail={-1} />
      <RowI y={820} o={r1} icon="bandage" text="HEALS" mark={outQuint((t - wt(10, 'heal') - 0.05) / 0.4)} />
      <RowI y={960} o={r2} icon="pencil" text="CORRECTS" mark={outQuint((t - wt(11, 'correct') - 0.05) / 0.4)} />
      <RowI y={1100} o={r3} icon="heart-handshake" text="BRINGS PEACE" mark={outQuint((t - wt(11, 'peace') - 0.05) / 0.4)} />
    </AbsoluteFill>
  );
};

// ---------- scene D: the greeting — justice (=) and kindness (>) ----------
const GY = 760, GXa = 230, GXb = 850;
const SceneGreeting: React.FC<{t: number}> = ({t}) => {
  const pin = outQuint((t - ST[12] + 0.1) / 0.5);
  const g1 = inOut((t - ST[12] - 0.05) / 1.0);                 // THEM → YOU
  const g2 = inOut((t - ST[13] - 0.05) / 0.9);                               // YOU → THEM (same size)
  const g3 = inOut((t - ST[14] - 0.05) / 1.1), grow = sp(t, wt(14, 'better') - 0.15, 12, 140);   // YOU → THEM (better)
  const arc = (a: number, b: number, p: number) => [lerp(a, b, p), GY - 120 - 90 * Math.sin(p * Math.PI)];
  const [x1, y1] = arc(GXb - 60, GXa + 60, g1), [x2, y2] = arc(GXa + 60, GXb - 60, g2), [x3, y3] = arc(GXa + 60, GXb - 60, g3);
  const o2 = g2 > 0 && t < ST[14] - 0.1 ? 1 - inQuint((t - ST[14] + 0.4) / 0.3) : 0;
  const eq1 = outQuint((t - wt(13, 'justice') + 0.25) / 0.5), eq2 = outQuint((t - wt(14, 'kindness') + 0.3) / 0.5);
  const Eq: React.FC<{y: number; p: number; big?: boolean; sign: string; icon: string; label: string}> = ({y, p, big, sign, icon, label}) => p <= 0 ? null : (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>
      <Glass x={90} y={y - 78} w={900} h={156} o={1} active={big ? 0.6 * p : 0} />
      <Bubble x={250} y={y - 8} w={150} h={66} kind="cream" icon="hand-stop" />
      <div style={{position: 'absolute', left: 340, top: y - 60, width: 90, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 84, lineHeight: '110px', color: big ? GOLDL : CREAM}}>{sign}</div>
      <Bubble x={big ? 560 : 520} y={y - 8} w={big ? 230 : 150} h={big ? 96 : 66} kind={big ? 'gold' : 'cream'} icon={big ? 'gift' : 'hand-stop'} glow={big ? 0.5 : 0} tail={-1} />
      <Icon name={icon} x={760} y={y - 6} size={70} p={p} sw={4} c={big ? GOLDL : CREAM} />
      <div style={{position: 'absolute', left: 800, top: y - 24, width: 180, fontFamily: F.cinzelB, fontSize: 30, letterSpacing: '0.1em', color: big ? GOLDL : CREAM}}>{label}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{opacity: pin}}>
      <Line1 y={420}><KType text="A GREETING" t={t} tin={wt(12, 'greeting') - 0.2} size={70} color={GOLDT} /></Line1>
      <Person x={GXa} y={GY} p={pin} label="YOU" />
      <Person x={GXb} y={GY} p={pin} label="THEM" />
      {g1 < 1 || t < ST[13] ? <Bubble x={x1} y={y1} w={150} h={66} kind="cream" icon="hand-stop" o={outQuint((t - ST[12]) / 0.3) * (1 - outQuint((g1 - 0.92) / 0.08))} tail={-1} /> : null}
      <Bubble x={x2} y={y2} w={150} h={66} kind="cream" icon="hand-stop" o={o2 * outQuint(g2 / 0.1) * (1 - outQuint((g2 - 0.92) / 0.08))} />
      <Bubble x={x3} y={y3} w={lerp(150, 230, clamp(grow))} h={lerp(66, 96, clamp(grow))} kind={grow > 0.4 ? 'gold' : 'cream'} icon={grow > 0.4 ? 'gift' : 'hand-stop'}
        o={outQuint(g3 / 0.1) * (1 - 0.0 * g3)} glow={0.6 * clamp(grow)} s={Math.min(1.08, 0.9 + 0.1 * grow)} />
      <Eq y={1010} p={eq1} sign="=" icon="scale" label="JUSTICE" />
      <Eq y={1185} p={eq2} big sign="<" icon="heart" label="KINDNESS" />
    </AbsoluteFill>
  );
};

// ---------- scene E: the hard part ----------
const SceneHard: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    <Line1 y={720}><KType text="THE HARD PART" t={t} tin={ST[15] - 0.05} tout={ST[16] - 0.45} size={96} color={GOLDT} tr={0.03} /></Line1>
  </AbsoluteFill>
);

// ---------- scene F: answers you can give / ought to give ----------
const ANS = [{x: 300, y: 760, icon: 'flame', label: 'INSULT', ok: false}, {x: 780, y: 760, icon: 'mood-angry', label: 'ANGER', ok: false},
  {x: 300, y: 1040, icon: 'hammer', label: 'HUMILIATE', ok: false}, {x: 780, y: 1040, icon: 'heart-handshake', label: 'BETTER', ok: true}];
const SceneAnswers: React.FC<{t: number}> = ({t}) => {
  const tO = wt(17, 'ought');
  return (
    <AbsoluteFill>
      <Line1 y={410}><KType text="CAN GIVE" t={t} tin={ST[16] - 0.05} tout={ST[17] - 0.3} size={86} /></Line1>
      <Line1 y={410}><KType text="OUGHT TO GIVE" t={t} tin={tO - 0.15} size={86} color={GOLDT} tr={0.03} /></Line1>
      {ANS.map((a, j) => {
        const pin = sp(t, ST[16] - 0.05 + j * 0.22, 12, 160);
        const m = outQuint((t - tO - 0.05 - (a.ok ? 0.5 : j * 0.12)) / 0.4);
        return <div key={j}>
          <Bubble x={a.x} y={a.y} w={380} h={150} kind={a.ok ? 'gold' : 'red'} icon={a.icon} label={a.label} fs={a.label.length > 7 ? 30 : 36} o={clamp(pin * 2)}
            s={Math.min(1.06, 0.7 + 0.3 * pin) * (a.ok ? 1 + 0.06 * m : 1 - 0.06 * m)} dim={a.ok ? 0 : m} glow={a.ok ? 0.8 * m : 0} tail={j % 2 ? -1 : 1} />
          <Mark kind={a.ok ? 'check' : 'x'} x={a.x + 150} y={a.y + 70} size={84} p={m} sw={11} />
        </div>;
      })}
    </AbsoluteFill>
  );
};

// ---------- scene G: win the argument, lose the heart ----------
const SceneWinLose: React.FC<{t: number}> = ({t}) => {
  const tW = wt(18, 'win'), tL = wt(19, 'lose'), tHt = wt(19, 'heart');
  const L = sp(t, tW - 0.2, 12, 150), div = outQuint((t - ST[18]) / 0.6), R = outQuint((t - tL + 0.25) / 0.5);
  const brk = outCubic((t - tHt + 0.05) / 0.4), fall = inOut((t - tHt - 0.25) / 0.9);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: CX - 2, top: 660, width: 4, height: 600 * div, background: `linear-gradient(180deg, ${CREAM}00, ${CREAM}88, ${CREAM}00)`}} />
      <Tag x={290} y={680} p={L} c={CREAM} size={30}>THE ARGUMENT</Tag>
      <Glow x={290} y={930} r={220} o={0.6 * clamp(L)} />
      <Icon name="trophy" x={290} y={930} size={240 * Math.min(1.05, 0.7 + 0.3 * L)} p={clamp(L)} sw={6} c={GOLDL} />
      <Tag x={260} y={1100} p={outQuint((t - wt(18, 'argument')) / 0.4)} c={GOLDL} size={40} w={260}>WON</Tag>
      <CheckMark x={400} y={1124} s={64} p={outQuint((t - wt(18, 'argument') - 0.15) / 0.4)} />
      <Tag x={790} y={680} p={R} c={CREAM} size={30}>THE HEART</Tag>
      <div style={{opacity: R * (1 - 0.55 * fall), transform: `translateY(${60 * fall}px) rotate(${12 * fall}deg)`, position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '790px 930px'}}>
        <Icon name={brk > 0.5 ? 'heart-broken' : 'heart'} x={790} y={930} size={230} p={R} sw={6} c={brk > 0.5 ? RED : GOLDL} />
      </div>
      <Tag x={760} y={1100} p={outQuint((t - tHt - 0.1) / 0.4)} c={RED} size={40} w={260}>LOST</Tag>
      <Mark kind="x" x={905} y={1124} size={56} p={outQuint((t - tHt - 0.25) / 0.4)} sw={9} />
    </AbsoluteFill>
  );
};

// ---------- scene H: not to break the person → make the truth clearer ----------
const SceneBreak: React.FC<{t: number}> = ({t}) => {
  const tB = wt(20, 'break'), tP = wt(20, 'person');
  const pin = outQuint((t - ST[20] + 0.1) / 0.5), swing = inOut((t - tB + 0.6) / 0.6), ban = outCubic((t - tP + 0.05) / 0.6);
  const out = quint((t - ST[21] + 0.35) / 0.4);
  const gIn = outQuint((t - ST[21] + 0.05) / 0.5), wipe = inOut((t - wt(21, 'truth') + 0.1) / (wt(21, 'clearer') - wt(21, 'truth') + 0.5));
  return (
    <AbsoluteFill>
      <div style={{opacity: pin * (1 - out)}}>
        <Line1 y={420}><StrikeIn p={outQuint((t - tB - 0.25) / 0.35)} sw={12}><KType text="TO BREAK" t={t} tin={tB - 0.2} size={92} /></StrikeIn></Line1>
        <Person x={CX + 60} y={1080} p={pin} label="THE PERSON" r={20} />
        <Icon name="hammer" x={CX - 60} y={880} size={260} p={pin} sw={6} c={CREAM} rot={lerp(-50, -12, swing)} />
        <Mark kind="ban" x={CX - 30} y={900} size={420} p={ban} sw={11} />
      </div>
      <div style={{opacity: gIn}}>
        <Line1 y={420}><KType text="CLEARER" t={t} tin={wt(21, 'clearer') - 0.2} size={96} color={GOLDT} /></Line1>
        <Glass x={160} y={640} w={760} h={560} o={1} active={wipe}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 760, height: 560, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{...bigTxt(150), filter: `blur(${10 * (1 - wipe)}px) drop-shadow(0 8px 22px rgba(0,0,0,.55))`}}>TRUTH</span></div>
          {/* the fog on the glass, wiped from left to right */}
          <div style={{position: 'absolute', left: 760 * wipe, top: 0, width: 760 * (1 - wipe), height: 560,
            background: 'repeating-linear-gradient(115deg, rgba(200,208,222,.34) 0 18px, rgba(170,180,200,.26) 18px 40px)'}} />
          {wipe > 0 && wipe < 1 && <div style={{position: 'absolute', left: 760 * wipe - 20, top: 0, width: 40, height: 560,
            background: 'linear-gradient(90deg, rgba(255,246,220,0), rgba(255,246,220,.55), rgba(255,246,220,0))'}} />}
        </Glass>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene I: truth doesn't need insult to support it ----------
const SceneSupport: React.FC<{t: number}> = ({t}) => {
  const pin = outQuint((t - ST[22] + 0.1) / 0.5), tI = wt(22, 'insult'), tS = wt(22, 'support');
  const crutch = outQuint((t - tI + 0.35) / 0.45), pull = inOut((t - tS - 0.05) / 0.6), st = outQuint((t - tS + 0.05) / 0.35);
  const ok = outQuint((t - tS - 0.55) / 0.4);
  const out = inQuint((t - ST[23] + 0.35) / 0.3);
  return (
    <AbsoluteFill style={{opacity: pin * (1 - out)}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {/* the column */}
        <rect x={CX - 150} y={1180} width={300} height={34} rx={6} fill="rgba(13,23,42,.9)" stroke={GOLD} strokeWidth={4} />
        <rect x={CX - 130} y={660} width={260} height={30} rx={6} fill="rgba(13,23,42,.9)" stroke={GOLD} strokeWidth={4} />
        <rect x={CX - 100} y={690} width={200} height={490} fill="url(#colG)" stroke={GOLDL} strokeWidth={5} />
        {[-50, 0, 50].map((dx, j) => <line key={j} x1={CX + dx} y1={700} x2={CX + dx} y2={1170} stroke={GOLD} strokeWidth={3} opacity={0.45} />)}
        <defs><linearGradient id="colG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1c2a48" /><stop offset="0.5" stopColor="#2c3d63" /><stop offset="1" stopColor="#1c2a48" /></linearGradient></defs>
      </svg>
      <div style={{position: 'absolute', left: CX - 170, top: 860, width: 340, textAlign: 'center', padding: '10px 0', background: 'linear-gradient(180deg,#f6eedc,#ece0c4)',
        borderRadius: 8, boxShadow: `inset 0 0 0 2px ${GOLD}, 0 10px 30px rgba(0,0,0,.5)`, fontFamily: F.cinzelB, fontSize: 56, letterSpacing: '0.12em', color: NAVY}}>TRUTH</div>
      <div style={{opacity: crutch * (1 - pull), transform: `translate(${200 * pull}px, ${40 * pull}px)`}}>
        <Icon name="crutches" x={CX + 250} y={1010} size={300} p={crutch} sw={6} c={RED} rot={-22 - 25 * pull} glow={0} />
      </div>
      <div style={{position: 'absolute', left: CX + 120, top: 740, width: 300, textAlign: 'center', opacity: crutch * (1 - 0.4 * pull)}}>
        <StrikeIn p={st} sw={9}><span style={{fontFamily: F.cinzelB, fontSize: 40, letterSpacing: '0.12em', color: RED}}>INSULT</span></StrikeIn></div>
      <CheckMark x={CX - 230} y={900} s={110} p={ok} />
      <Tag x={CX - 250} y={975} p={ok} c={GOLDL} size={28} w={300}>STANDS<br />ON ITS OWN</Tag>
    </AbsoluteFill>
  );
};

// ---------- scene J: callback to frame 1 ----------
const SceneCallback: React.FC<{t: number}> = ({t}) => <HookComp t={t} li={23} />;

type Scn = {a: number; b: number; C: React.FC<{t: number}>; tin?: (t: number) => React.CSSProperties; tout?: (t: number) => React.CSSProperties};
const SceneLayer: React.FC<{s: Scn; t: number}> = ({s, t}) => {
  if (t < s.a || t >= s.b) return null;
  const a = s.tin ? s.tin(t) : {}, b = s.tout ? s.tout(t) : {};
  const style: React.CSSProperties = {...a, ...b, opacity: ((a.opacity as number) ?? 1) * ((b.opacity as number) ?? 1)};
  if (a.transform && b.transform) style.transform = `${a.transform} ${b.transform}`;
  const C = s.C;
  return <AbsoluteFill style={style}><C t={t} /></AbsoluteFill>;
};
const fadeOut = (t1: number, d = 0.3) => (t: number): React.CSSProperties => ({opacity: 1 - inQuint((t - t1 + d) / d)});
const fadeIn = (t0: number, d = 0.4) => (t: number): React.CSSProperties => {const p = outQuint((t - t0) / d); return {opacity: clamp(p * 1.5), transform: `scale(${0.97 + 0.03 * p})`};};

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

// ---------- scene schedule ----------
const SCN: Scn[] = [
  {a: -1, b: ST[3] + 0.05, C: SceneHook},
  {a: ST[3] - 0.15, b: ST[7] + 0.1, C: SceneVerse, tout: fadeOut(ST[7] + 0.1, 0.35)},
  {a: ST[7] - 0.2, b: ST[12] - 0.05, C: SceneNotice, tin: fadeIn(ST[7] - 0.2), tout: fadeOut(ST[12] - 0.05)},
  {a: ST[12] - 0.2, b: ST[15] - 0.05, C: SceneGreeting, tout: (t) => {const p = quint((t - ST[15] + 0.45) / 0.4); return {opacity: 1 - p, transform: `scale(${1 + 0.25 * p})`};}},
  {a: ST[15] - 0.15, b: ST[16] - 0.05, C: SceneHard},
  {a: ST[16] - 0.15, b: ST[18] - 0.05, C: SceneAnswers, tout: fadeOut(ST[18] - 0.05)},
  {a: ST[18] - 0.2, b: ST[20] - 0.05, C: SceneWinLose, tin: fadeIn(ST[18] - 0.2), tout: fadeOut(ST[20] - 0.05)},
  {a: ST[20] - 0.2, b: ST[22] - 0.05, C: SceneBreak, tout: fadeOut(ST[22] - 0.05)},
  {a: ST[22] - 0.2, b: ST[23] + 0.02, C: SceneSupport},
  {a: ST[23] - 0.2, b: VEND + 0.3, C: SceneCallback},
];

const Frame: React.FC<{t: number; noEnd?: boolean}> = ({t, noEnd}) => {
  const dim = win(t, ST[15] - 0.4, ST[16] - 0.1, 0.6, 0.8);
  return (
    <AbsoluteFill>
      <Background t={t} dim={dim} />
      {t < VEND + 0.35 && <>
        {SCN.map((s, j) => <SceneLayer key={j} s={s} t={t} />)}
        <Card t={t} t0={ST[3] - 0.15} t1={ST[7] - 0.3} refTxt={'SURAH FUSSILAT  ·  41:34'} ar={(EX as any)['41:34']} hl={[3]} fs={50} lh={94}
          lines={['“Respond with what is better, and the one', 'between whom and you there was hostility', 'may become like a close friend.”']} />
        {LINES.map((_, i) => (i >= 1 && i <= 22 ? <Caption key={i} t={t} i={i} /> : null))}
        <Chrome t={t} />
      </>}
      {!noEnd && <EndCard t={t} />}
      <Sweep t={t} t0={VEND - 0.3} d={1.1} />
    </AbsoluteFill>
  );
};

export const Ep08: React.FC = () => {
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
