#!/usr/bin/env bash
# One-time setup in a fresh Claude workspace. ~5–8 min (models are the slow part).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
( cd "$ROOT/remotion" && npm ci --silent )
pip install --break-system-packages -q pedalboard pyloudnorm soundfile scipy librosa sherpa-onnx pillow
M="$HOME/models"; mkdir -p "$M"; cd "$M"
REL=https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models
[ -d parakeet ] || { curl -fsSL -o p.tar.bz2 $REL/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8.tar.bz2 && mkdir parakeet && tar xjf p.tar.bz2 -C parakeet && rm p.tar.bz2; }
[ -d turbo ] || { curl -fsSL -o t.tar.bz2 $REL/sherpa-onnx-whisper-turbo.tar.bz2 && mkdir turbo && tar xjf t.tar.bz2 -C turbo && rm t.tar.bz2; }
which google-chrome >/dev/null || echo "WARNING: google-chrome not found; Remotion will download its own headless shell"
echo "setup done"
