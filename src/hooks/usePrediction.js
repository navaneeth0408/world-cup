import { useMemo } from 'react';
import { getPrediction } from '../utils/getPrediction';

export const usePrediction = (match, teams) => {
  const prediction = useMemo(() => {
    if (!match || !teams) return null;

    const homeTeam = teams.find(t => t.id === match.homeTeam);
    const awayTeam = teams.find(t => t.id === match.awayTeam);

    const isKnockout = match ? (match.stage !== 'Group Stage' || (match.match_id && match.match_id > 72) || (match.matchId && match.matchId > 72)) : false;

    return getPrediction(homeTeam, awayTeam, isKnockout);
  }, [match, teams]);

  return prediction;
};
