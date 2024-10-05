// @ts-nocheck
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const dirname = fileURLToPath(new URL(".", import.meta.url));

export const definitionPath = path.join(dirname, "pg_diff.sql");

export const definition = await readFile(definitionPath, "utf8");

export async function inspect(sql) {
  return await sql`
    select *
      from "pg_diff_inspect"
      where "namespace" not in ('information_schema', 'pg_catalog', 'pg_toast')
  `;
}

export async function diff(sql, { left, right }) {
  return await sql`
    select *
      from "pg_diff"(${left}, ${right})
  `;
}
