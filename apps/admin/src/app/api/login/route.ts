import { NextResponse } from "next/server";
import { checkCredentials, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!body.username || !body.password) {
    return NextResponse.json({ error: "ユーザー名とパスワードを入力してください" }, { status: 400 });
  }

  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { error: "管理画面のログインがまだ設定されていません（サーバー側の環境変数未設定）" },
      { status: 503 }
    );
  }

  if (!checkCredentials(body.username, body.password)) {
    return NextResponse.json({ error: "ユーザー名またはパスワードが正しくありません" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
