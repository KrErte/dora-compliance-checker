package com.dorachecker.controller;

import com.dorachecker.model.GlobalIctProviderEntity;
import com.dorachecker.model.GlobalIctProviderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Alternative endpoint for ICT provider search
 * Maps /api/ict-providers/search as specified in DORA API docs
 */
@RestController
@RequestMapping("/api/ict-providers")
@CrossOrigin(origins = "*")
public class IctProviderSearchController {

    private final GlobalIctProviderRepository repository;

    public IctProviderSearchController(GlobalIctProviderRepository repository) {
        this.repository = repository;
    }

    /**
     * GET /api/ict-providers/search?q=nortal&country=EE&type=IT_CONSULTING
     * Case-insensitive, partial match, max 20 results
     * Sorted: is_ctpp DESC, name ASC
     */
    @GetMapping("/search")
    public ResponseEntity<List<GlobalIctProviderEntity>> search(
            @RequestParam String q,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String type) {

        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }

        List<GlobalIctProviderEntity> results = repository.searchProviders(
            q.trim(),
            country != null && !country.isBlank() ? country : null,
            type != null && !type.isBlank() ? type : null
        );

        return ResponseEntity.ok(results);
    }
}
