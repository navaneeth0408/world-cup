import { useMemo } from 'react';
import { useTournament } from './useTournament';
import predictionPercentagesData from '../data/prediction_percentages.json';

export const useSimulationData = () => {
  const { teams, loading } = useTournament();

  const simulationData = useMemo(() => {
    if (loading || !teams || teams.length === 0) {
      return { teams: [], totalSims: 100 };
    }

    const totalSims = predictionPercentagesData.totalSimulations || 100;
    const mappedTeams = teams.map(t => {
      const prog = predictionPercentagesData.progression?.[t.name] || {
        roundOf32: 0,
        roundOf16: 0,
        quarterFinal: 0,
        semiFinal: 0,
        final: 0,
        champion: 0
      };

      const stageReached = {
        group: 100,
        r32: prog.roundOf32,
        r16: prog.roundOf16,
        qf: prog.quarterFinal,
        sf: prog.semiFinal,
        final: prog.final,
        champion: prog.champion
      };

      const stageExits = {
        group: 100 - stageReached.r32,
        r32: stageReached.r32 - stageReached.r16,
        r16: stageReached.r16 - stageReached.qf,
        qf: stageReached.qf - stageReached.sf,
        sf: stageReached.sf - stageReached.final,
        final: stageReached.final - stageReached.champion,
        champion: stageReached.champion
      };

      return {
        name: t.name,
        code: t.code,
        countryCode: t.countryCode,
        confederation: t.confederation || 'UEFA',
        stageExits,
        stageReached,
        totalSims
      };
    });

    return {
      teams: mappedTeams,
      totalSims
    };
  }, [teams, loading]);

  return { data: simulationData, loading };
};
