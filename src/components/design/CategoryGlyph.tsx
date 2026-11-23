export type CategoryKind =
  "notebooks" | "journals" | "covers" | "pages" | "discs" | "tools" | "albums";

/** Navigation pictograms share the same binding-slot motif; product images remain photographic. */
export function CategoryGlyph({ kind }: { kind: CategoryKind }) {
  return (
    <svg
      className={`mc-category-glyph mc-glyph-${kind}`}
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "notebooks" && (
        <>
          <path className="mc-glyph-back" d="M26 21h47v57H26" />
          <path
            className="mc-glyph-front"
            d="M22 16h47v57H22V16Zm11 0v57M41 34h18M41 42h13"
          />
          <path
            className="mc-glyph-accent"
            d="M17 27h10M17 39h10M17 51h10M17 63h10"
          />
        </>
      )}
      {kind === "journals" && (
        <>
          <path className="mc-glyph-back" d="m30 18 41 5-7 55-41-5 7-55Z" />
          <g className="mc-glyph-front">
            <path d="M24 18h43v57H24z" />
            <path d="M35 37h21M35 44h14M35 63h6" />
          </g>
          <path
            className="mc-glyph-accent"
            d="M18 29h11M18 41h11M18 53h11M18 65h11"
          />
        </>
      )}
      {kind === "covers" && (
        <>
          <path className="mc-glyph-back" d="m30 17 41 12-14 50-41-12 14-50Z" />
          <path className="mc-glyph-front" d="M31 16h40v59H31V16Zm8 0v59" />
          <path
            className="mc-glyph-accent"
            d="M26 27h10M26 39h10M26 51h10M26 63h10"
          />
        </>
      )}
      {kind === "pages" && (
        <>
          <path className="mc-glyph-back" d="M27 25h43v53H27M23 21h43v53H23" />
          <g className="mc-glyph-front">
            <path d="M19 17h43v53H19z" />
            <path d="M31 32h19M31 41h19M31 50h19M31 59h12" />
          </g>
          <path
            className="mc-glyph-accent"
            d="M15 28h8M15 40h8M15 52h8M15 64h8"
          />
        </>
      )}
      {kind === "discs" && (
        <>
          <g className="mc-glyph-back">
            <circle cx="36" cy="39" r="20" />
            <circle cx="36" cy="39" r="9" />
          </g>
          <g className="mc-glyph-front">
            <circle cx="61" cy="60" r="20" />
            <circle cx="61" cy="60" r="9" />
          </g>
          <path
            className="mc-glyph-accent"
            d="M22 32a15 15 0 0 1 15-8M51 49a15 15 0 0 1 13-3"
          />
        </>
      )}
      {kind === "tools" && (
        <>
          <g className="mc-glyph-front">
            <path d="m22 63 35-40 10 9-35 40-16 7 6-16Zm31-36 10 9M22 63l10 9" />
          </g>
          <path
            className="mc-glyph-back"
            d="M68 46v23a12 12 0 0 1-24 0V55a7 7 0 0 1 14 0v13a2 2 0 0 1-4 0V56"
          />
          <path className="mc-glyph-accent" d="m57 23 5-6 10 9-5 6M16 79l7-3" />
        </>
      )}
      {kind === "albums" && (
        <>
          <path className="mc-glyph-back" d="M24 21h51v56H24" />
          <g className="mc-glyph-front">
            <path d="M20 17h51v56H20zM32 30h28v29H32z" />
            <path d="m32 52 9-11 8 8 5-5 6 8" />
            <circle cx="53" cy="37" r="2.5" />
          </g>
          <path
            className="mc-glyph-accent"
            d="M15 27h10M15 39h10M15 51h10M15 63h10"
          />
        </>
      )}
    </svg>
  );
}
