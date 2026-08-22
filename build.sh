#!/data/data/com.termux/files/usr/bin/bash
set -e

# Compila el plugin en /tmp porque la sdcard está montada noexec
PROJECT="$(cd "$(dirname "$0")" && pwd)"
WORK=/tmp/opencode/sys-emojis-build

rm -rf "$WORK"
mkdir -p "$WORK"
cp -r "$PROJECT"/src "$PROJECT"/manifest.json "$PROJECT"/package.json "$PROJECT"/tsconfig.json "$PROJECT"/build.mjs "$WORK"/

cd "$WORK"
[ -d node_modules ] || npm install
npm run build

cp -r dist "$PROJECT"/
echo "dist/ actualizado en $PROJECT"
