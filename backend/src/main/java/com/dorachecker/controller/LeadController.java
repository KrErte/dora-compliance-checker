package com.dorachecker.controller;

import com.dorachecker.model.LeadCompanyEntity;
import com.dorachecker.model.LeadCompanyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/leads")
@PreAuthorize("hasRole('ADMIN')")
public class LeadController {

    private final LeadCompanyRepository leadRepo;

    public LeadController(LeadCompanyRepository leadRepo) {
        this.leadRepo = leadRepo;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getLeads(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String licenseType,
            @RequestParam(required = false) String leadStatus,
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        // Normalize empty strings to null; pre-process search with lowercase + wildcards
        // to avoid Hibernate bytea cast issues with PostgreSQL LOWER()/CONCAT()
        String c = (country != null && !country.isEmpty()) ? country : null;
        String lt = (licenseType != null && !licenseType.isEmpty()) ? licenseType : null;
        String ls = (leadStatus != null && !leadStatus.isEmpty()) ? leadStatus : null;
        String s = (sector != null && !sector.isEmpty()) ? sector : null;
        String q = (search != null && !search.isEmpty()) ? "%" + search.toLowerCase() + "%" : null;
        Page<LeadCompanyEntity> result = leadRepo.findFiltered(
                c, lt, ls, s, q,
                PageRequest.of(page, size, sort));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", result.getContent());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadCompanyEntity> getLead(@PathVariable String id) {
        return leadRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeadCompanyEntity> updateLead(@PathVariable String id, @RequestBody LeadCompanyEntity updates) {
        return leadRepo.findById(id).map(lead -> {
            if (updates.getCompanyName() != null) lead.setCompanyName(updates.getCompanyName());
            if (updates.getRegistryCode() != null) lead.setRegistryCode(updates.getRegistryCode());
            if (updates.getCountry() != null) lead.setCountry(updates.getCountry());
            if (updates.getLicenseType() != null) lead.setLicenseType(updates.getLicenseType());
            if (updates.getRegulatoryBody() != null) lead.setRegulatoryBody(updates.getRegulatoryBody());
            if (updates.getWebsite() != null) lead.setWebsite(updates.getWebsite());
            if (updates.getEmail() != null) lead.setEmail(updates.getEmail());
            if (updates.getPhone() != null) lead.setPhone(updates.getPhone());
            if (updates.getAddress() != null) lead.setAddress(updates.getAddress());
            if (updates.getCity() != null) lead.setCity(updates.getCity());
            if (updates.getSector() != null) lead.setSector(updates.getSector());
            if (updates.getCompanySize() != null) lead.setCompanySize(updates.getCompanySize());
            if (updates.getLinkedinUrl() != null) lead.setLinkedinUrl(updates.getLinkedinUrl());
            if (updates.getCtoName() != null) lead.setCtoName(updates.getCtoName());
            if (updates.getCtoLinkedin() != null) lead.setCtoLinkedin(updates.getCtoLinkedin());
            if (updates.getComplianceOfficerName() != null) lead.setComplianceOfficerName(updates.getComplianceOfficerName());
            if (updates.getComplianceOfficerLinkedin() != null) lead.setComplianceOfficerLinkedin(updates.getComplianceOfficerLinkedin());
            if (updates.getLeadStatus() != null) lead.setLeadStatus(updates.getLeadStatus());
            if (updates.getNotes() != null) lead.setNotes(updates.getNotes());
            if (updates.getDoraApplicable() != null) lead.setDoraApplicable(updates.getDoraApplicable());
            if (updates.getNis2Applicable() != null) lead.setNis2Applicable(updates.getNis2Applicable());
            if (updates.getLastContactedAt() != null) lead.setLastContactedAt(updates.getLastContactedAt());
            return ResponseEntity.ok(leadRepo.save(lead));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String licenseType,
            @RequestParam(required = false) String leadStatus,
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) String search) {

        String c = (country != null && !country.isEmpty()) ? country : null;
        String lt = (licenseType != null && !licenseType.isEmpty()) ? licenseType : null;
        String ls = (leadStatus != null && !leadStatus.isEmpty()) ? leadStatus : null;
        String s = (sector != null && !sector.isEmpty()) ? sector : null;
        String q = (search != null && !search.isEmpty()) ? "%" + search.toLowerCase() + "%" : null;
        List<LeadCompanyEntity> leads = leadRepo.findAllFiltered(c, lt, ls, s, q);

        StringBuilder csv = new StringBuilder();
        csv.append("Company Name,Registry Code,Country,License Type,Regulatory Body,Website,Email,Phone,City,Sector,Company Size,LinkedIn,Lead Status,DORA Applicable,NIS2 Applicable,CTO Name,Compliance Officer,Notes,Source URL,Scraped At\n");

        for (LeadCompanyEntity l : leads) {
            csv.append(escapeCsv(l.getCompanyName())).append(',');
            csv.append(escapeCsv(l.getRegistryCode())).append(',');
            csv.append(escapeCsv(l.getCountry())).append(',');
            csv.append(escapeCsv(l.getLicenseType())).append(',');
            csv.append(escapeCsv(l.getRegulatoryBody())).append(',');
            csv.append(escapeCsv(l.getWebsite())).append(',');
            csv.append(escapeCsv(l.getEmail())).append(',');
            csv.append(escapeCsv(l.getPhone())).append(',');
            csv.append(escapeCsv(l.getCity())).append(',');
            csv.append(escapeCsv(l.getSector())).append(',');
            csv.append(escapeCsv(l.getCompanySize())).append(',');
            csv.append(escapeCsv(l.getLinkedinUrl())).append(',');
            csv.append(escapeCsv(l.getLeadStatus())).append(',');
            csv.append(l.getDoraApplicable() != null ? l.getDoraApplicable() : "").append(',');
            csv.append(l.getNis2Applicable() != null ? l.getNis2Applicable() : "").append(',');
            csv.append(escapeCsv(l.getCtoName())).append(',');
            csv.append(escapeCsv(l.getComplianceOfficerName())).append(',');
            csv.append(escapeCsv(l.getNotes())).append(',');
            csv.append(escapeCsv(l.getSourceUrl())).append(',');
            csv.append(l.getScrapedAt() != null ? l.getScrapedAt().toString() : "");
            csv.append('\n');
        }

        byte[] bytes = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=leads-export.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long total = leadRepo.count();
        long ee = leadRepo.countByCountry("EE");
        long lv = leadRepo.countByCountry("LV");
        long lt = leadRepo.countByCountry("LT");
        long statusNew = leadRepo.countByLeadStatus("NEW");
        long contacted = leadRepo.countByLeadStatus("CONTACTED");
        long qualified = leadRepo.countByLeadStatus("QUALIFIED");
        long converted = leadRepo.countByLeadStatus("CONVERTED");

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", total);
        stats.put("byCountry", Map.of("EE", ee, "LV", lv, "LT", lt));
        stats.put("byStatus", Map.of("NEW", statusNew, "CONTACTED", contacted,
                "QUALIFIED", qualified, "CONVERTED", converted));
        return ResponseEntity.ok(stats);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
