import { scorePassphrase, MIN_PASSPHRASE_LENGTH } from '@/utils/passphrase'

describe('scorePassphrase', () => {
  test('MIN_PASSPHRASE_LENGTH is 12', () => {
    expect(MIN_PASSPHRASE_LENGTH).toBe(12)
  })

  test('empty string → score 0, not acceptable, empty label', () => {
    const result = scorePassphrase('')
    expect(result.score).toBe(0)
    expect(result.acceptable).toBe(false)
    expect(result.labelKey).toBe('passphrase.empty')
  })

  test('string shorter than minimum → score 0, not acceptable, tooShort label with min param', () => {
    const result = scorePassphrase('short')
    expect(result.score).toBe(0)
    expect(result.acceptable).toBe(false)
    expect(result.labelKey).toBe('passphrase.tooShort')
    expect(result.labelParams?.min).toBe(12)
  })

  test('exactly 11 chars → score 0, not acceptable', () => {
    const result = scorePassphrase('abcdefghijk')
    expect(result.score).toBe(0)
    expect(result.acceptable).toBe(false)
  })

  test('exactly 12 lowercase chars → score 1, acceptable', () => {
    // 12 chars, 1 variety (lowercase only) — not length>=14, not varieties>=2
    const result = scorePassphrase('abcdefghijkl')
    expect(result.score).toBe(1)
    expect(result.acceptable).toBe(true)
  })

  test('12 chars with 2 character varieties → score 2', () => {
    // lowercase + digit
    const result = scorePassphrase('abcdefghijk1')
    expect(result.score).toBe(2)
    expect(result.acceptable).toBe(true)
  })

  test('14+ chars with 1 variety → score 2', () => {
    const result = scorePassphrase('abcdefghijklmn') // 14 lowercase chars
    expect(result.score).toBe(2)
    expect(result.acceptable).toBe(true)
  })

  test('12 chars with 3+ varieties → score 3', () => {
    // lowercase + uppercase + digit = 3 varieties, 12 chars
    const result = scorePassphrase('abcABC123abc')
    expect(result.score).toBe(3)
    expect(result.acceptable).toBe(true)
  })

  test('16+ chars with 1 variety → score 3', () => {
    const result = scorePassphrase('abcdefghijklmnop') // 16 lowercase chars
    expect(result.score).toBe(3)
    expect(result.acceptable).toBe(true)
  })

  test('20+ chars → score 4 regardless of variety', () => {
    const result = scorePassphrase('abcdefghijklmnopqrst') // 20 lowercase chars
    expect(result.score).toBe(4)
    expect(result.acceptable).toBe(true)
  })
})
