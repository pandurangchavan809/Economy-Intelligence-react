const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;

export function getLiveNominalValue(config) {
  if (!config?.baseValue || !config?.startYear) return null;
  const start = new Date(Date.UTC(config.startYear, 0, 1));
  const elapsed = Math.max((Date.now() - start.getTime()) / 1000, 0);
  const growth = ((config.realGrowth || 0) + (config.inflation || 0)) / 100;
  return config.baseValue * (1 + (growth * elapsed) / SECONDS_IN_YEAR);
}

export function getLivePopulationValue(config) {
  if (!config?.baseValue || !config?.startYear) return null;
  const start = new Date(Date.UTC(config.startYear, 0, 1));
  const elapsed = Math.max((Date.now() - start.getTime()) / 1000, 0);
  const growth = (config.growthRate || 0) / 100;
  return config.baseValue * (1 + (growth * elapsed) / SECONDS_IN_YEAR);
}
