"""Track B music bed, v2 (26 Nov 2026).

Original, synthesised in code (no outside tracks). Modelled on what was MEASURED in the reels that made
@osama_alsadeq_ (3.3M, 544K) and @tickettojannnah (732K): a continuous, beat-free, sustained, warm bed in a
natural-minor colour (both Osama reels: the F minor / C Phrygian note set), sitting about 10–14 dB under the
voice and never ducking to silence. Our Track A score (Hijaz pads + plucked arpeggio + soft kick pulse) is
rhythmic; this one breathes.

Layers: a warm detuned pad (chords i–VI–III–VII in F minor, 4 s each, long crossfades), a low root drone,
a sparse felt-piano motif on chord tones, a faint air layer. Each scene mood changes the colour:
  dawn  – warm, mid filter, piano every ~2 s
  dusk  – darker filter, heavier drone, sparse low piano (the things that weigh on you)
  gold  – open and bright, octave layer and gentle piano arpeggio (the answer)
  night – thin and quiet: drone + a high piano note now and then (prayer)
Use:  from trackb_music import ambient;  music = ambient(total, [(0,'dawn'), (6.5,'dusk'), ...], SR)
The episode script still applies the Qur'an rule (music hard-zeroed in VERSE windows) afterwards.
"""
import numpy as np
from scipy.signal import butter, sosfiltfilt, sosfilt, fftconvolve

def _midi(n): return 440.0 * 2 ** ((n - 69) / 12)

MOODS = {
    #        cutoff  pad   drone piano_every piano_oct piano_vel air  octave_layer
    'dawn':  (1500, 1.00, 0.55, 2.0, 12, 0.55, 0.15, 0.0),
    'dusk':  (750,  0.95, 0.95, 3.0, 0,  0.45, 0.08, 0.0),
    'gold':  (2600, 1.10, 0.60, 0.8, 12, 0.50, 0.35, 0.55),
    'night': (620,  0.50, 0.75, 3.6, 24, 0.32, 0.05, 0.0),
}
# F minor: i – VI – III – VII
PROG = [[53, 56, 60], [49, 53, 56], [56, 60, 63], [51, 55, 58]]
ROOTS = [41, 37, 44, 39]

def _weights(total, sections, SR, xf=1.2):
    """per-mood weight curves (smooth crossfades at each section start)"""
    n = int(total * SR) + SR; t = np.arange(n) / SR
    w = {m: np.zeros(n) for m in MOODS}
    cur = np.zeros(n, dtype=int); names = [s[1] for s in sections]
    for i, (t0, m) in enumerate(sections): cur[t >= t0] = i
    for i, m in enumerate(names): w[m] += (cur == i)
    k = int(xf * SR); ker = np.hanning(k); ker /= ker.sum()
    for m in w: w[m] = np.convolve(w[m], ker, mode='same')
    return t, w

def _pad(t, freqs, cutoff, SR, rng):
    x = np.zeros_like(t)
    for f in freqs:
        for det in (-0.09, 0.0, 0.08):
            ff = f * 2 ** (det / 12); ph = rng.uniform(0, 1)
            x += 2 * ((ff * t + ph) % 1) - 1
    sos = butter(2, cutoff, 'low', fs=SR, output='sos')
    return sosfiltfilt(sos, x) * 0.05

def _piano(f, d, SR, vel=0.5):
    """felt-piano-like note: inharmonic partials, fast attack, two-stage decay, soft hammer"""
    tt = np.arange(int(d * SR)) / SR; B = 0.0004; x = np.zeros_like(tt)
    for k in range(1, 9):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 9000: break
        amp = (1 / k ** 1.3) * (0.6 if k % 2 == 0 else 1.0)
        dec = np.exp(-tt * (1.4 + 0.6 * k)) * 0.75 + np.exp(-tt * 0.5) * 0.25
        x += amp * np.sin(2 * np.pi * fk * tt) * dec
    att = np.minimum(1, tt / 0.006)
    hammer = np.random.default_rng(int(f)).standard_normal(len(tt)) * np.exp(-tt * 120) * 0.05
    sos = butter(2, 2600, 'low', fs=SR, output='sos')
    return sosfilt(sos, x * att + hammer) * vel * 0.22

def _ir(SR, rng, dur=3.6, damp=4200):
    tt = np.arange(int(dur * SR)) / SR; n = rng.standard_normal(len(tt)) * np.exp(-tt * 2.1)
    n = sosfilt(butter(2, damp, 'low', fs=SR, output='sos'), n)
    n[:int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
    return n / np.sqrt((n ** 2).sum())

def ambient(total, sections, SR=48000, seed=5, chord_len=4.0, end_resolve=True):
    rng = np.random.default_rng(seed)
    t, w = _weights(total, sections, SR)
    n = len(t); out = np.zeros(n)
    # chord timeline (with 1.5 s crossfades between chords)
    nch = int(np.ceil((total + 2) / chord_len))
    chords = [PROG[i % 4] for i in range(nch)]; roots = [ROOTS[i % 4] for i in range(nch)]
    if end_resolve:   # land on F minor (add9 colour) for the end card
        chords[-1] = [53, 56, 60, 67]; roots[-1] = 41
        if nch > 1: chords[-2] = [51, 55, 58]
    cenv = np.zeros((nch, n))
    for i in range(nch):
        a, b = i * chord_len, (i + 1) * chord_len
        cenv[i] = np.clip(np.minimum((t - a + 0.75) / 1.5, (b + 0.75 - t) / 1.5), 0, 1)
    # pad per mood (different filter cutoffs), mixed by mood weights
    for m, (cut, padg, drg, pev, poct, pvel, airg, octg) in MOODS.items():
        if w[m].max() < 1e-3: continue
        layer = np.zeros(n)
        for i, ch in enumerate(chords):
            idx = cenv[i] > 0
            if not idx.any(): continue
            seg = _pad(t[idx], [_midi(x) for x in ch], cut, SR, rng) * padg
            if octg > 0: seg += _pad(t[idx], [_midi(x + 12) for x in ch], cut * 1.3, SR, rng) * octg * 0.6
            layer[idx] += seg * cenv[i][idx]
        out += layer * w[m]
    # drone (root, slow breathing)
    drone = np.zeros(n)
    for i, r in enumerate(roots):
        f = _midi(r); drone += (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * cenv[i]
    drone *= 0.06 * (0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * t))
    out += drone * sum(w[m] * MOODS[m][2] for m in MOODS)
    # sparse piano on chord tones, density by mood
    tt0 = 0.6
    while tt0 < total - 1.0:
        i = int(tt0 // chord_len); i = min(i, nch - 1)
        mw = {m: w[m][int(tt0 * SR)] for m in MOODS}; m = max(mw, key=mw.get)
        cut, padg, drg, pev, poct, pvel, airg, octg = MOODS[m]
        note = chords[i][int(rng.integers(0, len(chords[i])))] + poct
        x = _piano(_midi(note), 3.2, SR, pvel * (0.85 + 0.3 * rng.random()))
        j = int(tt0 * SR); k = min(n, j + len(x)); out[j:k] += x[:k - j]
        tt0 += pev * (0.8 + 0.4 * rng.random())
    # air
    air = sosfilt(butter(2, [3000, 9000], 'band', fs=SR, output='sos'), rng.standard_normal(n)) * 0.012
    out += air * sum(w[m] * MOODS[m][6] for m in MOODS) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.07 * t))
    # space
    out = 0.55 * out + 0.45 * fftconvolve(out, _ir(SR, rng))[:n] * 2.2
    # fades
    fi = int(0.25 * SR); out[:fi] *= np.linspace(0.3, 1, fi)
    fe = int(total * SR); fo = int(0.8 * SR); out[fe - fo:fe] *= np.linspace(1, 0, fo); out[fe:] = 0
    return out[:int(total * SR)]
