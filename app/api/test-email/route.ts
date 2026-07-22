import { NextResponse } from "next/server";
import { sendOrderConfirmation, sendAdminOrderAlert } from "@/lib/email";

const MOCK_ITEMS = [{ cardId: "test-1", playerName: "Erling Haaland", quantity: 1, price: 4.99 }];
const MOCK_SHIPPING = {
  fullName: "Test Customer",
  email: "test@example.com",
  addressLine1: "123 Test Street",
  city: "London",
  postcode: "SW1A 1AA",
  shippingRate: { id: "tracked48", label: "Tracked 48", price: 2.85 },
};

export async function GET() {
  console.log("[test-email] RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);
  console.log("[test-email] key prefix:", process.env.RESEND_API_KEY?.slice(0, 8));

  const results = await Promise.allSettled([
    sendOrderConfirmation(MOCK_ITEMS, MOCK_SHIPPING, 7.84),
    sendAdminOrderAlert(MOCK_ITEMS, MOCK_SHIPPING, 7.84),
  ]);

  console.log("[test-email] results:", JSON.stringify(results, null, 2));

  return NextResponse.json({ results });
}
