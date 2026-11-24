"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "mb_cookie_notice";

/**
 * Уведомление о cookie. Сайт ставит только необходимые для работы (вход в кабинет) и хранит корзину
 * в браузере — согласие на них не требуется, достаточно сообщить. Если появится аналитика или реклама,
 * здесь нужен выбор «принять / отклонить», а счётчик можно загружать только после согласия.
 */
export function CookieNotice() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      setOpen(localStorage.getItem(KEY) !== "1");
    } catch {
      setOpen(true);
    }
  }, []);
  if (!open) return null;
  return (
    <aside className="cookie-notice" role="region" aria-label="Уведомление о cookie">
      <p>
        Сайт использует только необходимые cookie: чтобы вы оставались в кабинете, а корзина не терялась. Счётчиков и рекламных cookie нет.{" "}
        <Link href="/privacy#cookie">Подробнее</Link>
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {}
          setOpen(false);
        }}
      >
        Понятно
      </button>
    </aside>
  );
}
