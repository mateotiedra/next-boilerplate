import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  nameSchema,
  slugSchema,
  paginationSchema,
} from '@/lib/validations/common';

describe('emailSchema', () => {
  it('accepts valid emails', () => {
    expect(emailSchema.safeParse('a@b.com').success).toBe(true);
  });

  it('rejects empty strings', () => {
    expect(emailSchema.safeParse('').success).toBe(false);
  });

  it('rejects malformed emails', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
  });
});

describe('nameSchema', () => {
  it('accepts short names', () => {
    expect(nameSchema.safeParse('Alice').success).toBe(true);
  });

  it('rejects names over 100 chars', () => {
    expect(nameSchema.safeParse('a'.repeat(101)).success).toBe(false);
  });
});

describe('slugSchema', () => {
  it.each([
    ['valid-slug', true],
    ['team-42', true],
    ['Invalid Slug', false],
    ['UPPER', false],
    ['-leading', false],
    ['trailing-', false],
  ])('slug %s → valid=%s', (input, valid) => {
    expect(slugSchema.safeParse(input).success).toBe(valid);
  });
});

describe('paginationSchema', () => {
  it('defaults page and pageSize', () => {
    const result = paginationSchema.parse({});
    expect(result).toEqual({ page: 1, pageSize: 20 });
  });

  it('coerces string inputs from query params', () => {
    const result = paginationSchema.parse({ page: '3', pageSize: '50' });
    expect(result).toEqual({ page: 3, pageSize: 50 });
  });

  it('caps pageSize at 100', () => {
    expect(paginationSchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });
});
