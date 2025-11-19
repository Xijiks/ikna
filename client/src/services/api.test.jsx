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
let decks = [];

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
  console.log();
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

// ============== Adding decks ==============
