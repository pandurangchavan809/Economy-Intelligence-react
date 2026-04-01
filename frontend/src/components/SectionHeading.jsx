export default function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-brass">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 font-display text-4xl text-ink">{title}</h2>
      {text ? <p className="mt-3 max-w-3xl text-base text-ink/70">{text}</p> : null}
    </div>
  );
}
