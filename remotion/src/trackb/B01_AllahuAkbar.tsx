import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import TL from './timeline_b01.json';
import {
  FPS, W, H, GROUND, C, FT, loadFonts, tl, k, win, mix, clamp, inOut, outBack, outCubic,
  Figure, P, lerpPose, Pose, chestAt, headAt, Heart, Cloud, Phone, Trophy, Boulder, Bubble, Glyph, Captions, SeriesLabel,
  moodAt, Sky, Ground, camTransform, toScreen, Cam, stroll, settle, Rain, PhraseWords, walkByDistance,
} from './kit';

// =====================================================================================
// Track B · 01 · اللهُ أَكْبَرُ (Allahu Akbar), v2 (kit v2: camera, moods, walking, trails)
// From "My Prayer" by Yasser Fares, Ch.4 "The Opening Takbir: From the Call to the Answer", printed p.31–32.
// Hook (hookscore 66.2 → 93.8): "Allahu Akbar is not only 'Allah is great.' You've been saying 'greater.'"
//
// WORLD: one long road. x=540 the start · 1300 fear · 1860 desire · 2420 judgement · 2980 success · 3540 sin.
// MOODS: dawn (hook) → dusk (the things that compete) → gold (Allahu Akbar rises) → night (prayer) → dawn (callback).
//
// STORYBOARD (line → picture → what it says)
//  0  hook            → dawn; he raises his hands in takbir; اللهُ / أَكْبَرُ drop in word by word        → the opening words
//  1  "greater"       → the phrase swells with overshoot; slow push-in                                   → "akbar" is a comparison
//  2  greater than what? → hands drop, he looks around; camera pulls back; a big "?" swings in; the phrase lifts away
//  3  fear            → he walks right (camera travels with him); dusk falls; a storm cloud rises behind, rain on him; he turns and cowers
//  4  desire          → he walks on; a glowing phone pops up and pulls his hand on a string; he leans after it
//  5  judgement       → he walks on; a tall teal figure rises and points down; he shrinks
//  6  success         → he walks on, growing back; a trophy on a podium rises and shines; he reaches
//  7  sin vs mercy    → he walks on; a boulder drops in, lands and grows; he kneels; a tiny heart (mercy) glows beside him
//  8  every comparison → camera pulls far back over the whole road: all five things, small; gold light; he stands and raises his hands; the phrase drops in large
//  9  rises above it  → the phrase climbs and grows; the sun rises behind it; the five things shrink to half
// 10  nothing rivals  → light opens around the phrase
// 11  mind wanders    → the camera flies back down to him; night; he stands in prayer (cream on navy); thought bubbles pop out; his heart drifts toward one
// 12  don't be harsh  → he stays still, head bowed softly; stars
// 13–14 bring it back → his heart glides home along a soft curve
// 15–16 callback     → dawn returns; he raises his hands again; the phrase drops in; the thoughts pop one by one
// 17–18 end card     → series promise + follow + book line; the last half second is the frame-1 picture (loop)
// =====================================================================================

loadFonts();
const {L, ST, wt, TOTAL} = tl(TL);
export {TOTAL, FPS};

const AR = [
  '«اللهُ أكبر» ليست فقط «اللهُ عظيم».', 'أنت تقول: «أكبر».', 'أكبرُ من ماذا؟', 'من الخوف الذي يطاردك.', 'من الرغبة التي تريد أن تُطاع.',
  'من الشخص الذي يُثقِلك حُكمُه عليك.', 'من النجاح الذي يُغريك.', 'حتى الذنب الذي تظنّه أكبرَ من رحمته.', '«اللهُ أكبر» تفتح كلَّ مقارنة،', 'ثم تعلو عليها.',
  'لا شيء يُضاهي عظمةَ الله.', 'فإذا شرد ذهنُك في الصلاة،', 'فلا تقسُ على نفسك.', 'أعِد قلبك برفق،', 'إلى الكلمات الأولى.', 'اللهُ أكبر.',
  'أكبرُ من هذه الفكرة أيضًا.', 'كلَّ يوم، عبارةٌ من صلاتك.', 'تابعنا للعبارة القادمة.',
];
const KEY_EN = [['great'], ['greater'], ['what'], ['fear'], ['desire'], ['judgement'], ['success'], ['sin', 'mercy'], ['comparison'], ['rises'], ['nothing'],
  ['wanders'], ['harshly'], ['gently'], ['first'], ['allahu', 'akbar'], ['thought'], ['every', 'day'], ['follow']];
const KEY_AR = [['عظيم'], ['أكبر'], ['ماذا'], ['الخوف'], ['الرغبة'], ['حُكمُه'], ['النجاح'], ['الذنب', 'رحمته'], ['مقارنة'], ['تعلو'], ['لا شيء'],
  ['شرد'], ['تقسُ'], ['برفق'], ['الأولى'], ['اللهُ أكبر'], ['الفكرة'], ['كلَّ يوم'], ['تابعنا']];
const WORDS = ['اللهُ', 'أَكْبَرُ'];   // trackb/phrases.json: takbir, entered word by word

const HS = 1.35;
const X = {start: 540, fear: 1300, des: 1860, jud: 2420, suc: 2980, sin: 3540};
const OBJ = {cloud: 1120, phone: 2130, tall: 2700, trophy: 3240, boulder: 3820};
const TAKLOW = lerpPose(P.stand, P.takbir, 0.93);

// ---------------- the hero, as a function of time (so trails and head lag can sample it) ----------------
type Hero = {x: number; pose: Pose; s: number; flip: boolean};
const heroRaw = (t: number): Hero => {
  let x = X.start, pose: Pose = P.takbir, s = 1, flip = false;
  if (t < ST[2]) pose = settle(TAKLOW, P.takbir, t, 0, 0.5);
  else if (t < ST[3] - 0.75) {
    pose = settle(P.takbir, P.lookup, t, ST[2], 0.4);
    pose = {...pose, head: pose.head + 14 * Math.sin((t - ST[2]) * 7) * k(t, ST[2] + 0.25, 0.25)};
  } else if (t < ST[4] - 0.35) {   // walk to the fear spot, then turn back to the cloud and cower
    const w = stroll(t, ST[3] - 0.75, ST[3] + 0.2, X.start, X.fear, P.stand, HS); x = w.x; pose = w.pose;
    if (t > ST[3] + 0.2) {pose = settle(P.stand, P.cower, t, ST[3] + 0.2, 0.4); flip = true; x += 2.5 * Math.sin(t * 45) * k(t, ST[3] + 0.4, 0.3);}
  } else if (t < ST[5] - 0.35) {   // desire
    const w = stroll(t, ST[4] - 0.35, ST[4] + 0.4, X.fear, X.des, P.stand, HS); x = w.x; pose = w.pose;
    if (t > ST[4] + 0.4) {const d = 60 * k(t, ST[4] + 0.6, 1.3, inOut); x = X.des + d; pose = walkByDistance(settle(P.stand, P.pulled, t, ST[4] + 0.4, 0.4), d, HS, 0.5);}
  } else if (t < ST[6] - 0.3) {   // judgement
    const w = stroll(t, ST[5] - 0.35, ST[5] + 0.4, X.des + 60, X.jud, P.stand, HS); x = w.x; pose = w.pose;
    if (t > ST[5] + 0.4) {pose = settle(P.stand, P.small, t, ST[5] + 0.4, 0.5); s = mix(1, 0.6, k(t, ST[5] + 0.5, 0.9, inOut));}
  } else if (t < ST[7] - 0.3) {   // success
    const w = stroll(t, ST[6] - 0.3, ST[6] + 0.4, X.jud, X.suc, P.stand, HS); x = w.x; pose = w.pose; s = mix(0.6, 1, k(t, ST[6] - 0.3, 0.6, inOut));
    if (t > ST[6] + 0.4) {pose = settle(P.stand, P.reach, t, ST[6] + 0.4, 0.4); pose = {...pose, aR: [pose.aR[0] + 9 * Math.sin(t * 7), pose.aR[1] + 9 * Math.sin(t * 7)]};}
  } else if (t < ST[8] - 0.1) {   // sin
    const w = stroll(t, ST[7] - 0.3, ST[7] + 0.4, X.suc, X.sin, P.stand, HS); x = w.x; pose = w.pose;
    if (t > ST[7] + 0.4) pose = settle(P.stand, P.kneel, t, ST[7] + 0.4, 0.55);
  } else if (t < ST[11] - 0.3) {   // stands and raises his hands
    x = X.sin; pose = t < ST[8] + 0.35 ? settle(P.kneel, P.stand, t, ST[8] - 0.1, 0.45) : settle(P.stand, P.takbir, t, ST[8] + 0.35, 0.5);
  } else if (t < ST[15] - 0.25) {   // prayer
    x = X.sin; pose = settle(P.takbir, P.folded, t, ST[11] - 0.3, 0.55);
    if (t > ST[12]) pose = {...pose, head: pose.head + 12 * k(t, ST[12], 0.7, inOut)};
  } else {
    x = X.sin; pose = settle({...P.folded, head: 20}, P.takbir, t, ST[15] - 0.25, 0.5);
  }
  pose = {...pose, lean: pose.lean + 0.9 * Math.sin(t * 1.7)};   // breathing
  return {x, pose, s: s * HS, flip};
};
const hero = (t: number): Hero => {
  const h = heroRaw(t), lag = heroRaw(t - 0.08);
  return {...h, pose: {...h.pose, head: mix(h.pose.head, lag.pose.head, 0.5)}};   // the head follows a beat late
};

// ---------------- camera ----------------
const camAtT = (t: number): Cam => {
  const follow = (tt: number) => {const a = heroRaw(tt + 0.1).x, b = heroRaw(tt).x; return mix(b, a, 0.6) + 40;};
  if (t < ST[2]) return {x: X.start, y: 960, z: 1 + 0.06 * k(t, 0, ST[2], (q) => q)};
  if (t < ST[3] - 0.75) {const p = k(t, ST[2] + 0.05, 0.55, inOut); return {x: X.start, y: mix(960, 920, p), z: mix(1.06, 0.88, p)};}
  if (t < ST[8] - 0.35) {
    const p = k(t, ST[3] - 0.75, 0.6, inOut);
    const ends = [ST[4], ST[5], ST[6], ST[7], ST[8]];
    const enc = [ST[3], ST[4], ST[5], ST[6], ST[7]].reduce((a, s0, i) => a + 0.07 * win(t, s0 + 0.35, ends[i] - 0.35, 0.6, 0.35), 0);
    return {x: follow(t), y: mix(920, 960, p) - 40 * enc, z: mix(0.88, 1, p) + enc};
  }
  if (t < ST[11] - 0.5) {   // pull far back over the whole road
    const p = k(t, ST[8] - 0.35, 1.2, inOut); const z = Math.exp(mix(Math.log(1.0), Math.log(0.3), p));
    const x = mix(follow(ST[8] - 0.35), 2250, p) + 70 * k(t, ST[9], 4, inOut);
    return {x, y: mix(960, 207, p), z};
  }
  if (t < ST[15] - 0.3) {   // fly back down to him; slow push-in during the prayer
    const p = k(t, ST[11] - 0.5, 1.1, inOut); const z = Math.exp(mix(Math.log(0.3), Math.log(1.1), p)) + 0.1 * k(t, ST[11] + 0.6, ST[15] - ST[11], inOut);
    return {x: mix(2320, X.sin + 30, p), y: mix(207, 1000, p), z};
  }
  const p = k(t, ST[15] - 0.3, 0.7, inOut);
  return {x: mix(X.sin + 30, X.sin, p), y: mix(1000, 960, p), z: mix(1.2, 1, p)};
};

export const B01: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const loopIn = k(t, TOTAL - 0.55, 0.5, inOut);   // the last half second becomes frame 1 (seamless loop)
  const m = moodAt(t, [[0, 'dawn'], [ST[3], 'dusk'], [ST[8] + 0.2, 'gold'], [ST[11], 'night'], [ST[15], 'dawn']]);
  const night = win(t, ST[11] - 0.2, ST[15] + 0.2, 0.6, 0.6);
  let cam = camAtT(t);
  const H0 = hero(t), Hp = hero(t - 1 / 30), Hpp = hero(t - 2 / 30);
  const hx = H0.x;
  if (loopIn > 0) cam = {x: mix(cam.x, hx, loopIn), y: mix(cam.y, 960, loopIn), z: mix(cam.z, 1, loopIn)};
  const speed = Math.abs(H0.x - Hp.x);

  // sun: dawn sun near the start, gold sun rising behind the phrase, dawn sun again at the end
  const sunO = (1 - k(t, ST[3] - 0.6, 0.6)) + win(t, ST[8] + 0.2, ST[11] - 0.2, 0.8, 0.5) + k(t, ST[15], 0.8);
  const sunPos = t < ST[8] ? [X.start + 220, 1330] : t < ST[11] ? [2300, mix(1500, -300, k(t, ST[9] - 0.2, 2.2, inOut))] : [X.sin + 220, 1330];

  // ---------------- the things ----------------
  const shrinkAll = 1 - 0.5 * k(t, ST[9], 1.1, inOut);
  const thingsO = 1 - k(t, ST[11] - 0.4, 0.6);
  const cloudS = (t < ST[3] - 0.25 ? 0 : mix(0.4, 1.15, k(t, ST[3] - 0.25, 1.4, outCubic))) * shrinkAll;
  const rainO = win(t, ST[3] + 0.05, ST[4] + 0.6, 0.3, 0.6) + 0.35 * win(t, ST[4] + 0.6, ST[8] + 1.5, 0.4, 0.6);
  const phoneS = (t < ST[4] - 0.15 ? 0 : outBack(k(t, ST[4] - 0.15, 0.45, (q) => q)) * 1.1) * shrinkAll;
  const tallS = (t < ST[5] - 0.1 ? 0 : mix(1.6, 2.2, k(t, ST[5] - 0.1, 1.3, inOut))) * shrinkAll;
  const tallRise = k(t, ST[5] - 0.1, 0.5, outBack);
  const tropS = (t < ST[6] - 0.15 ? 0 : outBack(k(t, ST[6] - 0.15, 0.5, (q) => q)) * 1.15) * shrinkAll;
  const bDrop = k(t, ST[7] - 0.1, 0.42, (q) => clamp(q) * clamp(q));   // falls (accelerating), lands with a small bounce, then grows
  const bS = (t < ST[7] - 0.1 ? 0 : mix(0.75, 1.35, k(t, ST[7] + 0.4, 1.8, inOut))) * shrinkAll;
  const sinceLand = t - (ST[7] + 0.32);
  const bY = GROUND - (1 - bDrop) * 900 - (sinceLand > 0 && sinceLand < 0.3 ? 18 * Math.sin((sinceLand / 0.3) * Math.PI) : 0);
  const mercyP = k(t, wt(7, 'mercy') - 0.1, 0.35, outBack) * (1 - k(t, ST[8], 0.4));
  const dusk = 1 - night;

  // ---------------- the phrase (screen space) ----------------
  let words = {enter: [-0.42, -0.3], y: 770, scale: 1, glow: 0.2, out: 0};
  const sw = win(t, wt(1, 'greater') - 0.05, wt(1, 'greater') + 0.75, 0.16, 0.55);
  if (t < ST[8] - 0.2) words = {...words, scale: 1 + 0.16 * sw, out: k(t, ST[2] + 0.05, 0.55)};
  else if (t < ST[11] - 0.35) words = {enter: [ST[8] - 0.12, ST[8] + 0.28], y: 760 - 140 * k(t, ST[9], 1.1, inOut), scale: 1 + 0.3 * k(t, ST[9], 1.1, inOut), glow: 0.25 + 0.9 * k(t, ST[10], 0.8), out: 0};
  else if (t < ST[15] - 0.15) words = {enter: [ST[8], ST[8]], y: 620, scale: 1.3, glow: 1.1, out: k(t, ST[11] - 0.35, 0.5)};
  else words = {enter: [ST[15] - 0.12, ST[15] + 0.25], y: 740, scale: 1, glow: 0.35, out: 0};
  if (loopIn > 0) words = {...words, y: mix(words.y, 770, loopIn), scale: mix(words.scale, 1, loopIn), glow: mix(words.glow, 0.2, loopIn)};
  const rays = win(t, ST[10] - 0.1, ST[11] - 0.25, 0.6, 0.35);

  // ---------------- "?" ----------------
  const qO = win(t, ST[2] - 0.05, ST[3] - 0.5, 0.12, 0.3), qS = outBack(k(t, ST[2] - 0.05, 0.4, (x) => x));

  // ---------------- thoughts in prayer (world space, around his head) ----------------
  const head = headAt(hx, H0.pose, H0.s);
  const BUB: {dx: number; dy: number; kind: 'clock' | 'phone' | 'bill' | 'chat'; at: number}[] = [
    {dx: -300, dy: 60, kind: 'phone', at: wt(11, 'wanders')},
    {dx: 300, dy: 20, kind: 'clock', at: wt(11, 'prayer') - 0.1},
    {dx: -270, dy: -170, kind: 'bill', at: ST[12] - 0.1},
    {dx: 290, dy: -200, kind: 'chat', at: ST[12] + 0.5},
  ];
  const POP = [2, 3, 0, 1];
  const popAt = (n: number) => ST[15] + 0.1 + POP[n] * 0.3;
  const bub = (n: number) => {
    const b = BUB[n]; const inn = k(t, b.at, 0.4, outBack); const out = k(t, popAt(n), 0.2, inOut);
    return {o: clamp(inn * 3) * (1 - out) * (t < ST[11] ? 0 : 1), s: inn * (1 - out * 0.85), x: X.sin + b.dx + 8 * Math.sin(t * 1.3 + n), y: 1040 + b.dy + 10 * Math.sin(t * 1.1 + n * 2)};
  };
  const chest = chestAt(hx, H0.pose, H0.s);
  const b0 = bub(0);
  const away = k(t, wt(11, 'wanders') + 0.25, 1.4, inOut), back = k(t, wt(13, 'back') - 0.15, 2.0, inOut);
  const hp = away * (1 - back);
  const target = [b0.x + 55, b0.y + 75];
  const ctrl = [mix(chest[0], target[0], 0.5), Math.min(chest[1], target[1]) - 160];
  const bez = (u: number) => [(1 - u) ** 2 * chest[0] + 2 * (1 - u) * u * ctrl[0] + u * u * target[0], (1 - u) ** 2 * chest[1] + 2 * (1 - u) * u * ctrl[1] + u * u * target[1]];
  const hPos = bez(hp);
  const hO = k(t, ST[11] - 0.1, 0.4) * (1 - k(t, ST[15] + 0.2, 0.4));
  const sparks = (n: number) => win(t, popAt(n), popAt(n) + 0.45, 0.05, 0.3);

  // ---------------- end card ----------------
  const endO = k(t, ST[17] - 0.2, 0.4) * (1 - loopIn);
  const [qx, qy] = toScreen(cam, X.start + 260, 1130);

  return (
    <AbsoluteFill style={{background: m.sky1}}>
      <Sky m={m} cam={cam} t={t} sunX={sunPos[0]} sunY={sunPos[1]} sun={clamp(sunO)} stars={night} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g transform={camTransform(cam)}>
          <Ground m={m} />
          {/* 3 fear: cloud + rain */}
          {cloudS > 0 && <g opacity={thingsO}><Cloud x={OBJ.cloud} y={mix(1150, 930, k(t, ST[3] - 0.25, 1.2, inOut)) + (1 - shrinkAll) * 300} s={cloudS} t={t} /></g>}
          <Rain t={t} xa={OBJ.cloud - 180} xb={OBJ.cloud + 260} y0={1060} o={rainO * thingsO * dusk} c="#59626d" />
          {/* 4 desire */}
          {phoneS > 0 && <g opacity={thingsO}>
            {t > ST[4] + 0.3 && t < ST[5] - 0.2 && (() => {const c2 = chestAt(H0.x, H0.pose, H0.s); const hand = [c2[0] + 130, c2[1] + 20]; const py = 1110 + 14 * Math.sin(t * 3);
              return <path d={`M${hand[0]} ${hand[1]} Q ${(hand[0] + OBJ.phone) / 2} ${py + 150} ${OBJ.phone - 50} ${py + 60}`} stroke={C.acc} strokeWidth={5} fill="none" strokeDasharray="2 14" strokeLinecap="round" opacity={win(t, ST[4] + 0.3, ST[5] - 0.2, 0.3, 0.3)} />;})()}
            <Phone x={OBJ.phone} y={mix(1110, 1300, 1 - shrinkAll) + 14 * Math.sin(t * 3)} s={phoneS} t={t} rot={-8 + 4 * Math.sin(t * 2.2)} />
          </g>}
          {/* 5 judgement */}
          {tallS > 0 && <g opacity={thingsO * clamp(tallRise * 2)} transform={`translate(0 ${(1 - tallRise) * 160})`}>
            <Figure x={OBJ.tall} pose={{...P.stand, lean: -6, head: 22, aR: [52 + 4 * Math.sin(t * 3), 64 + 4 * Math.sin(t * 3)], aL: [-6, -2]}} s={tallS} c="#3f7b8c" flip />
          </g>}
          {/* 6 success */}
          {tropS > 0 && <g opacity={thingsO}><Trophy x={OBJ.trophy} y={GROUND} s={tropS} t={t} /></g>}
          {/* 7 sin vs mercy */}
          {bS > 0 && <g opacity={thingsO}><Boulder x={OBJ.boulder} y={bY} s={bS} /></g>}
          {mercyP > 0 && <Heart x={X.sin - 150} y={1180} r={20 * mercyP} />}
          {/* motion trail when he moves fast */}
          {speed > 5 && <>
            <Figure x={Hpp.x} pose={Hpp.pose} s={Hpp.s} flip={Hpp.flip} c={m.ink} o={0.1} />
            <Figure x={Hp.x} pose={Hp.pose} s={Hp.s} flip={Hp.flip} c={m.ink} o={0.22} />
          </>}
          {/* the hero */}
          <Figure x={hx} pose={H0.pose} s={H0.s} flip={H0.flip} c={m.ink} />
          {/* 11–16 thoughts */}
          {t > ST[11] - 0.1 && t < ST[17] && BUB.map((b, n) => {const q = bub(n); if (q.o <= 0.001) return null;
            return <g key={n} transform={`translate(${q.x} ${q.y}) scale(${q.s}) translate(${-q.x} ${-q.y})`}>
              <Bubble x={q.x} y={q.y} r={70} o={q.o} from={[mix(head[0], q.x, 0.15), head[1] - 30]} fill={night > 0.5 ? '#2a3858' : C.white} ink={m.ink}><Glyph kind={b.kind} s={1.1} c={m.ink} /></Bubble>
            </g>;})}
          {t > ST[15] - 0.1 && t < ST[17] + 0.5 && BUB.map((b, n) => {const o = sparks(n); if (o <= 0) return null; const q = bub(n); const r = 40 + 90 * (1 - o);
            return <g key={'s' + n} opacity={o}>{Array.from({length: 8}).map((_, j) => {const a = (j / 8) * Math.PI * 2;
              return <line key={j} x1={q.x + Math.cos(a) * r * 0.6} y1={q.y + Math.sin(a) * r * 0.6} x2={q.x + Math.cos(a) * r} y2={q.y + Math.sin(a) * r} stroke={C.acc} strokeWidth={7} strokeLinecap="round" />;})}</g>;})}
          {/* the heart that wanders and comes home */}
          {hO > 0 && <>
            {back > 0.02 && back < 0.98 && [0.15, 0.3, 0.45].map((f, n) => {const q = bez(clamp(hp + f * 0.3)); return <circle key={n} cx={q[0]} cy={q[1]} r={6} fill={C.acc} opacity={0.35 * (1 - f)} />;})}
            <Heart x={hPos[0]} y={hPos[1]} r={17 + 4 * Math.sin(t * 5) * (1 - hp)} o={hO} glow={0.6 + 0.6 * night} />
          </>}
        </g>
        {/* light opening around the phrase (screen space) */}
        {rays > 0 && <g transform={`translate(540 ${words.y - 30})`} opacity={rays}>
          {Array.from({length: 20}).map((_, n) => {const a = (n / 20) * Math.PI * 2 + t * 0.15; const r0 = 220, r1 = 470 + 50 * Math.sin(n * 2.1);
            return <line key={n} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0 * 0.72} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1 * 0.72} stroke={C.accL} strokeWidth={9} strokeLinecap="round" opacity={0.45} />;})}
        </g>}
      </svg>

      <PhraseWords words={WORDS} enter={words.enter} t={t} y={words.y} size={140} scale={words.scale} glow={words.glow} out={words.out} />
      {qO > 0 && <div style={{position: 'absolute', left: qx - 100, top: qy - 160, width: 200, textAlign: 'center', fontFamily: FT.enB, fontSize: 230 * cam.z, color: C.acc, opacity: qO,
        transform: `scale(${qS}) rotate(${10 * Math.sin(t * 3)}deg)`, transformOrigin: '50% 80%'}}>?</div>}

      <SeriesLabel text="MY PRAYER · 01" o={1 - endO * 0.6} c={night > 0.5 ? '#8e98ad' : C.mute} />
      <Captions t={t} L={L} ar={AR} keyEn={KEY_EN} keyAr={KEY_AR} o={1 - loopIn} size={50} top={300} ink={m.cap} inkAr={m.capAr} />
      {loopIn > 0 && <Captions t={t} L={L} ar={AR} keyEn={KEY_EN} keyAr={KEY_AR} force={0} o={loopIn} size={50} top={300} ink={m.cap} inkAr={m.capAr} />}
      {endO > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: 1488, textAlign: 'center', fontFamily: FT.enM, fontSize: 30, letterSpacing: 2, color: m.ink, opacity: endO * 0.75}}>
        From the book <span style={{fontFamily: FT.enB}}>My Prayer</span> · Yasser Fares</div>}
    </AbsoluteFill>
  );
};
