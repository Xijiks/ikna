import { pool } from "../app.mjs";
import jwtVerify from "../services/jwtVerify.mjs";
import moment from "moment";
import newGuid from "../services/newGuid.mjs";
import getToken from "../services/getToken.mjs";
import guidToId from "../services/guidToId.mjs";

export default async function addCardContoller(req, res) {
  /*
    ======= Add card =======
    Expected object: {
      deckId: deckId // deckGuid: deckGuid
      cardFront: front (optional),
      cardBack: back (optional)
    }
  */
  const token = getToken(req);
  req = req?.body;
  const tokenUsername = jwtVerify(token)?.username;
  const deckGuid = req?.deckGuid;
  const deckId = req?.deckId ?? (await guidToId(deckGuid, "decks"));
  const cardFront = req?.cardFront ?? "";
  const cardBack = req?.cardBack ?? "";
  // Checking token
  if (!tokenUsername) {
    res.status(401).send("Access unauthorized");
    return;
  }
  // Checking deck name
  if (!deckId) {
    res.status(404).send("Deck ID/GUID missing or it doesn't exist");
    return;
  }
  let query = "SELECT id FROM users WHERE username = ?";
  let [result] = await pool.query(query, [tokenUsername]);
  // User not found
  if (result.length === 0) {
    res.status(400).send(`User ${tokenUsername} doesn't exist`);
    return;
  }
  const userId = result[0].id;
  query = "SELECT * FROM decks WHERE user_id = ? AND id = ?";
  [result] = await pool.query(query, [userId, deckId]);
  // Checking decks with the same ID
  if (result.length === 0) {
    res.status(400).send(`Deck ID/GUID doesn't exist`);
    return;
  }
  // Adding card
  query = `
    INSERT INTO cards (
      guid, user_id, deck_id, card_front, card_back,
      last_review, next_review, cur_interval, learning_step, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await pool.query(query, [
    await newGuid(),
    userId,
    deckId,
    cardFront,
    cardBack,
    0,
    0,
    0,
    0,
    "LEARNING",
  ]);
  // Updating card count
  query = "UPDATE decks SET card_count = card_count + 1 WHERE id = ?";
  await pool.query(query, [deckId]);
  res.status(200).send("Card created");
}
