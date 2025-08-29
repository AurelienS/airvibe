import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/home");
  return (
    <div className="min-h-svh flex items-center justify-center p-6">
      <Card className="w-full max-w-sm rounded-xl">
        <CardHeader>
          <h2 className="text-lg font-semibold">Connexion</h2>
          <p className="text-sm text-[--color-muted-foreground]">Accédez à votre carnet de vols</p>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/home', redirect: true });
            }}
          >
            <Button type="submit" className="w-full">Continuer avec Google</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


