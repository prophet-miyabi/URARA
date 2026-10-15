"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { isPending } from "@/lib/reservation-metrics";
import { useReservationStore } from "@/lib/reservation-store";

type IconName = "home" | "calendar" | "users" | "bell" | "person" | "building" | "menu" | "refresh" | "logout";

const ICON_PATHS: Record<IconName, string> = {
  home: "m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10",
  calendar: "M8 3v4M16 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  users: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-1a4 4 0 0 0-3-3.87M16 4.13a3.5 3.5 0 0 1 0 6.74",
  bell: "M15 17H9m6 0a3 3 0 0 1-6 0m6 0h4l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L5 17h4",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0",
  building: "M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M8 8h2M8 12h2M8 16h2M3 21h18",
  menu: "M4 7h16M4 12h16M4 17h16",
  refresh: "M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4",
  logout: "M15 17l5-5-5-5M20 12H9M12 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7",
};

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`shrink-0 ${className}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[name]} />
    </svg>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: "pending";
}
interface NavSection {
  label: string | null;
  items: NavItem[];
}

// 使う頻度の高い順に、目的ごとにまとめる。「準備中」は、まだ実データに
// つながっていない（ダミー表示の）画面。
const NAV_SECTIONS: NavSection[] = [
  { label: null, items: [{ href: "/", label: "ダッシュボード", icon: "home" }] },
  {
    label: "予約",
    items: [
      { href: "/reservations", label: "予約キュー", icon: "calendar", badge: "pending" },
      { href: "/customers", label: "お客様", icon: "users" },
    ],
  },
  { label: "運用", items: [{ href: "/settings", label: "通知設定", icon: "bell" }] },
  {
    label: "準備中",
    items: [
      { href: "/companions", label: "女の子管理", icon: "person" },
      { href: "/venues", label: "店舗管理", icon: "building" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function formatClock(ms: number | null): string {
  if (ms === null) return "取得中";
  return new Date(ms).toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" });
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [lastSeenPathname, setLastSeenPathname] = useState(pathname);
  const { reservations, lastUpdated, refresh } = useReservationStore();

  // 画面が切り替わったらスマホのメニューを閉じる。
  if (pathname !== lastSeenPathname) {
    setLastSeenPathname(pathname);
    setMenuOpen(false);
  }

  // ログイン画面は、認証前にメニューが見えないよう、単独のレイアウトで表示する。
  if (pathname === "/login") return <>{children}</>;

  const pendingCount = reservations.filter(isPending).length;

  const sidebar = (
    <SidebarContent
      pathname={pathname}
      pendingCount={pendingCount}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onNavigate={() => setMenuOpen(false)}
    />
  );

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* スマホ: 上部バー */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/95 px-4 py-2 backdrop-blur md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-xs font-bold tracking-wider text-gold">
            UR
          </span>
          <p className="text-sm font-bold tracking-wide">URARA 管理画面</p>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          aria-label="最新の情報に更新"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-subtle active:bg-canvas"
        >
          <Icon name="refresh" />
        </button>
      </header>

      {/* スマホ: メニュー（下のタブの「メニュー」から開く） */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl">{sidebar}</aside>
        </div>
      )}

      {/* PC: 固定サイドバー */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white md:flex">
        {sidebar}
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-8">{children}</main>

      {/* スマホ: 下部タブ。親指で押せる位置に、よく使う画面を置く。 */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <TabLink href="/" label="ホーム" icon="home" active={pathname === "/"} />
        <TabLink
          href="/reservations"
          label="予約"
          icon="calendar"
          active={isActive(pathname, "/reservations")}
          badge={pendingCount}
        />
        <TabLink href="/customers" label="お客様" icon="users" active={isActive(pathname, "/customers")} />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-subtle active:bg-canvas"
        >
          <Icon name="menu" />
          メニュー
        </button>
      </nav>
    </div>
  );
}

function TabLink({
  href,
  label,
  icon,
  active,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: IconName;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium active:bg-canvas ${
        active ? "text-ink" : "text-subtle"
      }`}
    >
      <span className="relative">
        <Icon name={icon} className={`h-5 w-5 ${active ? "stroke-[2.2]" : ""}`} />
        {badge > 0 && (
          <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      {label}
      {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-ink" />}
    </Link>
  );
}

function SidebarContent({
  pathname,
  pendingCount,
  lastUpdated,
  onRefresh,
  onNavigate,
}: {
  pathname: string;
  pendingCount: number;
  lastUpdated: number | null;
  onRefresh: () => Promise<void>;
  onNavigate: () => void;
}) {
  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    onNavigate();
    // 画面を丸ごと読み込み直して、メモリ上に残った予約・お客様の情報を消す
    // （同じ端末で別の管理者がログインしたときに前の人のデータが見えないように）。
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 全画面の読み込み直しが目的
    window.location.href = "/login";
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-line px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-sm font-bold tracking-wider text-gold">
          UR
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide">URARA</p>
          <p className="text-xs text-subtle">管理画面</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.label ?? index} className={index > 0 ? "mt-5" : ""}>
            {section.label && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-faint">{section.label}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition md:min-h-10 md:text-sm ${
                        active ? "bg-ink text-white" : "text-slate-700 hover:bg-canvas active:bg-canvas"
                      }`}
                    >
                      <Icon name={item.icon} className="h-[18px] w-[18px]" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge === "pending" && pendingCount > 0 && (
                        <span
                          className={`min-w-5 rounded-full px-1.5 text-center text-xs font-bold leading-5 ${
                            active ? "bg-white text-ink" : "bg-rose-600 text-white"
                          }`}
                        >
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <div className="mb-2 flex items-center justify-between gap-2 px-3 text-xs text-subtle">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            自動更新 ・ {formatClock(lastUpdated)}
          </span>
          <button
            type="button"
            onClick={() => onRefresh()}
            aria-label="今すぐ更新"
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-canvas active:bg-canvas"
          >
            <Icon name="refresh" className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-subtle hover:bg-canvas active:bg-canvas md:min-h-10 md:text-sm"
        >
          <Icon name="logout" className="h-[18px] w-[18px]" />
          ログアウト
        </button>
      </div>
    </>
  );
}
