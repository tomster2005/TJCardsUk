import Link from "next/link";
import { Layout } from "@/components/Layout";

export default function CheckoutCancelPage() {
  return (
    <Layout>
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-slate-300/55 bg-white/92 p-10 shadow-[0_20px_48px_rgba(15,23,42,0.09)]">
        <p className="text-xs uppercase tracking-[0.34em] text-amber-700">Checkout</p>
        <h1 className="mt-2 text-4xl font-semibold text-zinc-900">Payment cancelled</h1>
        <p className="mt-4 text-zinc-700">No payment was taken. Your cart is still saved so you can try again whenever you are ready.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/cart" className="rounded-full border border-amber-400/40 bg-amber-100/90 px-5 py-2.5 text-sm font-semibold text-amber-900">
            Return to cart
          </Link>
          <Link href="/catalogue" className="rounded-full border border-slate-300/70 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800">
            Continue shopping
          </Link>
        </div>
      </section>
    </Layout>
  );
}
