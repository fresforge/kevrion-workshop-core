import assert from "node:assert/strict";
import test from "node:test";
import {
  assertCanAccessEntity,
  assertSameOrganization,
  canAccessEntity,
  DomainInvariantError,
  filterForOrganization,
  type Actor,
  type Customer,
} from "../src/index.ts";

const actorAlpha: Actor = { kind: "actor", id: "actor-alpha", organizationId: "org-alpha" };
const customerAlpha: Customer = {
  kind: "customer",
  id: "customer-a",
  organizationId: "org-alpha",
  displayName: "Example Customer A",
};
const customerBeta: Customer = {
  kind: "customer",
  id: "customer-b",
  organizationId: "org-beta",
  displayName: "Example Customer B",
};

test("an actor can access an entity in the same organization", () => {
  assert.equal(canAccessEntity(actorAlpha, customerAlpha), true);
  assert.doesNotThrow(() => assertCanAccessEntity(actorAlpha, customerAlpha));
});

test("cross-organization access is rejected", () => {
  assert.equal(canAccessEntity(actorAlpha, customerBeta), false);
  assert.throws(
    () => assertCanAccessEntity(actorAlpha, customerBeta),
    (error) => error instanceof DomainInvariantError && error.code === "TENANT_ACCESS_DENIED",
  );
});

test("organization filtering returns only tenant-owned entities", () => {
  assert.deepEqual(filterForOrganization("org-alpha", [customerAlpha, customerBeta]), [customerAlpha]);
});

test("cross-organization relationships are rejected", () => {
  assert.throws(
    () => assertSameOrganization(customerAlpha, customerBeta),
    (error) =>
      error instanceof DomainInvariantError && error.code === "CROSS_ORGANIZATION_RELATIONSHIP",
  );
});
