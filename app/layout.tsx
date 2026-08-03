import type { Metadata } from "next";
import { Karla } from "next/font/google";
import "./globals.css";

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Appli-Log",
  description: "A pastel job application tracker for managing applications",
  icons: {
    icon: "/Appli-Log.ico",
    shortcut: "/Appli-Log.ico",
    apple: "/Appli-Log.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${karla.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-karla)]">{children}</body>
    </html>
  );
}