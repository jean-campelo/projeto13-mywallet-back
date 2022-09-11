import joi from "joi";
import bcrypt from "bcrypt";
import db from "../database/db.js";
import { v4 as uuid } from "uuid";

const newUserSchema = joi.object({
  name: joi.string().required().empty(" "),
  email: joi.string().required().email(),
  password: joi.string().required().empty(" "),
  confirmPassword: joi.ref("password"),
});

const userSchema = joi.object({
  email: joi.string().required().email(),
  password: joi.string().required().empty(" "),
});

async function registerNewUser(req, res) {
  const { name, email, password } = req.body;

  const validationNewUser = newUserSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validationNewUser.error) {
    const errors = validationNewUser.error.details.map(
      (detail) => detail.message
    );
    return res.status(422).send({ message: errors });
  }

  try {
    const userAlreadyRegistered = await db
      .collection("users")
      .findOne({ email });
    if (userAlreadyRegistered) {
      res.status(422).send({message: "User already registered"});
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
}

async function accessAccount(req, res) {
  const { email, password } = req.body;

  const userValidation = userSchema.validate(req.body, { abortEarly: false });

  if (userValidation.error) {
    const errors = userValidation.error.details.map((detail) => detail.message);
    return res.status(422).send({ message: errors });
  }

  try {
    const userRegistered = await db.collection("users").findOne({ email });
    
    if(!userRegistered) {
      return res.status(422).send({message: "email or password incorrects"})
    }

    const passwordIsValid = bcrypt.compareSync(
      password,
      userRegistered.passwordHash
    );

    if (!passwordIsValid) {
      return res.sendStatus(422).send({ error: "Invalid email or password" });
    }

    //new token for session
    const token = uuid();
    db.collection("sessions").insertOne({ userId: userRegistered._id, token });
    res.send({ name: userRegistered.name, token });
  } catch (error) {
    return res.sendStatus(500);
  }

  res.sendStatus(201);
}

export { registerNewUser, accessAccount };
