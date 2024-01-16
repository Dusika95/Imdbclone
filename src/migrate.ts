import * as path from "path";
import { promises as fs } from "fs";
import {
  Kysely,
  Migrator,
  FileMigrationProvider,
  MigrationResult,
} from "kysely";
import { Database } from "./types";
import { db } from "./database";

function getMigrator(): { migrator: Migrator; db: Kysely<Database> } {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: path.join(__dirname, "./migrations"),
    }),
  });

  return { migrator, db };
}

function handleMigrationError(
  results: MigrationResult[] | undefined,
  error: unknown
) {
  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    process.exit(1);
  }
}

export async function migrateToLatest() {
  const { migrator, db } = getMigrator();

  const { error, results } = await migrator.migrateToLatest();

  handleMigrationError(results, error);

  await db.destroy();
}

async function migrateDown() {
  const { migrator, db } = getMigrator();

  const { error, results } = await migrator.migrateDown();

  handleMigrationError(results, error);

  await db.destroy();
}

if (process.argv[2] === "up") {
  console.info("Running migratins up...");
  migrateToLatest();
} else if (process.argv[2] === "down") {
  console.info("Running migratins down...");
  migrateDown();
}
