export function currentHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function isoToHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function timeToISO(date: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const [y, mo, day] = date.split('-').map(Number)
  return new Date(y, mo - 1, day, h, m).toISOString()
}
