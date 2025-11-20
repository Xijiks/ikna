import { expect, test } from "vitest";
import api from "./api.jsx";

// ============== Dummy data ==============

let user1 = {
  username: "TestUser1_" + Math.floor(Math.random() * 1000000000),
  password: "TestPassword1_",
};
let user2 = {
  username: "TestUser2_" + Math.floor(Math.random() * 1000000000),
  password: "TestPassword2_",
};
let decks = [
  {
    deckName: "First deck",
    cards: [
      {
        cardFront: "First deck - card front 1",
        cardBack: "First deck - card front 1",
      },
      {
        cardFront: "",
        cardBack: "",
      },
      {
        cardFront: "First deck - card front 3",
        cardBack: "First deck - card front 3",
      },
    ],
  },
  {
    deckName: "Second deck",
    cards: [],
  },
  {
    deckName: "Third deck",
    cards: [
      {
        cardFront: "Third deck - card front 1",
        cardBack: "Third deck - card front 1",
      },
    ],
  },
];

// ============== Authentification ==============

test("Authentification: Register a new account", async () => {
  const result = await api("post", "/register", {
    username: user1.username,
    password: user1.password,
  });
  expect(result?.status).toEqual(200); // OK
  expect(result?.data?.token).toBeTypeOf("string");
  expect(result?.data?.username).toEqual(user1.username);
});

test("Authentification: Register an account with existing name", async () => {
  const result = await api("post", "/register", {
    username: user1.username,
    password: user1.password,
  });
  expect(result?.status).toEqual(400); // Bad request
});

test("Authentification: Login with a correct password", async () => {
  const result = await api("post", "/login", {
    username: user1.username,
    password: user1.password,
  });
  user1.token = result?.data?.token;
  expect(result?.status).toEqual(200); // OK
  expect(result?.data?.token).toBeTypeOf("string");
  expect(result?.data?.username).toEqual(user1.username);
});

test("Authentification: Login with a wrong password", async () => {
  const result = await api("post", "/login", {
    username: user1.username,
    password: user1.password + "WRONG_PASSWORD",
  });
  expect(result?.status).toEqual(401); // Unauthorized
});

test("Authentification: Login using session token", async () => {
  const result = await api("post", "/login", null, user1.token);
  user1.token = result?.data?.token;
  expect(result?.status).toEqual(200); // OK
  expect(result?.data?.token).toBeTypeOf("string");
  expect(result?.data?.username).toEqual(user1.username);
});

test("Authentification: Login using wrong session token", async () => {
  const result = await api("post", "/login", null, user1.token + "WRONG_TOKEN");
  expect(result?.status).toEqual(401); // Unauthorized
});

// ============== Decks ==============

test("Decks: Create a new deck", async () => {
  // Add the first deck
  const result1 = await api(
    "post",
    "/deck/add",
    {
      deckName: decks[0].deckName,
    },
    user1.token
  );
  expect(result1?.status).toEqual(200); // OK
  // Check the deck list
  const result2 = await api("get", "/deck/list", null, user1.token);
  expect(result2?.data.map((item) => item.deckName)).toEqual([
    decks[0].deckName,
  ]);
});

test("Decks: Create multiple decks", async () => {
  // Add the second deck
  const result1 = await api(
    "post",
    "/deck/add",
    {
      deckName: decks[1].deckName,
    },
    user1.token
  );
  expect(result1?.status).toEqual(200); // OK
  // Add the third deck
  const result2 = await api(
    "post",
    "/deck/add",
    {
      deckName: decks[2].deckName,
    },
    user1.token
  );
  expect(result2?.status).toEqual(200); // OK
  // Check the deck list
  const result3 = await api("get", "/deck/list", null, user1.token);
  expect(result3?.status).toEqual(200); // OK
  expect(result3?.data.map((item) => item.deckName)).toEqual([
    decks[0].deckName,
    decks[1].deckName,
    decks[2].deckName,
  ]);
  decks[0].guid = result3?.data[0].guid;
  decks[1].guid = result3?.data[1].guid;
  decks[2].guid = result3?.data[2].guid;
});

test("Decks: Update a deck", async () => {
  // Update the second deck by ID
  const result1 = await api(
    "patch",
    "/deck/update",
    {
      deckGuid: decks[1].guid,
      deckName: decks[1].deckName + "_UPDATED",
    },
    user1.token
  );
  expect(result1?.status).toEqual(200); // OK
  // Check the deck list
  const result2 = await api("get", "/deck/list", null, user1.token);
  expect(result2?.status).toEqual(200); // OK
  expect(result2?.data.map((item) => item.deckName)).toEqual([
    decks[0].deckName,
    decks[1].deckName + "_UPDATED",
    decks[2].deckName,
  ]);
});

test("Decks: Update a non-existent deck", async () => {
  // Update a deck with a wrong ID
  const result = await api(
    "patch",
    "/deck/update",
    {
      deckGuid: "WRONG_GUID",
      deckName: decks[1].deckName + "_UPDATED",
    },
    user1.token
  );
  expect(result?.status).toEqual(404); // Not found
});

test("Decks: Delete a deck", async () => {
  // Delete the second deck by ID
  const result1 = await api(
    "delete",
    "/deck/delete",
    {
      deckGuid: decks[1].guid,
    },
    user1.token
  );
  expect(result1?.status).toEqual(200); // OK
  // Check the deck list
  const result2 = await api("get", "/deck/list", null, user1.token);
  expect(result2?.status).toEqual(200); // OK
  expect(result2?.data.map((item) => item.deckName)).toEqual([
    decks[0].deckName,
    decks[2].deckName,
  ]);
});

test("Decks: Update a deleted deck", async () => {
  // Update a deck with a wrong ID
  const result = await api(
    "patch",
    "/deck/update",
    {
      deckGuid: decks[1].guid,
      deckName: decks[1].deckName + "_UPDATED",
    },
    user1.token
  );
  expect(result?.status).toEqual(404); // Not found
});

// ============== Cards ==============

test("Cards: Add a card", async () => {
  // Add a card to the first deck
  const result1 = await api(
    "post",
    "/card/add",
    {
      deckGuid: decks[0].guid,
      cardFront: decks[0].cards[0].cardFront,
      cardBack: decks[0].cards[0].cardBack,
    },
    user1.token
  );
  expect(result1?.status).toEqual(200); // OK
  // Check the card list
  const result2 = await api(
    "post",
    "/card/list",
    {
      deckGuid: decks[0].guid,
    },
    user1.token
  );
  expect(
    result2?.data.data.map((item) => ({
      cardFront: item.cardFront,
      cardBack: item.cardBack,
    }))
  ).toEqual([
    {
      cardFront: decks[0].cards[0].cardFront,
      cardBack: decks[0].cards[0].cardBack,
    },
  ]);
});

test("Cards: Add multiple cards", async () => {
  // Add the second card to the first deck
  const result1 = await api(
    "post",
    "/card/add",
    {
      deckGuid: decks[0].guid,
      cardFront: decks[0].cards[1].cardFront,
      cardBack: decks[0].cards[1].cardBack,
    },
    user1.token
  );
  expect(result1?.status).toEqual(200); // OK
  // Add the third card to the first deck
  const result2 = await api(
    "post",
    "/card/add",
    {
      deckGuid: decks[0].guid,
      cardFront: decks[0].cards[2].cardFront,
      cardBack: decks[0].cards[2].cardBack,
    },
    user1.token
  );
  expect(result2?.status).toEqual(200); // OK
  // Check the card list
  const result3 = await api(
    "post",
    "/card/list",
    {
      deckGuid: decks[0].guid,
    },
    user1.token
  );
  expect(
    result3?.data.data.map((item) => ({
      cardFront: item.cardFront,
      cardBack: item.cardBack,
    }))
  ).toEqual([
    {
      cardFront: decks[0].cards[0].cardFront,
      cardBack: decks[0].cards[0].cardBack,
    },
    {
      cardFront: decks[0].cards[1].cardFront,
      cardBack: decks[0].cards[1].cardBack,
    },
    {
      cardFront: decks[0].cards[2].cardFront,
      cardBack: decks[0].cards[2].cardBack,
    },
  ]);
  decks[0].cards[0].guid = result3.data.data[0].guid;
  decks[0].cards[1].guid = result3.data.data[1].guid;
  decks[0].cards[2].guid = result3.data.data[2].guid;
});

test("Cards: Update a card", async () => {
  // Update the second card in the first deck
  const result1 = await api(
    "patch",
    "/card/update",
    {
      cardGuid: decks[0].cards[1].guid,
      cardFront: decks[0].cards[1].cardFront + "_UPDATED_FRONT",
      cardBack: decks[0].cards[1].cardBack + "_UPDATED_BACK",
    },
    user1.token
  );
  expect(result1?.status).toEqual(200); // OK
  // Check the card list
  const result2 = await api(
    "post",
    "/card/list",
    {
      deckGuid: decks[0].guid,
    },
    user1.token
  );
  expect(
    result2?.data.data.map((item) => ({
      cardFront: item.cardFront,
      cardBack: item.cardBack,
    }))
  ).toEqual([
    {
      cardFront: decks[0].cards[0].cardFront,
      cardBack: decks[0].cards[0].cardBack,
    },
    {
      cardFront: decks[0].cards[1].cardFront + "_UPDATED_FRONT",
      cardBack: decks[0].cards[1].cardBack + "_UPDATED_BACK",
    },
    {
      cardFront: decks[0].cards[2].cardFront,
      cardBack: decks[0].cards[2].cardBack,
    },
  ]);
});

test("Cards: Update a non-existant card", async () => {
  // Update a card in the first deck
  const result1 = await api(
    "patch",
    "/card/update",
    {
      cardGuid: "WRONG_GUID",
      cardFront: decks[0].cards[1].cardFront + "_UPDATED_FRONT",
      cardBack: decks[0].cards[1].cardBack + "_UPDATED_BACK",
    },
    user1.token
  );
  expect(result1?.status).toEqual(404); // Not found
});

test("Cards: Delete a card", async () => {
  // Delete the second card in the first deck
  const result1 = await api(
    "delete",
    "/card/delete",
    {
      cardGuid: decks[0].cards[1].guid,
    },
    user1.token
  );
  expect(result1?.status).toEqual(200); // OK
  // Check the card list
  const result2 = await api(
    "post",
    "/card/list",
    {
      deckGuid: decks[0].guid,
    },
    user1.token
  );
  expect(
    result2?.data.data.map((item) => ({
      cardFront: item.cardFront,
      cardBack: item.cardBack,
    }))
  ).toEqual([
    {
      cardFront: decks[0].cards[0].cardFront,
      cardBack: decks[0].cards[0].cardBack,
    },
    {
      cardFront: decks[0].cards[2].cardFront,
      cardBack: decks[0].cards[2].cardBack,
    },
  ]);
});

test("Cards: Update a deleted card", async () => {
  // Update the second card in the first deck
  const result1 = await api(
    "patch",
    "/card/update",
    {
      cardGuid: decks[0].cards[1].guid,
      cardFront: decks[0].cards[1].cardFront + "_UPDATED_FRONT",
      cardBack: decks[0].cards[1].cardBack + "_UPDATED_BACK",
    },
    user1.token
  );
  expect(result1?.status).toEqual(404); // Not found
});

test("Cards: Update a deleted card", async () => {
  // Update the second card in the first deck
  const result1 = await api(
    "patch",
    "/card/update",
    {
      cardGuid: decks[0].cards[1].guid,
      cardFront: decks[0].cards[1].cardFront + "_UPDATED_FRONT",
      cardBack: decks[0].cards[1].cardBack + "_UPDATED_BACK",
    },
    user1.token
  );
  expect(result1?.status).toEqual(404); // Not found
});

test("Cards: Check if cards in different decks stay separated", async () => {
  // Add a card to the third deck
  const result1 = await api(
    "post",
    "/card/add",
    {
      deckGuid: decks[2].guid,
      cardFront: decks[2].cards[0].cardFront,
      cardBack: decks[2].cards[0].cardBack,
    },
    user1.token
  );
  expect(result1?.status).toEqual(200); // OK
  // Check the card list
  const result2 = await api(
    "post",
    "/card/list",
    {
      deckGuid: decks[2].guid,
    },
    user1.token
  );
  expect(
    result2?.data.data.map((item) => ({
      cardFront: item.cardFront,
      cardBack: item.cardBack,
    }))
  ).toEqual([
    {
      cardFront: decks[2].cards[0].cardFront,
      cardBack: decks[2].cards[0].cardBack,
    },
  ]);
});
