export type EntityId = string;
export type OrganizationId = string;

export interface Organization {
  readonly kind: "organization";
  readonly id: OrganizationId;
  readonly displayName: string;
}

export interface Actor {
  readonly kind: "actor";
  readonly id: EntityId;
  readonly organizationId: OrganizationId;
}

export interface OrganizationEntity {
  readonly id: EntityId;
  readonly organizationId: OrganizationId;
}

export interface Customer extends OrganizationEntity {
  readonly kind: "customer";
  readonly displayName: string;
}

export interface Vehicle extends OrganizationEntity {
  readonly kind: "vehicle";
  readonly customerId: EntityId;
  readonly plate?: string;
  readonly vin?: string;
  readonly make?: string;
  readonly model?: string;
}

export type RepairCaseStatus =
  | "pending-assessment"
  | "scheduled"
  | "vehicle-received"
  | "awaiting-parts"
  | "in-progress"
  | "completed"
  | "delivered";

export interface RepairCase extends OrganizationEntity {
  readonly kind: "repair-case";
  readonly customerId: EntityId;
  readonly vehicleId: EntityId;
  readonly reference: string;
  readonly status: RepairCaseStatus;
}

export interface Part extends OrganizationEntity {
  readonly kind: "part";
  readonly repairCaseId: EntityId;
  readonly description: string;
  readonly quantity: number;
}

export interface MediaReference extends OrganizationEntity {
  readonly kind: "media-reference";
  readonly repairCaseId: EntityId;
  readonly mediaType: "photo" | "document";
  readonly label: string;
}
