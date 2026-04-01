import { useEffect, useState } from "react";

import { apiGet, peekApiCache } from "../api";
import MetricCard from "../components/MetricCard";
import SectionHeading from "../components/SectionHeading";
import { useLiveMetric } from "../hooks/useLiveMetric";
import { formatCompactUsd, formatLiveGdp, formatNumber, formatPercent, formatTrillions, formatUsd } from "../utils/formatters";

export default function WorldPage() {
  const [world, setWorld] = useState(() => peekApiCache("/world"));
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/world")
      .then(setWorld)
      .catch((err) => setError(err.message));
  }, []);

  const liveGdp = useLiveMetric(world?.live?.gdp, "nominal");
  const livePopulation = useLiveMetric(world?.live?.population, "population");

  return (
    <div className="space-y-8 pb-10">
      <SectionHeading
        eyebrow="World Intelligence"
        title="Global economic pulse"
        text="Monitor live global GDP, population, growth, and trade in one unified view."
      />

      {error ? <div className="panel text-rose-600">{error}</div> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Live GDP"
          value={liveGdp ? formatLiveGdp(liveGdp) : "Loading..."}
          hint="Current USD, updated every second"
          valueClassName="text-[clamp(1rem,1.45vw,1.8rem)] leading-[1.05] tracking-tight"
        />
        <MetricCard
          label="Population"
          value={livePopulation ? formatNumber(livePopulation) : "Loading..."}
          hint="Live estimate from stored growth rate"
          valueClassName="text-[clamp(0.98rem,1.35vw,1.65rem)] leading-[1.05] tracking-tight"
        />
        <MetricCard
          label="GDP Per Capita"
          value={world?.stats?.gdpPerCapita ? formatUsd(world.stats.gdpPerCapita, 0) : "Loading..."}
          hint="Derived from live GDP and live population"
        />
        <MetricCard
          label="Nominal Growth"
          value={world ? formatPercent(world.stats?.nominalGrowth) : "Loading..."}
          hint="Real growth plus inflation"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="panel">
          <SectionHeading
            eyebrow="Macro Summary"
            title="Baseline and growth view"
            text="Current global baselines, growth, inflation, and trade context."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label="Real Growth"
              value={world ? formatPercent(world.stats?.realGrowth) : "Loading..."}
            />
            <MetricCard
              label="Inflation"
              value={world ? formatPercent(world.stats?.inflation) : "Loading..."}
            />
            <MetricCard
              label={`Base GDP ${world?.stats?.baseGdpYear || ""}`}
              value={world ? formatCompactUsd(world.live?.gdp?.baseValue) : "Loading..."}
              valueClassName="text-[clamp(1.05rem,1.5vw,1.9rem)] leading-[1.05] tracking-tight"
            />
            <MetricCard
              label={`Base Population ${world?.stats?.basePopulationYear || ""}`}
              value={world ? formatNumber(world.live?.population?.baseValue) : "Loading..."}
              valueClassName="text-[clamp(0.98rem,1.35vw,1.65rem)] leading-[1.05] tracking-tight"
            />
          </div>
        </div>

        <div className="panel">
          <SectionHeading
            eyebrow="Trade"
            title="Global trade balance"
            text="Trade reflects the latest available year in the dataset."
          />
          <div className="space-y-4">
            <div className="rounded-[1.5rem] bg-mist p-4">
              <p className="text-sm text-ink/60">Exports</p>
              <p className="mt-2 font-display text-3xl">{formatTrillions(world?.trade?.exportsUsd)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-mist p-4">
              <p className="text-sm text-ink/60">Imports</p>
              <p className="mt-2 font-display text-3xl">{formatTrillions(world?.trade?.importsUsd)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-mist p-4">
              <p className="text-sm text-ink/60">Balance</p>
              <p className="mt-2 font-display text-3xl">
                {formatTrillions(world?.trade?.tradeBalanceUsd)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
