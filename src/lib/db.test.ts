import { test } from "node:test";
import assert from "node:assert/strict";
import * as db from "./db.ts";

test("accounts, sessions and two-user isolation", () => {
  const d = db.openDb(":memory:");
  const a = db.createUser(d, "a@example.com", "password-a1");
  const b = db.createUser(d, "b@example.com", "password-b1");
  assert.ok("id" in a && "id" in b);
  assert.ok("error" in db.createUser(d, "A@example.com", "whatever12")); // case-insensitive unique
  assert.ok("error" in db.createUser(d, "c@example.com", "short"));
  assert.equal(db.verifyUser(d, "a@example.com", "wrong-pass"), null);
  const aid = db.verifyUser(d, "a@example.com", "password-a1")!;
  const bid = db.verifyUser(d, "b@example.com", "password-b1")!;

  const s = db.createSession(d, aid);
  assert.equal(db.sessionUser(d, s.token)?.id, aid);
  assert.equal(db.sessionUser(d, "forged-token"), null);
  db.deleteSession(d, s.token);
  assert.equal(db.sessionUser(d, s.token), null);

  db.saveProperty(d, aid, "A0001");
  db.saveProperty(d, aid, "A0001"); // idempotent
  const rid = db.saveReport(d, aid, "A0001", "snap-x", "2026-10-01", { ok: 1 });
  assert.equal(db.listSavedProperties(d, aid).length, 1);
  assert.equal(db.listSavedProperties(d, bid).length, 0);
  assert.equal(db.getReport(d, bid, rid), null); // B cannot read A's report by id
  db.deleteReport(d, bid, rid); // B cannot delete it either
  assert.ok(db.getReport(d, aid, rid));
  db.unsaveProperty(d, bid, "A0001");
  assert.equal(db.isSaved(d, aid, "A0001"), true);
});
