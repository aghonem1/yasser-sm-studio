import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, continueRender, delayRender, spring} from 'remotion';
import TL from './timeline_webinar01r2.json';

// Webinar 1 story reel r2 (9:16) · How did revelation begin? Four steps, in ‘A’ishah's account.
// Reel v3 design system (see Webinar01_Reel.tsx). Voice: the 22 Nov narration plus lines recorded on 25 Nov; built by scripts/episodes/webinar01_stories_build.py.
// Written by tools/gen_story_reels.py: edit the generator, not this file.

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
const norm = (s: string) => s.toLowerCase().replace(/[,.?'…“”:‘’]/g, '');
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
const KEY: Record<number, string> = Object.fromEntries(LINES.map((l, i) => [i, (l as any).key]));
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
const T = LINES.length - 3;                      // "What did Khadijah know?"; the two date lines follow it
const fade = (t: number, a: number, d = 0.4) => outQuint((t - a) / d);
const Label: React.FC<{x: number; y: number; w?: number; o: number; size?: number; c?: string; ls?: number; align?: 'center' | 'left'; children: React.ReactNode}> = ({x, y, w = 520, o, size = 32, c = CREAM, ls = 0.2, align = 'center', children}) =>
  o <= 0 ? null : <div style={{position: 'absolute', left: align === 'center' ? x - w / 2 : x, top: y + (1 - o) * 14, width: w, textAlign: align, fontFamily: F.cinzel, fontSize: size,
    letterSpacing: `${ls}em`, color: c, opacity: o, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,.6))'}}>{children}</div>;
const Halo: React.FC<{x: number; y: number; r: number; o: number}> = ({x, y, r, o}) => o <= 0 ? null :
  <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', opacity: o,
    background: 'radial-gradient(circle, rgba(241,208,138,.34) 0%, rgba(241,208,138,.10) 42%, rgba(241,208,138,0) 70%)'}} />;
// a headline that is on screen at frame 1 and lifts away at `out`
const Static: React.FC<{y: number; t: number; out: number; size: number; ls?: number; gold?: boolean; children: React.ReactNode}> = ({y, t, out, size, ls = 0.08, gold, children}) => {
  const p = 1 - inQuint((t - out) / 0.35); if (p <= 0) return null;
  return <Line1 y={y}><span style={{display: 'inline-block', fontFamily: F.cinzelB, fontSize: size, letterSpacing: `${ls}em`, lineHeight: `${Math.round(size * 1.22)}px`, opacity: p,
    transform: `translateY(${-36 * (1 - p)}px)`, ...(gold ? goldText : {color: CREAM})}}>{children}</span></Line1>;
};

// ---------- story: how revelation began, step by step ----------
// One rising line with four numbered marks. Each lights as it is named. The verse itself is not shown here.
const NX = 200, NY = [800, 928, 1056, 1184];
const Story: React.FC<{t: number}> = ({t}) => {
  const TS = [wt(2, 'truthful') - 0.1, wt(2, 'retreat') - 0.25, wt(3, 'opening') - 0.1, wt(4, 'return') - 0.1];
  const LB: [string, string | null][] = [['TRUTHFUL DREAMS', null], ['A RETREAT', null], ['THE OPENING WORDS', 'OF SURAT AL-‘ALAQ'], ['THE RETURN HOME', null]];
  const base = outQuint((t + 0.45) / 1.3);
  const prog = TS.slice(1).reduce((s, x) => s + outQuint((t - x + 0.3) / 0.6), 0) / 3;
  return (
    <AbsoluteFill>
      <Svg>
        <Line d={`M ${NX} ${NY[0]} L ${NX} ${NY[3]}`} p={base} w={3} o={0.4} />
        <Line d={`M ${NX} ${NY[0]} L ${NX} ${NY[0] + (NY[3] - NY[0]) * prog}`} p={prog > 0 ? 1 : 0} w={5} c={GOLDL} o={0.95} />
        {NY.map((y, j) => {const on = outQuint((t - TS[j]) / 0.5);
          return <g key={j} opacity={base}>
            <circle cx={NX} cy={y} r={36} fill={INK} stroke={on > 0 ? GOLDL : GOLD} strokeWidth={on > 0 ? 5 : 3} opacity={0.6 + 0.4 * on} />
            <circle cx={NX} cy={y} r={36 * on} fill="url(#goldF)" opacity={0.95 * on} />
          </g>;})}
      </Svg>
      {NY.map((y, j) => {const on = outQuint((t - TS[j]) / 0.5), base2 = fade(t, -1);
        return <React.Fragment key={j}>
          <Halo x={NX} y={y} r={110} o={on * 0.6} />
          <div style={{position: 'absolute', left: NX - 36, top: y - 25, width: 72, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 38, lineHeight: '50px', color: on > 0.5 ? INK : GOLD, opacity: base2 * (0.7 + 0.3 * on)}}>{j + 1}</div>
          <Label x={NX + 84} y={y - (LB[j][1] ? 50 : 29)} w={760} o={on} size={52} c={CREAM} ls={0.07} align="left">{LB[j][0]}</Label>
          {LB[j][1] && <Label x={NX + 84} y={y + 14} w={780} o={fade(t, wt(3, 'surat') - 0.1)} size={40} c={GOLDL} ls={0.07} align="left">{LB[j][1]}</Label>}
        </React.Fragment>;})}
    </AbsoluteFill>
  );
};
const Heads: React.FC<{t: number}> = ({t}) => <>
  <Static y={404} t={t} out={ST[1] - 0.6} size={76} ls={0.12}>HOW DID</Static>
  <Static y={506} t={t} out={ST[1] - 0.55} size={82} ls={0.03} gold>REVELATION BEGIN?</Static>
  {t > ST[1] - 0.3 && t < ST[T] + 0.2 && <>
    <Line1 y={404}><KType text="‘A’ISHAH’S ACCOUNT," t={t} tin={ST[1] - 0.1} tout={ST[T] - 0.55} size={62} ls={0.08} /></Line1>
    <Line1 y={496}><KType text="STEP BY STEP." t={t} tin={wt(1, 'step') - 0.12} tout={ST[T] - 0.5} size={104} color={GOLDT} ls={0.03} tr={0.04} /></Line1>
  </>}
</>;


// ---------- the close: the question, the date in his voice, the address ----------
const SceneTitle: React.FC<{t: number}> = ({t}) => {
  const rule = inOut((t - ST[T] - 0.5) / 0.9);
  const after = fade(t, VEND - 0.35, 0.7), after2 = fade(t, VEND - 0.05, 0.7);
  return (
    <AbsoluteFill>
      <Halo x={CX} y={760} r={520} o={fade(t, ST[T] - 0.2, 0.9) * 0.55} />
      <Line1 y={560}><KType text="WHAT DID" t={t} tin={ST[T] - 0.12} size={100} color={GOLDT} ls={0.05} tr={0.05} /></Line1>
      <Line1 y={690}><KType text="KHADIJAH KNOW?" t={t} tin={wt(T, 'khadijah') - 0.12} size={92} color={GOLDT} ls={0.03} tr={0.03} /></Line1>
      <Svg><Line d={`M ${CX - 130 * rule} 852 L ${CX + 130 * rule} 852`} p={rule > 0 ? 1 : 0} w={3} c={GOLDL} o={0.9} /></Svg>
      <Line1 y={900}><KType text="SATURDAY 9 JANUARY" t={t} tin={wt(T + 1, 'saturday') - 0.12} size={62} ls={0.08} tr={0.05} /></Line1>
      <Line1 y={1004}><KType text="9:00 PM  ·  SINGAPORE TIME" t={t} tin={wt(T + 2, 'nine') - 0.12} size={40} font={F.cinzel} color={{color: GOLDL}} ls={0.14} tr={0.05} gap={0.02} /></Line1>
      <div style={{position: 'absolute', top: 1118 + (1 - after) * 14, width: W, textAlign: 'center', fontFamily: F.plex, fontSize: 42, letterSpacing: 0.5, color: CREAM, opacity: after}}>yasserfares.com/khadijah</div>
      <Label x={CX} y={1196} w={1000} o={after2 * 0.75} size={25} ls={0.22}>A FREE LIVE HOUR WITH YASSER FARES</Label>
      <div style={{position: 'absolute', top: 1404, width: W, textAlign: 'center', fontFamily: F.plex, fontSize: 22, color: SLATE, opacity: 0.8 * after2}}>Narration: Yasser Fares (AI voice clone)</div>
    </AbsoluteFill>
  );
};

// ---------- schedule: the same quiet cross-fade on every change ----------
type Scn = {a: number; b: number; C: React.FC<{t: number}>};
const SCN: Scn[] = [{a: -1, b: ST[T] - 0.15, C: Story}, {a: ST[T] - 0.3, b: 1e9, C: SceneTitle}];
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
export const Web01R2: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const out = clamp((t - (TOTAL_R - 0.6)) / 0.28), back = clamp((t - (TOTAL_R - 0.32)) / 0.28);
  return (
    <AbsoluteFill style={{background: INK}}>
      <AbsoluteFill style={{opacity: 1 - out}}><Frame t={t} /></AbsoluteFill>
      {out > 0 && <AbsoluteFill style={{opacity: out}}><Background t={0} dim={0} /></AbsoluteFill>}
      {back > 0 && <AbsoluteFill style={{opacity: back}}><Frame t={0} /></AbsoluteFill>}
    </AbsoluteFill>
  );
};
