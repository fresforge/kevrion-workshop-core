import assert from "node:assert/strict";
import test from "node:test";
import {
  attachMedia,
  attachPart,
  createCustomer,
  createOrganization,
  createRepairCase,
  createVehicle,
  DomainInvariantError,
} from "../src/index.ts";

const orgAlpha = createOrganization("org-alpha", "Example Workshop Alpha");
const orgBeta = createOrganization("org-beta", "Example Workshop Beta");
const customerAlpha = createCustomer(orgAlpha, { id: "customer-a", displayName: "Example Customer A" });
const customerBeta = createCustomer(orgBeta, { id: "customer-b", displayName: "Example Customer B" });
const vehicleAlpha = createVehicle(orgAlpha, customerAlpha, {
  id: "vehicle-a",
  plate: "ABC1234",
  vin: "VIN_DEMO_001",
});
const repairCaseAlpha = createRepairCase(orgAlpha, customerAlpha, vehicleAlpha, {
  id: "case-a",
  reference: "CASE-001",
});

test("a vehicle can be attached to a customer in the same organization", () => {
  assert.equal(vehicleAlpha.customerId, customerAlpha.id);
  assert.equal(vehicleAlpha.organizationId, orgAlpha.id);
});

test("a vehicle cannot be attached to a customer from another organization", () => {
  assert.throws(
    () => createVehicle(orgAlpha, customerBeta, { id: "vehicle-cross", plate: "XYZ0001" }),
    (error) =>
      error instanceof DomainInvariantError && error.code === "CROSS_ORGANIZATION_RELATIONSHIP",
  );
});

test("a repair case preserves customer, vehicle and organization relationships", () => {
  assert.equal(repairCaseAlpha.customerId, customerAlpha.id);
  assert.equal(repairCaseAlpha.vehicleId, vehicleAlpha.id);
  assert.equal(repairCaseAlpha.organizationId, orgAlpha.id);
});

test("a repair case rejects a different customer even inside one organization", () => {
  const otherCustomer = createCustomer(orgAlpha, {
    id: "customer-a2",
    displayName: "Example Customer A2",
  });
  assert.throws(
    () =>
      createRepairCase(orgAlpha, otherCustomer, vehicleAlpha, {
        id: "case-mismatch",
        reference: "CASE-002",
      }),
    (error) => error instanceof DomainInvariantError && error.code === "RELATIONSHIP_MISMATCH",
  );
});

test("parts and media can attach to a repair case in the same organization", () => {
  const part = attachPart(repairCaseAlpha, {
    id: "part-a",
    organizationId: "org-alpha",
    description: "Synthetic replacement panel",
    quantity: 1,
  });
  const media = attachMedia(repairCaseAlpha, {
    id: "media-a",
    organizationId: "org-alpha",
    mediaType: "photo",
    label: "Synthetic intake reference",
  });
  assert.equal(part.repairCaseId, repairCaseAlpha.id);
  assert.equal(media.repairCaseId, repairCaseAlpha.id);
});

test("a repair case rejects cross-organization parts and media", () => {
  assert.throws(
    () =>
      attachPart(repairCaseAlpha, {
        id: "part-cross",
        organizationId: "org-beta",
        description: "Synthetic part",
        quantity: 1,
      }),
    DomainInvariantError,
  );
  assert.throws(
    () =>
      attachMedia(repairCaseAlpha, {
        id: "media-cross",
        organizationId: "org-beta",
        mediaType: "document",
        label: "Synthetic document reference",
      }),
    DomainInvariantError,
  );
});

test("malformed quantities and vehicle identities are rejected", () => {
  assert.throws(
    () =>
      attachPart(repairCaseAlpha, {
        id: "part-invalid",
        organizationId: "org-alpha",
        description: "Synthetic part",
        quantity: 0,
      }),
    DomainInvariantError,
  );
  assert.throws(
    () => createVehicle(orgAlpha, customerAlpha, { id: "vehicle-empty" }),
    DomainInvariantError,
  );
});
