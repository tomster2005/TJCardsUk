"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CatalogueCard } from "@/lib/demo-data/catalogue";
import getBrowserSupabase from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CollectionCondition } from "@/lib/collection/types";
import { ArrowUpIcon, CollectionIcon, SearchIcon, SparkleIcon } from "@/components/ui/icons";
import { useCart } from "@/contexts/CartContext";
import { formatGBP } from "@/lib/currency";

type CatalogueCardDetailProps = {
  card: CatalogueCard;
  relatedCards?: Array<{
    id: string;
    playerName: string;
    cardNumber: string;
    price: number;
    availableQuantity?: number;
    imageUrl?: string;
    setSlug: string;
    cardSlug: string;
  }>;
};

function getBadgeClass(status: string) {
  if (status === "In stock") {
    return "border-emerald-400/30 bg-emerald-100/90 text-emerald-800";
  }

  if (status === "Low stock") {
    return "border-amber-400/35 bg-amber-100/90 text-amber-800";
  }

  return "border-rose-400/30 bg-rose-100/90 text-rose-700";
}

function displayValue(value: string | number | undefined | null, fallback = "Not available") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

export function CatalogueCardDetail({ card, relatedCards = [] }: CatalogueCardDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();
  const [showBack, setShowBack] = useState(false);
  const [justAddedToCart, setJustAddedToCart] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [collectionSuccess, setCollectionSuccess] = useState<string | null>(null);
  const [existingCollectionEntries, setExistingCollectionEntries] = useState<any[]>([]);
  const [isLoadingOwnership, setIsLoadingOwnership] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<CollectionCondition>("Near Mint");
  const [gradingCompany, setGradingCompany] = useState("");
  const [grade, setGrade] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<number>(Number(card.price ?? 0));
  const [estimatedValue, setEstimatedValue] = useState<number>(Number(card.estimatedValue ?? card.price ?? 0));
  const [notes, setNotes] = useState("");

  const displayPrice = Number(card.price ?? 0);
  const displayMarketValue = Number(card.estimatedValue ?? 0);
  const displayPrintRun = card.printRun ? String(card.printRun).startsWith("/") ? String(card.printRun) : `/${card.printRun}` : null;
  const hasBackImage = Boolean(card.backImageUrl);
  const cardLabel = `${displayValue(card.playerName, "Card")} #${displayValue(card.cardNumber, "?")}`;
  const setLabel = displayValue(card.setName, "Unknown set");
  const hasStockCap = typeof card.availableQuantity === "number";
  const availableQuantity = hasStockCap ? Math.max(0, Number(card.availableQuantity)) : Number.POSITIVE_INFINITY;
  const inCartQuantity = cart.getItemQuantity(card.id);
  const isOutOfStock = hasStockCap ? availableQuantity <= 0 || card.stockStatus === "Out of stock" : card.stockStatus === "Out of stock";
  const reachedStockLimit = hasStockCap && !isOutOfStock && inCartQuantity >= availableQuantity;

  useEffect(() => {
    let mounted = true;

    const loadOwnership = async () => {
      if (!user?.id || !card.id) {
        setExistingCollectionEntries([]);
        return;
      }

      const supabase = getBrowserSupabase();
      if (!supabase) return;

      setIsLoadingOwnership(true);

      const { data } = await supabase
        .from("user_collections")
        .select("*")
        .eq("user_id", user.id)
        .eq("card_id", card.id)
        .order("date_added", { ascending: false });

      if (!mounted) return;
      setExistingCollectionEntries(data ?? []);
      setIsLoadingOwnership(false);
    };

    loadOwnership();

    return () => {
      mounted = false;
    };
  }, [user?.id, card.id]);

  const ownershipSummary = useMemo(() => {
    if (existingCollectionEntries.length === 0) return null;

    const totalQuantity = existingCollectionEntries.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
    const latest = [...existingCollectionEntries].sort(
      (a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime(),
    )[0];

    const weightedPurchaseTotal = existingCollectionEntries.reduce((sum, entry) => {
      return sum + Number(entry.purchase_price ?? 0) * Number(entry.quantity || 0);
    }, 0);
    const avgPurchase = totalQuantity > 0 ? weightedPurchaseTotal / totalQuantity : 0;

    const weightedEstimatedTotal = existingCollectionEntries.reduce((sum, entry) => {
      return sum + Number(entry.estimated_value ?? card.estimatedValue ?? card.price ?? 0) * Number(entry.quantity || 0);
    }, 0);
    const avgEstimated = totalQuantity > 0 ? weightedEstimatedTotal / totalQuantity : 0;

    return {
      totalQuantity,
      avgPurchase,
      avgEstimated,
      latest,
      entries: existingCollectionEntries.length,
    };
  }, [existingCollectionEntries, card.estimatedValue, card.price]);

  const collectionConditions: CollectionCondition[] = ["Mint", "Near Mint", "Excellent", "Very Good", "Good", "Fair", "Poor"];

  async function handleAddToCollection() {
    if (!user?.id) {
      router.push("/login");
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setCollectionError("Collection service is unavailable right now.");
      return;
    }

    setIsSavingCollection(true);
    setCollectionError(null);
    setCollectionSuccess(null);

    const payload = {
      user_id: user.id,
      card_id: card.id,
      quantity: Math.max(1, Number(quantity || 1)),
      condition,
      grading_company: gradingCompany.trim() || null,
      grade: grade.trim() || null,
      purchase_price: Number.isFinite(purchasePrice) ? Number(purchasePrice) : null,
      estimated_value: Number.isFinite(estimatedValue) ? Number(estimatedValue) : null,
      notes: notes.trim() || null,
      favourite: false,
      for_trade: false,
      for_sale: false,
    };

    const { data, error } = await supabase.from("user_collections").insert([payload]).select("*");

    if (error) {
      setCollectionError("Unable to add this card to your collection. Please try again.");
      setIsSavingCollection(false);
      return;
    }

    setExistingCollectionEntries((prev) => [...(data ?? []), ...prev]);
    setCollectionSuccess("Card added to your collection.");
    setIsSavingCollection(false);
    setIsModalOpen(false);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-300/50 bg-white/92 p-7 shadow-[0_24px_52px_rgba(15,23,42,0.1)] sm:p-10">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
          <Link href="/catalogue" className="rounded-full border border-slate-300/70 bg-white px-3 py-1.5 text-zinc-700 transition hover:bg-slate-50">
            <span className="inline-flex items-center gap-2"><SearchIcon className="h-3.5 w-3.5" />Catalogue</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="rounded-full border border-slate-300/70 bg-white/70 px-3 py-1.5">{setLabel}</span>
          <span className="text-zinc-600">/</span>
          <span className="rounded-full border border-amber-300/45 bg-amber-100/90 px-3 py-1.5 text-amber-900">{cardLabel}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-amber-700">Card detail</p>
            <h1 className="mt-2 text-4xl font-semibold text-zinc-900">{displayValue(card.playerName, "Unknown player")}</h1>
            <p className="mt-2 text-sm text-zinc-600">{displayValue(card.brand, "Unknown brand")} · {setLabel}</p>
          </div>
          <Link href="/catalogue" className="rounded-full border border-slate-300/70 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-slate-50">
            <span className="inline-flex items-center gap-2"><ArrowUpIcon className="h-3.5 w-3.5 rotate-[-90deg]" />Back to catalogue</span>
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${getBadgeClass(card.stockStatus)}`}>
            {card.stockStatus}
          </span>
          {card.isOneOfOne ? <span className="rounded-full border border-sky-400/35 bg-sky-100/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-800">1/1</span> : null}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[auto_1fr]">
          <div className="rounded-[2rem] border border-slate-300/50 bg-[#faf8f2]/95 p-4">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-br from-slate-100 via-white to-zinc-100 max-w-[300px] mx-auto">
              {card.imageUrl || card.backImageUrl ? (
                <div className="relative aspect-[2/3] max-h-[400px] mx-auto overflow-hidden rounded-[1.25rem] p-4">
                  <img src={showBack ? card.backImageUrl ?? card.imageUrl : card.imageUrl ?? card.backImageUrl} alt={`${displayValue(card.playerName, "Card")} ${showBack ? "back" : "front"} card`} className={`h-full w-full rounded-xl object-contain ${showBack ? "rotate-180" : ""}`} />
                </div>
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <p className="text-sm uppercase tracking-[0.25em]">Placeholder</p>
                    <p className="mt-2 text-lg font-medium text-zinc-600">Artwork preview</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={() => setShowBack((value) => !value)} className="rounded-full border border-amber-400/40 bg-amber-100/90 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200/80">
                {showBack ? "Show front image" : hasBackImage ? "Flip to back image" : "Flip to back image (placeholder)"}
              </button>
            </div>


          </div>

          <div className="rounded-[2rem] border border-slate-300/50 bg-white/90 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Price</p>
                <p className="mt-2 text-4xl font-semibold text-amber-700">{formatGBP(displayPrice)}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setIsModalOpen(true)} className="rounded-full border border-amber-400/40 bg-amber-100/90 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-200/80">
                <span className="inline-flex items-center gap-2"><CollectionIcon className="h-4 w-4" />Add to Collection</span>
              </button>
                <button
                  type="button"
                  disabled={isOutOfStock || reachedStockLimit}
                  onClick={() => {
                    if (isOutOfStock || reachedStockLimit) return;
                    setJustAddedToCart(true);
                    window.setTimeout(() => setJustAddedToCart(false), 900);
                    cart.addToCart({
                      id: card.id,
                      playerName: card.playerName,
                      cardNumber: card.cardNumber,
                      price: card.price,
                      imageUrl: card.imageUrl,
                      availableQuantity: hasStockCap ? availableQuantity : undefined,
                    });
                  }}
                  className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                    isOutOfStock || reachedStockLimit
                      ? "cursor-not-allowed border-slate-300/70 bg-slate-100/85 text-zinc-500"
                      : justAddedToCart
                      ? "animate-added-chip border-emerald-400/45 bg-emerald-100/95 text-emerald-900"
                      : "border-amber-400/40 bg-amber-100/90 text-amber-900 hover:bg-amber-200/80"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {isOutOfStock ? "Out of stock" : reachedStockLimit ? "Max quantity reached" : justAddedToCart ? "Added to cart" : "Add to Cart"}
                  </span>
                </button>
            </div>

            {collectionSuccess ? (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{collectionSuccess}</div>
            ) : null}

            {collectionError ? (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{collectionError}</div>
            ) : null}

            {isLoadingOwnership ? (
              <div className="mt-6 rounded-[1.5rem] border border-slate-300/60 bg-white/85 p-5 text-sm text-zinc-600 skeleton-shimmer">Loading collection ownership…</div>
            ) : ownershipSummary ? (
              <div className="mt-6 rounded-[1.5rem] border border-amber-300/45 bg-amber-100/40 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-700">In your collection</p>
                <dl className="mt-3 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-300/60 bg-white/85 p-3">
                    <dt className="text-zinc-500">Quantity owned</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{ownershipSummary.totalQuantity}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-300/60 bg-white/85 p-3">
                    <dt className="text-zinc-500">Entries</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{ownershipSummary.entries}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-300/60 bg-white/85 p-3">
                    <dt className="text-zinc-500">Avg purchase price</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{formatGBP(Number(ownershipSummary.avgPurchase.toFixed(2)))}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-300/60 bg-white/85 p-3">
                    <dt className="text-zinc-500">Avg estimated value</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{formatGBP(Number(ownershipSummary.avgEstimated.toFixed(2)))}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-300/60 bg-white/85 p-3">
                    <dt className="text-zinc-500">Condition</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{displayValue(ownershipSummary.latest?.condition)}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-300/60 bg-white/85 p-3">
                    <dt className="text-zinc-500">Grade</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{displayValue(ownershipSummary.latest?.grade)}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-300/60 bg-white/85 p-3 sm:col-span-2">
                    <dt className="text-zinc-500">Date added</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{new Date(ownershipSummary.latest?.date_added ?? Date.now()).toLocaleDateString()}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-300/60 bg-white/85 p-3 sm:col-span-2">
                    <dt className="text-zinc-500">Notes</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{displayValue(ownershipSummary.latest?.notes)}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            <div className="mt-8 rounded-[1.5rem] border border-slate-300/60 bg-[#f8f5ee]/90 p-5">
              <dl className="grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-3">
                  <dt className="text-zinc-500">Player</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{displayValue(card.playerName)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-3">
                  <dt className="text-zinc-500">Card number</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">#{displayValue(card.cardNumber, "?")}</dd>
                </div>
                {card.team && String(card.team).trim() && (
                  <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-3">
                    <dt className="text-zinc-500">Team</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{card.team}</dd>
                  </div>
                )}
                {card.brand && String(card.brand).trim() && (
                  <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-3">
                    <dt className="text-zinc-500">Brand</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{card.brand}</dd>
                  </div>
                )}
                <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-3">
                  <dt className="text-zinc-500">Set</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{setLabel}</dd>
                </div>
                {card.season && String(card.season).trim() && (
                  <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-3">
                    <dt className="text-zinc-500">Season</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{card.season}</dd>
                  </div>
                )}
                {card.parallel && String(card.parallel).trim() && (
                  <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-3">
                    <dt className="text-zinc-500">Parallel</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{card.parallel}</dd>
                  </div>
                )}
                {displayPrintRun && (
                  <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-3">
                    <dt className="text-zinc-500">Print run</dt>
                    <dd className="mt-1 font-semibold text-zinc-900">{displayPrintRun}</dd>
                  </div>
                )}
                <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-3">
                  <dt className="text-zinc-500">Stock status</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{card.stockStatus}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-300/60 bg-white/88 p-5 text-sm leading-7 text-zinc-600">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-700">About this card</p>
              <p className="mt-3">{card.description || "No description has been added yet."}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-300/50 bg-white/92 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.09)] sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-zinc-900"><SparkleIcon className="h-4 w-4" />More from this set</h2>
          <span className="rounded-full border border-slate-300/70 px-3 py-1 text-xs uppercase tracking-[0.25em] text-zinc-600">{relatedCards.length} cards</span>
        </div>

        {relatedCards.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-300/60 bg-white/80 p-5 text-sm text-zinc-600">No other published cards from this set yet.</div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedCards.map((item) => (
              <Link key={item.id} href={`/catalogue/${item.setSlug}/${item.cardSlug}`} className="group rounded-2xl border border-slate-300/60 bg-white/88 p-3 transition hover:border-amber-300/50 hover:bg-white card-lift">
                <div className="h-56 overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-100 to-zinc-100">
                  {item.imageUrl ? <img src={item.imageUrl} alt={`${item.playerName} card`} className="h-full w-full object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-zinc-500">Placeholder</div>}
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-900">{item.playerName}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-zinc-600">
                  <span>#{item.cardNumber}</span>
                  <span className="font-semibold text-amber-700">{formatGBP(Number(item.price ?? 0))}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-300/60 bg-white/96 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Collection</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-900">Add to Collection</h3>
                <p className="mt-2 text-sm text-zinc-600">{cardLabel}</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-slate-300/70 bg-white px-3 py-1.5 text-sm text-zinc-700">
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-zinc-700">Quantity</span>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-zinc-700">Condition</span>
                <select value={condition} onChange={(event) => setCondition(event.target.value as CollectionCondition)} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none">
                  {collectionConditions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-zinc-700">Grading company</span>
                <input value={gradingCompany} onChange={(event) => setGradingCompany(event.target.value)} placeholder="PSA, BGS, SGC..." className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>

              <label className="block">
                <span className="text-sm text-zinc-700">Grade</span>
                <input value={grade} onChange={(event) => setGrade(event.target.value)} placeholder="10, 9.5, Raw..." className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>

              <label className="block">
                <span className="text-sm text-zinc-700">Purchase price</span>
                <input type="number" min={0} step="0.01" value={purchasePrice} onChange={(event) => setPurchasePrice(Number(event.target.value) || 0)} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>

              <label className="block">
                <span className="text-sm text-zinc-700">Estimated value</span>
                <input type="number" min={0} step="0.01" value={estimatedValue} onChange={(event) => setEstimatedValue(Number(event.target.value) || 0)} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm text-zinc-700">Notes</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Optional notes..." className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-slate-300/70 bg-white px-4 py-2 text-sm font-semibold text-zinc-700">
                Cancel
              </button>
              <button type="button" onClick={handleAddToCollection} disabled={isSavingCollection} className="rounded-full border border-amber-400/40 bg-amber-100/90 px-4 py-2 text-sm font-semibold text-amber-900 disabled:cursor-not-allowed disabled:opacity-60">
                {isSavingCollection ? "Saving..." : "Save to Collection"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
