import { Kysely, sql } from "kysely";
import { randomBytes } from "crypto";
import { hashPassword } from "../utils/authentication";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("users")
    .addColumn("id", "bigint", (col) => col.notNull().autoIncrement())
    .addColumn("nickName", "varchar(255)", (col) => col.notNull())
    .addColumn("email", "varchar(255)", (col) => col.notNull())
    .addColumn("role", "varchar(255)", (col) => col.notNull())
    .addColumn("passwordHash", "varchar(255)", (col) => col.notNull())
    .addColumn("salt", "varchar(255)", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP()`).notNull()
    )
    .addPrimaryKeyConstraint("PK_User", ["id"])
    .addUniqueConstraint("users_email", ["email"])
    .execute();

  const salt = randomBytes(16).toString("base64");
  const passwordHash = hashPassword(salt, "password");

  await db
    .insertInto("users")
    .values({
      nickName: "theboss",
      email: "admin@admin.com",
      role: "admin",
      passwordHash: passwordHash,
      salt: salt,
    })
    .executeTakeFirstOrThrow();

  await db.schema
    .createTable("movies")
    .addColumn("id", "bigint", (col) => col.notNull().autoIncrement())
    .addColumn("title", "varchar(255)", (col) => col.notNull())
    .addColumn("rating", "bigint", (col) => col.notNull())
    .addColumn("releaseDate", "timestamp", (col) => col.notNull())
    .addColumn("description", "varchar(255)", (col) => col.notNull())
    .addPrimaryKeyConstraint("PK_Movie", ["id"])
    .execute();

  await db.schema
    .createTable("reviews")
    .addColumn("id", "bigint", (col) => col.notNull().autoIncrement())
    .addColumn("text", "varchar(255)", (col) => col.notNull())
    .addColumn("userId", "bigint", (col) => col.notNull())
    .addColumn("movieId", "bigint", (col) => col.notNull())
    .addColumn("title", "varchar(255)", (col) => col.notNull())
    .addColumn("hasSpoiler", "boolean", (col) => col.notNull())
    .addForeignKeyConstraint(
      "review_user_id_foreign",
      ["userId"],
      "users",
      ["id"],
      (constraint) => constraint.onDelete("cascade")
    )
    .addForeignKeyConstraint(
      "review_movie_id_foreign",
      ["movieId"],
      "movies",
      ["id"],
      (constraint) => constraint.onDelete("cascade")
    )
    .addPrimaryKeyConstraint("PK_Review", ["id"])
    .execute();

  await db.schema
    .createTable("ratings")
    .addColumn("id", "bigint", (col) => col.notNull().autoIncrement())
    .addColumn("score", "bigint", (col) => col.notNull())
    .addColumn("userId", "bigint", (col) => col.notNull())
    .addColumn("movieId", "bigint", (col) => col.notNull())
    .addColumn("reviewId", "bigint")
    .addPrimaryKeyConstraint("PK_Rating", ["id"])
    .addForeignKeyConstraint(
      "rating_review_id_foreign",
      ["reviewId"],
      "reviews",
      ["id"],
      (constraint) => constraint.onDelete("cascade")
    )
    .addForeignKeyConstraint(
      "rating_user_id_foreign",
      ["userId"],
      "users",
      ["id"],
      (constraint) => constraint.onDelete("cascade")
    )
    .addForeignKeyConstraint(
      "rating_movie_id_foreign",
      ["movieId"],
      "movies",
      ["id"],
      (constraint) => constraint.onDelete("cascade")
    )
    .execute();

  await db.schema
    .createTable("names")
    .addColumn("id", "bigint", (col) => col.notNull().autoIncrement())
    .addColumn("fullName", "varchar(255)", (col) => col.notNull())
    .addColumn("description", "varchar(255)", (col) => col.notNull())
    .addPrimaryKeyConstraint("PK_Names", ["id"])
    .execute();

  await db.schema
    .createTable("castAndCrew")
    .addColumn("id", "bigint", (col) => col.notNull().autoIncrement())
    .addColumn("movieId", "bigint", (col) => col.notNull())
    .addColumn("nameId", "bigint", (col) => col.notNull())
    .addColumn("role", "varchar(255)", (col) => col.notNull())
    .addForeignKeyConstraint(
      "castAndCrew_movie_id_foreign",
      ["movieId"],
      "movies",
      ["id"],
      (constraint) => constraint.onDelete("cascade")
    )
    .addForeignKeyConstraint(
      "castAndCrew_name_id_foreign",
      ["nameId"],
      "names",
      ["id"],
      (constraint) => constraint.onDelete("cascade")
    )
    .addPrimaryKeyConstraint("PK_CastAndCrew", ["id"])
    .execute();

  //index kreálás
  await db.schema
    .createIndex("rating_creator_id_index")
    .on("ratings")
    .column("userId")
    .execute();

  await db.schema
    .createIndex("rating_target_movie_id_index")
    .on("ratings")
    .column("movieId")
    .execute();

  await db.schema
    .createIndex("rating_target_review_id_index")
    .on("ratings")
    .column("reviewId")
    .execute();

  await db.schema
    .createIndex("review_creator_id_index")
    .on("reviews")
    .column("userId")
    .execute();

  await db.schema
    .createIndex("review_target_movie_id_index")
    .on("reviews")
    .column("movieId")
    .execute();

  await db.schema
    .createIndex("castAndCrew_target_movie_id_index")
    .on("castAndCrew")
    .column("movieId")
    .execute();

  await db.schema
    .createIndex("castAndCrew_target_member_id_index")
    .on("castAndCrew")
    .column("nameId")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("castAndCrew").execute();
  await db.schema.dropTable("names").execute();
  await db.schema.dropTable("reviews").execute();
  await db.schema.dropTable("ratings").execute();
  await db.schema.dropTable("movies").execute();
  await db.schema.dropTable("users").execute();
}
