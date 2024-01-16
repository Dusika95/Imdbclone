import { Database } from "./types";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect } from "kysely";

import * as dotenv from "dotenv";
dotenv.config();

const dialect = new MysqlDialect({
  pool: createPool({
    database: process.env.DATABASE,
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    port: Number(process.env.DB_PORT),
    connectionLimit: 10,
  }),
});

export const db = new Kysely<Database>({
  dialect,
});
