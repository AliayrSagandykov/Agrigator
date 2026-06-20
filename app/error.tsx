"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="mt-4 text-2xl font-bold">Что-то пошло не так</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Произошла ошибка на сервере. Обычно это временно — попробуйте обновить страницу.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground">код: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Попробовать снова</Button>
        <Link href="/">
          <Button variant="outline">На главную</Button>
        </Link>
      </div>
    </div>
  );
}
