import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.NOTIFY_FROM_ADDRESS ?? 'URARA <onboarding@resend.dev>';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

interface RequestBody {
  to: string;
  reservationId: string;
  locationName: string;
  requestedDatetimeLabel: string;
  guestCount: number;
  companionCount: number;
  estimatedTotalLabel: string;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400, headers: corsHeaders() });
  }

  if (!body.to || !EMAIL_PATTERN.test(body.to)) {
    return NextResponse.json({ error: 'invalid email address' }, { status: 400, headers: corsHeaders() });
  }
  if (!body.reservationId || !body.locationName || !body.requestedDatetimeLabel) {
    return NextResponse.json({ error: 'missing reservation fields' }, { status: 400, headers: corsHeaders() });
  }

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not configured; skipping email send', body.reservationId);
    return NextResponse.json({ skipped: true, reason: 'email not configured' }, { status: 202, headers: corsHeaders() });
  }

  const html = renderConfirmationEmail(body);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [body.to],
      subject: '【URARA】ご予約リクエストを受け付けました',
      html,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    console.error('Resend send failed', res.status, errorText);
    return NextResponse.json({ error: 'email send failed' }, { status: 502, headers: corsHeaders() });
  }

  return NextResponse.json({ sent: true }, { headers: corsHeaders() });
}

function renderConfirmationEmail(body: RequestBody): string {
  return `
  <div style="background:#0B0B0C;padding:32px 16px;font-family:'Hiragino Sans','Yu Gothic',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#171716;border:1px solid #3A3427;border-radius:14px;padding:28px;color:#F3EEE3;">
      <p style="letter-spacing:4px;color:#D8B872;font-size:13px;text-align:center;margin:0 0 4px;">URARA</p>
      <h1 style="font-size:18px;text-align:center;margin:0 0 20px;color:#F3EEE3;">ご予約リクエストを受け付けました</h1>
      <p style="font-size:13px;line-height:1.8;color:#B9AF9C;">
        ご予約のお申込みありがとうございます。内容を確認のうえ、手配が整い次第あらためて「予約確定」のご連絡をいたします。
        <strong style="color:#F3EEE3;">この時点ではまだ予約は確定しておりません。</strong>
      </p>
      <table style="width:100%;margin-top:16px;border-collapse:collapse;font-size:13px;">
        <tr><td style="color:#7C7568;padding:6px 0;">予約番号</td><td style="text-align:right;color:#F3EEE3;">${escapeHtml(body.reservationId)}</td></tr>
        <tr><td style="color:#7C7568;padding:6px 0;">場所</td><td style="text-align:right;color:#F3EEE3;">${escapeHtml(body.locationName)}</td></tr>
        <tr><td style="color:#7C7568;padding:6px 0;">日時</td><td style="text-align:right;color:#F3EEE3;">${escapeHtml(body.requestedDatetimeLabel)}</td></tr>
        <tr><td style="color:#7C7568;padding:6px 0;">人数</td><td style="text-align:right;color:#F3EEE3;">お客様${body.guestCount}名 ・ 女の子${body.companionCount}名</td></tr>
        <tr><td style="color:#7C7568;padding:6px 0;">料金目安</td><td style="text-align:right;color:#D8B872;font-weight:700;">${escapeHtml(body.estimatedTotalLabel)}</td></tr>
      </table>
      <p style="font-size:11px;color:#7C7568;margin-top:24px;line-height:1.6;">
        本メールに心当たりがない場合は、お手数ですが破棄していただきますようお願いいたします。
      </p>
    </div>
  </div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
