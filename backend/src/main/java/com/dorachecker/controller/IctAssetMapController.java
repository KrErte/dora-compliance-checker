package com.dorachecker.controller;

import com.dorachecker.service.IctAssetMapService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ict-asset-map")
public class IctAssetMapController {

    private final IctAssetMapService assetMapService;

    public IctAssetMapController(IctAssetMapService assetMapService) {
        this.assetMapService = assetMapService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    /**
     * Get the full dependency map: business functions -> ICT assets -> providers
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getDependencyMap(Authentication auth) {
        return ResponseEntity.ok(assetMapService.getDependencyMap(getUserId(auth)));
    }

    /**
     * Add a business function
     */
    @PostMapping("/functions")
    public ResponseEntity<Map<String, Object>> addFunction(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(assetMapService.addBusinessFunction(getUserId(auth), body));
    }

    /**
     * Add an ICT asset
     */
    @PostMapping("/assets")
    public ResponseEntity<Map<String, Object>> addAsset(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(assetMapService.addIctAsset(getUserId(auth), body));
    }

    /**
     * Link an asset to a function
     */
    @PostMapping("/links")
    public ResponseEntity<Map<String, Object>> addLink(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(assetMapService.addLink(getUserId(auth), body));
    }

    /**
     * Delete a business function
     */
    @DeleteMapping("/functions/{functionId}")
    public ResponseEntity<Map<String, Object>> deleteFunction(
            Authentication auth,
            @PathVariable String functionId) {
        return ResponseEntity.ok(assetMapService.deleteBusinessFunction(getUserId(auth), functionId));
    }

    /**
     * Delete an ICT asset
     */
    @DeleteMapping("/assets/{assetId}")
    public ResponseEntity<Map<String, Object>> deleteAsset(
            Authentication auth,
            @PathVariable String assetId) {
        return ResponseEntity.ok(assetMapService.deleteIctAsset(getUserId(auth), assetId));
    }

    /**
     * Remove a link
     */
    @DeleteMapping("/links/{linkId}")
    public ResponseEntity<Map<String, Object>> deleteLink(
            Authentication auth,
            @PathVariable String linkId) {
        return ResponseEntity.ok(assetMapService.deleteLink(getUserId(auth), linkId));
    }

    /**
     * Get risk analysis for the dependency map — single points of failure, concentration risks
     */
    @GetMapping("/risk-analysis")
    public ResponseEntity<Map<String, Object>> getRiskAnalysis(Authentication auth) {
        return ResponseEntity.ok(assetMapService.analyzeRisks(getUserId(auth)));
    }
}
