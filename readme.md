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

## Testing

To run the tests, make sure you have `jest` installed:

```bash
npm install
npm test
```

The test suite covers various scenarios to ensure the library works as expected.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to discuss any changes or enhancements.

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please open an issue on the [GitHub repository](https://github.com/ayatkevich/pg-diff).
