import type { StoreApiCategory } from "@/lib/mock";
import { MAIN_CATEGORY_SLUGS as ENV_MAIN_CATEGORY_SLUGS } from "@/lib/mock";

export interface CategoryNavItem {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface CategoryNav {
  /** Categories to list at the current depth. */
  items: CategoryNavItem[];
  /** Slug of the item that should be highlighted as active (leaf view). */
  currentSlug?: string;
  /** One level up, for a "back" link (null at the top level). */
  parent: { name: string; slug: string } | null;
  /** Heading for the section, e.g. the current category name. */
  heading?: string;
}

/**
 * Curated MAIN shopping categories shown at the top level (in this order).
 * The raw WooCommerce taxonomy is mostly flat (dozens of granular parent=0
 * terms like "10ct Display Box", "Carts 1g – THCO", packaging/samples), so we
 * present a clean set instead of every root term. Sub-categories still drill
 * down via real parent relationships (e.g. shrooms → tabz).
 */
export const MAIN_CATEGORY_SLUGS = ENV_MAIN_CATEGORY_SLUGS;

const toItem = (c: StoreApiCategory): CategoryNavItem => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  count: c.count,
});

const byName = (a: CategoryNavItem, b: CategoryNavItem) =>
  a.name.localeCompare(b.name);

function mainItems(all: StoreApiCategory[]): CategoryNavItem[] {
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  return MAIN_CATEGORY_SLUGS.map((slug) => bySlug.get(slug))
    .filter((c): c is StoreApiCategory => !!c && c.count > 0)
    .map(toItem);
}

/**
 * Build a single-depth category navigation:
 *  - No current category            → curated main categories.
 *  - Current has real sub-categories → show them (drill down).
 *  - Current is a top-level main     → keep showing mains, highlight current.
 *  - Current is a nested leaf         → show its siblings + a back link.
 * Only categories with products (count > 0) are shown.
 */
export function buildCategoryNav(
  all: StoreApiCategory[],
  currentSlug?: string
): CategoryNav {
  const withProducts = all.filter((c) => c.count > 0);
  const byId = new Map(all.map((c) => [c.id, c]));

  const current = currentSlug
    ? all.find((c) => c.slug === currentSlug)
    : undefined;

  if (!current) {
    return { items: mainItems(all), parent: null };
  }

  const parentCat = current.parent ? byId.get(current.parent) : null;
  const parentLink = parentCat
    ? { name: parentCat.name, slug: parentCat.slug }
    : null;

  const children = withProducts
    .filter((c) => c.parent === current.id)
    .map(toItem)
    .sort(byName);

  if (children.length > 0) {
    // Drill down: show this category's real sub-categories.
    return { items: children, parent: parentLink, heading: current.name };
  }

  // Nested leaf → show siblings at the same depth.
  if ((current.parent ?? 0) !== 0) {
    const siblings = withProducts
      .filter((c) => (c.parent ?? 0) === (current.parent ?? 0))
      .map(toItem)
      .sort(byName);
    return {
      items: siblings,
      currentSlug: current.slug,
      parent: parentLink,
      heading: parentCat?.name,
    };
  }

  // Top-level category with no sub-categories → keep the main list, highlight it.
  return { items: mainItems(all), currentSlug: current.slug, parent: null };
}
