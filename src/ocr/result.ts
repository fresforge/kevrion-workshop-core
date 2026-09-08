export const vehicleFieldNames = [
  "plate",
  "vin",
  "make",
  "model",
  "version",
  "firstRegistrationDate",
  "fuel",
  "powerKw",
] as const;

export type VehicleFieldName = (typeof vehicleFieldNames)[number];

export interface OcrField {
  readonly value: string;
  readonly confidence: number;
}

export type OcrVehicleFields = Readonly<Record<VehicleFieldName, OcrField>>;

export interface OcrVehicleSuggestion {
  readonly documentValid: boolean;
  readonly fields: OcrVehicleFields;
}

export function validateOcrSuggestion(suggestion: OcrVehicleSuggestion): OcrVehicleSuggestion {
  for (const fieldName of vehicleFieldNames) {
    const confidence = suggestion.fields[fieldName].confidence;
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new RangeError(`${fieldName}.confidence must be between 0 and 1`);
    }
  }
  return suggestion;
}
