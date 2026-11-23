/** Каркас текстовых страниц (доставка, возврат, контакты, политика): заголовок, вводный абзац и разделы. */
export function InfoPage({ title, lead, children }: { title: string; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="info-page mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
      {lead && <p className="mt-4 text-lg text-muted">{lead}</p>}
      <div className="mt-10 grid gap-10">{children}</div>
    </article>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="mt-3 grid gap-3 leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-1">
        {children}
      </div>
    </section>
  );
}
