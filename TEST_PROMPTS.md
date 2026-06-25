# Test Prompts — Phase 2 of the Audit

These prompts execute **Step 2** from `AUDIT.md`: add tests on the critical path before any refactoring. Target: 60% coverage on critical packages within 10 working days.

## Philosophy

- **Integration tests > unit tests** for the web layer. Realistic, fewer mocks to maintain.
- **Unit tests** for pure business logic (scoring, validation).
- **WireMock** for external APIs (Claude, Stripe).
- **Testcontainers Postgres** instead of H2 (catches real SQL issues).
- **No 100% coverage crusade.** Test what matters — critical path + god classes before refactor.

## Execution rules

1. **Start on clean main.** `git status` clean, previous Phase 1 cleanup fully merged.
2. **One prompt = one branch = one PR.**
3. **Each new test file must pass on first run.** If a test fails because the code being tested has a bug, report the bug — don't "fix" it silently.
4. **Don't modify production code in test prompts.** If a test reveals a bug, create a separate bug-fix commit. Tests first, fixes second.
5. **Coverage is secondary.** A 90%-coverage test that doesn't check behaviour is worse than a 30%-coverage test that catches real regressions.

---

## Prompt T00 — Test infrastructure setup

```
Read AUDIT.md and TEST_PROMPTS.md for context.

Phase: Test infrastructure. Adding Testcontainers, WireMock, JaCoCo, and 
shared test base classes. No feature tests yet.

Branch: tests-00-infrastructure

Tasks:

1. Update backend/build.gradle to add these testImplementation dependencies 
   (with compatible versions for Spring Boot 3.2.1):
   - org.testcontainers:testcontainers:1.19.7
   - org.testcontainers:postgresql:1.19.7
   - org.testcontainers:junit-jupiter:1.19.7
   - com.github.tomakehurst:wiremock-standalone:3.3.1 (or wiremock-jetty12 if needed)
   - org.mockito:mockito-core (usually transitive via spring-boot-starter-test)
   - io.rest-assured:rest-assured:5.4.0 (optional, makes API tests readable)

2. Add JaCoCo plugin to build.gradle:
   plugins { id 'jacoco' }
   jacoco { toolVersion = "0.8.11" }
   test { finalizedBy jacocoTestReport }
   jacocoTestReport {
       dependsOn test
       reports { html.required = true; xml.required = true }
   }
   jacocoTestCoverageVerification {
       violationRules {
           rule {
               element = 'PACKAGE'
               includes = [
                 'com.dorachecker.service.AssessmentService*',
                 'com.dorachecker.service.ContractAnalysis*',
                 'com.dorachecker.service.PdfExport*',
                 'com.dorachecker.service.ComplianceReport*',
                 'com.dorachecker.security.*'
               ]
               limit { counter = 'LINE'; minimum = 0.60 }
           }
       }
   }
   (Do not wire this into CI failure yet — just enable the report. We'll 
   turn it into a gate in T07.)

3. Create base test class at 
   backend/src/test/java/com/dorachecker/testsupport/AbstractIntegrationTest.java:
   - @SpringBootTest(webEnvironment = RANDOM_PORT)
   - @Testcontainers
   - @AutoConfigureMockMvc
   - Starts a shared PostgreSQLContainer (static, reused across tests via 
     @Container + @DynamicPropertySource setting spring.datasource.url)
   - Cleans the database between test methods using @Sql or a 
     DatabaseCleaner helper (preferred: write a DatabaseCleaner that 
     TRUNCATEs all non-static tables with restart identity — faster than 
     @Sql rollback)
   - Exposes @Autowired MockMvc, ObjectMapper, and a TestRestTemplate for 
     real HTTP calls when MockMvc isn't enough

4. Create WireMock base class at 
   backend/src/test/java/com/dorachecker/testsupport/ClaudeApiMockExtension.java:
   - JUnit 5 extension that starts a WireMock server on a random port
   - Overrides anthropic.api.url property via @DynamicPropertySource
   - Exposes methods: stubNegotiationStrategy(response), stubError(status), 
     reset()

5. Create test data factory at 
   backend/src/test/java/com/dorachecker/testsupport/TestDataFactory.java:
   - static UserEntity aVerifiedUser(String email, Role role)
   - static AssessmentEntity anAssessment(UserEntity user)
   - static String aValidJwt(UserEntity user, JwtService jwtService)
   - These are builders so tests don't repeat setup.

6. Configure test profile:
   - backend/src/test/resources/application-test.properties
   - Disable scheduled tasks, disable crawlers, set log level to WARN for 
     noisy packages

7. Ensure H2 is REMOVED from test scope (we now use Testcontainers Postgres):
   - Delete the h2 testImplementation line
   - If any existing test relies on H2, it will break — report which ones. 
     We'll migrate them in subsequent prompts.

8. Run `./gradlew test jacocoTestReport` — must pass.
9. Open backend/build/reports/jacoco/test/html/index.html and verify the 
   report generates. Report the current coverage percentages in chat 
   (expected: low, ~5-15% overall).

10. Commit: `chore(test): add testcontainers, wiremock, jacoco infrastructure`.

Acceptance:
- Build passes
- Existing tests still pass (or broken ones reported)
- JaCoCo report generates
- Chat reports current baseline coverage numbers

Do NOT:
- Write any new feature tests in this prompt
- Increase coverage — that's the job of subsequent prompts
- Delete any test files, only H2 dependency
```

---

## Prompt T01 — AssessmentService + scoring logic tests

```
Read AUDIT.md section 2 (Critical Path Services). AssessmentService is 
the scoring engine — the single most important untested service.

Phase: Unit + integration tests for AssessmentService and related scoring 
logic.

Branch: tests-01-assessment-scoring

Pre-requisite: T00 merged.

Tasks:

1. READ THE CODE FIRST:
   - backend/src/main/java/com/dorachecker/service/AssessmentService.java
   - backend/src/main/java/com/dorachecker/service/QuestionService.java
   - backend/src/main/java/com/dorachecker/service/AssessmentEngineService.java (if exists)
   - backend/src/main/java/com/dorachecker/model/AssessmentEntity.java
   Identify the public methods and what they return. Identify the scoring 
   formula (weight per question, threshold for GREEN/YELLOW/RED).

2. Create unit test at 
   backend/src/test/java/com/dorachecker/service/AssessmentServiceTest.java
   
   Test cases (each a @Test method):
   a) score_allQuestionsCorrect_returnsGreen — 100% score, GREEN
   b) score_allQuestionsWrong_returnsRed — 0%, RED
   c) score_partialCorrect_returnsYellow — e.g. 60%, YELLOW
   d) score_exactlyAtGreenThreshold_returnsGreen — boundary test
   e) score_exactlyBelowGreenThreshold_returnsYellow — off-by-one check
   f) score_emptyAnswers_returnsRedOrZero — defensive behaviour
   g) score_unknownQuestionId_handlesGracefully — doesn't throw
   h) score_duplicateQuestionId_usesLastAnswer (or rejects — document 
      the actual behaviour)
   i) evaluate_persistsAssessment — verifies AssessmentRepository.save 
      is called with correct entity (use Mockito)
   j) getById_existingId_returnsAssessment
   k) getById_missingId_throwsOrReturnsEmpty — document actual behaviour

3. Create integration test at 
   backend/src/test/java/com/dorachecker/controller/AssessmentControllerIntegrationTest.java
   extends AbstractIntegrationTest:
   
   a) POST /api/assessments_unauthenticated_returns401
   b) POST /api/assessments_authenticatedUser_createsAssessment
      - Seed a user, login to get JWT
      - POST with valid body, assert 200/201 + body contains id
      - Assert row exists in `assessments` table
   c) GET /api/assessments/{id}_ownerCanRead
   d) GET /api/assessments/{id}_differentUser_returns403or404 — critical 
      authorization test
   e) GET /api/assessments/{id}_notFound_returns404

4. If any test reveals a real bug (e.g. missing authorization check), 
   create a follow-up task in TEST_PROMPTS.md under "Found bugs" section 
   at bottom of the file. Do NOT fix in this prompt.

5. Run `./gradlew test`. All pass.

6. Check jacocoTestReport — AssessmentService should now be ~70-90% 
   covered. Report number in chat.

7. Commit: `test(assessment): add scoring + authorization tests for AssessmentService`.

Acceptance:
- ~10-15 new test methods
- AssessmentService coverage ≥60%
- All tests pass
- Any discovered bugs documented, not fixed
```

---

## Prompt T02 — Auth + JwtService tests

```
Phase: Extend existing AuthControllerTest, add JwtServiceTest.

Branch: tests-02-auth

Pre-requisite: T01 merged.

Tasks:

1. READ:
   - backend/src/test/java/com/dorachecker/controller/AuthControllerTest.java 
     (existing — list what it covers)
   - backend/src/main/java/com/dorachecker/security/JwtService.java
   - backend/src/main/java/com/dorachecker/security/JwtAuthenticationFilter.java
   - backend/src/main/java/com/dorachecker/controller/AuthController.java

2. Create JwtServiceTest at 
   backend/src/test/java/com/dorachecker/security/JwtServiceTest.java
   
   Test cases:
   a) generateToken_validUser_returnsNonEmptyToken
   b) generateToken_includesOrganizationIdClaim (if applicable)
   c) validateToken_freshToken_isValid
   d) validateToken_expiredToken_isInvalid (manually manipulate the 
      expiry via clock or reflect into service)
   e) validateToken_tamperedToken_isInvalid (change a byte in the 
      signature)
   f) validateToken_wrongIssuer_isInvalid
   g) extractSubject_validToken_returnsEmail
   h) blacklist_afterLogout_validationFails (if blacklist exists)
   i) refresh_validRefreshToken_issuesNewAccessToken
   j) refresh_expiredRefreshToken_rejected

3. Extend AuthControllerTest with cases not already covered. Review 
   existing test content first. Add only missing:
   
   a) register_validData_createsUserAndReturnsJwt
   b) register_duplicateEmail_returns400
   c) register_weakPassword_returns400
   d) login_correctCredentials_returnsJwtPair
   e) login_wrongPassword_returns401
   f) login_unverifiedEmail_returns403or200WithWarning — document actual
   g) login_userWith2faEnabled_returns200With2faRequired
   h) login_then_verify2fa_returnsFullJwt
   i) refresh_validToken_returnsNewTokens
   j) logout_blacklistsToken
   k) getMe_withValidJwt_returnsUserProfile
   l) getMe_withBlacklistedJwt_returns401

4. For 2FA endpoints: create backend/src/test/java/com/dorachecker/controller/TwoFactorControllerTest.java with:
   - setup_returnsSecretAndQr
   - verify_validCode_enables2fa
   - disable_requiresValidCode

5. Run all tests. Report new coverage on 
   com.dorachecker.security package.

6. Commit: `test(auth): JwtService, extended AuthController, 2FA controller`.

Acceptance:
- JwtServiceTest with 10+ methods
- AuthControllerTest extended with missing scenarios
- com.dorachecker.security coverage ≥70%
```

---

## Prompt T03 — Contract Analysis + Claude API with WireMock

```
Phase: Test contract analysis without hitting real Claude API.

Branch: tests-03-claude-contract

Pre-requisite: T02 merged.

Tasks:

1. READ:
   - backend/src/main/java/com/dorachecker/service/ClaudeApiService.java
   - backend/src/main/java/com/dorachecker/service/ContractAnalysisService.java
   - backend/src/main/java/com/dorachecker/controller/ContractAnalysisController.java

2. Create ClaudeApiServiceTest at 
   backend/src/test/java/com/dorachecker/service/ClaudeApiServiceTest.java
   Uses WireMock (via ClaudeApiMockExtension from T00).
   
   Test cases:
   a) generateNegotiationStrategy_validResponse_parsesJson — WireMock 
      returns a realistic Claude JSON response; assert the service 
      parses it into the expected domain object
   b) generateNegotiationStrategy_apiTimeout_throwsDomainException — 
      WireMock configured to delay beyond client timeout
   c) generateNegotiationStrategy_api500_throwsDomainException
   d) generateNegotiationStrategy_malformedJson_throwsParseException
   e) generateNegotiationEmail_parsesCorrectly
   f) classifyDocument_returnsClassification
   g) missingApiKey_throwsIllegalStateException (config test)

3. Create ContractAnalysisServiceTest at 
   backend/src/test/java/com/dorachecker/service/ContractAnalysisServiceTest.java
   Unit test with mocked ClaudeApiService.
   
   Test cases:
   a) analyzeContract_fullContract_returnsFindingsList — mocked Claude 
      returns a canned response, service parses and persists
   b) analyzeContract_claudeFails_savesContractWithErrorStatus — defensive
   c) analyzeContract_persistsContractAnalysisEntity — verify DB write
   d) analyzeContract_shortContract_skipsAiAndReturnsWarning (if applicable)

4. Create ContractAnalysisControllerIntegrationTest 
   extends AbstractIntegrationTest:
   
   a) POST /api/contracts/analyze-text_validText_returns200WithFindings
   b) POST /api/contracts/analyze_multipartFile_returns200
   c) POST /api/contracts/analyze-text/bulk_premiumUser_returns200
   d) POST /api/contracts/analyze-text/bulk_freeUser_returns403 (feature gate)
   e) GET /api/contracts/{id}_ownerCanRead

5. Record sample Claude responses in 
   backend/src/test/resources/fixtures/claude/:
   - negotiation-strategy-response.json
   - negotiation-email-response.json
   - malformed-response.txt
   Use them in WireMock stubs.

6. Run tests. Report coverage on com.dorachecker.service.Claude* and 
   com.dorachecker.service.ContractAnalysis*.

7. Commit: `test(claude): ClaudeApiService + ContractAnalysisService with WireMock`.

Acceptance:
- No real Claude API calls in tests (verify with grep for anthropic.com)
- ClaudeApiService coverage ≥70%
- ContractAnalysisService coverage ≥70%
```

---

## Prompt T04 — PDF export smoke tests

```
Phase: Verify PDF generation produces valid, non-empty files. This is 
the prerequisite for refactoring ComplianceReportService (1018 LOC god 
class) in Step 3.

Branch: tests-04-pdf-export

Pre-requisite: T03 merged.

Tasks:

1. READ:
   - backend/src/main/java/com/dorachecker/service/PdfExportService.java
   - backend/src/main/java/com/dorachecker/service/ComplianceReportService.java
   - backend/src/main/java/com/dorachecker/service/ProfessionalReportService.java

2. Create PdfExportServiceTest at 
   backend/src/test/java/com/dorachecker/service/PdfExportServiceTest.java
   Uses Testcontainers Postgres (extends AbstractIntegrationTest).
   
   Test cases:
   a) generateAssessmentPdf_validAssessment_returnsNonEmptyPdf
      - Assert bytes start with %PDF magic (byte[0..3] == {0x25, 0x50, 0x44, 0x46})
      - Assert length > 5000 bytes
   b) generateAssessmentPdf_inEstonian_containsEstonianText — use PDFBox 
      (already a dependency) to extract text, assert it contains a 
      known Estonian phrase from the template
   c) generateAssessmentPdf_inEnglish_containsEnglishText
   d) generateContractPdf_validContract_returnsNonEmptyPdf
   e) generateGapAnalysisPdf_validGap_returnsNonEmptyPdf

3. Create ComplianceReportServiceTest at 
   backend/src/test/java/com/dorachecker/service/ComplianceReportServiceTest.java
   
   Smoke tests (broad coverage before refactor):
   a) generateComplianceReport_allPillars_produces5PillarSections
      - Use PDFBox to extract text
      - Assert all 5 DORA pillars present (ICT Risk, Incident, Testing, 
        Third Party, Info Sharing)
   b) generateComplianceReport_missingData_stillProducesPdf (graceful)
   c) generateComplianceReport_includesUserOrgName

4. Create ProfessionalReportServiceTest — similar smoke approach.

5. Create ExportControllerIntegrationTest (extending existing 
   ExportControllerTest if it's already integration, or complement):
   
   a) POST /api/exports/pdf/assessment/{id}_premiumUser_returnsPdfBytes
   b) POST /api/exports/pdf/assessment/{id}_freeUser_returns403
   c) POST /api/exports/excel/assessment/{id}_premiumUser_returnsXlsx
   d) POST /api/exports/pdf/contract/{id}_ownerPremium_returnsPdf
   e) POST /api/exports/pdf/contract/{id}_differentUser_returns403

6. For PDF content assertions, write a small helper:
   static String extractText(byte[] pdfBytes) throws IOException {
       try (PDDocument doc = PDDocument.load(pdfBytes)) {
           return new PDFTextStripper().getText(doc);
       }
   }

7. Run tests. Report coverage on:
   - com.dorachecker.service.PdfExportService
   - com.dorachecker.service.ComplianceReportService
   - com.dorachecker.service.ProfessionalReportService

8. Commit: `test(pdf): smoke tests for PDF + Excel + Compliance Report exports`.

Acceptance:
- All generated PDFs pass %PDF magic byte check
- All contain expected localized text
- ComplianceReportService coverage ≥50% (hard given 1018 LOC, but baseline)
- PdfExportService coverage ≥70%
- Gate-gating tests confirm subscription guard works for exports
```

---

## Prompt T05 — Stripe webhook + subscription flow

```
Phase: Test payment integration. Highest-stakes area — broken webhook 
= lost revenue + angry customer.

Branch: tests-05-stripe

Pre-requisite: T04 merged.

Tasks:

1. READ:
   - backend/src/main/java/com/dorachecker/controller/StripeController.java
   - backend/src/main/java/com/dorachecker/controller/StripeWebhookController.java
   - backend/src/main/java/com/dorachecker/service/SubscriptionGuardService.java
   - backend/src/test/java/com/dorachecker/service/SubscriptionGuardServiceTest.java 
     (existing — note what's covered)

2. Extend SubscriptionGuardServiceTest with feature gating matrix:
   
   For each tier (FREE, STANDARD, ENTERPRISE) and each feature 
   (PDF_EXPORT, EXCEL_EXPORT, AI_REWRITER, ROI_EXPORT, 
   PROFESSIONAL_REPORT, COMPLIANCE_REPORT, AI_POLICY_WRITER, CERTIFICATE):
   - Parameterised test: canAccess(tier, feature) returns expected boolean
   - Document the matrix in a comment at top of test class

   Also:
   a) canAccess_trialExpired_downgradesToFree
   b) canAccess_subscriptionCancelled_revokesPremium

3. Create StripeWebhookControllerTest at 
   backend/src/test/java/com/dorachecker/controller/StripeWebhookControllerTest.java
   extends AbstractIntegrationTest.
   
   DO NOT hit the real Stripe API. Use Stripe's Java SDK 
   `com.stripe.model.Event` test utilities to construct fake events, 
   and mock the signature verification OR provide a test webhook secret.
   
   Test cases:
   a) webhook_invalidSignature_returns400
   b) webhook_checkoutSessionCompleted_activatesSubscription
      - POST fake event
      - Assert UserSubscriptionEntity row updated with status=ACTIVE, 
        stripeSubscriptionId set, plan matches
   c) webhook_customerSubscriptionUpdated_updatesPlan
      - Start: user on STANDARD. Send upgrade event. 
      - Assert plan now ENTERPRISE.
   d) webhook_customerSubscriptionDeleted_deactivates
   e) webhook_invoicePaymentFailed_marksPastDue
   f) webhook_unknownEventType_returns200_ignoresGracefully
   g) webhook_duplicateEventId_idempotent — send same event twice, 
      assert state changes only once

4. Create StripeControllerTest:
   a) POST /api/stripe/create-checkout-session_authenticated_returnsUrl
   b) POST /api/stripe/create-checkout-session_unauthenticated_returns401
   c) POST /api/stripe/verify-session_returnsSubscriptionStatus

5. Fixture files at 
   backend/src/test/resources/fixtures/stripe/:
   - checkout.session.completed.json
   - customer.subscription.updated.json
   - customer.subscription.deleted.json
   - invoice.payment_failed.json

6. Run tests. Report coverage.

7. Commit: `test(stripe): webhook handling + subscription guard matrix`.

Acceptance:
- StripeWebhookController coverage ≥80%
- SubscriptionGuardService coverage ≥90% (simple logic, high coverage is cheap)
- Idempotency explicitly tested
- No real Stripe API calls
```

---

## Prompt T06 — Critical path end-to-end integration test

```
Phase: One test that exercises the whole user journey. This is the 
"if this test passes, the core product works" canary.

Branch: tests-06-e2e-critical-path

Pre-requisite: T05 merged.

Tasks:

1. Create CriticalPathE2ETest at 
   backend/src/test/java/com/dorachecker/e2e/CriticalPathE2ETest.java
   extends AbstractIntegrationTest.
   
   Single test method: completeUserJourney_registersLoginsAssessesExports():
   
   a) Register new user via POST /api/auth/register
   b) Read the verification token from a test MailCatcher or the DB 
      directly (DevDataSeeder may expose helper, or write one)
   c) Verify email via POST /api/auth/verify-email
   d) Login via POST /api/auth/login — capture JWT
   e) GET /api/questions — assert ≥ 30 questions
   f) POST /api/assessments with sample answers — capture assessmentId
   g) GET /api/assessments/{id} — assert score and compliance level
   h) POST /api/exports/pdf/assessment/{id} — 
      - For FREE user, expect 403 (premium gate working)
      - Upgrade user to STANDARD via a test helper (directly set in 
        UserSubscriptionEntity)
      - Retry export — expect 200 with PDF bytes
   i) POST /api/contracts/analyze-text with short contract — 
      expect 200 (use WireMock Claude stub)
   j) GET /api/auth/me — assert user tier = STANDARD
   k) POST /api/auth/logout
   l) GET /api/auth/me with old JWT — expect 401 (blacklisted)

2. If any step fails due to missing seed data or test infrastructure 
   gap (e.g. can't verify email without email capture), build the 
   infrastructure:
   - Add a @TestComponent EmailCaptureService that replaces 
     ResendEmailService in test profile and stores sent emails in memory
   - Expose endpoints or methods to read captured emails

3. This test may take 10-20 seconds. That's OK. Tag it with @Tag("e2e") 
   so it can be excluded from fast unit test runs if needed.

4. Run with `./gradlew test --tests "*CriticalPathE2E*"`. Must pass.

5. Commit: `test(e2e): end-to-end critical path — register through export`.

Acceptance:
- Single test covers: auth, assessment, scoring, export, subscription, logout
- Test runs in <30 seconds
- All previous tests still green
```

---

## Prompt T07 — Coverage gate + CI integration

```
Phase: Turn coverage into a CI gate. From now on, PRs that drop coverage 
below thresholds on critical packages fail.

Branch: tests-07-coverage-gate

Pre-requisite: T06 merged.

Tasks:

1. Review current coverage in 
   backend/build/reports/jacoco/test/html/index.html.
   Record numbers for critical packages in commit message.

2. Enable jacocoTestCoverageVerification (already configured in T00, 
   but not enforced). Set `test.finalizedBy = jacocoTestCoverageVerification`:
   
   test {
       finalizedBy jacocoTestReport, jacocoTestCoverageVerification
   }

3. Tune thresholds to current actuals minus 5%:
   - If AssessmentService is at 72%, set threshold at 0.67
   - If ClaudeApiService is at 80%, set threshold at 0.75
   
   The "minus 5%" buffer prevents flaky failures from minor refactors.

4. Update .github/workflows/ci.yml (or equivalent):
   - Ensure the build step runs `./gradlew build jacocoTestCoverageVerification`
   - Upload JaCoCo XML as artifact
   - Optional: configure PR comment bot (e.g. Madrapps/jacoco-report action) 
     to show coverage delta on each PR

5. Add a README or CONTRIBUTING.md section explaining:
   - Which packages have coverage gates
   - How to run tests locally
   - How to see the HTML report

6. Run full CI-equivalent locally: `./gradlew clean build`. Must pass.

7. Deliberately break coverage in a throwaway branch:
   - Add a new uncovered public method in AssessmentService
   - Run the build — should fail with a clear error
   - Revert that change
   This proves the gate works. Report in chat.

8. Commit: `test(ci): enforce coverage thresholds on critical packages`.

Acceptance:
- `./gradlew build` fails if critical package coverage drops below threshold
- Thresholds are realistic (current actuals minus 5%)
- CI pipeline shows coverage report artefact
- Future refactors are safe — you can't accidentally delete tests without CI noticing
```

---

## Execution order & expected outcome

| # | Branch | Focus | Approx effort |
|---|--------|-------|----|
| T00 | tests-00-infrastructure | Testcontainers, WireMock, JaCoCo setup | 1 day |
| T01 | tests-01-assessment-scoring | AssessmentService scoring + auth tests | 1 day |
| T02 | tests-02-auth | JwtService + AuthController + 2FA tests | 1 day |
| T03 | tests-03-claude-contract | ClaudeApiService + ContractAnalysis tests | 1.5 days |
| T04 | tests-04-pdf-export | PDF smoke tests (the god class before refactor) | 1 day |
| T05 | tests-05-stripe | Stripe webhook + subscription matrix | 1 day |
| T06 | tests-06-e2e-critical-path | Full user journey integration | 0.5 day |
| T07 | tests-07-coverage-gate | CI coverage enforcement | 0.5 day |

**Total: ~7–8 working days** of focused work. Fits 2 calendar weeks comfortably.

**Expected outcome:**
- Critical path packages: 60–85% coverage
- CI gate prevents accidental regressions
- Refactoring god classes (Step 3) is now safe
- New features can be added with confidence

---

## Before each prompt — checklist

- [ ] Previous branch merged to main
- [ ] `./gradlew build` green on main
- [ ] docker-compose services up if tests need them (Testcontainers boots its own)
- [ ] Re-read the relevant service class before writing tests against it

## After each prompt — checklist

- [ ] All new tests pass on first run (flaky = fix or remove)
- [ ] JaCoCo report shows expected coverage bump
- [ ] No production code modified (bugs go in follow-up commits)
- [ ] Commit message references test scope
- [ ] PR has a one-line summary of what is now tested that wasn't before

---

## Found bugs (append as discovered during test writing)

_This section will be populated by test prompts when tests reveal real bugs in production code. Each entry gets a short description + the test that caught it + follow-up ticket reference._

(empty as of 2026-04-24)

---

## Out of scope for Phase 2

- Frontend unit tests (Angular component tests already covered by existing Playwright E2E)
- Performance / load tests
- Contract tests against real Claude or Stripe
- Mutation testing
- Accessibility tests

These are Phase 4 or later.
