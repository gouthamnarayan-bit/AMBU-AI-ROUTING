import {
  CriterionKey,
  CriterionType,
  TOPSISHospitalScore,
  TOPSISResult,
} from '@/types/decision';

export interface RawHospitalRow {
  hospitalId: string;
  hospitalName: string;
  isEligible: boolean;
  exclusionReasons?: string[];
  values: Record<CriterionKey, number>;
}

/**
 * Calculates Euclidean norm for each criterion column:
 * norm_j = sqrt( sum_i (x_ij^2) )
 */
export function calculateColumnNorms(
  rows: RawHospitalRow[],
  criteria: CriterionKey[]
): Record<CriterionKey, number> {
  const norms: Record<CriterionKey, number> = {} as Record<CriterionKey, number>;

  for (const c of criteria) {
    let sumSq = 0;
    for (const row of rows) {
      const val = row.values[c] ?? 0;
      sumSq += val * val;
    }
    norms[c] = Math.sqrt(sumSq);
  }

  return norms;
}

/**
 * Normalizes raw decision matrix using vector normalization:
 * r_ij = x_ij / sqrt( sum_k (x_kj^2) )
 */
export function normalizeDecisionMatrix(
  rows: RawHospitalRow[],
  criteria: CriterionKey[],
  norms: Record<CriterionKey, number>
): { hospitalId: string; normalized: Record<CriterionKey, number> }[] {
  return rows.map((row) => {
    const normalized: Record<CriterionKey, number> = {} as Record<CriterionKey, number>;
    for (const c of criteria) {
      const norm = norms[c];
      const val = row.values[c] ?? 0;
      normalized[c] = norm > 0 ? val / norm : 0;
    }
    return {
      hospitalId: row.hospitalId,
      normalized,
    };
  });
}

/**
 * Multiplies normalized values by criterion weights:
 * v_ij = w_j * r_ij
 */
export function applyWeights(
  normalizedRows: { hospitalId: string; normalized: Record<CriterionKey, number> }[],
  weights: Record<CriterionKey, number>,
  criteria: CriterionKey[]
): { hospitalId: string; weighted: Record<CriterionKey, number> }[] {
  return normalizedRows.map((item) => {
    const weighted: Record<CriterionKey, number> = {} as Record<CriterionKey, number>;
    for (const c of criteria) {
      const w = weights[c] ?? 0;
      weighted[c] = (item.normalized[c] ?? 0) * w;
    }
    return {
      hospitalId: item.hospitalId,
      weighted,
    };
  });
}

/**
 * Calculates Positive Ideal Solution (V+):
 * For BENEFIT: max(v_ij)
 * For COST: min(v_ij)
 */
export function calculateIdealBest(
  weightedRows: { hospitalId: string; weighted: Record<CriterionKey, number> }[],
  criteria: CriterionKey[],
  criteriaTypes: Record<CriterionKey, CriterionType>
): Record<CriterionKey, number> {
  const idealBest: Record<CriterionKey, number> = {} as Record<CriterionKey, number>;

  for (const c of criteria) {
    const isBenefit = criteriaTypes[c] === 'BENEFIT';
    let bestVal = isBenefit ? -Infinity : Infinity;

    for (const row of weightedRows) {
      const val = row.weighted[c] ?? 0;
      if (isBenefit) {
        if (val > bestVal) bestVal = val;
      } else {
        if (val < bestVal) bestVal = val;
      }
    }

    idealBest[c] = bestVal === Infinity || bestVal === -Infinity ? 0 : bestVal;
  }

  return idealBest;
}

/**
 * Calculates Negative Ideal Solution (V-):
 * For BENEFIT: min(v_ij)
 * For COST: max(v_ij)
 */
export function calculateIdealWorst(
  weightedRows: { hospitalId: string; weighted: Record<CriterionKey, number> }[],
  criteria: CriterionKey[],
  criteriaTypes: Record<CriterionKey, CriterionType>
): Record<CriterionKey, number> {
  const idealWorst: Record<CriterionKey, number> = {} as Record<CriterionKey, number>;

  for (const c of criteria) {
    const isBenefit = criteriaTypes[c] === 'BENEFIT';
    let worstVal = isBenefit ? Infinity : -Infinity;

    for (const row of weightedRows) {
      const val = row.weighted[c] ?? 0;
      if (isBenefit) {
        if (val < worstVal) worstVal = val;
      } else {
        if (val > worstVal) worstVal = val;
      }
    }

    idealWorst[c] = worstVal === Infinity || worstVal === -Infinity ? 0 : worstVal;
  }

  return idealWorst;
}

/**
 * Calculates Euclidean distances from Positive (S+) and Negative (S-) Ideal Solutions.
 * S_i+ = sqrt( sum_j (v_ij - v_j+)^2 )
 * S_i- = sqrt( sum_j (v_ij - v_j-)^2 )
 */
export function calculateDistances(
  weightedValues: Record<CriterionKey, number>,
  idealBest: Record<CriterionKey, number>,
  idealWorst: Record<CriterionKey, number>,
  criteria: CriterionKey[]
): { distanceToPositiveIdeal: number; distanceToNegativeIdeal: number } {
  let sumSqBest = 0;
  let sumSqWorst = 0;

  for (const c of criteria) {
    const v = weightedValues[c] ?? 0;
    const vPlus = idealBest[c] ?? 0;
    const vMinus = idealWorst[c] ?? 0;

    sumSqBest += Math.pow(v - vPlus, 2);
    sumSqWorst += Math.pow(v - vMinus, 2);
  }

  return {
    distanceToPositiveIdeal: Math.sqrt(sumSqBest),
    distanceToNegativeIdeal: Math.sqrt(sumSqWorst),
  };
}

/**
 * Calculates Relative Closeness Coefficient (C*):
 * C_i* = S_i- / (S_i+ + S_i-)
 * Returns 0 to 1, where 1 is the ideal solution.
 */
export function calculateClosenessCoefficient(
  distanceToPositiveIdeal: number,
  distanceToNegativeIdeal: number
): number {
  const total = distanceToPositiveIdeal + distanceToNegativeIdeal;
  if (total <= 0.00000001) {
    return 0.5; // neutral if all candidates are identical
  }
  return distanceToNegativeIdeal / total;
}

/**
 * Main TOPSIS Ranking Pipeline
 */
export function rankHospitalsWithTOPSIS(
  rawRows: RawHospitalRow[],
  weights: Record<CriterionKey, number>,
  criteria: CriterionKey[],
  criteriaTypes: Record<CriterionKey, CriterionType>
): TOPSISResult {
  if (rawRows.length === 0) {
    return {
      criteria,
      criteriaTypes,
      weights,
      positiveIdealSolution: {} as Record<CriterionKey, number>,
      negativeIdealSolution: {} as Record<CriterionKey, number>,
      hospitalScores: [],
      rankedEligibleHospitals: [],
      excludedHospitals: [],
    };
  }

  // Compute norms across all candidate rows
  const norms = calculateColumnNorms(rawRows, criteria);
  const normalizedRows = normalizeDecisionMatrix(rawRows, criteria, norms);
  const weightedRows = applyWeights(normalizedRows, weights, criteria);

  // We determine ideal best and worst solutions based on ELIGIBLE candidates
  // (or all if no eligible candidates are available)
  const eligibleWeighted = weightedRows.filter((item) => {
    const orig = rawRows.find((r) => r.hospitalId === item.hospitalId);
    return orig?.isEligible;
  });

  const benchmarkRows = eligibleWeighted.length > 0 ? eligibleWeighted : weightedRows;

  const positiveIdealSolution = calculateIdealBest(benchmarkRows, criteria, criteriaTypes);
  const negativeIdealSolution = calculateIdealWorst(benchmarkRows, criteria, criteriaTypes);

  // Build TOPSIS score for each hospital
  const scoredHospitals: TOPSISHospitalScore[] = rawRows.map((orig) => {
    const normItem = normalizedRows.find((n) => n.hospitalId === orig.hospitalId)!;
    const weightItem = weightedRows.find((w) => w.hospitalId === orig.hospitalId)!;

    const { distanceToPositiveIdeal, distanceToNegativeIdeal } = calculateDistances(
      weightItem.weighted,
      positiveIdealSolution,
      negativeIdealSolution,
      criteria
    );

    const closeness = calculateClosenessCoefficient(
      distanceToPositiveIdeal,
      distanceToNegativeIdeal
    );

    return {
      hospitalId: orig.hospitalId,
      hospitalName: orig.hospitalName,
      rawValues: orig.values,
      normalizedValues: normItem.normalized,
      weightedValues: weightItem.weighted,
      distanceToPositiveIdeal: Math.round(distanceToPositiveIdeal * 10000) / 10000,
      distanceToNegativeIdeal: Math.round(distanceToNegativeIdeal * 10000) / 10000,
      closenessCoefficient: Math.round(closeness * 10000) / 10000,
      topsisScore: Math.round(closeness * 10000) / 10000,
      rank: 0,
      isEligible: orig.isEligible,
      exclusionReasons: orig.exclusionReasons,
    };
  });

  // Separate eligible and excluded
  const eligible = scoredHospitals.filter((h) => h.isEligible);
  const excluded = scoredHospitals.filter((h) => !h.isEligible);

  // Sort eligible in descending order of TOPSIS score
  eligible.sort((a, b) => b.topsisScore - a.topsisScore);

  // Assign ranks
  eligible.forEach((h, idx) => {
    h.rank = idx + 1;
  });

  excluded.forEach((h, idx) => {
    h.rank = eligible.length + idx + 1;
  });

  const allSorted = [...eligible, ...excluded];

  return {
    criteria,
    criteriaTypes,
    weights,
    positiveIdealSolution,
    negativeIdealSolution,
    hospitalScores: allSorted,
    rankedEligibleHospitals: eligible,
    excludedHospitals: excluded,
  };
}
