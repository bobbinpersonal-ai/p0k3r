import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";

export default function AdminLoginPage() {
  const session = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (isValidAdminSessionCookie(session)) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="absolute inset-0 -z-10 bg-grid-fade" />
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Internal</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Dispatch sign in</h1>
      <p className="mt-2 text-sm text-neutral-400">Internal use only.</p>
      <AdminLoginForm />
    </main>
  );
}
