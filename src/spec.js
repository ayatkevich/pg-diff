import { PGlite } from "@electric-sql/pglite";
// @ts-ignore
import { citext } from "@electric-sql/pglite/contrib/citext";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { definition as slon } from "pg-slon";
import postgres from "postgres";
import { definition, diff, inspect } from "./index.js";

describe("pg-diff", () => {
  // @ts-ignore
  const pg = new PGlite({ extensions: [citext] });
  const sql = async (
    /** @type {TemplateStringsArray} */ template,
    /** @type {any[]} */ ...params
  ) => (await pg.sql(template, ...params)).rows;
  beforeAll(async () => pg.exec(definition));
  afterAll(async () => pg.close());

  test("table", async () => {
    const before = await inspect(sql);

    await sql`create table "test" ()`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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
    const before = await inspect(sql);

    await sql`drop table "test"`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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

    const before = await inspect(sql);

    await sql`alter table "test" add column "column" text`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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
    const before = await inspect(sql);

    await sql`alter table "test" alter column "column" type varchar`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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
    const before = await inspect(sql);

    await sql`create function "test" () returns void language plpgsql as $$begin end$$`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
      {
        kind: "+",
        type: "pg_proc",
        name: "test(): void",
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
            argumentTypes: [],
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
    const before = await inspect(sql);

    await sql`create role "test"`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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
    const before = await inspect(sql);

    await sql`create cast (text as integer) with function int4(text)`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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
    const before = await inspect(sql);

    await sql`alter table "test" add primary key ("column")`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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
    const before = await inspect(sql);

    await sql`comment on table "test" is 'a table'`;
    await sql`comment on column "test"."column" is 'a column'`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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
    const before = await inspect(sql);

    await sql`create operator <<< (leftArg = integer, rightArg = integer, procedure = int4lt)`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
      {
        kind: "+",
        type: "pg_operator",
        name: "integer <<< integer = boolean",
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
    const before = await inspect(sql);

    await sql`create policy "test" on "test" for select to "test" using (true)`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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
    const before = await inspect(sql);

    await sql`create publication "test" for table "test"`;
    await sql`create publication "public" for tables in schema "public"`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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
    const before = await inspect(sql);

    await sql`create rule "test" as on delete to "test" do instead nothing`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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
    const before = await inspect(sql);

    await sql`create trigger "test" before insert on "test" for each row execute procedure test_trigger()`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
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
          },
          delta: null,
        },
      },
    ]);
  });

  test("type", async () => {
    const before = await inspect(sql);

    await sql`create type "test_enum" as enum ('a', 'b')`;
    await sql`create type "test_composite" as (a integer, b text)`;
    await sql`create domain "test_domain" as text`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
      {
        kind: "+",
        type: "pg_type",
        name: "test_domain",
        namespace: "public",
        extras: {
          "+": {
            acl: null,
            type: "d",
            align: "i",
            array: "test_domain[]",
            owner: "postgres",
            length: -1,
            default: null,
            notNull: false,
            storage: "x",
            typeMod: -1,
            baseType: "text",
            category: "S",
            relation: "-",
            collation: '"default"',
            delimiter: ",",
            isByValue: false,
            isDefined: true,
            subscript: "-",
            isPreferred: false,
            sendFunction: "textsend", // cspell:disable-line
            inputFunction: "domain_in",
            outputFunction: "textout", // cspell:disable-line
            analyzeFunction: "-",
            receiveFunction: "domain_recv",
            numberOfDimensions: 0,
            modifierInputFunction: "-",
            modifierOutputFunction: "-",
          },
          delta: null,
        },
      },
      {
        kind: "+",
        type: "pg_type",
        name: "test_enum",
        namespace: "public",
        extras: {
          "+": {
            acl: null,
            type: "e",
            align: "i",
            array: "test_enum[]",
            owner: "postgres",
            length: 4,
            default: null,
            notNull: false,
            storage: "p",
            typeMod: -1,
            baseType: "-",
            category: "E",
            relation: "-",
            collation: "-",
            delimiter: ",",
            isByValue: true,
            isDefined: true,
            subscript: "-",
            isPreferred: false,
            sendFunction: "enum_send",
            inputFunction: "enum_in",
            outputFunction: "enum_out",
            analyzeFunction: "-",
            receiveFunction: "enum_recv",
            numberOfDimensions: 0,
            modifierInputFunction: "-",
            modifierOutputFunction: "-",
          },
          delta: null,
        },
      },
      {
        kind: "+",
        type: "pg_type",
        name: "test_composite",
        namespace: "public",
        extras: {
          "+": {
            acl: null,
            type: "c",
            align: "d",
            array: "test_composite[]",
            owner: "postgres",
            length: -1,
            default: null,
            notNull: false,
            storage: "x",
            typeMod: -1,
            baseType: "-",
            category: "C",
            relation: "test_composite",
            collation: "-",
            delimiter: ",",
            isByValue: false,
            isDefined: true,
            subscript: "-",
            isPreferred: false,
            sendFunction: "record_send",
            inputFunction: "record_in",
            outputFunction: "record_out",
            analyzeFunction: "-",
            receiveFunction: "record_recv",
            numberOfDimensions: 0,
            modifierInputFunction: "-",
            modifierOutputFunction: "-",
          },
          delta: null,
        },
      },
    ]);
  });

  test("slon", async () => {
    const before = await inspect(sql);

    await pg.exec(slon);

    const after = await inspect(sql);

    const result = await diff(sql, { left: before, right: after });

    expect(new Set(result.map(({ kind }) => kind))).toEqual(new Set(["+"]));

    expect(result).toEqual([
      expect.objectContaining({
        type: "pg_operator",
        name: "- @ text = slon_symbol",
      }),
      expect.objectContaining({
        type: "pg_attribute",
        name: "slon.related_to",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_symbol_constructor(text): slon_symbol",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_object_constructor(slon_symbol, slon): slon_object",
      }),
      expect.objectContaining({
        type: "pg_type",
        name: "slon_object",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_object_constructor(text, slon): slon_object",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_object_constructor(slon, text): slon_object",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon_node = slon_node = boolean",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_node_constructor(slon_object, slon_object): slon_node",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon_symbol | slon_symbol = slon_object",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon_symbol | slon = slon_object",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_node_equality(slon_node, slon_node): boolean",
      }),
      expect.objectContaining({
        type: "pg_type",
        name: "slon_symbol",
      }),
      expect.objectContaining({
        type: "pg_cast",
        name: "slon_object -> slon_node",
        namespace: "",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon + slon_node[] = slon",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "text | slon_object = slon_object",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_object_constructor(slon_symbol, slon_object): slon_object",
      }),
      expect.objectContaining({
        type: "pg_sequence",
        name: "slon_index_seq",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "text | text = slon_object",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_object_constructor(slon_object, text): slon_object",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon_symbol | slon_object = slon_object",
      }),
      expect.objectContaining({
        type: "pg_constraint",
        name: "slon_pkey",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "- - slon = slon",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_append(slon, slon_node): slon",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_node_constructor(slon_object): slon_node",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_object_constructor(text, slon_object): slon_object",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "text | slon = slon_object",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_object_constructor(slon_object, slon_symbol): slon_object",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon_symbol = slon_symbol = boolean",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_append(slon, slon_node[]): slon set",
      }),
      expect.objectContaining({
        type: "pg_attribute",
        name: "slon.id",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon_object & slon_object = slon_node",
      }),
      expect.objectContaining({
        type: "pg_attribute",
        name: "slon.node",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon + slon_node = slon",
      }),
      expect.objectContaining({
        type: "pg_class",
        name: "slon",
      }),
      expect.objectContaining({
        type: "pg_constraint",
        name: "slon_related_to_fkey", // cspell:disable-line
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_object_constructor(slon_symbol, slon_symbol): slon_object",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon | text = slon_object",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_symbol_equality(slon_symbol, slon_symbol): boolean",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon_object | slon_symbol = slon_object",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_query(slon_node): slon set",
      }),
      expect.objectContaining({
        type: "pg_type",
        name: "slon_node",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_delete(slon): slon",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon | slon_symbol = slon_object",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "- ? slon_node = slon",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_object_constructor(text, text): slon_object",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_object_constructor(slon, slon_symbol): slon_object",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "- & slon_object = slon_node",
      }),
      expect.objectContaining({
        type: "pg_attribute",
        name: "slon.index",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_query(slon, slon_node): slon set",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon_object = slon_object = boolean",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon_object | text = slon_object",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "- + slon_node = slon",
      }),
      expect.objectContaining({
        type: "pg_operator",
        name: "slon ? slon_node = slon",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_object_equality(slon_object, slon_object): boolean",
      }),
      expect.objectContaining({
        type: "pg_proc",
        name: "slon_append(slon_node): slon",
      }),
    ]);
  });

  test("aggregate", async () => {
    const before = await inspect(sql);

    expect(before.filter(({ name }) => name.match(/jsonb_delta/))).toEqual([
      {
        kind: null,
        type: "pg_proc",
        name: "jsonb_delta(jsonb): jsonb",
        namespace: "public",
        extras: expect.objectContaining({ kind: "a" }),
      },
      {
        kind: null,
        type: "pg_proc",
        name: "jsonb_delta_fn(jsonb, jsonb): jsonb",
        namespace: "public",
        extras: expect.objectContaining({ kind: "f" }),
      },
    ]);
  });

  test("sequence", async () => {
    await sql`drop sequence if exists test_sequence`;

    const before = await inspect(sql);

    await sql`create sequence test_sequence start 100 increment 50`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
      {
        kind: "+",
        type: "pg_sequence",
        name: "test_sequence",
        namespace: "public",
        extras: {
          "+": {
            start: 100,
            isCycled: false,
            maxValue: 9223372036854776000,
            minValue: 1,
            increment: 50,
            cacheValue: 1,
          },
          delta: null,
        },
      },
    ]);
  });

  test("extension", async () => {
    const before = await inspect(sql);

    await sql`create extension if not exists citext`;

    const after = await inspect(sql);

    const result = await diff(sql, { left: before, right: after });

    expect(result).toEqual(
      expect.arrayContaining([
        {
          kind: "+",
          type: "pg_extension",
          name: "citext",
          namespace: "public",
          extras: {
            "+": { owner: "postgres", config: null, version: "1.6", condition: null },
            delta: null,
          },
        },
      ])
    );
  });

  test("database", async () => {
    const before = await inspect(sql);

    await sql`create database "test_db"`;

    const after = await inspect(sql);

    const result = await diff(sql, { left: before, right: after });

    expect(result).toEqual([
      {
        kind: "+",
        type: "pg_database",
        name: "test_db",
        namespace: "",
        extras: {
          "+": {
            acl: null,
            dba: "postgres",
            lcType: "C.UTF-8",
            collate: "C",
            encoding: "UTF8",
            icuRules: null,
            icuLocale: null,
            isTemplate: false,
            collVersion: null,
            localeProvider: "c",
            connectionLimit: -1,
            allowConnections: true,
          },
          delta: null,
        },
      },
    ]);
  });

  test("namespace", async () => {
    const before = await inspect(sql);

    await sql`create schema if not exists "test_schema"`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
      {
        kind: "+",
        type: "pg_namespace",
        name: "test_schema",
        namespace: "",
        extras: { "+": { acl: null, owner: "postgres" }, delta: null },
      },
    ]);
  });

  test("event trigger", async () => {
    await sql`create function "test_event_trigger_fn"() returns event_trigger language plpgsql as $$ begin raise notice 'test'; end; $$`;
    const before = await inspect(sql);

    await sql`create event trigger "test_event_trigger" on ddl_command_end execute procedure "test_event_trigger_fn"()`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
      {
        kind: "+",
        type: "pg_event_trigger",
        name: "test_event_trigger",
        namespace: "",
        extras: {
          "+": {
            tags: null,
            event: "ddl_command_end",
            owner: "postgres",
            enabled: "O",
            function: "test_event_trigger_fn",
          },
          delta: null,
        },
      },
    ]);
  });

  test("collation", async () => {
    const before = await inspect(sql);

    await sql`create collation "test_collation" from "C"`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
      {
        kind: "+",
        type: "pg_collation",
        name: "test_collation",
        namespace: "public",
        extras: {
          "+": {
            type: "C",
            owner: "postgres",
            rules: null,
            locale: null,
            collate: "C",
            encoding: "",
            provider: "c",
            deterministic: true,
          },
          delta: null,
        },
      },
    ]);
  });

  test("template", async () => {
    const before = await inspect(sql);

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after }));
  });
});

describe("using postgres.js", () => {
  const sql = postgres({ user: "postgres" });
  beforeAll(async () => sql.file("./src/pg_diff.sql").simple());
  afterAll(async () => sql.end());

  test("view", async () => {
    await sql`drop view if exists "test"`;

    const before = await inspect(sql);

    await sql`create view "test" as select 1 as "column"`;

    const after = await inspect(sql);

    expect(await diff(sql, { left: before, right: after })).toEqual([
      {
        kind: "+",
        type: "pg_class",
        name: "test",
        namespace: "public",
        extras: {
          "+": {
            acl: null,
            kind: "v",
            type: "test",
            owner: "postgres",
            ofType: "-",
            options: null,
            isShared: false,
            tableSpace: null,
            isPartition: false,
            persistence: "p",
            rowSecurity: false,
            accessMethod: null,
            replicaIdentity: "n",
            forceRowSecurity: false,
          },
          delta: null,
        },
      },
      {
        kind: "+",
        type: "pg_attribute",
        name: "test.column",
        namespace: "public",
        extras: {
          "+": {
            acl: null,
            type: "integer",
            length: 4,
            default: null,
            isLocal: true,
            notNull: false,
            options: null,
            identity: "",
            relation: "test",
            ancestors: 0,
            collation: "-",
            generated: "",
            dimensions: 0,
            fdwOptions: null,
            hasDefault: false,
            hasMissing: false,
            statistics: -1,
            compression: "",
            missingValue: null,
          },
          delta: null,
        },
      },
      {
        kind: "+",
        type: "pg_rewrite",
        name: "_RETURN on test",
        namespace: "public",
        extras: {
          "+": {
            type: "1",
            enabled: "O",
            isInstead: true,
            definition:
              'CREATE RULE "_RETURN" AS\n    ON SELECT TO public.test DO INSTEAD  SELECT 1 AS "column";',
          },
          delta: null,
        },
      },
    ]);
  });
});
