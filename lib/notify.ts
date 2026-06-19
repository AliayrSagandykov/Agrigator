import "server-only";

// ============================================================
// Уведомления оператору/пользователям.
// Сейчас — лог в консоль (день-0). Позже — Telegram-бот + очередь
// (Inngest). Интерфейс не меняется: всё зовёт notifyOperator(...).
// ============================================================

type OperatorEvent =
  | { type: "payment_pending"; bookingId: string; amount: number }
  | { type: "result_submitted"; resultId: string; studentName: string }
  | { type: "lead_new"; source: string };

export async function notifyOperator(event: OperatorEvent): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_OPERATOR_CHAT_ID;

  const text = renderOperatorMessage(event);

  if (!token || !chatId) {
    // День-0: бота ещё нет — просто лог. Это и есть «ручной» режим.
    console.log("[notify:operator]", text);
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (e) {
    console.error("[notify:operator] telegram failed", e);
  }
}

function renderOperatorMessage(event: OperatorEvent): string {
  switch (event.type) {
    case "payment_pending":
      return `💸 Новая оплата, бронь #${event.bookingId}: ${event.amount.toLocaleString("ru-RU")} ₸. Подтверди в /admin.`;
    case "result_submitted":
      return `📄 ${event.studentName} загрузил(а) score report (#${event.resultId}). Проверь и проставь дельту в /admin.`;
    case "lead_new":
      return `🔎 Новый лид из ${event.source}. Разбери в /admin.`;
  }
}
