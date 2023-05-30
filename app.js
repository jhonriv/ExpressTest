const express = require("express");
const fs = require("fs");
const User = require("./User");
const app = express();
const port = 3000;
var users = fs.existsSync("./db.json")
  ? JSON.parse(fs.readFileSync("./db.json", "utf-8"))
  : false;
var userLogin = {};

/**
 * Checks if user is authenticated with a valid token.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The next middleware function.
 * @return {void} Returns nothing.
 */
function isAuth(req, res, next) {
  const token = req.headers.authorization;
  if (token === "" || token === undefined || token.split(" ")[0] !== "Basic")
    return res.status(401).send({ message: "Unauthorized" });

  if (!users)
    return res.status(500).send({ message: "Internal Database Error" });
  const credentials = Buffer.from(token.split(" ")[1], "base64").toString(
    "ascii"
  );
  const [username, password] = credentials.split(":");
  userLogin = users.find(
    (user) => user.username === username && user.password === password
  );
  if (userLogin === undefined)
    return res.status(401).send({ message: "Unauthorized" });

  next();
}

/**
 * Retrieves all user data.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @throws {Object} Forbidden operation error if the user is not authorized to access the data.
 */
app.get("/users", isAuth, (req, res) => {
  if (userLogin.role !== "admin")
    return res.status(403).send({ message: "Forbidden operation" });

  let output = [];
  for (const user of users) {
    let children =
      user.users.length > 0
        ? users.filter((u) => {
            if (user.users.includes(u.username)) return u;
            else return false;
          })
        : [];
    output.push({ ...user, users: children });
  }

  return res.status(200).send(output);
});

/**
 * Creates a new user and saves it to the database file.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @return {Object} The new user data.
 * @throws {Object} Forbidden operation error if the user is not authorized to create a new user,
 *                  User Already Exists error if the user already exists,
 *                  and Missing mandatory fields error if a required field is missing.
 */
app.post("/user", isAuth, (req, res) => {
  const data = req.query;
  if (userLogin.role === "user")
    return res.status(403).send({ message: "Forbidden operation" });

  if (data.role === "admin")
    return res.status(403).send({ message: "Forbidden operation" });

  if (userLogin.role === "manager" && data.role === "manager")
    return res.status(403).send({ message: "Forbidden operation" });

  let user = users.find((user) => user.username === data.username);
  if (user !== undefined)
    return res.status(409).send({ message: "User Already Exists" });

  try {
    user = new User(data.username, data.password, data.role, data.users);
  } catch (error) {
    return res.status(400).send({ message: "Missing mandatory fields" });
  }

  users.push(user);
  const index = users.findIndex((user) => user.username === userLogin.username);
  if (!users[index].users.includes(user.username))
    users[index].users.push(user.username);
  fs.writeFileSync("./db.json", JSON.stringify(users), "utf-8");

  return res.status(201).send(user);
});

/**
 * Retrieves user data for the specified username.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @return {Object} The user data for the specified username.
 * @throws {Object} Forbidden operation error if the user is not authorized to access the data.
 */
app.get("/user/:username", isAuth, (req, res) => {
  let user = undefined;

  if (userLogin.role === "admin")
    user = users.find((user) => user.username === req.params.username);
  if (userLogin.role === "manager") {
    if (userLogin.username === req.params.username) user = userLogin;
    else
      user = userLogin.users.includes(req.params.username)
        ? users.find((user) => user.username === req.params.username)
        : undefined;
  }
  if (userLogin.role === "user") {
    if (userLogin.username === req.params.username) user = userLogin;
  }

  if (user === undefined)
    return res.status(403).send({ message: "Forbidden operation" });

  console.log({ user });
  let children =
    user.users.length > 0
      ? users.filter((u) => {
          if (user.users.includes(u.username)) return u;
          else return false;
        })
      : [];

  return res.status(200).send({ ...user, users: children });
});

app.put("/user/:username", isAuth, (req, res) => {
  const data = req.query;
  if (userLogin.role === "user")
    return res.status(403).send({ message: "Forbidden operation" });

  if (data.role === "admin")
    return res.status(403).send({ message: "Forbidden operation" });

  if (
    req.params.username !== data.username &&
    users.findIndex((user) => user.username === req.params.username) === -1
  )
    return res.status(409).send({ message: "Username Already Exists" });

  if (
    userLogin.role === "manager" &&
    !userLogin.users.includes(req.params.username)
  )
    return res.status(403).send({ message: "Forbidden operation" });

  let index = users.findIndex((user) => user.username === req.params.username);
  if (index === -1)
    return res.status(403).send({ message: "Forbidden operation" });

  let userPut = {};
  try {
    userPut = new User(data.username, data.password, data.role, data.users);
  } catch (error) {
    return res.status(400).send({ message: "Missing mandatory fields" });
  }
  users[index] = userPut;
  index = userLogin.users.findIndex((user) => user === req.params.username);
  userLogin.users.splice(index, 1, data.username);
  fs.writeFileSync("./db.json", JSON.stringify(users), "utf-8");
  return res.status(200).send(userPut);
});

/**
 * Deletes a user from the database.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @throws {Object} Forbidden error if the user is not authorized to delete the user.
 *                  The function does not return any data on success.
 */
app.delete("/user/:username", isAuth, (req, res) => {
  const data = req.query;
  if (req.params.username === userLogin.username)
    return res.status(403).send({ message: "Forbidden" });

  if (!userLogin.users.includes(req.params.username))
    return res.status(403).send({ message: "Forbidden operation" });

  let userDelete = users.findIndex(
    (user) => user.username === req.params.username
  );
  users.splice(userDelete, 1);
  userDelete = userLogin.users.findIndex(
    (user) => user === req.params.username
  );
  userLogin.users.splice(userDelete, 1);
  const index = users.findIndex((user) => user.username === userLogin.username);
  users[index] = userLogin;
  fs.writeFileSync("./db.json", JSON.stringify(users), "utf-8");

  return res.status(204).send();
});

/**
 * Deletes all users from the database.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @throws {Object} Forbidden error if the user is not an admin.
 *                  The function does not return any data on success.
 */
app.delete("/users", isAuth, (req, res) => {
  if (userLogin.role !== "admin")
    return res.status(403).send({ message: "Forbidden operation" });

  userLogin.users = [];
  users = [userLogin];
  fs.writeFileSync("./db.json", JSON.stringify(users), "utf-8");

  return res.status(204).send();
});

app.listen(port, () => console.log(`Express app running on port ${port}!`));
//module.exports = app;
