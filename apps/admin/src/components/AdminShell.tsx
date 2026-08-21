"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "予約キュー" },
  { href: "/companions", label: "女の子管理" },
  { href: "/venues", label: "店舗管理" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [lastSeenPathname, setLastSeenPathname] = useState(pathname);

  // Close the mobile drawer whenever the route changes.
  if (pathname !== lastSeenPathname) {
    setLastSeenPathname(pathname);
    setMenuOpen(false);
  }

  const currentLabel = NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "管理画面";

  // The login page renders its own centered layout — no nav shell to leak
  // before the visitor is authenticated.
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="メニューを開く"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        <p className="text-sm font-bold">{currentLabel}</p>
        <div className="w-9" />
      </header>

      {/* Mobile drawer + backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-neutral-200 bg-white md:flex md:flex-col">
        <SidebarContent />
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    onNavigate?.();
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <div className="border-b border-neutral-200 px-4 py-5">
        <p className="text-sm font-semibold text-neutral-500">コンパニオン派遣</p>
        <p className="text-base font-bold">管理画面</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-neutral-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-500 hover:bg-neutral-100"
        >
          ログアウト
        </button>
      </div>
    </>
  );
}
