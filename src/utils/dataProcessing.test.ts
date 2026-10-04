import { describe, expect, it } from 'vitest';
import { MOCK_DATASET, generateMockDataset } from '@/data/mockDataset';
import {
  aggregate,
  allStats,
  columnStats,
  correlationMatrix,
  detectAnomalies,
  featureImportance,
  linearForecast,
  validateRows,
} from '@/utils/dataProcessing';
import { answerQuery, suggestionChips } from '@/utils/aiResponses';

describe('mock dataset', () => {
  it('ships 100+ rows with the full spec columns', () => {
    expect(MOCK_DATASET.length).toBeGreaterThanOrEqual(100);
    const row = MOCK_DATASET[0]!;
    for (const k of [
      'id', 'date', 'productName', 'region', 'revenue', 'units',
      'customersAcquired', 'conversionRate', 'churnRate',
      'customerSatisfaction', 'marketingSpend', 'websiteTraffic',
    ]) {
      expect(row[k]).toBeDefined();
    }
  });

  it('is deterministic across calls', () => {
    expect(generateMockDataset()).toEqual(generateMockDataset());
  });
});

describe('dataProcessing', () => {
  it('computes sane column stats', () => {
    const s = columnStats(MOCK_DATASET, 'revenue');
    expect(s.count).toBe(MOCK_DATASET.length);
    expect(s.mean).toBeGreaterThan(0);
    expect(s.min).toBeLessThanOrEqual(s.median);
    expect(s.median).toBeLessThanOrEqual(s.max);
    expect(s.std).toBeGreaterThan(0);
    expect(allStats(MOCK_DATASET).length).toBeGreaterThanOrEqual(8);
  });

  it('flags injected spikes as anomalies', () => {
    const anomalies = detectAnomalies(MOCK_DATASET);
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies.every((a) => Math.abs(a.zScore) > 2)).toBe(true);
  });

  it('forecasts history + future points with a confidence band', () => {
    const fc = linearForecast(MOCK_DATASET, 'revenue', 14);
    expect(fc.length).toBeGreaterThan(14);
    const future = fc.filter((p) => p.forecast !== null);
    expect(future).toHaveLength(14);
    for (const p of future) {
      expect(p.lower).not.toBeNull();
      expect(p.upper).not.toBeNull();
      expect(p.lower!).toBeLessThanOrEqual(p.upper!);
    }
  });

  it('ranks features by absolute correlation, descending', () => {
    const feats = featureImportance(MOCK_DATASET, 'revenue');
    expect(feats.length).toBeGreaterThan(0);
    for (let i = 1; i < feats.length; i++) {
      expect(feats[i - 1]!.score).toBeGreaterThanOrEqual(feats[i]!.score);
    }
  });

  it('aggregates categorically and validates rows', () => {
    const agg = aggregate(MOCK_DATASET, {
      id: 't', kind: 'bar', xKey: 'region', yKey: 'revenue', agg: 'SUM', scheme: 'neon', title: 't',
    });
    expect(agg.length).toBeGreaterThan(0);
    expect(agg.reduce((a, b) => a + b.value, 0)).toBeGreaterThan(0);
    expect(validateRows(MOCK_DATASET).errors).toEqual([]);
  });

  it('builds a correlation matrix with unit diagonal', () => {
    const { keys, matrix } = correlationMatrix(MOCK_DATASET);
    expect(keys.length).toBe(matrix.length);
    matrix.forEach((row, i) => expect(row[i]).toBeCloseTo(1, 2));
  });
});

describe('aiResponses', () => {
  it('answers top-10 with a table and confidence in range', () => {
    const msg = answerQuery('Show top 10 by revenue', MOCK_DATASET);
    expect(msg.confidence).toBeGreaterThanOrEqual(85);
    expect(msg.confidence).toBeLessThanOrEqual(98);
    expect(msg.table).toHaveLength(10);
  });

  it('detects outliers, trends, drivers and correlations', () => {
    expect(answerQuery('Identify outliers in revenue', MOCK_DATASET).text).toMatch(/outlier|flagged|2σ/i);
    expect(answerQuery('Trend analysis for date', MOCK_DATASET).chartKind).toBe('line');
    expect(answerQuery('What drives revenue?', MOCK_DATASET).chartKind).toBe('scatter');
    expect(answerQuery('Compare region vs revenue', MOCK_DATASET).text).toMatch(/Leader/);
  });

  it('emits dataset-aware suggestion chips', () => {
    const chips = suggestionChips(MOCK_DATASET);
    expect(chips.length).toBeGreaterThanOrEqual(5);
    expect(chips.join(' ')).toMatch(/top 10/i);
  });
});
