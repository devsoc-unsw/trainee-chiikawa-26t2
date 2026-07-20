# Guide: Implementing the Login Route with MongoDB

This is a learning guide, not a copy-paste solution. It explains the concepts
you need, then gives you a checklist of steps to implement yourself. Where
code appears, it's either infrastructure boilerplate (connection setup) or a
short example to illustrate a concept — the actual login logic is left for
you to write.

---

## 1. MongoDB in one page

MongoDB is a **document database**. Instead of tables and rows (SQL), you
have **collections** and **documents**.

| SQL term | MongoDB term |
|---|---|
| Database | Database |
| Table | Collection |
| Row | Document |
| Column | Field |

A document is basically a JSON object. Example — a document in a `users`
collection:

```json
{
  "_id": "ObjectId('64f1a2b3c4d5e6f7a8b9c0d1')",
  "email": "alice@example.com",
  "passwordHash": "$2b$10$abcdefghijklmnopqrstuv",
  "createdAt": "2026-07-20T10:00:00.000Z"
}
```

Key differences from SQL that matter for you:

- **`_id` is automatic.** Every document gets a unique `_id` (an `ObjectId`)
  unless you set one yourself. This is your primary key.
- **No schema is enforced by the database.** Nothing stops you from inserting
  a document missing a field, or with an extra one. This means *your
  application code* is responsible for making sure documents are shaped
  consistently. (You could add schema validation later, but skip that for
  now — write clean insert/query code instead.)
- **No JOINs.** MongoDB is not built around joining collections together.
  For this app, you probably won't need to join `users` with anything for
  login — just keep it in mind for later features.
- **Queries look like objects, not SQL strings.** E.g. "find the user with
  this email" is `collection.findOne({ email: "alice@example.com" })`, not
  a `SELECT` string.

---

## 2. The driver you're using: `mongodb` (native), not Mongoose

Your `backend/package.json` depends on the **official `mongodb` npm
package** — this is the low-level driver straight from MongoDB, not an ORM
like Mongoose. That means:

- No schemas defined in code, no models with `.save()` methods.
- You work directly with a `Collection` object and call methods like
  `.findOne()`, `.insertOne()`, `.updateOne()` on it.
- TypeScript types for documents are just plain `interface`s you write
  yourself — they're not enforced at runtime, only checked at compile time.

This is a good thing to learn on directly, since it maps closely to how
MongoDB actually works, without an abstraction layer hiding it.

---

## 3. Connecting to MongoDB

You already have a stub at [backend/src/config/database.ts](../backend/src/config/database.ts):

```ts
import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let database: Db;
```

### Concepts to know before filling this in

- **`MongoClient`** manages the connection (and internally, a connection
  pool) to your MongoDB server/cluster.
- **`Db`** represents one specific database on that server (e.g. a
  `learnten` database) that you get from the client.
- You should create **one client for the whole app's lifetime**, connected
  once when the server starts — not a new connection per request. Express
  route handlers should reuse the same `database` object.
- Connection string comes from an environment variable (never hardcode
  credentials). Since your project already has `dotenv` set up, add a
  `.env` file (gitignored) with something like:

  ```
  MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/?retryWrites=true&w=majority
  DB_NAME=learnten
  ```

  You'll get the real `MONGODB_URI` from MongoDB Atlas (Atlas → your
  cluster → "Connect" → "Drivers"). Ask whoever set up the Atlas project if
  you don't have access yet.

### What to implement

In `database.ts`, write and export:

1. A function `connectToDatabase()` that:
   - Creates a `MongoClient` from `process.env.MONGODB_URI`.
   - Calls `.connect()` on it (this returns a Promise — `await` it).
   - Gets the `Db` via `client.db(process.env.DB_NAME)` and stores it in
     the module-level `database` variable.
2. A function `getDatabase()` that returns the stored `database` — this is
   what your services will call to get access to collections. Throw an
   error if it's called before `connectToDatabase()` has run, so mistakes
   fail loudly instead of silently.
3. In `index.ts`, call `connectToDatabase()` **before** `app.listen(...)`,
   and only start listening once it resolves. This guarantees the app
   never receives requests when it isn't connected. Something like:

   ```ts
   connectToDatabase().then(() => {
     app.listen(PORT, () => {
       console.log(`listening at http://localhost:${PORT}/`);
     });
   });
   ```

MongoDB driver docs for this part:
https://www.mongodb.com/docs/drivers/node/current/quick-start/

---

## 4. Designing the `users` collection

Before writing the login route, decide the shape of a user document. A
reasonable minimum for login:

```ts
interface UserDocument {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
}
```

Put this interface somewhere sensible — e.g. a `types.ts` in
`backend/src/services/` or a shared `models/` folder if you want to create
one. It's just a TypeScript type; MongoDB doesn't know or care about it at
runtime, but it keeps your code honest.

**Important security fact:** never store the plaintext password. Store a
**hash** of it (see next section). If your database is ever leaked, plaintext
passwords compromise users' accounts on every other site they reused that
password on — hashing is non-negotiable, not a nice-to-have.

---

## 5. Password hashing with bcrypt

You'll need a hashing library. `bcrypt` (or `bcryptjs` if you want a
pure-JS version with no native build step) is the standard choice for
Node.

```
pnpm add bcrypt
pnpm add -D @types/bcrypt
```

Concepts:

- **Hashing is one-way.** You never "decrypt" a password hash. To check a
  login attempt, you hash the *submitted* password the same way and compare
  the two hashes — bcrypt gives you a `compare()` function that does this
  correctly (it also handles the salt embedded in the stored hash).
- **Salt** is random data mixed into the password before hashing, so two
  users with the same password get different hashes, and precomputed
  "rainbow table" attacks don't work. bcrypt generates and stores the salt
  for you automatically as part of the hash string — you don't manage it
  separately.
- **Cost factor / rounds** (e.g. `bcrypt.hash(password, 10)`) controls how
  slow the hashing is on purpose — slow hashing makes brute-forcing stolen
  hashes expensive. 10–12 is a typical default in 2026.

Two functions you'll use:

```ts
await bcrypt.hash(plainPassword, 10);        // -> hash string, for signup
await bcrypt.compare(plainPassword, hash);    // -> boolean, for login
```

---

## 6. Sessions vs. JWT (pick one — recommendation: JWT)

Your frontend is a React SPA (single-page app) talking to the backend over
a REST API — this is the detail that decides which approach fits:

- **Session-based auth**: server creates a session, stores it (in memory or
  a `sessions` collection in Mongo), and gives the browser a session-id
  cookie. Simple, but requires server-side session storage and CORS/cookie
  configuration between your frontend and backend origins.
- **JWT (JSON Web Token)**: server verifies the login, then signs a token
  containing the user's id (and whatever else) and sends it back. The
  frontend stores it (commonly in memory or `localStorage`) and sends it in
  an `Authorization: Bearer <token>` header on future requests. The server
  verifies the token's signature on each request — no server-side storage
  needed per request.

**Recommendation for this project: JWT.** It's stateless (nothing to store
per login beyond the user record itself), and it's the more common pattern
for a React SPA + REST API split like yours. Use the `jsonwebtoken` npm
package.

```
pnpm add jsonwebtoken
pnpm add -D @types/jsonwebtoken
```

You'll need a secret key for signing — put it in `.env` as `JWT_SECRET`
(a long random string, not a real word).

```ts
import jwt from "jsonwebtoken";

// signing, after verifying the password:
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
  expiresIn: "7d",
});

// verifying, in an auth middleware for protected routes later:
const payload = jwt.verify(token, process.env.JWT_SECRET!);
```

This middleware step (checking the token on protected routes) is not part
of the login route itself, but you'll want it soon after — it belongs in
`backend/src/middleware/`.

---

## 7. Wiring it into your architecture

Your project already defines the layering in
[docs/architecture.md](../docs/architecture.md):

```
routes/      -> defines the URL + HTTP method, calls a controller
controllers/ -> handles req/res, calls a service, sends the response
services/    -> the actual logic (talks to the database)
```

Follow that split for the login route. Concretely:

1. **`services/authService.ts`** (or similar) — a function like
   `login(email, password)` that:
   - Gets the `users` collection via `getDatabase().collection<UserDocument>("users")`.
   - Looks up the user by email with `findOne({ email })`.
   - If no user found, or `bcrypt.compare` fails, throw/return an error
     your controller can turn into a 401.
   - If it matches, sign and return a JWT.
   - This function should know nothing about Express (`req`/`res`) — it's
     pure logic, which makes it testable and reusable.

2. **`controllers/authController.ts`** — a function `loginController(req, res)`
   that:
   - Pulls `email` and `password` out of `req.body`.
   - Validates they exist and are strings (don't trust the client).
   - Calls `authService.login(...)`.
   - On success, `res.json({ token })`. On failure, `res.status(401).json({ error: ... })`.
   - Never let a raw error message leak whether the *email* or the
     *password* was wrong — respond with a generic "invalid credentials"
     either way, so an attacker can't use your error messages to enumerate
     which emails are registered.

3. **`routes/authRoutes.ts`** — wires the URL to the controller:

   ```ts
   router.post("/login", loginController);
   ```

   and gets mounted in `index.ts` (e.g. `app.use("/api/auth", authRoutes)`).
   You'll also want `app.use(express.json())` in `index.ts` so
   `req.body` gets parsed — check if that's there yet.

---

## 8. Checklist

Work through these in order. Each one should be independently testable
before moving to the next.

- [ ] `.env` created (gitignored) with `MONGODB_URI`, `DB_NAME`, `JWT_SECRET`
- [ ] `connectToDatabase()` / `getDatabase()` implemented in `config/database.ts`
- [ ] Server only starts listening after the DB connection succeeds
- [ ] `UserDocument` type defined
- [ ] A way to create a user (signup route, or a one-off script) so you have
      at least one real hashed-password user to test login against
- [ ] `authService.login(email, password)` — looks up user, `bcrypt.compare`,
      signs JWT on success
- [ ] `authController.loginController` — validates input, calls service,
      returns 200 + token or 401 + generic error
- [ ] `POST /api/auth/login` route wired up and mounted
- [ ] Manual test with `curl` or Postman/Thunder Client:
  - Wrong password → 401
  - Non-existent email → 401 (same error shape as wrong password)
  - Correct credentials → 200 with a token
  - Decode the returned token at https://jwt.io to sanity-check the payload
    (don't paste real secrets into third-party tools once this is live —
    fine for local dev tokens)

---

## 9. Common mistakes to watch for

- Comparing passwords with `===` instead of `bcrypt.compare` — never do
  this, it defeats hashing entirely if someone tries it on the hash.
- Creating a new `MongoClient` per request — expensive and unnecessary;
  one client, reused, for the app's lifetime.
- Returning different error messages/status codes for "user not found" vs
  "wrong password" — leaks which emails are registered.
- Forgetting `express.json()` middleware — `req.body` will be `undefined`
  without it.
- Committing `.env` to git — double check `backend/.gitignore` covers it.
