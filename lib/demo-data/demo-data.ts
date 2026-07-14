import type {
  Brand,
  Card,
  CardSet,
  CollectionCard,
  Parallel,
  Player,
  Team,
  UserCollection,
  WishlistItem,
} from "@/lib/models";

// TODO: Temporary demo data. Swap out with real Prisma data later.

export const brands: Brand[] = [
  {
    id: "brand-panini",
    name: "Panini",
    country: "Italy",
    establishedYear: 1961,
    description: "A leading trading card publisher with premium football product lines.",
    website: "https://www.panini.com",
  },
  {
    id: "brand-topps",
    name: "Topps",
    country: "USA",
    establishedYear: 1938,
    description: "A heritage sports card brand known for iconic sets.",
    website: "https://www.topps.com",
  },
];

export const teams: Team[] = [
  {
    id: "team-liverpool",
    name: "Liverpool FC",
    city: "Liverpool",
    abbreviation: "LIV",
    league: "Premier League",
    country: "England",
    logoUrl: "https://example.com/logos/liverpool.png",
  },
  {
    id: "team-man-city",
    name: "Manchester City FC",
    city: "Manchester",
    abbreviation: "MCI",
    league: "Premier League",
    country: "England",
    logoUrl: "https://example.com/logos/man-city.png",
  },
];

export const players: Player[] = [
  {
    id: "player-salah",
    firstName: "Mohamed",
    lastName: "Salah",
    fullName: "Mohamed Salah",
    teamId: "team-liverpool",
    position: "Forward",
    nationality: "Egypt",
    dateOfBirth: "1992-06-15",
    imageUrl: "https://example.com/players/salah.png",
  },
  {
    id: "player-kdb",
    firstName: "Kevin",
    lastName: "De Bruyne",
    fullName: "Kevin De Bruyne",
    teamId: "team-man-city",
    position: "Midfielder",
    nationality: "Belgium",
    dateOfBirth: "1991-06-28",
    imageUrl: "https://example.com/players/kdb.png",
  },
];


export const parallels: Parallel[] = [
  { id: "parallel-regular", name: "Regular", description: "Standard release.", color: "#94a3b8" },
  { id: "parallel-silver", name: "Silver", description: "Silver parallel.", color: "#cbd5e1" },
  { id: "parallel-black", name: "Black", description: "Black parallel.", color: "#000000" },
];

export const cardSets: CardSet[] = [
  {
    id: "set-premier-league-chrome-2024",
    title: "2024 Premier League Chrome",
    brandId: "brand-panini",
    productLine: "Chrome",
    year: 2024,
    sport: "Football",
    releaseDate: "2024-03-01",
    totalCards: 18,
    description: "A premium Panini Premier League Chrome set for 2024.",
    imageUrl: "https://example.com/sets/plc-2024.png",
    cardIds: ["card-salah-21", "card-kdb-17"],
  },
];

export const cards: Card[] = [
  {
    id: "card-salah-21",
    setId: "set-premier-league-chrome-2024",
    cardNumber: "21",
    playerId: "player-salah",
    teamId: "team-liverpool",
    season: "2023-24",
    brandId: "brand-panini",
    productLine: "Chrome",
    parallelId: "parallel-silver",
    serialNumber: "123/299",
    autograph: false,
    relic: false,
    imageFront: "https://example.com/cards/salah-front.png",
    imageBack: "https://example.com/cards/salah-back.png",
    description: "Mohamed Salah Premier League Chrome card.",
    marketValue: 65,
  },
  {
    id: "card-kdb-17",
    setId: "set-premier-league-chrome-2024",
    cardNumber: "17",
    playerId: "player-kdb",
    teamId: "team-man-city",
    season: "2023-24",
    brandId: "brand-panini",
    productLine: "Chrome",
    parallelId: "parallel-regular",
    serialNumber: "",
    autograph: false,
    relic: false,
    imageFront: "https://example.com/cards/kdb-front.png",
    imageBack: "https://example.com/cards/kdb-back.png",
    description: "Kevin De Bruyne Premier League Chrome card.",
    marketValue: 38,
  },
];

export const userCollections: UserCollection[] = [
  {
    id: "collection-tom-primary",
    userId: "user-tom",
    name: "Tom's Collection",
    description: "Primary collection for tracking cards and sets.",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-06-10T14:00:00Z",
    items: [
      {
        id: "collectioncard-1",
        collectionId: "collection-tom-primary",
        cardId: "card-salah-21",
        quantity: 1,
        condition: "Near Mint",
        grade: "PSA 10",
        acquiredAt: "2024-05-12T12:00:00Z",
        notes: "Single-signed insert.",
        estimatedValue: 65,
      },
    ],
  },
];

export const wishlistItems: WishlistItem[] = [
  {
    id: "wishlist-1",
    userId: "user-tom",
    cardId: "card-kdb-17",
    priority: 1,
    notes: "Need this for the set completion.",
    createdAt: "2024-06-10T14:00:00Z",
  },
];
