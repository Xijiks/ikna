import { pool } from "../app.mjs";
import jwtVerify from "../services/jwtVerify.mjs";
import guidToId from "../services/guidToId.mjs";
import getToken from "../services/getToken.mjs";

export default async function updateCardContoller(req, res) {
  /*
    ======= Update card =======
    Expected object: {
      cardId: cardId // cardGuid: cardGuid,
      cardFront: cardFront (optional),
      cardBack: cardBack (optional)
    }
  */
  const token = getToken(req);
  req = req?.body;
  const tokenUsername = jwtVerify(token)?.username;
  const cardGuid = req?.cardGuid;
  const cardId = req?.cardId ?? (await guidToId(cardGuid, "cards"));
  let cardFront = req?.cardFront;
  let cardBack = req?.cardBack;
  // Checking token
  if (!tokenUsername) {
    res.status(401).send("Access unauthorized");
    return;
  }
  // Checking card ID
  if (!cardId) {
    res.status(404).send("Card ID missing");
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
  query = "SELECT * FROM cards WHERE user_id = ? AND id = ?";
  [result] = await pool.query(query, [userId, cardId]);
  // Checking cards with the same ID
  if (result.length === 0) {
    res.status(404).send(`Card with this ID/GUID doesn't exist`);
    return;
  }
  const deckId = result[0].id;
  cardFront = cardFront ?? result[0].card_front;
  cardBack = cardBack ?? result[0].card_back;
  // Updating card
  query = "UPDATE cards SET card_front = ?, card_back = ? WHERE id = ?";
  await pool.query(query, [cardFront, cardBack, cardId]);
  res.status(200).send("Card updated");
}
