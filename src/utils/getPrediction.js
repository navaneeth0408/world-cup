import { calculateTeamStrength } from './simulationHelpers';

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

    // Get base Power Scores
    const baseStrengthH = calculateTeamStrength(homeTeam);
    const baseStrengthA = calculateTeamStrength(awayTeam);

    // Apply Randomness Adjustment: min((Power Score Difference / 2), 5)
    const powerDiff = Math.abs(baseStrengthH - baseStrengthA);
    const adjustment = Math.min(powerDiff / 2, 5);

    let adjH = baseStrengthH;
    let adjA = baseStrengthA;

    if (baseStrengthH > baseStrengthA) {
        adjH = baseStrengthH - adjustment;
        adjA = baseStrengthA + adjustment;
    } else if (baseStrengthA > baseStrengthH) {
        adjH = baseStrengthH + adjustment;
        adjA = baseStrengthA - adjustment;
    }

    // Add seeded random variance (±5%) to represent unpredictability consistently
    const getSeededVariance = (seedVal, salt) => {
        const x = Math.sin(seedVal + salt) * 10000;
        const r = x - Math.floor(x);
        return (r - 0.5) * 0.1; // range [-0.05, 0.05]
    };

    const varianceH = 1 + getSeededVariance(seed, 1);
    const varianceA = 1 + getSeededVariance(seed, 2);

    const finalH = Math.min(100, Math.max(0, adjH * varianceH));
    const finalA = Math.min(100, Math.max(0, adjA * varianceA));

    const finalDiff = finalH - finalA;

    // Base probabilities based on adjusted Power Scores
    let homeProb = 0.38 + (finalDiff * 0.01);
    let awayProb = 0.32 - (finalDiff * 0.01);

    // Clamping
    homeProb = Math.min(0.8, Math.max(0.1, homeProb));
    awayProb = Math.min(0.8, Math.max(0.1, awayProb));
    const drawProb = 1 - homeProb - awayProb;

    // Deterministic scores based on seed and adjusted difference
    let homeScore = (seed % 3) + (finalDiff > 15 ? 1 : 0);
    let awayScore = ((seed >> 2) % 3) + (finalDiff < -15 ? 1 : 0);

    // Confidence Level
    let confidence = 'Medium';
    if (Math.abs(finalDiff) > 30) confidence = 'High';
    if (Math.abs(finalDiff) < 10) confidence = 'Low';

    return {
        homeProbability: Math.round(homeProb * 100),
        awayProbability: Math.round(awayProb * 100),
        drawProbability: Math.round(drawProb * 100),
        predictedScore: `${homeScore} - ${awayScore}`,
        confidenceLevel: confidence
    };
};
