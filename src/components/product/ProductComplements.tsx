import Link from "next/link";
import { ProductCard } from "../ProductCard";
import { CategoryGlyph } from "../design/CategoryGlyph";
import type { selectComplements } from "./complements";

export function ProductComplements({
  selection,
}: {
  selection: NonNullable<ReturnType<typeof selectComplements>>;
}) {
  if (!selection.groups.length) return null;
  return (
    <section
      aria-labelledby="complements-title"
      className="mt-20 border-t border-line pt-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <span className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-sm text-muted">
            Для формата {selection.format}
          </span>
          <h2
            id="complements-title"
            className="mt-4 font-display text-2xl font-bold sm:text-3xl"
          >
            Дополните свой блокнот
          </h2>
          <p className="mt-3 max-w-xl leading-relaxed text-muted">
            Добавьте сменные листы, обновите обложку или подберите новый цвет
            дисков.
          </p>
        </div>
        <Link
          href="/constructor"
          className="inline-flex min-h-11 items-center gap-4 rounded-full border border-ink px-5 py-3 text-sm font-semibold"
        >
          Открыть конструктор <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="mt-10 space-y-12">
        {selection.groups.map((group) => (
          <div key={group.kind}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-card text-accent">
                <span className="size-10 [&_svg]:size-10">
                  <CategoryGlyph kind={group.kind} />
                </span>
              </span>
              <div>
                <h3 className="text-lg font-semibold">{group.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {group.hint}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4">
              {group.items.map((item) => (
                <div key={item.id}>
                  <ProductCard product={item} />
                  {item.type === "Диски" && (
                    <p className="px-3 text-xs leading-relaxed text-muted">
                      Диаметр {item.attrs.diameter} мм · {item.attrs.pack} шт.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
