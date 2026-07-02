import { useMemo } from 'react';
import { useTournament } from './useTournament';
import predictionPercentagesData from '../data/prediction_percentages.json';
import predictionPercentagesKnockoutData from '../data/prediction_percentages_knockout.json';

export const useSimulationData = () => {
  const { teams, loading } = useTournament();

  const mapData = (teamsList, percentagesData) => {
    if (!teamsList || teamsList.length === 0) {
      return { teams: [], totalSims: 100 };
    }
    
    const totalSims = percentagesData.totalSimulations || 100;
    const mappedTeams = teamsList.map(t => {
      const prog = percentagesData.progression?.[t.name] || {
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
        totalSims,
        champion: stageReached.champion,
        final: stageReached.final,
        sf: stageReached.sf,
        qf: stageReached.qf,
        r16: stageReached.r16,
        r32: stageReached.r32
      };
    });

    return {
      teams: mappedTeams,
      totalSims
    };
  };

  const entireData = useMemo(() => {
    if (loading || !teams || teams.length === 0) {
      return { teams: [], totalSims: 100 };
    }
    return mapData(teams, predictionPercentagesData);
  }, [teams, loading]);

  const knockoutData = useMemo(() => {
    if (loading || !teams || teams.length === 0) {
      return { teams: [], totalSims: 100 };
    }
    return mapData(teams, predictionPercentagesKnockoutData);
  }, [teams, loading]);

  return { entireData, knockoutData, loading };
};
