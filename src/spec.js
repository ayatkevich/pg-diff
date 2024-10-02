import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { definition, diff, snapshot } from "./index.js";

describe("pg-diff", () => {
  const pg = new PGlite();
  const sql = async (...args) => (await pg.sql(...args)).rows;
  beforeAll(async () => pg.exec(definition));
  afterAll(async () => pg.close());

  test("table", async () => {
    const before = await snapshot(sql);

    await sql`create table "test" ()`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
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
    const before = await snapshot(sql);

    await sql`drop table "test"`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
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

  test("column", async () => {
    await sql`create table "test" ()`;

    const before = await snapshot(sql);

    await sql`alter table "test" add column "column" text`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
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
    const before = await snapshot(sql);

    await sql`alter table "test" alter column "column" type varchar`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
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

  test("function", async () => {
    const before = await snapshot(sql);

    await sql`create function "test" () returns void language plpgsql as $$begin end$$`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
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

  test("role", async () => {
    const before = await snapshot(sql);

    await sql`create role "test"`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
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

  test("cast", async () => {
    await sql`create function "int4" (text) returns integer language sql as $$select $1::integer$$`;
    const before = await snapshot(sql);

    await sql`create cast (text as integer) with function int4(text)`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
      {
        kind: "+",
        type: "pg_cast",
        name: "text -> integer",
        namespace: "",
        extras: {
          "+": { method: "f", context: "e", function: "public.int4" },
          delta: null,
        },
      },
    ]);
  });

  test("primary key", async () => {
    const before = await snapshot(sql);

    await sql`alter table "test" add primary key ("column")`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
      {
        kind: "+",
        type: "pg_constraint",
        name: "test_pkey",
        namespace: "public",
        extras: {
          "+": {
            type: "p",
            index: "test_pkey",
            domain: "-",
            parent: null,
            isLocal: true,
            onMatch: " ",
            deferred: false,
            onDelete: " ",
            onUpdate: " ",
            relation: "test",
            inherited: 0,
            noInherit: true,
            validated: true,
            deferrable: false,
            definition: 'PRIMARY KEY ("column")',
            references: "-",
          },
          delta: null,
        },
      },
      {
        kind: "+-",
        type: "pg_attribute",
        name: "test.column",
        namespace: "public",
        extras: {
          "+": expect.objectContaining({}),
          "-": expect.objectContaining({}),
          delta: { notNull: [true, false] },
        },
      },
    ]);
  });

  test("comment", async () => {
    const before = await snapshot(sql);

    await sql`comment on table "test" is 'a table'`;
    await sql`comment on column "test"."column" is 'a column'`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
      {
        kind: "+",
        type: "pg_description",
        name: "test.column a column",
        namespace: "public",
        extras: { "+": { column: "test.column", description: "a column" }, delta: null },
      },
      {
        kind: "+",
        type: "pg_description",
        name: "test a table",
        namespace: "public",
        extras: { "+": { column: null, description: "a table" }, delta: null },
      },
    ]);
  });

  test("operator", async () => {
    const before = await snapshot(sql);

    await sql`create operator <<< (leftArg = integer, rightArg = integer, procedure = int4lt)`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
      {
        kind: "+",
        type: "pg_operator",
        name: "<<<",
        namespace: "public",
        extras: {
          "+": {
            code: "int4lt",
            join: "-",
            kind: "b",
            left: "integer",
            owner: "postgres",
            right: "integer",
            result: "boolean",
            canHash: false,
            negator: null,
            canMerge: false,
            commutator: null,
            restriction: "-",
          },
          delta: null,
        },
      },
    ]);
  });

  test("policy", async () => {
    const before = await snapshot(sql);

    await sql`create policy "test" on "test" for select to "test" using (true)`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
      {
        kind: "+",
        type: "pg_policy",
        name: "test on test",
        namespace: "public",
        extras: {
          "+": {
            roles: ["test"],
            using: "true",
            command: "r",
            withCheck: null,
            isPermissive: true,
          },
          delta: null,
        },
      },
    ]);
  });

  test("publication", async () => {
    const before = await snapshot(sql);

    await sql`create publication "test" for table "test"`;
    await sql`create publication "public" for tables in schema "public"`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
      {
        kind: "+",
        type: "pg_publication",
        name: "test on test",
        namespace: "public",
        extras: {
          "+": {
            owner: "postgres",
            isDelete: true,
            isInsert: true,
            isUpdate: true,
            isViaRoot: false,
            isTruncate: true,
            isAllTables: false,
          },
          delta: null,
        },
      },
      {
        kind: "+",
        type: "pg_publication",
        name: "public on schema public",
        namespace: "public",
        extras: { "+": {}, delta: null },
      },
    ]);
  });

  test("rule", async () => {
    const before = await snapshot(sql);

    await sql`create rule "test" as on delete to "test" do instead nothing`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
      {
        kind: "+",
        type: "pg_rewrite",
        name: "test on test",
        namespace: "public",
        extras: {
          "+": {
            type: "4",
            enabled: "O",
            isInstead: true,
            definition: "CREATE RULE test AS\n    ON DELETE TO public.test DO INSTEAD NOTHING;",
          },
          delta: null,
        },
      },
    ]);
  });

  test("trigger", async () => {
    await sql`create function test_trigger() returns trigger language plpgsql as $$begin return new; end$$`;
    const before = await snapshot(sql);

    await sql`create trigger "test" before insert on "test" for each row execute procedure test_trigger()`;

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after })).toEqual([
      {
        kind: "+",
        type: "pg_trigger",
        name: "test on test",
        namespace: "public",
        extras: {
          "+": {
            type: 7,
            enabled: "O",
            isClone: false,
            definition:
              "CREATE TRIGGER test BEFORE INSERT ON public.test FOR EACH ROW EXECUTE FUNCTION test_trigger()",
            isDeferral: false,
            isDeferred: false,
            isInternal: false,
          },
          delta: null,
        },
      },
    ]);
  });

  test("template", async () => {
    const before = await snapshot(sql);

    const after = await snapshot(sql);

    expect(await diff(sql, { before, after }));
  });
});
