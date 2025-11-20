import { pool } from "../app.mjs";
import argon2 from "argon2";
import jwtSign from "../services/jwtSign.mjs";
import jwtVerify from "../services/jwtVerify.mjs";
import getToken from "../services/getToken.mjs";

export default async function loginController(req, res) {
  /*
    ======= User login =======
    Expected object: {
      username: username,
      password: password
    }
    or {} if token is present
  */
  const token = getToken(req);
  req = req?.body;
  const tokenUsername = jwtVerify(token)?.username;
  const username = req?.username;
  const password = req?.password;
  // Checking token
  if (tokenUsername && !username && !password) {
    // User authorized (via token)
    const data = {
      token: jwtSign({ username: tokenUsername }),
      username: tokenUsername,
    };
    res.status(200).send(data);
    return;
  }
  // Checking username/password
  if (username && password) {
    const query = "SELECT * FROM users WHERE username = ?";
    let [result] = await pool.query(query, [username]);
    // User not found
    if (result.length === 0) {
      res.status(401).send("Wrong username or password");
      return;
    }
    const salt = result[0].password_salt;
    const hash = result[0].password_hash;
    // Password check
    const isValid = await argon2.verify(hash, password.concat(salt));
    if (isValid) {
      // User authorized (via password)
      const data = {
        token: jwtSign({ username: username }),
        username: username,
      };
      res.status(200).send(data);
    } else res.status(401).send("Wrong username or password");
    return;
  }
  // No username/password, no token
  res.status(401).send("Access denied");
}
