import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, continueRender, delayRender} from 'remotion';
import TLF from './timeline_webinar01.json';
import TLS from './timeline_webinar01s.json';
import EX from '../excerpts.json';
import {Icon, Mark, StrikeIn} from '../lib/icons';

// =====================================================================================
// Webinar teaser · "What Did Khadijah Know?"  (free live session, 12–13 Dec 2026)
//   web01  — full explainer, 1920x1080, ~1:50   (registration page, YouTube)
//   web01s — short cut, 1080x1920, ~31 s        (reels, ads)
// Same navy/gold system as the One Word reels. Every scene is drawn on a 1000x620 "stage"
// that is scaled into each format, so both versions share the same pictures.
// Source: week 4 of the seerah course outline only. Khadijah's own words are NOT quoted or
// paraphrased anywhere: they are read from the source in the session.
// Red lines: no faces, no people, no depiction of the Prophet ﷺ (a traced path stands for the walk home).
//
// STORYBOARD (line → picture → what it says)
//  0 comes home from Hira, trembling → a path traced from the mountain to a house; the word TREMBLING shakes
//  1 first words of revelation       → sparks above the cave
//  2 first to hear: his wife         → the house lights; label
//  3 she reassures him               → a shielded heart over the house; HOME becomes SHE REASSURES HIM
//  4–8 Khadijah · not a guess · years → name; A GUESS struck out; a line of years with two stops: TRADE (scales), MARRIAGE (hearts)
//  9–10 what had she seen?           → an eye opens over the question
//  11 not the only one watching      → a row of eyes opening
//  12–15 the Black Stone             → the Ka‘bah, four clans around it, red dispute lines; a tick; four gold lines meet at one stone
//  16–20 Hira, step by step          → four steps lighting in turn: dreams, retreat, Surat al-‘Alaq (verse card, no music), return home
//  21–24 two responses               → two closed cards: Khadijah's answer, Waraqah ibn Nawfal (read in the session)
//  25–29 who believed next           → names appear in order; a bracket and FIRST? over the three men; "why the accounts differ"
//  30–35 the public call             → Safa; two panels, both "knew him before revelation"; arrows part: two opposite answers
//  36–43 the invitation              → ONE HOUR · LIVE · FREE; the question travels marketplace → mountain → public call; title, date, address
// =====================================================================================

export const FPS = 30;
type Word = [string, number, number];
type Ln = {text: string; words: Word[]; start: number; end: number};
type TLT = {lines: Ln[]; voice_end: number; total: number};
const FULL = TLF as unknown as TLT, SHORT = TLS as unknown as TLT;
export const TOTAL_FULL = FULL.total, TOTAL_SHORT = SHORT.total;

const INK = '#070c17', NAVY = '#0d172a', GOLD = '#c9a457', GOLDL = '#f1d08a', CREAM = '#efe7d6', SLATE = '#9fb2d0', BROWN = '#8c6629', RED = '#d9624f';
const SW = 1000, SH = 620;                       // stage size

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
const F = {cinzel: 'YFCinzel, SpectralFull', cinzelB: 'YFCinzelB, SpectralFull', body: 'YFSpectralSB, SpectralFull', it: 'YFCormIt, CormFull', plex: 'YFPlex', ar: 'Amiri', quran: 'AmiriQuran'};

// ---------- easing / timing ----------
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
const inOut = (x: number) => {x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;};
const outBack = (x: number) => {x = clamp(x); const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);};
const k = (t: number, a: number, d: number, e: (x: number) => number = outCubic) => e((t - a) / d);
const win = (t: number, a: number, b: number, fi = 0.35, fo = 0.25) => (t < a || t > b ? 0 : clamp(Math.min(fi ? (t - a) / fi : 1, fo ? (b - t) / fo : 1)));
const norm = (s: string) => s.toLowerCase().replace(/[,.?'…“”:‘’]/g, '');
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const mkT = (tl: TLT) => {
  const ST = tl.lines.map((l) => l.start);
  const wt = (i: number, w: string) => {for (const [x, s] of tl.lines[i].words) if (norm(x).startsWith(w)) return s; return ST[i];};
  return {ST, wt};
};

// ---------- layout ----------
type Lay = {W: number; H: number; sx: number; sy: number; ss: number; portrait: boolean; tl: TLT; key: Record<number, string>;
  cap: {top: number; h: number; fs: number; key: number; row: number; max: number; gap: number}};
const LAND = (tl: TLT, key: Record<number, string>): Lay => ({W: 1920, H: 1080, sx: 310, sy: 84, ss: 1.3, portrait: false, tl, key,
  cap: {top: 892, h: 148, fs: 46, key: 64, row: 68, max: 44, gap: 13}});
const PORT = (tl: TLT, key: Record<number, string>): Lay => ({W: 1080, H: 1920, sx: 10, sy: 490, ss: 1.06, portrait: true, tl, key,
  cap: {top: 1290, h: 200, fs: 62, key: 88, row: 86, max: 25, gap: 15}});

// ---------- stage primitives (all coordinates are stage coordinates, 1000x620) ----------
const goldText: React.CSSProperties = {background: 'linear-gradient(180deg,#f8e4ad 0%,#e3b862 48%,#b4832f 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'};
const Reveal: React.FC<{p: number; style?: React.CSSProperties; children: React.ReactNode}> = ({p, style, children}) => (
  <div style={{position: 'absolute', overflow: 'hidden', paddingBottom: 8, ...style}}>
    <div style={{transform: `translateY(${(1 - p) * 105}%)`, opacity: clamp(p * 1.6)}}>{children}</div>
  </div>
);
const Lbl: React.FC<{x: number; y: number; w?: number; p: number; size?: number; c?: string; o?: number; children: React.ReactNode}> = ({x, y, w = 600, p, size = 26, c = CREAM, o = 1, children}) =>
  p <= 0 || o <= 0 ? null : <Reveal p={p} style={{left: x - w / 2, top: y, width: w, textAlign: 'center', opacity: o}}>
    <div style={{fontFamily: F.cinzelB, fontSize: size, letterSpacing: size * 0.12, lineHeight: 1.2, color: c}}>{children}</div></Reveal>;
const Ital: React.FC<{x: number; y: number; w?: number; p: number; size?: number; c?: string; children: React.ReactNode}> = ({x, y, w = 500, p, size = 30, c = CREAM, children}) =>
  p <= 0 ? null : <Reveal p={p} style={{left: x - w / 2, top: y, width: w, textAlign: 'center'}}>
    <div style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: size, lineHeight: 1.15, color: c}}>{children}</div></Reveal>;
const Big: React.FC<{x?: number; y: number; w?: number; p: number; size: number; gold?: boolean; ls?: number; children: React.ReactNode}> = ({x = SW / 2, y, w = SW, p, size, gold = true, ls = 4, children}) =>
  p <= 0 ? null : <div style={{position: 'absolute', left: x - w / 2, top: y, width: w, textAlign: 'center', opacity: clamp(p * 1.4), transform: `translateY(${(1 - p) * 22}px)`}}>
    <span style={{fontFamily: F.cinzelB, fontSize: size, letterSpacing: ls, lineHeight: 1.12, ...(gold ? goldText : {color: CREAM}), filter: 'drop-shadow(0 6px 16px rgba(0,0,0,.55))'}}>{children}</span></div>;
const Halo: React.FC<{x: number; y: number; r: number; o: number}> = ({x, y, r, o}) => o <= 0 ? null :
  <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: o,
    background: 'radial-gradient(closest-side, rgba(241,208,138,.30), rgba(241,208,138,.08) 55%, rgba(241,208,138,0))'}} />;
const Panel: React.FC<{x: number; y: number; w: number; h: number; p: number; gold?: boolean; o?: number}> = ({x, y, w, h, p, gold, o = 1}) => p <= 0 ? null :
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 20, background: 'rgba(13,23,42,.58)', opacity: clamp(p * 1.5) * o,
    border: `1.5px solid ${gold ? GOLD : 'rgba(239,231,214,.26)'}`, transform: `translateY(${(1 - p) * 18}px)`}} />;
const Pill: React.FC<{x: number; y: number; w: number; p: number; size?: number; solid?: boolean; children: React.ReactNode}> = ({x, y, w, p, size = 28, solid, children}) => p <= 0 ? null :
  <div style={{position: 'absolute', left: x - w / 2, top: y, width: w, height: size * 2.2, borderRadius: size * 1.1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: clamp(p * 1.5), transform: `scale(${0.9 + 0.1 * p})`, fontFamily: F.cinzelB, fontSize: size, letterSpacing: size * 0.14,
    ...(solid ? {background: 'linear-gradient(180deg,#f3d48e,#d6a54c)', color: INK, boxShadow: '0 10px 26px rgba(0,0,0,.45)'} : {border: `1.5px solid ${GOLD}`, color: GOLDL, background: 'rgba(13,23,42,.6)'})}}>{children}</div>;
const Stg: React.FC<{children: React.ReactNode}> = ({children}) => <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>{children}</svg>;
const Ln: React.FC<{d: string; p: number; w?: number; c?: string; o?: number; dash?: string}> = ({d, p, w = 4, c = GOLDL, o = 0.9, dash}) =>
  p <= 0 ? null : dash ? <path d={d} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeDasharray={dash} opacity={o * clamp(p * 3)}
    style={{clipPath: `inset(-20px ${(1 - clamp(p)) * 100}% -20px -20px)`}} />
    : <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(p)} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={o} />;

// ---------- scene 1: the walk home (lines 0–3) ----------
const Hook: React.FC<{t: number; a: {trem: number; rev: number; wife: number; name?: number; reass: number}}> = ({t, a}) => {
  const path = k(t, 0.5, Math.max(0.9, a.trem - 0.7), inOut);
  const sh = t > a.trem - 0.05 ? Math.sin(t * 41) * 5 * Math.exp(-(t - a.trem) * 0.55) : 0;
  const rev = k(t, a.rev + 0.55, 0.7), wife = k(t, a.wife + 0.25, 0.6), re = k(t, a.reass + 0.3, 0.6, outBack), nm = a.name === undefined ? 0 : k(t, a.name - 0.1, 0.4);
  return (
    <>
      <div style={{position: 'absolute', top: 0, width: SW, textAlign: 'center', fontFamily: F.cinzel, fontSize: 38, letterSpacing: 9, color: CREAM}}>HE CAME HOME</div>
      <div style={{position: 'absolute', top: 44, width: SW, textAlign: 'center', transform: `translate(${sh}px, ${-sh * 0.35}px)`}}>
        <span style={{fontFamily: F.cinzelB, fontSize: 92, letterSpacing: 5, lineHeight: '110px', ...goldText, filter: 'drop-shadow(0 8px 20px rgba(0,0,0,.55))'}}>TREMBLING.</span></div>
      <Halo x={200} y={420} r={190} o={0.55 + 0.35 * rev} />
      <Icon name="mountain" x={200} y={420} size={220} p={1} sw={6} />
      <Lbl x={200} y={540} w={380} p={1} size={24}>THE CAVE OF HIRA</Lbl>
      <Stg><Ln d="M 318 452 Q 500 330 688 452" p={path} w={6} dash="3 17" /></Stg>
      <Halo x={800} y={425} r={170 + 30 * re} o={0.25 + 0.4 * wife + 0.35 * re} />
      <Icon name="home" x={800} y={428} size={190} p={1} sw={6} c={wife > 0.5 ? GOLDL : CREAM} />
      <Lbl x={800} y={540} w={380} p={1} size={24} o={1 - k(t, a.reass + 0.1, 0.3)}>HOME</Lbl>
      <Lbl x={800} y={540} w={400} p={k(t, a.reass + 0.35, 0.5)} size={24} c={GOLDL}>SHE REASSURES HIM</Lbl>
      <Icon name="sparkles" x={200} y={262} size={74} p={rev} sw={5} />
      <Lbl x={235} y={170} w={470} p={rev} size={21} c={GOLDL}>THE FIRST WORDS OF REVELATION</Lbl>
      <Lbl x={790} y={170} w={420} p={wife} size={21} o={1 - nm}>THE FIRST TO HEAR: HIS WIFE</Lbl>
      <Lbl x={790} y={170} w={420} p={nm} size={21} c={GOLDL}>HIS WIFE, KHADIJAH</Lbl>
      <Icon name="shield-heart" x={800} y={266} size={84} p={re} sw={5} />
    </>
  );
};

// ---------- scene 2: not a guess · years of knowing him (lines 4–8) ----------
const Known: React.FC<{t: number; a: {name?: number; guess: number; guessW: number; years: number; trade: number; marr: number; subs?: boolean}}> = ({t, a}) => {
  const nm = a.name === undefined ? 1 : k(t, a.name - 0.15, 0.7, outExpo), g = k(t, a.guess - 0.15, 0.5), st = k(t, a.guessW + 0.25, 0.4);
  const ln = k(t, a.years - 0.1, 1.0, inOut), tr = k(t, a.trade - 0.15, 0.7), mr = k(t, a.marr - 0.15, 0.7);
  return (
    <>
      <Big y={0} p={nm} size={88} ls={8}>KHADIJAH</Big>
      <div style={{position: 'absolute', top: 122, width: SW, textAlign: 'center', opacity: g, transform: `translateY(${(1 - g) * 14}px)`}}>
        <span style={{fontFamily: F.cinzel, fontSize: 38, letterSpacing: 6, color: CREAM}}>HER ANSWER: NOT </span>
        <StrikeIn p={st} sw={8}><span style={{fontFamily: F.cinzelB, fontSize: 38, letterSpacing: 6, color: CREAM}}>A GUESS</span></StrikeIn></div>
      <Lbl x={500} y={228} w={700} p={k(t, a.years + 0.1, 0.6)} size={24} c={GOLDL}>YEARS OF KNOWING HIM</Lbl>
      <Stg>
        <Ln d="M 110 300 L 880 300" p={ln} w={5} />
        {ln > 0.96 && <path d="M 862 284 L 886 300 L 862 316" stroke={GOLDL} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {[[290, tr], [710, mr]].map(([x, p], j) => p > 0 && <g key={j}><circle cx={x} cy={300} r={15 * p} fill={INK} stroke={GOLDL} strokeWidth={5} /><circle cx={x} cy={300} r={5 * p} fill={GOLDL} />
          <line x1={x} y1={318} x2={x} y2={318 + 26 * p} stroke={GOLDL} strokeWidth={3} opacity={0.6} /></g>)}
      </Stg>
      <Halo x={290} y={420} r={130} o={0.7 * tr} />
      <Icon name="scale" x={290} y={418} size={128} p={tr} sw={5} />
      <Lbl x={290} y={494} w={400} p={tr} size={32} c={GOLDL}>IN TRADE</Lbl>
      {a.subs && <Ital x={290} y={540} w={420} p={k(t, a.trade + 0.5, 0.5)} size={31}>the man she trusted</Ital>}
      <Halo x={710} y={420} r={130} o={0.7 * mr} />
      <Icon name="hearts" x={710} y={418} size={128} p={mr} sw={5} />
      <Lbl x={710} y={494} w={400} p={mr} size={32} c={GOLDL}>IN MARRIAGE</Lbl>
      {a.subs && <Ital x={710} y={540} w={420} p={k(t, a.marr + 0.35, 0.5)} size={31}>her husband</Ital>}
    </>
  );
};

// ---------- scene 3: the question (lines 9–10) ----------
const Question: React.FC<{t: number; a: {t0: number; seen: number}}> = ({t, a}) => {
  const eye = k(t, a.t0 - 0.1, 0.9), q = k(t, a.seen - 0.3, 0.6, outExpo), pulse = 1 + 0.06 * Math.sin((t - a.t0) * 4.2);
  return (
    <>
      <Lbl x={500} y={18} w={600} p={k(t, a.t0, 0.5)} size={26}>THE QUESTION IS SIMPLE</Lbl>
      <Halo x={500} y={250} r={250} o={0.75 * eye} />
      <Icon name="eye" x={500} y={250} size={300} p={eye} sw={6} scale={pulse} />
      <Big y={438} p={q} size={72} ls={5}>WHAT HAD SHE SEEN?</Big>
    </>
  );
};

// ---------- full version only ----------
const {ST: S, wt: W_} = mkT(FULL);

// scene 4: Makkah had been watching too · the Black Stone (lines 11–15)
const CL: [number, number][] = [[150, 170], [850, 170], [150, 470], [850, 470]];
const STONE: [number, number] = [588, 392];
const BlackStone: React.FC<{t: number}> = ({t}) => {
  const eyes = 1 - k(t, S[12] - 0.45, 0.4);
  const kb = k(t, S[12] - 0.05, 0.9), clans = (j: number) => k(t, S[13] - 0.1 + j * 0.12, 0.5, outBack);
  const disp = k(t, W_(13, 'dispute') - 0.1, 0.7), stone = k(t, W_(13, 'black') - 0.15, 0.5, outBack);
  const acc = k(t, S[14] + 0.3, 0.5), calm = 1 - k(t, S[14] + 0.1, 0.5), share = k(t, W_(15, 'share') - 0.4, 1.0, inOut);
  const ex = ['not', 'only', 'one', 'watching'];
  return (
    <>
      <div style={{opacity: eyes}}>
        {ex.map((w, j) => <Icon key={j} name="eye" x={170 + j * 220} y={290} size={150} p={k(t, (j === 0 ? S[11] : W_(11, w)) - 0.1, 0.6)} sw={5} c={j === 3 ? GOLDL : CREAM} />)}
        <Lbl x={500} y={420} w={900} p={k(t, W_(11, 'only') - 0.1, 0.6)} size={30} c={GOLDL}>MAKKAH HAD BEEN WATCHING TOO</Lbl>
      </div>
      <div style={{opacity: 1 - eyes}}>
        <Lbl x={500} y={6} w={900} p={kb} size={26}>QURAYSH REBUILD THE KA‘BAH</Lbl>
        <Halo x={500} y={320} r={230} o={0.55 * kb + 0.35 * share} />
        <Stg>
          <Ln d="M 412 232 L 588 232 L 588 410 L 412 410 Z" p={kb} w={6} />
          <Ln d="M 412 282 L 588 282" p={k(t, S[12] + 0.5, 0.6)} w={4} o={0.8} />
          <Ln d="M 412 296 L 588 296" p={k(t, S[12] + 0.6, 0.6)} w={2} o={0.6} />
          {/* the dispute: red lines between neighbouring clans */}
          {[[0, 1], [2, 3], [0, 2], [1, 3]].map(([p0, p1], j) => {const [x0, y0] = CL[p0], [x1, y1] = CL[p1]; const hz = y0 === y1;
            const d = hz ? `M ${x0 + 70} ${y0} L ${x1 - 70} ${y1}` : `M ${x0} ${y0 + 70} L ${x1} ${y1 - 70}`;
            return <Ln key={j} d={d} p={k(t, W_(13, 'dispute') - 0.1 + j * 0.12, 0.5)} w={4} c={RED} o={0.85 * calm} dash="12 12" />;})}
          {/* shared honour: every clan to the one stone */}
          {CL.map(([x, y], j) => <Ln key={j} d={`M ${x + (x < 500 ? 62 : -62)} ${y + (y < 320 ? 30 : -30)} L ${STONE[0] + (x < 500 ? -14 : 14)} ${STONE[1] + (y < 320 ? -12 : 12)}`} p={share} w={4} />)}
          {stone > 0 && <g transform={`translate(${STONE[0]} ${STONE[1]}) scale(${stone})`}><circle r={22} fill="#141414" stroke={GOLDL} strokeWidth={4} /><circle r={30} fill="none" stroke={GOLDL} strokeWidth={1.5} opacity={0.6} /></g>}
        </Stg>
        {CL.map(([x, y], j) => <React.Fragment key={j}>
          <Icon name="users" x={x} y={y - 8} size={84} p={clans(j)} sw={5} c={share > 0.6 ? GOLDL : CREAM} />
          <Lbl x={x} y={y + 38} w={200} p={clans(j)} size={19}>CLAN</Lbl></React.Fragment>)}
        <div style={{opacity: calm}}><Mark kind="x" x={500} y={170} size={64} p={disp * 1.2} sw={8} />
        <Mark kind="x" x={500} y={470} size={64} p={disp * 1.2 - 0.2} sw={8} /></div>
        <Lbl x={500} y={548} w={960} p={stone} size={27} c={CREAM} o={calm}>WHO PLACES THE BLACK STONE?</Lbl>
        <Lbl x={500} y={548} w={960} p={acc} size={27} c={GOLDL} o={1 - k(t, W_(15, 'share') - 0.3, 0.35)}>THEY ACCEPTED HIS JUDGEMENT</Lbl>
        <Lbl x={500} y={548} w={960} p={k(t, W_(15, 'share') + 0.1, 0.5)} size={27} c={GOLDL}>ALL SHARE THE HONOUR</Lbl>
        {calm < 0.5 && <Mark kind="check" x={500} y={100} size={86} p={acc} sw={10} />}
      </div>
    </>
  );
};

// scene 5: Hira, step by step (lines 16–20)
const STEPS = [
  {x: 125, icon: 'moon', a: 'TRUTHFUL', b: 'DREAMS'},
  {x: 375, icon: 'mountain', a: 'A RETREAT', b: 'AT HIRA'},
  {x: 625, icon: 'book', a: 'SURAT AL-‘ALAQ', b: 'THE OPENING WORDS'},
  {x: 875, icon: 'home', a: 'THE RETURN', b: 'HOME'},
];
const HiraSteps: React.FC<{t: number}> = ({t}) => {
  const intro = win(t, S[16] - 0.3, S[17] - 0.25, 0.3, 0.3);
  const on = [W_(18, 'truthful'), W_(18, 'a'), S[19], S[20]].map((x) => k(t, x - 0.1, 0.5));
  const strip = k(t, S[17] - 0.1, 0.6), card = win(t, S[19] + 0.15, S[20] - 0.05, 0.3, 0.3);
  return (
    <>
      <div style={{opacity: intro}}>
        <Halo x={500} y={270} r={250} o={0.8} />
        <Icon name="mountain" x={500} y={260} size={300} p={k(t, S[16] - 0.25, 0.8)} sw={6} />
        <Big y={440} p={k(t, S[16] - 0.1, 0.6, outExpo)} size={80} ls={8}>THEN CAME HIRA</Big>
      </div>
      <div style={{opacity: strip * (1 - 0.82 * card)}}>
        <Lbl x={500} y={10} w={940} p={strip} size={28} c={GOLDL}>‘A’ISHAH’S ACCOUNT, STEP BY STEP</Lbl>
        <Stg>{[0, 1, 2].map((j) => {const x0 = STEPS[j].x + 108, x1 = STEPS[j + 1].x - 110, p = k(t, W_(17, 'step') - 0.2 + j * 0.3, 0.5);
          return <g key={j} opacity={0.5 + 0.5 * on[j + 1]}><Ln d={`M ${x0} 310 L ${x1} 310`} p={p} w={4} c={on[j + 1] > 0.5 ? GOLDL : CREAM} />
            {p > 0.9 && <path d={`M ${x1 - 10} 300 L ${x1 + 2} 310 L ${x1 - 10} 320`} stroke={on[j + 1] > 0.5 ? GOLDL : CREAM} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />}</g>;})}</Stg>
        {STEPS.map((s, j) => {const ap = k(t, S[17] + 0.15 + j * 0.28, 0.5, outExpo), lit = on[j];
          return <React.Fragment key={j}>
            <Panel x={s.x - 105} y={110} w={210} h={420} p={ap} gold={lit > 0.5} />
            <div style={{position: 'absolute', left: s.x - 105, top: 128, width: 210, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 30, color: lit > 0.5 ? GOLDL : SLATE, opacity: ap}}>{j + 1}</div>
            <Halo x={s.x} y={282} r={110} o={0.8 * lit} />
            <Icon name={s.icon} x={s.x} y={282} size={130} p={ap} sw={5} c={lit > 0.5 ? GOLDL : SLATE} glow={lit > 0.5 ? 0.4 : 0} />
            <Lbl x={s.x} y={400} w={210} p={ap} size={j === 2 ? 17.5 : 22} c={lit > 0.5 ? GOLDL : SLATE}>{s.a}</Lbl>
            <Lbl x={s.x} y={400 + (j === 2 ? 30 : 34)} w={210} p={ap} size={j === 2 ? 14 : 22} c={lit > 0.5 ? CREAM : SLATE}>{s.b}</Lbl>
          </React.Fragment>;})}
      </div>
      {card > 0 && (() => {const ar = ((EX as any)['96:1'] as string).split(' '); const s = k(t, S[19] + 0.15, 0.6, outExpo);
        return <div style={{position: 'absolute', left: 90, top: 176, width: 820, opacity: card, transform: `translateY(${(1 - s) * 22}px)`,
          background: 'linear-gradient(180deg,#f6eedc,#ece0c4)', borderRadius: 14, padding: '22px 30px 26px', textAlign: 'center', boxSizing: 'border-box',
          boxShadow: `inset 0 0 0 1.5px ${GOLD}, inset 0 0 0 7px #f3e9d3, inset 0 0 0 8px ${GOLD}77, 0 26px 60px rgba(0,0,0,.55)`}}>
          <div style={{fontFamily: F.cinzelB, fontSize: 22, letterSpacing: 6, color: BROWN}}>SURAH AL-‘ALAQ  ·  96:1</div>
          <div dir="rtl" lang="ar" style={{fontFamily: F.quran, fontSize: 62, lineHeight: '136px', color: NAVY, whiteSpace: 'nowrap', display: 'flex', justifyContent: 'center', columnGap: 16}}>
            <span style={{color: BROWN}}>{'﴿'}</span>
            {ar.map((w, j) => {const p = k(t, S[19] + 0.3 + 0.1 * j, 0.45); return <span key={j} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 10}px)`}}>{w}</span>;})}
            <span style={{color: BROWN}}>{'﴾'}</span>
          </div>
        </div>;})()}
    </>
  );
};

// scene 6: two responses, kept closed (lines 21–24)
const Answers: React.FC<{t: number}> = ({t}) => {
  const L = k(t, S[21] - 0.1, 0.7, outExpo), R = k(t, S[23] - 0.1, 0.7, outExpo);
  const lockL = k(t, W_(22, 'witnessed') + 0.5, 0.5, outBack), lockR = k(t, W_(24, 'nawfal') + 0.4, 0.5, outBack);
  const card = (x: number, p: number, title: React.ReactNode, sub: React.ReactNode, subP: number, lock: number, n: string) => <>
    <Panel x={x - 205} y={70} w={410} h={480} p={p} gold />
    <Lbl x={x} y={96} w={380} p={p} size={17} c={SLATE}>{n}</Lbl>
    <Halo x={x} y={222} r={115} o={0.7 * p} />
    <Icon name="message-circle" x={x} y={222} size={140} p={p} sw={5} />
    <Lbl x={x} y={308} w={390} p={p} size={27} c={GOLDL}>{title}</Lbl>
    <Ital x={x} y={364} w={380} p={subP} size={31}>{sub}</Ital>
    <div style={{position: 'absolute', left: x - 150, top: 472, width: 300, height: 50, borderRadius: 25, border: `1.5px solid ${GOLD}`, background: 'rgba(7,12,23,.8)', opacity: clamp(lock * 1.4),
      transform: `scale(${0.85 + 0.15 * lock})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: F.cinzelB, fontSize: 17, letterSpacing: 2.4, color: GOLDL}}>
      <svg width={22} height={22} viewBox="0 0 24 24"><path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z M8 11v-4a4 4 0 1 1 8 0v4" stroke={GOLDL} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      READ IN THE SESSION</div>
  </>;
  return (
    <>
      <Lbl x={500} y={8} w={800} p={k(t, S[21] - 0.1, 0.5)} size={26}>TWO RESPONSES</Lbl>
      {card(270, L, <>KHADIJAH’S ANSWER</>, <>from what she had<br />witnessed in him</>, k(t, W_(22, 'from') - 0.1, 0.6), lockL, 'FIRST')}
      {card(730, R, <>WARAQAH IBN NAWFAL</>, <>a second response</>, k(t, S[23] + 0.3, 0.6), lockR, 'SECOND')}
    </>
  );
};

// scene 7: who believed next (lines 25–29)
const Believers: React.FC<{t: number}> = ({t}) => {
  const names: [string, number, number, number][] = [['‘ALI', 115, W_(26, 'ali'), 150], ['ZAYD IBN HARITHAH', 358, W_(26, 'zayd'), 296], ['ABU BAKR', 618, W_(26, 'abu'), 190]];
  const br = k(t, W_(28, 'first') - 0.5, 0.7, inOut), why = k(t, S[29] + 0.2, 0.6), inv = k(t, S[27] + 0.1, 0.6);
  return (
    <>
      <Big y={0} p={k(t, S[25] - 0.15, 0.6, outExpo)} size={56} ls={5}>WHO BELIEVED NEXT?</Big>
      <Pill x={500} y={96} w={300} p={k(t, S[25] + 0.25, 0.5)} size={24} solid>KHADIJAH</Pill>
      <Stg>
        {names.map(([, x, tt], j) => <Ln key={j} d={`M 500 152 L 500 186 L ${x} 186 L ${x} 216`} p={k(t, tt - 0.25, 0.5)} w={3} o={0.7} />)}
        <Ln d="M 40 292 L 40 316 L 713 316 L 713 292" p={br} w={4} c={RED} />
        <Ln d="M 716 241 L 738 241" p={inv} w={3} o={0.7} />
      </Stg>
      {names.map(([n, x, tt, w], j) => <Pill key={j} x={x} y={218} w={w} p={k(t, tt - 0.1, 0.45, outBack)} size={20.5}>{n}</Pill>)}
      <div style={{position: 'absolute', left: 40, top: 328, width: 673, textAlign: 'center', opacity: clamp(br * 2 - 1), fontFamily: F.cinzelB, fontSize: 30, letterSpacing: 4, color: RED}}>WHICH OF THE MEN CAME FIRST?</div>
      <div style={{position: 'absolute', left: 738, top: 218, width: 250, height: 46, borderRadius: 23, border: '1.5px dashed rgba(239,231,214,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: F.cinzelB, fontSize: 17.5, letterSpacing: 1.4, color: CREAM, opacity: clamp(inv * 1.5), transform: `scale(${0.9 + 0.1 * inv})`}}>+ THOSE HE INVITED</div>
      <Halo x={300} y={500} r={90} o={0.7 * why} />
      <Icon name="zoom-question" x={300} y={500} size={100} p={why} sw={5} />
      <Lbl x={610} y={470} w={480} p={why} size={27} c={GOLDL}>THE ACCOUNTS DIFFER</Lbl>
      <Ital x={610} y={510} w={480} p={k(t, W_(29, 'reasons') + 0.1, 0.5)} size={31}>and the reasons are worth knowing</Ital>
    </>
  );
};

// scene 8: the public call · two opposite answers (lines 30–35)
const Split: React.FC<{t: number}> = ({t}) => {
  const call = k(t, S[30] + 0.3, 0.7), safa = k(t, W_(30, 'at') - 0.05, 0.5);
  const lp = k(t, S[31] - 0.1, 0.6, outExpo), rp = k(t, S[32] - 0.1, 0.6, outExpo), nm = k(t, S[33] - 0.1, 0.5, outExpo);
  const both = k(t, S[34] - 0.05, 0.6), opp = k(t, S[35] - 0.05, 0.6, outBack), shrink = k(t, S[31] - 0.3, 0.5, inOut);
  return (
    <>
      <Halo x={mix(500, 500, shrink)} y={mix(240, 62, shrink)} r={mix(200, 70, shrink)} o={0.7 * call} />
      <Icon name="speakerphone" x={500} y={mix(240, 60, shrink)} size={mix(250, 96, shrink)} p={call} sw={5} />
      <Lbl x={500} y={mix(410, 116, shrink)} w={900} p={safa} size={mix(40, 22, shrink)} c={GOLDL}>THE PUBLIC CALL AT SAFA</Lbl>
      <Panel x={60} y={176} w={400} h={340} p={lp} gold />
      <Lbl x={260} y={196} w={380} p={lp} size={32} c={GOLDL}>KHADIJAH</Lbl>
      <Icon name="shield-heart" x={260} y={340} size={130} p={lp} sw={5} />
      <Lbl x={260} y={440} w={380} p={k(t, S[31] + 0.3, 0.5)} size={21}>REASSURED HIM</Lbl>
      <Panel x={540} y={176} w={400} h={340} p={rp} />
      <div style={{position: 'absolute', left: 540, top: 240, width: 400, textAlign: 'center', fontFamily: F.cinzelB, fontSize: 150, lineHeight: '180px', color: SLATE, opacity: rp * (1 - nm)}}>?</div>
      <Lbl x={740} y={196} w={380} p={nm} size={32}>ABU LAHAB</Lbl>
      <Icon name="hand-stop" x={740} y={340} size={130} p={nm} sw={5} c={CREAM} />
      <Lbl x={740} y={440} w={380} p={k(t, S[33] + 0.25, 0.5)} size={21}>A VERY DIFFERENT ANSWER</Lbl>
      <Stg>
        <Ln d="M 528 276 L 474 276" p={opp} w={6} />{opp > 0.9 && <path d="M 488 262 L 472 276 L 488 290" stroke={GOLDL} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        <Ln d="M 472 416 L 526 416" p={opp} w={6} c={RED} />{opp > 0.9 && <path d="M 512 402 L 528 416 L 512 430" stroke={RED} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      </Stg>
      <Pill x={500} y={540} w={640} p={both} size={21}>BOTH KNEW HIM BEFORE REVELATION</Pill>
      <div style={{position: 'absolute', left: 440, top: 306, width: 120, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clamp(opp)}}>
        <span style={{fontFamily: F.cinzelB, fontSize: 30, letterSpacing: 3, color: CREAM}}>VS</span></div>
    </>
  );
};

// ---------- last scene: the invitation (both versions) ----------
type CtaA = {hour: number; live: number; free: number; read?: number; follow?: number; market?: number; mount?: number; call?: number; title: number; date: number; reg: number; vend: number; url: string; cta: string};
const Cta: React.FC<{t: number; a: CtaA}> = ({t, a}) => {
  const titleP = k(t, a.title - 0.2, 0.7, outExpo), up = k(t, a.title - 0.45, 0.4, inOut);
  const route = a.follow === undefined ? 0 : win(t, a.follow - 0.2, a.title - 0.35, 0.4, 0.3), book = a.read === undefined ? 0 : win(t, a.read - 0.1, (a.follow ?? a.title) - 0.25, 0.35, 0.25);
  const stops: [number, string, string, number][] = [[170, 'scale', 'THE MARKETPLACE', a.market ?? 0], [500, 'mountain', 'THE MOUNTAIN', a.mount ?? 0], [830, 'speakerphone', 'THE FIRST PUBLIC CALL', a.call ?? 0]];
  const qx = a.market === undefined ? 0 : mix(mix(170, 500, k(t, a.mount! - 0.35, 0.5, inOut)), 830, k(t, a.call! - 0.1, 0.6, inOut));
  const pillY = mix(a.read === undefined ? 250 : 40, 8, up);
  return (
    <>
      {[['ONE HOUR', 210, a.hour], ['LIVE', 500, a.live], ['FREE', 760, a.free]].map(([s, x, tt], j) =>
        <Pill key={j} x={x as number} y={pillY} w={j === 0 ? 280 : 200} p={k(t, (tt as number) - 0.1, 0.45, outBack)} size={26}>{s}</Pill>)}
      {book > 0 && <div style={{opacity: book}}>
        <Halo x={500} y={300} r={180} o={0.7} />
        <Icon name="book-2" x={500} y={300} size={230} p={k(t, a.read! - 0.1, 0.8)} sw={6} />
        <Lbl x={500} y={450} w={900} p={k(t, a.read! + 0.2, 0.5)} size={30} c={GOLDL}>WE READ THE ACCOUNTS TOGETHER</Lbl>
      </div>}
      {route > 0 && <div style={{opacity: route}}>
        <Lbl x={500} y={130} w={900} p={k(t, a.follow! - 0.1, 0.5)} size={25}>ONE QUESTION, FOLLOWED THROUGH</Lbl>
        <Stg><Ln d="M 170 330 L 830 330" p={k(t, a.follow!, 1.0, inOut)} w={4} dash="3 15" /></Stg>
        {stops.map(([x, ic, lb, tt], j) => {const p = k(t, tt - 0.2, 0.6); return <React.Fragment key={j}>
          <Halo x={x} y={330} r={110} o={0.7 * p} />
          <div style={{position: 'absolute', left: x - 70, top: 260, width: 140, height: 140, borderRadius: '50%', background: NAVY, border: `2px solid ${GOLD}`, opacity: clamp(p * 1.5)}} />
          <Icon name={ic} x={x} y={330} size={88} p={p} sw={5} />
          <Lbl x={x} y={418} w={j === 2 ? 330 : 300} p={p} size={19} c={GOLDL}>{lb}</Lbl></React.Fragment>;})}
        <div style={{position: 'absolute', left: qx - 26, top: 204, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(180deg,#f3d48e,#d6a54c)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: F.cinzelB, fontSize: 32, color: INK, opacity: k(t, a.market! - 0.3, 0.3), boxShadow: '0 6px 18px rgba(0,0,0,.5)'}}>?</div>
      </div>}
      <Lbl x={500} y={116} w={900} p={titleP} size={22}>A FREE LIVE SESSION WITH YASSER FARES</Lbl>
      <Big y={168} p={titleP} size={84} ls={4}>WHAT DID</Big>
      <Big y={262} p={k(t, a.title - 0.05, 0.7, outExpo)} size={84} ls={4}>KHADIJAH KNOW?</Big>
      <Lbl x={500} y={392} w={940} p={k(t, a.date - 0.1, 0.6)} size={34} c={CREAM}>WEEKEND OF 12–13 DECEMBER 2026</Lbl>
      <Pill x={500} y={470} w={620} p={k(t, a.reg - 0.1, 0.5, outBack)} size={27} solid>{a.cta}</Pill>
      <Reveal p={k(t, a.reg + 0.25, 0.5)} style={{left: 0, top: 548, width: SW, textAlign: 'center'}}>
        <div style={{fontFamily: F.plex, fontSize: 32, letterSpacing: 0.5, color: CREAM}}>{a.url}</div></Reveal>
      <div style={{position: 'absolute', left: 0, top: 600, width: SW, textAlign: 'center', fontFamily: F.plex, fontSize: 15, color: SLATE, opacity: 0.8 * k(t, a.vend, 0.6)}}>Narration: Yasser Fares (AI voice clone)</div>
    </>
  );
};

// ---------- background, chrome, captions ----------
const Background: React.FC<{t: number}> = ({t}) => {
  const {W, H} = React.useContext(Ctx);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${INK} 0%, ${NAVY} 46%, ${INK} 100%)`}}>
      <div style={{position: 'absolute', left: W * -0.22, top: H * 0.2, width: W * 1.44, height: H * 0.6,
        background: 'radial-gradient(closest-side, rgba(40,62,104,.55) 0%, rgba(40,62,104,0) 100%)'}} />
      <div style={{position: 'absolute', left: W * -0.3, top: H * 0.62, width: W * 1.6, height: H * 0.62,
        background: 'radial-gradient(closest-side, rgba(222,166,82,.28) 0%, rgba(222,166,82,.09) 45%, rgba(222,166,82,0) 100%)', opacity: 0.9 + 0.1 * Math.sin(t * 0.6)}} />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" /><feColorMatrix type="saturate" values="0" /></filter></defs>
        <rect width={W} height={H} filter="url(#grain)" opacity={0.045} /></svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(7,12,23,0) 52%, rgba(4,7,14,.78) 100%)'}} />
    </AbsoluteFill>
  );
};
const Sweep: React.FC<{t: number; t0: number; d?: number}> = ({t, t0, d = 0.9}) => {
  const p = (t - t0) / d; if (p <= 0 || p >= 1) return null;
  return <AbsoluteFill style={{mixBlendMode: 'screen', opacity: Math.sin(p * Math.PI) * 0.5,
    background: `linear-gradient(105deg, rgba(0,0,0,0) ${mix(-30, 100, inOut(p))}%, rgba(241,208,138,.28) ${mix(-15, 115, inOut(p))}%, rgba(0,0,0,0) ${mix(0, 130, inOut(p))}%)`}} />;
};
const Chrome: React.FC<{t: number}> = ({t}) => {
  const {W, portrait, tl} = React.useContext(Ctx);
  const bar = clamp(t / tl.voice_end) * 100;
  return portrait ? (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 236, width: W, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24}}>
        <div style={{width: 170, height: 1.5, background: `linear-gradient(90deg, ${GOLD}00, ${GOLD})`}} />
        <div style={{fontFamily: F.cinzelB, fontSize: 32, letterSpacing: 11, color: GOLD}}>YASSER FARES</div>
        <div style={{width: 170, height: 1.5, background: `linear-gradient(90deg, ${GOLD}, ${GOLD}00)`}} />
      </div>
      <div style={{position: 'absolute', top: 290, width: W, textAlign: 'center', fontFamily: F.cinzel, fontSize: 23, letterSpacing: 7, color: CREAM, opacity: 0.72}}>A FREE LIVE SESSION &nbsp;·&nbsp; 12–13 DECEMBER</div>
      <div style={{position: 'absolute', top: 1512, left: 160, width: W - 320, height: 2, background: 'rgba(201,164,87,.18)', borderRadius: 2}}><div style={{width: `${bar}%`, height: 2, background: GOLDL, borderRadius: 2}} /></div>
    </AbsoluteFill>
  ) : (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 44, left: 72, display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={{fontFamily: F.cinzelB, fontSize: 27, letterSpacing: 9, color: GOLD}}>YASSER FARES</div>
        <div style={{width: 120, height: 1.5, background: `linear-gradient(90deg, ${GOLD}, ${GOLD}00)`}} />
      </div>
      <div style={{position: 'absolute', top: 48, right: 72, fontFamily: F.cinzel, fontSize: 20, letterSpacing: 6, color: CREAM, opacity: 0.72}}>A FREE LIVE SESSION &nbsp;·&nbsp; 12–13 DECEMBER</div>
      <div style={{position: 'absolute', top: 1046, left: 72, width: W - 144, height: 2, background: 'rgba(201,164,87,.18)', borderRadius: 2}}><div style={{width: `${bar}%`, height: 2, background: GOLDL, borderRadius: 2}} /></div>
    </AbsoluteFill>
  );
};
const rows = (ws: Word[], key: string | undefined, max: number): Word[][] => {
  const L = (w: string) => (w === key ? 1.4 : 1) * w.length + 1; const tot = ws.reduce((s, w) => s + L(w[0]), 0);
  if (tot <= max) return [ws];
  let best = 1, bd = 1e9, acc = 0;
  for (let j = 1; j < ws.length; j++) {acc += L(ws[j - 1][0]); const d = Math.abs(acc - (tot - acc)); if (d < bd) {bd = d; best = j;}}
  return [ws.slice(0, best), ws.slice(best)];
};
const Caption: React.FC<{t: number; i: number}> = ({t, i}) => {
  const {W, tl, key, cap} = React.useContext(Ctx); const LN = tl.lines;
  const nxt = i + 1 < LN.length ? LN[i + 1].start - 0.1 : tl.voice_end - 0.05;
  const a = win(t, LN[i].start - 0.12, nxt, 0.12, 0.16); if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', top: cap.top, left: 60, width: W - 120, height: cap.h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: a}}>
      {rows(LN[i].words, key[i], cap.max).map((r, ri) => (
        <div key={ri} style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', columnGap: cap.gap, height: cap.row}}>
          {r.map(([w, s], j) => {
            const p = k(t, s - 0.08, 0.28); const isKey = w === key[i];
            return <span key={j} style={{fontFamily: isKey ? F.it : F.body, fontSize: isKey ? cap.key : cap.fs, lineHeight: `${cap.row}px`, fontStyle: isKey ? 'italic' : 'normal', fontWeight: isKey ? 600 : 400,
              display: 'inline-block', whiteSpace: 'pre', opacity: p, transform: `translateY(${(1 - p) * 14}px)`, paddingRight: isKey ? 6 : 0,
              ...(isKey ? goldText : {color: CREAM}), filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.6))'}}>{w}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

// ---------- assembly ----------
const Ctx = React.createContext<Lay>(null as any);
type Scn = [number, number, (t: number) => React.ReactNode];
const Frame: React.FC<{t: number; scenes: Scn[]; sweeps: number[]; capFrom?: number; capTo?: number}> = ({t, scenes, sweeps, capFrom = 0, capTo = 999}) => {
  const lay = React.useContext(Ctx);
  return (
    <AbsoluteFill>
      <Background t={t} />
      <div style={{position: 'absolute', left: lay.sx, top: lay.sy, width: SW, height: SH, transform: `scale(${lay.ss})`, transformOrigin: '0 0'}}>
        {scenes.map(([a0, a1, render], j) => {
          const a = j === 0 ? (t <= a1 - 0.3 ? 1 : clamp((a1 - t) / 0.3)) : win(t, a0, a1, 0.35, 0.3); if (a <= 0) return null;
          const push = 1 + 0.02 * clamp((t - Math.max(a0, 0)) / (a1 - Math.max(a0, 0))) + (j === 0 ? 0 : 0.03 * (1 - k(t, a0, 0.5)));
          return <div key={j} style={{position: 'absolute', left: 0, top: 0, width: SW, height: SH, opacity: a, transform: `scale(${push})`, transformOrigin: `${SW / 2}px ${SH / 2}px`}}>{render(t)}</div>;
        })}
      </div>
      {lay.tl.lines.map((_, i) => (i >= capFrom && i <= capTo ? <Caption key={i} t={t} i={i} /> : null))}
      <Chrome t={t} />
      {sweeps.map((s, j) => <Sweep key={j} t={t} t0={s} />)}
    </AbsoluteFill>
  );
};

const KEYF: Record<number, string> = {0: 'trembling.', 1: 'revelation.', 2: 'wife.', 3: 'reassures', 4: 'Khadijah.', 5: 'guess.', 6: 'years:', 7: 'trade,', 8: 'husband.', 9: 'question', 10: 'seen?',
  11: 'watching.', 12: 'the Ka‘bah,', 13: 'dispute', 14: 'judgement.', 15: 'honour.', 16: 'Hira.', 17: '‘A’ishah', 18: 'dreams,', 19: 'al-‘Alaq,', 20: 'home.', 21: 'listens.', 22: 'witnessed',
  23: 'second', 24: 'Waraqah', 25: 'next?', 27: 'invited.', 28: 'first', 29: 'knowing.', 30: 'public,', 31: 'before', 32: 'different', 33: 'Lahab.', 34: 'knew', 35: 'opposite', 36: 'free.',
  37: 'together,', 38: 'question', 39: 'mountain,', 40: 'call.', 41: 'Khadijah', 42: 'December.', 43: 'yasserfares.com'};
const FULL_SCN: Scn[] = [
  [-1, S[4] - 0.05, (t) => <Hook t={t} a={{trem: W_(0, 'trembling'), rev: S[1], wife: S[2], reass: S[3]}} />],
  [S[4] - 0.3, S[9] - 0.05, (t) => <Known t={t} a={{name: S[4], guess: S[5], guessW: W_(5, 'guess'), years: S[6], trade: S[7], marr: S[8], subs: true}} />],
  [S[9] - 0.3, S[11] - 0.05, (t) => <Question t={t} a={{t0: S[9], seen: S[10]}} />],
  [S[11] - 0.3, S[16] - 0.05, (t) => <BlackStone t={t} />],
  [S[16] - 0.3, S[21] - 0.05, (t) => <HiraSteps t={t} />],
  [S[21] - 0.3, S[25] - 0.05, (t) => <Answers t={t} />],
  [S[25] - 0.3, S[30] - 0.05, (t) => <Believers t={t} />],
  [S[30] - 0.3, S[36] - 0.05, (t) => <Split t={t} />],
  [S[36] - 0.35, FULL.total + 1, (t) => <Cta t={t} a={{hour: W_(36, 'one'), live: W_(36, 'live'), free: W_(36, 'free'), read: S[37], follow: S[38], market: W_(39, 'marketplace'), mount: W_(39, 'mountain'),
    call: W_(40, 'first'), title: S[41], date: S[42], reg: S[43], vend: FULL.voice_end, url: 'yasserfares.com/khadijah', cta: 'FREE · SAVE YOUR SEAT'}} />],
];
export const Web01: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const fade = clamp((FULL.total - t) / 0.5);
  return (
    <Ctx.Provider value={LAND(FULL, KEYF)}>
      <AbsoluteFill style={{background: INK}}><AbsoluteFill style={{opacity: fade}}>
        <Frame t={t} scenes={FULL_SCN} sweeps={[S[4] - 0.55, S[11] - 0.55, S[16] - 0.55, S[25] - 0.55, S[30] - 0.55, S[36] - 0.55, S[41] - 0.5]} capTo={43} />
      </AbsoluteFill></AbsoluteFill>
    </Ctx.Provider>
  );
};

const {ST: Q, wt: Wq} = mkT(SHORT);
const KEYS: Record<number, string> = {0: 'trembling.', 1: 'revelation.', 2: 'Khadijah.', 3: 'reassures', 4: 'guess.', 5: 'years,', 6: 'marriage.', 7: 'seen?', 8: 'free.', 9: 'Khadijah', 10: 'December.', 11: 'link.'};
const SHORT_SCN: Scn[] = [
  [-1, Q[4] - 0.05, (t) => <Hook t={t} a={{trem: Wq(0, 'trembling'), rev: Q[1], wife: Q[2], name: Wq(2, 'khadijah'), reass: Q[3]}} />],
  [Q[4] - 0.3, Q[7] - 0.05, (t) => <Known t={t} a={{guess: Q[4], guessW: Wq(4, 'guess'), years: Q[5], trade: Wq(6, 'trade'), marr: Wq(6, 'marriage')}} />],
  [Q[7] - 0.35, Q[8] - 0.2, (t) => <Question t={t} a={{t0: Q[7] - 0.15, seen: Wq(7, 'what') + 0.1}} />],
  [Q[8] - 0.25, SHORT.total + 1, (t) => <Cta t={t} a={{hour: Wq(8, 'one'), live: Wq(8, 'live'), free: Wq(8, 'free'), title: Q[9], date: Q[10], reg: Q[11], vend: SHORT.voice_end, url: 'yasserfares.com/khadijah', cta: 'FREE · LINK IN BIO'}} />],
];
export const Web01S: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const loop = clamp((t - (SHORT.total - 0.5)) / 0.4);
  const one = (tt: number) => <Frame t={tt} scenes={SHORT_SCN} sweeps={[Q[4] - 0.55, Q[8] - 0.5]} capTo={11} />;
  return (
    <Ctx.Provider value={PORT(SHORT, KEYS)}>
      <AbsoluteFill style={{background: INK}}>{one(t)}{loop > 0 && <AbsoluteFill style={{opacity: loop}}>{one(0)}</AbsoluteFill>}</AbsoluteFill>
    </Ctx.Provider>
  );
};
