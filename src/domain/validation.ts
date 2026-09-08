import { DomainInvariantError } from "../tenancy/guards.ts";

export function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new DomainInvariantError("MALFORMED_INPUT", `${field} must not be empty`);
  }
  return normalized;
}

export function requirePositiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainInvariantError("MALFORMED_INPUT", `${field} must be a positive integer`);
  }
  return value;
}
