import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { readFile } from "fs/promises";

describe("pg-diff", () => {
  let pg;
  let sql;
  beforeEach(async () => {
    pg = await PGlite.create();
    sql = async (...args) => (await pg.sql(...args)).rows;
  });
  beforeEach(async () => pg.exec(await readFile("./src/pg_diff.sql", "utf-8")));
  afterEach(async () => pg.close());

  test("create table", async () => {
    const original = await sql`select * from "pg_diff_inspect"`;

    await sql`create table "test" ()`;

    const diff = await sql`select * from "pg_diff"(${original})`;
    expect(diff).toEqual([
      {
        kind: "+",
        type: "pg_class",
        data: {
          acl: null,
          kind: "r",
          name: "test",
          type: "test",
          owner: "postgres",
          ofType: "-",
          options: null,
          fileNode: "16393",
          hasIndex: false,
          hasRules: false,
          isShared: false,
          namespace: "public",
          tableSpace: "0",
          hasSubClass: false,
          hasTriggers: false,
          isPartition: false,
          isPopulated: true,
          persistence: "p",
          rowSecurity: false,
          accessMethod: "2",
          numberOfChecks: 0,
          replicaIdentity: "d",
          forceRowSecurity: false,
          numberOfUserColumns: 0,
        },
      },
    ]);
  });

  test("drop table", async () => {
    await sql`create table "test" ()`;

    const original = await sql`select * from "pg_diff_inspect"`;

    await sql`drop table "test"`;

    const diff = await sql`select * from "pg_diff"(${original})`;
    expect(diff).toEqual([
      {
        kind: "-",
        type: "pg_class",
        data: {
          acl: null,
          kind: "r",
          name: "test",
          type: "test",
          owner: "postgres",
          ofType: "-",
          options: null,
          fileNode: "16393",
          hasIndex: false,
          hasRules: false,
          isShared: false,
          namespace: "public",
          tableSpace: "0",
          hasSubClass: false,
          hasTriggers: false,
          isPartition: false,
          isPopulated: true,
          persistence: "p",
          rowSecurity: false,
          accessMethod: "2",
          numberOfChecks: 0,
          replicaIdentity: "d",
          forceRowSecurity: false,
          numberOfUserColumns: 0,
        },
      },
    ]);
  });
});
