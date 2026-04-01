import { useEffect, useState } from "react";

import { getLiveNominalValue, getLivePopulationValue } from "../utils/live";

export function useLiveMetric(config, type) {
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (!config) {
      setValue(null);
      return;
    }

    const updateValue = () => {
      const nextValue =
        type === "population"
          ? getLivePopulationValue(config)
          : getLiveNominalValue(config);
      setValue(nextValue);
    };

    updateValue();
    const intervalId = window.setInterval(updateValue, 1000);
    return () => window.clearInterval(intervalId);
  }, [config, type]);

  return value;
}
