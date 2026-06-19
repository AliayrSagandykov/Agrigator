import Link from "next/link";
import { Check, TrendingUp, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Тьюторам — Agrigator" };

export default function ForTutorsPage() {
  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="container py-16 text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight">
            Твой портфель результатов, который <span className="brand-grad">нельзя купить</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Регистрация бесплатна навсегда. Платформа берёт на себя бронь, ссылку на урок и
            оплату — а твои метрики растут сами с каждым результатом ученика.
          </p>
          <Link href="/register?role=tutor" className="mt-7 inline-block">
            <Button size="lg">Создать профиль тьютора</Button>
          </Link>
        </div>
      </section>

      <section className="container grid gap-5 py-14 md:grid-cols-2">
        <Benefit icon={<TrendingUp className="text-primary" />} title="Метрики вместо саморекламы">
          Средняя дельта, число уроков и удержание считает система. Не нужно доказывать
          словами — цифры говорят сами.
        </Benefit>
        <Benefit icon={<ShieldCheck className="text-success" />} title="Лёгкая верификация на входе">
          Подтверждение личности и (по желанию) свой балл. Главная верификация идёт потом —
          из реальных результатов учеников.
        </Benefit>
        <Benefit icon={<Wallet className="text-primary" />} title="Оплата и эскроу">
          Деньги держатся в эскроу до урока и падают тебе после. Никаких «забыл перевести».
        </Benefit>
        <Benefit icon={<Check className="text-success" />} title="Логистика — на платформе">
          Принятая бронь = слот в календаре и авто-ссылка на урок. Ты не тратишь время на
          переписку о времени.
        </Benefit>
      </section>
    </div>
  );
}

function Benefit({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">{icon}</div>
        <h3 className="mt-3 font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  );
}
