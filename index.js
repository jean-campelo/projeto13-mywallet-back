import express from "express";
import cors from "cors";
import joi from "joi";
import bcrypt from "bcrypt";

import db from "./db.js";

const server = express();
server.use(cors());
server.use(express.json());
const port = 5000;

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

  try {
    const userAlreadyRegistered = await db
      .collection("users")
      .findOne({ email });
    if (userAlreadyRegistered) {
      res.send("User already registered").sendStatus(422);
      return;
    }
  } catch (error) {
    return res.sendStatus(500);
  }

  try {
    //register new user
    db.collection("users").insertOne({
      name,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
    });
  } catch (error) {
    return res.sendStatus(500);
  }

  res.sendStatus(201);
});

server.listen(port, () => console.log(`Listening on port ${port}`));
