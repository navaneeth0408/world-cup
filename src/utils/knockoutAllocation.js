import roundOf32Matrix from "../data/round_of_32_wikipedia_format.json";

/**
 * Resolves the Round of 32 pairings based on the official FIFA 2026 allocation matrix.
 * 
 * @param {Function} w - Function to get the winner of a group (e.g., w('A'))
 * @param {Function} ru - Function to get the runner-up of a group (e.g., ru('B'))
 * @param {Array} bestThird - Array of exactly 8 qualified third-placed teams
 * @param {Function} getTeam - Function to safely wrap or resolve a team object with a fallback name
 * @param {boolean} includeIds - Whether to include match IDs ('m73' to 'm88') in the output objects
 * @returns {Array} List of 16 match pairing objects for the Round of 32
 */
export const getRoundOf32Pairings = (w, ru, bestThird, getTeam, includeIds = false) => {
  if (!bestThird || bestThird.length !== 8) {
    throw new Error("Invalid FIFA Round of 32 allocation: Exactly 8 third-placed teams are required.");
  }

  // Generate combination key exactly matching the JSON format (e.g. "A B C D E F G H")
  const combinationKey = bestThird
    .map(t => t.group)
    .sort()
    .join(" ");

  const allocationRow = roundOf32Matrix.find(
    row => row["Third-placed teams advancing from groups"] === combinationKey
  );

  if (!allocationRow) {
    throw new Error(`No FIFA Round of 32 allocation found for combination: ${combinationKey}`);
  }

  // Create a fast lookup for 3rd placed teams by their pseudo-code (e.g., '3A' -> team)
  const thirdPlaceMap = {};
  bestThird.forEach(t => {
    thirdPlaceMap[`3${t.group}`] = t;
  });

  const getThirdTeam = (code) => {
    return getTeam(thirdPlaceMap[code], `${code} 3rd`);
  };

  const pairings = [
    // --- Left hand side ---
    // Match 73
    { match_id: 73, t1: getTeam(ru('A'), 'A runner-up'), t2: getTeam(ru('B'), 'B runner-up') },
    // Match 75
    { match_id: 75, t1: getTeam(w('F'), 'Group F winner'), t2: getTeam(ru('C'), 'C runner-up') },
    // Match 82
    { match_id: 82, t1: getTeam(w('E'), 'Group E winner'), t2: getThirdTeam(allocationRow["1E vs"]) },
    // Match 81
    { match_id: 81, t1: getTeam(w('I'), 'Group I winner'), t2: getThirdTeam(allocationRow["1I vs"]) },
    // Match 77
    { match_id: 77, t1: getTeam(w('G'), 'Group G winner'), t2: getThirdTeam(allocationRow["1G vs"]) },
    // Match 74
    { match_id: 74, t1: getTeam(w('D'), 'Group D winner'), t2: getThirdTeam(allocationRow["1D vs"]) },
    // Match 80
    { match_id: 80, t1: getTeam(w('H'), 'Group H winner'), t2: getTeam(ru('J'), 'J runner-up') },
    // Match 79
    { match_id: 79, t1: getTeam(ru('K'), 'K runner-up'), t2: getTeam(ru('L'), 'L runner-up') },

    // --- Right hand side ---
    // Match 76    
    { match_id: 76, t1: getTeam(w('C'), 'Group C winner'), t2: getTeam(ru('F'), 'F runner-up') },
    // Match 78
    { match_id: 78, t1: getTeam(ru('E'), 'E runner-up'), t2: getTeam(ru('I'), 'I runner-up') },
    // Match 84
    { match_id: 84, t1: getTeam(w('L'), 'Group L winner'), t2: getThirdTeam(allocationRow["1L vs"]) },
    // Match 83
    { match_id: 83, t1: getTeam(w('A'), 'Group A winner'), t2: getThirdTeam(allocationRow["1A vs"]) },
    // Match 85
    { match_id: 85, t1: getTeam(w('B'), 'Group B winner'), t2: getThirdTeam(allocationRow["1B vs"]) },
    // Match 87
    { match_id: 87, t1: getTeam(w('K'), 'Group K winner'), t2: getThirdTeam(allocationRow["1K vs"]) },
    // Match 88
    { match_id: 88, t1: getTeam(ru('D'), 'D runner-up'), t2: getTeam(ru('G'), 'G runner-up') },
    // Match 86
    { match_id: 86, t1: getTeam(w('J'), 'Group J winner'), t2: getTeam(ru('H'), 'H runner-up') }
  ];

  if (includeIds) {
    pairings.forEach(p => {
      p.id = `m${p.match_id}`;
    });
  }

  // Validate we generated exactly 16 matches
  if (pairings.length !== 16) {
    throw new Error("Invalid FIFA Round of 32 allocation: Exactly 16 matches should be generated.");
  }

  return pairings;
};
