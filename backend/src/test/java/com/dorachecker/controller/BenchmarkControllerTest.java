package com.dorachecker.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.ContractAnalysisRepository;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class BenchmarkControllerTest {

  @Mock private AssessmentRepository assessmentRepository;
  @Mock private ContractAnalysisRepository contractAnalysisRepository;

  @InjectMocks private BenchmarkController controller;

  // ========== Assessment Benchmark ==========

  @Nested
  class GetAssessmentBenchmark {

    @Test
    void zeroAssessments_returnsMockData() {
      when(assessmentRepository.count()).thenReturn(0L);

      var response = controller.getAssessmentBenchmark(75.0);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      Map<String, Object> body = response.getBody();
      assertThat(body).isNotNull();
      assertThat(body.get("industryAverage")).isEqualTo(61.0);
      assertThat(body.get("median")).isEqualTo(58.0);
      assertThat(body.get("totalAssessments")).isEqualTo(247);
      assertThat(body.get("percentile25")).isEqualTo(45.0);
      assertThat(body.get("percentile75")).isEqualTo(72.0);
      assertThat(body.get("minScore")).isEqualTo(23.0);
      assertThat(body.get("maxScore")).isEqualTo(94.0);
    }

    @Test
    void zeroAssessments_includesPillarAverages() {
      when(assessmentRepository.count()).thenReturn(0L);

      var response = controller.getAssessmentBenchmark(60.0);
      Map<String, Object> body = response.getBody();

      assertThat(body).containsKey("pillarAverages");
      @SuppressWarnings("unchecked")
      Map<String, Object> pillars = (Map<String, Object>) body.get("pillarAverages");
      assertThat(pillars).containsEntry("ICT_RISK_MANAGEMENT", 63.5);
      assertThat(pillars).containsEntry("INCIDENT_MANAGEMENT", 58.2);
      assertThat(pillars).containsEntry("TESTING", 51.8);
      assertThat(pillars).containsEntry("THIRD_PARTY", 66.3);
      assertThat(pillars).containsEntry("INFORMATION_SHARING", 47.1);
    }

    @Test
    void zeroAssessments_includesIndustryBenchmarks() {
      when(assessmentRepository.count()).thenReturn(0L);

      var response = controller.getAssessmentBenchmark(50.0);
      Map<String, Object> body = response.getBody();

      assertThat(body).containsKey("industryBenchmarks");
      @SuppressWarnings("unchecked")
      Map<String, Object> benchmarks = (Map<String, Object>) body.get("industryBenchmarks");
      assertThat(benchmarks).containsKey("banking");
      assertThat(benchmarks).containsKey("insurance");
      assertThat(benchmarks).containsKey("fintech");
    }

    @Test
    void zeroAssessments_includesComplianceDistribution() {
      when(assessmentRepository.count()).thenReturn(0L);

      var response = controller.getAssessmentBenchmark(50.0);
      Map<String, Object> body = response.getBody();

      assertThat(body).containsKey("complianceLevelDistribution");
      @SuppressWarnings("unchecked")
      Map<String, Object> dist = (Map<String, Object>) body.get("complianceLevelDistribution");
      assertThat(dist).containsEntry("GREEN", 18);
      assertThat(dist).containsEntry("YELLOW", 52);
      assertThat(dist).containsEntry("RED", 30);
    }

    @Test
    void zeroAssessments_calculatesPercentile() {
      when(assessmentRepository.count()).thenReturn(0L);

      var response = controller.getAssessmentBenchmark(80.0);
      Map<String, Object> body = response.getBody();

      assertThat(body.get("percentileRank")).isNotNull();
      double percentile = ((Number) body.get("percentileRank")).doubleValue();
      assertThat(percentile).isGreaterThan(0).isLessThanOrEqualTo(100);
    }

    @Test
    void withRealData_returnsComputedStats() {
      when(assessmentRepository.count()).thenReturn(50L);
      when(assessmentRepository.findAverageScore()).thenReturn(65.3);
      when(assessmentRepository.findMedianScore()).thenReturn(63.0);
      when(assessmentRepository.findPercentile25()).thenReturn(48.5);
      when(assessmentRepository.findPercentile75()).thenReturn(78.2);
      when(assessmentRepository.findMinScore()).thenReturn(15.0);
      when(assessmentRepository.findMaxScore()).thenReturn(96.0);
      when(assessmentRepository.countBelowScore(70.0)).thenReturn(35L);
      when(assessmentRepository.countByComplianceLevel())
          .thenReturn(
              List.of(
                  new Object[] {"GREEN", 15L},
                  new Object[] {"YELLOW", 25L},
                  new Object[] {"RED", 10L}));

      var response = controller.getAssessmentBenchmark(70.0);
      Map<String, Object> body = response.getBody();

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(body.get("industryAverage")).isEqualTo(65.3);
      assertThat(body.get("median")).isEqualTo(63.0);
      assertThat(body.get("percentile25")).isEqualTo(48.5);
      assertThat(body.get("percentile75")).isEqualTo(78.2);
      assertThat(body.get("minScore")).isEqualTo(15.0);
      assertThat(body.get("maxScore")).isEqualTo(96.0);
      assertThat(body.get("totalAssessments")).isEqualTo(50L);
    }

    @Test
    void withRealData_computesPercentileRank() {
      when(assessmentRepository.count()).thenReturn(100L);
      when(assessmentRepository.findAverageScore()).thenReturn(60.0);
      when(assessmentRepository.findMedianScore()).thenReturn(58.0);
      when(assessmentRepository.findPercentile25()).thenReturn(45.0);
      when(assessmentRepository.findPercentile75()).thenReturn(72.0);
      when(assessmentRepository.findMinScore()).thenReturn(10.0);
      when(assessmentRepository.findMaxScore()).thenReturn(95.0);
      when(assessmentRepository.countBelowScore(75.0)).thenReturn(80L);
      when(assessmentRepository.countByComplianceLevel()).thenReturn(List.of());

      var response = controller.getAssessmentBenchmark(75.0);
      Map<String, Object> body = response.getBody();

      assertThat(body.get("percentileRank")).isEqualTo(80.0);
    }

    @Test
    void withRealData_includesPillarAverages() {
      when(assessmentRepository.count()).thenReturn(10L);
      when(assessmentRepository.findAverageScore()).thenReturn(55.0);
      when(assessmentRepository.findMedianScore()).thenReturn(53.0);
      when(assessmentRepository.findPercentile25()).thenReturn(40.0);
      when(assessmentRepository.findPercentile75()).thenReturn(68.0);
      when(assessmentRepository.findMinScore()).thenReturn(20.0);
      when(assessmentRepository.findMaxScore()).thenReturn(88.0);
      when(assessmentRepository.countBelowScore(55.0)).thenReturn(5L);
      when(assessmentRepository.countByComplianceLevel()).thenReturn(List.of());

      var response = controller.getAssessmentBenchmark(55.0);
      Map<String, Object> body = response.getBody();

      assertThat(body).containsKey("pillarAverages");
      assertThat(body).containsKey("industryBenchmarks");
    }

    @Test
    void withNullStats_usesFallbackValues() {
      when(assessmentRepository.count()).thenReturn(5L);
      when(assessmentRepository.findAverageScore()).thenReturn(null);
      when(assessmentRepository.findMedianScore()).thenReturn(null);
      when(assessmentRepository.findPercentile25()).thenReturn(null);
      when(assessmentRepository.findPercentile75()).thenReturn(null);
      when(assessmentRepository.findMinScore()).thenReturn(null);
      when(assessmentRepository.findMaxScore()).thenReturn(null);
      when(assessmentRepository.countBelowScore(50.0)).thenReturn(0L);
      when(assessmentRepository.countByComplianceLevel()).thenReturn(List.of());

      var response = controller.getAssessmentBenchmark(50.0);
      Map<String, Object> body = response.getBody();

      // Null values should fall back to defaults
      assertThat(body.get("industryAverage")).isEqualTo(61.0);
      assertThat(body.get("median")).isEqualTo(58.0);
      assertThat(body.get("percentile25")).isEqualTo(45.0);
      assertThat(body.get("percentile75")).isEqualTo(72.0);
    }

    @Test
    void onException_returnsFallbackMockData() {
      when(assessmentRepository.count()).thenThrow(new RuntimeException("DB error"));

      var response = controller.getAssessmentBenchmark(60.0);
      Map<String, Object> body = response.getBody();

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(body.get("industryAverage")).isEqualTo(61.0);
      assertThat(body.get("totalAssessments")).isEqualTo(247);
      assertThat(body).containsKey("pillarAverages");
      assertThat(body).containsKey("industryBenchmarks");
      assertThat(body).containsKey("complianceLevelDistribution");
    }
  }

  // ========== Contract Benchmark ==========

  @Nested
  class GetContractBenchmark {

    @Test
    void returnsContractBenchmarkData() {
      when(contractAnalysisRepository.count()).thenReturn(20L);

      var response = controller.getContractBenchmark(65.0);
      Map<String, Object> body = response.getBody();

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(body.get("industryAverage")).isEqualTo(54.0);
      assertThat(body.get("median")).isEqualTo(51.0);
      assertThat(body.get("totalAnalyses")).isEqualTo(20L);
    }

    @Test
    void zeroCount_usesDefaultTotalAnalyses() {
      when(contractAnalysisRepository.count()).thenReturn(0L);

      var response = controller.getContractBenchmark(50.0);
      Map<String, Object> body = response.getBody();

      assertThat(body.get("totalAnalyses")).isEqualTo(183L);
    }

    @Test
    void includesContractIndustryBenchmarks() {
      when(contractAnalysisRepository.count()).thenReturn(5L);

      var response = controller.getContractBenchmark(50.0);
      Map<String, Object> body = response.getBody();

      assertThat(body).containsKey("industryBenchmarks");
      assertThat(body).containsKey("complianceLevelDistribution");
      assertThat(body).containsKey("percentileRank");
    }

    @Test
    void onException_returnsFallback() {
      when(contractAnalysisRepository.count()).thenThrow(new RuntimeException("DB error"));

      var response = controller.getContractBenchmark(40.0);
      Map<String, Object> body = response.getBody();

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(body.get("industryAverage")).isEqualTo(54.0);
      assertThat(body).containsKey("industryBenchmarks");
    }
  }

  // ========== Percentile Calculations ==========

  @Nested
  class PercentileCalculation {

    @Test
    void highScore_givesHighPercentile() {
      when(assessmentRepository.count()).thenReturn(0L);

      var r1 = controller.getAssessmentBenchmark(90.0);
      var r2 = controller.getAssessmentBenchmark(30.0);

      double p1 = ((Number) r1.getBody().get("percentileRank")).doubleValue();
      double p2 = ((Number) r2.getBody().get("percentileRank")).doubleValue();

      assertThat(p1).isGreaterThan(p2);
    }

    @Test
    void zeroScore_givesLowPercentile() {
      when(assessmentRepository.count()).thenReturn(0L);

      var response = controller.getAssessmentBenchmark(0.0);
      double percentile = ((Number) response.getBody().get("percentileRank")).doubleValue();

      assertThat(percentile).isEqualTo(0.0);
    }

    @Test
    void contractPercentile_highScore() {
      when(contractAnalysisRepository.count()).thenReturn(0L);

      var r1 = controller.getContractBenchmark(85.0);
      var r2 = controller.getContractBenchmark(25.0);

      double p1 = ((Number) r1.getBody().get("percentileRank")).doubleValue();
      double p2 = ((Number) r2.getBody().get("percentileRank")).doubleValue();

      assertThat(p1).isGreaterThan(p2);
    }
  }
}
