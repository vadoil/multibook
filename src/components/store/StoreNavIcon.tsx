export type StoreNavKind = "shop" | "constructor" | "binding" | "account" | "contacts";

/** Small interface icons share the notebook's discs and cut-page geometry. */
export function StoreNavIcon({ kind }: { kind: StoreNavKind }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === "shop" && <><path d="M6 3.5h13v17H6zM9.5 3.5v17M3.5 7h5M3.5 12h5M3.5 17h5M12.5 8h3.5M12.5 11h2" /></>}
      {kind === "constructor" && <><path d="M4 5.5h7v7H4zM13.5 13.5h7v7h-7zM4 16.5h7M7.5 13v7M17 3.5v7M13.5 7h7" /></>}
      {kind === "binding" && <><circle cx="9" cy="9" r="5.5" /><circle cx="9" cy="9" r="2" /><circle cx="15.5" cy="15.5" r="5.5" /><circle cx="15.5" cy="15.5" r="2" /></>}
      {kind === "account" && <><circle cx="12" cy="7.5" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>}
      {kind === "contacts" && <><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>}
    </svg>
  );
}
