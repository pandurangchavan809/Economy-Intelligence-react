export default function MetricCard({ label, value, hint, valueClassName = "", className = "" }) {
  return (
    <div className={`min-w-0 rounded-[2rem] border border-white/10 bg-mist/90 p-5 shadow-card backdrop-blur ${className}`}>
      <p className="text-sm uppercase tracking-[0.2em] text-ink/50">{label}</p>
      <p
        className={`mt-3 min-w-0 font-body text-[clamp(1.55rem,2.6vw,2.85rem)] font-semibold leading-tight tabular-nums text-ink [overflow-wrap:anywhere] ${valueClassName}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm text-ink/65">{hint}</p> : null}
    </div>
  );
}
