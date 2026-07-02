import { calculateTeamStrength } from './simulationHelpers';
import predictionPercentagesData from '../data/prediction_percentages.json';
import predictionPercentagesKnockoutData from '../data/prediction_percentages_knockout.json';

/**
 * Deterministically generates a prediction for a match between two teams.
 * Uses match statistics from the 100 simulations if available, otherwise falls back to power scores.
 */
export const getPrediction = (homeTeam, awayTeam, isKnockout = false) => {
    if (!homeTeam || !awayTeam) return null;

    const predictionData = isKnockout ? predictionPercentagesKnockoutData : predictionPercentagesData;

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

    // Look up in 100 simulations predictions
    const name1 = homeTeam.name;
    const name2 = awayTeam.name;
    const sorted = [name1, name2].sort();
    const team1 = sorted[0];
    const team2 = sorted[1];
    const key = `${team1.replace(/\s+/g, '_')}_vs_${team2.replace(/\s+/g, '_')}`;

    let homeProb, awayProb, drawProb;
    const simPredEntire = predictionPercentagesData.predictions?.[key];
    const simPredKO = predictionPercentagesKnockoutData.predictions?.[key];
    const simPred = simPredKO || simPredEntire;

    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let hasSimData = false;

    if (simPredEntire) {
        hasSimData = true;
        if (simPredEntire.homeTeam === name1) {
            homeWins += simPredEntire.homeWins || 0;
            awayWins += simPredEntire.awayWins || 0;
        } else {
            homeWins += simPredEntire.awayWins || 0;
            awayWins += simPredEntire.homeWins || 0;
        }
        draws += simPredEntire.draws || 0;
    }

    if (simPredKO) {
        hasSimData = true;
        if (simPredKO.homeTeam === name1) {
            homeWins += simPredKO.homeWins || 0;
            awayWins += simPredKO.awayWins || 0;
        } else {
            homeWins += simPredKO.awayWins || 0;
            awayWins += simPredKO.homeWins || 0;
        }
        draws += simPredKO.draws || 0;
    }

    const totalWins = homeWins + awayWins + draws;

    if (hasSimData && totalWins > 0) {
        homeProb = homeWins / totalWins;
        awayProb = awayWins / totalWins;
        drawProb = draws / totalWins;
    } else {
        // Base probabilities based on adjusted Power Scores (fallback)
        homeProb = 0.38 + (finalDiff * 0.01);
        awayProb = 0.32 - (finalDiff * 0.01);

        // Clamping
        homeProb = Math.min(0.8, Math.max(0.1, homeProb));
        awayProb = Math.min(0.8, Math.max(0.1, awayProb));
        drawProb = 1 - homeProb - awayProb;
    }

    if (isKnockout) {
        const total = homeProb + awayProb;
        if (total > 0) {
            homeProb = homeProb / total;
            awayProb = awayProb / total;
        } else {
            homeProb = 0.5;
            awayProb = 0.5;
        }
        drawProb = 0;
    }

    // Deterministic scores that align logically with the calculated win probabilities
    let homeScore = 1;
    let awayScore = 1;
    
    if (homeProb > awayProb) {
        const diff = homeProb - awayProb;
        if (diff > 0.6) {
            homeScore = 3;
            awayScore = 0;
        } else if (diff > 0.3) {
            homeScore = 2;
            awayScore = 0;
        } else {
            homeScore = 2;
            awayScore = 1;
        }
    } else if (awayProb > homeProb) {
        const diff = awayProb - homeProb;
        if (diff > 0.6) {
            homeScore = 0;
            awayScore = 3;
        } else if (diff > 0.3) {
            homeScore = 0;
            awayScore = 2;
        } else {
            homeScore = 1;
            awayScore = 2;
        }
    } else {
        if (isKnockout) {
            if (seed % 2 === 0) {
                homeScore = 2;
                awayScore = 1;
            } else {
                homeScore = 1;
                awayScore = 2;
            }
        } else {
            if (homeProb > 0.35) {
                homeScore = 2;
                awayScore = 2;
            } else {
                homeScore = 1;
                awayScore = 1;
            }
        }
    }
    
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
