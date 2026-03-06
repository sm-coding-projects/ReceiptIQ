# Receipt OCR Platform — Project Operating Instructions

## Mission

Build a production-grade multi-tenant-ready web application that:
1. Uses Tesseract OCR to extract structured data from scanned receipts
2. Lets users sign up, log in, bulk upload receipts, process them, review results, and download JSON
3. Exposes an API feature on the landing page and inside the product so customers can generate and use API credentials
4. Ships in Docker and is runnable locally with one command
5. Is designed to be secure, testable, maintainable, and visually polished
6. Preserves the premium animated hero aesthetic inspired by the referenced “Background Paths” example, with clearly visible motion and the same design language across the application

## Non-Negotiable Working Model

You are not a single coder. Operate like an enterprise delivery team.

Always break work into specialized tracks and execute with parallel thinking where useful:
- Product / solution architect
- UI/UX design lead
- Frontend engineer
- Backend engineer
- OCR / extraction engineer
- Auth / security engineer
- DevOps / Docker engineer
- QA / test engineer
- AppSec reviewer

If agent teams are available, use them for parallel discovery, implementation, review, and validation. If agent teams are unavailable, emulate the same workflow using subagents and disciplined task decomposition.

Do not stay at the planning layer. Produce working code, tests, documentation, Docker assets, seed data, and validation scripts.

## Priority Order

When tradeoffs occur, prioritize in this order:
1. Correctness and working functionality
2. Security and safe defaults
3. Clear, maintainable architecture
4. Excellent UX and polished visual design
5. Performance and scalability
6. Nice-to-have enhancements

## Product Requirements

### Core user workflow
- User lands on marketing page
- User can sign up with:
  - full name
  - email
  - password
  - confirm password
- Password rules:
  - minimum 8 characters
  - at least one uppercase letter
  - at least one lowercase letter
  - at least one number
- User can log in and log out securely
- Authenticated user can bulk upload receipt files
- App processes files asynchronously or in a non-blocking workflow
- User can review extraction status and results
- User can download structured JSON output for processed receipts
- JSON should capture, when available:
  - vendor_name
  - vendor_address
  - receipt_number
  - transaction_date
  - transaction_time
  - currency
  - subtotal
  - tax
  - total
  - payment_method
  - line_items[] with name, quantity, unit_price, total_price
  - confidence / extraction metadata where useful

### OCR requirements
- Use Tesseract OCR as the OCR engine
- Include preprocessing for common scanned receipt issues:
  - rotation / skew
  - contrast normalization
  - grayscale / thresholding
  - noise reduction
  - cropping heuristics when helpful
- Build extraction pipeline in stages:
  1. file ingestion
  2. image preprocessing
  3. OCR text extraction
  4. receipt field parsing
  5. line-item normalization
  6. JSON serialization
- Make parsing modular so parsers can be improved later without rewriting the whole app
- Log extraction confidence and parsing fallbacks
- Design for future client-specific parser overrides

### API requirements
- Landing page must include a first-class API section
- API section must explain the API product clearly
- User must be able to generate API credentials or API keys from the authenticated application area
- Provide copyable code examples for:
  - Python
  - Bash / cURL
  - JavaScript
- API docs must include:
  - endpoint
  - auth method
  - request structure
  - supported file upload method
  - response JSON example
  - error examples
  - rate-limit placeholder / structure for future enforcement
- API UX must feel like a real developer platform, not a placeholder paragraph

## Design and UX Requirements

### Visual direction
The application must have a premium, modern, minimal, technical aesthetic based on the supplied animated “Background Paths” reference:
- light theme foundation
- soft neutral background
- dark typography
- elegant path-line motion in hero area
- restrained but unmistakable animation
- clean spacing
- high-end SaaS feel
- polished hover and focus states
- subtle glass / surface layering where appropriate
- consistent visual language across landing page, auth flows, dashboard, upload area, results view, and API docs section

### Animation requirements
- Keep the hero animation
- Do not remove or flatten the animated background
- The animated paths must be clearly visible, not faint
- Motion should remain tasteful, smooth, and premium
- Ensure sufficient contrast between lines and background
- Preserve performance and accessibility
- Provide reduced-motion support

### UX expectations
The UI/UX quality bar is very high.
You must think and behave like a senior product designer plus senior frontend engineer.
Every key page should have:
- strong hierarchy
- polished empty states
- loading states
- progress states
- helpful microcopy
- validation messages
- responsive layout
- accessible keyboard and screen-reader behavior
- consistent visual tokens

## Technical Expectations

You may choose the final stack, but it must satisfy these constraints:
- modern frontend framework
- modern backend framework
- Dockerized local and deployable setup
- clean separation of frontend, backend, and worker responsibilities when appropriate
- environment-variable based configuration
- clear database schema and migrations
- secure password hashing
- secure session or token handling
- file upload validation
- background processing strategy for OCR jobs
- audit-friendly structured logging
- automated tests
- linting and formatting
- developer-friendly README

Preferred architecture:
- frontend app
- backend API
- OCR worker / processing service
- database
- object/file storage abstraction
- reverse proxy only if needed

Default to practical choices that are fast to build and production-sensible.

## Security Requirements

Security is mandatory, not optional.
Implement and verify at least the following:
- password hashing using a strong industry-standard approach
- secure authentication flow
- CSRF protection where applicable
- input validation on all user-controlled fields
- upload restrictions by file type and size
- MIME validation
- safe temp-file handling
- no trust in OCR text
- output encoding
- rate limiting hooks or scaffolding
- secrets via environment variables only
- no hardcoded credentials
- least-privilege defaults
- dependency audit
- container hardening basics
- non-root container where practical
- secure API key generation and storage pattern
- clear error handling without leaking internals

Always run security review before calling the implementation complete.

## Quality Bar

Before considering the app done, verify:
- app boots cleanly in Docker
- sign-up and login work
- bulk upload works
- OCR pipeline runs end-to-end
- JSON download works
- API key generation flow works
- sample API examples work
- landing page matches intended premium aesthetic
- hero animation remains visible and polished
- responsive behavior is good on desktop and mobile
- tests pass
- lint passes
- obvious security issues are fixed
- README is complete enough for a new engineer

## Required Deliverables

Produce all of the following unless impossible:
- application source code
- Dockerfile(s)
- docker-compose.yml or equivalent
- database migration files
- seed or demo data where useful
- OCR pipeline modules
- parsing / normalization modules
- auth implementation
- API key management flow
- landing page with API section and code examples
- reusable UI components
- test suite
- security review notes
- README.md
- .env.example
- sample request / response files
- scripts for local development if helpful

## Team Orchestration Rules

When starting work:
1. Inspect repo structure
2. Propose execution plan
3. Split workstreams
4. Execute in parallel when possible
5. Reconcile architecture before merging changes
6. Run tests and audits
7. Fix issues
8. Summarize final state and remaining risks

Use explicit specialist perspectives:
- UI/UX lead owns visual system, flows, usability, accessibility, and animation polish
- frontend engineer owns component implementation and responsiveness
- backend engineer owns auth, APIs, business logic, and persistence
- OCR engineer owns preprocessing, Tesseract integration, parsing, confidence handling, and test samples
- DevOps engineer owns Docker, environment config, local startup, and deployment readiness
- QA engineer owns test scenarios, regression checks, and failure paths
- security engineer owns threat review, upload safety, auth review, API key safety, and dependency checks

Do not let one specialist overwrite another’s area without review.

## Preferred Work Pattern for Claude

For complex tasks:
- think architecturally first
- inspect existing code before changing it
- make small coherent commits / patches
- validate frequently
- prefer maintainable code over clever code
- explain tradeoffs briefly when relevant
- do not ask unnecessary questions if reasonable assumptions can unblock progress

When implementing:
- create missing files proactively
- avoid stubs unless explicitly marked as future work
- finish vertical slices end-to-end
- do not leave TODO-heavy skeletons in place of working functionality

## UI Guidance

The visual design must feel premium and deliberate.
Use:
- strong typography hierarchy
- generous whitespace
- restrained borders
- subtle shadows
- layered cards / panels
- elegant animated accents
- consistent spacing scale
- clear states for hover, focus, loading, success, error

Do not use:
- generic template-looking layouts
- clashing colors
- oversized gradients everywhere
- weak contrast in hero paths
- inconsistent button styles
- placeholder-level dashboard styling
- animation that feels gimmicky or too faint

## Data Modeling Guidance

Model for future multi-client isolation even if first release is single-tenant-ish.
Use entities similar to:
- User
- ReceiptUploadBatch
- ReceiptFile
- ReceiptExtractionResult
- ApiKey
- AuditEvent

Keep schemas extensible.

## Observability Guidance

Include:
- request logging
- OCR job logging
- parsing error logging
- user-visible processing status
- concise operational docs for debugging common failures

## Testing Guidance

At minimum include:
- auth validation tests
- upload validation tests
- OCR pipeline smoke tests
- parser unit tests
- API endpoint tests
- JSON shape validation tests
- basic UI tests for critical flows
- Docker startup verification steps in README

## Documentation Guidance

README must include:
- architecture overview
- stack choices
- local run instructions
- Docker run instructions
- env vars
- migration instructions
- how OCR pipeline works
- how API keys work
- how to call the API with Python, Bash, and JavaScript
- testing instructions
- known limitations and future improvements

## Skills and Specialist Automation

If project skills do not exist yet, create them under `.claude/skills/` for:
- ui-ux-review
- frontend-build
- backend-api-build
- ocr-pipeline
- docker-devops
- qa-validation
- security-audit
- api-docs-generator

These skills should contain concise, specialist instructions and be reusable.
Use them when relevant. If a skill needs isolated execution, create it with forked context behavior.

## Completion Standard

Do not declare success until:
- the app is built
- it runs
- the main flows work
- tests have been executed
- security review has been performed
- major issues found have been fixed or explicitly documented

At the end, provide:
1. what was built
2. how to run it
3. test results
4. security findings and fixes
5. known limitations
6. next recommended improvements
