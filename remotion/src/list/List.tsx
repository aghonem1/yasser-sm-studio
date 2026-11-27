import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame, staticFile, delayRender, continueRender} from 'remotion';

// =====================================================================================
// THE LIST — weekly list reel (Wednesdays 20:00 SGT, from 2 Dec 2026).
// Modelled on @islaminsketches "Every prophet named in the Qur'an, all 25" (1.9M views, 44K saves, studied 27 Nov):
// frame 1 promises the whole set, one card per item (number badge, the word in Arabic + English, one hand-drawn
// object, one line, a tiny source), and an end card that asks viewers to comment one item.
// Cream sketchbook paper, ink line art that draws itself, no people. Driven by list/lNN.json.
// Timeline: intro INTRO s · each item ITEM s · outro OUTRO s (last 0.5 s returns to frame 1 for the loop).
// =====================================================================================

export const FPS = 30, W = 1080, H = 1920;
export const INTRO = 3.5, ITEM = 8.0, OUTRO = 7.5;
export const listLength = (spec: any) => INTRO + spec.items.length * ITEM + OUTRO;

const C = {ink: '#25221f', ink2: '#4a4540', acc: '#d8692d', accL: '#f2a565', teal: '#3f7b8c', mute: '#8f8271', line: 'rgba(37,34,31,0.18)', chip: 'rgba(37,34,31,0.05)'};

const FONTS: [string, string, string][] = [
  ['LPop5', 'trackb/poppins-latin-500-normal.woff2', '500'], ['LPop6', 'trackb/poppins-latin-600-normal.woff2', '600'],
  ['LPop7', 'trackb/poppins-latin-700-normal.woff2', '700'], ['LAmiri', 'Amiri-Bold.ttf', '700'], ['LQuran', 'AmiriQuran.ttf', '400'],
  ['LCorm', 'CormorantGaramond-Italic.ttf', '400'], ['LHand', 'caveat-latin-700-normal.woff2', '700'],
];
let asked = false;
const loadFonts = () => {
  if (asked || typeof document === 'undefined') return; asked = true;
  const h = delayRender('list-fonts');
  Promise.all(FONTS.map(([f, file, w]) => new FontFace(f, `url(${staticFile('fonts/' + file)})`, {weight: w}).load().then((ff) => (document as any).fonts.add(ff))))
    .then(() => continueRender(h)).catch((e) => {console.error(e); continueRender(h);});
};
loadFonts();

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const oc = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const ob = (x: number) => {x = clamp(x); const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);};
const k = (t: number, a: number, d: number, e = oc) => e((t - a) / d);

// ---------- hand-drawn objects: [d, accent?] in a 600x420 box; each path draws itself ----------
const HEART = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy + 1.6 * s} C${cx - 1.9 * s} ${cy + 0.4 * s} ${cx - 1.6 * s} ${cy - 1.1 * s} ${cx - 0.6 * s} ${cy - 1.0 * s} C${cx - 0.25 * s} ${cy - 0.96 * s} ${cx - 0.05 * s} ${cy - 0.7 * s} ${cx} ${cy - 0.5 * s} C${cx + 0.05 * s} ${cy - 0.7 * s} ${cx + 0.25 * s} ${cy - 0.96 * s} ${cx + 0.6 * s} ${cy - 1.0 * s} C${cx + 1.6 * s} ${cy - 1.1 * s} ${cx + 1.9 * s} ${cy + 0.4 * s} ${cx} ${cy + 1.6 * s} Z`;
const DROP = (x: number, y: number) => `M${x} ${y} q-13 24 0 32 q13 -8 0 -32`;
const SYMBOLS: Record<string, [string, boolean?][]> = {
  seed: [['M40 300 H560'], ['M170 300 Q300 170 430 300'], [DROP(170, 70), true], [DROP(300, 40), true], [DROP(430, 80), true],
    ['M282 276 C274 258 298 246 312 256 C326 268 310 288 290 286 C286 285 284 282 282 276 Z', true], ['M120 330 h8 M250 340 h10 M380 335 h8 M480 328 h10']],
  feather: [['M170 370 Q300 230 440 50'], ['M440 50 Q330 90 245 300 Q300 290 330 250'], ['M440 50 Q450 170 300 290'],
    ['M330 170 L300 150 M360 140 L335 118 M385 115 L365 95 M300 210 L340 200 M340 170 L380 165 M370 130 L405 125'], ['M470 330 q25 -30 0 -60 M510 345 q40 -45 0 -90', true]],
  links: [['M100 230 a75 75 0 1 0 150 0 a75 75 0 1 0 -150 0'], ['M370 160 h140 v140 h-140 Z'], ['M300 40 L360 140 H240 Z', true],
    ['M255 200 Q300 175 365 205'], ['M195 155 Q215 100 255 95'], ['M345 95 Q395 105 420 155']],
  letter: [['M140 130 H430 V330 H140 Z'], ['M140 130 L285 240 L430 130'], ['M140 330 L250 235 M430 330 L320 235'],
    ['M285 240 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0', true], ['M460 230 H565 M538 202 L565 230 L538 258', true]],
  heartlock: [[HEART(290, 215, 118)], ['M290 178 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0 M280 196 L268 252 H312 L300 196', true],
    ['M470 70 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0 M452 88 L520 160 M498 136 l-16 16 M512 152 l-14 14']],
  cup: [['M195 215 H405 V290 Q405 355 300 355 Q195 355 195 290 Z'], ['M405 235 Q460 235 460 272 Q460 310 405 310'], ['M150 375 H450'],
    ['M255 185 q-18 -28 0 -54 q18 -26 0 -54'], ['M300 180 q-18 -28 0 -54 q18 -26 0 -54'], ['M345 185 q-18 -28 0 -54 q18 -26 0 -54'], [HEART(300, 260, 22), true]],
  edge: [['M40 300 H390 V410'], ['M330 150 V300', false], ['M330 150 L385 170 L330 190', true], ['M70 255 Q300 170 480 270'], ['M455 248 L482 271 L452 284', true],
    ['M430 330 q20 10 40 0 M440 370 q20 10 40 0']],
  bridge: [['M40 410 V255 H200 V410'], ['M400 410 V255 H560 V410'], ['M200 255 Q300 165 400 255'], ['M200 255 H400'],
    ['M235 225 V255 M270 205 V255 M300 200 V255 M330 205 V255 M365 225 V255'], [HEART(300, 110, 20), true]],
  scale: [['M300 100 V340'], ['M215 365 H385 M250 340 H350'], ['M130 140 H470'], ['M150 140 L105 245 M150 140 L195 245 M450 140 L405 245 M450 140 L495 245'],
    ['M90 245 Q150 290 210 245 Z'], ['M390 245 Q450 290 510 245 Z'], ['M300 88 m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0', true]],
};

const Sketch: React.FC<{name: string; p: number; t: number; y: number; s?: number}> = ({name, p, t, y, s = 1}) => {
  const P = SYMBOLS[name] || []; const n = P.length;
  const wob = Math.sin(t * 1.3) * 1.2;
  return (
    <svg width={W} height={460 * s} viewBox="0 0 600 420" style={{position: 'absolute', left: (W - 600 * s * 1.1) / 2, top: y, width: 600 * s * 1.1, transform: `rotate(${wob * 0.4}deg)`}}>
      {P.map(([d, acc], i) => {
        const q = clamp(p * (n + 1.2) - i * 0.9);
        return <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - q} fill={acc && d.includes('Z') ? 'rgba(216,105,45,' + 0.85 * clamp(q * 2 - 1) + ')' : 'none'}
          stroke={acc ? C.acc : C.ink} strokeWidth={acc ? 6.5 : 7.5} strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </svg>
  );
};

const Badge: React.FC<{n: number; of: number; p: number; x?: number; y: number}> = ({n, of, p, x = 540, y}) => (
  <div style={{position: 'absolute', left: x - 78, top: y, width: 156, height: 156, borderRadius: 78, background: C.acc, color: '#fffaf2', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', transform: `scale(${p}) rotate(${(1 - p) * -40}deg)`, boxShadow: '0 6px 0 rgba(37,34,31,0.15)'}}>
    <div style={{fontFamily: 'LPop7', fontSize: 64, lineHeight: 1}}>{n}</div>
    <div style={{fontFamily: 'LPop6', fontSize: 22, letterSpacing: 2, opacity: 0.9}}>OF {of}</div>
  </div>
);

const Words: React.FC<{text: string; t: number; a: number; per: number; style: React.CSSProperties}> = ({text, t, a, per, style}) => (
  <div style={style}>{text.replace(/ (\S+)$/, '\u00a0$1').split(' ').map((w, i) => {
    const q = k(t, a + i * per, 0.3);
    return <span key={i} style={{display: 'inline-block', marginRight: '0.24em', opacity: q, transform: `translateY(${(1 - q) * 12}px)`}}>{w}</span>;
  })}</div>
);

export const List: React.FC<{spec: any}> = ({spec}) => {
  const t = useCurrentFrame() / FPS;
  const I = spec.items as any[]; const N = I.length; const TOTAL = listLength(spec);
  const loopIn = k(t, TOTAL - 0.5, 0.45);
  const qi = Math.floor((t - INTRO) / ITEM); const inI = t >= INTRO && qi < N; const lt = t - INTRO - qi * ITEM;
  const outroT = t - (INTRO + N * ITEM);
  const introO = t < INTRO ? 1 - k(t, INTRO - 0.25, 0.25) : loopIn;

  return (
    <AbsoluteFill style={{background: '#f4ecdf'}}>
      <Img src={staticFile('list/paper.jpg')} style={{position: 'absolute', inset: 0, width: W, height: H}} />
      {/* sketchbook margin + series mark */}
      <div style={{position: 'absolute', left: 64, top: 0, bottom: 0, width: 3, background: 'rgba(216,105,45,0.18)'}} />
      <div style={{position: 'absolute', top: 176, left: 0, right: 0, textAlign: 'center', fontFamily: 'LPop6', fontSize: 26, letterSpacing: 6, color: C.mute,
        opacity: inI ? 1 : 0}}>{spec.header}</div>

      {/* ---------- intro: frame 1 is the whole promise ---------- */}
      {introO > 0 && <div style={{position: 'absolute', inset: 0, opacity: introO}}>
        <div style={{position: 'absolute', top: 380, left: 0, right: 0, textAlign: 'center', fontFamily: 'LPop7', fontSize: 40, letterSpacing: 8, color: C.acc}}>{spec.hook.kicker}</div>
        <div style={{position: 'absolute', top: 470, left: 70, right: 70, textAlign: 'center', fontFamily: 'LPop7', fontSize: 150, lineHeight: 1.0, color: C.ink, letterSpacing: -3}}>
          {spec.hook.big}</div>
        <div style={{position: 'absolute', top: 800, left: 80, right: 80, textAlign: 'center', fontFamily: 'LCorm', fontSize: 78, lineHeight: 1.1, color: C.ink2}}>{spec.hook.sub}</div>
        <div style={{position: 'absolute', top: 1010, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22}}>
          {I.map((it, i) => <div key={i} dir="rtl" lang="ar" style={{fontFamily: 'LAmiri', fontSize: 50, color: i % 2 ? C.ink : C.acc,
            opacity: 0.35 + 0.65 * clamp(Math.sin(t * 2.2 - i * 0.5) * 0.5 + 0.5)}}>{it.ar}</div>).slice(0, 5)}
        </div>
        <div style={{position: 'absolute', top: 1095, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22}}>
          {I.map((it, i) => <div key={i} dir="rtl" lang="ar" style={{fontFamily: 'LAmiri', fontSize: 50, color: i % 2 ? C.ink : C.acc,
            opacity: 0.35 + 0.65 * clamp(Math.sin(t * 2.2 - i * 0.5) * 0.5 + 0.5)}}>{it.ar}</div>).slice(5)}
        </div>
        <div style={{position: 'absolute', top: 1235, left: 0, right: 0, textAlign: 'center', fontFamily: 'LHand', fontSize: 54, color: C.teal, transform: 'rotate(-2deg)'}}>{spec.hook.save}</div>
      </div>}

      {/* ---------- one card per item ---------- */}
      {inI && (() => {
        const it = I[qi];
        const inP = k(lt, 0, 0.32), outP = k(lt, ITEM - 0.25, 0.25);
        const o = inP * (1 - outP); const slide = (1 - inP) * 120 - outP * 120;
        return <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translateX(${slide}px) rotate(${(1 - inP) * 1.5 - outP * 1.5}deg)`}}>
          <Badge n={qi + 1} of={N} p={k(lt, 0.1, 0.45, ob)} y={236} />
          <Sketch name={it.symbol} p={k(lt, 0.25, 2.0, (x) => clamp(x))} t={t} y={398} s={1.06} />
          <div dir="rtl" lang="ar" style={{position: 'absolute', top: 880, left: 0, right: 0, textAlign: 'center', fontFamily: 'LAmiri', fontSize: 128, lineHeight: 1.45, color: C.ink,
            opacity: k(lt, 0.6, 0.4), transform: `scale(${0.85 + 0.15 * k(lt, 0.6, 0.5, ob)})`}}>{it.ar}</div>
          <div style={{position: 'absolute', top: 1085, left: 0, right: 0, textAlign: 'center', opacity: k(lt, 1.0, 0.4), transform: `translateY(${(1 - k(lt, 1.0, 0.4)) * 14}px)`}}>
            <span style={{fontFamily: 'LPop7', fontSize: 50, letterSpacing: 4, color: C.acc}}>{it.key}</span>
            <span style={{fontFamily: 'LPop5', fontSize: 42, color: C.ink2}}>{'  ·  ' + it.gloss}</span>
          </div>
          <Words text={'“' + it.line + '”'} t={lt} a={1.6} per={Math.min(0.11, 1.6 / it.line.split(' ').length)}
            style={{position: 'absolute', top: 1172, left: 100, right: 100, textAlign: 'center', fontFamily: 'LCorm', fontSize: 50, lineHeight: 1.22, color: C.ink}} />
          <div style={{position: 'absolute', top: 1365, left: 0, right: 0, textAlign: 'center', opacity: k(lt, 3.2, 0.5)}}>
            <div dir="rtl" lang="ar" style={{fontFamily: 'LQuran', fontSize: 40, lineHeight: 1.9, color: C.teal}}>{it.verse_ar}</div>
            <div style={{fontFamily: 'LPop5', fontSize: 24, letterSpacing: 2, color: C.mute, marginTop: 4}}>{it.ref.toUpperCase()}  ·  {it.page.toUpperCase()}</div>
          </div>
        </div>;
      })()}

      {/* ---------- end card ---------- */}
      {outroT >= 0 && (() => {
        const p = (d: number) => k(outroT, d - 0.1, 0.45, ob); const o = 1 - loopIn;
        return <div style={{position: 'absolute', inset: 0, opacity: o}}>
          <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: 'LPop7', fontSize: 104, color: C.ink, letterSpacing: -2,
            opacity: p(0.1), transform: `scale(${0.85 + 0.15 * p(0.1)})`}}>{spec.end.done}</div>
          <div style={{position: 'absolute', top: 455, left: 60, right: 60, textAlign: 'center', fontFamily: 'LCorm', fontSize: 60, lineHeight: 1.15, color: C.ink2, opacity: p(0.6)}}>{spec.end.ask}</div>
          <div style={{position: 'absolute', top: 640, left: 110, right: 110, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18}}>
            {I.map((it, i) => <div key={i} style={{padding: '14px 26px', borderRadius: 40, border: `3px solid ${C.ink}`, background: C.chip, fontFamily: 'LPop7', fontSize: 38, letterSpacing: 2,
              color: C.ink, opacity: p(1.0 + i * 0.12), transform: `translateY(${(1 - p(1.0 + i * 0.12)) * 20}px) rotate(${((i * 37) % 7) - 3}deg)`}}>{it.key}</div>)}
          </div>
          <div style={{position: 'absolute', top: 1040, left: 0, right: 0, textAlign: 'center', fontFamily: 'LPop7', fontSize: 84, color: '#fffaf2', opacity: p(2.4)}}>
            <span style={{background: C.acc, padding: '10px 40px', borderRadius: 24, display: 'inline-block', transform: `scale(${0.8 + 0.2 * p(2.4)}) rotate(-1.5deg)`}}>{spec.end.cta}</span></div>
          <div style={{position: 'absolute', top: 1215, left: 0, right: 0, textAlign: 'center', fontFamily: 'LHand', fontSize: 56, color: C.teal, opacity: p(3.2)}}>{spec.end.follow}</div>
        </div>;
      })()}
    </AbsoluteFill>
  );
};
