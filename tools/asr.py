"""usage: python3 tools/asr.py <wav> [en|ar] [start end]  — transcribe (parakeet for English, whisper-turbo for Arabic)."""
import sys, glob, os, subprocess, numpy as np, sherpa_onnx
wav, lang = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "en")
ss = ["-ss", sys.argv[3], "-to", sys.argv[4]] if len(sys.argv) > 4 else []
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", *ss, "-i", wav, "-ar", "16000", "-ac", "1", "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
M = os.path.expanduser("~/models")
if lang == "ar":
    d = glob.glob(f"{M}/turbo/*/")[0]
    r = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d + "turbo-encoder.int8.onnx", decoder=d + "turbo-decoder.int8.onnx", tokens=d + "turbo-tokens.txt", language="ar", task="transcribe")
else:
    d = glob.glob(f"{M}/parakeet/*/")[0]; f = lambda p: glob.glob(d + p)[0]
    r = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f("*encoder*.onnx"), decoder=f("*decoder*.onnx"), joiner=f("*joiner*.onnx"), tokens=f("tokens.txt"), model_type="nemo_transducer")
out = []
for a in range(0, len(x), 16000 * 15):
    s = r.create_stream(); s.accept_waveform(16000, x[a:a + 16000 * 15]); r.decode_stream(s); out.append(s.result.text)
print(" ".join(out))
