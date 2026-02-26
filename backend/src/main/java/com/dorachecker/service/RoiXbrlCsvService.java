package com.dorachecker.service;

import com.dorachecker.model.IctProviderEntity;
import com.dorachecker.model.IctProviderRepository;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class RoiXbrlCsvService {

    private static final byte[] UTF8_BOM = { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF };
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final IctProviderRepository providerRepository;

    public RoiXbrlCsvService(IctProviderRepository providerRepository) {
        this.providerRepository = providerRepository;
    }

    public byte[] generateXbrlCsvZip(String userId, String companyName, String leiCode) throws IOException {
        List<IctProviderEntity> providers = providerRepository.findByUserIdOrderByCreatedAtDesc(userId);
        String reportDate = LocalDate.now().format(DATE_FMT);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            addCsvToZip(zos, "B_01_01.csv", generateEntityTable(companyName, leiCode, reportDate));
            addCsvToZip(zos, "B_02_01.csv", generateArrangementsTable(providers));
            addCsvToZip(zos, "B_03_01.csv", generateProvidersTable(providers));
            addCsvToZip(zos, "B_04_01.csv", generateServicesTable(providers));
            addCsvToZip(zos, "B_05_01.csv", generateFunctionsTable(providers));
            addCsvToZip(zos, "B_06_01.csv", generateAssessmentsTable(providers));
            addCsvToZip(zos, "metadata.csv", generateMetadataTable(companyName, leiCode, reportDate, providers.size()));
        }
        return baos.toByteArray();
    }

    // B_01.01 — Entity identification
    private List<String[]> generateEntityTable(String companyName, String leiCode, String reportDate) {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{
            "B_01.01.0010", "B_01.01.0020", "B_01.01.0030", "B_01.01.0040",
            "B_01.01.0050", "B_01.01.0060", "B_01.01.0070"
        });
        rows.add(new String[]{
            safe(companyName),
            safe(leiCode),
            "EE",
            "CI",
            reportDate,
            reportDate,
            "EUR"
        });
        return rows;
    }

    // B_02.01 — Contractual arrangements
    private List<String[]> generateArrangementsTable(List<IctProviderEntity> providers) {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{
            "B_02.01.0010", "B_02.01.0020", "B_02.01.0030", "B_02.01.0040",
            "B_02.01.0050", "B_02.01.0060", "B_02.01.0070", "B_02.01.0080",
            "B_02.01.0090", "B_02.01.0100", "B_02.01.0110"
        });
        int seq = 1;
        for (IctProviderEntity p : providers) {
            rows.add(new String[]{
                String.format("ARR-%04d", seq++),
                getProviderIdentifier(p),
                safe(p.getProviderName()),
                mapServiceCategory(p.getServiceType()),
                formatDate(p.getContractStartDate()),
                formatDate(p.getContractEndDate()),
                p.isCritical() || "critical".equalsIgnoreCase(p.getCriticality()) ? "Y" : "N",
                safe(p.getCountryCode()),
                safe(p.getDataLocation()),
                p.getSubcontractingInfo() != null && !p.getSubcontractingInfo().isEmpty() ? "Y" : "N",
                p.getHasExitStrategy() != null && p.getHasExitStrategy() ? "Y" : "N"
            });
        }
        return rows;
    }

    // B_03.01 — ICT third-party service providers
    private List<String[]> generateProvidersTable(List<IctProviderEntity> providers) {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{
            "B_03.01.0010", "B_03.01.0020", "B_03.01.0030", "B_03.01.0040",
            "B_03.01.0050", "B_03.01.0060", "B_03.01.0070"
        });
        // Deduplicate by provider name
        Map<String, IctProviderEntity> unique = new LinkedHashMap<>();
        for (IctProviderEntity p : providers) {
            unique.putIfAbsent(p.getProviderName(), p);
        }
        for (IctProviderEntity p : unique.values()) {
            String idType;
            String idValue;
            if (p.getLeiCode() != null && !p.getLeiCode().isEmpty()) {
                idType = "LEI";
                idValue = p.getLeiCode();
            } else if (p.getEuid() != null && !p.getEuid().isEmpty()) {
                idType = "EUID";
                idValue = p.getEuid();
            } else {
                idType = "OTHER";
                idValue = "GEN-" + p.getId().substring(0, Math.min(8, p.getId().length()));
            }

            rows.add(new String[]{
                getProviderIdentifier(p),
                safe(p.getProviderName()),
                idType,
                idValue,
                safe(p.getCountryCode()),
                safe(p.getProviderCountry()),
                p.isCritical() || "critical".equalsIgnoreCase(p.getCriticality()) ? "CTPP" : "NON-CTPP"
            });
        }
        return rows;
    }

    // B_04.01 — ICT services
    private List<String[]> generateServicesTable(List<IctProviderEntity> providers) {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{
            "B_04.01.0010", "B_04.01.0020", "B_04.01.0030", "B_04.01.0040",
            "B_04.01.0050"
        });
        int seq = 1;
        for (IctProviderEntity p : providers) {
            rows.add(new String[]{
                String.format("SVC-%04d", seq++),
                String.format("ARR-%04d", seq - 1),
                getProviderIdentifier(p),
                mapServiceCategory(p.getServiceType()),
                safe(p.getServiceDescription())
            });
        }
        return rows;
    }

    // B_05.01 — Functions identification
    private List<String[]> generateFunctionsTable(List<IctProviderEntity> providers) {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{
            "B_05.01.0010", "B_05.01.0020", "B_05.01.0030", "B_05.01.0040"
        });
        int seq = 1;
        for (IctProviderEntity p : providers) {
            rows.add(new String[]{
                String.format("FN-%04d", seq++),
                String.format("ARR-%04d", seq - 1),
                mapFunctionType(p.getServiceType()),
                p.isCritical() || "critical".equalsIgnoreCase(p.getCriticality()) ? "Y" : "N"
            });
        }
        return rows;
    }

    // B_06.01 — Assessments
    private List<String[]> generateAssessmentsTable(List<IctProviderEntity> providers) {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{
            "B_06.01.0010", "B_06.01.0020", "B_06.01.0030", "B_06.01.0040",
            "B_06.01.0050"
        });
        int seq = 1;
        for (IctProviderEntity p : providers) {
            if (p.isCritical() || "critical".equalsIgnoreCase(p.getCriticality()) || "important".equalsIgnoreCase(p.getCriticality())) {
                rows.add(new String[]{
                    String.format("ASM-%04d", seq++),
                    getProviderIdentifier(p),
                    safe(p.getProviderName()),
                    formatDate(p.getLastAssessmentDate()),
                    p.getLastAssessmentDate() != null ? "COMPLETED" : "PENDING"
                });
            }
        }
        return rows;
    }

    // Metadata
    private List<String[]> generateMetadataTable(String companyName, String leiCode, String reportDate, int providerCount) {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{ "Parameter", "Value" });
        rows.add(new String[]{ "ReportingEntity", safe(companyName) });
        rows.add(new String[]{ "LEI", safe(leiCode) });
        rows.add(new String[]{ "ReportDate", reportDate });
        rows.add(new String[]{ "ReportingPeriodStart", reportDate.substring(0, 4) + "-01-01" });
        rows.add(new String[]{ "ReportingPeriodEnd", reportDate });
        rows.add(new String[]{ "Framework", "EBA_ITS_RoI_4.0" });
        rows.add(new String[]{ "Format", "xBRL-CSV" });
        rows.add(new String[]{ "ProviderCount", String.valueOf(providerCount) });
        rows.add(new String[]{ "GeneratedBy", "DoraAudit.eu" });
        return rows;
    }

    // --- Completeness check ---

    public RoiCompletenessResult checkCompleteness(String userId) {
        List<IctProviderEntity> providers = providerRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<String> requiredFields = List.of(
            "providerName", "countryCode", "serviceType", "contractStartDate",
            "identifier", "criticality", "hasExitStrategy"
        );
        int totalFields = providers.size() * requiredFields.size();
        int completedFields = 0;

        List<ProviderCompleteness> providerResults = new ArrayList<>();

        for (IctProviderEntity p : providers) {
            List<String> missing = new ArrayList<>();
            int filled = 0;

            if (isPresent(p.getProviderName())) filled++; else missing.add("providerName");
            if (isPresent(p.getCountryCode())) filled++; else missing.add("countryCode");
            if (isPresent(p.getServiceType())) filled++; else missing.add("serviceType");
            if (p.getContractStartDate() != null) filled++; else missing.add("contractStartDate");
            if (isPresent(p.getLeiCode()) || isPresent(p.getEuid())) filled++; else missing.add("identifier");
            if (isPresent(p.getCriticality())) filled++; else missing.add("criticality");
            if (p.getHasExitStrategy() != null) filled++; else missing.add("hasExitStrategy");

            completedFields += filled;

            int pct = requiredFields.size() > 0 ? (filled * 100) / requiredFields.size() : 0;
            providerResults.add(new ProviderCompleteness(
                p.getId(), p.getProviderName(), pct, missing
            ));
        }

        int percentage = totalFields > 0 ? (completedFields * 100) / totalFields : 100;

        return new RoiCompletenessResult(
            providers.size(), completedFields, totalFields, percentage, providerResults
        );
    }

    // --- Helpers ---

    private void addCsvToZip(ZipOutputStream zos, String filename, List<String[]> rows) throws IOException {
        zos.putNextEntry(new ZipEntry(filename));
        zos.write(UTF8_BOM);
        OutputStreamWriter writer = new OutputStreamWriter(zos, StandardCharsets.UTF_8);
        for (String[] row : rows) {
            writer.write(Arrays.stream(row).map(this::escapeCsvField).collect(Collectors.joining(",")));
            writer.write("\r\n");
        }
        writer.flush();
        zos.closeEntry();
    }

    private String escapeCsvField(String value) {
        if (value == null || value.isEmpty()) return "\"\"";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String getProviderIdentifier(IctProviderEntity p) {
        if (isPresent(p.getLeiCode())) return p.getLeiCode();
        if (isPresent(p.getEuid())) return p.getEuid();
        return "GEN-" + p.getId().substring(0, Math.min(8, p.getId().length()));
    }

    private String mapServiceCategory(String serviceType) {
        if (serviceType == null) return "ICT_OTHER";
        return switch (serviceType.toLowerCase()) {
            case "cloud", "iaas", "paas", "saas" -> "CLOUD_SERVICES";
            case "hosting", "infrastructure" -> "ICT_INFRASTRUCTURE";
            case "software", "application" -> "SOFTWARE";
            case "network", "connectivity" -> "NETWORK_INFRASTRUCTURE";
            case "security", "cybersecurity" -> "SECURITY_SERVICES";
            case "data", "analytics", "database" -> "DATA_MANAGEMENT";
            case "payment", "payments" -> "PAYMENT_SERVICES";
            case "communication", "email" -> "COMMUNICATION";
            default -> "ICT_OTHER";
        };
    }

    private String mapFunctionType(String serviceType) {
        if (serviceType == null) return "OTHER_OPERATIONAL";
        return switch (serviceType.toLowerCase()) {
            case "cloud", "iaas", "paas", "saas", "hosting", "infrastructure" -> "ICT_OPERATIONS";
            case "security", "cybersecurity" -> "ICT_SECURITY";
            case "payment", "payments" -> "PAYMENT_PROCESSING";
            case "data", "analytics", "database" -> "DATA_PROCESSING";
            case "network", "connectivity" -> "NETWORK_OPERATIONS";
            default -> "OTHER_OPERATIONAL";
        };
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FMT) : "";
    }

    private boolean isPresent(String value) {
        return value != null && !value.trim().isEmpty();
    }

    // --- DTOs ---

    public record RoiCompletenessResult(
        int totalProviders,
        int completedFields,
        int totalFields,
        int percentage,
        List<ProviderCompleteness> providers
    ) {}

    public record ProviderCompleteness(
        String id,
        String name,
        int completeness,
        List<String> missingFields
    ) {}
}
