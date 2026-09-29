"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/settings/operator-emails")
      .then((res) => res.json())
      .then((data) => setEmails(data.emails ?? []))
      .finally(() => setLoading(false));
  }, []);

  const save = async (next: string[]) => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/settings/operator-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: next }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "保存に失敗しました");
      return;
    }
    setEmails(data.emails);
    setSavedAt(Date.now());
  };

  const handleAdd = () => {
    const trimmed = newEmail.trim();
    if (!trimmed || emails.includes(trimmed)) return;
    setNewEmail("");
    save([...emails, trimmed]);
  };

  const handleRemove = (email: string) => {
    save(emails.filter((e) => e !== email));
  };

  if (loading) return <p className="text-sm text-neutral-400">読み込み中...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold">通知設定</h1>
      <p className="mb-6 text-sm text-neutral-500">
        新規予約の受付など、運営として把握しておくべき通知メールの送り先です。ここに追加したアドレスすべてに、同じ内容のメールが届きます。
      </p>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-neutral-500">送信先一覧</h2>
        {emails.length === 0 ? (
          <p className="text-sm text-neutral-400">送信先が登録されていません。</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {emails.map((email) => (
              <li
                key={email}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(email)}
                  disabled={saving}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="new-address@example.com"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !newEmail.trim()}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            追加
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {savedAt && !error && <p className="mt-3 text-xs text-neutral-400">保存しました</p>}
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        ※ info@urara.tech は送信専用アドレスとして設定されており、受信箱（メールボックス）を別途ConoHa
        WING側で用意しない限りメールを受け取れません。実際に確認したい場合は、受信できるアドレスも合わせて登録してください。
      </p>
    </div>
  );
}
