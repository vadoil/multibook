export function QuantityControl({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="constructor-qty" role="group" aria-label={`Количество: ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Меньше: ${label}`}>−</button>
      <output aria-label={`Количество: ${label}`} aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Больше: ${label}`}>+</button>
    </div>
  );
}
