#!/usr/bin/env bash
# usage: tools/fetch_audio.sh <heygen_url> <file_name> <dest_path> [<url> <name> <dest> ...]   (HeyGen speech or HeyGen music-library URLs)
# Pushes a request to branch "audio"; the fetch-audio workflow downloads it; we pull it back.
set -euo pipefail
ARGS=("$@")
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="$(git -C "$REPO_DIR" remote get-url origin)"
W="$(mktemp -d)"; trap 'rm -rf "$W"' EXIT
if git ls-remote --exit-code --heads "$REMOTE" audio >/dev/null 2>&1; then
  git clone -q --depth 1 -b audio "$REMOTE" "$W/a"
else
  git init -q "$W/a"; git -C "$W/a" checkout -q --orphan audio; git -C "$W/a" remote add origin "$REMOTE"
  mkdir -p "$W/a/requests"; echo "Audio relay inbox (see RUNBOOK.md on main)." > "$W/a/README.md"
fi
# the workflow must live on the pushed branch for push events to run it
mkdir -p "$W/a/.github/workflows"; cp "$REPO_DIR/.github/workflows/fetch-audio.yml" "$W/a/.github/workflows/fetch-audio.yml"
cd "$W/a"; git config user.name "claude-studio"; git config user.email "claude-studio@users.noreply.github.com"
mkdir -p requests
for ((k=0; k<${#ARGS[@]}; k+=3)); do printf '%s\n' "${ARGS[k]}" > "requests/${ARGS[k+1]}.url"; done
git add -A; git commit -qm "request ${ARGS[1]}"; git push -q origin HEAD:audio
for i in $(seq 1 40); do
  sleep 15
  git fetch -q origin audio && git reset -q --hard origin/audio
  ok=1; for ((k=0; k<${#ARGS[@]}; k+=3)); do [ -f "inbox/${ARGS[k+1]}" ] || ok=0; done
  if [ $ok = 1 ]; then for ((k=0; k<${#ARGS[@]}; k+=3)); do cp "inbox/${ARGS[k+1]}" "${ARGS[k+2]}"; echo "fetched ${ARGS[k+1]} -> ${ARGS[k+2]} ($(stat -c%s "${ARGS[k+2]}") bytes)"; done; exit 0; fi
done
echo "timed out waiting for the relay (check the Actions tab: fetch-audio)"; exit 1
