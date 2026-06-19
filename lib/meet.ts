import "server-only";

// ============================================================
// Видео-ссылка урока. Платформа ВЛАДЕЕТ ссылкой и фактом захода —
// саму комнату не строим (UX §2.7). День-0: Jitsi (без OAuth).
// Auto: Google Calendar API (conferenceData) — сам кладёт Meet-ссылку
// в оба календаря. Интерфейс generateMeetLink(...) не меняется.
// ============================================================

export function generateMeetLink(bookingId: string): string {
  // Детерминированная комната на бронь. На проде заменяется Meet-ссылкой из Calendar API.
  return `https://meet.jit.si/agrigator-${bookingId}`;
}
