import { useMemo } from 'react';
import { getPrediction } from '../utils/getPrediction';

export const usePrediction = (match, teams) => {
  const prediction = useMemo(() => {
    if (!match || !teams) return null;

    const homeTeam = teams.find(t => t.id === match.homeTeam);
    const awayTeam = teams.find(t => t.id === match.awayTeam);

    return getPrediction(homeTeam, awayTeam);
  }, [match, teams]);

  return prediction;
};
