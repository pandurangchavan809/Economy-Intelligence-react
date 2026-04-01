import { useEffect, useMemo, useState } from "react";

import { apiGet, peekApiCache } from "../api";
import MetricCard from "../components/MetricCard";
import SectionHeading from "../components/SectionHeading";
import { useLiveMetric } from "../hooks/useLiveMetric";
import { formatCompactUsd, formatLiveGdp, formatNumber, formatPercent, formatTrillions } from "../utils/formatters";

function getInitialContinentCode() {
  const cached = peekApiCache("/continents") || [];
  return cached[0]?.code || "";
}

export default function ContinentsPage() {
  const [continents, setContinents] = useState(() => peekApiCache("/continents") || []);
  const [selectedCode, setSelectedCode] = useState(() => getInitialContinentCode());
  const [world, setWorld] = useState(() => peekApiCache("/world"));
  const [detail, setDetail] = useState(() => {
    const code = getInitialContinentCode();
    return code ? peekApiCache(`/continents/${code}`) : null;
  });
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/continents")
      .then((data) => {
        setContinents(data);
        if (!selectedCode && data[0]) {
          setSelectedCode(data[0].code);
        }
      })
      .catch((err) => setError(err.message));
  }, [selectedCode]);

  useEffect(() => {
    apiGet("/world")
      .then(setWorld)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCode) return;
    apiGet(`/continents/${selectedCode}`)
      .then(setDetail)
      .catch((err) => setError(err.message));
  }, [selectedCode]);

  const selectedContinent = useMemo(
    () => continents.find((continent) => continent.code === selectedCode),
    [continents, selectedCode]
  );

  const liveGdp = useLiveMetric(selectedContinent?.liveConfig?.gdp, "nominal");
  const livePopulation = useLiveMetric(selectedContinent?.liveConfig?.population, "population");
  const liveWorldGdp = useLiveMetric(world?.live?.gdp, "nominal");
  const shareOfWorld = liveGdp && liveWorldGdp ? (liveGdp / liveWorldGdp) * 100 : selectedContinent?.shareOfWorld;

  return (
    <div className="space-y-8 pb-10">
      <SectionHeading
        eyebrow="Continent Intelligence"
        title="Regional live macro view"
        text="Use the continent picker to view live GDP, population, trade, and top contributing countries."
      />

      {error ? <div className="panel text-rose-600">{error}</div> : null}

      <div className="panel">
        <label className="label">Select continent</label>
        <select
          className="input max-w-sm"
          value={selectedCode}
          onChange={(event) => setSelectedCode(event.target.value)}
        >
          {continents.map((continent) => (
            <option key={continent.code} value={continent.code}>
              {continent.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Live GDP"
          value={liveGdp ? formatLiveGdp(liveGdp) : "Loading..."}
          hint={selectedContinent ? selectedContinent.name : "Select a continent"}
          valueClassName="text-[clamp(1.1rem,1.55vw,1.95rem)] leading-[1.05] tracking-tight"
        />
        <MetricCard
          label="Population"
          value={livePopulation ? formatNumber(livePopulation) : "Loading..."}
          hint="Live estimate"
          valueClassName="text-[clamp(1rem,1.45vw,1.8rem)] leading-[1.05] tracking-tight"
        />
        <MetricCard
          label="Share of World"
          value={selectedContinent ? formatPercent(shareOfWorld) : "Loading..."}
          hint="Computed from current live GDP values"
        />
        <MetricCard
          label="GDP Per Capita"
          value={
            selectedContinent?.gdpPerCapitaUsd
              ? `$${selectedContinent.gdpPerCapitaUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
              : "Loading..."
          }
          hint="Latest stored value"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="panel overflow-hidden">
          <SectionHeading
            eyebrow="Overview"
            title="All continents"
            text="A compact comparison table with the latest live values."
          />
          <div className="overflow-x-auto">
            <table className="data-table min-w-full">
              <thead>
                <tr>
                  <th>Continent</th>
                  <th>Live GDP</th>
                  <th>Population</th>
                  <th>Real Growth</th>
                  <th>Inflation</th>
                </tr>
              </thead>
              <tbody>
                {continents.map((continent) => (
                  <tr key={continent.code}>
                    <td>{continent.name}</td>
                    <td>{formatCompactUsd(continent.liveGdpUsd)}</td>
                    <td>{formatNumber(continent.livePopulation)}</td>
                    <td>{formatPercent(continent.realGrowth)}</td>
                    <td>{formatPercent(continent.inflation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <SectionHeading
            eyebrow="Detail"
            title={selectedContinent?.name || "Selected continent"}
            text="Leading economies and trade signals for the selected region."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label="Exports"
              value={formatTrillions(selectedContinent?.trade?.exportsUsd)}
            />
            <MetricCard
              label="Imports"
              value={formatTrillions(selectedContinent?.trade?.importsUsd)}
            />
            <MetricCard
              label="Trade Balance"
              value={formatTrillions(selectedContinent?.trade?.tradeBalanceUsd)}
            />
            <MetricCard
              label="Population Growth"
              value={formatPercent(selectedContinent?.populationGrowth)}
            />
          </div>

          <div className="mt-6 space-y-3">
            {(detail?.topCountries || []).map((country) => (
              <div
                key={`${country.country}-${country.year}`}
                className="flex items-center justify-between rounded-[1.5rem] bg-mist px-4 py-4"
              >
                <div>
                  <p className="font-medium text-ink">{country.country}</p>
                  <p className="text-sm text-ink/60">Year {country.year || "Latest"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">
                    {formatCompactUsd(country.liveGdpUsd ?? country.gdpUsd)}
                  </p>
                  <p className="text-sm text-ink/60">
                    {country.shareOfContinent !== null && country.shareOfContinent !== undefined
                      ? formatPercent(country.shareOfContinent)
                      : "Share n/a"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
