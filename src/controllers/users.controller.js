import joi from "joi";
import bcrypt from 'bcrypt';
import db from "../database/db.js";

const newUserSchema = joi.object({
  name: joi.string().required().empty(" "),
  email: joi.string().required().email(),
  password: joi.string().required().empty(" "),
  confirmPassword: joi.ref("password"),
});

async function registerNewUser (req, res) {
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
};

async function accessAccount (req, res) {
  const { email, password } = req.body;
  

  res.send(200);
};

export { registerNewUser, accessAccount };
