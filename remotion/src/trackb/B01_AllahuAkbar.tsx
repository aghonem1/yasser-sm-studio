import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import TL from './timeline_b01.json';
import {
  FPS, W, H, GROUND, C, FT, loadFonts, tl, k, win, mix, clamp, inOut, outBack, outCubic,
  Backdrop, Figure, P, lerpPose, walk, Pose, chestAt, headAt, Heart, Cloud, Phone, Trophy, Boulder, Bubble, Glyph,
  Captions, BigArabic, SeriesLabel,
} from './kit';

// =====================================================================================
// Track B · 01 · اللهُ أَكْبَرُ (Allahu Akbar) — from "My Prayer" by Yasser Fares,
// Ch.4 "The Opening Takbir: From the Call to the Answer", printed p.31–32.
// Hook (hookscore 37.8 → 93.8): "Allahu Akbar is not only 'Allah is great.' You've been saying 'greater.'"
//
// STORYBOARD (line → picture → what it says)
//  0  hook            → frame 1: the figure in takbir, اللهُ أَكْبَرُ large above him         → this is about the words you open prayer with
//  1  "greater"       → the Arabic pulses bigger                                               → "akbar" is a comparison
//  2  greater than what? → the Arabic lifts away, a big "?" appears, he looks around            → the question
//  3  fear            → a storm cloud rises behind him and grows; he backs away, cowering       → fear chasing you
//  4  desire          → a glowing phone pulls him by a string                                   → desire that wants to be obeyed
//  5  judgement       → a tall figure points down at him; he shrinks                           → someone's judgement weighing on you
//  6  success         → a trophy on a podium; he reaches up for it                              → success that tempts
//  7  sin vs mercy    → a boulder grows over him as he kneels; a tiny heart (mercy) beside it   → the sin you think is bigger than mercy
//  8  every comparison → the five things line up small; اللهُ أَكْبَرُ rises above the row        → the takbir is a comparison with all of them
//  9  rises above it  → the Arabic climbs and grows; the row shrinks and sinks                   → and wins it
// 10  nothing rivals  → light opens around the Arabic; the row is tiny                          → nothing rivals Him
// 11  mind wanders    → standing in prayer; thought bubbles pop out; his heart drifts to one    → distraction in prayer
// 12  don't be harsh  → he stays calm, head bowed; no struggle                                  → gentleness with yourself
// 13–14 bring it back → the heart glides back to his chest along a soft curve                  → return gently to the first words
// 15–16 callback     → he raises his hands again (frame-1 pose); the bubbles shrink and pop      → greater than this thought too
// 17–18 end card     → series promise + follow; ends on the frame-1 picture for the loop
// =====================================================================================

loadFonts();
const {L, ST, wt, TOTAL} = tl(TL);
export {TOTAL, FPS};

const AR = [
  '«اللهُ أكبر» ليست فقط «اللهُ عظيم».',
  'أنت تقول: «أكبر».',
  'أكبرُ من ماذا؟',
  'من الخوف الذي يطاردك.',
  'من الرغبة التي تريد أن تُطاع.',
  'من الشخص الذي يُثقِلك حُكمُه عليك.',
  'من النجاح الذي يُغريك.',
  'حتى الذنب الذي تظنّه أكبرَ من رحمته.',
  '«اللهُ أكبر» تفتح كلَّ مقارنة،',
  'ثم تعلو عليها.',
  'لا شيء يُضاهي عظمةَ الله.',
  'فإذا شرد ذهنُك في الصلاة،',
  'فلا تقسُ على نفسك.',
  'أعِد قلبك برفق،',
  'إلى الكلمات الأولى.',
  'اللهُ أكبر.',
  'أكبرُ من هذه الفكرة أيضًا.',
  'كلَّ يوم، عبارةٌ من صلاتك.',
  'تابعنا للعبارة القادمة.',
];
const KEY_EN = [['great'], ['greater'], ['what'], ['fear'], ['desire'], ['judgement'], ['success'], ['sin', 'mercy'], ['comparison'], ['rises'], ['nothing'],
  ['wanders'], ['harshly'], ['gently'], ['first'], ['allahu', 'akbar'], ['thought'], ['every', 'day'], ['follow']];
const KEY_AR = [['عظيم'], ['أكبر'], ['ماذا'], ['الخوف'], ['الرغبة'], ['حُكمُه'], ['النجاح'], ['الذنب', 'رحمته'], ['مقارنة'], ['تعلو'], ['لا شيء'],
  ['شرد'], ['تقسُ'], ['برفق'], ['الأولى'], ['اللهُ أكبر'], ['الفكرة'], ['كلَّ يوم'], ['تابعنا']];
const PHRASE = 'اللهُ أَكْبَرُ';   // trackb/phrases.json: takbir

export const B01: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const loopIn = k(t, TOTAL - 0.55, 0.5, inOut);   // last half second returns to frame 1 (seamless loop)

  // ---------------- hero pose & place ----------------
  let pose: Pose = P.takbir, hx = 540, hs = 1, flip = false; const HS = 1.35;
  if (t < ST[2]) pose = P.takbir;
  else if (t < ST[3]) {pose = lerpPose(P.takbir, P.lookup, k(t, ST[2], 0.45, inOut)); pose = {...pose, head: pose.head + 12 * Math.sin((t - ST[2]) * 6) * k(t, ST[2] + 0.3, 0.3)};}
  else if (t < ST[4]) {   // fear: backs away from the cloud on the left
    const p = k(t, ST[3], 0.5, inOut); pose = lerpPose(P.lookup, P.cower, p); hx = mix(540, 700, k(t, ST[3], 1.6, inOut)) + 3 * Math.sin(t * 40) * p; flip = true;
  } else if (t < ST[5]) {   // desire: pulled toward the phone
    const p = k(t, ST[4], 0.5, inOut); pose = lerpPose(P.cower, P.pulled, p); hx = mix(700, 600, k(t, ST[4], 0.6, inOut)) + 40 * k(t, ST[4] + 0.6, 1.2, inOut);
    if (t > ST[4] + 0.6) pose = walk(P.pulled, (t - ST[4]) * 6, 0.25);
  } else if (t < ST[6]) {   // judgement: shrinks under the tall figure
    pose = lerpPose(P.pulled, P.small, k(t, ST[5], 0.5, inOut)); hx = mix(640, 400, k(t, ST[5], 0.6, inOut)); hs = mix(1, 0.62, k(t, ST[5] + 0.4, 0.9, inOut));
  } else if (t < ST[7]) {   // success: reaches up
    pose = lerpPose(P.small, P.reach, k(t, ST[6], 0.5, inOut)); hx = mix(400, 440, k(t, ST[6], 0.6)); hs = mix(0.62, 1, k(t, ST[6], 0.6, inOut));
    pose = {...pose, aR: [pose.aR[0] + 8 * Math.sin(t * 7), pose.aR[1] + 8 * Math.sin(t * 7)]};
  } else if (t < ST[8]) {   // sin: kneels under the boulder
    pose = lerpPose(P.reach, P.kneel, k(t, ST[7], 0.6, inOut)); hx = mix(440, 300, k(t, ST[7], 0.7, inOut));
  } else if (t < ST[11]) {   // comparison: stands, small, hands raised
    pose = lerpPose(P.kneel, P.takbir, k(t, ST[8] - 0.1, 0.6, inOut)); hx = mix(300, 540, k(t, ST[8] - 0.1, 0.7, inOut)); hs = mix(1, 0.78, k(t, ST[8], 0.7, inOut));
  } else if (t < ST[15]) {   // standing in prayer
    pose = lerpPose(P.takbir, P.folded, k(t, ST[11] - 0.2, 0.6, inOut)); hs = mix(0.78, 1, k(t, ST[11] - 0.2, 0.8, inOut));
    if (t > ST[12]) pose = {...pose, head: pose.head + 10 * k(t, ST[12], 0.6, inOut)};   // don't fight: head bows softly
    pose = {...pose, lean: pose.lean + 0.8 * Math.sin(t * 1.6)};
  } else {   // callback: takbir again
    pose = lerpPose({...P.folded, head: 18}, P.takbir, k(t, ST[15] - 0.25, 0.5, inOut));
  }
  if (loopIn > 0) {hx = mix(hx, 540, loopIn); hs = mix(hs, 1, loopIn); pose = lerpPose(pose, P.takbir, loopIn);}
  hs *= HS;

  // ---------------- the big phrase ----------------
  const pulse = 1 + 0.12 * win(t, wt(1, 'greater') - 0.05, wt(1, 'greater') + 0.7, 0.18, 0.5);
  let arO = 1, arY = 790, arS = 1, arGlow = 0.25;
  if (t >= ST[2] && t < ST[8] - 0.2) {arO = 1 - k(t, ST[2] + 0.1, 0.4); arY = mix(790, 700, k(t, ST[2], 0.5));}
  if (t >= ST[8] - 0.2 && t < ST[11]) {
    arO = k(t, ST[8] - 0.2, 0.35); arY = mix(960, 790, k(t, ST[8] - 0.2, 0.7, outCubic)) - 110 * k(t, ST[9], 1.0, inOut);
    arS = mix(0.8, 1, k(t, ST[8] - 0.2, 0.7)) * (1 + 0.28 * k(t, ST[9], 1.1, inOut)); arGlow = 0.25 + 0.9 * k(t, ST[10], 0.8);
  }
  if (t >= ST[11] - 0.2 && t < ST[15] - 0.2) arO = 1 - k(t, ST[11] - 0.2, 0.4);
  if (t >= ST[15] - 0.2) {arO = k(t, ST[15] - 0.2, 0.35); arY = 760; arS = mix(0.85, 1, k(t, ST[15] - 0.2, 0.5, outBack)); arGlow = 0.35;}
  if (loopIn > 0) {arO = mix(arO, 1, loopIn); arY = mix(arY, 790, loopIn); arS = mix(arS, 1, loopIn); arGlow = mix(arGlow, 0.25, loopIn);}
  const rays = win(t, ST[10] - 0.1, ST[11] - 0.1, 0.6, 0.4);

  // ---------------- the "?" ----------------
  const qO = win(t, ST[2] - 0.05, ST[3] + 0.15, 0.15, 0.3), qS = outBack(k(t, ST[2] - 0.05, 0.35, (x) => x));

  // ---------------- the five things that compete ----------------
  const cloudO = win(t, ST[3] - 0.1, ST[4] + 0.2, 0.3, 0.4), cloudS = mix(0.45, 1.15, k(t, ST[3] - 0.1, 1.6, inOut));
  const phoneO = win(t, ST[4] - 0.1, ST[5] + 0.2, 0.3, 0.35);
  const tallO = win(t, ST[5] - 0.1, ST[6] + 0.15, 0.35, 0.35), tallS = mix(1.7, 2.25, k(t, ST[5], 1.2, inOut));
  const tropO = win(t, ST[6] - 0.1, ST[7] + 0.15, 0.3, 0.35);
  const bouldO = win(t, ST[7] - 0.1, ST[8] + 0.1, 0.3, 0.35), bouldS = mix(0.55, 1.35, k(t, ST[7], 1.8, inOut));
  const mercyP = k(t, wt(7, 'mercy') - 0.1, 0.35, outBack);
  // the row (8–10)
  const rowIn = (n: number) => k(t, ST[8] - 0.15 + n * 0.12, 0.35, outBack);
  const rowShrink = 1 - 0.62 * k(t, ST[9], 1.1, inOut), rowSink = 70 * k(t, ST[9], 1.1, inOut);
  const rowO = 1 - k(t, ST[11] - 0.3, 0.4) - 0.45 * k(t, ST[10], 0.6);
  const showRow = t > ST[8] - 0.2 && t < ST[11] + 0.2;
  const RX = [115, 265, 405, 690, 890], RY = 1230;

  // ---------------- thoughts in prayer (11–16) ----------------
  const head = headAt(hx, pose, hs);
  const BUB: {x: number; y: number; kind: 'clock' | 'phone' | 'bill' | 'chat'; at: number}[] = [
    {x: 225, y: 1060, kind: 'phone', at: wt(11, 'wanders')},
    {x: 860, y: 1010, kind: 'clock', at: wt(11, 'prayer') - 0.1},
    {x: 250, y: 830, kind: 'bill', at: ST[12] - 0.1},
    {x: 835, y: 800, kind: 'chat', at: ST[12] + 0.5},
  ];
  const POP = [2, 3, 0, 1];   // the upper bubbles (near the phrase) go first
  const popAt = (n: number) => ST[15] - 0.15 + POP[n] * 0.3;
  const bub = (n: number) => {
    const b = BUB[n]; const inn = k(t, b.at, 0.35, outBack); const out = k(t, popAt(n), 0.22, inOut);
    return {o: clamp(inn * 3) * (1 - out) * (t < ST[11] - 0.3 ? 0 : 1), s: inn * (1 - out * 0.8)};
  };
  // the heart: leaves the chest toward the phone bubble, comes back gently (13)
  const chest = chestAt(hx, pose, hs);
  const away = k(t, wt(11, 'wanders') + 0.2, 1.4, inOut), back = k(t, wt(13, 'back') - 0.1, 2.0, inOut);
  const hp = away * (1 - back);
  const hOn = t > ST[11] - 0.1 && t < ST[15] + 0.6;
  const target = [BUB[0].x + 60, BUB[0].y + 70];
  const ctrl = [mix(chest[0], target[0], 0.5), Math.min(chest[1], target[1]) - 140];
  const bez = (u: number) => [(1 - u) ** 2 * chest[0] + 2 * (1 - u) * u * ctrl[0] + u * u * target[0], (1 - u) ** 2 * chest[1] + 2 * (1 - u) * u * ctrl[1] + u * u * target[1]];
  const hPos = bez(hp);
  const sparks = (n: number) => win(t, popAt(n), popAt(n) + 0.45, 0.05, 0.3);

  // ---------------- end card ----------------
  const endO = k(t, ST[17] - 0.2, 0.4) * (1 - loopIn);

  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Backdrop t={t} sun={1 - 0.6 * win(t, ST[3], ST[8], 0.5, 0.6)} sunX={mix(760, 540, k(t, ST[8], 1))} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {/* light opening around the phrase (10) */}
        {rays > 0 && <g transform={`translate(540 ${arY - 40})`} opacity={rays}>
          {Array.from({length: 18}).map((_, n) => {const a = (n / 18) * Math.PI * 2 + t * 0.15; const r0 = 190, r1 = 420 + 40 * Math.sin(n * 2.1);
            return <line key={n} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0 * 0.75} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1 * 0.75} stroke={C.accL} strokeWidth={10} strokeLinecap="round" opacity={0.45} />;})}
        </g>}
        {/* 3 fear */}
        {cloudO > 0 && <Cloud x={mix(250, 300, k(t, ST[3], 1.5))} y={mix(1150, 960, k(t, ST[3] - 0.1, 1.4, inOut))} s={cloudS} o={cloudO} t={t} />}
        {/* 4 desire: phone + the string to his hand */}
        {phoneO > 0 && (() => {
          const px = 870, py = 1000 + 14 * Math.sin(t * 3);
          const j = chestAt(hx, pose, hs); const hand = [j[0] + 125, j[1] + 15];
          return <g opacity={phoneO}>
            <path d={`M${hand[0]} ${hand[1]} Q ${(hand[0] + px) / 2} ${py + 120} ${px - 40} ${py + 60}`} stroke={C.acc} strokeWidth={5} fill="none" strokeDasharray="2 14" strokeLinecap="round" />
            <Phone x={px} y={py} s={mix(0.8, 1.15, k(t, ST[4] - 0.1, 0.5, outBack))} t={t} rot={-8} />
          </g>;
        })()}
        {/* 5 judgement: a tall figure pointing down at him */}
        {tallO > 0 && <Figure x={820} pose={{...P.stand, lean: -6, head: 22, aR: [52, 64], aL: [-6, -2]}} s={tallS} c={C.teal} o={tallO} flip />}
        {/* 6 success */}
        {tropO > 0 && <Trophy x={790} y={GROUND} s={mix(0.8, 1.2, k(t, ST[6] - 0.1, 0.5, outBack))} o={tropO} t={t} />}
        {/* 7 sin vs mercy */}
        {bouldO > 0 && <Boulder x={700} y={GROUND} s={bouldS} o={bouldO} />}
        {bouldO > 0 && mercyP > 0 && <Heart x={430} y={1130} r={20 * mercyP} o={bouldO} />}
        {/* 8–10 the row of things, all smaller than the phrase */}
        {showRow && <g opacity={clamp(rowO)}>
          {[0, 1, 2, 3, 4].map((n) => {
            const s = rowIn(n) * 0.44 * rowShrink, x = RX[n], y = RY + rowSink;
            if (s <= 0.001) return null;
            return <g key={n}>
              {n === 0 && <Cloud x={x} y={y - 30} s={s} t={t} />}
              {n === 1 && <Phone x={x} y={y - 40} s={s * 1.05} t={t} />}
              {n === 2 && <Figure x={x} y={y + 160 * s} pose={P.stand} s={s * 1.4} c={C.teal} />}
              {n === 3 && <Trophy x={x} y={y + 150 * s} s={s} t={t} />}
              {n === 4 && <Boulder x={x} y={y + 130 * s} s={s} />}
            </g>;
          })}
        </g>}
        {/* the hero */}
        <Figure x={hx} pose={pose} s={hs} flip={flip} />
        {/* 11–16 thought bubbles */}
        {t > ST[11] - 0.3 && t < ST[17] && BUB.map((b, n) => {const q = bub(n); if (q.o <= 0.001) return null;
          return <g key={n} transform={`translate(${b.x} ${b.y}) scale(${q.s}) translate(${-b.x} ${-b.y})`}>
            <Bubble x={b.x} y={b.y} r={68} o={q.o} from={[mix(head[0], b.x, 0.12), head[1] - 40]}><Glyph kind={b.kind} s={1.1} /></Bubble>
          </g>;})}
        {t > ST[16] - 0.4 && t < ST[17] + 0.4 && BUB.map((b, n) => {const o = sparks(n); if (o <= 0) return null; const r = 40 + 90 * (1 - o);
          return <g key={'s' + n} opacity={o}>{Array.from({length: 8}).map((_, m) => {const a = (m / 8) * Math.PI * 2;
            return <line key={m} x1={b.x + Math.cos(a) * r * 0.6} y1={b.y + Math.sin(a) * r * 0.6} x2={b.x + Math.cos(a) * r} y2={b.y + Math.sin(a) * r} stroke={C.acc} strokeWidth={7} strokeLinecap="round" />;})}</g>;})}
        {/* the heart that wanders and returns */}
        {hOn && <>
          {hp > 0.02 && back > 0.02 && back < 0.98 && [0.2, 0.4, 0.6].map((f, n) => {const q = bez(clamp(hp + f * 0.25)); return <circle key={n} cx={q[0]} cy={q[1]} r={5} fill={C.acc} opacity={0.35 * (1 - f)} />;})}
          <Heart x={hPos[0]} y={hPos[1]} r={16 + 4 * Math.sin(t * 5) * (1 - hp)} o={k(t, ST[11] - 0.1, 0.4) * (1 - k(t, ST[15] + 0.2, 0.4))} />
        </>}
      </svg>

      {/* the big phrase */}
      <BigArabic text={PHRASE} x={540} y={arY} size={150} o={arO} scale={arS * pulse} glow={arGlow} />
      {/* "?" */}
      {qO > 0 && <div style={{position: 'absolute', left: 760, top: 900, width: 200, textAlign: 'center', fontFamily: FT.enB, fontSize: 230, color: C.acc, opacity: qO,
        transform: `scale(${qS}) rotate(${8 * Math.sin(t * 3)}deg)`}}>?</div>}

      <SeriesLabel text="MY PRAYER · 01" o={1 - endO * 0.6} />
      <Captions t={t} L={L} ar={AR} keyEn={KEY_EN} keyAr={KEY_AR} o={1 - loopIn} />
      {loopIn > 0 && <Captions t={t} L={L} ar={AR} keyEn={KEY_EN} keyAr={KEY_AR} force={0} o={loopIn} />}
      {endO > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: 1478, textAlign: 'center', fontFamily: FT.enM, fontSize: 30, letterSpacing: 2, color: C.ink, opacity: endO * 0.75}}>
        From the book <span style={{fontFamily: FT.enB}}>My Prayer</span> · Yasser Fares</div>}
    </AbsoluteFill>
  );
};
