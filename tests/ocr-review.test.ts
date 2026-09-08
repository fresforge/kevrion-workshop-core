import assert from "node:assert/strict";
import test from "node:test";
import {
  beginOcrReview,
  confirmVehicleIntake,
  DomainInvariantError,
  fieldReviewState,
  reviewField,
  reviewStateFor,
  validateOcrSuggestion,
  type OcrVehicleSuggestion,
} from "../src/index.ts";

const emptyField = { value: "", confidence: 0 } as const;
const suggestion: OcrVehicleSuggestion = {
  documentValid: true,
  fields: {
    plate: { value: "ABC1234", confidence: 0.92 },
    vin: { value: "VIN_DEMO_001", confidence: 0.81 },
    make: { value: "Example Motors", confidence: 0.68 },
    model: { value: "Workshop One", confidence: 0.86 },
    version: emptyField,
    firstRegistrationDate: emptyField,
    fuel: emptyField,
    powerKw: emptyField,
  },
};

test("confidence values must stay in the inclusive zero-to-one range", () => {
  assert.throws(
    () =>
      validateOcrSuggestion({
        ...suggestion,
        fields: { ...suggestion.fields, make: { value: "Example Motors", confidence: 1.2 } },
      }),
    RangeError,
  );
});

test("detected fields are classified by confidence", () => {
  assert.equal(fieldReviewState(suggestion.fields.plate), "detected");
  assert.equal(fieldReviewState(suggestion.fields.make), "review-required");
  assert.equal(fieldReviewState(suggestion.fields.version), "empty");
});

test("a manual edit changes the field review state without mutating the suggestion", () => {
  const session = beginOcrReview(suggestion);
  const reviewed = reviewField(session, "make", "Example Motor Works");
  assert.equal(reviewStateFor(reviewed, "make"), "reviewed");
  assert.equal(session.suggestion.fields.make.value, "Example Motors");
});

test("human confirmation turns a suggestion into accepted domain data", () => {
  const reviewed = reviewField(beginOcrReview(suggestion), "make", "Example Motor Works");
  assert.deepEqual(confirmVehicleIntake(reviewed), {
    confirmation: "human-confirmed",
    plate: "ABC1234",
    vin: "VIN_DEMO_001",
    make: "Example Motor Works",
    model: "Workshop One",
  });
});

test("an invalid document cannot be confirmed", () => {
  const invalid = beginOcrReview({ ...suggestion, documentValid: false });
  assert.throws(
    () => confirmVehicleIntake(invalid),
    (error) => error instanceof DomainInvariantError && error.code === "OCR_REVIEW_REQUIRED",
  );
});

test("confirmation requires a vehicle identity", () => {
  const missingIdentity = beginOcrReview({
    ...suggestion,
    fields: { ...suggestion.fields, plate: emptyField, vin: emptyField },
  });
  assert.throws(() => confirmVehicleIntake(missingIdentity), DomainInvariantError);
});
