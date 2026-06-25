import { create } from 'zustand';

const saveMatchesToServer = async (matches) => {
  try {
    const response = await fetch('/api/save-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(matches),
    });
    if (!response.ok) {
      console.error('Failed to save match results to server:', response.statusText);
    }
  } catch (error) {
    console.error('Error saving match results to server:', error);
  }
};

export const useTournamentStore = create((set) => ({
  teams: [],
  matches: [],
  groups: {},
  simulationResults: {
    groupMatches: [],
    roundOf32: [],
    roundOf16: [],
    quarterFinals: [],
    semiFinals: [],
    final: null,
    winner: null,
    thirdPlace: null,
  },
  selectedTeam: null,
  historicalSwaps: {},
  simulationMode: 'auto',
  isSimulating: false,
  userPredictions: JSON.parse(localStorage.getItem('wc2026_user_predictions') || '{}'),

  setTeams: (teams) => set({ teams }),
  setMatches: (matches) => set({ matches }),
  setGroups: (groups) => set({ groups }),
  setSimulationResults: (results) => set({ simulationResults: { ...results } }),
  setSelectedTeam: (team) => set({ selectedTeam: team }),
  setHistoricalSwaps: (swaps) => set({ historicalSwaps: swaps }),
  setSimulationMode: (mode) => set({ simulationMode: mode }),
  setIsSimulating: (isSimulating) => set({ isSimulating }),
  setUserPrediction: (matchId, homeScore, awayScore) => set((state) => {
    const updated = {
      ...state.userPredictions,
      [matchId]: { homeScore: parseInt(homeScore, 10), awayScore: parseInt(awayScore, 10) }
    };
    localStorage.setItem('wc2026_user_predictions', JSON.stringify(updated));
    return { userPredictions: updated };
  }),

  runSimulation: (results) => set((state) => ({
    simulationResults: { ...state.simulationResults, ...results }
  })),

  resetSimulation: () => set({
    simulationResults: {
      groupMatches: [],
      roundOf32: [],
      roundOf16: [],
      quarterFinals: [],
      semiFinals: [],
      final: null,
      winner: null,
      thirdPlace: null,
    },
    isSimulating: false
  }),

  updateMatchScore: (matchId, homeScore, awayScore, scorers, cards, playerOfMatch) => set((state) => {
    const updatedMatches = state.matches.map(m =>
      m.id === matchId
        ? { ...m, homeScore, awayScore, scorers, cards, playerOfMatch, status: 'completed' }
        : m
    );
    saveMatchesToServer(updatedMatches);
    return { matches: updatedMatches };
  }),

  // NEW: Update a single team's squad
  updateTeamSquad: (teamId, squad) => set((state) => ({
    teams: state.teams.map(t =>
      t.id === teamId ? { ...t, squad } : t
    )
  })),

  // NEW: Update a single team's strengths
  updateTeamStrengths: (teamId, strengths) => set((state) => ({
    teams: state.teams.map(t =>
      t.id === teamId ? { ...t, ...strengths } : t
    )
  })),

  // NEW: Bulk update multiple teams at once (from AI squad sync)
  syncSquads: (updatedTeams) => set((state) => ({
    teams: state.teams.map(t => {
      const updated = updatedTeams.find(u => u.id === t.id);
      if (updated && updated.squad && updated.squad.length > 0) {
        return { ...t, squad: updated.squad };
      }
      return t;
    })
  })),

  syncWithOnline: (results) => set((state) => {
    const updatedMatches = state.matches.map(match => {
      const update = results.find(r =>
        (r.id && r.id === match.id) ||
        (r.homeTeamKey && r.homeTeamKey === match.homeTeam && r.awayTeamKey === match.awayTeam)
      );
      if (update) {
        const merged = {
          ...match,
          homeScore: update.homeScore,
          awayScore: update.awayScore,
          status: update.status
        };
        if (update.scorers && update.scorers.length > 0) {
          merged.scorers = update.scorers;
        }
        if (update.cards && update.cards.length > 0) {
          merged.cards = update.cards;
        }
        return merged;
      }
      return match;
    });
    saveMatchesToServer(updatedMatches);
    return { matches: updatedMatches };
  }),
}));
