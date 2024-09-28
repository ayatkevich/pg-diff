create type "pg_diff_record" as (
  "kind" text,
  "type" text,
  "data" jsonb
);

create view "pg_diff_inspect" as (
  select
      null as "kind",
      'pg_class' as "type",
      jsonb_build_object(
        'name', relName,
        'namespace', relNamespace::regNamespace,
        'type', relType::regType,
        'ofType', relOfType::regType,
        'owner', relOwner::regRole,
        'accessMethod', relAM, -- TODO get name
        'fileNode', relFileNode, -- TODO get name
        'tableSpace', relTableSpace, -- TODO get name
        'hasIndex', relHasIndex,
        'isShared', relIsShared,
        'persistence', relPersistence,
        'kind', relKind,
        'numberOfUserColumns', relNatTs,
        'numberOfChecks', relChecks,
        'hasRules', relHasRules,
        'hasTriggers', relHasTriggers,
        'hasSubClass', relHasSubclass,
        'rowSecurity', relRowSecurity,
        'forceRowSecurity', relForceRowSecurity,
        'isPopulated', relIsPopulated,
        'replicaIdentity', relReplIdent,
        'isPartition', relIsPartition,
        'acl', relAcl,
        'options', relOptions
      ) as "data"
    from pg_class
);

create function "pg_diff" (jsonb)
returns setof "pg_diff_record"
language sql as $$
  select '-' as "kind", "type", "data" from (
    select * from jsonb_populate_recordSet(null::"pg_diff_record", $1)
    except
    select * from "pg_diff_inspect"
  )
  union
  select '+' as "kind", "type", "data" from (
    select * from "pg_diff_inspect"
    except
    select * from jsonb_populate_recordSet(null::"pg_diff_record", $1)
  )
$$;
