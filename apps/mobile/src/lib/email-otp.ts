const ADMIN_API_BASE_URL = process.env.EXPO_PUBLIC_ADMIN_API_BASE_URL ?? 'https://urara-admin.onrender.com';

export type OtpResult = { ok: true } | { ok: false; error: string };
export type OtpVerifyResult = { ok: true; token: string } | { ok: false; error: string };

export async function requestOtpCode(email: string): Promise<OtpResult> {
  try {
    const res = await fetch(`${ADMIN_API_BASE_URL}/api/customer/auth/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: body.error ?? 'コードの送信に失敗しました' };
    return { ok: true };
  } catch {
    return { ok: false, error: '通信に失敗しました。ネットワークをご確認ください。' };
  }
}

export async function verifyOtpCode(email: string, code: string): Promise<OtpVerifyResult> {
  try {
    const res = await fetch(`${ADMIN_API_BASE_URL}/api/customer/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.token) return { ok: false, error: body.error ?? '認証に失敗しました' };
    return { ok: true, token: body.token };
  } catch {
    return { ok: false, error: '通信に失敗しました。ネットワークをご確認ください。' };
  }
}
