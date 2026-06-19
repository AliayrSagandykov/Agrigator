import "server-only";
import { KaspiManual } from "./kaspi-manual";
import type { CreateChargeInput, CreateChargeResult, PaymentMode } from "./types";

// ============================================================
// KaspiMerchantAPI — режим auto (флип после ~50 уроков).
// Переходы payment/booking ИДЕНТИЧНЫ ручному режиму (наследуем их),
// меняется только триггер: confirmPayment дёргает вебхук Kaspi v2,
// а releasePayout — крон выплат (Inngest). createCharge ходит в API.
//
// Тело API-вызова оставлено заглушкой: подключается, когда есть
// мерчант-договор и ключи (KASPI_MERCHANT_ID / KASPI_API_KEY).
// ============================================================

export class KaspiMerchantAPI extends KaspiManual {
  readonly mode: PaymentMode = "auto";

  async createCharge({ bookingId, amount }: CreateChargeInput): Promise<CreateChargeResult> {
    // TODO(auto): POST в Kaspi Pay Merchant API v2 → получить настоящий payUrl/QR.
    // Пока ключей нет — падать назад на ручную генерацию ссылки, но провайдер помечается auto.
    const result = await super.createCharge({ bookingId, amount });
    return result;
  }

  // confirmPayment здесь вызывается обработчиком вебхука Kaspi
  // (app/api/webhooks/kaspi) после проверки подписи — логика та же.
}
