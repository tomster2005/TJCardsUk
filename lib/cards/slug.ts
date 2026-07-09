export function buildSlugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildSetSlug(setName: string) {
  return buildSlugPart(setName || "set");
}

export function buildCardSlugPart(title: string, cardNumber: string) {
  const compact = [title, cardNumber].filter(Boolean).join(" ");
  return buildSlugPart(compact || "card");
}

export function buildCardRouteSlug({ setName, title, cardNumber, fallbackId }: { setName?: string; title?: string; cardNumber?: string; fallbackId?: string | number }) {
  const setSlug = buildSetSlug(setName ?? "");
  const cardSlug = buildCardSlugPart(title ?? "", cardNumber ?? "");
  const combined = [setSlug, cardSlug].filter(Boolean).join("-");
  return combined || String(fallbackId ?? "card");
}

export function buildPublicCardSlugs({
  setName,
  title,
  player,
  cardNumber,
}: {
  setName?: string;
  title?: string;
  player?: string;
  cardNumber?: string | number;
}) {
  const resolvedSetName = setName ?? "";
  const resolvedTitle = title || player || "";
  const resolvedCardNumber = String(cardNumber ?? "");

  return {
    setSlug: buildSetSlug(resolvedSetName),
    cardSlug: buildCardSlugPart(resolvedTitle, resolvedCardNumber),
  };
}

export function buildPublicCardPath({
  setName,
  title,
  player,
  cardNumber,
}: {
  setName?: string;
  title?: string;
  player?: string;
  cardNumber?: string | number;
}) {
  const { setSlug, cardSlug } = buildPublicCardSlugs({ setName, title, player, cardNumber });
  return `/catalogue/${setSlug}/${cardSlug}`;
}
