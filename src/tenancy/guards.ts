import type { Actor, OrganizationEntity, OrganizationId } from "../domain/entities.ts";

export type DomainErrorCode =
  | "TENANT_ACCESS_DENIED"
  | "CROSS_ORGANIZATION_RELATIONSHIP"
  | "RELATIONSHIP_MISMATCH"
  | "MALFORMED_INPUT"
  | "OCR_REVIEW_REQUIRED";

export class DomainInvariantError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainInvariantError";
    this.code = code;
  }
}

export function canAccessEntity(actor: Actor, entity: OrganizationEntity): boolean {
  return actor.organizationId === entity.organizationId;
}

export function assertCanAccessEntity(actor: Actor, entity: OrganizationEntity): void {
  if (!canAccessEntity(actor, entity)) {
    throw new DomainInvariantError(
      "TENANT_ACCESS_DENIED",
      "The actor and entity belong to different organizations",
    );
  }
}

export function assertSameOrganization(
  ...entities: ReadonlyArray<{ readonly organizationId: OrganizationId }>
): OrganizationId {
  const first = entities[0];
  if (!first) {
    throw new DomainInvariantError("MALFORMED_INPUT", "At least one entity is required");
  }
  if (entities.some((entity) => entity.organizationId !== first.organizationId)) {
    throw new DomainInvariantError(
      "CROSS_ORGANIZATION_RELATIONSHIP",
      "Related entities must belong to the same organization",
    );
  }
  return first.organizationId;
}

export function filterForOrganization<T extends OrganizationEntity>(
  organizationId: OrganizationId,
  entities: readonly T[],
): T[] {
  return entities.filter((entity) => entity.organizationId === organizationId);
}
