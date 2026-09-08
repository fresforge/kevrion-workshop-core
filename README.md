# Kevrion Workshop Core
[![CI](https://github.com/fresforge/kevrion-workshop-core/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/fresforge/kevrion-workshop-core/actions/workflows/ci.yml)

A small TypeScript model derived from verified domain and workflow invariants used in Kevrion, a workshop-management application built around real operational flows.

This repository focuses on organization-scoped relationships, workshop entity invariants, and human-reviewed OCR intake. It intentionally excludes authentication, production database policies, storage infrastructure, and private application code.

Derived from verified domain and workflow invariants used in Kevrion.

## What this repository demonstrates

- Every workshop entity carries an organization boundary.
- Access checks compare the actor and entity organization explicitly.
- Customer, vehicle, repair-case, part, and media relationships reject cross-organization links.
- OCR output remains a suggestion until a person confirms the intake data.
- Tests exercise accepted relationships and expected rejection paths.

The implementation is deliberately in-memory and has no network or database dependency.

## Domain model

```text
Organization
└── Customer
    └── Vehicle
        └── RepairCase
            ├── MediaReference (photo or document)
            └── Part
```

Each business entity includes an `organizationId`. A vehicle links to a customer, a repair case links to its customer and vehicle, and child records link to a repair case.

## Workshop workflow

The executable example creates an organization, customer, vehicle, and repair case before attaching a part and a generic media reference. Each creation step validates its parent relationships rather than relying on a user interface to keep them consistent.

The public repair-case statuses group the operational stages into a compact educational model. They are not a copy of the complete application workflow.

## Organization boundaries

`canAccessEntity` and `assertCanAccessEntity` model organization-scoped access. `assertSameOrganization` protects relationships, while `filterForOrganization` demonstrates tenant-scoped reads over in-memory data.

These functions demonstrate domain invariants. They are not Kevrion's production authorization layer and do not claim to prove the security of the full application.

## OCR-assisted intake

The OCR model contains only structured, generic fields:

- plate
- VIN
- make and model
- version
- first registration date
- fuel
- power in kW

Each value carries confidence between `0` and `1`. The repository contains no image processing, external model call, request template, endpoint, or operational configuration.

All example values are synthetic and were created specifically for this repository.

## Human review

OCR output is represented as a suggestion, not an authoritative write. A field can be empty, detected, flagged for review, or manually reviewed. `confirmVehicleIntake` is an explicit human-confirmation boundary that produces accepted domain data.

Low-confidence fields are surfaced for review; they are not silently discarded. The public model does not pretend that confidence alone proves correctness.

## Example

```bash
npm install
npm run example
```

The example completes one valid workshop flow, rejects a cross-organization access attempt, and confirms a synthetic OCR suggestion after a manual correction.

## Testing

```bash
npm run typecheck
npm test
npm run build
```

The tests cover same-organization access, cross-organization rejection, relationship consistency, malformed input, confidence validation, manual review, and human confirmation.

## Design decisions

### Relationships are explicit

Parent-child relationships are checked in domain functions. This makes invalid cross-organization references visible and testable without a database.

### OCR is not authoritative

Detected values can be incomplete or uncertain. The model therefore separates machine output, field review, manual edits, and human confirmation.

### The public boundary is intentionally small

The repository uses plain TypeScript and the Node.js test runner. It does not need a web framework, database client, AI SDK, or browser runtime.

## Security scope

This repository demonstrates selected domain invariants.

It does not contain Kevrion's production authorization, authentication, storage, or database configuration. The in-memory guards illustrate organization boundaries; they are not a substitute for server-side enforcement in a complete application.

## What is intentionally excluded

- Authentication, sessions, roles, and invitation flows
- Database schema, row-level authorization policies, triggers, grants, and migrations
- File storage, upload rules, object paths, and signed access
- OCR prompts, model settings, server functions, retries, and provider integration
- Customer, workshop, vehicle, repair, image, and document data
- Deployment, staging, analytics, and incident details

## Relationship to Kevrion

The full application uses organization-aware persistence and private media handling. This repository re-expresses a small set of confirmed domain and review invariants as isolated, dependency-light TypeScript so they can be studied without exposing application infrastructure.
