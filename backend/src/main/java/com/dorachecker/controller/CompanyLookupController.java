package com.dorachecker.controller;

import com.dorachecker.service.EmtakNis2MappingService;
import com.dorachecker.service.EmtakNis2MappingService.Nis2SectorMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CompanyLookupController {

    private final EmtakNis2MappingService emtakService;

    public CompanyLookupController(EmtakNis2MappingService emtakService) {
        this.emtakService = emtakService;
    }

    public record Nis2SectorDto(
        String sectorCode,
        String sectorNameEn,
        String sectorNameEt,
        String annexType
    ) {}

    public record CompanyInfoDto(
        String registryCode,
        String name,
        String emtakCode,
        String emtakNameEt,
        String emtakNameEn,
        String nis2SectorCode,
        String annexType,
        int employeeCount,
        long revenue,
        long balanceSheet,
        String dataSource
    ) {}

    private record MockCompany(
        String registryCode,
        String name,
        String emtakCode,
        String emtakNameEt,
        String emtakNameEn,
        int employeeCount,
        long revenue,
        long balanceSheet
    ) {}

    private static final Map<String, MockCompany> MOCK_COMPANIES = Map.of(
        "10000001", new MockCompany("10000001", "Eesti Energia AS", "35.11", "Elektrienergia tootmine", "Electric power generation", 5800, 1_200_000_000L, 3_500_000_000L),
        "10060701", new MockCompany("10060701", "Bolt Technology OU", "62.01", "Programmeerimine", "Computer programming", 4000, 600_000_000L, 400_000_000L),
        "10223402", new MockCompany("10223402", "Wise Payments Ltd", "64.19", "Muu rahaline vahendustegevus", "Other monetary intermediation", 3500, 850_000_000L, 2_000_000_000L),
        "10421629", new MockCompany("10421629", "Omniva AS", "53.10", "Postiteenistus uldkohustusega", "Postal activities under universal service obligation", 2400, 140_000_000L, 95_000_000L),
        "12345678", new MockCompany("12345678", "Vaike OU", "62.01", "Programmeerimine", "Computer programming", 8, 250_000L, 100_000L),
        "11066801", new MockCompany("11066801", "Tallinna Vesi AS", "36.00", "Vee kogumine, tootlemine ja jaotamine", "Water collection, treatment and supply", 320, 65_000_000L, 240_000_000L)
    );

    @GetMapping("/emtak/{code}/nis2-sector")
    public ResponseEntity<Nis2SectorDto> getEmtakNis2Mapping(@PathVariable String code) {
        return emtakService.mapEmtakToNis2(code)
            .map(mapping -> ResponseEntity.ok(new Nis2SectorDto(
                mapping.sectorCode(),
                mapping.sectorNameEn(),
                mapping.sectorNameEt(),
                mapping.annexType().name()
            )))
            .orElse(ResponseEntity.ok(new Nis2SectorDto(
                null, null, null, "NOT_APPLICABLE"
            )));
    }

    @GetMapping("/company/{registryCode}")
    public ResponseEntity<CompanyInfoDto> lookupCompany(@PathVariable String registryCode) {
        if (!registryCode.matches("\\d{8}")) {
            return ResponseEntity.badRequest().build();
        }

        MockCompany company = MOCK_COMPANIES.get(registryCode);
        if (company == null) {
            return ResponseEntity.notFound().build();
        }

        Optional<Nis2SectorMapping> sectorMapping = emtakService.mapEmtakToNis2(company.emtakCode());
        String nis2SectorCode = sectorMapping.map(Nis2SectorMapping::sectorCode).orElse(null);
        String annexType = sectorMapping.map(m -> m.annexType().name()).orElse("NOT_APPLICABLE");

        return ResponseEntity.ok(new CompanyInfoDto(
            company.registryCode(),
            company.name(),
            company.emtakCode(),
            company.emtakNameEt(),
            company.emtakNameEn(),
            nis2SectorCode,
            annexType,
            company.employeeCount(),
            company.revenue(),
            company.balanceSheet(),
            "E-Business Register (mock data)"
        ));
    }
}
