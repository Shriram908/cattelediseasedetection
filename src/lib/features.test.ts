import { describe, expect, it } from 'vitest';
import { canViewAdmin, validTrendDays } from './admin-access';
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, validVector, validObservations } from '../../supabase/functions/_shared/semantic-validation';
describe('Admin and semantic search rules', () => {
  it('only permits a confirmed admin response', () => { expect(canViewAdmin(true)).toBe(true); expect(canViewAdmin(false)).toBe(false); expect(canViewAdmin('admin')).toBe(false); });
  it('restricts trend windows', () => { expect(validTrendDays(30)).toBe(true); expect(validTrendDays(100000)).toBe(false); });
  it('keeps full embedding dimensions and one model', () => { expect(EMBEDDING_MODEL).toBe('google/gemini-embedding-2'); expect(EMBEDDING_DIMENSIONS).toBe(3072); expect(validVector(Array(3072).fill(0.1))).toBe(true); expect(validVector(Array(1536).fill(0.1))).toBe(false); expect(validVector(Array(3072).fill(NaN))).toBe(false); });
  it('bounds farmer observations', () => { expect(validObservations('Cow has mouth blisters')).toBe(true); expect(validObservations('a'.repeat(2001))).toBe(false); });
});