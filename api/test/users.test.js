import assert from "node:assert/strict";
import test from "node:test";
import { validateDirectoryUser, visibleDirectoryUser } from "../src/functions/users.js";

const valid = { id: "stable-id", firstName: "Prénom", lastName: "Nom", role: "Conseiller", group: "Conseillers municipaux", jobTitle: "Conseiller municipal", active: true, addressVisibility: "administrators", commissionIds: ["voirie", "voirie"] };

test("validates and normalizes a directory record", () => {
  const user = validateDirectoryUser(valid);
  assert.equal(user.id, "stable-id");
  assert.deepEqual(user.commissionIds, ["voirie"]);
  assert.ok(user.createdAt && user.updatedAt);
});

test("preserves stable identifiers and creation dates during updates", () => {
  const existing = { ...validateDirectoryUser(valid), createdAt: "2025-01-01T00:00:00.000Z" };
  const updated = validateDirectoryUser({ ...valid, firstName: "Nouveau" }, existing);
  assert.equal(updated.id, existing.id);
  assert.equal(updated.createdAt, existing.createdAt);
});

test("rejects invalid groups and redacts restricted fields", () => {
  assert.throws(() => validateDirectoryUser({ ...valid, group: "Groupe inventé" }), /invalide/);
  const record = { ...validateDirectoryUser(valid), address: "Adresse privée", notes: "Note interne" };
  const redacted = visibleDirectoryUser(record, { userRoles: ["conseiller"] });
  assert.equal(redacted.address, undefined);
  assert.equal(redacted.notes, undefined);
});
