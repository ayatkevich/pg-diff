create type "pg_diff_record" as (
  "kind" text,
  "type" text,
  "name" text,
  "namespace" text,
  "extras" jsonb
);

create view "pg_diff_inspect" as (
  select
      null as "kind",
      'pg_class' as "type",
      relName as "name",
      relNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'type', relType::regType,
        'ofType', relOfType::regType,
        'owner', relOwner::regRole,
        'accessMethod', relAM, -- TODO get name
        'fileNode', relFileNode, -- TODO get name
        'tableSpace', relTableSpace, -- TODO get name
        'isShared', relIsShared,
        'persistence', relPersistence,
        'kind', relKind,
        'rowSecurity', relRowSecurity,
        'forceRowSecurity', relForceRowSecurity,
        'replicaIdentity', relReplIdent,
        'isPartition', relIsPartition,
        'acl', relAcl,
        'options', relOptions
      ) as "extras"
    from pg_class
  union
  select
      null as "kind",
      'pg_attribute' as "type",
      attName as "name",
      relNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'relation', attRelId::regClass,
        'type', attTypId::regType,
        'length', attLen,
        'dimensions', attNDims,
        'compression', attCompression,
        'notNull', attNotNull,
        'hasDefault', attHasDef,
        'hasMissing', attHasMissing,
        'identity', attIdentity,
        'generated', attGenerated,
        'isLocal', attIsLocal,
        'ancestors', attInhCount,
        'collation', attCollation::regCollation,
        'statistics', attStatTarget,
        'acl', attAcl,
        'options', attOptions,
        'fdwOptions', attFdwOptions,
        'missingValue', attMissingVal
      ) as "extras"
    from pg_attribute
      inner join pg_class on attRelId = pg_class.oid
    where not attIsDropped
      and attNum > 0
);

create function "pg_diff" (jsonb)
returns setof "pg_diff_record"
language sql as $$
  select '-' as "kind", "type", "name", "namespace", "extras" from (
    select * from jsonb_populate_recordSet(null::"pg_diff_record", $1)
    except
    select * from "pg_diff_inspect"
  )
  union
  select '+' as "kind", "type", "name", "namespace", "extras" from (
    select * from "pg_diff_inspect"
    except
    select * from jsonb_populate_recordSet(null::"pg_diff_record", $1)
  )
$$;
