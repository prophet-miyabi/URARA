import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReservationProvider } from "@/lib/reservation-store";
import { AdminShell } from "@/components/AdminShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "コンパニオン派遣 管理画面",
  description: "予約・女の子・店舗の管理画面",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-neutral-50 text-neutral-900">
        <ReservationProvider>
          <AdminShell>{children}</AdminShell>
        </ReservationProvider>
      </body>
    </html>
  );
}
