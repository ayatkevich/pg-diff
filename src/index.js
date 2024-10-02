import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const dirname = fileURLToPath(new URL(".", import.meta.url));

export const definition = await readFile(path.join(dirname, "pg_diff.sql"), "utf8");

export async function snapshot(sql) {
  return await sql`select * from "pg_diff_inspect" where "namespace" not in ('information_schema', 'pg_catalog', 'pg_toast')`;
}

export async function diff(sql, { before, after }) {
  return await sql`select * from "pg_diff"(${before}, ${after})`;
}
