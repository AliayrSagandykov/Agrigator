"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

interface NavLabels {
  home: string; tutors: string; forTutors: string; contacts: string; login: string;
  register: string; logout: string; favorites: string; dashboard: string;
}

export function MobileNav({
  user,
  favCount = 0,
  labels,
}: {
  user: { role: string } | null;
  favCount?: number;
  labels: NavLabels;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const dashboardHref =
    user?.role === "tutor" ? "/tutor" : user?.role === "admin" ? "/admin" : "/dashboard";

  function close() {
    setOpen(false);
  }
  async function logout() {
    close();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Меню"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-50 border-b border-border bg-background p-3 shadow-md">
          <nav className="flex flex-col">
            <MLink href="/" onClick={close}>{labels.home}</MLink>
            <MLink href="/catalog" onClick={close}>{labels.tutors}</MLink>
            <MLink href="/for-tutors" onClick={close}>{labels.forTutors}</MLink>
            <MLink href="/contacts" onClick={close}>{labels.contacts}</MLink>
            <div className="my-2 border-t border-border" />
            {user ? (
              <>
                <MLink href={dashboardHref} onClick={close}>{labels.dashboard}</MLink>
                {user.role === "student" && (
                  <MLink href="/favorites" onClick={close}>
                    {labels.favorites}{favCount ? ` (${favCount})` : ""}
                  </MLink>
                )}
                <button
                  onClick={logout}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  {labels.logout}
                </button>
              </>
            ) : (
              <>
                <MLink href="/login" onClick={close}>{labels.login}</MLink>
                <MLink href="/register" onClick={close}>{labels.register}</MLink>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}

function MLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
      {children}
    </Link>
  );
}
