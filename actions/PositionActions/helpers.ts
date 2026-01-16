
export function formatDuration(days: number, hours: number, minutes: number): string {
  const parts: string[] = [];

  if (days > 0) {
    parts.push(days === 1 ? "1 día" : `${days} días`);
  }

  if (hours > 0) {
    parts.push(hours === 1 ? "1 hora" : `${hours} horas`);
  }

  if (parts.length === 0 && minutes > 0) {
    parts.push(minutes === 1 ? "1 minuto" : `${minutes} minutos`);
  }

  if (parts.length === 0) {
    return "menos de 1 minuto";
  }

  // Join with "y"
  return parts[0];
}
