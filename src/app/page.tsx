import Link from "next/link";
import { HeroNotebook } from "@/components/HeroNotebook";
import { ProductCard } from "@/components/ProductCard";
import { countByType, listProducts, TYPE_LABELS } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", title: "Возьмите лист у корешка", text: "Потяните на себя сверху вниз — лист снимается с дисков без усилия." },
  { n: "02", title: "Переставьте куда нужно", text: "Совместите прорези с дисками и слегка надавите. Запись встала на новое место." },
  { n: "03", title: "Добавляйте и меняйте", text: "Новые блоки, разделители, другая обложка — блокнот растёт вместе с задачами." },
];

export default function Home() {
  const counts = countByType();
  const notebooks = listProducts({ type: "Тетради" }).slice(0, 4);

  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Модульные блокноты на дисках</p>
          <h1 className="mt-4 font-display text-[clamp(40px,7vw,84px)] font-bold leading-[0.98] tracking-tight">
            Записал не туда?
            <br />
            <span className="text-accent">Переставь.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink/75">
            Листы Multibook снимаются и встают на место в любом порядке. Меняйте блоки, обложки и диски — или соберите свой блокнот с нуля.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            <Link href="/catalog?type=Тетради" className="group rounded-[var(--radius-card)] bg-ink p-5 text-white transition hover:-translate-y-0.5">
              <span className="block text-sm opacity-70">Готовый блокнот</span>
              <span className="mt-1 block text-lg font-semibold">Выбрать в каталоге →</span>
            </Link>
            <Link href="/constructor" className="group rounded-[var(--radius-card)] border-2 border-ink p-5 transition hover:-translate-y-0.5">
              <span className="block text-sm text-muted">Свой из частей</span>
              <span className="mt-1 block text-lg font-semibold">Собрать в конструкторе →</span>
            </Link>
          </div>
        </div>
        <div className="relative">
          <div aria-hidden className="absolute inset-[8%] -z-10 rounded-full bg-[radial-gradient(circle,#efe3cf,transparent_70%)]" />
          <HeroNotebook />
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Как работает дисковый переплёт</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-[var(--radius-card)] bg-white/5 p-6">
                <span className="font-display text-4xl text-accent">{s.n}</span>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-white/70">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold">Что внутри магазина</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {TYPE_LABELS.filter((t) => counts[t.type]).map((t) => (
            <Link
              key={t.type}
              href={`/catalog?type=${encodeURIComponent(t.type)}`}
              className="rounded-[var(--radius-card)] border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-ink"
            >
              <span className="block text-lg font-semibold">{t.label}</span>
              <span className="mt-1 block text-sm text-muted">{t.hint}</span>
              <span className="mt-4 block text-sm">{counts[t.type]} шт →</span>
            </Link>
          ))}
        </div>
      </section>

      {notebooks.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-bold">Готовые тетради</h2>
            <Link href="/catalog?type=Тетради" className="text-sm underline underline-offset-4">
              Все тетради
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {notebooks.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
