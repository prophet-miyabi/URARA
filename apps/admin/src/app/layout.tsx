import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ReservationProvider } from "@/lib/reservation-store";

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

const NAV_ITEMS = [
  { href: "/", label: "予約キュー" },
  { href: "/companions", label: "女の子管理" },
  { href: "/venues", label: "店舗管理" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-neutral-50 text-neutral-900">
        <ReservationProvider>
          <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white flex flex-col">
            <div className="px-4 py-5 border-b border-neutral-200">
              <p className="text-sm font-semibold text-neutral-500">コンパニオン派遣</p>
              <p className="text-base font-bold">管理画面</p>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0 p-6">{children}</main>
        </ReservationProvider>
      </body>
    </html>
  );
}
