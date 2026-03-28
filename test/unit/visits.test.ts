import { describe, expect, it } from 'vitest';
import {
  formatDistanceMeters,
  formatReviewVisitedAt,
  getLatestPlaceStamp,
  getPlaceVisitCount,
  getTodayStampLog,
} from '../../src/lib/visits';
import { latestStampFixture, todayStampFixture } from '../fixtures/app-fixtures';

describe('visits utilities', () => {
  it('formats distances for meters and kilometers', () => {
    expect(formatDistanceMeters(120)).toBe('120m');
    expect(formatDistanceMeters(1900)).toBe('1.9km');
  });

  it('returns review timestamps unchanged when invalid', () => {
    expect(formatReviewVisitedAt('invalid-date')).toBe('invalid-date');
  });

  it('finds today stamp and latest stamp by place id', () => {
    const logs = [todayStampFixture, latestStampFixture];

    expect(getTodayStampLog(logs, todayStampFixture.placeId)?.id).toBe(todayStampFixture.id);
    expect(getLatestPlaceStamp(logs, latestStampFixture.placeId)?.id).toBe(todayStampFixture.id);
    expect(getPlaceVisitCount(logs, todayStampFixture.placeId)).toBe(2);
  });
});
