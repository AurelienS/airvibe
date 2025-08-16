import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/home");
  return (
    <div className="min-h-svh flex items-center justify-center p-6">
      <form
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: '/home', redirect: true });
        }}
      >
        <button
          type="submit"
          className="px-6 py-3 rounded-md bg-black text-white hover:opacity-90"
        >
          Continuer avec Google
        </button>
      </form>
    </div>
  );
}


