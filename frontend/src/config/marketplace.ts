export function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return "Free";
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatRating(avg: number): string {
  if (avg === 0) return "No ratings";
  return avg.toFixed(1);
}

export const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "downloads", label: "Most Downloads" },
] as const;

export type SortOption = (typeof sortOptions)[number]["value"];
