import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions – Collectra",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-16" style={{ background: "linear-gradient(160deg, #0d0d0f 0%, #1a0e06 40%, #0d0d0f 100%)" }}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <Link href="/" className="text-sm text-[rgba(200,155,60,0.7)] hover:text-[#c89b3c]">← Back to Collectra</Link>
          <h1 className="mt-4 text-4xl font-black text-white">Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.4)]">Last updated: 18 August 2026. These terms govern your use of Collectra and all associated services.</p>
        </div>

        <div className="space-y-8 text-[rgba(255,255,255,0.75)] text-sm leading-relaxed">

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">1. About Us</h2>
            <p>Collectra (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a trading card marketplace and collector platform.</p>
            <div className="mt-3 rounded-xl border border-[rgba(200,155,60,0.2)] bg-[rgba(200,155,60,0.05)] px-4 py-3 text-[rgba(255,255,255,0.6)]">
              <p><strong className="text-white">Collectra</strong></p>
              <p className="mt-1">61 Bridge Street, Kington, HR5 3DJ, United Kingdom</p>
              <p className="mt-1">Email: <span className="text-[#c89b3c]">support@collectrauk.co.uk</span></p>
            </div>
            <p className="mt-3">By creating an account or using our platform you agree to these Terms &amp; Conditions in full. If you do not agree, you must not use the platform. Nothing in these Terms affects your statutory rights as a consumer.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">2. Eligibility</h2>
            <p>You must be at least 13 years old to create an account. If you are under 18, you confirm that a parent or guardian has consented to your use of the platform and is aware of these terms. We reserve the right to request proof of age at any time and to suspend accounts where eligibility cannot be confirmed.</p>
            <p className="mt-2">Purchases are only available to users aged 18 or over, or to under-18s with the active involvement of a parent or guardian. Collection and binder features are available to all eligible account holders.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">3. Account Registration</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>You must provide accurate, current, and complete information when registering.</li>
              <li>You are responsible for maintaining the confidentiality of your password and for all activity that occurs under your account.</li>
              <li>You must notify us immediately of any unauthorised use of your account at <span className="text-[#c89b3c]">support@collectrauk.co.uk</span>.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms, contain false information, or are used for fraudulent purposes.</li>
              <li>One account per person. Creating multiple accounts to circumvent bans or restrictions is prohibited.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">4. Community Binder &amp; Image Uploads</h2>
            <p className="mb-2">Collectra features a community binder where users can upload card images to contribute to a shared catalogue. By uploading any image to the platform you:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong className="text-white">Grant Collectra a perpetual, worldwide, royalty-free, non-exclusive licence</strong> to use, reproduce, display, distribute, and adapt the image for any purpose connected with the operation, promotion, or improvement of the platform, including displaying the image in the community binder, card catalogue, marketing materials, and social media.</li>
              <li>Confirm that you own the image or have the right to grant the above licence, and that the image does not infringe any third-party intellectual property rights.</li>
              <li>Acknowledge that card artwork, logos, and branding depicted on cards remain the intellectual property of their respective owners (e.g. Panini, Topps, Disney). You are uploading a photograph of a physical card you own — not claiming ownership of the underlying artwork.</li>
              <li>Agree that we may moderate, reject, or remove any uploaded image at our sole discretion.</li>
            </ul>
            <p className="mt-3">Where catalogue contributions have been incorporated into Collectra&apos;s shared card database, they may continue to be used under the licence granted above after you close your account. This does not affect any rights you may have under applicable data protection law, including your right to request deletion of personal data.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">5. Purchasing Cards</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>All prices are displayed in GBP (£) and include VAT where applicable.</li>
              <li>By placing an order you are making a binding offer to purchase the item(s) at the stated price. Your order is accepted when we send an order confirmation.</li>
              <li>We reserve the right to cancel any order at our discretion — for example if a card is found to be damaged, mislisted, or out of stock. A full refund will be issued in such cases.</li>
              <li>Payment is processed securely via SumUp. We do not store your card details.</li>
              <li>Ownership of goods passes to you once payment has been received in full and the goods have been delivered to you.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">6. Shipping &amp; Delivery</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>We aim to dispatch orders within 2–3 working days of payment confirmation.</li>
              <li>Delivery times are estimates only and are not guaranteed.</li>
              <li><strong className="text-white">Goods remain our responsibility until they are delivered to you</strong> or another person you have identified to receive them. If your order is lost or damaged in transit, please contact us at <span className="text-[#c89b3c]">support@collectrauk.co.uk</span> and we will investigate and arrange an appropriate replacement or refund.</li>
              <li>We currently ship within the United Kingdom only unless otherwise stated at checkout.</li>
              <li>If a parcel is returned to us as undeliverable due to an incorrect address provided by you, re-delivery charges may apply.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">7. Returns &amp; Refunds</h2>
            <p className="mb-2">Please read our full <Link href="/returns" className="text-[#c89b3c] hover:underline">Returns Policy</Link> for complete details.</p>
            <p className="mb-3 rounded-xl border border-[rgba(200,155,60,0.2)] bg-[rgba(200,155,60,0.05)] px-4 py-3">
              <strong className="text-white">Nothing in this Returns Policy affects your statutory rights</strong> where goods are faulty, damaged, not as described, or otherwise fail to conform to the Consumer Rights Act 2015. Those rights exist independently of and in addition to our returns policy.
            </p>
            <p className="mb-2 font-semibold text-white">Change-of-mind returns</p>
            <ul className="list-disc space-y-1.5 pl-5 mb-4">
              <li>You have 14 days from receipt of your order to request a return without giving a reason, in line with the Consumer Contracts Regulations 2013.</li>
              <li>You may open and inspect goods as you would reasonably be permitted to in a shop. However, if you handle the card beyond what is necessary to inspect it and this reduces its value, we may make a proportionate deduction from your refund.</li>
              <li>Cards must be returned to us securely packaged. Return postage is at your cost for change-of-mind returns.</li>
              <li>We inspect every returned card upon receipt. Refunds are processed within 14 days of us receiving the return.</li>
            </ul>
            <p className="mb-2 font-semibold text-white">Faulty, damaged, or misdescribed goods</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>If a card arrives damaged, is not as described, or is otherwise not of satisfactory quality, you have rights under the Consumer Rights Act 2015 including the right to a repair, replacement, or refund.</li>
              <li>Please contact us within 30 days of delivery with photographs. We will cover return postage costs in these cases.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">8. Card Condition &amp; Grading</h2>
            <p>We describe card condition honestly and to the best of our ability. All cards are human-graded and condition descriptions are subjective. Images provided are of the actual card where possible. If you believe a card has been materially misdescribed, please contact us — this is covered by your statutory rights under the Consumer Rights Act 2015.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">9. Prohibited Conduct</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Use the platform for any unlawful purpose or in violation of any applicable law or regulation.</li>
              <li>Upload images that are offensive, defamatory, obscene, or infringe third-party rights.</li>
              <li>Attempt to gain unauthorised access to any part of the platform or its infrastructure.</li>
              <li>Scrape, crawl, or systematically extract data from the platform without our written consent.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
              <li>Engage in any conduct that disrupts or interferes with the platform&apos;s normal operation.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">10. Intellectual Property</h2>
            <p>All content on the Collectra platform — including the name, logo, design, software, and original written content — is owned by or licensed to Collectra. You may not reproduce, distribute, or create derivative works from our content without prior written permission. User-uploaded images remain subject to the licence granted in Section 4.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">11. Privacy &amp; Data</h2>
            <p>We collect and process personal data in accordance with our Privacy Policy and applicable UK data protection law, including the UK GDPR and the Data Protection Act 2018. We process your data on appropriate lawful bases — for example, processing your delivery details to fulfil your order is necessary for the performance of a contract, not reliant on consent.</p>
            <p className="mt-2">A full Privacy Policy — covering what we collect, why, our lawful bases, retention periods, who we share data with, and your rights including the right to access, correct, or request deletion of your data — will be published separately prior to launch. To exercise any data rights in the meantime, contact us at <span className="text-[#c89b3c]">support@collectrauk.co.uk</span>. You also have the right to lodge a complaint with the <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-[#c89b3c] hover:underline">ICO</a>.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">12. Limitation of Liability</h2>
            <p className="mb-2 rounded-xl border border-[rgba(200,155,60,0.2)] bg-[rgba(200,155,60,0.05)] px-4 py-3"><strong className="text-white">Nothing in these Terms excludes or limits any liability that cannot lawfully be excluded or limited, or affects your statutory rights as a consumer.</strong> This includes liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded by law.</p>
            <p>Subject to the above, and to the fullest extent permitted by law, our total liability to you in connection with any order shall not exceed the value of that order. We are not liable for indirect or consequential losses that were not foreseeable to both parties when the contract was formed.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">13. Changes to These Terms</h2>
            <p>We may update these Terms &amp; Conditions at any time. We will notify registered users of material changes by email or by a notice on the platform. Continued use of the platform after changes are posted constitutes your acceptance of the revised terms.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">14. Governing Law</h2>
            <p>These terms are governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales. If you are a consumer resident in Scotland or Northern Ireland, you may also bring proceedings in the courts of your home jurisdiction.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">15. Contact &amp; Complaints</h2>
            <p>If you have any questions, complaints, or wish to exercise any rights under these terms, please contact us:</p>
            <div className="mt-3 rounded-xl border border-[rgba(200,155,60,0.2)] bg-[rgba(200,155,60,0.05)] px-4 py-3 text-[rgba(255,255,255,0.6)]">
              <p><strong className="text-white">Collectra</strong></p>
              <p className="mt-1">61 Bridge Street, Kington, HR5 3DJ, United Kingdom</p>
              <p className="mt-1">Email: <span className="text-[#c89b3c]">support@collectrauk.co.uk</span></p>
              <p className="mt-1 text-xs text-[rgba(255,255,255,0.4)]">We aim to respond to all enquiries within 2 working days.</p>
            </div>
          </section>

        </div>

        <div className="mt-12 border-t border-[rgba(200,155,60,0.15)] pt-8 text-center">
          <Link href="/returns" className="text-sm text-[#c89b3c] hover:underline">View our Returns Policy →</Link>
        </div>
      </div>
    </div>
  );
}
