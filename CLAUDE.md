# Multibook — новый сайт

План и этапы: `docs/PLAN.md`. Аудит старого сайта на Tilda: `../Multibook_передача_Claude_2026-11-22/03_Карта_сайта_и_ограничения.md`.

## Команды (Windows, PowerShell)
- `npm run dev` — локальный сервер на http://127.0.0.1:3000 (только localhost: у машины публичный IP)
- `npm run import:tilda` — импорт/обновление каталога из публичного API Tilda Store
- `npx drizzle-kit push` — применить схему к SQLite (`data/multibook.db`)
- `npx tsc --noEmit` — проверка типов
- `npm run admin:grant -- почта` — сделать зарегистрированного пользователя админом (`--revoke` — снять)
- `npm run dev:admin` — локальный админ admin@multibook.test, пароль пишется в `.env.local`

## Правила
- Цены в базе — в копейках (`integer`), вывод через `formatPrice`.
- Нормализация товаров — только в `src/lib/normalize.ts`; импорт можно перезапускать.
- Картинки товаров — готовые фото из каталога Tilda. Свои иллюстрации товаров не рисуем: пользователь сам перерисует картинки. Рисованное превью — только в конструкторе (`NotebookPreview`).
- Экспорт Tilda (CSV/YML) лежит в `data/import/` (не в git); в нём у дисков пустые категория и характеристики — диаметр и фасовка восстанавливаются в `scripts/import-tilda.ts` и помечаются в `attrs.inferred`.
- Секреты (ЮKassa, СДЭК, ИИ-роутер) — только в `.env` на сервере, никогда в клиентском коде.
- npm 11 не запускает install-скрипты без одобрения: `better-sqlite3` и `esbuild` одобрены через `npm install-scripts approve`.
- Дизайн-токены — в `src/app/globals.css` (`@theme`); финальный дизайн придёт макетами Codex.
- Если Tailwind-классы из нового файла не применяются — остановить dev-сервер, удалить `.next`, запустить снова (кэш Turbopack).
- Корзина — `src/lib/cart.ts` (localStorage, без цен). Любая сумма для заказа считается на сервере по базе (`src/lib/orders.ts`), клиентским ценам не верим.
- `formatPrice` — в `src/lib/money.ts` (общий для клиента и сервера); `catalog.ts` — только сервер.
- Админка: каждая страница и каждый server action сам вызывает `requireAdmin()` — проверки в layout недостаточно.
- Импорт Tilda — `src/lib/import-tilda.ts` (без `server-only`, его зовёт и CLI). Товары с `lockedAt` импорт не перезаписывает; адрес (slug) существующего товара не меняется.
- Поиск по-русски без учёта регистра — в JS: `LIKE`/`lower()` в SQLite работают только с латиницей.
- Сайт работает параллельно с multi-book.ru на Tilda (не замена): без редиректов со старых адресов. Публичные контакты и реквизиты — `src/lib/site.ts`, SEO-хелперы — `src/lib/seo.ts`.
- **`drizzle-kit push` на SQLite опасен**: 23.11 при добавлении колонки он пересоздал `products` и потерял все строки. Перед push — остановить dev-сервер и скопировать `data/multibook.db*` (вместе с `-wal`). Новую колонку проще добавить `ALTER TABLE … ADD COLUMN` и потом убедиться, что push пишет «No changes detected».
- Обои первого экрана: `npm run wallpapers` (`scripts/make-wallpapers.mjs`) → `public/hero/*.webp` + `wallpapers.json` + `public/og.jpg`. Слайд ведёт на товар по `uid` (tilda_uid).
- В Telegram не отправлять персональные данные покупателя (серверы за рубежом, 152-ФЗ) — только номер, сумму и ссылку в админку.
