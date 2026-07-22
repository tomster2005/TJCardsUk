import { Resend } from "resend";
import { formatGBP } from "@/lib/currency";

const FROM = "Collectra <onboarding@resend.dev>";
const ADMIN_EMAIL = "tjvaluetips@gmail.com";

type OrderItem = { playerName: string; quantity: number; price?: number };
type ShippingDetails = {
  fullName?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  shippingRate?: { label: string; price: number };
};

function orderItemsHtml(items: OrderItem[]) {
  return items.map((i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede6;font-size:14px;color:#1c1917;">${i.playerName}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede6;font-size:14px;color:#6b7280;text-align:center;">×${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede6;font-size:14px;color:#1c1917;text-align:right;">${i.price != null ? formatGBP(i.price * i.quantity) : "—"}</td>
    </tr>
  `).join("");
}

function baseTemplate(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8f6f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#f5d97a,#c89b3c);padding:32px 40px;">
          <p style="margin:0;font-size:22px;font-weight:900;color:#1a0e00;letter-spacing:0.05em;">Collectra</p>
          <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.3em;color:#1a0e00;opacity:0.6;">The Vault</p>
        </div>
        <div style="padding:40px;">
          ${content}
        </div>
        <div style="padding:24px 40px;background:#faf8f4;border-top:1px solid #f0ede6;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© Collectra · TJ Cards UK</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendOrderConfirmation(
  items: OrderItem[],
  shipping: ShippingDetails,
  total: number,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const subtotal = items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
  const shippingCost = shipping.shippingRate?.price ?? 0;

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#1c1917;">Order confirmed! 🎉</h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6b7280;">Thanks ${shipping.fullName ?? "there"}, your cards are on their way.</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;padding-bottom:8px;border-bottom:2px solid #f0ede6;">Item</th>
          <th style="text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;padding-bottom:8px;border-bottom:2px solid #f0ede6;">Qty</th>
          <th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;padding-bottom:8px;border-bottom:2px solid #f0ede6;">Price</th>
        </tr>
      </thead>
      <tbody>${orderItemsHtml(items)}</tbody>
    </table>

    <div style="background:#faf8f4;border-radius:12px;padding:16px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;color:#6b7280;">
        <span>Subtotal</span><span>${formatGBP(subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;color:#6b7280;">
        <span>Shipping (${shipping.shippingRate?.label ?? "Standard"})</span><span>${formatGBP(shippingCost)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;color:#1c1917;border-top:1px solid #f0ede6;padding-top:12px;">
        <span>Total paid</span><span>${formatGBP(total)}</span>
      </div>
    </div>

    <div style="background:#faf8f4;border-radius:12px;padding:16px;">
      <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;">Shipping to</p>
      <p style="margin:0;font-size:14px;color:#1c1917;line-height:1.6;">
        ${shipping.fullName ?? ""}<br>
        ${shipping.addressLine1 ?? ""}${shipping.addressLine2 ? "<br>" + shipping.addressLine2 : ""}<br>
        ${shipping.city ?? ""}<br>
        ${shipping.postcode ?? ""}
      </p>
    </div>
  `;

  // Resend free tier: can only send to account owner email until domain is verified
  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[Customer copy] Order confirmed for ${shipping.email ?? "unknown"} ✓`,
    html: baseTemplate(content),
  });
}

export async function sendAdminOrderAlert(
  items: OrderItem[],
  shipping: ShippingDetails,
  total: number,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const resend = new Resend(apiKey);

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#1c1917;">New order received 📦</h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6b7280;">A customer just completed a purchase. Pack and ship when ready.</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;padding-bottom:8px;border-bottom:2px solid #f0ede6;">Item</th>
          <th style="text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;padding-bottom:8px;border-bottom:2px solid #f0ede6;">Qty</th>
          <th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;padding-bottom:8px;border-bottom:2px solid #f0ede6;">Price</th>
        </tr>
      </thead>
      <tbody>${orderItemsHtml(items)}</tbody>
    </table>

    <div style="background:#faf8f4;border-radius:12px;padding:16px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;color:#1c1917;">
        <span>Total</span><span>${formatGBP(total)}</span>
      </div>
    </div>

    <div style="background:#faf8f4;border-radius:12px;padding:16px;">
      <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;">Ship to</p>
      <p style="margin:0;font-size:14px;color:#1c1917;line-height:1.6;">
        <strong>${shipping.fullName ?? "Unknown"}</strong><br>
        ${shipping.addressLine1 ?? ""}${shipping.addressLine2 ? "<br>" + shipping.addressLine2 : ""}<br>
        ${shipping.city ?? ""}<br>
        ${shipping.postcode ?? ""}<br>
        <span style="color:#6b7280;">${shipping.email ?? ""}</span>
      </p>
      ${shipping.shippingRate ? `<p style="margin:12px 0 0;font-size:13px;font-weight:600;color:#c89b3c;">${shipping.shippingRate.label}</p>` : ""}
    </div>
  `;

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Collectra order — ${formatGBP(total)}`,
    html: baseTemplate(content),
  });
}
