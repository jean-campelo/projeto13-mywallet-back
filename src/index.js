import express from "express";
import cors from "cors";

import { registerNewUser, accessAccount, registerNewDebit } from "./controllers/users.controller.js"

const server = express();
server.use(cors());
server.use(express.json());
const port = 5000;


server.post("/sign-up", registerNewUser);
server.post("/sign-in", accessAccount);
server.post("/new-debit", registerNewDebit);

server.listen(port, () => console.log(`Listening on port ${port}`));
