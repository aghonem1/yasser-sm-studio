import React from 'react';
import {AbsoluteFill, useCurrentFrame, staticFile, delayRender, continueRender} from 'remotion';

// =====================================================================================
// THE ONE WORD CHALLENGE — weekly quiz reel (from 28 Nov 2026), Track A navy + gold.
// Modelled on the @deenandplan "Can you score 6/6?" reel (20.5K likes, 626 comments): a score
// everyone can comment, a countdown that makes people play along, a reveal with one line of why.
// Driven by a JSON spec (quiz/qNN.json): questions[{q, ar?, options[4], correct, explain}], bonus, end.
// Timeline: intro 3.0 s · each question 10.5 s · outro 6.5 s (last 0.5 s returns to frame 1 for the loop).
// =====================================================================================

export const FPS = 30, W = 1080, H = 1920;
export const INTRO = 3.0, QLEN = 10.5, OUTRO = 6.5;
export const quizLength = (spec: any) => INTRO + spec.questions.length * QLEN + OUTRO;

const C = {bg1: '#09101e', bg2: '#0f1a2e', gold: '#c9a457', goldB: '#ecbe60', cream: '#f0eadb', mute: '#8d93a3', card: 'rgba(240,234,219,0.06)',
  line: 'rgba(201,164,87,0.45)', green: '#3c9a69', greenB: '#55c18a', red: '#b55a4a'};

const FONTS: [string, string, string][] = [
  ['QCinzelB', 'YF-CinzelB.ttf', '700'], ['QCinzel', 'YF-Cinzel.ttf', '400'], ['QSpectral', 'Spectral-SemiBold-full.ttf', '600'],
  ['QPop6', 'trackb/poppins-latin-600-normal.woff2', '600'], ['QPop7', 'trackb/poppins-latin-700-normal.woff2', '700'],
  ['QAmiri', 'Amiri-Bold.ttf', '700'], ['QCormIt', 'CormorantGaramond-Italic.ttf', '400'],
];
let asked = false;
const loadFonts = () => {
  if (asked || typeof document === 'undefined') return; asked = true;
  const h = delayRender('quiz-fonts');
  Promise.all(FONTS.map(([f, file, w]) => new FontFace(f, `url(${staticFile('fonts/' + file)})`, {weight: w}).load().then((ff) => (document as any).fonts.add(ff))))
    .then(() => continueRender(h)).catch((e) => {console.error(e); continueRender(h);});
};
loadFonts();

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const oc = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const ob = (x: number) => {x = clamp(x); const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);};
const k = (t: number, a: number, d: number, e = oc) => e((t - a) / d);
const win = (t: number, a: number, b: number, fi = 0.3, fo = 0.3) => (t < a || t > b ? 0 : clamp(Math.min((t - a) / fi, (b - t) / fo)));

// slowly turning 8-point stars + glows (the series' look)
const Backdrop: React.FC<{t: number}> = ({t}) => {
  const star = (cx: number, cy: number, r: number, rot: number, o: number) => {
    const pts: string[] = []; for (let i = 0; i < 16; i++) {const a = rot + (i * Math.PI) / 8; const rr = i % 2 ? r * 0.72 : r; pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);}
    return <polygon points={pts.join(' ')} fill="none" stroke={C.gold} strokeWidth={1.6} opacity={o} />;
  };
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="qbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.bg2} /><stop offset="1" stopColor={C.bg1} /></linearGradient>
        <radialGradient id="qglow"><stop offset="0" stopColor={C.goldB} stopOpacity={0.16} /><stop offset="1" stopColor={C.goldB} stopOpacity={0} /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#qbg)" />
      <circle cx={540 + 60 * Math.sin(t * 0.2)} cy={520} r={620} fill="url(#qglow)" />
      <circle cx={300} cy={1500} r={500} fill="url(#qglow)" opacity={0.6} />
      {Array.from({length: 7}).map((_, i) => Array.from({length: 12}).map((__, j) =>
        <g key={i + '-' + j}>{star(80 + i * 160 + (j % 2) * 80, 80 + j * 160, 46, t * 0.08 + (i + j) * 0.3, 0.07)}</g>))}
    </svg>
  );
};

const Dots: React.FC<{n: number; cur: number; res: (boolean | null)[]; y: number; o?: number}> = ({n, cur, res, y, o = 1}) => (
  <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18, opacity: o}}>
    {Array.from({length: n}).map((_, i) => {
      const done = res[i] !== null && res[i] !== undefined; const active = i === cur;
      return <div key={i} style={{width: 46, height: 46, borderRadius: 23, border: `3px solid ${active || done ? C.goldB : C.line}`, background: done ? C.goldB : 'transparent',
        color: done ? C.bg1 : active ? C.goldB : C.mute, fontFamily: 'QPop7', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${active ? 1.12 : 1})`}}>{i + 1}</div>;
    })}
  </div>
);

export const Quiz: React.FC<{spec: any}> = ({spec}) => {
  const t = useCurrentFrame() / FPS;
  const Q = spec.questions as any[]; const N = Q.length; const TOTAL = quizLength(spec);
  const loopIn = k(t, TOTAL - 0.5, 0.45);
  const qi = Math.floor((t - INTRO) / QLEN); const inQ = t >= INTRO && qi < N; const lt = t - INTRO - qi * QLEN;
  const res = Q.map((_, i) => (t >= INTRO + i * QLEN + 6.5 ? true : null));
  const outroT = t - (INTRO + N * QLEN);

  // ---------- intro (frame 1 = the full hook) ----------
  const introO = t < INTRO ? 1 - k(t, INTRO - 0.22, 0.22) : loopIn;
  const pulse = 1 + 0.05 * Math.sin(t * 4);

  return (
    <AbsoluteFill style={{background: C.bg1}}>
      <Backdrop t={t} />
      <div style={{position: 'absolute', top: 176, left: 0, right: 0, textAlign: 'center', fontFamily: 'QCinzelB', fontSize: 30, letterSpacing: 6, color: C.gold}}>
        {spec.title} · {String(spec.episode).padStart(2, '0')}</div>

      {introO > 0 && <div style={{position: 'absolute', inset: 0, opacity: introO}}>
        <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', fontFamily: 'QCinzelB', fontSize: 118, lineHeight: 1.05, color: C.cream}}>CAN YOU<br />SCORE</div>
        <div style={{position: 'absolute', top: 720, left: 0, right: 0, textAlign: 'center', fontFamily: 'QCinzelB', fontSize: 260, color: C.goldB,
          transform: `scale(${pulse})`, textShadow: '0 0 60px rgba(236,190,96,0.35)'}}>{N}/{N}?</div>
        <Dots n={N} cur={-1} res={[]} y={1060} />
        <div style={{position: 'absolute', top: 1150, left: 120, right: 120, textAlign: 'center', fontFamily: 'QCormIt', fontSize: 44, color: C.cream, opacity: 0.85}}>
          {N} questions from the words we've posted. Play along.</div>
      </div>}

      {inQ && (() => {
        const q = Q[qi];
        const inP = k(lt, 0, 0.28), outP = k(lt, QLEN - 0.22, 0.22);
        const slide = (1 - inP) * 60 - outP * 60; const o = inP * (1 - outP);
        const cd = lt >= 3.5 && lt < 6.5 ? 3 - Math.floor(lt - 3.5) : 0; const cdFrac = (lt - 3.5) % 1;
        const rev = k(lt, 6.5, 0.35);
        return <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translateX(${slide}px)`}}>
          <Dots n={N} cur={qi} res={res} y={250} />
          <div style={{position: 'absolute', top: 336, left: 80, right: 80, padding: '34px 40px', borderRadius: 28, background: C.card, border: `2px solid ${C.line}`, textAlign: 'center'}}>
            <div style={{fontFamily: 'QPop6', fontSize: 26, letterSpacing: 5, color: C.gold}}>QUESTION {qi + 1} / {N}</div>
            <div style={{fontFamily: 'QSpectral', fontSize: 50, lineHeight: 1.25, color: C.cream, marginTop: 16}}>{q.q}</div>
            {q.ar && <div dir="rtl" lang="ar" style={{fontFamily: 'QAmiri', fontSize: 64, lineHeight: 1.7, color: C.goldB, marginTop: 6}}>{q.ar}</div>}
          </div>
          {/* countdown ring */}
          <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
            {cd > 0 && <g transform="translate(540 870)">
              <circle r={52} fill={C.bg1} stroke={C.line} strokeWidth={7} />
              <circle r={52} fill="none" stroke={C.goldB} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={-cdFrac}
                transform="rotate(-90)" />
            </g>}
          </svg>
          {cd > 0 && <div style={{position: 'absolute', top: 870 - 50, left: 0, right: 0, textAlign: 'center', fontFamily: 'QPop7', fontSize: 64, lineHeight: '100px', color: C.goldB,
            transform: `scale(${1 + 0.25 * (1 - clamp(cdFrac / 0.25))})`}}>{cd}</div>}
          {/* options */}
          {(q.options as string[]).map((op, i) => {
            const p = k(lt, 0.6 + i * 0.22, 0.35, ob); const isC = i === q.correct;
            const bg = rev > 0 ? (isC ? C.green : 'rgba(240,234,219,0.04)') : C.card;
            const dim = rev > 0 && !isC ? 1 - 0.55 * rev : 1;
            const top = 960 + i * 112;
            return <div key={i} style={{position: 'absolute', top, left: 100, right: 100, height: 94, borderRadius: 22, background: bg, border: `2px solid ${rev > 0 && isC ? C.greenB : C.line}`,
              display: 'flex', alignItems: 'center', gap: 26, padding: '0 28px', opacity: p * dim, transform: `translateY(${(1 - p) * 30}px) scale(${1 + (isC ? 0.04 * win(lt, 6.5, 7.4, 0.15, 0.6) : 0)})`}}>
              <div style={{width: 58, height: 58, borderRadius: 29, border: `3px solid ${rev > 0 && isC ? C.cream : C.goldB}`, color: rev > 0 && isC ? C.cream : C.goldB,
                fontFamily: 'QPop7', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto'}}>{'ABCD'[i]}</div>
              <div style={{fontFamily: 'QPop6', fontSize: 40, color: C.cream, flex: 1}}>{op}</div>
              {rev > 0 && isC && <div style={{fontFamily: 'QPop7', fontSize: 44, color: C.cream, opacity: rev}}>✓</div>}
            </div>;
          })}
          {/* the why */}
          {rev > 0 && <div style={{position: 'absolute', top: 1418, left: 110, right: 110, textAlign: 'center', fontFamily: 'QCormIt', fontSize: 40, lineHeight: 1.25, color: C.cream,
            opacity: k(lt, 6.8, 0.4), transform: `translateY(${(1 - k(lt, 6.8, 0.4)) * 16}px)`}}>{q.explain}</div>}
        </div>;
      })()}

      {outroT >= 0 && (() => {
        const p = (d: number) => k(outroT, d, 0.45, ob); const o = 1 - loopIn;
        return <div style={{position: 'absolute', inset: 0, opacity: o}}>
          <div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center', fontFamily: 'QCinzelB', fontSize: 84, lineHeight: 1.1, color: C.cream,
            opacity: p(0.1), transform: `scale(${0.8 + 0.2 * p(0.1)})`}}>{spec.end.score}</div>
          <div style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', fontFamily: 'QCinzelB', fontSize: 230, color: C.goldB,
            opacity: p(0.3), transform: `scale(${0.7 + 0.3 * p(0.3)})`, textShadow: '0 0 60px rgba(236,190,96,0.35)'}}>?/{N}</div>
          <div style={{position: 'absolute', top: 900, left: 90, right: 90, padding: '30px 36px', borderRadius: 26, border: `2px solid ${C.line}`, background: C.card, textAlign: 'center',
            opacity: p(0.9), transform: `translateY(${(1 - p(0.9)) * 30}px)`}}>
            <div style={{fontFamily: 'QPop6', fontSize: 28, letterSpacing: 5, color: C.gold}}>BONUS · ANSWER IN THE COMMENTS</div>
            <div style={{fontFamily: 'QSpectral', fontSize: 50, lineHeight: 1.25, color: C.cream, marginTop: 14}}>{spec.bonus.q}</div>
          </div>
          <div style={{position: 'absolute', top: 1220, left: 0, right: 0, textAlign: 'center', fontFamily: 'QCormIt', fontSize: 46, color: C.cream, opacity: p(1.6) * 0.9}}>{spec.end.share}</div>
          <div style={{position: 'absolute', top: 1305, left: 0, right: 0, textAlign: 'center', fontFamily: 'QPop6', fontSize: 34, letterSpacing: 3, color: C.goldB, opacity: p(2.0)}}>{spec.end.follow.toUpperCase()}</div>
        </div>;
      })()}
    </AbsoluteFill>
  );
};
