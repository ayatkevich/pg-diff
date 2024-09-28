import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { readFile } from "fs/promises";

describe("pg-diff", () => {
  const pg = new PGlite();
  const sql = async (...args) => (await pg.sql(...args)).rows;
  beforeAll(async () => pg.exec(await readFile("./src/pg_diff.sql", "utf-8")));
  afterAll(async () => pg.close());

  test("create table", async () => {
    const original = await sql`select * from "pg_diff_inspect"`;

    await sql`create table "test" ()`;

    const diff = await sql`select * from "pg_diff"(${original}) where "namespace" = 'public'`;
    expect(diff).toEqual([
      {
        kind: "+",
        type: "pg_class",
        name: "test",
        namespace: "public",
        extras: {
          "+": {
            acl: null,
            kind: "r",
            type: "test",
            owner: "postgres",
            ofType: "-",
            options: null,
            isShared: false,
            tableSpace: null,
            isPartition: false,
            persistence: "p",
            rowSecurity: false,
            accessMethod: "heap",
            replicaIdentity: "d",
            forceRowSecurity: false,
          },
        },
      },
    ]);
  });

  test("drop table", async () => {
    const original = await sql`select * from "pg_diff_inspect"`;

    await sql`drop table "test"`;

    const diff = await sql`select * from "pg_diff"(${original}) where "namespace" = 'public'`;
    expect(diff).toEqual([
      {
        kind: "-",
        type: "pg_class",
        name: "test",
        namespace: "public",
        extras: {
          "-": {
            acl: null,
            kind: "r",
            type: "test",
            owner: "postgres",
            ofType: "-",
            options: null,
            isShared: false,
            tableSpace: null,
            isPartition: false,
            persistence: "p",
            rowSecurity: false,
            accessMethod: "heap",
            replicaIdentity: "d",
            forceRowSecurity: false,
          },
        },
      },
    ]);
  });

  test("add column", async () => {
    await sql`create table "test" ()`;

    const original = await sql`select * from "pg_diff_inspect"`;

    await sql`alter table "test" add column "column" text`;

    const diff = await sql`select * from "pg_diff"(${original}) where "namespace" = 'public'`;
    expect(diff).toEqual([
      {
        kind: "+",
        type: "pg_attribute",
        name: "column",
        namespace: "public",
        extras: {
          "+": {
            acl: null,
            type: "text",
            length: -1,
            isLocal: true,
            notNull: false,
            options: null,
            identity: "",
            relation: "test",
            ancestors: 0,
            collation: '"default"',
            generated: "",
            dimensions: 0,
            fdwOptions: null,
            hasDefault: false,
            hasMissing: false,
            statistics: -1,
            compression: "",
            missingValue: null,
          },
        },
      },
    ]);
  });

  test("change column type", async () => {
    const original = await sql`select * from "pg_diff_inspect"`;

    await sql`alter table "test" alter column "column" type varchar`;

    const diff = await sql`select * from "pg_diff"(${original}) where "namespace" = 'public'`;
    expect(diff).toEqual([
      {
        kind: "+-",
        type: "pg_attribute",
        name: "column",
        namespace: "public",
        extras: {
          "+": {
            acl: null,
            type: "character varying",
            length: -1,
            isLocal: true,
            notNull: false,
            options: null,
            identity: "",
            relation: "test",
            ancestors: 0,
            collation: '"default"',
            generated: "",
            dimensions: 0,
            fdwOptions: null,
            hasDefault: false,
            hasMissing: false,
            statistics: -1,
            compression: "",
            missingValue: null,
          },
          "-": {
            acl: null,
            type: "text",
            length: -1,
            isLocal: true,
            notNull: false,
            options: null,
            identity: "",
            relation: "test",
            ancestors: 0,
            collation: '"default"',
            generated: "",
            dimensions: 0,
            fdwOptions: null,
            hasDefault: false,
            hasMissing: false,
            statistics: -1,
            compression: "",
            missingValue: null,
          },
        },
      },
    ]);
  });
});
