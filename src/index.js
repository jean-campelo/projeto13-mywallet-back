import express from "express";
import cors from "cors";

import { registerNewUser, accessAccount, registerNewTransaction } from "./controllers/users.controller.js"

const server = express();
server.use(cors());
server.use(express.json());
const port = 5000;


server.post("/sign-up", registerNewUser);
server.post("/sign-in", accessAccount);
server.post("/new-register", registerNewTransaction);

server.listen(port, () => console.log(`Listening on port ${port}`));
