import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadReport } from "@/lib/storage";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Нет файла" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Файл больше 8 МБ" }, { status: 400 });

  // Только score reports: изображения и PDF. Не пускаем html/svg/js в публичный бакет.
  const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]);
  if (!ALLOWED.has(file.type))
    return NextResponse.json({ error: "Можно загрузить только изображение или PDF" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const url = await uploadReport(bytes, file.name, file.type);

  // Хранилище не настроено → отдаём имя файла, флоу не ломается.
  if (!url) return NextResponse.json({ url: file.name, stored: false });
  return NextResponse.json({ url, stored: true });
}
