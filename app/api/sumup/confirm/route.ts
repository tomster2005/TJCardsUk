import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = process.env.SUMUP_API_KEY?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing SUMUP_API_KEY." }, { status: 500 });
  }

  const checkoutId = request.nextUrl.searchParams.get("checkoutId")?.trim();
  if (!checkoutId) {
    return NextResponse.json({ error: "checkoutId is required." }, { status: 400 });
  }

  const sumupBase = (process.env.SUMUP_API_BASE?.trim() || "https://api.sumup.com").replace(/\/$/, "");
  const response = await fetch(`${sumupBase}/v0.1/checkouts/${encodeURIComponent(checkoutId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(
      {
        error: data?.message || "Unable to confirm SumUp checkout.",
        details: data,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    checkoutId,
    status: data?.status || "UNKNOWN",
    amount: data?.amount,
    currency: data?.currency,
    raw: data,
  });
}
