import joi from "joi";
import bcrypt from "bcrypt";
import db from "../database/db.js";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

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

const newRegisterDebit = joi.object({
  type: joi.string().required().valid("debit"),
  value: joi.number().required(),
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
    return res.send({ message: errors }).sendStatus(422);
  }

  try {
    const userAlreadyRegistered = await db
      .collection("users")
      .findOne({ email });
    if (userAlreadyRegistered) {
      res.status(422).send("User already registered");
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
    return res.send(errors).sendStatus(422);
  }

  try {
    const userRegistered = await db.collection("users").findOne({ email });
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

async function registerNewDebit(req, res) {
  const { type, value } = req.body;
  const { authorization } = req.headers;
  const token = authorization.replace("Bearer ", "");

  const registerIsValid = newRegisterDebit.validate(req.body, {
    abortEarly: false,
  });

  if (registerIsValid.error) {
    const errors = registerIsValid.error.details.map(
      (detail) => detail.message
    );
    return res.send({ message: errors }).sendStatus(422);
  }

  try {
    const userIsLogged = await db.collection("sessions").findOne({ token });
    if (!userIsLogged) {
      res.sendStatus(409).send({ error: "User is not logged" });
    }
    const date = dayjs().locale("pt").format("DD/MM");
    db.collection("transactions").insertOne({
      userId: userIsLogged._id,
      type,
      value,
      date,
    });
  } catch (error) {
    res.send(error);
  }

  res.sendStatus(201);
}

export { registerNewUser, accessAccount, registerNewDebit };
