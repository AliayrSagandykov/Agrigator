// ============================================================
// Контракт платёжного провайдера.
// Весь остальной код зовёт payments.confirmPayment(...) и НЕ знает,
// кто за этим — оператор (manual) или вебхук Kaspi (auto).
// ============================================================

export type PaymentMode = "manual" | "auto";

export interface CreateChargeInput {
  bookingId: string;
  amount: number;
}

export interface CreateChargeResult {
  /** QR/ссылка, которую отдаём студенту (Kaspi). */
  payUrl: string;
  paymentId: string;
}

export interface ReleasePayoutInput {
  tutorId: string;
  /** Конкретная оплата к выплате (если не задано — все confirmed по тютору). */
  paymentId?: string;
}

export interface PaymentProvider {
  readonly mode: PaymentMode;
  /** Создать платёж (pending) и вернуть payUrl студенту. */
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
  /** Пометить оплаченным: payment → confirmed, booking → paid. Идемпотентно. */
  confirmPayment(bookingId: string): Promise<void>;
  /** Выплатить тютору из эскроу: payment → released, booking → settled. */
  releasePayout(input: ReleasePayoutInput): Promise<{ released: number }>;
}
