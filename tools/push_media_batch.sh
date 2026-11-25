#!/usr/bin/env bash
# usage: tools/push_media_batch.sh <manifest.tsv>
# Sends many finished files to Zernio's media storage in ONE push through the GitHub relay (see push_media.sh).
# Manifest: one line per file, tab-separated: <local_file> <presigned_upload_url> <content_type> <name>
# <name> is the file name used on the relay branch (letters, digits, dot, dash, underscore). Keep the manifest
# outside the repository: the upload URLs are short-lived secrets.
set -euo pipefail
MAN="$(realpath "$1")"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="$(git -C "$REPO_DIR" remote get-url origin)"
W="$(mktemp -d)"; trap 'rm -rf "$W"' EXIT
git init -q "$W/m"; cd "$W/m"; git checkout -q --orphan media; git remote add origin "$REMOTE"
git config user.name "claude-studio"; git config user.email "claude-studio@users.noreply.github.com"
mkdir -p .github/workflows outbox requests
cp "$REPO_DIR/.github/workflows/push-media.yml" .github/workflows/push-media.yml
NAMES=()
while IFS=$'\t' read -r FILE URL CTYPE NAME; do
  [ -n "$FILE" ] || continue
  [[ "$NAME" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "bad name: $NAME"; exit 1; }
  cp "$FILE" "outbox/$NAME"; printf '%s\n%s\n' "$URL" "$CTYPE" > "requests/$NAME.put"; NAMES+=("$NAME")
done < "$MAN"
echo "Media relay outbox (see RUNBOOK.md on main)." > README.md
git add -A; git commit -qm "upload ${#NAMES[@]} files"; git push -q -f origin HEAD:media
# A first push that rewrites the branch with many files did not start the workflow (25 Nov 2026); a small second
# commit under requests/ does. The workflow skips files already marked done, so running twice is harmless.
sleep 5; date -u > requests/nudge.txt; git add -A; git commit -qm "relay: run"; git push -q origin HEAD:media 2>/dev/null || true  # refused when the workflow already ran and committed
for i in $(seq 1 60); do
  sleep 12
  git fetch -q origin +media:refs/remotes/origin/media || continue
  ok=0; bad=0
  for n in "${NAMES[@]}"; do
    if git cat-file -e "origin/media:done/$n.ok" 2>/dev/null; then ok=$((ok+1)); fi
    if git cat-file -e "origin/media:done/$n.fail" 2>/dev/null; then bad=$((bad+1)); echo "FAILED $n: $(git show "origin/media:done/$n.fail")"; fi
  done
  if [ $((ok+bad)) -eq ${#NAMES[@]} ]; then echo "uploaded $ok of ${#NAMES[@]}, failed $bad"; [ "$bad" -eq 0 ]; exit $?; fi
done
echo "timed out waiting for the relay (check the Actions tab: push-media)"; exit 1
