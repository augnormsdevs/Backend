import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { About } from "../entities/about";
import { Members } from "../entities/members";
import { AccessLevel } from "../entities/accesslevel";
import { Account } from "../entities/account";
import { Gallery } from "../entities/gallery";
import { Profileimage } from "../entities/profileimage";
import { Relationship } from "../entities/relationship";
import { Verification } from "../entities/verification";
dotenv.config();


//database connection with typeorm
const databaseConnection = new DataSource({
  type: "mysql",
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: true,
  logging:true,
  entities: [About, AccessLevel, Account, Gallery, Members, Profileimage, Relationship, Verification],
  migrations: [],
});

export default databaseConnection;