/**
 * Portuguese public holidays — fixed dates + Easter-based moveable feasts.
 * Fixed holidays are encoded as { month, day } (month 1-based).
 * Moveable feasts are computed from the Easter date each year.
 */

export const PT_FIXED_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1,  day: 1,  name: 'Ano Novo' },
  { month: 4,  day: 25, name: 'Dia da Liberdade' },
  { month: 5,  day: 1,  name: 'Dia do Trabalhador' },
  { month: 6,  day: 10, name: 'Dia de Portugal' },
  { month: 8,  day: 15, name: 'Assunção de Nossa Senhora' },
  { month: 10, day: 5,  name: 'Implantação da República' },
  { month: 11, day: 1,  name: 'Dia de Todos os Santos' },
  { month: 11, day: 11, name: 'Dia de São Martinho — Restauração da Independência' },
  { month: 12, day: 1,  name: 'Restauração da Independência' },
  { month: 12, day: 8,  name: 'Imaculada Conceição' },
  { month: 12, day: 25, name: 'Natal' },
];

/** Computaes Easter Sunday for a given year using the Anonymous Gregorian algorithm. */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Returns all Portuguese public holiday dates for a given year. */
export function getPortugueseHolidays(year: number): { date: Date; name: string }[] {
  const holidays: { date: Date; name: string }[] = PT_FIXED_HOLIDAYS.map(h => ({
    date: new Date(year, h.month - 1, h.day),
    name: h.name,
  }));

  const easter = easterSunday(year);

  // Good Friday (Sexta-feira Santa): Easter - 2
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push({ date: goodFriday, name: 'Sexta-feira Santa' });

  // Carnaval (Terça-feira de Carnaval): Easter - 47  — not a mandatory national holiday
  // but widely used; excluded intentionally.

  // Corpus Christi (Corpo de Deus): Easter + 60
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  holidays.push({ date: corpusChristi, name: 'Corpo de Deus' });

  return holidays;
}

/** Returns true if the given Date is a Portuguese public holiday. */
export function isPortugueseHoliday(date: Date): { isHoliday: boolean; name?: string } {
  const holidays = getPortugueseHolidays(date.getFullYear());
  const found = holidays.find(
    h =>
      h.date.getFullYear() === date.getFullYear() &&
      h.date.getMonth() === date.getMonth() &&
      h.date.getDate() === date.getDate(),
  );
  return found ? { isHoliday: true, name: found.name } : { isHoliday: false };
}
