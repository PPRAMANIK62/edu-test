/**
 * Typed Appwrite database helpers
 *
 * Centralizes all `as unknown as` type casts into a single file.
 * The Appwrite TablesDB SDK returns generic `Models.Row` types that don't
 * know about our custom fields, so unsafe casts are unavoidable — but they
 * belong here, not scattered across every service file.
 */

import { APPWRITE_CONFIG, databases } from "./appwrite";

const { databaseId, tables } = APPWRITE_CONFIG;

// Re-export tables so consumers can use `tables.courses!` etc.
export { tables };

/**
 * Typed list query — centralizes the unsafe cast in one place
 */
export async function typedListRows<T>(
  tableId: string,
  queries: string[] = [],
): Promise<{ rows: T[]; total: number }> {
  const response = await databases.listRows({
    databaseId: databaseId!,
    tableId,
    queries,
  });
  return {
    rows: response.rows as unknown as T[],
    total: response.total,
  };
}

/**
 * Typed single row fetch
 */
export async function typedGetRow<T>(
  tableId: string,
  rowId: string,
): Promise<T> {
  const response = await databases.getRow({
    databaseId: databaseId!,
    tableId,
    rowId,
  });
  return response as unknown as T;
}

/**
 * Typed row update
 */
export async function typedUpdateRow<T>(
  tableId: string,
  rowId: string,
  data: Partial<Record<string, unknown>>,
): Promise<T> {
  const response = await databases.updateRow({
    databaseId: databaseId!,
    tableId,
    rowId,
    data,
  });
  return response as unknown as T;
}
