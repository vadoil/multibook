import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { fmtDate, input } from "@/components/admin";
import { requireAdmin } from "@/lib/auth";
import { saveProduct, unlockProduct } from "../../actions";
import { saveMarketLinks } from "../../marketplaces/actions";

const INFERRED: Record<string, string> = { diameter: "диаметр", pack: "фасовка" };

export default async function AdminProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const p = db.select().from(schema.products).where(eq(schema.products.id, id)).get();
  if (!p) notFound();
  const sp = await searchParams;
  const rub = (k: number | null) => (k === null ? "" : String(k / 100));

  return (
    <>
      <Link href="/admin/products" className="text-sm text-muted">
        ← Все товары
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{p.shortTitle}</h1>
        {p.isActive && (
          <Link href={`/product/${p.slug}`} target="_blank" className="ml-auto text-sm underline underline-offset-4">
            На сайте ↗
          </Link>
        )}
      </div>

      {sp.saved && <p className="mt-4 rounded-xl bg-ok/10 px-4 py-3 text-sm text-ok">Сохранено. Изменения уже на сайте.</p>}
      {sp.error && <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">Не сохранено: проверьте название, цену (рубли) и наличие (целое число или пусто).</p>}
      {p.attrs.inferred?.length ? (
        <p className="mt-4 rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">
          При импорте угадано: {p.attrs.inferred.map((k) => INFERRED[k] ?? k).join(", ")}. Лучше поправить название товара в Tilda.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <form action={saveProduct.bind(null, p.id)} className="grid gap-4 rounded-[var(--radius-card)] bg-card p-5">
          <label>
            <span className="text-sm text-muted">Полное название</span>
            <input name="title" defaultValue={p.title} required className={input} />
          </label>
          <label>
            <span className="text-sm text-muted">Короткое название — в карточках и конструкторе</span>
            <input name="shortTitle" defaultValue={p.shortTitle} className={input} />
          </label>
          <div className="grid gap-4 sm:grid-cols-4">
            <label>
              <span className="text-sm text-muted">Цена, ₽</span>
              <input name="price" inputMode="decimal" defaultValue={rub(p.price)} required className={input} />
            </label>
            <label>
              <span className="text-sm text-muted">Старая цена, ₽</span>
              <input name="priceOld" inputMode="decimal" defaultValue={rub(p.priceOld)} className={input} />
            </label>
            <label>
              <span className="text-sm text-muted">Наличие, шт</span>
              <input name="stock" inputMode="numeric" defaultValue={p.stock ?? ""} placeholder="без ограничения" className={input} />
            </label>
            <label>
              <span className="text-sm text-muted">Порядок</span>
              <input name="sortOrder" inputMode="numeric" defaultValue={p.sortOrder} className={input} />
            </label>
          </div>
          <label>
            <span className="text-sm text-muted">Описание</span>
            <textarea name="description" rows={8} defaultValue={p.description ?? ""} className={input} />
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="isActive" defaultChecked={p.isActive} className="size-5 accent-ink" />
            Показывать на сайте
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="featured" defaultChecked={p.featured} className="size-5 accent-ink" />
            Показывать на главной в «Готовой коллекции» (до 4 товаров, по порядку сортировки)
          </label>
          <button className="justify-self-start rounded-full bg-ink px-6 py-3 font-semibold text-white">Сохранить</button>
        </form>

        <aside className="grid h-fit gap-4">
          {p.images[0] && (
            <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-[#efe9df]">
              <Image src={p.images[0]} alt="" fill sizes="320px" className="object-cover" />
            </div>
          )}
          <div className="grid gap-2 rounded-[var(--radius-card)] bg-card p-5 text-sm">
            <p className="font-semibold">Контент для соцсетей</p>
            <p className="text-muted">Пост, карусель или рилс из этой карточки: фото настоящие, текст по фактам.</p>
            <Link href={`/admin/content?product=${p.id}`} className="justify-self-start rounded-full bg-ink px-5 py-2.5 font-semibold text-white">
              Сделать пост или рилс
            </Link>
          </div>
          <form id="market" action={saveMarketLinks.bind(null, p.id)} className="grid gap-3 rounded-[var(--radius-card)] bg-card p-5 text-sm">
            <p className="font-semibold">Ozon и Wildberries</p>
            <label>
              <span className="text-muted">Ozon: ссылка на товар или SKU</span>
              <input name="ozon" defaultValue={p.ozonUrl ?? p.ozonSku ?? ""} placeholder="https://www.ozon.ru/product/…" className={input} />
            </label>
            <label>
              <span className="text-muted">Wildberries: ссылка или артикул WB</span>
              <input name="wb" defaultValue={p.wbUrl ?? p.wbNmId ?? ""} placeholder="https://www.wildberries.ru/catalog/…" className={input} />
            </label>
            <p className="text-muted">
              Остаток: сайт {p.stock ?? "без ограничения"} · Ozon {p.ozonStock ?? "—"} · WB {p.wbStock ?? "—"}
              {p.marketSyncedAt ? ` · обновлено ${fmtDate(p.marketSyncedAt)}` : ""}
            </p>
            <button className="justify-self-start rounded-full border border-ink px-5 py-2.5 font-semibold">Сохранить ссылки</button>
          </form>
          <div className="rounded-[var(--radius-card)] bg-card p-5 text-sm">
            <p>
              <span className="text-muted">Тип:</span> {p.type}
            </p>
            {p.sku && (
              <p>
                <span className="text-muted">Артикул:</span> {p.sku}
              </p>
            )}
            <p>
              <span className="text-muted">Обновлён:</span> {fmtDate(p.updatedAt)}
            </p>
            {p.lockedAt ? (
              <>
                <p className="mt-3">Правлен вручную {fmtDate(p.lockedAt)} — импорт из Tilda не меняет цену, название, наличие и видимость.</p>
                <form action={unlockProduct.bind(null, p.id)} className="mt-2">
                  <button className="underline underline-offset-4">Снова брать данные из Tilda</button>
                </form>
              </>
            ) : (
              <p className="mt-3 text-muted">Данные приходят из Tilda при импорте. После сохранения здесь — перестанут.</p>
            )}
            <p className="mt-3 text-muted">Фото пока берутся из Tilda; загрузка своих — вместе с новым дизайном.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
