import express from "express";
import cors from "cors";
import joi from "joi";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());
const port = 5000;
const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("MyWallet");
});

const newUserSchema = joi.object({
  name: joi.string().required().empty(" "),
  email: joi.string().required().email(),
  password: joi.string().required().empty(" "),
  confirmPassword: joi.ref("password"),
});

server.post("/sign-up", async (req, res) => {
  const { name, email, password } = req.body;

  const validationNewUser = newUserSchema.validate(req.body, {
    abortEarly: false,
  });
  
  if (validationNewUser.error) {
    const errors = validationNewUser.error.details.map(
      (detail) => detail.message
    );
    return res.send(errors).sendStatus(422);
  }

  const userAlreadyRegistered = await db.collection("users").findOne({ email });
   if (userAlreadyRegistered) {
    res.send("User already registered").sendStatus(422);
    return;
   }


  res.sendStatus(201);
});

server.listen(port, () => console.log(`Listening on port ${port}`));
