import { NextResponse } from 'next/server';
import { verifyVerificationToken } from '@/lib/email-otp';
import { corsHeaders, escapeHtml, sendEmail } from '@/lib/email';
import { checkAndRecordReservationAttempt } from '@/lib/reservation-rate-limit';

// 未設定の場合は運営宛の通知メールをスキップするだけで、顧客への受付完了メールは
// 通常通り送信される（お客様体験を壊さないためのベストエフォート仕様）。
const OPERATOR_NOTIFY_EMAIL = process.env.OPERATOR_NOTIFY_EMAIL;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  notes?: string;
  verificationToken?: string;
  bookingType?: 'now' | 'scheduled';
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

  // メール認証が設定済みの環境では、認証済みメールアドレスであることを示す
  // トークンが一致しない限り予約通知を受け付けない（本人確認の実効性を持たせる）。
  if (process.env.EMAIL_VERIFICATION_SECRET) {
    const tokenOk = body.verificationToken
      ? await verifyVerificationToken(body.to, body.verificationToken)
      : false;
    if (!tokenOk) {
      return NextResponse.json(
        { error: 'メールアドレスの認証が確認できません' },
        { status: 401, headers: corsHeaders() }
      );
    }
  }

  // 同一メールアドレスからの短時間の連続送信（いたずら・誤送信の連打）を
  // 間引く。予約自体は端末側で成立済みなので、ここで弾いても顧客体験は
  // 壊さない（通知メールが一通にまとまるだけ）。
  if (!checkAndRecordReservationAttempt(body.to)) {
    return NextResponse.json(
      { error: '短時間に複数回のリクエストがあったため、通知を間引きました' },
      { status: 429, headers: corsHeaders() }
    );
  }

  const customerSent = await sendEmail(
    body.to,
    '【URARA】ご予約リクエストを受け付けました',
    renderConfirmationEmail(body)
  );

  if (!customerSent) {
    return NextResponse.json({ error: 'email send failed' }, { status: 502, headers: corsHeaders() });
  }

  // 運営宛の通知は顧客体験に影響させないベストエフォート。失敗してもログのみ。
  if (OPERATOR_NOTIFY_EMAIL) {
    sendEmail(OPERATOR_NOTIFY_EMAIL, `【URARA】新規予約リクエスト（${body.locationName}）`, renderOperatorEmail(body)).catch(
      (err) => console.error('operator notify send errored', err)
    );
  }

  return NextResponse.json({ sent: true }, { headers: corsHeaders() });
}

function renderConfirmationEmail(body: RequestBody): string {
  return `
  <div style="background:#050505;padding:32px 16px;font-family:'Hiragino Sans','Yu Gothic',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#121212;border:1px solid #2A2A2A;border-radius:14px;padding:28px;color:#F5F5F7;">
      <p style="letter-spacing:4px;color:#E0E0E0;font-size:13px;text-align:center;margin:0 0 4px;">URARA</p>
      <h1 style="font-size:18px;text-align:center;margin:0 0 20px;color:#F5F5F7;">ご予約リクエストを受け付けました</h1>
      <p style="font-size:13px;line-height:1.8;color:#8E8E93;">
        ご予約のお申込みありがとうございます。内容を確認のうえ、手配が整い次第あらためて「予約確定」のご連絡をいたします。
        <strong style="color:#F5F5F7;">この時点ではまだ予約は確定しておりません。</strong>
      </p>
      <table style="width:100%;margin-top:16px;border-collapse:collapse;font-size:13px;">
        <tr><td style="color:#6C6C70;padding:6px 0;">予約番号</td><td style="text-align:right;color:#F5F5F7;">${escapeHtml(body.reservationId)}</td></tr>
        <tr><td style="color:#6C6C70;padding:6px 0;">場所</td><td style="text-align:right;color:#F5F5F7;">${escapeHtml(body.locationName)}</td></tr>
        <tr><td style="color:#6C6C70;padding:6px 0;">日時</td><td style="text-align:right;color:#F5F5F7;">${escapeHtml(body.requestedDatetimeLabel)}</td></tr>
        <tr><td style="color:#6C6C70;padding:6px 0;">人数</td><td style="text-align:right;color:#F5F5F7;">お客様${body.guestCount}名 ・ 女の子${body.companionCount}名</td></tr>
        <tr><td style="color:#6C6C70;padding:6px 0;">料金目安</td><td style="text-align:right;color:#FFFFFF;font-weight:700;">${escapeHtml(body.estimatedTotalLabel)}</td></tr>
      </table>
      ${
        body.notes
          ? `<p style="font-size:12px;color:#6C6C70;margin-top:16px;">ご要望</p>
      <p style="font-size:13px;color:#F5F5F7;white-space:pre-wrap;margin-top:4px;">${escapeHtml(body.notes)}</p>`
          : ''
      }
      <p style="font-size:11px;color:#6C6C70;margin-top:24px;line-height:1.6;">
        本メールに心当たりがない場合は、お手数ですが破棄していただきますようお願いいたします。
      </p>
    </div>
  </div>`;
}

function renderOperatorEmail(body: RequestBody): string {
  return `
  <div style="background:#050505;padding:32px 16px;font-family:'Hiragino Sans','Yu Gothic',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#121212;border:1px solid #2A2A2A;border-radius:14px;padding:28px;color:#F5F5F7;">
      <p style="letter-spacing:4px;color:#E0E0E0;font-size:13px;text-align:center;margin:0 0 4px;">URARA 管理者通知</p>
      <h1 style="font-size:18px;text-align:center;margin:0 0 20px;color:#F5F5F7;">新規予約リクエストがあります</h1>
      ${
        body.bookingType === 'now'
          ? `<p style="background:#2A1815;color:#D97F72;font-size:13px;font-weight:700;text-align:center;padding:10px;border-radius:8px;margin:0 0 16px;">
        ⚠ 即日（今すぐ予約）です。お電話でのご本人確認をお願いします。
      </p>`
          : ''
      }
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="color:#6C6C70;padding:6px 0;">予約番号</td><td style="text-align:right;color:#F5F5F7;">${escapeHtml(body.reservationId)}</td></tr>
        <tr><td style="color:#6C6C70;padding:6px 0;">お客様メール</td><td style="text-align:right;color:#F5F5F7;">${escapeHtml(body.to)}</td></tr>
        <tr><td style="color:#6C6C70;padding:6px 0;">場所</td><td style="text-align:right;color:#F5F5F7;">${escapeHtml(body.locationName)}</td></tr>
        <tr><td style="color:#6C6C70;padding:6px 0;">日時</td><td style="text-align:right;color:#F5F5F7;">${escapeHtml(body.requestedDatetimeLabel)}</td></tr>
        <tr><td style="color:#6C6C70;padding:6px 0;">人数</td><td style="text-align:right;color:#F5F5F7;">お客様${body.guestCount}名 ・ 女の子${body.companionCount}名</td></tr>
        <tr><td style="color:#6C6C70;padding:6px 0;">料金目安</td><td style="text-align:right;color:#FFFFFF;font-weight:700;">${escapeHtml(body.estimatedTotalLabel)}</td></tr>
      </table>
      ${
        body.notes
          ? `<p style="font-size:12px;color:#6C6C70;margin-top:16px;">お客様のご要望・キャストのご希望</p>
      <p style="font-size:13px;color:#F5F5F7;white-space:pre-wrap;margin-top:4px;">${escapeHtml(body.notes)}</p>`
          : `<p style="font-size:12px;color:#6C6C70;margin-top:16px;">ご要望の記入はありません（おまかせ）。</p>`
      }
      <p style="font-size:11px;color:#6C6C70;margin-top:24px;line-height:1.6;">
        管理画面から詳細の確認・手配の登録を行ってください。
      </p>
    </div>
  </div>`;
}
