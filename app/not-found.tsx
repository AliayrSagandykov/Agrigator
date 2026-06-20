import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl font-bold brand-grad">404</div>
      <h1 className="mt-2 text-2xl font-bold">Страница не найдена</h1>
      <p className="mt-2 text-muted-foreground">
        Возможно, ссылка устарела или этого тютора больше нет.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button>На главную</Button>
        </Link>
        <Link href="/catalog">
          <Button variant="outline">К тюторам</Button>
        </Link>
      </div>
    </div>
  );
}
