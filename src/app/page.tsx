import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { HeroArc } from "@/components/HeroArc";

export default function LandingPage() {
  return (
    <div className="min-h-svh airflow flex items-center justify-center p-6 relative">
      <HeroArc className="absolute inset-x-0 -top-10 w-full" opacity={0.55} />
      <div className="container grid gap-10 text-center relative">
        <div className="space-y-5">
          <Badge>Parapente logbook</Badge>
          <h1 className="text-5xl font-extrabold tracking-tight navbar__brand">Airvibe</h1>
          <p className="text-[--color-muted-foreground] max-w-xl mx-auto">
            Une interface élégante et sobre pour consigner vos vols et ressentis.
            Sobriété, fluidité, précision.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login">
              <Button>Se connecter</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Découvrir</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
