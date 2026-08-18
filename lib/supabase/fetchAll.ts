/**
 * Paginates through a Supabase query in chunks of 1000 (the default row cap).
 * Pass the query builder WITHOUT a .range() call — this function adds it.
 *
 * Usage:
 *   const rows = await fetchAll<MyType>(
 *     supabase.from("table").select("id, name").eq("status", "active")
 *   );
 */
export async function fetchAll<T>(query: any): Promise<T[]> {
  const PAGE = 1000;
  let rows: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await query.range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    rows = rows.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}
