import React from 'react';
import DATA from './tabler.json';

// Line pictograms from Tabler Icons (MIT, see TABLER_LICENSE.txt), drawn as crisp gold line art.
// Every element is drawn on with pathLength, so any icon can "write itself" with p 0→1.
export type IconName = keyof typeof DATA;
const NAMES = Object.keys(DATA);

export const Icon: React.FC<{
  name: IconName | string; x: number; y: number; size: number; p?: number; c?: string; sw?: number; o?: number; rot?: number;
  glow?: number; fill?: string; scale?: number;
}> = ({name, x, y, size, p = 1, c = '#f1d08a', sw = 5, o = 1, rot = 0, glow = 0.35, fill, scale = 1}) => {
  const els = (DATA as any)[name] as [string, Record<string, string>][];
  if (!els) throw new Error('unknown icon ' + name + ' (have: ' + NAMES.join(', ') + ')');
  if (o <= 0.001 || p <= 0) return null;
  const s = size * scale, w = (sw * 24) / s;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" style={{position: 'absolute', left: x - s / 2, top: y - s / 2, overflow: 'visible', opacity: o,
      transform: rot ? `rotate(${rot}deg)` : undefined, filter: glow ? `drop-shadow(0 0 ${10 * glow}px rgba(241,208,138,${0.55 * glow}))` : undefined}}>
      {els.map(([tag, a], i) => {
        const props: any = {...a, key: i, pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - Math.min(1, Math.max(0, p)),
          stroke: c, strokeWidth: w, fill: fill && tag !== 'line' ? fill : 'none', strokeLinecap: 'round', strokeLinejoin: 'round'};
        return React.createElement(tag, props);
      })}
    </svg>
  );
};

// big hand-drawn marks used to explain: a check, a cross, a strike-through and a "ban" ring
export const Mark: React.FC<{kind: 'check' | 'x' | 'ban'; x: number; y: number; size: number; p: number; c?: string; sw?: number}> = ({kind, x, y, size, p, c, sw = 9}) => {
  if (p <= 0) return null;
  const col = c ?? (kind === 'check' ? '#f1d08a' : '#d9624f');
  const s = size / 2;
  const seg = (d: string, q: number) => <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, Math.max(0, q))} stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <svg width={size} height={size} viewBox={`${-s} ${-s} ${size} ${size}`} style={{position: 'absolute', left: x - s, top: y - s, overflow: 'visible',
      filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.5))'}}>
      {kind === 'check' && seg(`M ${-s * 0.62} ${s * 0.02} L ${-s * 0.18} ${s * 0.48} L ${s * 0.66} ${-s * 0.52}`, p)}
      {kind === 'x' && <>{seg(`M ${-s * 0.6} ${-s * 0.6} L ${s * 0.6} ${s * 0.6}`, p * 2)}{seg(`M ${s * 0.6} ${-s * 0.6} L ${-s * 0.6} ${s * 0.6}`, p * 2 - 1)}</>}
      {kind === 'ban' && <>{seg(`M 0 ${-s * 0.92} A ${s * 0.92} ${s * 0.92} 0 1 1 -0.1 ${-s * 0.92}`, p * 1.6)}{seg(`M ${-s * 0.65} ${-s * 0.65} L ${s * 0.65} ${s * 0.65}`, p * 2.6 - 1.6)}</>}
    </svg>
  );
};

// a strike line drawn across a box (for crossing out words)
export const Strike: React.FC<{x: number; y: number; w: number; p: number; c?: string; sw?: number}> = ({x, y, w, p, c = '#d9624f', sw = 10}) =>
  p <= 0 ? null : <div style={{position: 'absolute', left: x, top: y - sw / 2, width: w * Math.min(1, p), height: sw, borderRadius: sw, background: c,
    boxShadow: '0 3px 10px rgba(0,0,0,.45)', transform: 'rotate(-4deg)', transformOrigin: 'left center'}} />;

// strike-through that hugs the text it wraps
export const StrikeIn: React.FC<{p: number; c?: string; sw?: number; children: React.ReactNode}> = ({p, c = '#d9624f', sw = 10, children}) => (
  <span style={{position: 'relative', display: 'inline-block'}}>{children}
    {p > 0 && <span style={{position: 'absolute', left: -8, top: '50%', marginTop: -sw / 2, height: sw, width: `calc(${Math.min(1, p) * 100}% + 16px)`, borderRadius: sw,
      background: c, boxShadow: '0 3px 10px rgba(0,0,0,.45)', transform: 'rotate(-3deg)', transformOrigin: 'left center'}} />}
  </span>
);
