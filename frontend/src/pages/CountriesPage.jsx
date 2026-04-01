import { useEffect, useMemo, useState } from "react";

import { apiGet, apiPost, peekApiCache } from "../api";
import MetricCard from "../components/MetricCard";
import SectionHeading from "../components/SectionHeading";
import { useLiveMetric } from "../hooks/useLiveMetric";
import { formatBillions, formatNumber, formatPercent, formatTrillions, formatUsd } from "../utils/formatters";

function getInitialCountryId() {
  const cached = peekApiCache("/countries") || [];
  const india = cached.find((country) => country.iso3 === "IND");
  return String(india?.countryId || cached[0]?.countryId || "");
}

export default function CountriesPage() {
  const [countries, setCountries] = useState(() => peekApiCache("/countries") || []);
  const [selectedId, setSelectedId] = useState(() => getInitialCountryId());
  const [detail, setDetail] = useState(() => {
    const initialId = getInitialCountryId();
    return initialId ? peekApiCache(`/countries/${initialId}`) : null;
  });
  const [search, setSearch] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/countries")
      .then((data) => {
        setCountries(data);
        const india = data.find((country) => country.iso3 === "IND");
        if (!selectedId) {
          setSelectedId(String(india?.countryId || data[0]?.countryId || ""));
        }
      })
      .catch((err) => setError(err.message));
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    apiGet(`/countries/${selectedId}`)
      .then((data) => {
        setDetail(data);
        setAnswer("");
      })
      .catch((err) => setError(err.message));
  }, [selectedId]);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter((country) => {
      const label = `${country.name} ${country.iso3 || ""}`.toLowerCase();
      return label.includes(query);
    });
  }, [countries, search]);

  const liveGdp = useLiveMetric(detail?.live?.gdp, "nominal");
  const livePopulation = useLiveMetric(detail?.live?.population, "population");

  async function handleAskAssistant(event) {
    event.preventDefault();
    if (!selectedId || !question.trim()) return;

    try {
      setLoadingAnswer(true);
      const data = await apiPost("/assistant/chat", {
        countryId: Number(selectedId),
        question
      });
      setAnswer(data.answer);
    } catch (err) {
      setAnswer(err.message);
    } finally {
      setLoadingAnswer(false);
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <SectionHeading
        eyebrow="Country Intelligence"
        title="Live country intelligence with AI analyst"
        text="Search a country, review its live macro metrics, and ask a focused policy or market question."
      />

      {error ? <div className="panel text-rose-600">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[0.7fr,1.3fr]">
        <div className="panel">
          <label className="label">Search country</label>
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Type India, Japan, Brazil..."
          />

          <label className="label mt-5">Select country</label>
          <select
            className="input"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {filteredCountries.map((country) => (
              <option key={country.countryId} value={country.countryId}>
                {country.name} {country.iso3 ? `(${country.iso3})` : ""}
              </option>
            ))}
          </select>

          {detail?.country ? (
            <div className="mt-6 rounded-[1.75rem] bg-mist p-5">
              <div className="flex items-center gap-4">
                {detail.country.flagUrl ? (
                  <img
                    src={detail.country.flagUrl}
                    alt={detail.country.name}
                    className="h-12 w-16 rounded-xl object-cover"
                  />
                ) : null}
                <div>
                  <p className="font-display text-2xl">{detail.country.name}</p>
                  <p className="text-sm text-ink/65">
                    {detail.country.capital || "Capital n/a"} | {detail.country.continent || "Continent n/a"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            label="Live GDP"
            value={liveGdp ? formatTrillions(liveGdp, 6) : "Loading..."}
            hint="Current USD"
            valueClassName="text-[clamp(1.45rem,2.25vw,2.6rem)]"
          />
          <MetricCard
            label="Population"
            value={livePopulation ? formatNumber(livePopulation) : "Loading..."}
            hint="Live estimate"
            valueClassName="text-[clamp(1.45rem,2.2vw,2.5rem)]"
          />
          <MetricCard
            label="GDP Per Capita"
            value={
              detail?.metrics?.gdpPerCapitaUsd ? formatUsd(detail.metrics.gdpPerCapitaUsd, 0) : "Loading..."
            }
            hint="Derived from live values"
          />
          <MetricCard
            label="Exchange Rate"
            value={
              detail?.metrics?.exchangeRate?.rate
                ? `${detail.metrics.exchangeRate.rate.toFixed(2)} ${detail.metrics.exchangeRate.code}`
                : "Not available"
            }
            hint="1 USD in local currency"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="panel">
          <SectionHeading
            eyebrow="Country Metrics"
            title="Economic profile"
            text="Growth, inflation, debt, trade, and relative share metrics for the selected economy."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Real Growth" value={formatPercent(detail?.metrics?.realGrowth)} />
            <MetricCard label="Inflation" value={formatPercent(detail?.metrics?.inflation)} />
            <MetricCard label="Nominal Growth" value={formatPercent(detail?.metrics?.nominalGrowth)} />
            <MetricCard label="Unemployment" value={formatPercent(detail?.metrics?.unemployment)} />
            <MetricCard label="Debt To GDP" value={formatPercent(detail?.metrics?.debtToGdp)} />
            <MetricCard label="Share Of World" value={formatPercent(detail?.metrics?.shareOfWorld)} />
            <MetricCard label="Share Of Continent" value={formatPercent(detail?.metrics?.shareOfContinent)} />
            <MetricCard label="Exports" value={formatTrillions(detail?.metrics?.trade?.exportsUsd)} />
            <MetricCard label="Imports" value={formatTrillions(detail?.metrics?.trade?.importsUsd)} />
            <MetricCard
              label="Trade Balance"
              value={formatTrillions(detail?.metrics?.trade?.tradeBalanceUsd)}
            />
            <MetricCard
              label="Military Spending"
              value={formatBillions(detail?.metrics?.militarySpendingUsd)}
            />
            <MetricCard label="Base GDP" value={formatTrillions(detail?.live?.gdp?.baseValue)} />
          </div>
        </div>

        <div className="panel">
          <SectionHeading
            eyebrow="AI Analyst"
            title="Ask about the selected country"
            text="The answer is grounded with the stored indicators for the selected economy."
          />
          <form className="space-y-4" onSubmit={handleAskAssistant}>
            <textarea
              className="input min-h-36 resize-none"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: What is the biggest macro risk for this country right now?"
            />
            <button className="button-primary" type="submit" disabled={loadingAnswer}>
              {loadingAnswer ? "Thinking..." : "Ask analyst"}
            </button>
          </form>

          <div className="mt-6 rounded-[1.75rem] bg-mist p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-ink/50">Answer</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink/75">
              {answer || "Your answer will appear here after you ask a question."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
