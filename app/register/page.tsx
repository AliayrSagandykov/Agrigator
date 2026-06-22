import { Suspense } from "react";
import { getT } from "@/lib/locale";
import { RegisterForm } from "@/components/register-form";

export const metadata = { title: "Регистрация — Agrigator" };

export default function RegisterPage() {
  const labels = getT().auth;
  return (
    <Suspense>
      <RegisterForm labels={labels} />
    </Suspense>
  );
}
