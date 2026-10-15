"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ログインに失敗しました");
        return;
      }
      // 画面を丸ごと読み込み直す。ログイン前に走った（未認証で失敗した）予約の取得を、
      // ログイン後の状態でやり直すため。ここを軽い遷移にすると、ログイン直後は
      // 次の自動更新まで予約が空のまま表示されてしまう。
      // 移動先は自サイト内のパスだけに限る（"//example.com" のような外部サイトを除く）。
      const requested = searchParams.get("next") ?? "/";
      window.location.assign(/^\/(?![/\\])/.test(requested) ? requested : "/");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm font-semibold text-neutral-500">コンパニオン派遣</p>
        <h1 className="mb-6 text-lg font-bold">管理画面ログイン</h1>

        <label className="mb-1 block text-sm font-medium text-neutral-700">ユーザー名</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="email"
          className="mb-4 h-12 w-full rounded-md border border-neutral-300 px-3 text-base"
          required
        />

        <label className="mb-1 block text-sm font-medium text-neutral-700">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mb-4 h-12 w-full rounded-md border border-neutral-300 px-3 text-base"
          required
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="h-12 w-full rounded-md bg-neutral-900 px-3 text-base font-semibold text-white transition hover:bg-neutral-700 active:bg-neutral-700 disabled:opacity-40"
        >
          {submitting ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
