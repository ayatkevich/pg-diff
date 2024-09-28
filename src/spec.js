import { PGlite } from "@electric-sql/pglite";
import { afterAll, describe, test } from "@jest/globals";

const pg = new PGlite();
const sql = async (...args) => (await pg.sql(...args)).rows;

describe("pg-diff", () => {
  afterAll(() => pg.close());

  test("connection", async () => {
    await sql`select 1`;
  });
});
