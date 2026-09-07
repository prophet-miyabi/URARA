import { NextResponse } from "next/server";
import { checkCode, createVerificationToken } from "@/lib/email-otp";
import { corsHeaders } from "@/lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = /^\d{6}$/;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400, headers: corsHeaders() });
  }

  const email = body.email?.trim() ?? "";
  const code = body.code?.trim() ?? "";
  if (!EMAIL_PATTERN.test(email) || !CODE_PATTERN.test(code)) {
    return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400, headers: corsHeaders() });
  }

  if (!process.env.EMAIL_VERIFICATION_SECRET) {
    return NextResponse.json(
      { error: "サーバー側でメール認証が未設定です" },
      { status: 503, headers: corsHeaders() }
    );
  }

  const ok = await checkCode(email, code);
  if (!ok) {
    return NextResponse.json(
      { error: "コードが正しくないか、有効期限が切れています" },
      { status: 401, headers: corsHeaders() }
    );
  }

  const token = await createVerificationToken(email);
  return NextResponse.json({ verified: true, token }, { headers: corsHeaders() });
}
