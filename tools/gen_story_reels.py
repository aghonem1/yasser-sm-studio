"""Writes the four story-reel compositions (web01r1..r4) from the shared head of Webinar01_Reel.tsx plus one scene each.
The reels share the reel v3 design system; only the story scene and the headlines differ. Re-run after changing the head.
usage (repo root): python3 tools/gen_story_reels.py"""
from pathlib import Path
import re
E = Path("remotion/src/episodes")
base = (E / "Webinar01_Reel.tsx").read_text()
head = base[:base.index("\n// ---------- small helpers")]
a, b = head.index("// ====="), head.index("export const FPS")
key0 = head.index("const KEY: Record<number, string> = {"); key1 = head.index("};", key0) + 2
head = head[:key0] + "const KEY: Record<number, string> = Object.fromEntries(LINES.map((l, i) => [i, (l as any).key]));" + head[key1:]
old_norm = "replace(/[,.?'…“”:]/g, '')"
assert head.count(old_norm) == 1; head = head.replace(old_norm, "replace(/[,.?'…“”:‘’]/g, '')")

COMMON = r'''

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
'''

TITLE = r'''

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
export const NAME: React.FC = () => {
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
'''

STORIES = {}
STORIES["r1"] = ("Web01R1", "The Black Stone: Before Hira, Quraysh had already accepted his judgement.", r'''
// ---------- story: the day of the Black Stone ----------
// A plain Ka'bah, the stone at its corner, four clans as points of light. They dispute; they accept his judgement; every clan is joined to the stone.
const SX = 520, SY = 985;
const CL: [number, number][] = [-38, -13, 13, 38].map((a) => [SX - 345 * Math.cos(a * Math.PI / 180), SY + 345 * Math.sin(a * Math.PI / 180)] as [number, number]);
const Story: React.FC<{t: number}> = ({t}) => {
  const draw = outQuint((t + 0.45) / 1.4);
  const tq = wt(1, 'quraysh') - 0.1, share = wt(4, 'share') - 0.25;
  const disp = fade(t, wt(2, 'dispute') - 0.2, 0.5) * (1 - fade(t, ST[3] - 0.25, 0.5));
  const glow = fade(t, share + 0.6, 0.9), shake = disp * Math.sin(t * 24) * 3.5;
  return (
    <AbsoluteFill>
      <Halo x={SX} y={SY} r={110 + 110 * glow} o={0.3 + 0.65 * glow} />
      <Svg>
        {CL.map(([x, y], j) => <Line key={j} d={`M ${x} ${y} L ${SX - 26} ${SY + (y - SY) * 0.06}`} p={outQuint((t - share - j * 0.13) / 0.9)} w={3.5} c={GOLDL} o={0.85} />)}
        <rect x={SX} y={820} width={300} height={300} fill={INK} opacity={0.8 * draw} />
        <Line d={`M ${SX} 820 L ${SX + 300} 820 L ${SX + 300} 1120 L ${SX} 1120 Z`} p={draw} w={5} c={GOLDL} o={0.95} />
        <Line d={`M ${SX} 900 L ${SX + 300} 900`} p={draw} w={3.5} c={GOLDL} o={0.8} />
        <Line d={`M ${SX} 920 L ${SX + 300} 920`} p={draw} w={3.5} c={GOLDL} o={0.8} />
        {disp > 0 && CL.slice(0, 3).map(([x, y], j) => {const [x2, y2] = CL[j + 1]; const mx = (x + x2) / 2, my = (y + y2) / 2;
          return <path key={j} d={`M ${x} ${y + 34} L ${mx - 20} ${my - 12} L ${mx + 20} ${my + 12} L ${x2} ${y2 - 34}`} stroke={CREAM} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 12" opacity={0.75 * disp} />;})}
        {CL.map(([x, y], j) => {const o = sp(t, tq + j * 0.14); return o <= 0 ? null : <g key={j}>
          <circle cx={x + (j % 2 ? -1 : 1) * shake} cy={y} r={13 * o} fill={GOLDL} />
          <circle cx={x + (j % 2 ? -1 : 1) * shake} cy={y} r={27 * o} fill="none" stroke={GOLD} strokeWidth={2.5} opacity={0.7} /></g>;})}
        <circle cx={SX} cy={SY} r={24} fill={INK} stroke={GOLDL} strokeWidth={5} />
        <circle cx={SX} cy={SY} r={9} fill={GOLDL} opacity={0.25 + 0.75 * glow} />
      </Svg>
      <Label x={SX + 150} y={1140} w={340} o={fade(t, -1) * 0.85} size={30} ls={0.18}>THE KA‘BAH</Label>
      <Label x={CX} y={1222} w={960} o={fade(t, tq + 0.3) * (1 - fade(t, share, 0.4)) * 0.9} size={30} ls={0.16}>THE CLANS OF QURAYSH</Label>
      <Label x={CX} y={1222} w={1000} o={fade(t, share + 0.6)} size={30} c={GOLDL} ls={0.14}>EVERY CLAN SHARED THE HONOUR</Label>
    </AbsoluteFill>
  );
};
const Heads: React.FC<{t: number}> = ({t}) => <>
  <Static y={404} t={t} out={ST[3] - 0.6} size={76} ls={0.12}>BEFORE HIRA</Static>
  <Static y={506} t={t} out={ST[3] - 0.55} size={86} ls={0.03} gold>THE BLACK STONE.</Static>
  {t > ST[3] - 0.3 && t < ST[T] + 0.2 && <>
    <Line1 y={404}><KType text="THEY ACCEPTED" t={t} tin={ST[3] - 0.1} tout={ST[T] - 0.55} size={72} ls={0.1} /></Line1>
    <Line1 y={504}><KType text="HIS JUDGEMENT." t={t} tin={wt(3, 'his') - 0.12} tout={ST[T] - 0.5} size={100} color={GOLDT} ls={0.03} tr={0.04} /></Line1>
  </>}
</>;
''')
STORIES["r2"] = ("Web01R2", "How did revelation begin? Four steps, in ‘A’ishah's account.", r'''
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
''')
STORIES["r3"] = ("Web01R3", "Who believed next? The names, and why the accounts differ on who came first.", r'''
// ---------- story: who believed next ----------
// Three names arrive as they are said, then "and those he invited"; when the accounts differ, the question takes that place.
const Story: React.FC<{t: number}> = ({t}) => {
  const NM: [string, number, number][] = [['‘ALI', wt(1, 'ali') - 0.12, 762], ['ZAYD IBN HARITHAH', wt(1, 'zayd') - 0.12, 890], ['ABU BAKR', wt(1, 'abu') - 0.12, 1018]];
  const rule = inOut((t + 0.4) / 1.2);
  const inv = fade(t, ST[2] - 0.05, 0.5) * (1 - fade(t, ST[3] - 0.35, 0.3));
  const q = outQuint((t - wt(3, 'who') + 0.15) / 0.6), dim = 1 - 0.35 * fade(t, wt(3, 'differ') - 0.1, 0.6);
  return (
    <AbsoluteFill>
      <Halo x={CX} y={940} r={480} o={0.4} />
      <Svg>{[744, 872, 1000, 1128].map((y, j) => <Line key={j} d={`M ${CX - 330 * rule} ${y} L ${CX + 330 * rule} ${y}`} p={rule > 0 ? 1 : 0} w={2} o={0.55} />)}</Svg>
      {NM.map(([txt, t0, y], j) => <Reveal key={j} p={outQuint((t - t0) / 0.6)} style={{left: 0, top: y, width: W, textAlign: 'center', paddingBottom: 14}}>
        <span style={{fontFamily: F.cinzelB, fontSize: 64, letterSpacing: '0.07em', lineHeight: '92px', color: CREAM, opacity: dim}}>{txt}</span></Reveal>)}
      {inv > 0 && <div style={{position: 'absolute', top: 1150, width: W, textAlign: 'center', fontFamily: F.it, fontStyle: 'italic', fontWeight: 500, fontSize: 58, color: GOLDL, opacity: inv}}>and those he invited</div>}
      <Reveal p={q} style={{left: 0, top: 1142, width: W, textAlign: 'center', paddingBottom: 24}}>
        <span style={{fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 86, lineHeight: '100px', paddingRight: 10, ...goldText}}>Who came first?</span></Reveal>
    </AbsoluteFill>
  );
};
const Heads: React.FC<{t: number}> = ({t}) => <>
  <Static y={404} t={t} out={ST[3] - 0.6} size={76} ls={0.12}>WHO BELIEVED</Static>
  <Static y={496} t={t} out={ST[3] - 0.55} size={128} ls={0.04} gold>NEXT?</Static>
  {t > ST[3] - 0.3 && t < ST[T] + 0.2 && <>
    <Line1 y={404}><KType text="THE ACCOUNTS" t={t} tin={ST[3] - 0.1} tout={ST[T] - 0.55} size={72} ls={0.1} /></Line1>
    <Line1 y={500}><KType text="DIFFER." t={t} tin={wt(3, 'differ') - 0.12} tout={ST[T] - 0.5} size={120} color={GOLDT} ls={0.04} tr={0.04} /></Line1>
  </>}
</>;
''')
STORIES["r4"] = ("Web01R4", "Two people knew him before revelation. Two opposite answers.", r'''
// ---------- story: two people, two answers ----------
// Two plain cards. The first is lit from frame 1 (Khadijah). The second appears unnamed, then is named (Abu Lahab). Two arrows part.
const CARD = (x: number) => `M ${x + 16} 780 L ${x + 364} 780 Q ${x + 380} 780 ${x + 380} 796 L ${x + 380} 1144 Q ${x + 380} 1160 ${x + 364} 1160 L ${x + 16} 1160 Q ${x} 1160 ${x} 1144 L ${x} 796 Q ${x} 780 ${x + 16} 780`;
const Story: React.FC<{t: number}> = ({t}) => {
  const d1 = outQuint((t + 0.45) / 1.3), t2 = wt(2, 'someone') - 0.15, d2 = outQuint((t - t2) / 1.0), named = fade(t, ST[4] - 0.1, 0.5);
  const arr = outQuint((t - ST[6] + 0.1) / 0.7);
  return (
    <AbsoluteFill>
      <Halo x={310} y={970} r={300} o={0.65} />
      <Halo x={770} y={970} r={280} o={named * 0.3} />
      <Svg>
        <Line d={CARD(120)} p={d1} w={5} c={GOLDL} o={0.95} />
        <Line d={CARD(580)} p={d2} w={4} o={0.8} />
        <Line d="M 250 1010 L 370 1010" p={d1} w={2.5} o={0.7} />
        <Line d="M 710 1010 L 830 1010" p={named} w={2.5} o={0.6} />
        <Line d="M 400 1214 L 226 1214 M 256 1192 L 226 1214 L 256 1236" p={arr} w={5} c={GOLDL} o={0.95} />
        <Line d="M 680 1214 L 854 1214 M 824 1192 L 854 1214 L 824 1236" p={arr} w={5} c={CREAM} o={0.8} />
      </Svg>
      <Label x={310} y={926} w={380} o={fade(t, -1)} size={50} c={GOLDL} ls={0.08}>KHADIJAH</Label>
      <Label x={310} y={1034} w={380} o={fade(t, wt(0, 'known') - 0.1) * 0.85} size={25} ls={0.08}>KNEW HIM FOR YEARS</Label>
      {d2 > 0 && named < 1 && <div style={{position: 'absolute', left: 770 - 80, top: 880, width: 160, textAlign: 'center', fontFamily: F.it, fontStyle: 'italic', fontWeight: 600, fontSize: 170, lineHeight: '180px', color: GOLD, opacity: clamp(d2 * 1.2) * 0.8 * (1 - named)}}>?</div>}
      <Label x={770} y={926} w={380} o={named} size={50} c={CREAM} ls={0.08}>ABU LAHAB</Label>
      <Label x={770} y={1034} w={380} o={fade(t, ST[4] + 0.15) * 0.85} size={25} ls={0.08}>HAD ALSO KNOWN HIM</Label>
    </AbsoluteFill>
  );
};
const Heads: React.FC<{t: number}> = ({t}) => <>
  <Static y={404} t={t} out={ST[1] - 0.6} size={54} ls={0.1}>KHADIJAH HAD KNOWN HIM</Static>
  <Static y={488} t={t} out={ST[1] - 0.55} size={120} ls={0.04} gold>FOR YEARS.</Static>
  {t > ST[1] - 0.3 && t < ST[5] + 0.2 && <>
    <Line1 y={404}><KType text="THE CALL WENT PUBLIC" t={t} tin={ST[1] - 0.1} tout={ST[5] - 0.55} size={56} ls={0.1} gap={0.022} /></Line1>
    <Line1 y={492}><KType text="AT SAFA." t={t} tin={wt(1, 'at') - 0.12} tout={ST[5] - 0.5} size={116} color={GOLDT} ls={0.04} tr={0.04} /></Line1>
  </>}
  {t > ST[5] - 0.3 && t < ST[T] + 0.2 && <>
    <Line1 y={404}><KType text="TWO PEOPLE." t={t} tin={ST[5] - 0.1} tout={ST[T] - 0.55} size={84} ls={0.08} /></Line1>
    <Line1 y={508}><KType text="TWO ANSWERS." t={t} tin={ST[6] - 0.12} tout={ST[T] - 0.5} size={100} color={GOLDT} ls={0.03} tr={0.04} /></Line1>
  </>}
</>;
''')

imports, comps = [], []
for key, (name, what, story) in STORIES.items():
    h = head[:a] + f"// Webinar 1 story reel {key} (9:16) · {what}\n// Reel v3 design system (see Webinar01_Reel.tsx). Voice: the 22 Nov narration plus lines recorded on 25 Nov; built by scripts/episodes/webinar01_stories_build.py.\n// Written by tools/gen_story_reels.py: edit the generator, not this file.\n\n" + head[b:]
    h = h.replace("./timeline_webinar01r.json", f"./timeline_webinar01{key}.json")
    assert "import {Icon} from '../lib/icons';\n" in h; h = h.replace("import {Icon} from '../lib/icons';\n", "")
    (E / f"Webinar01_Story_{key.upper()}.tsx").write_text(h + COMMON + story + TITLE.replace("NAME", name))
    imports.append(f"import {{{name}, TOTAL_R as TOTAL_{key.upper()}}} from './episodes/Webinar01_Story_{key.upper()}';")
    comps.append(f'  <Composition id="web01{key}" component={{{name}}} durationInFrames={{Math.round(TOTAL_{key.upper()} * FPS)}} fps={{FPS}} width={{1080}} height={{1920}} />')
r = Path("remotion/src/Root.tsx"); s = r.read_text()
if "Web01R1" not in s:
    s = s.replace("import {Web01R, TOTAL_R} from './episodes/Webinar01_Reel';", "import {Web01R, TOTAL_R} from './episodes/Webinar01_Reel';\n" + "\n".join(imports))
    anchor = '  <Composition id="web01r" '
    i = s.index(anchor); j = s.index("\n", i) + 1
    s = s[:j] + "\n".join(comps) + "\n" + s[j:]
    r.write_text(s)
print("written", list(STORIES))
