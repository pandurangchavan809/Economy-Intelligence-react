import { useEffect, useMemo, useState } from "react";

import { apiGet, apiPost } from "../api";
import MetricCard from "../components/MetricCard";
import SectionHeading from "../components/SectionHeading";
import { formatBillions, formatPercent, formatTableValue } from "../utils/formatters";

const DEFAULT_COUNTRY = "Japan";

function buildLinePath(values, width, height, padding) {
  if (!values.length) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;

  return values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
      const y = height - padding - ((value - min) / spread) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function InsightChart({ title, subtitle, items, field, color, type = "line", suffix = "" }) {
  const width = 360;
  const height = 190;
  const padding = 20;
  const values = items.map((item) => Number(item[field] || 0));
  const linePath = buildLinePath(values, width, height, padding);
  const max = Math.max(...values, 1);

  return (
    <div className="panel">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-ink/45">{title}</p>
          <p className="mt-2 text-sm text-ink/60">{subtitle}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-night px-3 py-1 text-xs font-semibold text-ink/70">
          {items[items.length - 1]?.year || "Latest"}
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full">
        <defs>
          <linearGradient id={`fill-${field}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="rgba(255,255,255,0.12)" />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" />

        {type === "bar"
          ? values.map((value, index) => {
              const barWidth = (width - padding * 2) / Math.max(values.length, 1) - 8;
              const x = padding + index * ((width - padding * 2) / Math.max(values.length, 1)) + 4;
              const barHeight = ((height - padding * 2) * value) / max;
              const y = height - padding - barHeight;

              return (
                <rect
                  key={`${field}-${index}`}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="8"
                  fill={color}
                  fillOpacity="0.85"
                />
              );
            })
          : (
            <>
              <path
                d={`${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
                fill={`url(#fill-${field})`}
              />
              <path d={linePath} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
              {values.map((value, index) => {
                const min = Math.min(...values);
                const spread = Math.max(...values) - min || 1;
                const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
                const y = height - padding - ((value - min) / spread) * (height - padding * 2);

                return <circle key={`${field}-${index}`} cx={x} cy={y} r="4" fill={color} />;
              })}
            </>
          )}
      </svg>

      <div className="mt-4 flex items-center justify-between text-xs text-ink/45">
        <span>{items[0]?.year || "Start"}</span>
        <span className="tabular-nums">
          {formatTableValue(items[items.length - 1]?.[field])}
          {suffix}
        </span>
      </div>
    </div>
  );
}

export default function GeminiPage() {
  const [draftCountry, setDraftCountry] = useState(DEFAULT_COUNTRY);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [intel, setIntel] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    loadIntelligence(DEFAULT_COUNTRY);
  }, []);

  async function loadIntelligence(nextCountry) {
    try {
      setLoading(true);
      setError("");
      const data = await apiGet(`/gemini/intelligence?country=${encodeURIComponent(nextCountry)}`);
      setIntel(data);
      setCountry(nextCountry);
      setMessages([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCountrySubmit(event) {
    event.preventDefault();
    if (!draftCountry.trim()) return;
    await loadIntelligence(draftCountry.trim());
  }

  async function handleQuestionSubmit(event) {
    event.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: "user", content: question.trim() };
    setMessages((current) => [...current, userMessage]);

    try {
      setChatLoading(true);
      const response = await apiPost("/gemini/consultant", {
        country,
        question: question.trim()
      });

      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.answer }
      ]);
      setQuestion("");
    } catch (err) {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: err.message }
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  const latest = useMemo(() => intel?.data?.[intel.data.length - 1], [intel]);

  return (
    <div className="space-y-8 pb-10">
      <SectionHeading
        eyebrow="Gemini Intelligence"
        title="AI economics lab"
        text="Generate a clean country history view, review trend charts, and ask focused economic questions."
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <form className="panel space-y-5" onSubmit={handleCountrySubmit}>
          <div>
            <label className="label">Country</label>
            <input
              className="input"
              value={draftCountry}
              onChange={(event) => setDraftCountry(event.target.value)}
              placeholder="Japan"
            />
          </div>
          <button className="button-primary" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update analysis"}
          </button>
          <div className="rounded-[1.5rem] border border-white/10 bg-night/80 p-4 text-sm text-ink/70">
            Engine: {intel?.model || "Gemini"} · Timeline: 2015 to 2025
          </div>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </form>

        <div className="panel bg-[linear-gradient(160deg,_rgba(255,90,179,0.14),_rgba(143,93,255,0.16),_rgba(97,211,255,0.12))]">
          <p className="text-sm uppercase tracking-[0.2em] text-ink/50">Market note</p>
          <p className="mt-4 font-display text-3xl text-ink">
            {intel?.summary || "Ask Gemini for a country history and summary."}
          </p>
          <p className="mt-5 text-sm leading-7 text-ink/65">
            One country, one summary, four charts, and one consultant thread.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Latest GDP"
          value={latest ? formatBillions(latest.gdp * 1e9) : "Loading..."}
          hint={`${country} nominal GDP in billions`}
        />
        <MetricCard
          label="Inflation"
          value={latest ? formatPercent(latest.inflation) : "Loading..."}
          hint="Latest generated estimate"
        />
        <MetricCard
          label="Unemployment"
          value={latest ? formatPercent(latest.unemp) : "Loading..."}
          hint="Latest generated estimate"
        />
        <MetricCard
          label="FDI"
          value={latest ? formatPercent(latest.fdi) : "Loading..."}
          hint="FDI as percent of GDP"
        />
      </div>

      {intel?.data?.length ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <InsightChart
            title="GDP trend"
            subtitle="Nominal USD billions"
            items={intel.data}
            field="gdp"
            color="#61d3ff"
          />
          <InsightChart
            title="Unemployment"
            subtitle="Percent of labor force"
            items={intel.data}
            field="unemp"
            color="#ff5ab3"
          />
          <InsightChart
            title="Inflation"
            subtitle="Consumer price growth"
            items={intel.data}
            field="inflation"
            color="#8f5dff"
            type="bar"
            suffix="%"
          />
          <InsightChart
            title="FDI"
            subtitle="Foreign direct investment as percent of GDP"
            items={intel.data}
            field="fdi"
            color="#61d3ff"
            type="bar"
            suffix="%"
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="panel overflow-x-auto">
          <SectionHeading
            eyebrow="History"
            title={`${country} yearly values`}
            text="A small table version of the generated timeline."
          />
          <table className="data-table min-w-full">
            <thead>
              <tr>
                <th>Year</th>
                <th>GDP (B)</th>
                <th>Inflation</th>
                <th>Unemployment</th>
                <th>FDI</th>
              </tr>
            </thead>
            <tbody>
              {(intel?.data || []).map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{row.gdp.toFixed(1)}</td>
                  <td>{formatPercent(row.inflation)}</td>
                  <td>{formatPercent(row.unemp)}</td>
                  <td>{formatPercent(row.fdi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <SectionHeading
            eyebrow="Consultant"
            title="AI economic consultant"
            text="Ask about fiscal policy, market risk, or macro direction for the selected country."
          />

          <div className="mb-5 max-h-[20rem] space-y-3 overflow-y-auto pr-2">
            {messages.length ? (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-[1.5rem] px-4 py-4 text-sm leading-7 ${
                    message.role === "user"
                      ? "ml-10 border border-spruce/20 bg-spruce/10 text-ink"
                      : "mr-10 border border-white/10 bg-night/80 text-ink/80"
                  }`}
                >
                  {message.content}
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-night/80 px-4 py-4 text-sm text-ink/65">
                Ask a country question to start the consultant thread.
              </div>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleQuestionSubmit}>
            <textarea
              className="input min-h-36 resize-none"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={`Ask about ${country}'s fiscal policy, inflation, or external position...`}
            />
            <button className="button-primary" type="submit" disabled={chatLoading}>
              {chatLoading ? "Thinking..." : "Ask Gemini"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
