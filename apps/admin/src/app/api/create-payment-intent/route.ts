import { NextResponse } from "next/server";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

interface RequestBody {
  amountYen: number;
  receiptEmail: string;
  description: string;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400, headers: corsHeaders() });
  }

  if (!Number.isFinite(body.amountYen) || body.amountYen <= 0) {
    return NextResponse.json({ error: "invalid amount" }, { status: 400, headers: corsHeaders() });
  }

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured on the server yet" },
      { status: 503, headers: corsHeaders() }
    );
  }

  // JPY is a zero-decimal currency for Stripe — the integer yen amount is
  // sent as-is, unlike e.g. USD where amounts are in cents.
  const params = new URLSearchParams({
    amount: String(Math.round(body.amountYen)),
    currency: "jpy",
    "automatic_payment_methods[enabled]": "true",
    description: body.description ?? "URARA companion reservation",
  });
  if (body.receiptEmail) params.set("receipt_email", body.receiptEmail);

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Stripe create PaymentIntent failed", data);
    return NextResponse.json(
      { error: data?.error?.message ?? "payment intent creation failed" },
      { status: 502, headers: corsHeaders() }
    );
  }

  return NextResponse.json({ clientSecret: data.client_secret }, { headers: corsHeaders() });
}
