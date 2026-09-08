import { DomainInvariantError } from "../tenancy/guards.ts";
import {
  validateOcrSuggestion,
  vehicleFieldNames,
  type OcrField,
  type OcrVehicleSuggestion,
  type VehicleFieldName,
} from "./result.ts";

export const REVIEW_CONFIDENCE_THRESHOLD = 0.75;

export type FieldReviewState = "empty" | "detected" | "review-required" | "reviewed";

export interface OcrReviewSession {
  readonly suggestion: OcrVehicleSuggestion;
  readonly manualValues: Readonly<Partial<Record<VehicleFieldName, string>>>;
}

export interface AcceptedVehicleData {
  readonly confirmation: "human-confirmed";
  readonly plate?: string;
  readonly vin?: string;
  readonly make?: string;
  readonly model?: string;
  readonly version?: string;
  readonly firstRegistrationDate?: string;
  readonly fuel?: string;
  readonly powerKw?: string;
}

export function fieldReviewState(field: OcrField, manuallyReviewed = false): FieldReviewState {
  if (!field.value.trim()) return "empty";
  if (manuallyReviewed) return "reviewed";
  return field.confidence < REVIEW_CONFIDENCE_THRESHOLD ? "review-required" : "detected";
}

export function beginOcrReview(suggestion: OcrVehicleSuggestion): OcrReviewSession {
  return { suggestion: validateOcrSuggestion(suggestion), manualValues: {} };
}

export function reviewField(
  session: OcrReviewSession,
  fieldName: VehicleFieldName,
  value: string,
): OcrReviewSession {
  return {
    ...session,
    manualValues: { ...session.manualValues, [fieldName]: value.trim() },
  };
}

export function reviewStateFor(
  session: OcrReviewSession,
  fieldName: VehicleFieldName,
): FieldReviewState {
  return fieldReviewState(
    session.suggestion.fields[fieldName],
    Object.hasOwn(session.manualValues, fieldName),
  );
}

export function confirmVehicleIntake(session: OcrReviewSession): AcceptedVehicleData {
  if (!session.suggestion.documentValid) {
    throw new DomainInvariantError("OCR_REVIEW_REQUIRED", "The document was not accepted as valid");
  }

  const values = Object.fromEntries(
    vehicleFieldNames.map((fieldName) => [
      fieldName,
      (session.manualValues[fieldName] ?? session.suggestion.fields[fieldName].value).trim(),
    ]),
  ) as Record<VehicleFieldName, string>;

  if (!values.plate && !values.vin) {
    throw new DomainInvariantError(
      "OCR_REVIEW_REQUIRED",
      "Human confirmation requires at least a plate or VIN",
    );
  }

  return {
    confirmation: "human-confirmed",
    ...nonEmpty("plate", values.plate),
    ...nonEmpty("vin", values.vin),
    ...nonEmpty("make", values.make),
    ...nonEmpty("model", values.model),
    ...nonEmpty("version", values.version),
    ...nonEmpty("firstRegistrationDate", values.firstRegistrationDate),
    ...nonEmpty("fuel", values.fuel),
    ...nonEmpty("powerKw", values.powerKw),
  };
}

function nonEmpty<K extends VehicleFieldName>(key: K, value: string): Partial<Record<K, string>> {
  return value ? ({ [key]: value } as Record<K, string>) : {};
}
