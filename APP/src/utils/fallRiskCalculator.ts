import { Elderly } from 'moveplus-shared';
import { calculateAge } from './Date';
import { MeasurementType } from 'moveplus-shared';

/**
 * Calculate fall risk score for an elderly person
 * Returns a score from 0-100 (higher = higher risk)
 *
 * Factors considered:
 * - Age (older = higher risk)
 * - Fall history (past falls increase risk)
 * - Balance and mobility scores (lower = higher risk)
 * - Weight (BMI extremes increase risk)
 * - Cognitive score (lower = higher risk)
 */
export const calculateFallRiskScore = (elderly: Elderly): number => {
  let riskScore = 0;

  // Factor 1: Age (max 30 points)
  // Risk increases significantly after 65
  const age = calculateAge(elderly.birthDate);
  if (age >= 85) {
    riskScore += 30;
  } else if (age >= 75) {
    riskScore += 25;
  } else if (age >= 65) {
    riskScore += 20;
  } else if (age >= 60) {
    riskScore += 10;
  }

  // Factor 2: Fall History (max 35 points)
  // Past falls are the strongest predictor of future falls
  if (elderly.fallOccurrences && elderly.fallOccurrences.length > 0) {
    const recentFalls = elderly.fallOccurrences.filter(fall => {
      const fallDate = new Date(fall.date);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return fallDate >= sixMonthsAgo && !fall.isFalseAlarm;
    });

    const totalFalls = elderly.fallOccurrences.filter(f => !f.isFalseAlarm).length;
    const fallsWithInjury = elderly.fallOccurrences.filter(f => f.injured && !f.isFalseAlarm).length;

    // Recent falls are more concerning
    if (recentFalls.length >= 2) {
      riskScore += 35;
    } else if (recentFalls.length === 1) {
      riskScore += 25;
    } else if (totalFalls >= 3) {
      riskScore += 20;
    } else if (totalFalls >= 1) {
      riskScore += 15;
    }

    // Falls with injury add extra risk
    if (fallsWithInjury > 0) {
      riskScore += 5;
    }
  }

  // Factor 3: Balance and Mobility (max 20 points)
  if (elderly.measurements && elderly.measurements.length > 0) {
    const balanceScores = elderly.measurements
      .filter(m => m.type === MeasurementType.BALANCE_SCORE)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const mobilityScores = elderly.measurements
      .filter(m => m.type === MeasurementType.MOBILITY_SCORE)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Use most recent balance score (assuming 0-100 scale, lower = worse)
    if (balanceScores.length > 0) {
      const latestBalance = balanceScores[0].value;
      if (latestBalance < 40) {
        riskScore += 15;
      } else if (latestBalance < 60) {
        riskScore += 10;
      } else if (latestBalance < 75) {
        riskScore += 5;
      }
    }

    // Use most recent mobility score
    if (mobilityScores.length > 0) {
      const latestMobility = mobilityScores[0].value;
      if (latestMobility < 40) {
        riskScore += 10;
      } else if (latestMobility < 60) {
        riskScore += 5;
      }
    }
  }

  // Factor 4: BMI (max 10 points)
  // Both underweight and overweight increase fall risk
  if (elderly.measurements && elderly.measurements.length > 0) {
    const weights = elderly.measurements
      .filter(m => m.type === MeasurementType.WEIGHT)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const heights = elderly.measurements
      .filter(m => m.type === MeasurementType.HEIGHT)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (weights.length > 0 && heights.length > 0) {
      const weightKg = weights[0].value; // Assuming kg
      const heightM = heights[0].value / 100; // Assuming cm, convert to m
      const bmi = weightKg / (heightM * heightM);

      if (bmi < 18.5 || bmi > 30) {
        riskScore += 10;
      } else if (bmi < 20 || bmi > 27) {
        riskScore += 5;
      }
    }
  }

  // Factor 5: Cognitive Score (max 5 points)
  // Cognitive impairment increases fall risk
  if (elderly.measurements && elderly.measurements.length > 0) {
    const cognitiveScores = elderly.measurements
      .filter(m => m.type === MeasurementType.COGNITIVE_SCORE)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (cognitiveScores.length > 0) {
      const latestCognitive = cognitiveScores[0].value;
      if (latestCognitive < 50) {
        riskScore += 5;
      } else if (latestCognitive < 70) {
        riskScore += 3;
      }
    }
  }

  // Cap the score at 100
  return Math.min(riskScore, 100);
};

/**
 * Get fall risk level based on score
 * @returns 'low' | 'moderate' | 'high'
 */
export const getFallRiskLevel = (score: number): 'low' | 'moderate' | 'high' => {
  if (score < 30) return 'low';
  if (score < 60) return 'moderate';
  return 'high';
};

/**
 * Get color for fall risk level
 * @returns hex color string
 */
export const getFallRiskColor = (level: 'low' | 'moderate' | 'high'): string => {
  switch (level) {
    case 'low':
      return '#4CAF50'; // Green
    case 'moderate':
      return '#FF9800'; // Orange
    case 'high':
      return '#F44336'; // Red
  }
};
