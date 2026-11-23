import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { fmtDate } from "@/components/admin";
import { ImportButton } from "@/components/ImportButton";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Импорт из Tilda" };

export default async function AdminImport() {
  await requireAdmin();
  const runs = db.select().from(schema.importRuns).orderBy(desc(schema.importRuns.startedAt)).limit(10).all();
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Импорт из Tilda</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Забирает товары из публичного каталога Tilda: цены, наличие, фото, описания. Товары, исправленные в админке вручную, сохраняют ваши правки. Пропавшие из
        Tilda — скрываются.
      </p>
      <div className="mt-6">
        <ImportButton />
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Последние запуски</h2>
      <ul className="mt-3 divide-y divide-line rounded-[var(--radius-card)] bg-card px-5 text-sm">
        {runs.map((r) => (
          <li key={r.id} className="py-3">
            <div className="flex flex-wrap gap-x-4">
              <span className="w-32 text-muted">{fmtDate(r.startedAt)}</span>
              <span>
                новых {r.created} · обновлено {r.updated} · скрыто {r.deactivated}
              </span>
            </div>
            {r.warnings.length > 0 && (
              <details className="mt-1">
                <summary className="cursor-pointer text-muted">Предупреждения: {r.warnings.length}</summary>
                <ul className="mt-1 list-disc pl-5 text-muted">
                  {r.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
