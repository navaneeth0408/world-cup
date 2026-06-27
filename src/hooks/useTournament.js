import { useState, useEffect, useMemo } from 'react';
import { teams as initialTeams, venues as initialVenues } from '../data/worldcup2026';
import { useTournamentStore } from '../store/tournamentStore';
import squadsData from '../data/current_squads.json';
import initialMatches from '../data/match_results.json';
import { getMergedMatches } from '../utils/schedule';
import { getTeamDataKey } from '../utils/simulationHelpers';
import fifaRankingData from '../data/fifa_ranking.json';
import squadStrengthData from '../data/squad_strength.json';
import continentalPerformanceData from '../data/continental_performance.json';
import wcHistoryData from '../data/wc_history.json';
import recentWcPerformanceData from '../data/recent_wc_performance.json';
import formScoreData from '../data/form_score.json';
import cohesionData from '../data/cohesion.json';
import adaptabilityData from '../data/adaptability_scores_final.json';

export const useTournament = () => {
  const [loading, setLoading] = useState(true);
  const { teams, matches, setTeams, setMatches } = useTournamentStore();

  useEffect(() => {
    // Initial load
    if (teams.length === 0) {
      const mergedTeams = initialTeams.map(t => {
        const customSquad = squadsData.find(s => s.id.replace(/_/g, '') === t.id.replace(/_/g, ''));
        
        const fifaKey = getTeamDataKey(t, fifaRankingData);
        const squadKey = getTeamDataKey(t, squadStrengthData);
        const continentalKey = getTeamDataKey(t, continentalPerformanceData);
        const historyKey = getTeamDataKey(t, wcHistoryData);
        const recentWcKey = getTeamDataKey(t, recentWcPerformanceData);
        const formKey = getTeamDataKey(t, formScoreData);
        const cohesionKey = getTeamDataKey(t, cohesionData);
        const adaptabilityKey = getTeamDataKey(t, adaptabilityData);

        return {
          ...t,
          squad: customSquad ? customSquad.squad : (t.squad || []),
          fifaRanking: fifaKey ? fifaRankingData[fifaKey].rank : t.fifaRanking,
          fifaScore: fifaKey ? Number((fifaRankingData[fifaKey].fifaScore || 0).toFixed(2)) : 50.00,
          marketValue: squadKey ? Number(squadStrengthData[squadKey].marketValue || 0) : 0,
          squadScore: squadKey ? Number((squadStrengthData[squadKey].squadScore || 0).toFixed(2)) : 50.00,
          continentalScore: continentalKey ? Number((continentalPerformanceData[continentalKey].continentalScore || 0).toFixed(2)) : 50.00,
          historyScore: historyKey ? Number((wcHistoryData[historyKey].historyScore || 0).toFixed(2)) : 50.00,
          worldCupRecentScore: recentWcKey ? Number((recentWcPerformanceData[recentWcKey].wcRecentScore || 0).toFixed(2)) : 50.00,
          formScore: formKey ? Number((formScoreData[formKey].formScore || 0).toFixed(2)) : 50.00,
          cohesionScore: cohesionKey ? Number((cohesionData[cohesionKey].cohesionScore || 0).toFixed(2)) : 50.00,
          adaptabilityScore: adaptabilityKey ? Number((adaptabilityData[adaptabilityKey].adaptability_score || 0).toFixed(2)) : 50.00,
        };
      });
      setTeams(mergedTeams);
      
      const mergedMatches = getMergedMatches(initialMatches, mergedTeams);
      setMatches(mergedMatches);
    }

    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [setTeams, setMatches, teams.length]);

  const groupStandings = useMemo(() => {
    const standings = {};

    // Initialize standings for each team
    teams.forEach(team => {
      if (!standings[team.group]) {
        standings[team.group] = [];
      }

      standings[team.group].push({
        ...team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0
      });
    });

    // Update standings from completed matches
    matches.filter(m => m.status === 'completed' && m.match_id <= 72).forEach(match => {
      const group = standings[match.group];
      if (!group) return;

      const homeTeam = group.find(t => t.id === match.homeTeam);
      const awayTeam = group.find(t => t.id === match.awayTeam);

      if (!homeTeam || !awayTeam) return;

      homeTeam.played += 1;
      awayTeam.played += 1;
      homeTeam.gf += match.homeScore;
      homeTeam.ga += match.awayScore;
      awayTeam.gf += match.awayScore;
      awayTeam.ga += match.homeScore;

      if (match.homeScore > match.awayScore) {
        homeTeam.won += 1;
        homeTeam.pts += 3;
        awayTeam.lost += 1;
      } else if (match.homeScore < match.awayScore) {
        awayTeam.won += 1;
        awayTeam.pts += 3;
        homeTeam.lost += 1;
      } else {
        homeTeam.drawn += 1;
        awayTeam.drawn += 1;
        homeTeam.pts += 1;
        awayTeam.pts += 1;
      }

      homeTeam.gd = homeTeam.gf - homeTeam.ga;
      awayTeam.gd = awayTeam.gf - awayTeam.ga;
    });

    // Sort standings: Pts > GD > GF > Head-to-head (simplified to just GD and GF)
    Object.keys(standings).forEach(groupKey => {
      standings[groupKey].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });
    });

    return standings;
  }, [teams, matches]);

  return { teams, matches, venues: initialVenues, groupStandings, loading };
};
