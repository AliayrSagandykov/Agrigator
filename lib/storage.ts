import "server-only";

// ============================================================
// Загрузка файлов в Supabase Storage (score reports).
// Если не настроено (нет SUPABASE_URL/SERVICE_ROLE_KEY) — возвращаем null,
// вызывающий код падает на имя файла (без регрессии).
// Нужен публичный бакет (по умолчанию "reports") в Supabase → Storage.
// ============================================================

export async function uploadReport(
  bytes: ArrayBuffer,
  filename: string,
  contentType: string,
): Promise<string | null> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "reports";
  if (!base || !key) return null;

  const safe = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-60);
  const path = `${Date.now()}-${safe}`;

  const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType || "application/octet-stream",
      "x-upsert": "true",
    },
    body: bytes,
  });

  if (!res.ok) {
    console.error("[storage] upload failed", res.status, await res.text().catch(() => ""));
    return null;
  }
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
