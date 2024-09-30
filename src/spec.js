import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { readFile } from "fs/promises";

describe("pg-diff", () => {
  const pg = new PGlite();
  const sql = async (...args) => (await pg.sql(...args)).rows;
  beforeAll(async () => pg.exec(await readFile("./src/pg_diff.sql", "utf-8")));
  afterAll(async () => pg.close());

  test("create table", async () => {
    const original = await sql`select * from "pg_diff_inspect" where "namespace" = 'public'`;

    await sql`create table "test" ()`;

    const updated = await sql`select * from "pg_diff_inspect" where "namespace" = 'public'`;

    const diff = await sql`select * from "pg_diff"(${original}, ${updated})`;
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
          delta: null,
        },
      },
    ]);
  });

  test("drop table", async () => {
    const original = await sql`select * from "pg_diff_inspect" where "namespace" = 'public'`;

    await sql`drop table "test"`;

    const updated = await sql`select * from "pg_diff_inspect" where "namespace" = 'public'`;

    const diff = await sql`select * from "pg_diff"(${original}, ${updated})`;
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
          delta: null,
        },
      },
    ]);
  });

  test("add column", async () => {
    await sql`create table "test" ()`;

    const original = await sql`select * from "pg_diff_inspect" where "namespace" = 'public'`;

    await sql`alter table "test" add column "column" text`;

    const updated = await sql`select * from "pg_diff_inspect" where "namespace" = 'public'`;

    const diff = await sql`select * from "pg_diff"(${original}, ${updated})`;
    expect(diff).toEqual([
      {
        kind: "+",
        type: "pg_attribute",
        name: "test.column",
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
            default: null,
          },
          delta: null,
        },
      },
    ]);
  });

  test("change column type", async () => {
    const original = await sql`select * from "pg_diff_inspect" where "namespace" = 'public'`;

    await sql`alter table "test" alter column "column" type varchar`;

    const updated = await sql`select * from "pg_diff_inspect" where "namespace" = 'public'`;

    const diff = await sql`select * from "pg_diff"(${original}, ${updated})`;
    expect(diff).toEqual([
      {
        kind: "+-",
        type: "pg_attribute",
        name: "test.column",
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
            default: null,
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
            default: null,
          },
          delta: {
            type: ["text", "character varying"],
          },
        },
      },
    ]);
  });

  test("create function", async () => {
    const original = await sql`select * from "pg_diff_inspect" where "namespace" = 'public'`;

    await sql`create function "test" () returns void language plpgsql as $$begin end$$`;

    const updated = await sql`select * from "pg_diff_inspect" where "namespace" = 'public'`;

    const diff = await sql`select * from "pg_diff"(${original}, ${updated})`;
    expect(diff).toEqual([
      {
        kind: "+",
        type: "pg_proc",
        name: "test",
        namespace: "public",
        extras: {
          "+": {
            acl: null,
            bin: null,
            cost: 100,
            kind: "f",
            owner: "postgres",
            config: null,
            source: "begin end",
            sqlBody: null,
            isStrict: false,
            language: "plpgsql",
            variadic: "-",
            returnType: "void",
            returnsSet: false,
            volatility: "v",
            isLeakProof: false,
            parallelism: "u",
            numberOfArgs: 0,
            argumentModes: null,
            argumentNames: null,
            argumentTypes: null,
            argumentDefaults: null,
            isSecurityDefiner: false,
            numberOfArgsWithDefaults: 0,
          },
          delta: null,
        },
      },
    ]);
  });

  test("create role", async () => {
    const original = await sql`select * from "pg_diff_inspect" where "namespace" = ''`;

    await sql`create role "test"`;

    const updated = await sql`select * from "pg_diff_inspect" where "namespace" = ''`;

    const diff = await sql`select * from "pg_diff"(${original}, ${updated})`;
    expect(diff).toEqual([
      {
        kind: "+",
        type: "pg_authid",
        name: "test",
        namespace: "",
        extras: {
          "+": {
            canLogin: false,
            inherits: true,
            password: null,
            bypassRLS: false,
            validUntil: null,
            isSuperuser: false,
            replication: false,
            connectionLimit: -1,
          },
          delta: null,
        },
      },
    ]);
  });
});
