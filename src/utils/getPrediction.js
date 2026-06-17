/**
 * Deterministically generates a prediction for a match between two teams.
 * Uses a simple hash of the team IDs as a seed to ensure consistency.
 */
export const getPrediction = (homeTeam, awayTeam) => {
    if (!homeTeam || !awayTeam) return null;

    // Create a stable seed from team IDs
    const str = homeTeam.id + awayTeam.id;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);

    // FIFA ranking based logic
    const rankH = homeTeam.fifaRanking || 50;
    const rankA = awayTeam.fifaRanking || 50;
    const rankDiff = rankA - rankH; // Positive means Home is better

    // Base probabilities
    let homeProb = 0.38 + (rankDiff * 0.01);
    let awayProb = 0.32 - (rankDiff * 0.01);

    // Clamping
    homeProb = Math.min(0.8, Math.max(0.1, homeProb));
    awayProb = Math.min(0.8, Math.max(0.1, awayProb));
    const drawProb = 1 - homeProb - awayProb;

    // Deterministic scores based on seed
    // homeScore = (seed % 3) + extra goal if much better
    let homeScore = (seed % 3) + (rankDiff > 15 ? 1 : 0);
    // awayScore = ((seed >> 2) % 3) + extra goal if much better
    let awayScore = ((seed >> 2) % 3) + (rankDiff < -15 ? 1 : 0);

    // Confidence Level
    let confidence = 'Medium';
    if (Math.abs(rankDiff) > 30) confidence = 'High';
    if (Math.abs(rankDiff) < 10) confidence = 'Low';

    return {
        homeProbability: Math.round(homeProb * 100),
        awayProbability: Math.round(awayProb * 100),
        drawProbability: Math.round(drawProb * 100),
        predictedScore: `${homeScore} - ${awayScore}`,
        confidenceLevel: confidence
    };
};
