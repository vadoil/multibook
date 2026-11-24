#!/usr/bin/env bash
# Выкладка релиза на sport-brend.ru. Порядок — docs/DEPLOY-UPDATE.md.
# Запуск на сервере: bash -s <sha> < deploy-preview.sh (архив уже лежит в /root/mb-release.tar.gz).
set -euo pipefail
sha="$1"  # полный хеш коммита, из которого собран архив
base=/srv/multibook-preview
rel=$base/releases/$sha
db=$base/shared/data/multibook.db
prev=$(readlink $base/current)
activated=0
cleanup() {
  st=$?; trap - EXIT
  systemctl stop multibook-preview-check.service 2>/dev/null || true
  if [ "$st" -ne 0 ] && [ "$activated" -eq 1 ]; then
    ln -sfn "$prev" $base/current.rollback; mv -Tf $base/current.rollback $base/current
    systemctl restart multibook-preview.service; echo 'ROLLBACK: previous release restored'
  fi
  echo "exit status $st"; exit $st
}
trap cleanup EXIT
python3 - "$db" "$base/shared/backups/before-content-$sha.db" <<'PY'
import sqlite3,sys,os
s=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True);t=sqlite3.connect(sys.argv[2]);s.backup(t);t.close();s.close();os.chmod(sys.argv[2],0o600);print('backup ok',os.path.getsize(sys.argv[2]))
PY
rm -rf "$rel"; install -d -m 0750 -o root -g multibook-preview "$rel"
tar -xzf /root/mb-release.tar.gz -C "$rel"
ln -sfn ../../shared/node_modules "$rel/node_modules"
mkdir -p "$rel/.next/node_modules"
ln -sfn ../../node_modules/better-sqlite3 "$rel/.next/node_modules/better-sqlite3-90e2652d1716b047"
ln -sfn ../../node_modules/sharp "$rel/.next/node_modules/sharp-20c6a5da84e2135f"
ln -sfn $base/shared/next-cache "$rel/.next/cache"
chown -R root:multibook-preview "$rel"; chmod -R u+rwX,g+rX,o-rwx "$rel"
test "$(cat $rel/RELEASE_SHA)" = "$sha"
echo '== schema'
cd "$rel" && runuser -u multibook-preview -- env DATABASE_PATH=$db /usr/local/bin/node scripts/db-upgrade.cjs
echo '== candidate'
systemctl stop multibook-preview-check.service 2>/dev/null || true
systemd-run --quiet --unit=multibook-preview-check --collect --property=User=multibook-preview --property=Group=multibook-preview --property="WorkingDirectory=$rel" --property=MemoryMax=512M --property=Nice=10 --setenv=NODE_ENV=production --setenv=NODE_OPTIONS=--max-old-space-size=192 --setenv=MALLOC_ARENA_MAX=2 --setenv=UV_THREADPOOL_SIZE=2 --setenv=HOSTNAME=127.0.0.1 --setenv=PORT=4318 --setenv=DATABASE_PATH=$db --setenv=SITE_URL=https://sport-brend.ru --setenv=DEMO_PAYMENTS=1 --setenv=DESIGN_PREVIEW=1 /usr/local/bin/node server.js
c=http://127.0.0.1:4318
curl --retry 10 --retry-connrefused --retry-delay 1 --max-time 20 -fsS $c/ -o /tmp/mb-home.html
grep -q 'wp-hero' /tmp/mb-home.html
curl -fsS --max-time 20 $c/catalog -o /tmp/mb-cat.html; grep -q 'breadcrumbs' /tmp/mb-cat.html; grep -q 'page-shell' /tmp/mb-cat.html
curl -fsS --max-time 20 $c/product/modulnaya-tetrad-a5-s-nabornym-blokom-multibook-7-106603 -o /tmp/mb-prod.html; grep -q 'product-purchase' /tmp/mb-prod.html
curl -fsS --max-time 20 $c/privacy -o /tmp/mb-priv.html; grep -q 'mb_session' /tmp/mb-priv.html; ! grep -q 'localhost:3000' /tmp/mb-priv.html
for p in /consent /how-it-works /corporate /constructor /cart /delivery; do test "$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' $c$p)" = 200 || { echo "FAIL $p"; exit 1; }; done
code=$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' $c/admin/content); echo "admin/content -> $code"; [ "$code" = 307 ] || [ "$code" = 302 ] || [ "$code" = 303 ]
test "$(curl -sS --max-time 15 -o /dev/null -w '%{http_code}' $c/hero/paper-lifestyle-desk-product.webp)" = 200
echo 'candidate ok'
printf '%s\n' "$prev" > $base/shared/previous-release
ln -sfn "releases/$sha" $base/current.next; mv -Tf $base/current.next $base/current; activated=1
systemctl restart multibook-preview.service
curl --retry 10 --retry-connrefused --retry-delay 1 --max-time 20 -fsS http://127.0.0.1:4317/catalog -o /tmp/mb-active.html; grep -q 'breadcrumbs' /tmp/mb-active.html
curl --retry 3 --retry-delay 1 --max-time 20 -fsS https://sport-brend.ru/consent -o /dev/null
echo "Active: $(readlink $base/current)"; systemctl is-active multibook-preview.service