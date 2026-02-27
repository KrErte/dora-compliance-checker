package com.dorachecker.controller;

import com.dorachecker.model.RoiRegisterEntity;
import com.dorachecker.service.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roi")
public class RoiController {

    private final RoiService roiService;
    private final RoiValidationService validationService;
    private final RoiExportService exportService;
    private final GleifService gleifService;

    public RoiController(RoiService roiService, RoiValidationService validationService,
                          RoiExportService exportService, GleifService gleifService) {
        this.roiService = roiService;
        this.validationService = validationService;
        this.exportService = exportService;
        this.gleifService = gleifService;
    }

    // ── Register CRUD ──

    @PostMapping("/registers")
    public ResponseEntity<?> createRegister(@RequestBody Map<String, Object> data, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        RoiRegisterEntity register = roiService.createRegister(userId, data);
        return ResponseEntity.ok(register);
    }

    @GetMapping("/registers")
    public ResponseEntity<List<RoiRegisterEntity>> getRegisters(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(roiService.getUserRegisters(userId));
    }

    @GetMapping("/registers/{id}")
    public ResponseEntity<?> getRegister(@PathVariable String id, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(register);
    }

    @PutMapping("/registers/{id}")
    public ResponseEntity<?> updateRegister(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.updateRegister(id, data));
    }

    // ── B_01.02 Group Entities ──

    @PostMapping("/registers/{id}/entities")
    public ResponseEntity<?> addGroupEntity(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addGroupEntity(id, data));
    }

    @DeleteMapping("/registers/{id}/entities/{entryId}")
    public ResponseEntity<?> removeGroupEntity(@PathVariable String id, @PathVariable String entryId, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        roiService.removeGroupEntity(id, entryId);
        return ResponseEntity.ok().build();
    }

    // ── B_01.03 Branches ──

    @PostMapping("/registers/{id}/branches")
    public ResponseEntity<?> addBranch(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addBranch(id, data));
    }

    @DeleteMapping("/registers/{id}/branches/{branchId}")
    public ResponseEntity<?> removeBranch(@PathVariable String id, @PathVariable String branchId, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        roiService.removeBranch(id, branchId);
        return ResponseEntity.ok().build();
    }

    // ── B_05.01 Providers ──

    @PostMapping("/registers/{id}/providers")
    public ResponseEntity<?> addProvider(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addProvider(id, data));
    }

    @DeleteMapping("/registers/{id}/providers/{providerId}")
    public ResponseEntity<?> removeProvider(@PathVariable String id, @PathVariable String providerId, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        roiService.removeProvider(id, providerId);
        return ResponseEntity.ok().build();
    }

    // ── B_05.02 Supply Chains ──

    @PostMapping("/registers/{id}/supply-chains")
    public ResponseEntity<?> addSupplyChain(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addSupplyChain(id, data));
    }

    @DeleteMapping("/registers/{id}/supply-chains/{scId}")
    public ResponseEntity<?> removeSupplyChain(@PathVariable String id, @PathVariable String scId, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        roiService.removeSupplyChain(id, scId);
        return ResponseEntity.ok().build();
    }

    // ── B_06.01 Functions ──

    @PostMapping("/registers/{id}/functions")
    public ResponseEntity<?> addFunction(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addFunction(id, data));
    }

    @DeleteMapping("/registers/{id}/functions/{funcId}")
    public ResponseEntity<?> removeFunction(@PathVariable String id, @PathVariable String funcId, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        roiService.removeFunction(id, funcId);
        return ResponseEntity.ok().build();
    }

    // ── B_02.01 Contracts ──

    @PostMapping("/registers/{id}/contracts")
    public ResponseEntity<?> addContract(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addContract(id, data));
    }

    @DeleteMapping("/registers/{id}/contracts/{contractId}")
    public ResponseEntity<?> removeContract(@PathVariable String id, @PathVariable String contractId, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        roiService.removeContract(id, contractId);
        return ResponseEntity.ok().build();
    }

    // ── B_02.02 Contract Details ──

    @PostMapping("/registers/{id}/contract-details")
    public ResponseEntity<?> addContractDetail(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addContractDetail(id, data));
    }

    @DeleteMapping("/registers/{id}/contract-details/{detailId}")
    public ResponseEntity<?> removeContractDetail(@PathVariable String id, @PathVariable String detailId, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        roiService.removeContractDetail(id, detailId);
        return ResponseEntity.ok().build();
    }

    // ── B_02.03 Intra-group Contracts ──

    @PostMapping("/registers/{id}/intra-group")
    public ResponseEntity<?> addIntraGroupContract(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addIntraGroupContract(id, data));
    }

    // ── B_03.x / B_04.x Linking ──

    @PostMapping("/registers/{id}/recipients")
    public ResponseEntity<?> addRecipient(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addRecipient(id, data));
    }

    @PostMapping("/registers/{id}/provider-signings")
    public ResponseEntity<?> addProviderSigning(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addProviderSigning(id, data));
    }

    @PostMapping("/registers/{id}/internal-providers")
    public ResponseEntity<?> addInternalProvider(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addInternalProvider(id, data));
    }

    @PostMapping("/registers/{id}/service-users")
    public ResponseEntity<?> addServiceUser(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addServiceUser(id, data));
    }

    @PostMapping("/registers/{id}/auto-fill-linking")
    public ResponseEntity<?> autoFillLinking(@PathVariable String id, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.autoFillLinking(id));
    }

    // ── B_07.01 Assessments ──

    @PostMapping("/registers/{id}/assessments")
    public ResponseEntity<?> addAssessment(@PathVariable String id, @RequestBody Map<String, Object> data, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(roiService.addAssessment(id, data));
    }

    @DeleteMapping("/registers/{id}/assessments/{assessmentId}")
    public ResponseEntity<?> removeAssessment(@PathVariable String id, @PathVariable String assessmentId, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        roiService.removeAssessment(id, assessmentId);
        return ResponseEntity.ok().build();
    }

    // ── Validation ──

    @PostMapping("/registers/{id}/validate")
    public ResponseEntity<?> validate(@PathVariable String id, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        RoiValidationService.ValidationResult result = validationService.validate(register);
        return ResponseEntity.ok(result);
    }

    // ── Exports ──

    @PostMapping("/registers/{id}/export/csv")
    public ResponseEntity<byte[]> exportXbrlCsv(@PathVariable String id, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        try {
            byte[] zip = exportService.exportXbrlCsvZip(register);
            String lei = register.getEntityLei() != null ? register.getEntityLei() : "UNKNOWN";
            String fileName = lei + "." + register.getConsolidationScope().name() + "_" + register.getCountry() + "_DORA010100_DORA_" + LocalDate.now() + ".zip";
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zip);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/registers/{id}/export/excel")
    public ResponseEntity<byte[]> exportExcel(@PathVariable String id, Authentication auth) {
        RoiRegisterEntity register = roiService.getRegister(id);
        if (register == null) return ResponseEntity.notFound().build();
        if (!register.getUserId().equals(auth.getPrincipal())) return ResponseEntity.status(403).build();
        try {
            byte[] excel = exportService.exportExcel(register);
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"RoI_" + register.getEntityName() + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── GLEIF LEI Lookup ──

    @GetMapping("/gleif/{lei}")
    public ResponseEntity<?> lookupLei(@PathVariable String lei) {
        return ResponseEntity.ok(gleifService.lookupLei(lei));
    }

    @GetMapping("/gleif/search")
    public ResponseEntity<?> searchLei(@RequestParam String name) {
        return ResponseEntity.ok(gleifService.searchByName(name));
    }
}
