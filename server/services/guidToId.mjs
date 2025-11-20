import { pool } from "../app.mjs";

export default async function guidToId(guid, table) {
  if (!guid || !table) return null;
  const query = `SELECT id FROM ${table} WHERE BINARY guid = ?`;
  const [result] = await pool.query(query, [guid]);
  // Checking decks with the same ID
  if (result.length === 0) {
    return null;
  }
  return result[0].id;
}
