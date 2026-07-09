import { NextRequest, NextResponse } from "next/server";

type CreateCheckoutBody = {
  amount: number;
  currency?: string;
  description?: string;
};

function getBaseUrl(request: NextRequest) {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  const token = process.env.SUMUP_API_KEY?.trim();
  const merchantCode = process.env.SUMUP_MERCHANT_CODE?.trim();
  const payToEmail = process.env.SUMUP_PAY_TO_EMAIL?.trim();

  if (!token || (!merchantCode && !payToEmail)) {
    return NextResponse.json(
      {
        error: "Missing SumUp configuration. Set SUMUP_API_KEY and either SUMUP_MERCHANT_CODE or SUMUP_PAY_TO_EMAIL.",
      },
      { status: 500 },
    );
  }

  let body: CreateCheckoutBody;
  try {
    body = (await request.json()) as CreateCheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const amount = Number(body.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0." }, { status: 400 });
  }

  const baseUrl = getBaseUrl(request);
  const checkoutReference = `collectra-${Date.now()}`;
  const sumupBase = (process.env.SUMUP_API_BASE?.trim() || "https://api.sumup.com").replace(/\/$/, "");

  const payload = {
    checkout_reference: checkoutReference,
    amount: Number(amount.toFixed(2)),
    currency: body.currency || "GBP",
    merchant_code: merchantCode,
    pay_to_email: payToEmail,
    description: body.description || "Collectra card order",
    // `hosted_checkout.enabled` is required for SumUp to return a hosted checkout URL.
    hosted_checkout: { enabled: true },
    redirect_url: `${baseUrl}/checkout/success`,
    return_url: `${baseUrl}/checkout/success`,
  };

  const response = await fetch(`${sumupBase}/v0.1/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(
      {
        error: data?.message || "Unable to create SumUp checkout.",
        details: data,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    checkoutId: data.id,
    checkoutReference,
    checkoutUrl: data.hosted_checkout_url,
  });
}
