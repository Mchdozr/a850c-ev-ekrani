import assert from "node:assert/strict";
import test from "node:test";
import { pairingUrl, sameRequestOrigin } from "../lib/pairing";
import { acknowledgeTv, issueCommand, remoteSnapshot } from "../lib/remote-store";

test("phone pairing refuses loopback and unspecified addresses", () => {
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000", "http://[::1]:3000", "file:///tmp/test", "https://user:secret@example.com"]) {
    assert.equal(pairingUrl(origin, "a".repeat(32)), null);
  }
});

test("pairing points to the correct session on a reachable server", () => {
  assert.equal(pairingUrl("http://192.168.1.20:3000/tv", "a".repeat(32)), "http://192.168.1.20:3000/kumanda?session=" + "a".repeat(32));
  assert.equal(pairingUrl("https://home.example.com/", "invalid"), null);
});

test("paired browser screens never receive another screen's commands or connection state", () => {
  const a = "a".repeat(32), b = "b".repeat(32);
  issueCommand("left", a);
  acknowledgeTv("app:app-youtube", a);
  assert.equal(remoteSnapshot(a).recent.at(-1)?.command, "left");
  assert.equal(remoteSnapshot(a).connected, true);
  assert.equal(remoteSnapshot(b).recent.length, 0);
  assert.equal(remoteSnapshot(b).connected, false);
});

test("same-origin checks use the incoming host rather than Next's internal localhost URL", () => {
  assert.equal(sameRequestOrigin("http://127.0.0.1:3101", "127.0.0.1:3101"), true);
  assert.equal(sameRequestOrigin("https://home.example.com", "home.example.com"), true);
  assert.equal(sameRequestOrigin("https://unrelated.example", "127.0.0.1:3101"), false);
  assert.equal(sameRequestOrigin("null", "127.0.0.1:3101"), false);
});
