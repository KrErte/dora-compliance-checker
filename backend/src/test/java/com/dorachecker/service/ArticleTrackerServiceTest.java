package com.dorachecker.service;

import com.dorachecker.model.AssessmentEntity;
import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.EvidenceEntity;
import com.dorachecker.model.EvidenceRepository;
import com.dorachecker.model.RemediationItemEntity;
import com.dorachecker.model.RemediationItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArticleTrackerServiceTest {

    private static final String USER_ID = "user-123";

    @Mock
    private AssessmentRepository assessmentRepo;

    @Mock
    private EvidenceRepository evidenceRepo;

    @Mock
    private RemediationItemRepository remediationRepo;

    @InjectMocks
    private ArticleTrackerService service;

    /**
     * Stubs all three repositories to return empty lists for the given userId.
     */
    private void stubEmptyRepositories() {
        when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID)).thenReturn(List.of());
        when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of());
        when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of());
    }

    private AssessmentEntity buildAssessment(double scorePercentage) {
        AssessmentEntity a = new AssessmentEntity();
        a.setId(UUID.randomUUID().toString());
        a.setUserId(USER_ID);
        a.setScorePercentage(scorePercentage);
        a.setAssessmentDate(LocalDateTime.now());
        a.setCompanyName("TestCo");
        a.setContractName("TestContract");
        a.setTotalQuestions(20);
        a.setCompliantCount(10);
        a.setPartialCount(5);
        a.setComplianceLevel("PARTIAL");
        return a;
    }

    private EvidenceEntity buildEvidence(String pillar, String articleNumbers) {
        EvidenceEntity e = new EvidenceEntity();
        e.setId(UUID.randomUUID().toString());
        e.setUserId(USER_ID);
        e.setTitle("Test Evidence");
        e.setCategory("POLICY");
        e.setPillar(pillar);
        e.setFileName("test.pdf");
        e.setStoredFileName(UUID.randomUUID().toString());
        e.setArticleNumbers(articleNumbers);
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        return e;
    }

    private RemediationItemEntity buildRemediation(String pillar, String status) {
        RemediationItemEntity r = new RemediationItemEntity();
        r.setId(UUID.randomUUID().toString());
        r.setUserId(USER_ID);
        r.setTitle("Fix something");
        r.setPillar(pillar);
        r.setStatus(status);
        r.setPriority("HIGH");
        r.setCreatedAt(LocalDateTime.now());
        r.setUpdatedAt(LocalDateTime.now());
        return r;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getChapters(Map<String, Object> result) {
        return (List<Map<String, Object>>) result.get("chapters");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getArticles(Map<String, Object> chapter) {
        return (List<Map<String, Object>>) chapter.get("articles");
    }

    // ========================================================================
    // GetArticleComplianceStatus tests
    // ========================================================================

    @Nested
    @DisplayName("getArticleComplianceStatus")
    class GetArticleComplianceStatus {

        @Test
        @DisplayName("returns 6 chapters with correct article counts totalling 34")
        void returns6ChaptersWithCorrectArticleCounts() {
            stubEmptyRepositories();

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            List<Map<String, Object>> chapters = getChapters(result);
            assertThat(chapters).hasSize(6);

            // Chapter I: General Provisions — 4 articles
            assertThat(getArticles(chapters.get(0))).hasSize(4);
            assertThat(chapters.get(0).get("number")).isEqualTo("I");
            assertThat(chapters.get(0).get("title")).isEqualTo("General Provisions");
            assertThat(chapters.get(0).get("articleRange")).isEqualTo("Art. 1-4");

            // Chapter II: ICT Risk Management — 12 articles
            assertThat(getArticles(chapters.get(1))).hasSize(12);
            assertThat(chapters.get(1).get("number")).isEqualTo("II");
            assertThat(chapters.get(1).get("title")).isEqualTo("ICT Risk Management");

            // Chapter III: ICT-Related Incident Management — 7 articles
            assertThat(getArticles(chapters.get(2))).hasSize(7);
            assertThat(chapters.get(2).get("number")).isEqualTo("III");

            // Chapter IV: Digital Operational Resilience Testing — 4 articles
            assertThat(getArticles(chapters.get(3))).hasSize(4);
            assertThat(chapters.get(3).get("number")).isEqualTo("IV");

            // Chapter V: Managing ICT Third-Party Risk — 6 articles
            assertThat(getArticles(chapters.get(4))).hasSize(6);
            assertThat(chapters.get(4).get("number")).isEqualTo("V");

            // Chapter VI: Information-Sharing Arrangements — 1 article
            assertThat(getArticles(chapters.get(5))).hasSize(1);
            assertThat(chapters.get(5).get("number")).isEqualTo("VI");

            // Total articles
            assertThat(result.get("totalArticles")).isEqualTo(34);
        }

        @Test
        @DisplayName("no data returns all articles as non_compliant")
        void noDataReturnsAllNonCompliant() {
            stubEmptyRepositories();

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            assertThat(result.get("totalArticles")).isEqualTo(34);
            assertThat(result.get("compliant")).isEqualTo(0);
            assertThat(result.get("partial")).isEqualTo(0);
            assertThat(result.get("nonCompliant")).isEqualTo(34);
            assertThat(result.get("overallPercentage")).isEqualTo(0L);

            // Verify every article is non_compliant
            List<Map<String, Object>> chapters = getChapters(result);
            for (Map<String, Object> chapter : chapters) {
                for (Map<String, Object> article : getArticles(chapter)) {
                    assertThat(article.get("status"))
                            .as("Article %s should be non_compliant", article.get("id"))
                            .isEqualTo("non_compliant");
                }
            }
        }

        @Test
        @DisplayName("high assessment score (>=75) with evidence results in compliant status")
        void highScoreWithEvidenceIsCompliant() {
            AssessmentEntity assessment = buildAssessment(80.0);
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(assessment));

            // Evidence for ICT_RISK_MANAGEMENT pillar
            EvidenceEntity evidence = buildEvidence("ICT_RISK_MANAGEMENT", null);
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(evidence));

            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            // Chapter II articles (ICT_RISK_MANAGEMENT pillar) should be compliant
            // because score >= 75 AND evidenceCount >= 1 (via pillar fallback)
            List<Map<String, Object>> chapterII = getArticles(getChapters(result).get(1));
            for (Map<String, Object> article : chapterII) {
                assertThat(article.get("status"))
                        .as("Article %s in ICT_RISK_MANAGEMENT should be compliant", article.get("id"))
                        .isEqualTo("compliant");
            }
        }

        @Test
        @DisplayName("score >= 40 with no evidence returns partial status")
        void score40NoEvidenceIsPartial() {
            AssessmentEntity assessment = buildAssessment(50.0);
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(assessment));

            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            // All articles should be partial because score >= 40 but no evidence
            List<Map<String, Object>> chapters = getChapters(result);
            for (Map<String, Object> chapter : chapters) {
                for (Map<String, Object> article : getArticles(chapter)) {
                    assertThat(article.get("status"))
                            .as("Article %s should be partial with score=50 and no evidence", article.get("id"))
                            .isEqualTo("partial");
                }
            }

            assertThat(result.get("partial")).isEqualTo(34);
            assertThat(result.get("compliant")).isEqualTo(0);
            assertThat(result.get("nonCompliant")).isEqualTo(0);
        }

        @Test
        @DisplayName("evidence linked to specific article number sets article evidence count")
        void evidenceLinkedToSpecificArticle() {
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of());

            // Evidence explicitly tagged to articles 5 and 6
            EvidenceEntity ev1 = buildEvidence("ICT_RISK_MANAGEMENT", "5,6");
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(ev1));
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            // art5 and art6 should have specific evidence via articleNumbers mapping
            List<Map<String, Object>> chapterII = getArticles(getChapters(result).get(1));

            // art5 (first article in chapter II)
            Map<String, Object> art5 = chapterII.stream()
                    .filter(a -> "art5".equals(a.get("id")))
                    .findFirst().orElseThrow();
            assertThat(art5.get("evidenceCount")).isEqualTo(1);
            assertThat(art5.get("status")).isEqualTo("partial"); // evidenceCount >= 1 but score < 75

            // art6
            Map<String, Object> art6 = chapterII.stream()
                    .filter(a -> "art6".equals(a.get("id")))
                    .findFirst().orElseThrow();
            assertThat(art6.get("evidenceCount")).isEqualTo(1);
            assertThat(art6.get("status")).isEqualTo("partial");

            // art7 has no specific article evidence, but the pillar-level fallback count is 1
            // because the evidence belongs to ICT_RISK_MANAGEMENT pillar
            Map<String, Object> art7 = chapterII.stream()
                    .filter(a -> "art7".equals(a.get("id")))
                    .findFirst().orElseThrow();
            // Pillar fallback: evidenceByPillar has ICT_RISK_MANAGEMENT=1
            assertThat(art7.get("evidenceCount")).isEqualTo(1);
            assertThat(art7.get("status")).isEqualTo("partial");
        }

        @Test
        @DisplayName("remediation items with completed status affect article status")
        void remediationItemsAffectStatus() {
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of());
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            // One completed remediation for TESTING pillar
            RemediationItemEntity completed = buildRemediation("TESTING", "COMPLETED");
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(completed));

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            // TESTING pillar articles (Chapter IV) should be partial because rem[1] > 0
            List<Map<String, Object>> chapterIV = getArticles(getChapters(result).get(3));
            for (Map<String, Object> article : chapterIV) {
                assertThat(article.get("status"))
                        .as("Article %s in TESTING should be partial due to completed remediation", article.get("id"))
                        .isEqualTo("partial");
            }

            // Other pillar articles (no remediation, no evidence, score=0) should be non_compliant
            List<Map<String, Object>> chapterI = getArticles(getChapters(result).get(0));
            for (Map<String, Object> article : chapterI) {
                assertThat(article.get("status"))
                        .as("Article %s in GENERAL should be non_compliant", article.get("id"))
                        .isEqualTo("non_compliant");
            }
        }

        @Test
        @DisplayName("open remediation items without completed items do not change status from non_compliant")
        void openRemediationItemsDoNotMakePartial() {
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of());
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            // Only OPEN remediation (not COMPLETED)
            RemediationItemEntity open = buildRemediation("TESTING", "OPEN");
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(open));

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            // rem[1] == 0 (no COMPLETED), so TESTING articles should still be non_compliant
            List<Map<String, Object>> chapterIV = getArticles(getChapters(result).get(3));
            for (Map<String, Object> article : chapterIV) {
                assertThat(article.get("status"))
                        .as("Article %s in TESTING should remain non_compliant with only OPEN remediation", article.get("id"))
                        .isEqualTo("non_compliant");
            }
        }

        @Test
        @DisplayName("overall percentage calculation is correct")
        void overallPercentageCalculation() {
            // Setup: score=80 with evidence for ICT_RISK_MANAGEMENT only.
            // ICT_RISK_MANAGEMENT articles (12) = compliant (score>=75 + evidence>=1)
            // All other articles (22) = partial (score>=40, no evidence via pillar but score triggers partial)
            // Wait, score >=40 triggers partial for ALL articles regardless of pillar.
            // So: score=80, evidence for ICT_RISK_MANAGEMENT:
            //   - ICT_RISK_MANAGEMENT (12 articles): score>=75 + evidence>=1 => compliant
            //   - All others (22 articles): score>=40 => partial (no evidence for their pillar)
            // Overall % = ((12 + 22*0.5) / 34) * 100 = ((12 + 11) / 34) * 100 = (23/34)*100 = 67.647... => Math.round = 68

            AssessmentEntity assessment = buildAssessment(80.0);
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(assessment));

            EvidenceEntity evidence = buildEvidence("ICT_RISK_MANAGEMENT", null);
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(evidence));
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            assertThat(result.get("compliant")).isEqualTo(12);
            assertThat(result.get("partial")).isEqualTo(22);
            assertThat(result.get("nonCompliant")).isEqualTo(0);
            assertThat(result.get("overallPercentage")).isEqualTo(68L);
        }

        @Test
        @DisplayName("all compliant gives 100% overall percentage")
        void allCompliantGives100Percent() {
            // All pillars need evidence + score >= 75
            AssessmentEntity assessment = buildAssessment(90.0);
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(assessment));

            // One evidence per pillar
            List<EvidenceEntity> evidenceList = List.of(
                    buildEvidence("GENERAL", null),
                    buildEvidence("ICT_RISK_MANAGEMENT", null),
                    buildEvidence("INCIDENT_MANAGEMENT", null),
                    buildEvidence("TESTING", null),
                    buildEvidence("THIRD_PARTY", null),
                    buildEvidence("INFORMATION_SHARING", null)
            );
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(evidenceList);
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            assertThat(result.get("compliant")).isEqualTo(34);
            assertThat(result.get("partial")).isEqualTo(0);
            assertThat(result.get("nonCompliant")).isEqualTo(0);
            assertThat(result.get("overallPercentage")).isEqualTo(100L);
        }

        @Test
        @DisplayName("all partial gives 50% overall percentage")
        void allPartialGives50Percent() {
            // score >= 40 but < 75, no evidence => partial for all
            AssessmentEntity assessment = buildAssessment(50.0);
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(assessment));
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            assertThat(result.get("partial")).isEqualTo(34);
            // (0 + 34*0.5) / 34 * 100 = 50
            assertThat(result.get("overallPercentage")).isEqualTo(50L);
        }

        @Test
        @DisplayName("chapter progress calculated correctly")
        void chapterProgressCalculatedCorrectly() {
            // Score=80, evidence only for ICT_RISK_MANAGEMENT
            // Chapter II (12 articles, all compliant) => progress = (12 + 0*0.5)/12 * 100 = 100
            // Chapter I (4 articles, all partial due to score>=40) => progress = (0 + 4*0.5)/4 * 100 = 50
            AssessmentEntity assessment = buildAssessment(80.0);
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(assessment));

            EvidenceEntity evidence = buildEvidence("ICT_RISK_MANAGEMENT", null);
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(evidence));
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            List<Map<String, Object>> chapters = getChapters(result);

            // Chapter I — GENERAL pillar, score>=40 so partial, no evidence => partial
            // progress = (0 compliant + 4 partial * 0.5) / 4 * 100 = 50
            assertThat(chapters.get(0).get("progress")).isEqualTo(50L);

            // Chapter II — ICT_RISK_MANAGEMENT pillar, score>=75 + evidence => compliant
            // progress = (12 compliant + 0 partial * 0.5) / 12 * 100 = 100
            assertThat(chapters.get(1).get("progress")).isEqualTo(100L);

            // Chapter III — INCIDENT_MANAGEMENT pillar, score>=40 so partial
            // progress = (0 + 7*0.5) / 7 * 100 = 50
            assertThat(chapters.get(2).get("progress")).isEqualTo(50L);
        }

        @Test
        @DisplayName("chapter progress is 0 when all articles are non_compliant")
        void chapterProgressZeroWhenAllNonCompliant() {
            stubEmptyRepositories();

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);
            List<Map<String, Object>> chapters = getChapters(result);

            for (Map<String, Object> chapter : chapters) {
                assertThat(chapter.get("progress"))
                        .as("Chapter %s should have 0 progress", chapter.get("number"))
                        .isEqualTo(0L);
            }
        }

        @Test
        @DisplayName("evidence with null pillar uses GENERAL fallback")
        void evidenceWithNullPillarUsesGeneralFallback() {
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(buildAssessment(80.0)));

            EvidenceEntity evidence = buildEvidence(null, null);
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(evidence));
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            // GENERAL pillar articles (chapter I) should be compliant (score>=75 + evidence for GENERAL)
            List<Map<String, Object>> chapterI = getArticles(getChapters(result).get(0));
            for (Map<String, Object> article : chapterI) {
                assertThat(article.get("status"))
                        .as("Article %s should be compliant (null pillar -> GENERAL)", article.get("id"))
                        .isEqualTo("compliant");
            }
        }

        @Test
        @DisplayName("uses latest assessment score (first in desc-ordered list)")
        void usesLatestAssessmentScore() {
            AssessmentEntity latest = buildAssessment(80.0);
            latest.setAssessmentDate(LocalDateTime.now());
            AssessmentEntity older = buildAssessment(30.0);
            older.setAssessmentDate(LocalDateTime.now().minusDays(10));

            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(latest, older));

            // Evidence for all pillars to make score the deciding factor
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(buildEvidence("GENERAL", null)));
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            // With score=80 (>=75) and evidence for GENERAL, chapter I should be compliant
            List<Map<String, Object>> chapterI = getArticles(getChapters(result).get(0));
            for (Map<String, Object> article : chapterI) {
                assertThat(article.get("status")).isEqualTo("compliant");
            }
        }

        @Test
        @DisplayName("manual status override takes precedence in compliance status")
        void manualStatusOverrideTakesPrecedence() {
            stubEmptyRepositories();

            // Set a manual status override for art1
            service.updateArticleStatus(USER_ID, "art1", Map.of("manualStatus", "compliant"));

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            List<Map<String, Object>> chapterI = getArticles(getChapters(result).get(0));
            Map<String, Object> art1 = chapterI.stream()
                    .filter(a -> "art1".equals(a.get("id")))
                    .findFirst().orElseThrow();
            assertThat(art1.get("status")).isEqualTo("compliant");

            // art2 should still be non_compliant (no override, no data)
            Map<String, Object> art2 = chapterI.stream()
                    .filter(a -> "art2".equals(a.get("id")))
                    .findFirst().orElseThrow();
            assertThat(art2.get("status")).isEqualTo("non_compliant");

            // Overall: 1 compliant + 0 partial + 33 non_compliant
            assertThat(result.get("compliant")).isEqualTo(1);
            assertThat(result.get("nonCompliant")).isEqualTo(33);
        }

        @Test
        @DisplayName("score exactly 75 with evidence is compliant")
        void scoreExactly75WithEvidenceIsCompliant() {
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(buildAssessment(75.0)));
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(buildEvidence("TESTING", null)));
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            // TESTING pillar articles should be compliant (score==75 >= 75, evidence >= 1)
            List<Map<String, Object>> chapterIV = getArticles(getChapters(result).get(3));
            for (Map<String, Object> article : chapterIV) {
                assertThat(article.get("status")).isEqualTo("compliant");
            }
        }

        @Test
        @DisplayName("score exactly 40 with no evidence is partial")
        void scoreExactly40IsPartial() {
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(buildAssessment(40.0)));
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            List<Map<String, Object>> chapters = getChapters(result);
            for (Map<String, Object> chapter : chapters) {
                for (Map<String, Object> article : getArticles(chapter)) {
                    assertThat(article.get("status")).isEqualTo("partial");
                }
            }
        }

        @Test
        @DisplayName("score just below 40 with no evidence or remediation is non_compliant")
        void scoreBelow40IsNonCompliant() {
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(buildAssessment(39.9)));
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            List<Map<String, Object>> chapters = getChapters(result);
            for (Map<String, Object> chapter : chapters) {
                for (Map<String, Object> article : getArticles(chapter)) {
                    assertThat(article.get("status")).isEqualTo("non_compliant");
                }
            }
        }

        @Test
        @DisplayName("multiple evidence items for same article are counted correctly")
        void multipleEvidenceForSameArticle() {
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of());

            EvidenceEntity ev1 = buildEvidence("ICT_RISK_MANAGEMENT", "5");
            EvidenceEntity ev2 = buildEvidence("ICT_RISK_MANAGEMENT", "5");
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(ev1, ev2));
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            List<Map<String, Object>> chapterII = getArticles(getChapters(result).get(1));
            Map<String, Object> art5 = chapterII.stream()
                    .filter(a -> "art5".equals(a.get("id")))
                    .findFirst().orElseThrow();
            // Two distinct evidence entities mapped to art5 => evidenceCount should be 2
            assertThat(art5.get("evidenceCount")).isEqualTo(2);
        }

        @Test
        @DisplayName("remediation with null pillar uses GENERAL fallback")
        void remediationNullPillarUsesGeneralFallback() {
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of());
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            RemediationItemEntity rem = buildRemediation(null, "COMPLETED");
            // setPillar(null) since buildRemediation already set it
            rem.setPillar(null);
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(rem));

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            // GENERAL pillar articles (chapter I) should be partial due to completed remediation
            List<Map<String, Object>> chapterI = getArticles(getChapters(result).get(0));
            for (Map<String, Object> article : chapterI) {
                assertThat(article.get("status"))
                        .as("Article %s should be partial (null pillar remediation -> GENERAL)", article.get("id"))
                        .isEqualTo("partial");
            }
        }

        @Test
        @DisplayName("mixed scenario: some compliant, some partial, some non_compliant")
        void mixedScenario() {
            // Score 80 (>= 75), evidence only for TESTING pillar
            // TESTING (4 articles): score>=75 + evidence => compliant
            // All others (30 articles): score>=40 => partial (no evidence but score qualifies)
            when(assessmentRepo.findByUserIdOrderByAssessmentDateDesc(USER_ID))
                    .thenReturn(List.of(buildAssessment(80.0)));
            when(evidenceRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(buildEvidence("TESTING", null)));
            when(remediationRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of());

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            assertThat(result.get("compliant")).isEqualTo(4);
            assertThat(result.get("partial")).isEqualTo(30);
            assertThat(result.get("nonCompliant")).isEqualTo(0);
            // (4 + 30*0.5) / 34 * 100 = (4+15)/34 * 100 = 19/34*100 = 55.88... => 56
            assertThat(result.get("overallPercentage")).isEqualTo(56L);
        }
    }

    // ========================================================================
    // UpdateArticleStatus tests
    // ========================================================================

    @Nested
    @DisplayName("updateArticleStatus")
    class UpdateArticleStatus {

        @Test
        @DisplayName("updates user article data successfully")
        void updatesUserArticleDataSuccessfully() {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("notes", "Need to review this article");
            data.put("responsiblePerson", "John Doe");
            data.put("targetDate", "2026-06-15");
            data.put("manualStatus", "partial");

            Map<String, Object> result = service.updateArticleStatus(USER_ID, "art5", data);

            assertThat(result.get("success")).isEqualTo(true);
            assertThat(result.get("articleId")).isEqualTo("art5");

            // Verify the data is actually stored by calling getArticleDetail
            Map<String, Object> detail = service.getArticleDetail(USER_ID, "art5");
            assertThat(detail.get("notes")).isEqualTo("Need to review this article");
            assertThat(detail.get("responsiblePerson")).isEqualTo("John Doe");
            assertThat(detail.get("targetDate")).isEqualTo("2026-06-15");
            assertThat(detail.get("manualStatus")).isEqualTo("partial");
        }

        @Test
        @DisplayName("returns success with correct articleId")
        void returnsSuccessWithArticleId() {
            Map<String, Object> result = service.updateArticleStatus(USER_ID, "art28", Map.of("notes", "test"));

            assertThat(result).containsEntry("success", true);
            assertThat(result).containsEntry("articleId", "art28");
        }

        @Test
        @DisplayName("overwriting previous data replaces it")
        void overwritesPreviousData() {
            service.updateArticleStatus(USER_ID, "art10", Map.of("notes", "first note"));
            service.updateArticleStatus(USER_ID, "art10", Map.of("notes", "updated note", "manualStatus", "compliant"));

            Map<String, Object> detail = service.getArticleDetail(USER_ID, "art10");
            assertThat(detail.get("notes")).isEqualTo("updated note");
            assertThat(detail.get("manualStatus")).isEqualTo("compliant");
        }

        @Test
        @DisplayName("different users have independent article data")
        void differentUsersHaveIndependentData() {
            String userId2 = "user-456";

            service.updateArticleStatus(USER_ID, "art1", Map.of("notes", "user1 notes"));
            service.updateArticleStatus(userId2, "art1", Map.of("notes", "user2 notes"));

            Map<String, Object> detail1 = service.getArticleDetail(USER_ID, "art1");
            Map<String, Object> detail2 = service.getArticleDetail(userId2, "art1");

            assertThat(detail1.get("notes")).isEqualTo("user1 notes");
            assertThat(detail2.get("notes")).isEqualTo("user2 notes");
        }
    }

    // ========================================================================
    // GetArticleDetail tests
    // ========================================================================

    @Nested
    @DisplayName("getArticleDetail")
    class GetArticleDetail {

        @Test
        @DisplayName("returns saved notes, responsiblePerson, targetDate, manualStatus")
        void returnsSavedData() {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("notes", "Review compliance gaps");
            data.put("responsiblePerson", "Jane Smith");
            data.put("targetDate", "2026-12-31");
            data.put("manualStatus", "compliant");

            service.updateArticleStatus(USER_ID, "art17", data);

            Map<String, Object> detail = service.getArticleDetail(USER_ID, "art17");

            assertThat(detail.get("articleId")).isEqualTo("art17");
            assertThat(detail.get("notes")).isEqualTo("Review compliance gaps");
            assertThat(detail.get("responsiblePerson")).isEqualTo("Jane Smith");
            assertThat(detail.get("targetDate")).isEqualTo("2026-12-31");
            assertThat(detail.get("manualStatus")).isEqualTo("compliant");
        }

        @Test
        @DisplayName("returns empty defaults when no data saved")
        void returnsEmptyDefaultsWhenNoDataSaved() {
            Map<String, Object> detail = service.getArticleDetail(USER_ID, "art99");

            assertThat(detail.get("articleId")).isEqualTo("art99");
            assertThat(detail.get("notes")).isEqualTo("");
            assertThat(detail.get("responsiblePerson")).isEqualTo("");
            assertThat(detail.get("targetDate")).isEqualTo("");
            assertThat(detail.get("manualStatus")).isEqualTo("");
        }

        @Test
        @DisplayName("returns empty defaults for unknown user")
        void returnsEmptyDefaultsForUnknownUser() {
            Map<String, Object> detail = service.getArticleDetail("unknown-user", "art1");

            assertThat(detail.get("articleId")).isEqualTo("art1");
            assertThat(detail.get("notes")).isEqualTo("");
            assertThat(detail.get("responsiblePerson")).isEqualTo("");
            assertThat(detail.get("targetDate")).isEqualTo("");
            assertThat(detail.get("manualStatus")).isEqualTo("");
        }

        @Test
        @DisplayName("manual status override takes precedence in getArticleComplianceStatus")
        void manualStatusOverrideTakesPrecedenceInComplianceStatus() {
            // Set up data so that computed status would be non_compliant
            stubEmptyRepositories();

            // Override art17 to compliant manually
            service.updateArticleStatus(USER_ID, "art17",
                    Map.of("manualStatus", "compliant", "notes", "Manually verified"));

            Map<String, Object> result = service.getArticleComplianceStatus(USER_ID);

            // art17 should be compliant despite no assessment/evidence
            List<Map<String, Object>> chapterIII = getArticles(getChapters(result).get(2));
            Map<String, Object> art17 = chapterIII.stream()
                    .filter(a -> "art17".equals(a.get("id")))
                    .findFirst().orElseThrow();
            assertThat(art17.get("status")).isEqualTo("compliant");
            assertThat(art17.get("notes")).isEqualTo("Manually verified");

            // Other INCIDENT_MANAGEMENT articles should remain non_compliant
            Map<String, Object> art18 = chapterIII.stream()
                    .filter(a -> "art18".equals(a.get("id")))
                    .findFirst().orElseThrow();
            assertThat(art18.get("status")).isEqualTo("non_compliant");
        }

        @Test
        @DisplayName("partial fields stored — missing keys default to empty string")
        void partialFieldsStoredMissingKeysDefaultToEmpty() {
            // Only store notes, no other fields
            service.updateArticleStatus(USER_ID, "art24", Map.of("notes", "Only notes here"));

            Map<String, Object> detail = service.getArticleDetail(USER_ID, "art24");

            assertThat(detail.get("notes")).isEqualTo("Only notes here");
            assertThat(detail.get("responsiblePerson")).isEqualTo("");
            assertThat(detail.get("targetDate")).isEqualTo("");
            assertThat(detail.get("manualStatus")).isEqualTo("");
        }
    }
}
