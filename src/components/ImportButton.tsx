"use client";

import { useActionState } from "react";
import { runImport, type ImportState } from "@/app/admin/actions";

export function ImportButton() {
  const [s, action, pending] = useActionState<ImportState>(runImport, {});
  return (
    <div>
      <form action={action}>
        <button disabled={pending} className="rounded-full bg-ink px-6 py-3 font-semibold text-white disabled:opacity-50">
          {pending ? "Загружаем из Tilda…" : "Обновить каталог из Tilda"}
        </button>
      </form>
      {s.result && <p className="mt-4 rounded-xl bg-ok/10 px-4 py-3 text-sm text-ok">{s.result}</p>}
      {s.error && <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">{s.error}</p>}
      {s.warnings && s.warnings.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer">Предупреждения: {s.warnings.length}</summary>
          <ul className="mt-2 list-disc pl-5 text-muted">
            {s.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
