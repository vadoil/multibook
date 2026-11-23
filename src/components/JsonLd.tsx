/** Структурированные данные schema.org для поисковиков. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON внутри <script>: экранируем «<», чтобы текст товара не закрыл тег.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
