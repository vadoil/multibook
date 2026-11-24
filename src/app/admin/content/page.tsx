import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { CONTENT_STATUSES } from "@/db/schema";
import { fmtDate } from "@/components/admin";
import { ProductPicker, SubmitButton } from "@/components/content/ContentControls";
import { AI_MODEL, aiBalance, aiReady } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { ANGLES, KIND_LABELS, STATUS_LABELS } from "@/lib/content";
import { CHANNELS } from "@/lib/publish";
import { createContent } from "./actions";
import "./content.css";

export const metadata: Metadata = { title: "Контент-завод" };

const KINDS = [
  { v: "post", label: "Пост", hint: "Одна картинка 4:5 и текст" },
  { v: "carousel", label: "Карусель", hint: "5–6 слайдов с одной мыслью на каждом" },
  { v: "reel", label: "Рилс", hint: "Видео 9:16 из фото товара, 15–20 секунд" },
] as const;

export default async function ContentBoard({ searchParams }: { searchParams: Promise<{ product?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const items = db
    .select({ item: schema.contentItems, product: schema.products.shortTitle })
    .from(schema.contentItems)
    .leftJoin(schema.products, eq(schema.products.id, schema.contentItems.productId))
    .orderBy(desc(schema.contentItems.updatedAt))
    .all();
  const products = db
    .select({ id: schema.products.id, title: schema.products.shortTitle, type: schema.products.type, images: schema.products.images })
    .from(schema.products)
    .where(eq(schema.products.isActive, true))
    .orderBy(schema.products.sortOrder)
    .all()
    .map((p) => ({ id: p.id, title: p.title, type: p.type, image: p.images[0] ? `/_next/image?url=${encodeURIComponent(p.images[0])}&w=96&q=75` : null }));
  const balance = await aiBalance();

  return (
    <div className="cf">
      <header className="cf-head">
        <div>
          <h1>Контент-завод</h1>
          <p>Из карточки товара получается пост, карусель или рилс. Фото берутся настоящие, текст пишет ИИ по фактам из карточки, вы правите и утверждаете.</p>
        </div>
        <ul className="cf-status">
          <li data-on={aiReady()}>Тексты: {aiReady() ? `${AI_MODEL.split("/").pop()}${balance !== null ? `, баланс $${balance.toFixed(2)}` : ""}` : "по шаблону, ключ ИИ не задан"}</li>
          {CHANNELS.map((c) => (
            <li key={c.v} data-on={c.ready()}>{c.label}: {c.ready() ? "подключён" : "не подключён"}</li>
          ))}
        </ul>
      </header>

      {sp.error && <p className="cf-alert" role="alert">{sp.error}</p>}

      <form action={createContent} className="cf-create">
        <section>
          <h2>Товар</h2>
          <ProductPicker products={products} initial={Number(sp.product) || undefined} />
        </section>
        <section>
          <h2>Формат</h2>
          <div className="cf-kinds">
            {KINDS.map((k, i) => (
              <label key={k.v}>
                <input type="radio" name="kind" value={k.v} defaultChecked={i === 1} />
                <b>{k.label}</b>
                <small>{k.hint}</small>
              </label>
            ))}
          </div>
          <h2>О чём</h2>
          <div className="cf-chips">
            {ANGLES.map((a, i) => (
              <label key={a.v}>
                <input type="radio" name="angle" value={a.v} defaultChecked={i === 0} />
                {a.label}
              </label>
            ))}
          </div>
        </section>
        <section>
          <h2>Пожелание редактору</h2>
          <textarea name="note" rows={4} placeholder="Необязательно. Например: к 1 сентября, для студентов" />
          <SubmitButton className="cf-primary" pending="Пишем текст, 10–20 секунд…">Создать материал</SubmitButton>
        </section>
      </form>

      <div className="cf-board">
        {CONTENT_STATUSES.map((st) => {
          const col = items.filter((x) => x.item.status === st);
          return (
            <section key={st} className="cf-col" data-status={st}>
              <h2>{STATUS_LABELS[st]} <span>{col.length}</span></h2>
              {col.map(({ item, product }) => (
                <Link key={item.id} href={`/admin/content/${item.id}`} className="cf-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/admin/content/${item.id}/frame/0?w=360&v=${item.updatedAt.getTime()}`} alt="" loading="lazy" data-kind={item.kind} />
                  <span className="cf-kind">{KIND_LABELS[item.kind]}</span>
                  <b>{item.title}</b>
                  <small>{product ?? "товар удалён"} · {fmtDate(item.updatedAt)}</small>
                </Link>
              ))}
              {!col.length && <p className="cf-none">{st === "draft" ? "Создайте первый материал в форме выше." : "Пока пусто."}</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
