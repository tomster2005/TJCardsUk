export type BinderPocketStatus = "owned" | "missing" | "wishlist";

export type BinderPocket = {
  id: string;
  position: number;
  cardNumber: string;
  playerName: string;
  teamName: string;
  parallelName: string;
  rarityName: string;
  description: string;
  status: BinderPocketStatus;
  quantity: number;
  owned: boolean;
  wishlist: boolean;
  imageLabel: string;
  imageUrl: string;
  cardBackText: string;
};

export type BinderPageData = {
  id: string;
  title: string;
  pockets: BinderPocket[];
};

export type BinderDemoData = {
  title: string;
  description: string;
  setName: string;
  pages: BinderPageData[];
};

export const binderDemoData: BinderDemoData = {
  title: "My Collection",
  description: "A digital binder for your card collection.",
  setName: "My Sets",
  pages: [
    {
      id: "binder-page-1",
      title: "Page 1",
      pockets: [],
    },
  ],
};
