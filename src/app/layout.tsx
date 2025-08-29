import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Airvibe",
  description: "Parapente logbook",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-[--color-background] text-[--color-foreground]" data-theme="light">
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: `
            (function() {
              try {
                var t = localStorage.getItem('theme');
                if (!t) {
                  var m = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  t = m ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', t);
              } catch (e) {}
            })();
          ` }}
        />
      </head>
      <body className={`${plusJakarta.variable} antialiased`}>{children}</body>
    </html>
  );
}
