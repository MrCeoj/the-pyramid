export async function getPreviousMonday(
  previous = true,
  date: Date = new Date(),
): Promise<Date> {
  const d = new Date(date);
  const day = d.getDay();
  let diff;
  if (previous) {
    diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7; // -7 because one week offset
  } else {
    diff = d.getDate() - day + (day === 0 ? -6 : 1);
  }

  d.setHours(0, 0, 0, 0);
  d.setDate(diff);
  return d;
}