import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, continueRender, delayRender} from 'remotion';

// =====================================================================================
// STYLE FRAMES ONLY (4 stills, not a video): the paper-collage explainer look for the
// webinar teaser "What Did Khadijah Know?". Kraft board, torn paper, cut-out letters,
// tape labels, marker arrows and highlighter. For Ahmed to approve before the rebuild.
// frame 0 hook · 1 the Black Stone · 2 two answers · 3 title card
// =====================================================================================
export const W = 1920, H = 1080;
const NAVY = '#16233f', CREAM = '#f1e7d0', MUSTARD = '#e3b23c', TERRA = '#c4553b', SLATE = '#5c6674', TEAL = '#2e6b6e', INKK = '#17181c', WHITE = '#fbf7ee', RED = '#c93a2b';

const FONTS: [string, string][] = [['Anton', 'anton-latin-400-normal.woff2'], ['Caveat', 'caveat-latin-700-normal.woff2'], ['YFPlex', 'YF-Plex.ttf'], ['SpectralFull', 'Spectral-SemiBold-full.ttf']];
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  Promise.all(FONTS.map(([fam, file]) => new FontFace(fam, `url(${staticFile('fonts/' + file)})`).load().then((ff) => (document as any).fonts.add(ff))))
    .then(() => continueRender(h)).catch((e) => {console.error(e); continueRender(h);});
}

// ---------- torn paper ----------
const rng = (seed: number) => {let s = (seed * 9301 + 49297) % 233280; return () => {s = (s * 9301 + 49297) % 233280; return s / 233280;};};
type P = [number, number];
const roughen = (pts: P[], seed: number, amp: number, step = 20): P[] => {
  const r = rng(seed); const out: P[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / step));
    const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
    for (let j = 0; j < n; j++) {const u = j / n, d = (j === 0 ? 0.3 : 1) * (r() - 0.5) * 2 * amp; out.push([x0 + (x1 - x0) * u + nx * d, y0 + (y1 - y0) * u + ny * d]);}
  }
  return out;
};
const grow = (pts: P[], d: number): P[] => {const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([x, y]) => {const l = Math.hypot(x - cx, y - cy) || 1; return [x + ((x - cx) / l) * d, y + ((y - cy) / l) * d];});};
const poly = (pts: P[]) => `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
const rect = (w: number, h: number): P[] => [[0, 0], [w, 0], [w, h], [0, h]];
// a piece of paper: white torn core under a coloured face with grain, lifted by a soft shadow
const Paper: React.FC<{x: number; y: number; w: number; h: number; c: string; pts?: P[]; rot?: number; seed?: number; amp?: number; core?: number; lift?: number; children?: React.ReactNode}> =
  ({x, y, w, h, c, pts, rot = 0, seed = 1, amp = 4, core = 5, lift = 1, children}) => {
    const base = pts ?? rect(w, h);
    return (
      <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)`, filter: `drop-shadow(${3 * lift}px ${7 * lift}px ${6 * lift}px rgba(40,24,6,.42))`}}>
        {core > 0 && <div style={{position: 'absolute', left: -20, top: -20, width: w + 40, height: h + 40, clipPath: poly(roughen(grow(base, core), seed + 7, amp * 1.3).map(([a, b]) => [a + 20, b + 20])), background: WHITE}} />}
        <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, clipPath: poly(roughen(base, seed, amp)), background: c}}>
          <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${staticFile('tex/grain.png')})`, mixBlendMode: 'multiply', opacity: 0.55}} />
          {children}
        </div>
      </div>
    );
  };
// cut-out letters, one tile each
const Cut: React.FC<{text: string; x: number; y: number; size: number; tiles: string[]; ink?: string; seed?: number; gap?: number}> = ({text, x, y, size, tiles, ink = NAVY, seed = 3, gap = 6}) => {
  const r = rng(seed); let cx = 0; const tw = (ch: string) => size * (ch === 'I' || ch === '.' || ch === '?' || ch === ' ' ? 0.42 : ch === 'M' || ch === 'W' ? 0.82 : 0.62);
  const total = text.split('').reduce((s, ch) => s + tw(ch) + gap, -gap);
  return <div style={{position: 'absolute', left: x - total / 2, top: y}}>{text.split('').map((ch, i) => {
    const w = tw(ch), left = cx; cx += w + gap; if (ch === ' ') return null;
    const rot = (r() - 0.5) * 7, dy = (r() - 0.5) * size * 0.07, c = tiles[Math.floor(r() * tiles.length) % tiles.length], dark = c === NAVY || c === INKK || c === SLATE || c === TEAL || c === TERRA;
    return <Paper key={i} x={left} y={dy} w={w} h={size * 1.16} c={c} rot={rot} seed={seed + i * 3} amp={2.2} core={3} lift={0.7}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton', fontSize: size, lineHeight: 1, color: dark ? CREAM : ink, paddingTop: size * 0.04}}>{ch}</div></Paper>;
  })}</div>;
};
const Tape: React.FC<{x: number; y: number; w: number; rot?: number; size?: number; seed?: number; children: React.ReactNode}> = ({x, y, w, rot = -2, size = 44, seed = 2, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: size * 1.5, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(1px 3px 3px rgba(40,24,6,.3))'}}>
    <div style={{position: 'absolute', inset: 0, clipPath: poly(roughen(rect(w, size * 1.5), seed, 2.5, 9)), background: 'rgba(247,239,214,.9)'}} />
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Caveat', fontSize: size, color: NAVY, whiteSpace: 'nowrap'}}>{children}</div>
  </div>
);
const Strip: React.FC<{x: number; y: number; w: number; h?: number; c?: string; ink?: string; size?: number; rot?: number; seed?: number; font?: string; ls?: number; children: React.ReactNode}> =
  ({x, y, w, h = 84, c = NAVY, ink = CREAM, size = 46, rot = 0, seed = 4, font = 'Anton', ls = 2, children}) => (
    <Paper x={x} y={y} w={w} h={h} c={c} rot={rot} seed={seed} amp={3.5}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: font, fontSize: size, letterSpacing: ls, color: ink, whiteSpace: 'nowrap'}}>{children}</div></Paper>
  );
const Hi: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{background: MUSTARD, color: INKK, padding: '0 12px', borderRadius: 3, transform: 'rotate(-1deg)', display: 'inline-block'}}>{children}</span>;
const Note: React.FC<{x: number; y: number; size?: number; rot?: number; c?: string; w?: number; children: React.ReactNode}> = ({x, y, size = 54, rot = -3, c = NAVY, w = 600, children}) =>
  <div style={{position: 'absolute', left: x, top: y, width: w, fontFamily: 'Caveat', fontSize: size, lineHeight: 1.05, color: c, transform: `rotate(${rot}deg)`, transformOrigin: 'left top'}}>{children}</div>;
const Marks: React.FC<{children: React.ReactNode}> = ({children}) => <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>{children}</svg>;
const mk = (d: string, c = NAVY, w = 7, dash?: string) => <path d={d} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={0.92} />;
const Board: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundImage: `url(${staticFile('tex/kraft.jpg')})`, backgroundSize: 'cover'}}>
    <Tape x={54} y={34} w={470} size={30} rot={-1.2} seed={11}>Yasser Fares · a free live session</Tape>
    {children}
  </AbsoluteFill>
);
const Caption: React.FC<{children: React.ReactNode}> = ({children}) => <Strip x={360} y={948} w={1200} h={88} c={INKK} ink={WHITE} size={40} font="YFPlex, SpectralFull" ls={0.3} seed={21} rot={-0.4}>{children}</Strip>;

// ---------- frame 0: the walk home ----------
const F0 = () => (
  <Board>
    <Cut text="HE CAME HOME" x={960} y={70} size={74} tiles={[CREAM, WHITE, CREAM]} seed={5} />
    <Cut text="TREMBLING." x={960} y={182} size={176} tiles={[MUSTARD, MUSTARD, CREAM, MUSTARD, TERRA]} seed={9} gap={9} />
    {/* the mountain and its cave, cut from three papers */}
    <Paper x={150} y={440} w={620} h={400} c={SLATE} pts={[[20, 400], [290, 30], [600, 400]]} seed={31} amp={6} rot={-1} />
    <Paper x={390} y={540} w={470} h={300} c="#7d8794" pts={[[10, 300], [220, 20], [460, 300]]} seed={33} amp={6} rot={1.5} lift={0.8} />
    <Paper x={360} y={676} w={150} h={164} c={INKK} pts={[[10, 164], [14, 70], [40, 22], [76, 6], [112, 22], [138, 70], [142, 164]]} seed={35} amp={2.5} core={3} lift={0.4} />
    <Tape x={250} y={852} w={330} rot={-3} seed={13}>the cave of Hira</Tape>
    {/* the house */}
    <Paper x={1270} y={560} w={360} h={280} c={CREAM} seed={41} amp={4} rot={1} />
    <Paper x={1244} y={520} w={412} h={62} c="#b99b6b" seed={43} amp={3.5} rot={-0.6} lift={0.7} />
    <Paper x={1400} y={676} w={96} h={166} c={NAVY} pts={[[4, 166], [4, 46], [48, 4], [92, 46], [92, 166]]} seed={45} amp={2} core={3} lift={0.4} />
    <Paper x={1540} y={628} w={56} h={64} c={MUSTARD} seed={47} amp={1.6} core={2} lift={0.3} />
    <Tape x={1380} y={852} w={170} rot={2.5} seed={15}>home</Tape>
    <Marks>
      {mk('M 452 652 C 600 400, 1010 400, 1236 706', NAVY, 8, '3 26')}
      {mk('M 1196 664 L 1240 708 L 1178 720', NAVY, 8)}
      {mk('M 1500 474 C 1492 490, 1486 500, 1478 514', TERRA, 6)}
      {mk('M 1458 488 L 1476 518 L 1504 500', TERRA, 6)}
    </Marks>
    <Note x={1250} y={430} size={54} c={TERRA} rot={-3} w={560}>the first to hear: his wife</Note>
    <Caption>A man comes home from the cave of Hira, <Hi>trembling.</Hi></Caption>
  </Board>
);

// ---------- frame 1: the Black Stone ----------
const F1 = () => (
  <Board>
    <Strip x={510} y={64} w={900} h={104} size={62} seed={51} rot={-0.8}>QURAYSH REBUILD THE KA‘BAH</Strip>
    <Paper x={800} y={300} w={320} h={400} c={INKK} seed={53} amp={4} rot={-0.6} lift={1.4} />
    <Paper x={792} y={372} w={336} h={44} c={MUSTARD} seed={55} amp={2.5} core={2} rot={-0.6} lift={0.4} />
    <div style={{position: 'absolute', left: 1082, top: 606, width: 64, height: 64, borderRadius: '50%', background: '#2b2c31', border: `6px solid ${MUSTARD}`, boxShadow: '2px 5px 6px rgba(40,24,6,.5)'}} />
    {[[250, 250, TERRA, -5, 'CLAN'], [230, 640, TEAL, 4, 'CLAN'], [1390, 236, SLATE, 3, 'CLAN'], [1430, 740, '#8a6d2f', -3, 'CLAN']].map(([x, y, c, rot, t], i) =>
      <Paper key={i} x={x as number} y={y as number} w={250} h={110} c={c as string} rot={rot as number} seed={61 + i * 2} amp={4}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton', fontSize: 58, letterSpacing: 4, color: CREAM}}>{t}</div></Paper>)}
    <Marks>
      {/* the dispute: red marker between the clans */}
      {mk('M 380 380 l 14 40 l -22 34 l 26 38 l -20 36 l 22 40 l -16 34', RED, 8)}
      {mk('M 1610 366 l -16 44 l 24 40 l -26 44 l 22 40 l -20 46 l 18 44 l -14 40', RED, 8)}
      {mk('M 520 300 l 46 -16 l 40 22 l 44 -22 l 42 20 l 46 -20 l 40 18', RED, 8)}
      {mk('M 520 720 l 44 18 l 42 -22 l 44 22 l 40 -20 l 46 20', RED, 8)}
      {mk('M 1056 596 C 1040 640, 1080 700, 1136 690 C 1190 678, 1186 596, 1120 584 C 1090 580, 1066 588, 1052 606', RED, 6)}
      {mk('M 1186 634 C 1230 610, 1250 580, 1270 548', RED, 6)}
      {mk('M 1234 556 L 1272 544 L 1280 584', RED, 6)}
    </Marks>
    <Note x={1180} y={410} size={58} c={RED} rot={-5} w={420}>who places<br />the Black Stone?</Note>
    <Caption>The clans fell into <Hi>dispute</Hi> over the Black Stone.</Caption>
  </Board>
);

// ---------- frame 2: two opposite answers ----------
const F2 = () => (
  <Board>
    <Strip x={560} y={64} w={800} h={100} size={58} seed={71} rot={0.7}>THE PUBLIC CALL AT SAFA</Strip>
    <Paper x={200} y={250} w={640} h={470} c={MUSTARD} rot={-2.5} seed={73} amp={6} lift={1.4}>
      <div style={{position: 'absolute', left: 0, top: 96, width: 640, textAlign: 'center', fontFamily: 'Anton', fontSize: 132, color: NAVY, letterSpacing: 3}}>KHADIJAH</div>
      <div style={{position: 'absolute', left: 0, top: 290, width: 640, textAlign: 'center', fontFamily: 'Caveat', fontSize: 78, color: NAVY}}>reassured him</div></Paper>
    <Paper x={1080} y={250} w={640} h={470} c={SLATE} rot={2.5} seed={75} amp={6} lift={1.4}>
      <div style={{position: 'absolute', left: 0, top: 96, width: 640, textAlign: 'center', fontFamily: 'Anton', fontSize: 132, color: CREAM, letterSpacing: 3}}>ABU LAHAB</div>
      <div style={{position: 'absolute', left: 0, top: 290, width: 640, textAlign: 'center', fontFamily: 'Caveat', fontSize: 72, color: CREAM}}>a very different answer</div></Paper>
    <Marks>
      {mk('M 1010 420 C 970 414, 930 420, 892 434', NAVY, 9)}{mk('M 928 400 L 888 436 L 938 456', NAVY, 9)}
      {mk('M 910 560 C 950 566, 990 560, 1030 546', RED, 9)}{mk('M 994 580 L 1034 544 L 984 524', RED, 9)}
    </Marks>
    <Strip x={470} y={770} w={980} h={96} c={CREAM} ink={NAVY} size={50} seed={77} rot={-1}>BOTH <Hi>KNEW HIM</Hi> BEFORE REVELATION</Strip>
    <Caption>Two people who knew him. Two <Hi>opposite</Hi> answers.</Caption>
  </Board>
);

// ---------- frame 3: title card ----------
const F3 = () => (
  <Board>
    <Cut text="WHAT DID" x={960} y={150} size={128} tiles={[CREAM, WHITE]} seed={81} gap={8} />
    <Cut text="KHADIJAH" x={960} y={316} size={236} tiles={[MUSTARD, MUSTARD, NAVY, MUSTARD]} seed={83} gap={11} />
    <Cut text="KNOW?" x={960} y={612} size={128} tiles={[CREAM, WHITE, TERRA]} seed={85} gap={8} />
    <Tape x={250} y={806} w={610} rot={-3} size={48} seed={17}>a free live hour with Yasser Fares</Tape>
    <Tape x={1110} y={800} w={520} rot={2.5} size={48} seed={19}>weekend of 12–13 December</Tape>
    <Strip x={610} y={920} w={700} h={96} size={46} font="YFPlex" ls={0.5} seed={87} rot={-0.6}>yasserfares.com/khadijah</Strip>
    <Note x={1350} y={920} size={58} c={TERRA} rot={-6} w={400}>save your seat</Note>
    <Marks>{mk('M 1344 968 C 1334 972, 1326 972, 1318 970', TERRA, 6)}{mk('M 1336 948 L 1314 970 L 1340 986', TERRA, 6)}</Marks>
  </Board>
);

export const CollageFrames: React.FC = () => {const f = useCurrentFrame(); return f === 0 ? <F0 /> : f === 1 ? <F1 /> : f === 2 ? <F2 /> : <F3 />;};
