import { sql } from "kysely";
import { db } from "../src/database";

export async function truncateTables() {
  await sql`SET FOREIGN_KEY_CHECKS=0;`.execute(db);
  await sql`truncate table ${sql.table("ratings")}`.execute(db);
  await sql`truncate table ${sql.table("reviews")}`.execute(db);
  await sql`truncate table ${sql.table("users")}`.execute(db);
  await sql`truncate table ${sql.table("castAndCrew")}`.execute(db);
  await sql`truncate table ${sql.table("names")}`.execute(db);
  await sql`truncate table ${sql.table("movies")}`.execute(db);
  await sql`SET FOREIGN_KEY_CHECKS=1;`.execute(db);
}
