/** A typographic M with three binding slots: the shared signature of all concepts. */
export function BrandGlyph() {
  return (
    <svg
      className="mc-brand-symbol"
      viewBox="0 0 48 48"
      aria-hidden="true"
      fill="none"
    >
      <path
        className="mc-brand-letter"
        d="M15 36V13h5l7 13 7-13h5v23M20 36V23l7 12 7-12v13"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinejoin="round"
      />
      <g className="mc-brand-slots" strokeWidth="3" strokeLinecap="round">
        <path d="M6 15h9M6 24h9M6 33h9" />
      </g>
    </svg>
  );
}
