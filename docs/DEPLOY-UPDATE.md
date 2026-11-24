# Как обновить сайт на sport-brend.ru

Сервер 31.129.99.195 (вход `ssh root@31.129.99.195` по ключу). На нём есть и другие проекты — трогаем только `/srv/multibook-preview` и службу `multibook-preview`.

Устройство (сделал Codex): `releases/<хеш коммита>` — готовая сборка, `current` — ссылка на активный релиз, `shared/` — база (`data/multibook.db`), ключи (`preview.env`), `node_modules` под Linux, копии базы (`backups/`). Nginx отдаёт сайт с порта 4317 и запрещает индексацию.

На сервере 2 ГБ памяти, поэтому собираем на рабочем компьютере, а не там.

1. Закоммитить изменения. Собрать с адресом сайта: `$env:SITE_URL = "https://sport-brend.ru"; npm run build`.
2. Собрать папку релиза: из `.next/standalone` взять `.next` (без `node_modules`), `server.js`, `package.json`, `assets`; добавить `.next/static`, `public`, `scripts/db-upgrade.cjs` и файл `RELEASE_SHA` с полным хешем. Файл `.env` из standalone не брать.
3. Упаковать в `release.tar.gz` и скопировать: `scp release.tar.gz root@31.129.99.195:/root/mb-release.tar.gz`.
4. Запустить на сервере `scripts/deploy-preview.sh <хеш>`. Скрипт делает копию базы, раскладывает релиз, добавляет недостающие колонки, поднимает пробный экземпляр на порту 4318 и проверяет страницы. Только после этого переключает `current` и перезапускает службу; при ошибке возвращает прежний релиз.

Если в сборке появился новый внешний модуль (сейчас это `better-sqlite3` и `sharp`), имя ссылки в `.next/node_modules` в скрипте нужно сверить с `.next/standalone/.next/node_modules`.

Ключи — в `/srv/multibook-preview/shared/preview.env` (образец — `.env.example`), после правки `systemctl restart multibook-preview`.

Права админа: человек регистрируется на сайте, затем на сервере в базе ему ставится `role = 'admin'`.