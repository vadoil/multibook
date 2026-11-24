"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pending, className, name, value }: { children: React.ReactNode; pending?: string; className?: string; name?: string; value?: string }) {
  const s = useFormStatus();
  return (
    <button className={className} name={name} value={value} disabled={s.pending} aria-busy={s.pending}>
      {s.pending ? (pending ?? "Секунду…") : children}
    </button>
  );
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? "Скопировано" : "Скопировать текст"}
    </button>
  );
}

type Opt = { id: number; title: string; type: string; image: string | null };

/** Поиск товара по названию: по-русски, без учёта регистра. */
export function ProductPicker({ products, initial }: { products: Opt[]; initial?: number }) {
  const [q, setQ] = useState("");
  const [id, setId] = useState<number | undefined>(initial);
  const chosen = products.find((p) => p.id === id);
  const found = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? products.filter((p) => `${p.title} ${p.type}`.toLowerCase().includes(s)) : products).slice(0, 8);
  }, [q, products]);
  return (
    <div className="cf-picker">
      <input type="hidden" name="productId" value={id ?? ""} />
      {chosen ? (
        <div className="cf-picked">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {chosen.image && <img src={chosen.image} alt="" width={56} height={56} />}
          <span>
            <b>{chosen.title}</b>
            <small>{chosen.type}</small>
          </span>
          <button type="button" onClick={() => setId(undefined)}>Другой товар</button>
        </div>
      ) : (
        <>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Название товара: ботаника, диски, А5…" aria-label="Поиск товара" autoComplete="off" />
          <ul>
            {found.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setId(p.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image && <img src={p.image} alt="" width={44} height={44} loading="lazy" />}
                  <span>
                    <b>{p.title}</b>
                    <small>{p.type}</small>
                  </span>
                </button>
              </li>
            ))}
            {!found.length && <li className="cf-empty">Ничего не нашлось. Попробуйте другое слово.</li>}
          </ul>
        </>
      )}
    </div>
  );
}
