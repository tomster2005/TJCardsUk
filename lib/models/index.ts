/**
 * Standard condition values for a physical trading card.
 *
 * These are realistic card grades and will map to future catalog values
 * and pricing tiers in the database.
 */
export type CardCondition =
  | "Mint"
  | "Near Mint"
  | "Excellent"
  | "Good"
  | "Fair"
  | "Poor";

/**
 * A lightweight status used for collection-related views.
 */
export type CardStatus = "owned" | "missing" | "wishlist";

/**
 * The brand represents the publisher or manufacturer of a card set.
 * In a future database, this would be a normalized table with relationships.
 */
export interface Brand {
  id: string;
  name: string;
  country: string;
  establishedYear: number;
  description: string;
  website?: string;
}

/**
 * Teams are used to link players and cards to a specific club or franchise.
 */
export interface Team {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  league: string;
  country: string;
  logoUrl?: string;
}

/**
 * Players are the athletes represented by cards. This includes team and biography metadata.
 */
export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  teamId: string;
  position: string;
  nationality: string;
  dateOfBirth?: string;
  imageUrl?: string;
}

/**
 * Parallel variants represent visual or rarity editions of a card.
 */
export interface Parallel {
  id: string;
  name: string;
  description: string;
  color?: string;
}

/**
 * Rarity defines how scarce a card is and can be used for sorting/filtering.
 */
export interface Rarity {
  id: string;
  label: string;
  tier: number;
  description: string;
  color?: string;
}

/**
 * CardSet is the product-level collection of cards that belongs to a brand and season.
 */
export interface CardSet {
  id: string;
  title: string;
  brandId: string;
  productLine: string;
  year: number;
  sport: string;
  releaseDate: string;
  totalCards: number;
  description: string;
  imageUrl?: string;
  cardIds: string[];
}

/**
 * Card is the central domain object for a single collectible trading card.
 */
export interface Card {
  id: string;
  setId: string;
  cardNumber: string;
  playerId: string;
  teamId: string;
  season: string;
  brandId: string;
  productLine: string;
  rarityId: string;
  parallelId: string;
  serialNumber?: string;
  autograph: boolean;
  relic: boolean;
  imageFront: string;
  imageBack: string;
  description: string;
  marketValue: number;
}

/**
 * CollectionCard represents a card instance inside a user's collection.
 */
export interface CollectionCard {
  id: string;
  collectionId: string;
  cardId: string;
  quantity: number;
  condition: CardCondition;
  grade?: string;
  acquiredAt: string;
  notes?: string;
  estimatedValue: number;
}

/**
 * UserCollection groups collection items for a user and mirrors a future database relation.
 */
export interface UserCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  items: CollectionCard[];
}

/**
 * WishlistItem tracks cards that a user wants to add to their collection later.
 */
export interface WishlistItem {
  id: string;
  userId: string;
  cardId: string;
  priority: number;
  notes?: string;
  createdAt: string;
}
