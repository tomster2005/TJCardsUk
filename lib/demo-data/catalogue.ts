export type CatalogueCard = {
  id: string;
  playerName: string;
  cardNumber: string;
  availableQuantity?: number;
  team: string;
  setName: string;
  brand: string;
  parallel: string;
  price: number;
  stockStatus: "In stock" | "Low stock" | "Out of stock";
  imageUrl?: string;
  backImageUrl?: string;
  description: string;
  season: string;
  condition: string;
  estimatedValue: number;
  marketplacePrice: number;
  printRun?: string | number;
  population: number;
  isOneOfOne: boolean;
};

function buildArtwork(playerName: string, setName: string, variant: "front" | "back" = "front") {
  const safePlayer = playerName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const safeSet = setName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
      <rect width="1200" height="760" rx="48" fill="#0b1120" />
      <rect x="42" y="42" width="1116" height="676" rx="32" fill="url(#g)" stroke="rgba(255,255,255,0.12)" />
      <circle cx="900" cy="220" r="180" fill="rgba(251,191,36,0.2)" />
      <circle cx="300" cy="560" r="220" fill="rgba(239,68,68,0.16)" />
      <text x="100" y="250" fill="#f8fafc" font-size="54" font-family="Arial, sans-serif" font-weight="700">${playerName}</text>
      <text x="100" y="330" fill="#fbbf24" font-size="34" font-family="Arial, sans-serif" font-weight="600">${setName}</text>
      <text x="100" y="530" fill="#cbd5e1" font-size="28" font-family="Arial, sans-serif">${variant === "back" ? "Collector note" : "Collectra public catalogue"}</text>
      <text x="100" y="590" fill="#94a3b8" font-size="24" font-family="Arial, sans-serif">${safePlayer} · ${safeSet}</text>
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="100%" stop-color="#1f2937" />
        </linearGradient>
      </defs>
    </svg>
  `)}`;
}

const catalogueCards: CatalogueCard[] = [];

export function getCatalogueCards(): CatalogueCard[] {
  return catalogueCards;
}

export function getCatalogueCardById(cardId: string): CatalogueCard | undefined {
  return catalogueCards.find((card) => card.id === cardId);
}

export function getCatalogueCardIds() {
  return catalogueCards.map((card) => ({ cardId: card.id }));
}
