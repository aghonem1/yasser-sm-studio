#!/usr/bin/env bash
# usage: tools/push_media.sh <local_file> <presigned_upload_url> [content_type]
# Sends a finished video or image to Zernio's media storage through GitHub (the workspace cannot reach it directly).
# 1. Get the URL pair from Zernio: media_get_media_presigned_url(filename, content_type) -> uploadUrl + publicUrl.
# 2. Run this script with the uploadUrl. 3. Use the publicUrl as media_urls in posts_create.
# The branch "media" is rewritten on every call, so the repository does not keep old videos.
set -euo pipefail
FILE="$(realpath "$1")"; URL="$2"; CTYPE="${3:-video/mp4}"
NAME="$(basename "$FILE" | tr -c 'A-Za-z0-9._-' '_' | sed 's/_*$//')"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="$(git -C "$REPO_DIR" remote get-url origin)"
W="$(mktemp -d)"; trap 'rm -rf "$W"' EXIT
git init -q "$W/m"; cd "$W/m"; git checkout -q --orphan media; git remote add origin "$REMOTE"
git config user.name "claude-studio"; git config user.email "claude-studio@users.noreply.github.com"
mkdir -p .github/workflows outbox requests
cp "$REPO_DIR/.github/workflows/push-media.yml" .github/workflows/push-media.yml
cp "$FILE" "outbox/$NAME"; printf '%s\n%s\n' "$URL" "$CTYPE" > "requests/$NAME.put"
echo "Media relay outbox (see RUNBOOK.md on main)." > README.md
git add -A; git commit -qm "upload $NAME"; git push -q -f origin HEAD:media
for i in $(seq 1 40); do
  sleep 12
  git fetch -q origin media || continue
  if git cat-file -e "origin/media:done/$NAME.ok" 2>/dev/null; then echo "uploaded $NAME ($(git show "origin/media:done/$NAME.ok"))"; exit 0; fi
  if git cat-file -e "origin/media:done/$NAME.fail" 2>/dev/null; then echo "upload FAILED for $NAME: $(git show "origin/media:done/$NAME.fail")"; exit 1; fi
done
echo "timed out waiting for the relay (check the Actions tab: push-media)"; exit 1
