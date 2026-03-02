package com.dorachecker.controller;

import com.dorachecker.model.AssessmentEntity;
import com.dorachecker.model.AssessmentRepository;
import com.dorachecker.model.ContractAnalysisEntity;
import com.dorachecker.model.ContractAnalysisRepository;
import com.dorachecker.model.IncidentReportRepository;
import com.dorachecker.service.ExcelExportService;
import com.dorachecker.service.PdfExportService;
import com.dorachecker.service.SubscriptionGuardService;
import com.dorachecker.service.SubscriptionGuardService.Feature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExportControllerTest {

    @Mock private SubscriptionGuardService guardService;
    @Mock private AssessmentRepository assessmentRepository;
    @Mock private ContractAnalysisRepository contractAnalysisRepository;
    @Mock private IncidentReportRepository incidentReportRepository;
    @Mock private PdfExportService pdfExportService;
    @Mock private ExcelExportService excelExportService;
    @Mock private Authentication authentication;

    private ExportController controller;

    @BeforeEach
    void setUp() {
        controller = new ExportController(
                guardService, assessmentRepository, contractAnalysisRepository,
                incidentReportRepository, pdfExportService, excelExportService
        );
    }

    @Nested
    class AssessmentPdfExport {

        @Test
        void authorizedUser_returnsPdfBytes() {
            when(authentication.getPrincipal()).thenReturn("user-1");
            when(guardService.canAccess("user-1", null, Feature.PDF_EXPORT)).thenReturn(true);

            AssessmentEntity assessment = new AssessmentEntity();
            when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
            when(pdfExportService.generateAssessmentPdf(assessment)).thenReturn(new byte[]{1, 2, 3});

            var response = controller.exportAssessmentPdf("a1", null, authentication);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getHeaders().getContentType().toString()).contains("pdf");
        }

        @Test
        void unauthorizedUser_returns403() {
            when(authentication.getPrincipal()).thenReturn("free-user");
            when(guardService.canAccess("free-user", null, Feature.PDF_EXPORT)).thenReturn(false);

            var response = controller.exportAssessmentPdf("a1", null, authentication);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            verify(pdfExportService, never()).generateAssessmentPdf(any());
        }

        @Test
        void notFound_returns404() {
            when(authentication.getPrincipal()).thenReturn("user-1");
            when(guardService.canAccess("user-1", null, Feature.PDF_EXPORT)).thenReturn(true);
            when(assessmentRepository.findById("missing")).thenReturn(Optional.empty());

            var response = controller.exportAssessmentPdf("missing", null, authentication);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        void nullAuthentication_extractsNullUserId() {
            when(guardService.canAccess(null, "sess-1", Feature.PDF_EXPORT)).thenReturn(false);

            var response = controller.exportAssessmentPdf("a1", "sess-1", null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        }
    }

    @Nested
    class ContractPdfExport {

        @Test
        void authorizedUser_returnsPdfBytes() {
            when(authentication.getPrincipal()).thenReturn("user-1");
            when(guardService.canAccess("user-1", null, Feature.PDF_EXPORT)).thenReturn(true);

            ContractAnalysisEntity contract = new ContractAnalysisEntity();
            when(contractAnalysisRepository.findById("c1")).thenReturn(Optional.of(contract));
            when(pdfExportService.generateContractPdf(contract)).thenReturn(new byte[]{4, 5, 6});

            var response = controller.exportContractPdf("c1", null, authentication);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        void unauthorizedUser_returns403() {
            when(authentication.getPrincipal()).thenReturn("free-user");
            when(guardService.canAccess("free-user", null, Feature.PDF_EXPORT)).thenReturn(false);

            var response = controller.exportContractPdf("c1", null, authentication);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        }
    }

    @Nested
    class ExcelExport {

        @Test
        void assessmentExcel_authorizedUser_returnsExcel() {
            when(authentication.getPrincipal()).thenReturn("user-1");
            when(guardService.canAccess("user-1", null, Feature.EXCEL_EXPORT)).thenReturn(true);

            AssessmentEntity assessment = new AssessmentEntity();
            when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
            when(excelExportService.generateAssessmentExcel(assessment)).thenReturn(new byte[]{7, 8});

            var response = controller.exportAssessmentExcel("a1", null, authentication);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getHeaders().getContentType().toString()).contains("spreadsheetml");
        }

        @Test
        void contractExcel_unauthorizedUser_returns403() {
            when(authentication.getPrincipal()).thenReturn("free-user");
            when(guardService.canAccess("free-user", null, Feature.EXCEL_EXPORT)).thenReturn(false);

            var response = controller.exportContractExcel("c1", null, authentication);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        }
    }

    @Nested
    class XbrlExport {

        @Test
        void enterpriseUser_allowsXbrl() {
            when(authentication.getPrincipal()).thenReturn("ent-user");
            when(guardService.canAccess("ent-user", null, Feature.XBRL_EXPORT)).thenReturn(true);

            var response = controller.exportXbrlCsv("id1", null, authentication);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        void standardUser_blocksXbrl() {
            when(authentication.getPrincipal()).thenReturn("std-user");
            when(guardService.canAccess("std-user", null, Feature.XBRL_EXPORT)).thenReturn(false);

            var response = controller.exportXbrlCsv("id1", null, authentication);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        }
    }

    @Nested
    class SessionIdFallback {

        @Test
        void usesSessionId_whenNoAuthentication() {
            when(guardService.canAccess(null, "sess-abc", Feature.PDF_EXPORT)).thenReturn(true);

            AssessmentEntity assessment = new AssessmentEntity();
            when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
            when(pdfExportService.generateAssessmentPdf(assessment)).thenReturn(new byte[]{1});

            var response = controller.exportAssessmentPdf("a1", "sess-abc", null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(guardService).canAccess(null, "sess-abc", Feature.PDF_EXPORT);
        }
    }
}
