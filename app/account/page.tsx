import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getT, getLocale } from "@/lib/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LangSwitcher } from "@/components/lang-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccountForm } from "@/components/account-form";

export const metadata = { title: "Настройки аккаунта — Agrigator" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const t = getT();
  const a = t.account;
  const locale = getLocale();
  const dashHref = user.role === "tutor" ? "/tutor" : user.role === "admin" ? "/admin" : "/dashboard";
  const roleLabel =
    user.role === "tutor" ? a.roleTutor : user.role === "admin" ? a.roleAdmin : a.roleStudent;

  return (
    <div className="px-5 py-8 sm:px-8 lg:px-10">
      {/* Содержимое настроек по центру доступной области */}
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{a.title}</h1>
          <Link href={dashHref}>
            <Button variant="outline" className="cursor-pointer">
              <ArrowLeft size={16} /> {a.backToDashboard}
            </Button>
          </Link>
        </div>

        <div className="space-y-5">
          {/* Профиль: имя, email, фото/аватар */}
          <Card>
            <CardContent className="pt-5">
              <h2 className="mb-4 font-semibold">{a.profile}</h2>
              <AccountForm
                initial={{
                  name: user.name,
                  email: user.email,
                  avatarColor: user.avatarColor ?? "#7c3aed",
                  photo: user.photo,
                }}
                labels={{
                  name: a.name,
                  email: a.email,
                  avatar: a.avatar,
                  avatarHint: a.avatarHint,
                  uploadPhoto: a.uploadPhoto,
                  removePhoto: a.removePhoto,
                  save: a.save,
                  saving: a.saving,
                  saved: a.saved,
                  errName: a.errName,
                  errEmail: a.errEmail,
                  errEmailTaken: a.errEmailTaken,
                  errPhoto: a.errPhoto,
                  errGeneric: a.errGeneric,
                }}
              />
            </CardContent>
          </Card>

          {/* Оформление: язык, тема + роль */}
          <Card>
            <CardContent className="space-y-1 pt-5">
              <h2 className="mb-2 font-semibold">{a.appearance}</h2>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">{a.language}</span>
                <LangSwitcher current={locale} />
              </div>
              <div className="flex items-center justify-between border-t border-border py-2 pt-3">
                <span className="text-sm">{a.theme}</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between border-t border-border py-2 pt-3">
                <span className="text-sm">{a.role}</span>
                <span className="text-sm font-medium">{roleLabel}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
