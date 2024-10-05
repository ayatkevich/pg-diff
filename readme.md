# pg-diff

A Node.js library and PostgreSQL extension for diffing PostgreSQL schemas. `pg-diff` allows you to compare two PostgreSQL database schemas and identify the differences between them. It's particularly useful for tracking schema changes over time or ensuring consistency between development and production environments.

## Features

- **Schema Inspection**: Generate a JSON representation of your database schema.
- **Schema Diffing**: Compute the differences between two database schemas.
- **Comprehensive Support**: Supports tables, columns, functions, roles, casts, constraints, comments, operators, policies, publications, rules, triggers, types, sequences, extensions, databases, schemas, and event triggers.
- **Node.js Bindings**: Easy integration with Node.js applications using `postgres` or similar libraries.

## Installation

Install the package via npm:

```bash
npm install @ayatkevich/pg-diff
```

## Setup

Before using `pg-diff`, you need to execute the SQL definitions that create the necessary functions and views in your PostgreSQL database. The SQL code is provided in the `definition` export.

```javascript
import { definition } from "@ayatkevich/pg-diff";
import postgres from "postgres";

const sql = postgres({
  /* your connection config */
});

// Execute the SQL definitions
await sql([definition]);
```

## Usage

### Importing the Library

```javascript
import { definition, inspect, diff } from "@ayatkevich/pg-diff";
```

### Inspecting the Database Schema

Use the `inspect` function to generate a JSON representation of your current database schema.

```javascript
const beforeSchema = await inspect(sql);
```

- **Parameters**:

  - `sql`: An instance of your PostgreSQL client (e.g., from the `postgres` library).

- **Returns**: A Promise that resolves to a JSON object representing the database schema.

### Making Schema Changes

Perform any schema changes using your preferred method (e.g., executing SQL statements).

```javascript
await sql`CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);`;
```

### Re-Inspecting the Database Schema

After making changes, re-run the `inspect` function to get the updated schema.

```javascript
const afterSchema = await inspect(sql);
```

### Computing Differences

Use the `diff` function to compute the differences between the two schemas.

```javascript
const schemaDifferences = await diff(sql, { left: beforeSchema, right: afterSchema });
```

- **Parameters**:

  - `sql`: An instance of your PostgreSQL client.
  - `left`: The initial schema JSON object.
  - `right`: The updated schema JSON object.

- **Returns**: A Promise that resolves to an array of difference objects.

### Example

```javascript
import postgres from "postgres";
import { definition, inspect, diff } from "@ayatkevich/pg-diff";

(async () => {
  const sql = postgres({ user: "postgres" });

  // Execute the SQL definitions to set up pg-diff
  await sql.begin(async (sql) => {
    await sql.file("./path/to/pg_diff.sql");
  });

  // Inspect the initial database schema
  const before = await inspect(sql);

  // Make schema changes
  await sql`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE
    );
  `;

  // Inspect the schema after changes
  const after = await inspect(sql);

  // Compute the differences
  const differences = await diff(sql, { left: before, right: after });

  // Output the differences
  console.log(JSON.stringify(differences, null, 2));

  await sql.end();
})();
```

### Sample Output

```json
[
  {
    "kind": "+",
    "type": "pg_class",
    "name": "users",
    "namespace": "public",
    "extras": {
      "+": {
        "type": "users",
        "owner": "postgres",
        "kind": "r",
        "accessMethod": "heap",
        "persistence": "p",
        "replicaIdentity": "d",
        "acl": null,
        "options": null,
        "isShared": false,
        "tableSpace": null,
        "isPartition": false,
        "rowSecurity": false,
        "forceRowSecurity": false,
        "ofType": "-",
        "delta": null
      }
    }
  },
  {
    "kind": "+",
    "type": "pg_attribute",
    "name": "users.id",
    "namespace": "public",
    "extras": {
      "+": {
        "relation": "users",
        "type": "integer",
        "length": 4,
        "notNull": true,
        "hasDefault": true,
        "identity": "a",
        "generated": "",
        "isLocal": true,
        "collation": "-",
        "compression": "",
        "statistics": -1,
        "options": null,
        "acl": null,
        "fdwOptions": null,
        "missingValue": null,
        "default": "nextval('users_id_seq'::regclass)",
        "hasMissing": false,
        "dimensions": 0,
        "ancestors": 0,
        "delta": null
      }
    }
  }
  // Additional differences...
]
```

## API Reference

### `inspect(sql)`

Generates a JSON representation of the current database schema.

- **Parameters**:

  - `sql`: PostgreSQL client instance.

- **Returns**: Promise resolving to a JSON object.

### `diff(sql, { left, right })`

Computes the differences between two database schemas.

- **Parameters**:

  - `sql`: PostgreSQL client instance.
  - `left`: JSON object of the initial schema.
  - `right`: JSON object of the updated schema.

- **Returns**: Promise resolving to an array of difference objects.

### Difference Object Structure

Each difference object contains the following properties:

- `kind`: A string indicating the type of change:
  - `"+"`: Addition.
  - `"-"`: Deletion.
  - `"+-"`: Modification.
- `type`: The PostgreSQL object type (e.g., `"pg_class"`, `"pg_attribute"`).
- `name`: The name of the object.
- `namespace`: The schema namespace.
- `extras`: An object containing additional details:
  - `"+"`: The new state of the object.
  - `"-"`: The old state of the object.
  - `"delta"`: The differences between the old and new states.

## Supported PostgreSQL Objects

`pg-diff` supports diffing a wide range of PostgreSQL objects:

- **Tables** (`pg_class`)
- **Columns** (`pg_attribute`)
- **Functions** (`pg_proc`)
- **Roles** (`pg_authid`)
- **Casts** (`pg_cast`)
- **Constraints** (`pg_constraint`)
- **Comments** (`pg_description`)
- **Operators** (`pg_operator`)
- **Policies** (`pg_policy`)
- **Publications** (`pg_publication`)
- **Rules** (`pg_rewrite`)
- **Triggers** (`pg_trigger`)
- **Types** (`pg_type`)
- **Sequences** (`pg_sequence`)
- **Extensions** (`pg_extension`)
- **Databases** (`pg_database`)
- **Schemas** (`pg_namespace`)
- **Event Triggers** (`pg_event_trigger`)
- **Collation** (`pg_collation`)
- **Subscription** (`pg_subscription`)

## Testing

To run the tests, make sure you have `jest` installed:

```bash
npm install
npm test
```

The test suite covers various scenarios to ensure the library works as expected.

## Todo

Sure! Here's the list of missing PostgreSQL objects formatted as a Markdown TODO list:

# TODO List of Missing PostgreSQL Objects

- [ ] **Conversions**

  - **System Catalog**: `pg_conversion`
  - **Description**: Used for character set conversions between different encodings.

- [ ] **Foreign Data Wrappers, Servers, and User Mappings**

  - **System Catalogs**: `pg_foreign_data_wrapper`, `pg_foreign_server`, `pg_user_mapping`
  - **Description**: Access external data sources through the Foreign Data Wrapper (FDW) mechanism.

- [ ] **Text Search Objects**

  - **System Catalogs**: `pg_ts_config`, `pg_ts_dict`, `pg_ts_parser`, `pg_ts_template`
  - **Description**: Objects used for full-text search configurations, dictionaries, parsers, and templates.

- [ ] **Operator Classes and Operator Families**

  - **System Catalogs**: `pg_opclass`, `pg_opfamily`
  - **Description**: Define how data types behave with indexes; essential for custom indexing strategies.

- [ ] **Access Methods**

  - **System Catalog**: `pg_am`
  - **Description**: Define how the database accesses data. While joined in `pg_class`, standalone access methods are not included.

- [ ] **Aggregates**

  - **System Catalog**: `pg_aggregate`
  - **Description**: Aggregates have additional metadata beyond `pg_proc`, stored in `pg_aggregate`.

- [ ] **Tablespaces**

  - **System Catalog**: `pg_tablespace`
  - **Description**: Define locations on the file system where data files reside; important for storage management.

- [ ] **Extended Statistics**

  - **System Catalog**: `pg_statistic_ext`
  - **Description**: Hold extended statistics like multivariate statistics for better query planning.

- [ ] **Range Types**

  - **System Catalog**: `pg_range`
  - **Description**: Represent data types that are ranges over some element type.

- [ ] **Materialized Views**

  - **System Catalog**: `pg_class` (with `relkind = 'm'`)
  - **Description**: Views that store data physically; identified with `relkind = 'm'`.

- [ ] **Foreign Tables**

  - **System Catalog**: `pg_class` (with `relkind = 'f'`)
  - **Description**: Tables that use a foreign data wrapper to access external data.

- [ ] **Statistics Objects**

  - **System Catalog**: `pg_statistic`
  - **Description**: Hold statistics about the contents of the database for the query planner.

- [ ] **Role Memberships**

  - **System Catalog**: `pg_auth_members`
  - **Description**: Define role memberships, showing which roles are members of other roles.

- [ ] **Default ACLs**

  - **System Catalog**: `pg_default_acl`
  - **Description**: Default access control lists that apply to objects created in the future.

- [ ] **Large Object Metadata**

  - **System Catalog**: `pg_largeobject_metadata`
  - **Description**: Stores metadata about large objects (BLOBs).

- [ ] **Replication Slots**

  - **System Catalog**: `pg_replication_slots`
  - **Description**: Used in replication to keep track of the state between publisher and subscriber.

- [ ] **Event Trigger Functions (Details)**

  - **System Catalog**: `pg_event_trigger` (function details)
  - **Description**: While `pg_event_trigger` is included, details about associated functions might be missing.

- [ ] **Policies on Other Objects**

  - **System Catalog**: Policies on sequences, functions, etc.
  - **Description**: Policies defined on objects other than tables.

- [ ] **Rules on Other Objects**

  - **System Catalog**: Rules on views, etc.
  - **Description**: Rules can be defined on views and other objects.

- [ ] **Foreign Keys and Relationship Details**

  - **System Catalog**: `pg_constraint` (additional details)
  - **Description**: Detailed information about foreign keys may be incomplete.

- [ ] **Operator Exclusion Constraints**

  - **System Catalog**: `pg_constraint` (with `contype = 'x'`)
  - **Description**: Exclusion constraints using operators to enforce complex rules.

- [ ] **Domain Constraints**

  - **System Catalog**: `pg_constraint` (with `contype = 'c'` and associated with domains)
  - **Description**: Constraints defined on domains.

- [ ] **Enums (Enumeration Types)**

  - **System Catalog**: `pg_enum`
  - **Description**: Enumeration values for enum types; while types may be included, enum values might not be.

- [ ] **Foreign Partitions**

  - **System Catalog**: `pg_inherits`, `pg_class` (with `relkind = 'p'` and `relispartition = true`)
  - **Description**: Partitions that are foreign tables.

- [ ] **User-Defined Languages**

  - **System Catalog**: `pg_language`
  - **Description**: Languages available for writing functions and procedures.

- [ ] **Procedures**

  - **System Catalog**: `pg_proc` (with `prokind = 'p'`)
  - **Description**: Stored procedures differ from functions and may need separate handling.

- [ ] **Publications Without Tables or Schemas**

  - **System Catalog**: `pg_publication`
  - **Description**: Publications that don't have associated tables or schemas.

- [ ] **Composite Types Details**

  - **System Catalog**: `pg_type` (with `typtype = 'c'`)
  - **Description**: While types are included, detailed attribute information may be missing.

- [ ] **Partitioned Tables**

  - **System Catalog**: `pg_class` (with `relkind = 'p'`)
  - **Description**: Tables that serve as partitioned parents.

- [ ] **Statistics Extended Options**
  - **System Catalog**: `pg_statistic_ext_data`
  - **Description**: Data for extended statistics objects.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to discuss any changes or enhancements.

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please open an issue on the [GitHub repository](https://github.com/ayatkevich/pg-diff).
