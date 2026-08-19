import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns Policy – Collectra",
  robots: { index: false, follow: false },
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen px-4 py-16" style={{ background: "linear-gradient(160deg, #0d0d0f 0%, #1a0e06 40%, #0d0d0f 100%)" }}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <Link href="/" className="text-sm text-[rgba(200,155,60,0.7)] hover:text-[#c89b3c]">← Back to Collectra</Link>
          <h1 className="mt-4 text-4xl font-black text-white">Returns Policy</h1>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.4)]">Last updated: 18 August 2026. Please read this policy carefully before requesting a return.</p>
        </div>

        <div className="space-y-8 text-[rgba(255,255,255,0.75)] text-sm leading-relaxed">

          <section>
            <div className="rounded-xl border border-[rgba(200,155,60,0.3)] bg-[rgba(200,155,60,0.07)] px-4 py-4">
              <p className="font-semibold text-white">Your statutory rights are not affected by this policy.</p>
              <p className="mt-1 text-[rgba(255,255,255,0.6)]">Nothing in this Returns Policy limits or replaces your rights under the Consumer Rights Act 2015, the Consumer Contracts Regulations 2013, or any other applicable UK consumer protection law. If goods are faulty, not as described, or not of satisfactory quality, your statutory rights apply regardless of the conditions below.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">1. Change-of-Mind Returns (Consumer Contracts Regulations 2013)</h2>
            <p className="mb-2">Because you bought online, you have the right to cancel your order within <strong className="text-white">14 days of receiving your goods</strong> without giving a reason.</p>
            <p className="mb-3">To exercise this right:</p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Contact us within 14 days of delivery at <span className="text-[#c89b3c]">support@collectrauk.co.uk</span> with your order number.</li>
              <li>We will respond within 2 working days with return instructions and our return address.</li>
              <li>Return the item(s) to us within 14 days of notifying us.</li>
            </ol>
            <p className="mt-3 text-[rgba(255,255,255,0.5)] text-xs">Return postage for change-of-mind returns is at your cost. We recommend a tracked service — we cannot be responsible for returns lost in transit.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">2. Condition of Returned Cards (Change-of-Mind)</h2>
            <p className="mb-2">You are entitled to open and inspect the card as you would reasonably be permitted to in a shop. However:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>If you handle the card beyond what is necessary for reasonable inspection and this reduces its value, we may make a proportionate deduction from your refund.</li>
              <li>Cards must be returned securely packaged to prevent transit damage — we recommend a rigid card mailer or toploader with bubble wrap.</li>
              <li>Cards must not be written on, marked, or tampered with.</li>
            </ul>
            <p className="mt-3 rounded-xl border border-[rgba(200,155,60,0.2)] bg-[rgba(200,155,60,0.05)] px-4 py-3 text-[rgba(255,255,255,0.6)]">
              <strong className="text-white">Note:</strong> We photograph and document the condition of every card before dispatch. Upon return, each card is inspected against these records. If the condition has changed beyond reasonable inspection handling, we will explain any deduction clearly before applying it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">3. Faulty, Damaged, or Misdescribed Goods (Consumer Rights Act 2015)</h2>
            <p className="mb-2">These are separate and stronger rights that apply regardless of the 14-day window.</p>
            <p className="mb-3">If your card:</p>
            <ul className="list-disc space-y-1.5 pl-5 mb-3">
              <li>Arrives damaged or in worse condition than described</li>
              <li>Is not the card you ordered</li>
              <li>Is materially not as described (e.g. described as Mint but has visible creases)</li>
              <li>Is otherwise not of satisfactory quality</li>
            </ul>
            <p>You have the right under the Consumer Rights Act 2015 to:</p>
            <ul className="list-disc space-y-1.5 pl-5 mt-2">
              <li>A <strong className="text-white">full refund</strong> if you reject the goods within 30 days of delivery</li>
              <li>A <strong className="text-white">repair or replacement</strong> after the 30-day period</li>
              <li>A <strong className="text-white">price reduction or final right to reject</strong> if repair/replacement is not possible</li>
            </ul>
            <p className="mt-3">Please contact us within 30 days of delivery with photographs at <span className="text-[#c89b3c]">support@collectrauk.co.uk</span>. We will cover return postage costs in all such cases.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">4. Goods Lost or Damaged in Transit</h2>
            <p>Goods remain our responsibility until they are delivered to you. If your order is lost or damaged in transit, please contact us at <span className="text-[#c89b3c]">support@collectrauk.co.uk</span> with your order number and we will investigate and arrange an appropriate replacement or refund. You do not need to pursue the carrier directly.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">5. Refund Process &amp; Timelines</h2>
            <div className="space-y-3">
              <div className="rounded-xl border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.05)] px-4 py-3">
                <p className="font-semibold text-emerald-400">Full Refund</p>
                <p className="mt-1 text-[rgba(255,255,255,0.6)]">Card returned in the same condition as dispatched, or goods confirmed faulty/misdescribed. Full purchase price refunded. Original postage refunded only where the return is due to our error.</p>
              </div>
              <div className="rounded-xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.05)] px-4 py-3">
                <p className="font-semibold text-amber-400">Partial Refund</p>
                <p className="mt-1 text-[rgba(255,255,255,0.6)]">Change-of-mind return where the card has been handled beyond reasonable inspection, reducing its value. We will explain the deduction before applying it.</p>
              </div>
              <div className="rounded-xl border border-[rgba(225,29,72,0.2)] bg-[rgba(225,29,72,0.05)] px-4 py-3">
                <p className="font-semibold text-rose-400">Refund Refused</p>
                <p className="mt-1 text-[rgba(255,255,255,0.6)]">Card returned damaged or significantly altered beyond reasonable inspection. We will contact you to explain and arrange return of the card to you at your cost. This does not affect your statutory rights where goods were already faulty.</p>
              </div>
            </div>
            <p className="mt-4">Approved refunds are processed within <strong className="text-white">14 days</strong> of us receiving the return, via the original payment method.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">6. Non-Returnable Items</h2>
            <p className="mb-2">The following cannot be returned under our change-of-mind policy (your statutory rights for faulty/misdescribed goods still apply):</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Cards that have been graded, slabbed, or submitted to a grading service after purchase.</li>
              <li>Digital items or codes redeemed from card packs.</li>
              <li>Items returned outside the 14-day window without prior agreement.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">7. How to Start a Return</h2>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Email <span className="text-[#c89b3c]">support@collectrauk.co.uk</span> with subject: <em>Return Request – Order #[your order number]</em></li>
              <li>Include your name, order number, the card(s) you wish to return, and your reason.</li>
              <li>Wait for our confirmation and return address before sending anything.</li>
              <li>Package the card securely and use a tracked service.</li>
              <li>Email us your tracking number once posted.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">8. Disputes</h2>
            <p>If you are unhappy with the outcome of your return, please reply to our decision email and we will escalate to a senior review. If we cannot resolve the dispute, you may seek advice from <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer" className="text-[#c89b3c] hover:underline">Citizens Advice</a> or refer the matter to an Alternative Dispute Resolution (ADR) scheme. Your statutory rights are not affected.</p>
          </section>

        </div>

        <div className="mt-12 border-t border-[rgba(200,155,60,0.15)] pt-8 text-center">
          <Link href="/terms" className="text-sm text-[#c89b3c] hover:underline">View our Terms &amp; Conditions →</Link>
        </div>
      </div>
    </div>
  );
}
