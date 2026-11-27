import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import TL from './timeline_b02.json';
import EX from '../excerpts.json';
import {
  FPS, W, H, GROUND, C, FT, loadFonts, tl, k, win, mix, clamp, inOut, outBack, outCubic,
  Figure, P, lerpPose, Pose, chestAt, headAt, figureJoints, Heart, Boulder, Bubble, Captions, SeriesLabel,
  moodAt, Sky, Ground, camTransform, toScreen, Cam, stroll, settle, PhraseWords, walkByDistance, Sprout, Dome,
  Dumbbell, Books, Star, Door, Tower, Lantern, Mat, LoopGlyph,
} from './kit';

// =====================================================================================
// Track B · 02 · بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ (Bismillah al-Rahman al-Rahim), kit v2
// From "My Prayer" by Yasser Fares, Ch.5 "Al-Fatihah - The Conversation That Maps the Way through Life",
// section "In the Name of Allah, the Entirely Merciful, the Especially Merciful", printed p.34.
// Hook (hookscore 83.0 → 85.6): "Bismillah before Al-Fatihah: you don't start with your strength."
// Qur'an: 1:1 from quran/verse.py only (EX['1:1'], fragment EX['1:1-bismillah']). VERSE windows = the hook's
// بِسْمِ اللَّهِ, line 3 (the whole verse) and line 14 (بِسْمِ اللَّهِ): no music there, calm motion (whooshes only).
//
// WORLD (one road, x): 540 the mat · 1150 experience (books) · 1750 worthiness (stars) · 2350 alone (the load)
//                      · 3000 the door of hope · 3260 prayer spot (second mat) · 4150 the cold tower (far, on a hill).
// MOODS: dawn (hook) → dusk (what you lean on) → gold (the verse) → dusk (carrying it alone) → gold (begin with Allah:
//        help, blessing, mercy, the door) → dusk (a distant, unfeeling power) → gold (mercy embraces) → night (prayer)
//        → dawn (callback, question, end).
//
// STORYBOARD (line → picture → what it says)
//  0  hook "you don't start with your strength" → dawn; he stands on his mat, hands folded, the verse large above him;
//        on "strength" he flexes, a dumbbell pops into his fist          → the thing we think we start with
//  1  "Not with your experience" → he sets the dumbbell down (thud) and walks right, the camera travels; books drop in one
//        by one into a tall stack; he leans on it                          → years of knowing how
//  2  "Not with your worthiness" → he walks on; three gold stars pop over his head; hand on chest, chin up → merit
//  3  the verse (Arabic, word by word) → BIG PULL-BACK: the whole road, dumbbell, books and stars small; gold light;
//        the verse drops in word by word with the voice; the three things shrink to half (calm, no music)
//  4  "It frees you from an illusion:" → camera flies back down; dusk; a boulder drops onto his back; he bends under it
//  5  "that you're doing this on your own." → he trudges right with it, alone on an empty road; camera eases back (lonely)
//  6  "You begin with Allah," → gold; the boulder lifts off his back, rises and vanishes; he straightens
//  7  "asking His help, His blessing, His mercy." → hands open (dua); on each word: a lantern comes down and lands
//        (help), a sprout grows at his feet (blessing), a heart lights in his chest (mercy)
//  8  "And mercy, right at the start," → the heart swells and glows; he walks on toward a closed door
//  9  "opens the door of hope." → push-in; the door swings open and warm light pours over him
// 10  "not walking up to a distant, unfeeling power" → dusk; he steps through; PULL-BACK: far away on a hill a cold grey
//        tower in a cold wind, he is tiny below it                          → what you are NOT walking up to
// 11  "a Lord whose mercy embraces you" → gold; the tower sinks away; PUSH-IN on him; a dome of warm light draws round
//        him, the heart glows                                               → mercy that embraces
// 12  "don't just repeat it from memory" → night; a mat under him, hands folded; a thought bubble with a looping arrow spins
// 13  "You're entering a conversation." → the bubble pops; a soft column of light; small lights rise from him and come back
// 14  "Bismillah." (Arabic) → dawn; بِسۡمِ ٱللَّهِ drops in word by word (calm, no music)
// 15  "Not your strength. His name first." → a dumbbell at his feet sinks into the ground; the phrase swells on "name"
// 16  END QUESTION → the phrase lifts; three small pictures pop as named: dumbbell, books, stars; he thinks (hand to chin)
// 17  "One word below." → the three pictures bob
// 18–19 end card → series promise + follow + book line; the last half second is the frame-1 picture (loop)
// =====================================================================================

loadFonts();
const {L, ST, wt, TOTAL} = tl(TL);
export {TOTAL, FPS};

const VERSE: string = (EX as any)['1:1'];
const FRAG: string = (EX as any)['1:1-bismillah'];
const VW = VERSE.split(' ');
const FW = FRAG.split(' ');

const AR = [
  `«${FRAG}» قبل الفاتحة: أنت لا تبدأ بقوّتك.`, 'ولا بخبرتك.', 'ولا باستحقاقك.', VERSE,
  'إنها تُحرِّرك من وَهْمٍ:', 'أنك تفعل هذا وحدك.', 'تبدأ بالله،', 'تطلب عونه وبركته ورحمته.',
  'والرحمة في البداية', 'تفتح باب الرجاء.', 'أنت لا تُقبِل على قوّةٍ بعيدةٍ بلا شعور.', 'بل تُقبِل على ربٍّ تَسَعُك رحمتُه.',
  'في صلاتك القادمة، لا تكرّرها من الذاكرة فقط.', 'أنت تدخل في حوار.', `«${FRAG}».`, 'لا بقوّتك. باسمه أولًا.',
  'على ماذا تتّكئ أكثر: قوّتك، أم خبرتك، أم استحقاقك؟', 'كلمة واحدة في التعليقات.', 'كلَّ يوم، عبارةٌ من صلاتك.', 'تابعنا للعبارة القادمة.',
];
const KEY_EN = [['bismillah', 'strength'], ['experience'], ['worthiness'], ['theentirely', 'theespecially'], ['illusion'], ['own'], ['allah'],
  ['help', 'blessing', 'mercy'], ['mercy'], ['hope'], ['distant', 'unfeeling'], ['mercy', 'embraces'], ['memory'], ['conversation'], ['bismillah'],
  ['name'], ['strength', 'experience', 'worthiness'], ['word'], ['every', 'day'], ['follow']];
const KEY_AR = [['بقوّتك'], ['بخبرتك'], ['باستحقاقك'], [], ['وَهْمٍ'], ['وحدك'], ['بالله'], ['عونه', 'وبركته', 'ورحمته'], ['الرحمة'], ['الرجاء'],
  ['بعيدةٍ', 'بلا شعور'], ['تَسَعُك رحمتُه'], ['الذاكرة'], ['حوار'], [], ['باسمه'], ['قوّتك', 'خبرتك', 'استحقاقك'], ['كلمة'], ['كلَّ يوم'], ['تابعنا']];

const HS = 1.35;
const X = {start: 540, exp: 1150, wor: 1750, alone: 2350, door: 3000, pray: 3260, tower: 4150};
const BOOKS_X = X.exp + 178, DB_REST = X.start + 175;
const tStrength = wt(0, 'strength'), tDrop = ST[1] - 0.5;

// ---------------- the hero, as a function of time ----------------
type Hero = {x: number; pose: Pose; s: number; flip: boolean};
const heroRaw = (t: number): Hero => {
  let x = X.start, pose: Pose = P.folded, s = 1;
  if (t < ST[1] - 0.4) {   // hook: folded in prayer → flexes on "strength" → drops the arm
    pose = P.folded;
    if (t > tStrength - 0.3) pose = settle(P.folded, P.flex, t, tStrength - 0.3, 0.4);
    if (t > tDrop) pose = settle(P.flex, P.stand, t, tDrop, 0.35);
  } else if (t < ST[2] - 0.3) {   // walk to the books, lean on them
    const w = stroll(t, ST[1] - 0.4, ST[1] + 0.35, X.start, X.exp, P.stand, HS); x = w.x; pose = w.pose;
    if (t > ST[1] + 0.35) pose = settle(P.stand, P.leanOn, t, ST[1] + 0.35, 0.4);
  } else if (t < ST[4] - 0.25) {   // walk to the stars, proud; calm through the verse
    const w = stroll(t, ST[2] - 0.3, ST[2] + 0.35, X.exp, X.wor, P.stand, HS); x = w.x; pose = w.pose;
    if (t > ST[2] + 0.35) pose = settle(P.stand, P.proud, t, ST[2] + 0.35, 0.45);
    if (t > ST[3] + 0.3) pose = lerpPose(P.proud, P.stand, k(t, ST[3] + 0.3, 1.2, inOut));
  } else if (t < ST[6] + 0.05) {   // the load: bent, then trudging alone
    pose = settle(P.stand, P.carry, t, ST[4] - 0.25, 0.45); x = X.wor;
    if (t > ST[4] + 0.55) {const p = inOut((t - (ST[4] + 0.55)) / (ST[6] - 0.1 - (ST[4] + 0.55))); x = mix(X.wor, X.alone, p);
      if (p < 1) pose = walkByDistance(P.carry, x - X.wor, HS, 0.55 * Math.min(1, Math.sin(Math.PI * p) * 2.5), 18);}
  } else if (t < ST[8] + 0.25) {   // freed; asks
    x = X.alone; pose = settle(P.carry, P.stand, t, ST[6] + 0.05, 0.5);
    if (t > ST[7] - 0.3) pose = settle(P.stand, P.dua, t, ST[7] - 0.3, 0.45);
  } else if (t < ST[10] + 0.2) {   // walk to the door
    const w = stroll(t, ST[8] + 0.25, ST[9] + 0.05, X.alone, X.door - 190, P.stand, HS); x = w.x; pose = w.pose;
    if (t < ST[8] + 0.5) pose = lerpPose(P.dua, pose, k(t, ST[8] + 0.25, 0.25));
    if (t > ST[9] + 0.05) pose = settle(P.stand, P.lookup, t, ST[9] + 0.05, 0.45);
  } else if (t < ST[12] - 0.35) {   // step through the door; stands under mercy
    const w = stroll(t, ST[10] + 0.2, ST[11] - 0.3, X.door - 190, X.pray, P.stand, HS); x = w.x; pose = w.pose;
    if (t > ST[11] - 0.3) pose = settle(P.stand, {...P.lookup, head: -14, aL: [-40, -30], aR: [40, 30]}, t, ST[11] - 0.3, 0.5);
  } else if (t < ST[16] - 0.2) {   // prayer
    x = X.pray; pose = settle({...P.lookup, head: -14, aL: [-40, -30], aR: [40, 30]}, P.folded, t, ST[12] - 0.35, 0.55);
    if (t > ST[12] + 0.2 && t < ST[13]) pose = {...pose, head: pose.head + 8 * k(t, ST[12] + 0.2, 0.6, inOut)};
  } else if (t < ST[18] + 0.4) {   // the question: thinks, glances at each picture
    x = X.pray; pose = settle(P.folded, P.think, t, ST[16] - 0.2, 0.5);
    pose = {...pose, head: pose.head - 10 * win(t, wt(16, 'strength') - 0.1, wt(16, 'worthiness') + 0.6, 0.3, 0.4)};
  } else {
    x = X.pray; pose = settle(P.think, P.folded, t, ST[18] + 0.4, 0.6);
  }
  pose = {...pose, lean: pose.lean + 0.9 * Math.sin(t * 1.7)};   // breathing
  return {x, pose, s: s * HS, flip: false};
};
const hero = (t: number): Hero => {
  const h = heroRaw(t), lag = heroRaw(t - 0.08);
  return {...h, pose: {...h.pose, head: mix(h.pose.head, lag.pose.head, 0.5)}};
};
const handR = (h: Hero) => {const j = figureJoints(h.pose); return [h.x + j.AR.hand[0] * h.s, GROUND + (j.hipY + j.AR.hand[1]) * h.s];};
const neckAt = (h: Hero) => {const j = figureJoints(h.pose); return [h.x + j.neck[0] * h.s, GROUND + (j.hipY + j.neck[1]) * h.s];};

// ---------------- camera ----------------
const follow = (tt: number) => {const a = heroRaw(tt + 0.1).x, b = heroRaw(tt).x; return mix(b, a, 0.6) + 40;};
const WIDE = {x: 1320, y: 230, z: 0.32};
const camAtT = (t: number): Cam => {
  if (t < ST[1] - 0.4) return {x: X.start, y: 960, z: 1 + 0.06 * k(t, 0, ST[1], (q) => q)};
  if (t < ST[3] - 0.45) {const p = k(t, ST[1] - 0.4, 0.6, inOut); return {x: follow(t), y: 960, z: mix(1.06, 1, p)};}
  if (t < ST[4] - 0.5) {   // big pull-back over the road (settles before the first Arabic word)
    const p = k(t, ST[3] - 0.45, 0.95, inOut); const z = Math.exp(mix(Math.log(1), Math.log(WIDE.z), p));
    return {x: mix(follow(ST[3] - 0.45), WIDE.x, p) + 40 * k(t, ST[3] + 0.5, 2.2, inOut), y: mix(960, WIDE.y, p), z};
  }
  if (t < ST[6]) {   // fly back down to him; ease back while he is alone
    const p = k(t, ST[4] - 0.5, 1.0, inOut); const z = Math.exp(mix(Math.log(WIDE.z), Math.log(1), p));
    const lonely = k(t, ST[5] - 0.2, 1.4, inOut);
    return {x: mix(WIDE.x + 40, follow(t), p), y: mix(WIDE.y, 960, p) - 120 * lonely, z: z * (1 - 0.28 * lonely)};
  }
  if (t < ST[9] - 0.2) {const p = k(t, ST[6], 0.8, inOut); return {x: follow(t), y: mix(840, 960, p), z: mix(0.72, 1, p)};}
  if (t < ST[10] - 0.1) {const p = k(t, ST[9] - 0.2, 1.1, inOut); return {x: mix(follow(ST[9] - 0.2), X.door - 90, p), y: mix(960, 930, p), z: mix(1, 1.22, p)};}
  if (t < ST[11] - 0.25) {   // pull-back: the far cold tower
    const p = k(t, ST[10] - 0.1, 1.2, inOut); const z = Math.exp(mix(Math.log(1.22), Math.log(0.4), p));
    return {x: mix(X.door - 90, 3650, p), y: mix(930, 420, p), z};
  }
  if (t < ST[12] - 0.3) {   // push-in on him
    const p = k(t, ST[11] - 0.25, 1.1, inOut); const z = Math.exp(mix(Math.log(0.4), Math.log(1.15), p));
    return {x: mix(3650, X.pray + 20, p), y: mix(420, 990, p), z};
  }
  const p = k(t, ST[12] - 0.3, 0.8, inOut);
  return {x: X.pray + 20 * (1 - p), y: mix(990, 960, p), z: mix(1.15, 1, p) + 0.06 * win(t, ST[12], ST[14] - 0.2, 1.2, 0.6)};
};

export const B02: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const loopIn = k(t, TOTAL - 0.55, 0.5, inOut);   // the last half second becomes frame 1 (seamless loop)
  const m = moodAt(t, [[0, 'dawn'], [ST[1] - 0.2, 'dusk'], [ST[3] - 0.2, 'gold'], [ST[4] - 0.2, 'dusk'], [ST[6], 'gold'], [ST[10], 'dusk'],
    [ST[11] - 0.1, 'gold'], [ST[12] - 0.2, 'night'], [ST[14] - 0.2, 'dawn']]);
  const night = win(t, ST[12] - 0.4, ST[14], 0.6, 0.6);
  let cam = camAtT(t);
  const H0 = hero(t), Hp = hero(t - 1 / 30), Hpp = hero(t - 2 / 30);
  const hx = H0.x;
  if (loopIn > 0) cam = {x: mix(cam.x, hx, loopIn), y: mix(cam.y, 960, loopIn), z: mix(cam.z, 1, loopIn)};
  const speed = Math.abs(H0.x - Hp.x);

  // sun
  const sunO = (1 - k(t, ST[1] - 0.5, 0.6)) + win(t, ST[3] - 0.3, ST[4] - 0.3, 0.6, 0.5) + win(t, ST[6], ST[10], 0.8, 0.5)
    + win(t, ST[11] - 0.1, ST[12] - 0.2, 0.7, 0.5) + k(t, ST[14] - 0.2, 0.8);
  const sunPos = t < ST[3] - 0.3 ? [X.start + 230, 1330] : t < ST[4] ? [WIDE.x, mix(1700, 300, k(t, ST[3] - 0.3, 2.6, inOut))]
    : t < ST[10] ? [hx + 260, 1250] : t < ST[12] ? [X.pray + 10, mix(1500, 1050, k(t, ST[11] - 0.1, 1.6, inOut))] : [X.pray + 240, 1330];

  // ---------------- the three things we lean on ----------------
  const shrink = 1 - 0.5 * k(t, ST[3], 1.4, inOut);
  const fade3 = 1 - k(t, ST[4] - 0.4, 0.5);
  const hh = handR(H0);
  const dbHeld = t > tStrength - 0.15 && t < tDrop;
  const dbPop = outBack(k(t, tStrength - 0.15, 0.35, (q) => q));
  const dbFall = k(t, tDrop, 0.32, (q) => clamp(q) * clamp(q));
  const dropFrom = handR(hero(tDrop));
  const sinceLand = t - (tDrop + 0.32);
  const dbY = mix(dropFrom[1], GROUND - 42, dbFall) - (sinceLand > 0 && sinceLand < 0.25 ? 16 * Math.sin((sinceLand / 0.25) * Math.PI) : 0);
  const booksN = 6 * clamp((t - (ST[1] + 0.05)) / 0.9) + 0;
  const starAt = [0, 1, 2].map((i) => ST[2] + 0.2 + i * 0.22);

  // ---------------- the load ----------------
  const nk = neckAt(H0);
  const loadIn = k(t, ST[4] - 0.2, 0.35, (q) => clamp(q) * clamp(q));
  const loadUp = k(t, ST[6] + 0.05, 1.1, inOut);
  const loadO = t < ST[4] - 0.2 ? 0 : 1 - k(t, ST[6] + 0.1, 0.55, inOut);
  const loadX = nk[0] - 40, loadY = mix(nk[1] - 700, nk[1] + 18, loadIn) - 420 * loadUp;

  // ---------------- help, blessing, mercy ----------------
  const tHelp = wt(7, 'help'), tBless = wt(7, 'blessing'), tMercy = wt(7, 'mercy');
  const lanD = k(t, tHelp - 0.35, 0.5, outCubic);
  const lanO = t < tHelp - 0.35 ? 0 : 1 - k(t, ST[12] - 0.5, 0.5);
  const sproutP = k(t, tBless - 0.15, 1.0, outCubic) * (1 - k(t, ST[12] - 0.5, 0.5));
  const heartP = outBack(k(t, tMercy - 0.1, 0.4, (q) => q));
  const heartR = (14 + 10 * k(t, ST[8], 0.9, outBack) + 5 * win(t, ST[11], ST[12], 0.5, 0.4)) * HS * 0.75;
  const heartO = t < tMercy - 0.1 ? 0 : clamp(heartP * 2) * (1 - 0.4 * night) * (1 - k(t, ST[16] - 0.3, 0.4));
  const chest = chestAt(hx, H0.pose, H0.s);

  // ---------------- door, tower, dome ----------------
  const doorIn = outBack(k(t, ST[8] + 0.3, 0.5, (q) => q));
  const doorOpen = k(t, wt(9, 'opens') - 0.05, 0.7, inOut);
  const doorO = t < ST[8] + 0.3 ? 0 : clamp(doorIn * 2) * (1 - k(t, ST[11] + 0.4, 0.6));
  const doorLight = 1 - 0.65 * win(t, ST[10] + 0.3, ST[11] - 0.1, 0.5, 0.4);
  const towerO = win(t, ST[10] - 0.2, ST[11] + 0.9, 0.5, 0.4);
  const towerSink = k(t, ST[11] - 0.15, 1.0, inOut);
  const domeP = k(t, wt(11, 'mercy') - 0.25, 1.3, inOut);
  const domeO = 1 - k(t, ST[12] - 0.2, 0.6);

  // ---------------- prayer: memory loop, conversation ----------------
  const head = headAt(hx, H0.pose, H0.s);
  const bubIn = k(t, wt(12, 'repeat') - 0.35, 0.4, outBack), bubPop = k(t, ST[13] - 0.05, 0.18, inOut);
  const bubO = t < wt(12, 'repeat') - 0.35 ? 0 : clamp(bubIn * 3) * (1 - bubPop);
  const bubX = X.pray + 270, bubY = 1000 + 8 * Math.sin(t * 1.4);
  const loopRot = (t - ST[12]) * (240 + 360 * k(t, wt(12, 'memory') - 0.2, 0.5));
  const matP = k(t, ST[12] - 0.45, 0.4, outBack);
  const column = win(t, ST[13] - 0.05, ST[14] + 0.4, 0.4, 0.6);
  const popSpark = win(t, ST[13] - 0.05, ST[13] + 0.4, 0.05, 0.3);

  // ---------------- callback dumbbell + question pictures ----------------
  const cbIn = outBack(k(t, ST[15] - 0.1, 0.35, (q) => q));
  const cbSink = k(t, wt(15, 'his') - 0.1, 0.8, inOut);
  const cbO = t < ST[15] - 0.1 || cbSink >= 1 ? 0 : 1;
  const qPop = (w: string) => outBack(k(t, wt(16, w) - 0.12, 0.4, (q) => q));
  const qOut = k(t, ST[18] - 0.15, 0.4, inOut);
  const qBob = (n: number) => 10 * Math.sin(t * 4 + n * 1.3) * win(t, ST[17] - 0.1, ST[18], 0.3, 0.3);

  // ---------------- the phrase (screen space) ----------------
  const swellA = win(t, ST[0], wt(0, 'before'), 0.12, 0.4) * 0.08;
  let A = {enter: [-1, -1, -1, -1], y: 760, scale: 1, glow: 0.2, out: k(t, ST[1] - 0.3, 0.55), o: 1, swell: [swellA, swellA, 0, 0]};
  if (t >= ST[3] - 0.4 && t < ST[14] - 0.3) {
    const we = L[3].words.map((w) => w[1] - 0.1);
    A = {enter: we, y: 720, scale: 1.05, glow: 0.3 + 0.7 * k(t, wt(3, 'the'), 1.2), out: k(t, ST[4] - 0.35, 0.5), o: 1,
      swell: we.map((e, i) => 0.1 * win(t, e + 0.05, e + 0.75, 0.15, 0.45) * (i >= 2 ? 1 : 0.6))};
  } else if (t >= ST[14] - 0.3) A = {...A, o: 0};
  const aLoop = loopIn;
  const fragE = [ST[14] - 0.08, ST[14] + 0.32];
  const fragOut = k(t, ST[16] - 0.3, 0.5);
  const fragSw = 0.14 * win(t, wt(15, 'name') - 0.05, wt(15, 'name') + 0.8, 0.15, 0.5);

  // ---------------- end card ----------------
  const endO = k(t, ST[18] - 0.2, 0.4) * (1 - loopIn);
  const QP: {w: string; label: string}[] = [{w: 'strength', label: 'STRENGTH'}, {w: 'experience', label: 'EXPERIENCE'}, {w: 'worthiness', label: 'WORTHINESS'}];

  return (
    <AbsoluteFill style={{background: m.sky1}}>
      <Sky m={m} cam={cam} t={t} sunX={sunPos[0]} sunY={sunPos[1]} sun={clamp(sunO)} stars={night} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs><clipPath id="b02ground" clipPathUnits="userSpaceOnUse"><rect x={-9999} y={-9999} width={30000} height={9999 + GROUND} /></clipPath></defs>
        <g transform={camTransform(cam)}>
          <Ground m={m} />
          {/* the far cold tower */}
          <Tower x={X.tower} sink={towerSink} o={towerO} t={t} />
          {/* mats */}
          <Mat x={X.start} o={1 - k(t, ST[4], 0.4) + loopIn * 0} />
          <Mat x={X.pray} p={matP} o={t < ST[12] - 0.45 ? 0 : 1} />
          {/* 0–3 the dumbbell, books, stars */}
          {t > tDrop && <Dumbbell x={DB_REST - (1 - dbFall) * (DB_REST - dropFrom[0])} y={dbY} rot={(1 - dbFall) * -60} s={0.85 * (t > ST[3] ? shrink : 1)} o={fade3} c={m.ink} />}
          {booksN > 0 && <Books x={BOOKS_X} n={booksN} s={t > ST[3] ? shrink : 1} o={fade3} />}
          {starAt.map((a, i) => {const p = outBack(k(t, a, 0.4, (q) => q)); const sx = X.wor + (i - 1) * 105, sy = GROUND - 690 - (i === 1 ? 50 : 0) + 8 * Math.sin(t * 3 + i);
            return t > a ? <Star key={i} x={sx} y={sy + (1 - shrink) * 300} r={46 * p * (t > ST[3] ? shrink : 1)} o={fade3} glow={0.6} /> : null;})}
          {/* 7 help, blessing */}
          {lanO > 0 && <Lantern x={X.alone + 175} y={mix(GROUND - 900, GROUND, lanD) - (lanD > 0.98 ? 0 : 0)} s={1.25} o={lanO} t={t} glow={0.6 + 0.6 * k(t, tHelp + 0.15, 0.4)} />}
          <Sprout x={X.alone - 150} p={sproutP} h={150} leaf="#6f9a6a" c={m.ink} />
          <Sprout x={X.alone - 235} p={sproutP * 0.85 - 0.1} h={95} leaf="#7fa877" c={m.ink} />
          {/* 8–10 the door */}
          <Door x={X.door} open={doorOpen} o={doorO} light={doorLight} ink={m.ink} />
          {/* 11 the dome of mercy */}
          <Dome x={X.pray} r={330} p={domeP} o={domeO} c={C.acc} />
          {domeP > 0.3 && domeO > 0 && <circle cx={X.pray} cy={GROUND - 260} r={360} fill={C.sun} opacity={0.22 * domeO * clamp((domeP - 0.3) * 2)} />}
          {/* 13 conversation: a soft column of light, little lights going up and coming back */}
          {column > 0 && <g opacity={column}>
            <defs><linearGradient id="b02col" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3cf98" stopOpacity={0} /><stop offset="0.3" stopColor="#f3cf98" stopOpacity={0.2} /><stop offset="1" stopColor="#f3cf98" stopOpacity={0.12} /></linearGradient></defs>
            <rect x={X.pray - 90} y={660} width={180} height={GROUND - 330 - 660} fill="url(#b02col)" />
            {Array.from({length: 8}).map((_, n) => {const ph = ((t - ST[13]) * 0.55 + n / 8) % 1; const up = n % 2 === 0; const yy = up ? mix(GROUND - 520, 720, ph) : mix(720, GROUND - 520, ph);
              return <circle key={n} cx={X.pray + (up ? -28 : 28) + 10 * Math.sin(t * 2 + n)} cy={yy} r={up ? 9 : 12} fill={up ? C.white : C.sun} opacity={Math.sin(Math.PI * ph)} />;})}
          </g>}
          {/* 15 the dumbbell at his feet sinks away */}
          {cbO > 0 && <g clipPath="url(#b02ground)"><Dumbbell x={X.pray + 175} y={GROUND - 42 + cbSink * 130} s={0.85 * cbIn * (1 - 0.3 * cbSink)} c={m.ink} /></g>}
          {/* motion trail */}
          {speed > 5 && <>
            <Figure x={Hpp.x} pose={Hpp.pose} s={Hpp.s} c={m.ink} o={0.1} />
            <Figure x={Hp.x} pose={Hp.pose} s={Hp.s} c={m.ink} o={0.22} />
          </>}
          {/* the load on his back */}
          {loadO > 0 && <g opacity={loadO} transform={`translate(${loadX} ${loadY}) scale(${1 - 0.6 * loadUp}) translate(${-loadX} ${-loadY})`}><Boulder x={loadX} y={loadY} s={0.62} /></g>}
          {/* the hero */}
          <Figure x={hx} pose={H0.pose} s={H0.s} c={m.ink} />
          {dbHeld && <Dumbbell x={hh[0]} y={hh[1]} s={0.85 * dbPop} rot={-10} c={m.ink} />}
          {heartO > 0 && <Heart x={chest[0]} y={chest[1]} r={heartR} o={heartO} glow={0.8 + 0.6 * win(t, ST[8], ST[12], 0.5, 0.5)} />}
          {/* 12 the memory loop */}
          {bubO > 0 && <g transform={`translate(${bubX} ${bubY}) scale(${bubIn * (1 + 0.3 * bubPop)}) translate(${-bubX} ${-bubY})`}>
            <Bubble x={bubX} y={bubY} r={72} o={bubO} from={[mix(head[0], bubX, 0.12), head[1] - 30]} fill="#2a3858" ink={m.ink}><LoopGlyph rot={loopRot} s={1.15} c={m.ink} /></Bubble>
          </g>}
          {popSpark > 0 && <g opacity={popSpark}>{Array.from({length: 8}).map((_, j) => {const a = (j / 8) * Math.PI * 2; const r = 50 + 80 * (1 - popSpark);
            return <line key={j} x1={bubX + Math.cos(a) * r * 0.6} y1={bubY + Math.sin(a) * r * 0.6} x2={bubX + Math.cos(a) * r} y2={bubY + Math.sin(a) * r} stroke={C.acc} strokeWidth={7} strokeLinecap="round" />;})}</g>}
        </g>
                {/* 16–17 the three choices (screen space) */}
        {t > wt(16, 'strength') - 0.15 && qOut < 1 && QP.map((q, n) => {const p = qPop(q.w); if (p <= 0) return null; const cx = 250 + n * 290, cy = 800 + qBob(n);
          return <g key={n} opacity={clamp(p * 2) * (1 - qOut)} transform={`translate(${cx} ${cy}) scale(${p * (1 - 0.3 * qOut)})`}>
            <circle r={105} fill={C.white} stroke={m.ink} strokeWidth={6} />
            {n === 0 && <Dumbbell x={0} y={-6} s={0.72} c={m.ink} />}
            {n === 1 && <g transform={`translate(0 ${62 - 0.55 * GROUND}) scale(0.55)`}><Books x={0} n={4} /></g>}
            {n === 2 && <><Star x={-36} y={8} r={26} glow={0} /><Star x={36} y={8} r={26} glow={0} /><Star x={0} y={-30} r={30} glow={0} /></>}
            <text y={150} textAnchor="middle" fontFamily={FT.enB} fontSize={26} letterSpacing={3} fill={m.ink}>{q.label}</text>
          </g>;})}
      </svg>

      <PhraseWords words={VW} enter={A.enter} t={t} y={A.y} size={100} scale={A.scale} glow={A.glow} out={A.out} o={A.o * (1 - aLoop)} font={FT.quran} swell={A.swell} stroke={1.2} />
      {aLoop > 0 && <PhraseWords words={VW} enter={[-1, -1, -1, -1]} t={t} y={760} size={100} glow={0.2} o={aLoop} font={FT.quran} stroke={1.2} />}
      {t > ST[14] - 0.2 && <PhraseWords words={FW} enter={fragE} t={t} y={760} size={128} glow={0.35 + fragSw * 4} out={fragOut} font={FT.quran} swell={[fragSw, fragSw]} o={1 - loopIn} stroke={1.4} />}

      <SeriesLabel text="MY PRAYER · 02" o={1 - endO * 0.6} c={night > 0.5 ? '#8e98ad' : C.mute} />
      <Captions t={t} L={L} ar={AR} keyEn={KEY_EN} keyAr={KEY_AR} o={1 - loopIn} size={50} top={300} ink={m.cap} inkAr={m.capAr} quranParts={[VERSE, FRAG]} />
      {loopIn > 0 && <Captions t={t} L={L} ar={AR} keyEn={KEY_EN} keyAr={KEY_AR} force={0} o={loopIn} size={50} top={300} ink={m.cap} inkAr={m.capAr} quranParts={[VERSE, FRAG]} />}
      {endO > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: 1488, textAlign: 'center', fontFamily: FT.enM, fontSize: 30, letterSpacing: 2, color: m.ink, opacity: endO * 0.75}}>
        From the book <span style={{fontFamily: FT.enB}}>My Prayer</span> · Yasser Fares</div>}
    </AbsoluteFill>
  );
};
