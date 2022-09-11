import joi from "joi";
import db from "../database/db.js";
import dayjs from "dayjs";

const newRegister = joi.object({
  type: joi.string().required().valid("debit", "credit"),
  value: joi.number().required(),
});

async function registerNewTransaction(req, res) {
  const { type, value } = req.body;
  const { authorization } = req.headers;
  const token = authorization.replace("Bearer ", "");

  const registerIsValid = newRegister.validate(req.body, {
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
      userId: userIsLogged.userId,
      type,
      value,
      date,
    });
  } catch (error) {
    res.send(error);
  }

  res.sendStatus(201);
}

async function getTransactions(req, res) {
  const { authorization } = req.headers;
  const token = authorization.replace("Bearer ", "");

  try {
    const userIsLogged = await db.collection("sessions").findOne({ token });
    if (!userIsLogged) {
      res.sendStatus(409).send({ error: "User is not logged" });
    }
    const transactionsUser = await db
      .collection("transactions")
      .find({ userId: userIsLogged.userId })
      .toArray();
      res.send(transactionsUser);
  } catch (error) {
    res.send(error);
  }
  res.send(201)
}

export { registerNewTransaction, getTransactions };
