export type CollectionCondition =
  | "Mint"
  | "Near Mint"
  | "Excellent"
  | "Very Good"
  | "Good"
  | "Fair"
  | "Poor";

export type CollectionSort = "dateAddedDesc" | "dateAddedAsc" | "valueHigh" | "valueLow" | "player" | "set";

export type CollectionEntry = {
  id: string;
  user_id: string;
  card_id: string;
  quantity: number;
  condition: string;
  grading_company?: string | null;
  grade?: string | null;
  purchase_price?: number | null;
  estimated_value?: number | null;
  date_added: string;
  notes?: string | null;
  favourite: boolean;
  for_trade: boolean;
  for_sale: boolean;
  created_at: string;
  updated_at: string;
  cards?: {
    id: string;
    title?: string | null;
    player?: string | null;
    team?: string | null;
    set_name?: string | null;
    card_number?: string | null;
    sport?: string | null;
    franchise?: string | null;
    brand?: string | null;
    image_url?: string | null;
    price?: number | null;
    estimated_value?: number | null;
    status?: string | null;
  } | null;
};

export type CollectionStats = {
  totalCards: number;
  uniqueCards: number;
  collectionValue: number;
  recentlyAdded: number;
  completionPct: number;
  highestValueCard?: string;
  newestCard?: string;
  mostCollectedSet?: string;
  favouritePlayer?: string;
  favouriteTeam?: string;
};
