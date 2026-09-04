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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-extrabold text-brand-ink">Dispatch sign in</h1>
      <p className="mt-2 text-sm text-slate-600">Internal use only.</p>
      <AdminLoginForm />
    </main>
  );
}
