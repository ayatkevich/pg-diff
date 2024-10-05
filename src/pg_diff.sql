create or replace view "pg_diff_inspect" as (
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
    where relKind not in ('i', 'c', 'S')
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
      and relKind not in ('i', 'c', 'S')
  union
  select
      null as "kind",
      'pg_proc' as "type",
      format('%s(%s): %s', proName, array_to_string(proArgTypes::regType[]::text[], ', '), proRetType::regType::text)
        || case when proRetSet then ' set' else '' end as "name",
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
        'argumentTypes', proArgTypes::regType[],
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
  union
  select
      null as "kind",
      'pg_authid' as "type",
      rolName as "name",
      '' as "namespace",
      jsonb_build_object(
        'isSuperuser', rolSuper,
        'inherits', rolInherit,
        'canLogin', rolCanLogin,
        'replication', rolReplication,
        'bypassRLS', rolBypassRLS,
        'connectionLimit', rolConnLimit,
        'validUntil', rolValidUntil,
        'password', rolPassword
      ) as "extras"
    from pg_authid
  union
  select
      null as "kind",
      'pg_cast' as "type",
      castSource::regType || ' -> ' || castTarget::regType as "name",
      '' as "namespace",
      jsonb_build_object(
        'function', castFunc::regProc,
        'context', castContext,
        'method', castMethod
      ) as "extras"
    from pg_cast
  union
  select
      null as "kind",
      'pg_constraint' as "type",
      target.conName as "name",
      target.conNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'type', target.conType,
        'deferrable', target.conDeferrable,
        'deferred', target.conDeferred,
        'validated', target.conValidated,
        'relation', target.conRelId::regClass,
        'domain', target.conTypId::regType,
        'index', target.conIndId::regClass,
        'parent', parent.conName,
        'references', target.conFRelId::regClass,
        'onUpdate', target.conFUpdType,
        'onDelete', target.conFDelType,
        'onMatch', target.conFMatchType,
        'isLocal', target.conIsLocal,
        'inherited', target.conInhCount,
        'noInherit', target.conNoInherit,
        'definition', pg_get_constraintDef(target.oid)
        -- TODO conKey, conFKey, conPFEqOp, conPPEqOp, conFFEqOp, conFDelSetCols, conExclOp
      ) as "extras"
    from pg_constraint as target
      left join pg_constraint as parent on target.conParentId = parent.oid
  union
  select
      null as "kind",
      'pg_description' as "type",
      coalesce(attRelId::regClass || '.' || attName, objOId::regClass::text) || ' ' || description as "name",
      relNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'description', description,
        'column', attRelId::regClass || '.' || attName
      ) as "extras"
    from pg_description
      inner join pg_class
        on objOId = pg_class.oid
      left join pg_attribute
        on objOId = attRelId and objSubId = attNum
  union
  select
      null as "kind",
      'pg_operator' as "type",
      target.oprLeft::regType::text || ' ' || target.oprName || ' ' || target.oprRight::regType::text || ' = ' || target.oprResult::regType::text as "name",
      target.oprNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'owner', target.oprOwner::regRole,
        'kind', target.oprKind,
        'canMerge', target.oprCanMerge,
        'canHash', target.oprCanHash,
        'left', target.oprLeft::regType,
        'right', target.oprRight::regType,
        'result', target.oprResult::regType,
        'commutator', commutator.oprName,
        'negator', negator.oprName,
        'code', target.oprCode,
        'restriction', target.oprRest,
        'join', target.oprJoin
      ) as "extras"
    from pg_operator as target
      left join pg_operator as commutator
        on target.oprCom = commutator.oid
      left join pg_operator as negator
        on target.oprNegate = negator.oid
  union
  select
      null as "kind",
      'pg_policy' as "type",
      polName || ' on ' || polRelId::regClass::text as "name",
      relNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'command', polCmd,
        'isPermissive', polPermissive,
        'roles', polRoles::regRole[],
        'using', pg_get_expr(polQual, polRelId, true),
        'withCheck', pg_get_expr(polWithCheck, polRelId, true)
      ) as "extras"
    from pg_policy
      inner join pg_class
        on polRelId = pg_class.oid
  union
  select
      null as "kind",
      'pg_publication' as "type",
      pubName || ' on ' || prRelId::regClass::text as "name",
      relNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'owner', pubOwner::regRole,
        'isAllTables', pubAllTables,
        'isInsert', pubInsert,
        'isUpdate', pubUpdate,
        'isDelete', pubDelete,
        'isTruncate', pubTruncate,
        'isViaRoot', pubViaRoot
      ) as "extras"
    from pg_publication
      inner join pg_publication_rel
        on pg_publication.oid = prPubId
      inner join pg_class
        on prRelId = pg_class.oid
  union
  select
      null as "kind",
      'pg_publication' as "type",
      pubName || ' on schema ' || pnNspId::regNamespace::text as "name",
      pnNspId::regNamespace::text as "namespace",
      jsonb_build_object() as "extras"
    from pg_publication
      inner join pg_publication_namespace
        on pg_publication.oid = pnPubId
  union
  select
      null as "kind",
      'pg_rewrite' as "type",
      ruleName || ' on ' || ev_class::regClass::text as "name",
      relNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'type', ev_type,
        'enabled', ev_enabled,
        'isInstead', is_instead,
        'definition', pg_get_ruleDef(pg_rewrite.oid)
      ) as "extras"
    from pg_rewrite
      inner join pg_class
        on ev_class = pg_class.oid
  union
  select
      null as "kind",
      'pg_trigger' as "type",
      tgName || ' on ' || tgRelId::regClass::text as "name",
      relNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'isClone', tgParentId != 0,
        'definition', pg_get_triggerDef(pg_trigger.oid),
        'type', tgType,
        'enabled', tgEnabled,
        'isDeferral', tgDeferrable,
        'isDeferred', tgInitDeferred
      ) as "extras"
    from pg_trigger
      inner join pg_class
        on tgRelId = pg_class.oid
    where not tgIsInternal
  union
  select
      null as "kind",
      'pg_type' as "type",
      typName as "name",
      typNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'owner', typOwner::regRole,
        'length', typLen,
        'isByValue', typByVal,
        'type', typType,
        'category', typCategory,
        'isPreferred', typIsPreferred,
        'isDefined', typIsDefined,
        'delimiter', typDelim, -- cspell:disable-line
        'relation', typRelId::regClass,
        'subscript', typSubscript,
        'array', typArray::regType,
        'inputFunction', typInput::regProc,
        'outputFunction', typOutput::regProc,
        'receiveFunction', typReceive::regProc,
        'sendFunction', typSend::regProc,
        'modifierInputFunction', typModIn::regProc,
        'modifierOutputFunction', typModOut::regProc,
        'analyzeFunction', typAnalyze::regProc,
        'align', typAlign,
        'storage', typStorage,
        'notNull', typNotNull,
        'baseType', typBaseType::regType,
        'typeMod', typTypMod,
        'numberOfDimensions', typNDims,
        'collation', typCollation::regCollation,
        'default', typDefault,
        'acl', typAcl
      ) as "extras"
    from pg_type
      left join pg_class on typRelId = pg_class.oid
    where typType != 'b'
      and relKind is distinct from 'r'
      and relKind is distinct from 'v'
  union
  select
      null as "kind",
      'pg_sequence' as "type",
      seqRelId::regClass::text as "name",
      relNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'start', seqStart,
        'increment', seqIncrement,
        'maxValue', seqMax,
        'minValue', seqMin,
        'cacheValue', seqCache,
        'isCycled', seqCycle
      ) as "extras"
    from pg_sequence
      inner join pg_class on seqRelId = pg_class.oid
    where relKind = 'S'
  union
  select
      null as "kind",
      'pg_extension' as "type",
      extName as "name",
      extNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'owner', extOwner::regRole,
        'version', extVersion,
        'config', extConfig::regClass[],
        'condition', extCondition
      ) as "extras"
    from pg_extension
  union
  select
      null as "kind",
      'pg_database' as "type",
      datName as "name",
      '' as "namespace",
      jsonb_build_object(
        'dba', datDba::regRole,
        'encoding', pg_encoding_to_char(encoding),
        'localeProvider', datLocProvider,
        'isTemplate', datIsTemplate,
        'allowConnections', datAllowConn,
        'connectionLimit', datConnLimit,
        'collate', datCollate,
        'lcType', datCType,
        'icuLocale', datICULocale,
        'icuRules', datICURules,
        'collVersion', datCollVersion,
        'acl', datAcl
      ) as "extras"
    from pg_database
  union
  select
      null as "kind",
      'pg_namespace' as "type",
      nspName as "name",
      '' as "namespace",
      jsonb_build_object(
        'owner', nspOwner::regRole,
        'acl', nspAcl
      ) as "extras"
    from pg_namespace
  union
  select
      null as "kind",
      'pg_event_trigger' as "type",
      evtName as "name",
      '' as "namespace",
      jsonb_build_object(
        'event', evtEvent,
        'owner', evtOwner::regRole,
        'function', evtFoId::regProc,
        'enabled', evtEnabled,
        'tags', evtTags
      ) as "extras"
    from pg_event_trigger
  union
  select
      null as "kind",
      'pg_collation' as "type",
      collName as "name",
      collNamespace::regNamespace::text as "namespace",
      jsonb_build_object(
        'owner', collOwner::regRole,
        'provider', collProvider,
        'encoding', pg_encoding_to_char(collEncoding),
        'collate', collCollate,
        'type', collCType,
        'locale', collICULocale,
        'rules', collICURules,
        'deterministic', collIsDeterministic
      ) as "extras"
    from pg_collation
  union
  -- TODO test
  select
      null as "kind",
      'pg_subscription' as "type",
      subName as "name",
      '' as "namespace",
      jsonb_build_object(
        'owner', subOwner::regRole,
        'enabled', subEnabled,
        'binary', subBinary,
        'stream', subStream,
        'twoPhaseState', subTwoPhaseState,
        'disableOnError', subDisableOnErr,
        'passwordRequired', subPasswordRequired,
        'runAsOwner', subRunAsOwner,
        'connectionInfo', subConnInfo,
        'slotName', subSlotName,
        'syncCommit', subSyncCommit,
        'publications', subPublications,
        'origin', subOrigin
      ) as "extras"
    from pg_subscription
);

create or replace function "jsonb_delta_fn" ("~state" jsonb, "~value" jsonb)
returns jsonb
language sql as $$
  select case
    when "~state" is null then "~value"
    else (
      select jsonb_object_agg("key", "value")
        from (
          select "key", jsonb_agg("value") as "value"
            from (
              (
                select * from jsonb_each("~state")
                except
                select * from jsonb_each("~value")
              )
              union
              (
                select * from jsonb_each("~value")
                except
                select * from jsonb_each("~state")
              )
            )
            group by "key"
        )
    )
  end
$$;

create or replace aggregate "jsonb_delta" (jsonb) (
  sFunc = "jsonb_delta_fn"(jsonb, jsonb),
  sType = jsonb
);

create or replace function "pg_diff" ("~left" jsonb, "~right" jsonb)
returns setof "pg_diff_inspect"
language sql as $$
  select
      case
        when string_agg("kind", '') in ('+-', '-+') then '+-'
        else string_agg("kind", '')
      end as "kind",
      "type",
      "name",
      "namespace",
      jsonb_object_agg("kind", "extras") || jsonb_build_object(
        'delta', case
          when "jsonb_delta"("extras") = any_value("extras") then null
          else "jsonb_delta"("extras")
        end
      )::jsonb as "extras"
    from (
      select '-' as "kind", "type", "name", "namespace", "extras" from (
        select * from jsonb_populate_recordSet(null::"pg_diff_inspect", "~left")
        except
        select * from jsonb_populate_recordSet(null::"pg_diff_inspect", "~right")
      )
      union
      select '+' as "kind", "type", "name", "namespace", "extras" from (
        select * from jsonb_populate_recordSet(null::"pg_diff_inspect", "~right")
        except
        select * from jsonb_populate_recordSet(null::"pg_diff_inspect", "~left")
      )
    )
    group by "type", "name", "namespace"
$$;
