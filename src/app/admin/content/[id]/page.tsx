import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ContentStatus } from "@/db/schema";
import { fmtDate } from "@/components/admin";
import { CopyButton, SubmitButton } from "@/components/content/ContentControls";
import { ContentPreview } from "@/components/content/ContentPreview";
import { requireAdmin } from "@/lib/auth";
import { composeFinal, frameCount, KIND_LABELS, STATUS_LABELS } from "@/lib/content";
import { CHANNELS } from "@/lib/publish";
import { deleteContent, publishContent, regenerateContent, saveContent, setContentStatus } from "../actions";
import "../content.css";

export const metadata: Metadata = { title: "Материал" };

const TEMPLATES = [
  { v: "photo", label: "Фото во весь кадр" },
  { v: "paper", label: "Бумага" },
  { v: "ink", label: "Тёмный" },
] as const;

const NEXT: Record<ContentStatus, { to: ContentStatus; label: string }[]> = {
  draft: [{ to: "review", label: "Отправить на проверку" }, { to: "approved", label: "Утвердить" }],
  review: [{ to: "approved", label: "Утвердить" }, { to: "draft", label: "Вернуть в черновики" }],
  approved: [{ to: "published", label: "Отметить опубликованным" }, { to: "draft", label: "Вернуть в черновики" }],
  published: [{ to: "approved", label: "Снять отметку" }],
};

export default async function ContentEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const item = Number.isInteger(id) ? db.select().from(schema.contentItems).where(eq(schema.contentItems.id, id)).get() : undefined;
  if (!item) notFound();
  const p = item.productId ? (db.select().from(schema.products).where(eq(schema.products.id, item.productId)).get() ?? null) : null;
  const sp = await searchParams;
  const d = item.data;
  const reel = item.kind === "reel";
  const rows = reel ? d.scenes : d.slides;
  const final = composeFinal(item, p);
  const v = item.updatedAt.getTime();
  const approved = item.status === "approved" || item.status === "published";
  const thumbs = (p?.images ?? []).slice(0, 8).map((u) => `/_next/image?url=${encodeURIComponent(u)}&w=96&q=75`);

  return (
    <div className="cf cf-editor">
      <Link href="/admin/content" className="cf-back">← Все материалы</Link>
      <header className="cf-edit-head">
        <div>
          <p className="cf-meta">
            <span className="cf-kind">{KIND_LABELS[item.kind]}</span>
            <span className="cf-state" data-status={item.status}>{STATUS_LABELS[item.status]}</span>
            {p && <Link href={`/admin/products/${p.id}`}>{p.shortTitle}</Link>}
            <span>Текст: {item.source ?? "вручную"} · {fmtDate(item.updatedAt)}</span>
          </p>
          <h1>{item.title}</h1>
        </div>
        <div className="cf-steps">
          {NEXT[item.status].map((s, i) => (
            <form key={s.to} action={setContentStatus.bind(null, item.id, s.to)}>
              <button className={i === 0 ? "cf-primary" : "cf-ghost"}>{s.label}</button>
            </form>
          ))}
        </div>
      </header>

      {sp.ok && <p className="cf-alert" data-ok role="status">{sp.ok}</p>}
      {sp.error && <p className="cf-alert" role="alert">{sp.error}</p>}

      <div className="cf-workbench">
        <aside className="cf-preview">
          <ContentPreview id={item.id} kind={item.kind} count={frameCount(item)} v={v} scenes={d.scenes.map((s) => ({ seconds: s.seconds }))} />
        </aside>

        <form action={saveContent.bind(null, item.id)} className="cf-form">
          <button className="cf-sr" tabIndex={-1} aria-hidden="true">Сохранить</button>
          <input type="hidden" name="count" value={rows.length} />
          <label>
            <span>Рабочее название</span>
            <input name="title" defaultValue={item.title} />
          </label>
          <label>
            <span>{item.kind === "post" ? "Первая строка поста" : reel ? "Крючок" : "Заголовок обложки"}</span>
            <input name="hook" defaultValue={d.hook} />
          </label>
          <label>
            <span>{item.kind === "post" ? "Текст поста" : "Подпись"}</span>
            <textarea name="caption" rows={item.kind === "post" ? 9 : 5} defaultValue={d.caption} />
          </label>
          <div className="cf-two">
            <label>
              <span>Призыв</span>
              <input name="cta" defaultValue={d.cta} />
            </label>
            <label>
              <span>Хэштеги через пробел</span>
              <input name="hashtags" defaultValue={d.hashtags.join(" ")} />
            </label>
          </div>
          {reel ? (
            <label>
              <span>Музыка</span>
              <input name="music" defaultValue={d.music ?? ""} placeholder="Настроение или название трека" />
            </label>
          ) : (
            <fieldset className="cf-chips">
              <legend>Оформление слайдов</legend>
              {TEMPLATES.map((t) => (
                <label key={t.v}>
                  <input type="radio" name="template" value={t.v} defaultChecked={d.template === t.v} />
                  {t.label}
                </label>
              ))}
            </fieldset>
          )}

          <h2>{reel ? "Кадры" : "Слайды"}</h2>
          <ol className="cf-rows">
            {rows.map((r, i) => (
              <li key={i}>
                <div className="cf-row-fields">
                  {reel ? (
                    <>
                      <label>
                        <span>Надпись в кадре</span>
                        <input name={`scene_overlay_${i}`} defaultValue={d.scenes[i].overlay} maxLength={60} />
                      </label>
                      <label>
                        <span>Голос за кадром</span>
                        <textarea name={`scene_voice_${i}`} rows={2} defaultValue={d.scenes[i].voice} />
                      </label>
                      <label className="cf-sec">
                        <span>Секунд</span>
                        <input name={`scene_seconds_${i}`} type="number" min={2} max={8} defaultValue={d.scenes[i].seconds} />
                      </label>
                    </>
                  ) : (
                    <>
                      <label>
                        <span>Заголовок</span>
                        <input name={`slide_title_${i}`} defaultValue={d.slides[i].title} maxLength={60} />
                      </label>
                      <label>
                        <span>Текст</span>
                        <textarea name={`slide_text_${i}`} rows={2} defaultValue={d.slides[i].text} />
                      </label>
                    </>
                  )}
                </div>
                <fieldset className="cf-photos">
                  <legend>Фото</legend>
                  {thumbs.map((src, k) => (
                    <label key={k}>
                      <input type="radio" name={`${reel ? "scene" : "slide"}_image_${i}`} value={k} defaultChecked={r.image === k} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Фото ${k + 1}`} width={48} height={48} loading="lazy" />
                    </label>
                  ))}
                </fieldset>
                {rows.length > 1 && item.kind !== "post" && (
                  <button className="cf-del" name="op" value={`del:${i}`} aria-label={`Удалить ${reel ? "кадр" : "слайд"} ${i + 1}`}>Удалить</button>
                )}
              </li>
            ))}
          </ol>
          <div className="cf-form-actions">
            <SubmitButton className="cf-primary" pending="Сохраняем…">Сохранить и обновить превью</SubmitButton>
            {item.kind !== "post" && rows.length < 8 && <button className="cf-ghost" name="op" value="add">Добавить {reel ? "кадр" : "слайд"}</button>}
          </div>
        </form>

        <aside className="cf-out">
          <section>
            <h2>Готовый материал</h2>
            <p className="cf-hint">Текст публикации целиком: с призывом, ссылкой на товар и хэштегами.</p>
            <textarea readOnly value={final} rows={12} aria-label="Готовый текст публикации" />
            <CopyButton text={final} className="cf-ghost" />
            <a className="cf-ghost" href={`/admin/content/${item.id}/export`}>Скачать архив: {reel ? "кадры" : "картинки"} и текст</a>
            {reel && <p className="cf-hint">Видео скачивается кнопкой под превью: браузер записывает ролик за время его длительности.</p>}
          </section>

          <section>
            <h2>Публикация</h2>
            {!approved && <p className="cf-hint">Кнопки включатся после утверждения.</p>}
            {CHANNELS.map((c) =>
              c.ready() && !approved ? (
                <p key={c.v} className="cf-off">{c.label}: подключён, ждёт утверждения.</p>
              ) : c.ready() ? (
                <form key={c.v} action={publishContent.bind(null, item.id, c.v)}>
                  <SubmitButton className="cf-primary" pending="Отправляем…">{item.publishedTo.includes(c.label) ? `Отправить ещё раз: ${c.label}` : `Опубликовать: ${c.label}`}</SubmitButton>
                </form>
              ) : (
                <p key={c.v} className="cf-off">{c.label} не подключён. Нужны {c.env} в .env на сервере.</p>
              ),
            )}
            <p className="cf-off">Instagram: только вручную, из архива. Автопубликация туда из России недоступна.</p>
            {item.publishedTo.length > 0 && <p className="cf-hint">Уже отправлено: {item.publishedTo.join(", ")}.</p>}
          </section>

          <section>
            <h2>Другой вариант</h2>
            <form action={regenerateContent.bind(null, item.id)} className="cf-regen">
              <textarea name="note" rows={2} placeholder="Что изменить: короче, про подарок, без цены…" aria-label="Пожелание к новому варианту" />
              <SubmitButton className="cf-ghost" pending="Пишем заново, 10–20 секунд…">Написать заново</SubmitButton>
            </form>
            <form action={deleteContent.bind(null, item.id)}>
              <button className="cf-danger">Удалить материал</button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
