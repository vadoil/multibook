# Multibook — новый сайт

План и этапы: `docs/PLAN.md`. Аудит старого сайта на Tilda: `../Multibook_передача_Claude_2026-11-22/03_Карта_сайта_и_ограничения.md`.

## Команды (Windows, PowerShell)
- `npm run dev` — локальный сервер на http://127.0.0.1:3000 (только localhost: у машины публичный IP)
- `npm run import:tilda` — импорт/обновление каталога из публичного API Tilda Store
- `npx drizzle-kit push` — применить схему к SQLite (`data/multibook.db`)
- `npx tsc --noEmit` — проверка типов

## Правила
- Цены в базе — в копейках (`integer`), вывод через `formatPrice`.
- Нормализация товаров — только в `src/lib/normalize.ts`; импорт можно перезапускать.
- Картинки товаров — готовые фото из каталога Tilda. Свои иллюстрации товаров не рисуем: пользователь сам перерисует картинки. Рисованное превью — только в конструкторе (`NotebookPreview`).
- Экспорт Tilda (CSV/YML) лежит в `data/import/` (не в git); в нём у дисков пустые категория и характеристики — диаметр и фасовка восстанавливаются в `scripts/import-tilda.ts` и помечаются в `attrs.inferred`.
- Секреты (ЮKassa, СДЭК, ИИ-роутер) — только в `.env` на сервере, никогда в клиентском коде.
- npm 11 не запускает install-скрипты без одобрения: `better-sqlite3` и `esbuild` одобрены через `npm install-scripts approve`.
- Дизайн-токены — в `src/app/globals.css` (`@theme`); финальный дизайн придёт макетами Codex.
