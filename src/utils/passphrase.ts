export const MIN_PASSPHRASE_LENGTH = 12

export type PassphraseScore = 0 | 1 | 2 | 3 | 4

export interface PassphraseStrength {
  score: PassphraseScore
  labelKey: string
  labelParams?: Record<string, unknown>
  acceptable: boolean
}

export function scorePassphrase(passphrase: string): PassphraseStrength {
  if (passphrase.length === 0) {
    return { score: 0, labelKey: 'passphrase.empty', acceptable: false }
  }
  if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
    return {
      score: 0,
      labelKey: 'passphrase.tooShort',
      labelParams: { min: MIN_PASSPHRASE_LENGTH },
      acceptable: false,
    }
  }
  let varieties = 0
  if (/[a-z]/.test(passphrase)) varieties++
  if (/[A-Z]/.test(passphrase)) varieties++
  if (/\d/.test(passphrase)) varieties++
  if (/[^a-zA-Z0-9]/.test(passphrase)) varieties++

  if (passphrase.length >= 20) return { score: 4, labelKey: 'passphrase.strong', acceptable: true }
  if (passphrase.length >= 16 || varieties >= 3) return { score: 3, labelKey: 'passphrase.good', acceptable: true }
  if (passphrase.length >= 14 || varieties >= 2) return { score: 2, labelKey: 'passphrase.fair', acceptable: true }
  return { score: 1, labelKey: 'passphrase.weak', acceptable: true }
}
