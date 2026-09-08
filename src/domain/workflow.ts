import type {
  Customer,
  MediaReference,
  Organization,
  Part,
  RepairCase,
  RepairCaseStatus,
  Vehicle,
} from "./entities.ts";
import { requirePositiveInteger, requireText } from "./validation.ts";
import { assertSameOrganization, DomainInvariantError } from "../tenancy/guards.ts";

export function createOrganization(id: string, displayName: string): Organization {
  return {
    kind: "organization",
    id: requireText(id, "organization.id"),
    displayName: requireText(displayName, "organization.displayName"),
  };
}

export function createCustomer(
  organization: Organization,
  input: { readonly id: string; readonly displayName: string },
): Customer {
  return {
    kind: "customer",
    id: requireText(input.id, "customer.id"),
    organizationId: organization.id,
    displayName: requireText(input.displayName, "customer.displayName"),
  };
}

export function createVehicle(
  organization: Organization,
  customer: Customer,
  input: {
    readonly id: string;
    readonly plate?: string;
    readonly vin?: string;
    readonly make?: string;
    readonly model?: string;
  },
): Vehicle {
  assertSameOrganization({ organizationId: organization.id }, customer);
  const plate = input.plate?.trim();
  const vin = input.vin?.trim();
  if (!plate && !vin) {
    throw new DomainInvariantError(
      "MALFORMED_INPUT",
      "A vehicle requires at least a plate or VIN",
    );
  }
  return {
    kind: "vehicle",
    id: requireText(input.id, "vehicle.id"),
    organizationId: organization.id,
    customerId: customer.id,
    ...(plate ? { plate } : {}),
    ...(vin ? { vin } : {}),
    ...(input.make?.trim() ? { make: input.make.trim() } : {}),
    ...(input.model?.trim() ? { model: input.model.trim() } : {}),
  };
}

export function createRepairCase(
  organization: Organization,
  customer: Customer,
  vehicle: Vehicle,
  input: {
    readonly id: string;
    readonly reference: string;
    readonly status?: RepairCaseStatus;
  },
): RepairCase {
  assertSameOrganization({ organizationId: organization.id }, customer, vehicle);
  if (vehicle.customerId !== customer.id) {
    throw new DomainInvariantError(
      "RELATIONSHIP_MISMATCH",
      "The repair-case customer must own the selected vehicle",
    );
  }
  return {
    kind: "repair-case",
    id: requireText(input.id, "repairCase.id"),
    organizationId: organization.id,
    customerId: customer.id,
    vehicleId: vehicle.id,
    reference: requireText(input.reference, "repairCase.reference"),
    status: input.status ?? "pending-assessment",
  };
}

export function attachPart(
  repairCase: RepairCase,
  input: {
    readonly id: string;
    readonly organizationId: string;
    readonly description: string;
    readonly quantity: number;
  },
): Part {
  assertSameOrganization(repairCase, input);
  return {
    kind: "part",
    id: requireText(input.id, "part.id"),
    organizationId: input.organizationId,
    repairCaseId: repairCase.id,
    description: requireText(input.description, "part.description"),
    quantity: requirePositiveInteger(input.quantity, "part.quantity"),
  };
}

export function attachMedia(
  repairCase: RepairCase,
  input: {
    readonly id: string;
    readonly organizationId: string;
    readonly mediaType: "photo" | "document";
    readonly label: string;
  },
): MediaReference {
  assertSameOrganization(repairCase, input);
  return {
    kind: "media-reference",
    id: requireText(input.id, "media.id"),
    organizationId: input.organizationId,
    repairCaseId: repairCase.id,
    mediaType: input.mediaType,
    label: requireText(input.label, "media.label"),
  };
}
