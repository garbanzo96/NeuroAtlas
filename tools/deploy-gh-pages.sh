#!/usr/bin/env bash
# Construye la app con la ruta base de GitHub Pages y publica dist/ en la rama gh-pages.
# Uso: tools/deploy-gh-pages.sh   (requiere permiso de push a origin)
set -euo pipefail
cd "$(dirname "$0")/.."
NEUROATLAS_BASE=/NeuroAtlas/ npm run build >/dev/null
tmp=$(mktemp -d)
cp -R apps/web/dist/. "$tmp"
find "$tmp" -name '*.map' -delete
touch "$tmp/.nojekyll"
cp "$tmp/index.html" "$tmp/404.html"
sha=$(git rev-parse --short HEAD)
git -C "$tmp" init -q -b gh-pages
git -C "$tmp" add -A
git -C "$tmp" -c user.name="$(git config user.name)" -c user.email="$(git config user.email)" commit -qm "Publicación de $sha"
git -C "$tmp" push -qf "$(git remote get-url origin)" gh-pages
rm -rf "$tmp"
# el build lleva la base /NeuroAtlas/: si quedara, `npm run preview` (y las e2e) servirían 404 desde la raíz
rm -rf apps/web/dist
echo "Publicado $sha en gh-pages"
