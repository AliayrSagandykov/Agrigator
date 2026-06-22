import { getT } from "@/lib/locale";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Вход — Agrigator" };

export default function LoginPage() {
  return <LoginForm labels={getT().auth} />;
}
