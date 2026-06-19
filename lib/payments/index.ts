import "server-only";
import { KaspiManual } from "./kaspi-manual";
import { KaspiMerchantAPI } from "./kaspi-auto";
import type { PaymentMode, PaymentProvider } from "./types";

// Один флаг на всю систему. Переключение manual→auto = смена env, без рефактора.
const MODE = (process.env.PAYMENT_MODE as PaymentMode) || "manual";

export const payments: PaymentProvider =
  MODE === "auto" ? new KaspiMerchantAPI() : new KaspiManual();

export type { PaymentProvider } from "./types";
