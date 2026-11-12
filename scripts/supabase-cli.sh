#!/usr/bin/env bash
# Run the pinned Supabase CLI (db-testing-and-migrations.md).
# Downloads the official release once, verifies its SHA-256 against the
# release's published checksums.txt, caches it in .tools/ (git-ignored),
# then runs it with the given arguments: scripts/supabase-cli.sh start
set -euo pipefail
VERSION="2.122.0"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/.tools/supabase-$VERSION"
BIN="$DIR/supabase"
case "$(uname -s)-$(uname -m)" in
  Linux-x86_64) ASSET="supabase_${VERSION}_linux_amd64.tar.gz" ;;
  Linux-aarch64) ASSET="supabase_${VERSION}_linux_arm64.tar.gz" ;;
  Darwin-arm64) ASSET="supabase_${VERSION}_darwin_arm64.tar.gz" ;;
  Darwin-x86_64) ASSET="supabase_${VERSION}_darwin_amd64.tar.gz" ;;
  *) echo "Unsupported platform $(uname -s)-$(uname -m)" >&2; exit 1 ;;
esac
if [ ! -x "$BIN" ]; then
  mkdir -p "$DIR"
  BASE="https://github.com/supabase/cli/releases/download/v$VERSION"
  curl -fsSL -o "$DIR/$ASSET" "$BASE/$ASSET"
  curl -fsSL -o "$DIR/checksums.txt" "$BASE/checksums.txt"
  (cd "$DIR" && grep " $ASSET\$" checksums.txt | sha256sum -c -) >&2
  tar -xzf "$DIR/$ASSET" -C "$DIR" supabase
  rm -f "$DIR/$ASSET"
fi
exec "$BIN" "$@"
