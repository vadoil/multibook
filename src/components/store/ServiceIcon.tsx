export type ServiceKind = "delivery" | "returns" | "contacts" | "privacy" | "corporate" | "info";

export function ServiceIcon({ kind = "info" }: { kind?: ServiceKind }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === "delivery" ? <><path d="M3 8h17v16H3zM20 14h5l4 5v5h-9M3 14h17" /><circle cx="9" cy="25" r="3" /><circle cx="24" cy="25" r="3" /></>
        : kind === "returns" ? <><path d="M8 10H21a9 9 0 1 1 0 18H12M13 4l-6 6 6 6" /></>
        : kind === "contacts" ? <><path d="m9 4 5 7-4 4a22 22 0 0 0 7 7l4-4 7 5c-3 7-7 7-14 2C5 19 2 9 9 4Z" /></>
        : kind === "privacy" ? <><path d="m16 3 11 5v8c0 7-11 13-11 13S5 23 5 16V8l11-5Z" /><path d="m10 16 4 4 8-9" /></>
        : kind === "corporate" ? <><circle cx="16" cy="9" r="4" /><path d="M8 28v-4a8 8 0 0 1 16 0v4M4 12a4 4 0 0 0 0 8M28 12a4 4 0 0 1 0 8M2 28v-2M30 28v-2" /></>
        : <><circle cx="16" cy="16" r="12" /><path d="M16 14v9M16 9h.01" /></>}
    </svg>
  );
}
