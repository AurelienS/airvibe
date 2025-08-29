import Link from "next/link";
import { ReactNode } from "react";

export function Navbar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <nav className="navbar">
      <div className="navbar__section">
        <Link href="/home" className="navbar__brand">Airvibe</Link>
        {left}
      </div>
      <div className="navbar__section">
        {right}
      </div>
    </nav>
  );
}


