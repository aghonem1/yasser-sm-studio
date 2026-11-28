import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import TL from './timeline_b03.json';
import EX from '../excerpts.json';
import {
  FPS, W, H, GROUND, C, FT, tl, k, win, mix, clamp, inOut, outBack, outCubic, loadFonts,
  Figure, P, lerpPose, Pose, chestAt, headAt, figureJoints, Heart, Cloud, Rain, Captions, SeriesLabel, Trophy,
  moodAt, Sky, Ground, camTransform, Cam, stroll, settle, PhraseWords, walkByDistance, Sprout,
  Star, Lantern, Mat, Gift, Briefcase, GradCap, Blocks, HeartCage, Worlds, Rise,
} from './kit';

// =====================================================================================
// Track B · 03 · ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ (Al-hamdu lillahi Rabb al-'alamin), kit v2
// From "My Prayer" by Yasser Fares, Ch.5 "Al-Fatihah - The Conversation That Maps the Way through Life",
// section "All praise belongs to Allah, Lord of all worlds", printed p.35.
// Hook (hookscore 52.2 → 93.8): "Alhamdulillah isn't only 'thank you.' You didn't make yourself, Allah did."
// Qur'an: 1:2 from quran/verse.py only (EX['1:2'], fragments EX['1:2-hamd'], EX['1:2-rabb']). VERSE windows = the hook's
// ٱلۡحَمۡدُ لِلَّهِ, line 2 (the whole verse), line 7 ("Lord of all worlds", Arabic caption = رَبِّ ٱلۡعَٰلَمِينَ) and line 15:
// no music there, calm motion (whooshes only).
//
// WORLD (one road, x): 540 the mat · 1250 the four signs of praise · 1950 job/degree/success, the heart, the self-built
//                      pedestal, the column of light · 2250–2900 three trees (stages) · 2800 alone · 3100–3900 sun, storm,
//                      lantern · 4300 prayer mat. Worlds hang in the sky over 900–3300 (seen only in the pull-back).
// MOODS: dawn (hook) → gold (praise is wider; the verse) → dawn (what you have) → gold (returned to its Source) → dusk (the
//        illusion) → gold (Lord of all worlds; Owner, Sustainer, stages) → dusk (an abandoned universe?) → gold (a Lord who
//        nurtured you) → night (prayer) → dawn (callback, question, end).
//
// STORYBOARD (line → picture → what it says)
//  0  hook → dawn; he stands on his mat, hands folded, the verse large above him; on "thank" a small gift pops at his
//        side (one blessing, one thank-you); on "yourself" chin up, hand on chest; on "Allah" he looks up, the sun warms
//        → praise is more than thanks for one gift, and you did not make yourself
//  1  "praise for His perfection, His acts, His wisdom, His gifts" → he walks right, the camera travels; four signs pop in
//        an arc over him as each is named: a star, a rising sun, a lantern, a gift      → wider than one gift
//  2  the verse (Arabic, word by word) → BIG PULL-BACK over the road; gold; the four signs glow (calm, no music)
//  3  "Your job. Your degree. Your success." → camera flies down to him; a briefcase drops beside him, a cap lands on his
//        head, a trophy rises; he raises both arms                                 → the things you have
//  4  "returns each one to its true Source" → gold; he lifts his hands; one by one the three float up into the light,
//        shrink to small lights and go into the sun                               → returned to its Source
//  5  "frees your heart from an illusion" → PUSH-IN on his chest: his heart behind bars; on "frees" the bars fall away
//  6  "that you made yourself by yourself" → dusk; camera eases back; stones slide in under him one by one and he rises
//        on his own pedestal, hand on chest, chin up                             → the self-made illusion
//  7  "Then: Lord of all worlds." → the pedestal crumbles, he drops to the ground; BIG PULL-BACK: gold, worlds pop in the
//        sky one by one over the whole road; رَبِّ ٱلۡعَٰلَمِينَ drops in word by word (calm, no music)
//  8  "Your Owner and Sustainer," → camera flies down; a column of warm light on him (Owner); a sprout grows at his feet
//        (Sustainer)
//  9  "who brings you through every stage" → he shrinks to a child, then walks right and grows step by step as three
//        trees grow beside the road (seedling, sapling, tree)                    → every stage
// 10  "You're not in an abandoned universe." → dusk; camera pulls back, he is small and alone on an empty road in a cold
//        wind; he looks back over his shoulder                                    → the fear the line answers
// 11  "You have a Lord who nurtured you" → gold; push-in; a warm sun rises behind him, a heart lights in his chest
// 12  "through blessings, trials and guidance" → he walks on, camera follows: rays burst and sprouts open (blessings),
//        a storm cloud rains on him and he hunches (trials), a lantern comes down and lights the road (guidance)
// 13  "Next prayer, as you say it," → night; a mat; he stands, hands folded
// 14  "return one blessing to Him." → hands open; a small gift appears in them and rises into the stars as a light
// 15  "Alhamdulillah." (Arabic) → dawn; ٱلۡحَمۡدُ لِلَّهِ drops in word by word (calm, no music)
// 16  "Every blessing, back to its Source." → small briefcase, cap and trophy pop round him and rise away as lights
// 17  END QUESTION → three small pictures pop as named: briefcase JOB, cap DEGREE, trophy SUCCESS; he thinks
// 18  "One word below." → the three pictures bob
// 19–20 end card → series promise + follow + book line; the last half second is the frame-1 picture (loop)
// =====================================================================================

loadFonts();
const {L, ST, wt, TOTAL} = tl(TL);
export {TOTAL, FPS};

const VERSE: string = (EX as any)['1:2'];
const FRAG: string = (EX as any)['1:2-hamd'];
const RABB: string = (EX as any)['1:2-rabb'];
const VW = VERSE.split(' '), FW = FRAG.split(' '), RW = RABB.split(' ');

const AR = [
  `«${FRAG}» ليست «شكرًا» فقط. لم تصنع نفسك، الله صنعك.`, 'إنها حمدٌ له على كماله وأفعاله وحكمته وعطاياه.', VERSE,
  'وظيفتك. شهادتك. نجاحك.', 'حين تقولها، تَرُدُّ كلَّ واحدٍ منها إلى مصدره الحقيقي،', 'وتُحرِّر قلبك من وَهْمٍ:', 'أنك صنعتَ نفسك بنفسك.',
  `ثم: «${RABB}».`, 'مالكُك والقائمُ على أمرك،', 'الذي ينقلك في كلِّ مرحلة.', 'أنت لست في كونٍ مهجور.', 'لك ربٌّ رَبّاك',
  'بالنِّعَم والابتلاءات والهداية.', 'في صلاتك القادمة، وأنت تقولها،', 'رُدَّ نعمةً واحدةً إليه.', `«${FRAG}».`, 'كلُّ نعمةٍ تعود إلى مصدرها.',
  'أيُّها تنسبه إلى نفسك: وظيفتك، أم شهادتك، أم نجاحك؟', 'كلمة واحدة في التعليقات.', 'كلَّ يوم، عبارةٌ من صلاتك.', 'تابعنا للعبارة القادمة.',
];
const KEY_EN = [['alhamdulillah', 'thank'], ['perfection', 'acts', 'wisdom', 'gifts'], ['belongs', 'lord'], ['job', 'degree', 'success'], ['returns', 'source'],
  ['frees', 'illusion'], ['yourself'], ['lord', 'worlds'], ['owner', 'sustainer'], ['stage'], ['abandoned'], ['lord', 'nurtured'],
  ['blessings', 'trials', 'guidance'], ['next'], ['return', 'him'], ['alhamdulillah'], ['source'], ['job', 'degree', 'success'], ['word'], ['every', 'day'], ['follow']];
const KEY_AR = [['شكرًا'], ['كماله', 'وأفعاله', 'وحكمته', 'وعطاياه'], [], ['وظيفتك', 'شهادتك', 'نجاحك'], ['تَرُدُّ', 'مصدره'], ['تُحرِّر', 'وَهْمٍ'], ['بنفسك'], [],
  ['مالكُك', 'والقائمُ'], ['مرحلة'], ['مهجور'], ['رَبّاك'], ['بالنِّعَم', 'والابتلاءات', 'والهداية'], ['القادمة'], ['رُدَّ', 'إليه'], [], ['مصدرها'],
  ['وظيفتك', 'شهادتك', 'نجاحك'], ['كلمة'], ['كلَّ يوم'], ['تابعنا']];

const HS = 1.35;
const X = {start: 540, praise: 1250, bless: 1950, alone: 2800, pray: 4300};
const CHEER: Pose = {lean: -4, head: -16, aL: [-150, -168], aR: [150, 168], lL: [-7, -4], lR: [7, 4], seat: 0};
const OFFER: Pose = {lean: -3, head: -26, aL: [-128, -150], aR: [128, 150], lL: [-5, -3], lR: [5, 3], seat: 0};
const AWE: Pose = {...P.lookup, head: -24, aL: [-40, -30], aR: [40, 30]};
const T = {thank: wt(0, 'thank'), self: wt(0, 'yourself'), allah: wt(0, 'allah'), job: wt(3, 'job'), deg: wt(3, 'degree'), suc: wt(3, 'success'),
  ret: wt(4, 'returns'), src: wt(4, 'source'), frees: wt(5, 'frees'), lord7: wt(7, 'lord'), all7: wt(7, 'all'), bl: wt(12, 'blessings'),
  tr: wt(12, 'trials'), gd: wt(12, 'guidance'), ret14: wt(14, 'return'), him: wt(14, 'him'), back: wt(16, 'back')};
const BLK = 58;   // one stone of the pedestal
const blocksN = (t: number) => t < ST[6] - 0.05 ? 0 : 3 * clamp((t - (ST[6] - 0.05)) / 0.9);
const crumbleAt = ST[7] - 0.6;
const W12a = ST[12] - 0.45, W12b = ST[13] + 0.7;   // the long walk through blessings, trials and guidance

// ---------------- the hero, as a function of time ----------------
type Hero = {x: number; y: number; pose: Pose; s: number; flip: boolean};
const heroRaw = (t: number): Hero => {
  let x = X.start, y = GROUND, pose: Pose = P.folded, s = 1, flip = false;
  if (t < ST[1] - 0.35) {   // hook
    if (t > T.self - 0.3) pose = settle(P.folded, P.proud, t, T.self - 0.3, 0.4);
    if (t > T.allah - 0.25) pose = settle(P.proud, P.lookup, t, T.allah - 0.25, 0.45);
  } else if (t < ST[3] - 0.45) {   // walk under the four signs; awe through the verse
    const w = stroll(t, ST[1] - 0.35, ST[1] + 0.55, X.start, X.praise, P.stand, HS); x = w.x; pose = w.pose;
    if (t > ST[1] + 0.55) pose = settle(P.stand, P.lookup, t, ST[1] + 0.55, 0.45);
    if (t > ST[2] + 0.2) pose = lerpPose(pose, AWE, k(t, ST[2] + 0.2, 1.0, inOut));
  } else if (t < ST[4] - 0.15) {   // to the things he has
    const w = stroll(t, ST[3] - 0.45, ST[3] + 0.25, X.praise, X.bless, P.stand, HS); x = w.x; pose = w.pose;
    if (t < ST[3] - 0.2) pose = lerpPose(AWE, pose, k(t, ST[3] - 0.45, 0.25));
    if (t > T.suc - 0.15) pose = settle(P.stand, CHEER, t, T.suc - 0.15, 0.4);
  } else if (t < ST[5] - 0.15) {   // returns each one: hands lift
    x = X.bless; pose = settle(CHEER, P.dua, t, ST[4] - 0.15, 0.45);
    if (t > T.ret - 0.1) pose = settle(P.dua, OFFER, t, T.ret - 0.1, 0.5);
  } else if (t < ST[6] - 0.05) {   // the heart is freed
    x = X.bless; pose = settle(OFFER, P.stand, t, ST[5] - 0.15, 0.5);
    if (t > T.frees) pose = settle(P.stand, {...P.stand, lean: -3, head: -12}, t, T.frees, 0.5);
  } else if (t < crumbleAt) {   // the self-built pedestal
    x = X.bless; pose = settle({...P.stand, lean: -3, head: -12}, P.proud, t, ST[6] - 0.05, 0.45); y = GROUND - BLK * blocksN(t);
  } else if (t < ST[8] - 0.3) {   // falls, lands, looks up at the worlds
    x = X.bless; const f = k(t, crumbleAt, 0.38, (q) => clamp(q) * clamp(q)); const land = t - (crumbleAt + 0.38);
    y = mix(GROUND - BLK * 3, GROUND, f) - (land > 0 && land < 0.22 ? 14 * Math.sin((land / 0.22) * Math.PI) : 0);
    pose = land < 0 ? lerpPose(P.proud, P.small, f) : settle(P.small, AWE, t, crumbleAt + 0.55, 0.7);
  } else if (t < ST[9] - 0.25) {   // the column of light: receiving
    x = X.bless; pose = settle(AWE, {...P.dua, head: -20}, t, ST[8] - 0.3, 0.5);
  } else if (t < ST[10] - 0.1) {   // every stage: a child who walks and grows
    const shrink = k(t, ST[9] - 0.25, 0.3, inOut);
    const w = stroll(t, ST[9] + 0.05, ST[10] - 0.15, X.bless, X.alone, P.stand, HS); x = w.x; pose = w.pose;
    if (t < ST[9] + 0.05) pose = lerpPose({...P.dua, head: -20}, P.stand, shrink);
    s = mix(1, 0.5, shrink) + 0.5 * clamp((x - X.bless) / (X.alone - X.bless));
  } else if (t < ST[11] - 0.15) {   // alone: small, looks back
    x = X.alone; pose = settle(P.stand, P.small, t, ST[10] - 0.1, 0.5);
    flip = t > ST[10] + 0.55 && t < ST[10] + 1.15;
  } else if (t < W12a) {   // nurtured: looks up into the rising sun
    x = X.alone; pose = settle(P.small, P.lookup, t, ST[11] - 0.15, 0.55);
  } else if (t < W12b) {   // blessings · trials (hunched) · guidance, all the way to the mat
    const w = stroll(t, W12a, W12b, X.alone, X.pray, P.stand, HS); x = w.x;
    const hunch = win(t, T.tr - 0.2, T.tr + 0.95, 0.25, 0.3);
    pose = t > W12a && t < W12b ? walkByDistance(lerpPose(P.stand, P.small, hunch), Math.abs(x - X.alone), HS,
      Math.min(1, Math.sin(Math.PI * clamp((t - W12a) / (W12b - W12a))) * 1.6)) : P.stand;
  } else if (t < ST[17] - 0.2) {   // prayer
    x = X.pray; pose = settle(P.stand, P.folded, t, W12b, 0.5);
    if (t > T.ret14 - 0.3) pose = settle(P.folded, P.dua, t, T.ret14 - 0.3, 0.45);
    if (t > T.him - 0.25) pose = settle(P.dua, OFFER, t, T.him - 0.25, 0.5);
    if (t > ST[15] - 0.35) pose = settle(OFFER, P.folded, t, ST[15] - 0.35, 0.55);
    if (t > ST[16] + 0.1) pose = settle(P.folded, P.lookup, t, ST[16] + 0.1, 0.5);
  } else if (t < ST[19] + 0.4) {   // the question
    x = X.pray; pose = settle(P.lookup, P.think, t, ST[17] - 0.2, 0.5);
    pose = {...pose, head: pose.head - 10 * win(t, wt(17, 'job') - 0.1, wt(17, 'success') + 0.6, 0.3, 0.4)};
  } else {
    x = X.pray; pose = settle(P.think, P.folded, t, ST[19] + 0.4, 0.6);
  }
  pose = {...pose, lean: pose.lean + 0.9 * Math.sin(t * 1.7)};   // breathing
  return {x, y, pose, s: s * HS, flip};
};
const hero = (t: number): Hero => {
  const h = heroRaw(t), lag = heroRaw(t - 0.08);
  return {...h, pose: {...h.pose, head: mix(h.pose.head, lag.pose.head, 0.5)}};
};
const handsAt = (h: Hero) => {const j = figureJoints(h.pose); return [h.x + (j.AL.hand[0] + j.AR.hand[0]) * 0.5 * h.s, h.y + (j.hipY + (j.AL.hand[1] + j.AR.hand[1]) * 0.5) * h.s];};
const xB = heroRaw(T.bl).x + 120, xT = heroRaw(T.tr).x + 60, xG = heroRaw(T.gd).x + 260;

// ---------------- camera ----------------
const follow = (tt: number) => {const a = heroRaw(tt + 0.1).x, b = heroRaw(tt).x; return mix(b, a, 0.6) + 40;};
const WIDE = {x: 900, y: 240, z: 0.32}, WIDE2 = {x: 2150, y: 210, z: 0.3};
const chestW = (() => {const h = heroRaw(ST[5] + 0.4); return chestAt(h.x, h.pose, h.s, h.y);})();
const camAtT = (t: number): Cam => {
  if (t < ST[1] - 0.35) return {x: X.start, y: 960, z: 1 + 0.06 * k(t, 0, ST[1], (q) => q)};
  if (t < ST[2] - 0.45) {const p = k(t, ST[1] - 0.35, 0.6, inOut); return {x: follow(t), y: mix(960, 930, p), z: mix(1.06, 1, p)};}
  if (t < ST[3] - 0.5) {   // big pull-back over the road (settles before the first Arabic word)
    const p = k(t, ST[2] - 0.45, 0.95, inOut); const z = Math.exp(mix(0, Math.log(WIDE.z), p));
    return {x: mix(follow(ST[2] - 0.45), WIDE.x, p) + 30 * k(t, ST[2] + 0.4, 1.8, inOut), y: mix(930, WIDE.y, p), z};
  }
  if (t < ST[5] - 0.25) {   // fly down to him; tilt up a little as the things rise
    const p = k(t, ST[3] - 0.5, 1.0, inOut); const z = Math.exp(mix(Math.log(WIDE.z), 0, p));
    return {x: mix(WIDE.x + 30, follow(t), p), y: mix(WIDE.y, 960, p) - 70 * win(t, ST[4] - 0.2, ST[5] + 0.2, 0.6, 0.5), z};
  }
  if (t < ST[6] - 0.15) {   // push-in on the heart
    const p = k(t, ST[5] - 0.25, 0.7, inOut); const z = Math.exp(mix(0, Math.log(1.75), p));
    return {x: mix(X.bless + 40, chestW[0], p), y: mix(890, chestW[1] + 40, p), z};
  }
  if (t < crumbleAt) {   // ease back to see the pedestal
    const p = k(t, ST[6] - 0.15, 0.75, inOut); const z = Math.exp(mix(Math.log(1.75), Math.log(0.82), p));
    return {x: mix(chestW[0], X.bless + 30, p), y: mix(chestW[1] + 40, 880, p), z};
  }
  if (t < ST[8] - 0.35) {   // big pull-back: all the worlds
    const p = k(t, crumbleAt + 0.15, 1.1, inOut); const z = Math.exp(mix(Math.log(0.82), Math.log(WIDE2.z), p));
    return {x: mix(X.bless + 30, WIDE2.x, p), y: mix(880, WIDE2.y, p), z};
  }
  if (t < ST[10] - 0.2) {   // fly down; follow the growing walk
    const p = k(t, ST[8] - 0.35, 0.9, inOut); const z = Math.exp(mix(Math.log(WIDE2.z), 0, p)) * (1 - 0.1 * k(t, ST[9], 0.6, inOut));
    return {x: mix(WIDE2.x, follow(t), p), y: mix(WIDE2.y, 960, p) - 40 * k(t, ST[9], 0.6, inOut), z};
  }
  if (t < ST[11] - 0.2) {   // pull back: alone
    const p = k(t, ST[10] - 0.2, 1.1, inOut);
    return {x: mix(follow(ST[10] - 0.2), X.alone + 60, p), y: mix(920, 650, p), z: Math.exp(mix(Math.log(0.9), Math.log(0.46), p))};
  }
  if (t < W12a + 0.2) {   // push in again under the rising sun
    const p = k(t, ST[11] - 0.2, 0.9, inOut);
    return {x: mix(X.alone + 60, X.alone + 40, p), y: mix(650, 960, p), z: Math.exp(mix(Math.log(0.46), Math.log(1.02), p))};
  }
  if (t < W12b + 0.2) {const p = k(t, W12a + 0.2, 0.5, inOut); return {x: mix(X.alone + 40, follow(t), p), y: 940, z: mix(1.02, 0.95, p)};}
  const p = k(t, W12b + 0.2, 0.8, inOut);
  return {x: mix(follow(W12b + 0.2), X.pray + 20, p), y: mix(940, 960, p), z: mix(0.95, 1, p) + 0.06 * win(t, ST[13] + 0.6, ST[15] - 0.2, 1.2, 0.6)};
};

// a sun with rays (His acts; blessings)
const SunBurst: React.FC<{x: number; y: number; r: number; o?: number; t: number; rays?: number}> = ({x, y, r, o = 1, t, rays = 1}) => o <= 0.001 || r <= 0 ? null : (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <circle r={r * 2.2} fill={C.sun} opacity={0.35} />
    {Array.from({length: 10}).map((_, i) => {const a = (i / 10) * Math.PI * 2 + t * 0.4; const r0 = r * 1.3, r1 = r * (1.3 + 0.55 * rays);
      return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke="#e6a93b" strokeWidth={8} strokeLinecap="round" />;})}
    <circle r={r} fill="#f2b64e" stroke={C.ink} strokeWidth={5} />
  </g>
);

export const B03: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const loopIn = k(t, TOTAL - 0.55, 0.5, inOut);   // the last half second becomes frame 1 (seamless loop)
  const m = moodAt(t, [[0, 'dawn'], [ST[1] - 0.2, 'gold'], [ST[3] - 0.3, 'dawn'], [ST[4] - 0.1, 'gold'], [ST[5] - 0.1, 'dusk'], [ST[7] - 0.05, 'gold'],
    [ST[10] - 0.1, 'dusk'], [ST[11] - 0.1, 'gold'], [ST[13] - 0.2, 'night'], [ST[15] - 0.25, 'dawn']]);
  const night = win(t, ST[13] - 0.4, ST[15], 0.6, 0.6);
  let cam = camAtT(t);
  const H0 = hero(t), Hp = hero(t - 1 / 30), Hpp = hero(t - 2 / 30);
  const hx = H0.x;
  if (loopIn > 0) cam = {x: mix(cam.x, hx, loopIn), y: mix(cam.y, 960, loopIn), z: mix(cam.z, 1, loopIn)};
  const speed = Math.hypot(H0.x - Hp.x, H0.y - Hp.y);

  // sun
  const sunO = (1 - 0.5 * k(t, ST[1] - 0.5, 0.6)) * (1 - k(t, ST[3] - 0.4, 0.5)) + win(t, ST[4] - 0.2, ST[5] - 0.1, 0.5, 0.4)
    + win(t, ST[11] - 0.15, ST[13] - 0.3, 0.7, 0.5) + k(t, ST[15] - 0.25, 0.8);
  const sunPos = t < ST[3] ? [X.start + 240, mix(1330, 1180, k(t, T.allah - 0.2, 0.8, inOut))] : t < ST[6] ? [X.bless + 40, 640]
    : t < ST[13] ? [X.alone + 260, mix(1500, 1050, k(t, ST[11] - 0.15, 1.6, inOut))] : [X.pray + 240, 1330];
  const sunBoost = 1 + 0.5 * win(t, T.allah - 0.1, ST[1], 0.3, 0.4);

  // hook gift
  const gP = outBack(k(t, T.thank - 0.12, 0.38, (q) => q));
  const gO = t < T.thank - 0.12 ? 0 : 1 - k(t, ST[1] - 0.3, 0.35);
  // the four signs of praise
  const signs = ['perfection', 'acts', 'wisdom', 'gifts'].map((w) => wt(1, w) - 0.1);
  const signO = 1 - k(t, ST[3] - 0.35, 0.45);
  const signGlow = win(t, ST[2] - 0.2, ST[3] - 0.3, 0.5, 0.4);
  const SXY = [[-345, -650], [-120, -790], [120, -790], [345, -650]].map(([dx, dy], i) => [X.praise + dx, GROUND + dy + 8 * Math.sin(t * 2.2 + i)]);

  // job / degree / success, then returned
  const drop = (a: number) => k(t, a, 0.34, (q) => clamp(q) * clamp(q));
  const bounce = (a: number) => {const l = t - (a + 0.34); return l > 0 && l < 0.22 ? 12 * Math.sin((l / 0.22) * Math.PI) : 0;};
  const tJ = T.job - 0.3, tD = T.deg - 0.32, tS = T.suc - 0.25;
  const rise = (i: number) => k(t, T.ret + i * 0.28, 1.15, inOut);
  const rO = (i: number) => 1 - k(t, T.ret + i * 0.28 + 0.75, 0.4);
  const head0 = headAt(H0.x, H0.pose, H0.s, H0.y);
  const SRC = [X.bless + 40, 640];
  const bcBase = [X.bless - 235, GROUND - bounce(tJ)], tpBase = [X.bless + 250, GROUND];
  const capBase = [head0[0], head0[1] - 31 * H0.s + 10];
  const lift = (b: number[], i: number) => [mix(b[0], SRC[0] + (i - 1) * 60, rise(i)), mix(b[1], SRC[1] + 40, rise(i))];
  const bcXY = t < T.ret ? [bcBase[0], mix(GROUND - 900, GROUND, drop(tJ)) - bounce(tJ)] : lift(bcBase, 0);
  const capXY = t < T.ret ? [capBase[0], mix(capBase[1] - 700, capBase[1], drop(tD)) - bounce(tD)] : lift([capBase[0], capBase[1]], 1);
  const tpRise = k(t, tS, 0.45, outBack);
  const tpXY = t < T.ret ? [tpBase[0], tpBase[1] + (1 - tpRise) * 120] : lift(tpBase, 2);

  // the heart and its bars
  const chest = chestAt(hx, H0.pose, H0.s, H0.y);
  const heartIn = outBack(k(t, ST[5] - 0.2, 0.35, (q) => q));
  const heartO = win(t, ST[5] - 0.2, ST[6] + 0.1, 0.15, 0.4) + win(t, ST[11] + 0.1, ST[13] - 0.2, 0.3, 0.4) * outBack(k(t, ST[11] + 0.1, 0.4, (q) => q));
  const cageOpen = k(t, T.frees - 0.05, 0.6, inOut);
  const cageO = win(t, ST[5] - 0.2, ST[6], 0.15, 0.2);
  const heartR = 15 * HS * 0.75 * (1 + 0.25 * k(t, T.frees + 0.2, 0.5, outBack));

  // the pedestal and its fall; the worlds
  const crumble = k(t, crumbleAt, 0.7, (q) => clamp(q));
  const worldsP = k(t, crumbleAt + 0.95, 1.5, (q) => clamp(q));
  const worldsO = 1 - k(t, ST[8] - 0.2, 0.5);
  const WL: [number, number, number, string, boolean][] = [[2217, 230, 150, '#c9a24a', false], [850, 30, 115, C.teal, false], [3550, 40, 110, '#8a6a4a', false],
    [1450, 560, 80, C.acc, true], [3017, 620, 85, C.tealL, true], [783, 1010, 60, C.accL, false], [3517, 1000, 66, C.teal, false]];

  // Owner and Sustainer: column of light, sprout; stages: trees
  const column = win(t, ST[8] - 0.2, ST[9] + 0.2, 0.4, 0.5);
  const sprout8 = k(t, wt(8, 'sustainer') - 0.15, 0.9, outCubic) * (1 - k(t, ST[10] - 0.5, 0.4));
  const TREES: [number, number][] = [[2230, 70], [2500, 150], [2950, 270]];
  const treeP = (tx: number) => {let ta = 1e9; for (let tt = ST[9]; tt < ST[10]; tt += 1 / 30) if (heroRaw(tt).x > tx - 220) {ta = tt; break;} return ta;};
  const treeT = TREES.map(([tx]) => treeP(tx));
  const treesO = 1 - k(t, ST[10] - 0.1, 0.4);
  // alone: wind
  const alone = win(t, ST[10] - 0.1, ST[11] + 0.1, 0.4, 0.5);

  // blessings · trials · guidance
  const blessP = outBack(k(t, T.bl - 0.15, 0.45, (q) => q)), blessO = 1 - k(t, T.tr - 0.35, 0.4);
  const cloudIn = k(t, T.tr - 0.4, 0.4, outCubic), cloudO = win(t, T.tr - 0.4, T.tr + 1.1, 0.3, 0.45);
  const rainO = win(t, T.tr - 0.15, T.tr + 1.0, 0.2, 0.3);
  const lanD = k(t, T.gd - 0.35, 0.55, outCubic), lanO = t < T.gd - 0.35 ? 0 : 1 - k(t, ST[13] + 0.2, 0.5);
  const matP = k(t, ST[13] - 0.5, 0.4, outBack);

  // one blessing returned (line 14); every blessing (line 16)
  const gift14In = outBack(k(t, T.ret14 - 0.05, 0.35, (q) => q));
  const gift14Up = k(t, T.him - 0.2, 0.9, inOut);
  const gift14O = t < T.ret14 - 0.05 ? 0 : 1 - k(t, T.him + 0.55, 0.35);
  const hands = handsAt(heroRaw(Math.min(t, T.him - 0.2)));
  const g14 = [hands[0], mix(hands[1] - 20, GROUND - 980, gift14Up)];
  const p16 = (i: number) => outBack(k(t, ST[16] + 0.05 + i * 0.18, 0.35, (q) => q));
  const up16 = (i: number) => k(t, T.back - 0.15 + i * 0.2, 1.0, inOut);
  const o16 = (i: number) => (t < ST[16] + 0.05 + i * 0.18 ? 0 : 1) * (1 - k(t, T.back + 0.45 + i * 0.2, 0.3));
  const P16 = [[X.pray - 230, GROUND], [X.pray + 205, GROUND - 330], [X.pray + 240, GROUND]];

  // question pictures
  const qPop = (w: string) => outBack(k(t, wt(17, w) - 0.12, 0.4, (q) => q));
  const qOut = k(t, ST[19] - 0.15, 0.4, inOut);
  const qBob = (n: number) => 10 * Math.sin(t * 4 + n * 1.3) * win(t, ST[18] - 0.1, ST[19], 0.3, 0.3);

  // ---------------- the phrase (screen space) ----------------
  let A = {enter: [-1, -1, -1, -1], y: 760, scale: 1, glow: 0.2, out: k(t, ST[1] - 0.3, 0.55), o: 1,
    swell: VW.map((_, i) => (i < 2 ? 0.08 * win(t, 0, wt(0, 'isn'), 0.12, 0.4) : 0))};
  if (t >= ST[2] - 0.4 && t < ST[15] - 0.3) {
    const we = L[2].words.map((w) => w[1] - 0.1);
    A = {enter: we, y: 720, scale: 1.05, glow: 0.3 + 0.7 * k(t, we[2], 1.2), out: k(t, ST[3] - 0.4, 0.5), o: 1,
      swell: we.map((e, i) => 0.1 * win(t, e + 0.05, e + 0.75, 0.15, 0.45) * (i === 0 ? 1 : 0.6))};
  } else if (t >= ST[15] - 0.3) A = {...A, o: 0};
  const rabbE = [T.lord7 - 0.1, T.all7 - 0.1], rabbOut = k(t, ST[8] - 0.35, 0.5);
  const fragE = [ST[15] - 0.08, (L[15].words[0][1] + L[15].words[0][2]) / 2 - 0.05];
  const fragOut = k(t, T.back - 0.45, 0.45);
  const fragSw = 0.12 * win(t, fragE[1], fragE[1] + 0.8, 0.15, 0.5);

  // ---------------- end card ----------------
  const endO = k(t, ST[19] - 0.2, 0.4) * (1 - loopIn);
  const QP = [{w: 'job', label: 'JOB'}, {w: 'degree', label: 'DEGREE'}, {w: 'success', label: 'SUCCESS'}];

  return (
    <AbsoluteFill style={{background: m.sky1}}>
      <Sky m={m} cam={cam} t={t} sunX={sunPos[0]} sunY={sunPos[1]} sun={clamp(sunO) * sunBoost} stars={Math.max(night, 0.55 * worldsO * k(t, crumbleAt + 0.3, 0.8))} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g transform={camTransform(cam)}>
          <Ground m={m} />
          {/* the worlds (pull-back) */}
          <Worlds p={worldsP} t={t} o={worldsO} list={WL} />
          {/* mats */}
          <Mat x={X.start} o={1 - k(t, ST[3], 0.4)} />
          <Mat x={X.pray} p={matP} o={t < ST[13] - 0.5 ? 0 : 1} />
          {/* 0 the small gift */}
          {gO > 0 && <Gift x={X.start + 215} y={GROUND} s={0.62 * gP} o={gO} glow={win(t, T.allah - 0.1, ST[1], 0.3, 0.3)} />}
          {/* 1–2 the four signs */}
          {signO > 0 && <g opacity={signO}>
            {t > signs[0] && <Star x={SXY[0][0]} y={SXY[0][1]} r={64 * outBack(k(t, signs[0], 0.4, (q) => q))} glow={0.5 + signGlow} />}
            {t > signs[1] && <SunBurst x={SXY[1][0]} y={SXY[1][1]} r={56 * outBack(k(t, signs[1], 0.4, (q) => q))} t={t} rays={0.6 + 0.4 * signGlow} />}
            {t > signs[2] && <Lantern x={SXY[2][0]} y={SXY[2][1] + 70} s={1.15 * outBack(k(t, signs[2], 0.4, (q) => q))} t={t} glow={0.6 + signGlow} />}
            {t > signs[3] && <Gift x={SXY[3][0]} y={SXY[3][1] + 62} s={1.0 * outBack(k(t, signs[3], 0.4, (q) => q))} glow={0.4 + signGlow} />}
          </g>}
          {/* 3–4 job, degree, success → returned to their Source */}
          {t > tJ && rO(0) > 0 && <Briefcase x={bcXY[0]} y={bcXY[1]} s={0.95 * (1 - 0.8 * rise(0))} o={rO(0)} glow={rise(0)} />}
          {t > tS && rO(2) > 0 && <g opacity={rO(2)}><Trophy x={tpXY[0]} y={tpXY[1]} s={0.5 * clamp(tpRise * 1.5) * (1 - 0.8 * rise(2))} t={t} /></g>}
          {[0, 1, 2].map((i) => rise(i) > 0.55 && rO(i) > 0 ? <Rise key={i} x={SRC[0] + (i - 1) * 60} y={SRC[1] + 40 - 40 * rise(i)} r={14} o={rO(i) * clamp((rise(i) - 0.55) * 4)} /> : null)}
          {/* 6 the pedestal */}
          <Blocks x={X.bless} n={blocksN(t)} crumble={crumble} o={t < ST[8] + 0.4 ? 1 : 0} />
          {/* 8 the column of light and the sprout */}
          {column > 0 && <g opacity={column}>
            <defs><linearGradient id="b03col" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3cf98" stopOpacity={0} /><stop offset="0.35" stopColor="#f3cf98" stopOpacity={0.32} /><stop offset="1" stopColor="#f3cf98" stopOpacity={0.2} /></linearGradient></defs>
            <path d={`M${X.bless - 70} 300 L${X.bless + 70} 300 L${X.bless + 190} ${GROUND} L${X.bless - 190} ${GROUND} Z`} fill="url(#b03col)" />
            {Array.from({length: 6}).map((_, n) => {const ph = ((t - ST[8]) * 0.5 + n / 6) % 1; return <circle key={n} cx={X.bless + (n % 2 ? -50 : 60) + 12 * Math.sin(t + n)} cy={mix(500, GROUND - 100, ph)} r={8} fill={C.white} opacity={Math.sin(Math.PI * ph) * 0.8} />;})}
          </g>}
          <Sprout x={X.bless + 175} p={sprout8} h={140} c={m.ink} />
          <Sprout x={X.bless + 250} p={sprout8 * 0.9 - 0.1} h={90} leaf="#7fa877" c={m.ink} />
          {/* 9 three trees: stages */}
          {TREES.map(([tx, th], i) => <g key={i} opacity={treesO}><Sprout x={tx} p={k(t, treeT[i], 0.8, outCubic)} h={th} c={m.ink} leaf={i === 2 ? '#5f8c5a' : '#6f9a6a'} /></g>)}
          {/* 10 cold wind, alone */}
          {alone > 0 && <g opacity={alone}>{[0, 1, 2, 3, 4, 5].map((i) => {const ph = ((t * 0.5 + i * 0.19) % 1); const yy = GROUND - 1300 + i * 210;
            return <path key={i} d={`M${X.alone + 900 - ph * 1900} ${yy} q 90 -28 180 0 t 180 0`} stroke="#9aa6b0" strokeWidth={12} fill="none" strokeLinecap="round" opacity={Math.sin(Math.PI * ph)} />;})}</g>}
          {/* 12 blessings · trials · guidance */}
          {t > T.bl - 0.15 && blessO > 0 && <SunBurst x={xB} y={GROUND - 760} r={60 * blessP} o={blessO} t={t} />}
          {t > T.bl - 0.05 && blessO > 0 && [0, 1, 2].map((i) => <Sprout key={i} x={xB - 160 + i * 150} p={k(t, T.bl + i * 0.12, 0.6, outCubic)} h={70 + 25 * (i % 2)} c={m.ink} />)}
          {cloudO > 0 && <Cloud x={xT + 40} y={mix(GROUND - 1150, GROUND - 760, cloudIn)} s={0.8} o={cloudO} t={t} />}
          <Rain t={t} xa={xT - 220} xb={xT + 300} y0={GROUND - 690} o={rainO} />
          {lanO > 0 && <Lantern x={xG} y={mix(GROUND - 900, GROUND, lanD)} s={1.2} o={lanO} t={t} glow={0.6 + 0.6 * k(t, T.gd + 0.2, 0.4)} />}
          {/* motion trail */}
          {speed > 5 && <>
            <Figure x={Hpp.x} y={Hpp.y} pose={Hpp.pose} s={Hpp.s} c={m.ink} o={0.1} flip={Hpp.flip} />
            <Figure x={Hp.x} y={Hp.y} pose={Hp.pose} s={Hp.s} c={m.ink} o={0.22} flip={Hp.flip} />
          </>}
          {/* the hero */}
          <Figure x={hx} y={H0.y} pose={H0.pose} s={H0.s} c={m.ink} flip={H0.flip} />
          {t > tD && rO(1) > 0 && <GradCap x={capXY[0]} y={capXY[1]} s={0.72 * (1 - 0.8 * rise(1))} o={rO(1)} t={t} glow={rise(1)} rot={-6 * (1 - drop(tD))} />}
          {heartO > 0 && <Heart x={chest[0]} y={chest[1]} r={heartR * (t < ST[6] + 0.2 ? heartIn : 1)} o={clamp(heartO)} glow={0.6 + 0.8 * cageOpen} />}
          {cageO > 0 && <HeartCage x={chest[0]} y={chest[1]} r={34} open={cageOpen} o={cageO} c={m.ink} />}
          {/* 14 one gift returned */}
          {gift14O > 0 && <Gift x={g14[0]} y={g14[1]} s={0.55 * gift14In * (1 - 0.7 * gift14Up)} o={gift14O} glow={0.5 + gift14Up} />}
          {gift14Up > 0.7 && gift14O > 0 && <Rise x={g14[0]} y={g14[1] - 30} r={12} o={gift14O * clamp((gift14Up - 0.7) * 4)} />}
          {/* 16 every blessing back to its Source */}
          {[0, 1, 2].map((i) => {const o = o16(i); if (o <= 0) return null; const p = p16(i), u = up16(i); const bx = mix(P16[i][0], X.pray + (i - 1) * 50, u), by = mix(P16[i][1], GROUND - 780, u);
            const sc = (1 - 0.75 * u);
            return <g key={i}>
              {i === 0 && <Briefcase x={bx} y={by} s={0.6 * p * sc} o={o} glow={u} />}
              {i === 1 && <GradCap x={bx} y={by} s={0.55 * p * sc} o={o} t={t} glow={u} />}
              {i === 2 && <g opacity={o}><Trophy x={bx} y={by} s={0.36 * p * sc} t={t} /></g>}
              {u > 0.6 && <Rise x={bx} y={by - 40} r={11} o={o * clamp((u - 0.6) * 4)} />}
            </g>;})}
        </g>
        {/* 17–18 the three choices (screen space) */}
        {t > wt(17, 'job') - 0.15 && qOut < 1 && QP.map((q, n) => {const p = qPop(q.w); if (p <= 0) return null; const cx = 250 + n * 290, cy = 800 + qBob(n);
          return <g key={n} opacity={clamp(p * 2) * (1 - qOut)} transform={`translate(${cx} ${cy}) scale(${p * (1 - 0.3 * qOut)})`}>
            <circle r={105} fill={C.white} stroke={m.ink} strokeWidth={6} />
            {n === 0 && <Briefcase x={0} y={48} s={0.7} />}
            {n === 1 && <GradCap x={0} y={30} s={0.72} t={t} />}
            {n === 2 && <Trophy x={0} y={78} s={0.42} t={t} />}
            <text y={150} textAnchor="middle" fontFamily={FT.enB} fontSize={26} letterSpacing={3} fill={m.ink}>{q.label}</text>
          </g>;})}
      </svg>

      <PhraseWords words={VW} enter={A.enter} t={t} y={A.y} size={96} scale={A.scale} glow={A.glow} out={A.out} o={A.o * (1 - loopIn)} font={FT.quran} swell={A.swell} stroke={1.2} />
      {loopIn > 0 && <PhraseWords words={VW} enter={[-1, -1, -1, -1]} t={t} y={760} size={96} glow={0.2} o={loopIn} font={FT.quran} stroke={1.2} />}
      {t > rabbE[0] - 0.2 && rabbOut < 1 && <PhraseWords words={RW} enter={rabbE} t={t} y={720} size={112} glow={0.5} out={rabbOut} font={FT.quran} stroke={1.3} />}
      {t > ST[15] - 0.2 && <PhraseWords words={FW} enter={fragE} t={t} y={760} size={128} glow={0.35 + fragSw * 4} out={fragOut} font={FT.quran} swell={[fragSw, fragSw]} o={1 - loopIn} stroke={1.4} />}

      <SeriesLabel text="MY PRAYER · 03" o={1 - endO * 0.6} c={night > 0.5 ? '#8e98ad' : C.mute} />
      <Captions t={t} L={L} ar={AR} keyEn={KEY_EN} keyAr={KEY_AR} o={1 - loopIn} size={50} top={300} ink={m.cap} inkAr={m.capAr} quranParts={[VERSE, FRAG, RABB]} />
      {loopIn > 0 && <Captions t={t} L={L} ar={AR} keyEn={KEY_EN} keyAr={KEY_AR} force={0} o={loopIn} size={50} top={300} ink={m.cap} inkAr={m.capAr} quranParts={[VERSE, FRAG, RABB]} />}
      {endO > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: 1488, textAlign: 'center', fontFamily: FT.enM, fontSize: 30, letterSpacing: 2, color: m.ink, opacity: endO * 0.75}}>
        From the book <span style={{fontFamily: FT.enB}}>My Prayer</span> · Yasser Fares</div>}
    </AbsoluteFill>
  );
};
