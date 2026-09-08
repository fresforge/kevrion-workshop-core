import {
  assertCanAccessEntity,
  attachMedia,
  attachPart,
  beginOcrReview,
  confirmVehicleIntake,
  createCustomer,
  createOrganization,
  createRepairCase,
  createVehicle,
  DomainInvariantError,
  reviewField,
  type Actor,
  type OcrVehicleSuggestion,
} from "../src/index.ts";

const organization = createOrganization("org-alpha", "Example Workshop Alpha");
const customer = createCustomer(organization, {
  id: "customer-a",
  displayName: "Example Customer A",
});
const vehicle = createVehicle(organization, customer, {
  id: "vehicle-a",
  plate: "ABC1234",
  vin: "VIN_DEMO_001",
  make: "Example Motors",
  model: "Workshop One",
});
const repairCase = createRepairCase(organization, customer, vehicle, {
  id: "case-a",
  reference: "CASE-001",
  status: "vehicle-received",
});
const part = attachPart(repairCase, {
  id: "part-a",
  organizationId: organization.id,
  description: "Synthetic replacement panel",
  quantity: 1,
});
const media = attachMedia(repairCase, {
  id: "media-a",
  organizationId: organization.id,
  mediaType: "photo",
  label: "Synthetic intake reference",
});

console.log({ organization, customer, vehicle, repairCase, part, media });

const outsideActor: Actor = { kind: "actor", id: "actor-b", organizationId: "org-beta" };
try {
  assertCanAccessEntity(outsideActor, repairCase);
} catch (error) {
  if (error instanceof DomainInvariantError) {
    console.log(`Rejected cross-organization access: ${error.code}`);
  }
}

const empty = { value: "", confidence: 0 } as const;
const ocrSuggestion: OcrVehicleSuggestion = {
  documentValid: true,
  fields: {
    plate: { value: "ABC1234", confidence: 0.92 },
    vin: { value: "VIN_DEMO_001", confidence: 0.88 },
    make: { value: "Example Motors", confidence: 0.68 },
    model: { value: "Workshop One", confidence: 0.83 },
    version: empty,
    firstRegistrationDate: empty,
    fuel: empty,
    powerKw: empty,
  },
};
const reviewedSuggestion = reviewField(beginOcrReview(ocrSuggestion), "make", "Example Motor Works");
console.log(confirmVehicleIntake(reviewedSuggestion));
