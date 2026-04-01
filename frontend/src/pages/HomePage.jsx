import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { apiGet, peekApiCache } from "../api";
import MetricCard from "../components/MetricCard";
import SectionHeading from "../components/SectionHeading";
import { useLiveMetric } from "../hooks/useLiveMetric";
import { formatCompactUsd, formatLiveGdp, formatNumber, formatPercent } from "../utils/formatters";

export default function HomePage() {
  const [world, setWorld] = useState(() => peekApiCache("/world"));
  const [continents, setContinents] = useState(() => peekApiCache("/continents") || []);

  useEffect(() => {
    apiGet("/world").then(setWorld).catch(() => {});
    apiGet("/continents").then(setContinents).catch(() => {});
  }, []);

  const liveWorldGdp = useLiveMetric(world?.live?.gdp, "nominal");
  const liveWorldPopulation = useLiveMetric(world?.live?.population, "population");

  return (
    <div className="space-y-12 pb-10">
      <section className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
        <div className="pt-8">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-brass">
            Global Macro Intelligence
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-ink md:text-6xl">
            Track 192+ economies with live macro dashboards and a dedicated Gemini research lab.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink/70">
            The platform brings together World Bank, IMF, and CountryLayer coverage with your
            verified database pipeline for world, continent, country, and AI-driven analysis.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/world" className="button-primary">
              Explore dashboard
            </Link>
            <Link to="/gemini" className="button-secondary">
              Open Gemini lab
            </Link>
            <Link to="/admin" className="button-secondary">
              Open admin
            </Link>
          </div>
        </div>

        <div className="panel bg-[linear-gradient(160deg,_rgba(255,90,179,0.16),_rgba(143,93,255,0.18),_rgba(97,211,255,0.16))]">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/60">Coverage</p>
          <p className="mt-4 font-display text-3xl text-ink">
            192+ country profiles and macroeconomic views sourced from World Bank, IMF, and CountryLayer.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-ink/60">Core modules</p>
              <p className="mt-2 text-lg text-ink">World, continent, country, Gemini, and admin</p>
            </div>
            <div>
              <p className="text-sm text-ink/60">Data style</p>
              <p className="mt-2 text-lg text-ink">Live counters, trade metrics, shares, and research notes</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Platform Snapshot"
          title="Live economic picture"
          text="The landing page keeps the main world signal visible while the deeper country, continent, and Gemini research tools stay one click away."
        />
        <div className="grid gap-5 md:grid-cols-3">
          <MetricCard
            label="World GDP"
            value={liveWorldGdp ? formatLiveGdp(liveWorldGdp) : "Loading..."}
            hint={world ? `Base year ${world.stats?.baseGdpYear}` : "Waiting for API"}
            valueClassName="text-[clamp(1rem,1.45vw,1.75rem)] leading-[1.05] tracking-tight"
          />
          <MetricCard
            label="World Population"
            value={liveWorldPopulation ? formatNumber(liveWorldPopulation) : "Loading..."}
            hint="Live population math from stored baselines"
            valueClassName="text-[clamp(0.98rem,1.35vw,1.6rem)] leading-[1.05] tracking-tight"
          />
          <MetricCard
            label="Nominal Growth"
            value={world ? formatPercent(world.stats?.nominalGrowth) : "Loading..."}
            hint="Real growth plus inflation"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="panel">
          <SectionHeading
            eyebrow="Modules"
            title="Core areas"
            text="Each section focuses on a clear economic workflow."
          />
          <div className="space-y-4 text-sm text-ink/70">
            <p>Gemini for AI-generated country history, charts, and consultant answers.</p>
            <p>World for live global counters, trade, and macro context.</p>
            <p>Continents for regional comparison and top contributors.</p>
            <p>Countries for live country intelligence and policy insight.</p>
            <p>Admin for secure table preview and SQL control.</p>
          </div>
        </div>

        <div className="panel">
          <SectionHeading
            eyebrow="Coverage"
            title="Continent snapshot"
            text="Regional GDP, population, and global share at a glance."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {continents.slice(0, 4).map((continent) => (
              <div key={continent.code} className="rounded-[1.5rem] border border-white/10 bg-night/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl text-ink">{continent.name}</p>
                    <p className="mt-1 text-sm text-ink/60">
                      Share of world: {formatPercent(continent.shareOfWorld)}
                    </p>
                  </div>
                  <span className="rounded-full bg-spruce/10 px-3 py-1 text-xs font-semibold text-spruce">
                    {continent.code}
                  </span>
                </div>
                <p className="mt-4 text-xl font-semibold tabular-nums text-ink">
                  {formatCompactUsd(continent.liveGdpUsd)}
                </p>
                <p className="mt-1 text-sm text-ink/60">
                  Population {formatNumber(continent.livePopulation)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
