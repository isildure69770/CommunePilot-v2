import assert from "node:assert/strict";
import test from "node:test";
import { clientPrincipal, hasRole, isAuthenticated, normalizedRole } from "../src/auth.js";

function requestFor(principal) {
  const encoded = Buffer.from(JSON.stringify(principal), "utf8").toString("base64");
  return { headers: new Headers({ "x-ms-client-principal": encoded }) };
}

test("reads the identity injected by Azure Static Web Apps", () => {
  const expected = { userId: "azure-user", userRoles: ["anonymous", "authenticated", "Agent technique"] };
  const actual = clientPrincipal(requestFor(expected));
  assert.deepEqual(actual, expected);
  assert.equal(isAuthenticated(actual), true);
});

test("normalizes Azure role spelling without weakening the allow-list", () => {
  assert.equal(normalizedRole("Agent administratif"), "agent-administratif");
  assert.equal(normalizedRole("Élu"), "elu");
  assert.equal(hasRole({ userRoles: ["Agent technique"] }, new Set(["agent-technique"])), true);
  assert.equal(hasRole({ userRoles: ["authenticated"] }, new Set(["agent-technique"])), false);
});

test("rejects missing and malformed principals", () => {
  assert.equal(clientPrincipal({ headers: new Headers() }), null);
  assert.equal(clientPrincipal({ headers: new Headers({ "x-ms-client-principal": "not-base64-json" }) }), null);
  assert.equal(isAuthenticated(null), false);
});
