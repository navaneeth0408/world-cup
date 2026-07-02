import { calculateTeamStrength } from './simulationHelpers';
import predictionPercentagesData from '../data/prediction_percentages.json';

/**
 * Deterministically generates a prediction for a match between two teams.
 * Uses match statistics from the 100 simulations if available, otherwise falls back to power scores.
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

    // Look up in 100 simulations prediction_percentages.json
    const name1 = homeTeam.name;
    const name2 = awayTeam.name;
    const sorted = [name1, name2].sort();
    const team1 = sorted[0];
    const team2 = sorted[1];
    const key = `${team1.replace(/\s+/g, '_')}_vs_${team2.replace(/\s+/g, '_')}`;

    let homeProb, awayProb, drawProb;
    const simPred = predictionPercentagesData.predictions?.[key];

    if (simPred) {
        if (simPred.homeTeam === name1) {
            homeProb = simPred.homeWinPercentage / 100;
            awayProb = simPred.awayWinPercentage / 100;
        } else {
            homeProb = simPred.awayWinPercentage / 100;
            awayProb = simPred.homeWinPercentage / 100;
        }
        drawProb = simPred.drawPercentage / 100;
    } else {
        // Base probabilities based on adjusted Power Scores
        homeProb = 0.38 + (finalDiff * 0.01);
        awayProb = 0.32 - (finalDiff * 0.01);

        // Clamping
        homeProb = Math.min(0.8, Math.max(0.1, homeProb));
        awayProb = Math.min(0.8, Math.max(0.1, awayProb));
        drawProb = 1 - homeProb - awayProb;
    }

    // Deterministic scores based on seed and adjusted difference (fallback)
    let homeScore = (seed % 3) + (finalDiff > 15 ? 1 : 0);
    let awayScore = ((seed >> 2) % 3) + (finalDiff < -15 ? 1 : 0);
    let predictedScoreVal = `${homeScore} - ${awayScore}`;

    if (simPred && simPred.mostCommonScore) {
        const parts = simPred.mostCommonScore.split('-').map(x => x.trim());
        if (parts.length === 2) {
            if (simPred.homeTeam === name1) {
                predictedScoreVal = `${parts[0]} - ${parts[1]}`;
            } else {
                predictedScoreVal = `${parts[1]} - ${parts[0]}`;
            }
        }
    }

    // Confidence Level
    let confidence = 'Medium';
    if (Math.abs(homeProb - awayProb) > 0.3) confidence = 'High';
    if (Math.abs(homeProb - awayProb) < 0.1) confidence = 'Low';

    return {
        homeProbability: Math.round(homeProb * 100),
        awayProbability: Math.round(awayProb * 100),
        drawProbability: Math.round(drawProb * 100),
        predictedScore: predictedScoreVal,
        confidenceLevel: confidence
    };
};
