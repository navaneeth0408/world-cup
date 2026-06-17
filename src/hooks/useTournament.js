import { useState, useEffect, useMemo } from 'react';
import { teams as initialTeams, venues as initialVenues } from '../data/worldcup2026';
import { useTournamentStore } from '../store/tournamentStore';
import squadsData from '../data/current_squads.json';
import initialMatches from '../data/match_results.json';

export const useTournament = () => {
  const [loading, setLoading] = useState(true);
  const { teams, matches, setTeams, setMatches } = useTournamentStore();

  useEffect(() => {
    // Initial load
    if (teams.length === 0) {
      const mergedTeams = initialTeams.map(t => {
        const customSquad = squadsData.find(s => s.id.replace(/_/g, '') === t.id.replace(/_/g, ''));
        return {
          ...t,
          squad: customSquad ? customSquad.squad : (t.squad || [])
        };
      });
      setTeams(mergedTeams);
      setMatches(initialMatches);
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
    matches.filter(m => m.status === 'completed').forEach(match => {
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
