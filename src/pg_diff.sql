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
        'accessMethod', amName,
        'tableSpace', spcName,
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
      left join pg_am on relAM = pg_am.oid
      left join pg_tablespace on relTableSpace = pg_tablespace.oid
  union
  select
      null as "kind",
      'pg_attribute' as "type",
      attRelId::regClass::text || '.' || attName as "name",
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
        'missingValue', attMissingVal,
        'default', pg_get_expr(pg_attrDef.adBin, pg_attrDef.adRelId, true)
      ) as "extras"
    from pg_attribute
      inner join pg_class on attRelId = pg_class.oid
      left join pg_attrDef
        on pg_attrDef.adRelId = pg_attribute.attRelId
          and pg_attrDef.adNum = pg_attribute.attNum
    where not attIsDropped
      and attNum > 0
  union
  select
      null as "kind",
      'pg_proc' as "type",
      proName as "name",
      proNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'owner', proOwner::regRole,
        'language', lanName,
        'cost', proCost,
        'variadic', proVariadic::regType,
        'kind', proKind,
        'isSecurityDefiner', proSecDef,
        'isLeakProof', proLeakProof,
        'isStrict', proIsStrict,
        'returnsSet', proRetSet,
        'volatility', proVolatile,
        'parallelism', proParallel,
        'numberOfArgs', proNArgs,
        'numberOfArgsWithDefaults', proNArgDefaults,
        'returnType', proRetType::regType,
        'argumentTypes', proAllArgTypes::regType[],
        'argumentModes', proArgModes,
        'argumentNames', proArgNames,
        'argumentDefaults', proArgDefaults,
        'source', proSrc,
        'bin', proBin,
        'sqlBody', proSqlBody,
        'config', proConfig,
        'acl', proAcl
      ) as "extras"
    from pg_proc
      inner join pg_language on proLang = pg_language.oid
);

create function "jsonb_delta_fn" (jsonb, jsonb)
returns jsonb
language sql as $$
  select case
    when $1 is null then $2
    else (
      select jsonb_object_agg("key", "value")
        from (
          select "key", jsonb_agg("value") as "value"
            from (
              (
                select * from jsonb_each($1)
                except
                select * from jsonb_each($2)
              )
              union
              (
                select * from jsonb_each($2)
                except
                select * from jsonb_each($1)
              )
            )
            group by "key"
        )
    )
  end
$$;

create aggregate jsonb_delta (jsonb) (
  sFunc = "jsonb_delta_fn"(jsonb, jsonb),
  sType = jsonb
);

create function "pg_diff" (jsonb, jsonb)
returns setof "pg_diff_record"
language sql as $$
  select
      string_agg("kind", '') as "kind",
      "type",
      "name",
      "namespace",
      jsonb_object_agg("kind", "extras") || jsonb_build_object(
        'delta', case
          when jsonb_delta("extras") = any_value("extras") then null
          else jsonb_delta("extras")
        end
      )::jsonb as "extras"
    from (
      select '-' as "kind", "type", "name", "namespace", "extras" from (
        select * from jsonb_populate_recordSet(null::"pg_diff_record", $1)
        except
        select * from jsonb_populate_recordSet(null::"pg_diff_record", $2)
      )
      union
      select '+' as "kind", "type", "name", "namespace", "extras" from (
        select * from jsonb_populate_recordSet(null::"pg_diff_record", $2)
        except
        select * from jsonb_populate_recordSet(null::"pg_diff_record", $1)
      )
    )
    group by "type", "name", "namespace"
$$;

create function "pg_diff" (jsonb)
returns setof "pg_diff_record"
language sql as $$
  select "pg_diff"($1, to_jsonb((select jsonb_agg(to_jsonb("pg_diff_inspect")) from "pg_diff_inspect")))
$$;
