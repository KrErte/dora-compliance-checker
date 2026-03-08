package com.dorachecker.service;

import com.dorachecker.model.IctProviderEntity;
import com.dorachecker.model.IctProviderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IctAssetMapServiceTest {

    private static final String USER_ID = "test-user-1";

    @Mock
    private IctProviderRepository providerRepo;

    @InjectMocks
    private IctAssetMapService service;

    @Nested
    class AddBusinessFunction {

        @Test
        void addingFunction_returnsSuccessWithGeneratedId() {
            Map<String, Object> data = Map.of("name", "Payment Processing", "criticality", "CRITICAL");

            Map<String, Object> result = service.addBusinessFunction(USER_ID, data);

            assertThat(result.get("success")).isEqualTo(true);
            @SuppressWarnings("unchecked")
            Map<String, Object> func = (Map<String, Object>) result.get("function");
            assertThat(func.get("id")).asString().startsWith("func-");
            assertThat(func.get("name")).isEqualTo("Payment Processing");
            assertThat(func.get("criticality")).isEqualTo("CRITICAL");
            assertThat(func.get("type")).isEqualTo("function");
        }

        @Test
        void functionGetsDefaultCriticalityNormal_whenNotSpecified() {
            Map<String, Object> data = Map.of("name", "Reporting");

            Map<String, Object> result = service.addBusinessFunction(USER_ID, data);

            @SuppressWarnings("unchecked")
            Map<String, Object> func = (Map<String, Object>) result.get("function");
            assertThat(func.get("criticality")).isEqualTo("NORMAL");
        }

        @Test
        void multipleFunctionsCanBeAdded_forSameUser() {
            when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(Collections.emptyList());

            service.addBusinessFunction(USER_ID, Map.of("name", "Function A"));
            service.addBusinessFunction(USER_ID, Map.of("name", "Function B"));
            service.addBusinessFunction(USER_ID, Map.of("name", "Function C"));

            Map<String, Object> depMap = service.getDependencyMap(USER_ID);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> functions = (List<Map<String, Object>>) depMap.get("functions");
            assertThat(functions).hasSize(3);
        }
    }

    @Nested
    class AddIctAsset {

        @Test
        void addingAsset_returnsSuccessWithGeneratedId() {
            Map<String, Object> data = Map.of("name", "Core Banking System");

            Map<String, Object> result = service.addIctAsset(USER_ID, data);

            assertThat(result.get("success")).isEqualTo(true);
            @SuppressWarnings("unchecked")
            Map<String, Object> asset = (Map<String, Object>) result.get("asset");
            assertThat(asset.get("id")).asString().startsWith("asset-");
            assertThat(asset.get("name")).isEqualTo("Core Banking System");
            assertThat(asset.get("type")).isEqualTo("asset");
        }

        @Test
        void assetGetsDefaultTypeAndRtoRpo_whenNotSpecified() {
            Map<String, Object> data = Map.of("name", "Default Asset");

            Map<String, Object> result = service.addIctAsset(USER_ID, data);

            @SuppressWarnings("unchecked")
            Map<String, Object> asset = (Map<String, Object>) result.get("asset");
            assertThat(asset.get("assetType")).isEqualTo("APPLICATION");
            assertThat(asset.get("rtoHours")).isEqualTo(24);
            assertThat(asset.get("rpoHours")).isEqualTo(4);
        }

        @Test
        void customValues_arePreserved() {
            Map<String, Object> data = new HashMap<>();
            data.put("name", "Custom Asset");
            data.put("assetType", "INFRASTRUCTURE");
            data.put("rtoHours", 2);
            data.put("rpoHours", 1);
            data.put("description", "Mission-critical infrastructure");

            Map<String, Object> result = service.addIctAsset(USER_ID, data);

            @SuppressWarnings("unchecked")
            Map<String, Object> asset = (Map<String, Object>) result.get("asset");
            assertThat(asset.get("assetType")).isEqualTo("INFRASTRUCTURE");
            assertThat(asset.get("rtoHours")).isEqualTo(2);
            assertThat(asset.get("rpoHours")).isEqualTo(1);
            assertThat(asset.get("description")).isEqualTo("Mission-critical infrastructure");
        }
    }

    @Nested
    class AddLink {

        @Test
        void addingLink_returnsSuccess() {
            Map<String, Object> funcResult = service.addBusinessFunction(USER_ID, Map.of("name", "Test Func"));
            @SuppressWarnings("unchecked")
            String funcId = (String) ((Map<String, Object>) funcResult.get("function")).get("id");
            Map<String, Object> assetResult = service.addIctAsset(USER_ID, Map.of("name", "Test Asset"));
            @SuppressWarnings("unchecked")
            String assetId = (String) ((Map<String, Object>) assetResult.get("asset")).get("id");

            Map<String, Object> result = service.addLink(USER_ID, Map.of("sourceId", funcId, "targetId", assetId));

            assertThat(result.get("success")).isEqualTo(true);
            @SuppressWarnings("unchecked")
            Map<String, Object> link = (Map<String, Object>) result.get("link");
            assertThat(link.get("id")).asString().startsWith("link-");
        }

        @Test
        void linkHasCorrectSourceAndTargetIds() {
            Map<String, Object> funcResult = service.addBusinessFunction(USER_ID, Map.of("name", "Source Func"));
            @SuppressWarnings("unchecked")
            String funcId = (String) ((Map<String, Object>) funcResult.get("function")).get("id");
            Map<String, Object> assetResult = service.addIctAsset(USER_ID, Map.of("name", "Target Asset"));
            @SuppressWarnings("unchecked")
            String assetId = (String) ((Map<String, Object>) assetResult.get("asset")).get("id");

            Map<String, Object> result = service.addLink(USER_ID, Map.of(
                    "sourceId", funcId,
                    "targetId", assetId,
                    "label", "depends on"
            ));

            @SuppressWarnings("unchecked")
            Map<String, Object> link = (Map<String, Object>) result.get("link");
            assertThat(link.get("sourceId")).isEqualTo(funcId);
            assertThat(link.get("targetId")).isEqualTo(assetId);
            assertThat(link.get("label")).isEqualTo("depends on");
        }

        @Test
        void defaultDependency_isRequired() {
            Map<String, Object> funcResult = service.addBusinessFunction(USER_ID, Map.of("name", "Func A"));
            @SuppressWarnings("unchecked")
            String funcId = (String) ((Map<String, Object>) funcResult.get("function")).get("id");
            Map<String, Object> assetResult = service.addIctAsset(USER_ID, Map.of("name", "Asset B"));
            @SuppressWarnings("unchecked")
            String assetId = (String) ((Map<String, Object>) assetResult.get("asset")).get("id");

            Map<String, Object> result = service.addLink(USER_ID, Map.of("sourceId", funcId, "targetId", assetId));

            @SuppressWarnings("unchecked")
            Map<String, Object> link = (Map<String, Object>) result.get("link");
            assertThat(link.get("dependency")).isEqualTo("REQUIRED");
        }
    }

    @Nested
    class DeleteBusinessFunction {

        @Test
        void deletingFunction_removesItFromList() {
            when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(Collections.emptyList());

            Map<String, Object> addResult = service.addBusinessFunction(USER_ID,
                    Map.of("name", "To Be Deleted"));
            @SuppressWarnings("unchecked")
            String funcId = (String) ((Map<String, Object>) addResult.get("function")).get("id");

            service.deleteBusinessFunction(USER_ID, funcId);

            Map<String, Object> depMap = service.getDependencyMap(USER_ID);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> functions = (List<Map<String, Object>>) depMap.get("functions");
            assertThat(functions).isEmpty();
        }

        @Test
        void deletingFunction_alsoRemovesAssociatedLinks() {
            when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(Collections.emptyList());

            // Add function and asset
            Map<String, Object> funcResult = service.addBusinessFunction(USER_ID,
                    Map.of("name", "My Function"));
            @SuppressWarnings("unchecked")
            String funcId = (String) ((Map<String, Object>) funcResult.get("function")).get("id");

            Map<String, Object> assetResult = service.addIctAsset(USER_ID,
                    Map.of("name", "My Asset"));
            @SuppressWarnings("unchecked")
            String assetId = (String) ((Map<String, Object>) assetResult.get("asset")).get("id");

            // Add link between them
            service.addLink(USER_ID, Map.of("sourceId", funcId, "targetId", assetId));

            // Delete the function
            service.deleteBusinessFunction(USER_ID, funcId);

            Map<String, Object> depMap = service.getDependencyMap(USER_ID);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> links = (List<Map<String, Object>>) depMap.get("links");
            assertThat(links).isEmpty();

            // Asset should still exist
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> assets = (List<Map<String, Object>>) depMap.get("assets");
            assertThat(assets).hasSize(1);
        }

        @Test
        void deletingNonExistentFunction_doesNotError() {
            Map<String, Object> result = service.deleteBusinessFunction(USER_ID, "func-nonexistent");

            assertThat(result.get("success")).isEqualTo(true);
        }
    }

    @Nested
    class DeleteIctAsset {

        @Test
        void deletingAsset_removesIt() {
            when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(Collections.emptyList());

            Map<String, Object> addResult = service.addIctAsset(USER_ID,
                    Map.of("name", "Doomed Asset"));
            @SuppressWarnings("unchecked")
            String assetId = (String) ((Map<String, Object>) addResult.get("asset")).get("id");

            service.deleteIctAsset(USER_ID, assetId);

            Map<String, Object> depMap = service.getDependencyMap(USER_ID);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> assets = (List<Map<String, Object>>) depMap.get("assets");
            assertThat(assets).isEmpty();
        }

        @Test
        void deletingAsset_removesAssociatedLinks() {
            when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(Collections.emptyList());

            // Add function and asset
            Map<String, Object> funcResult = service.addBusinessFunction(USER_ID,
                    Map.of("name", "Core Function"));
            @SuppressWarnings("unchecked")
            String funcId = (String) ((Map<String, Object>) funcResult.get("function")).get("id");

            Map<String, Object> assetResult = service.addIctAsset(USER_ID,
                    Map.of("name", "Core Asset"));
            @SuppressWarnings("unchecked")
            String assetId = (String) ((Map<String, Object>) assetResult.get("asset")).get("id");

            // Add link
            service.addLink(USER_ID, Map.of("sourceId", funcId, "targetId", assetId));

            // Delete the asset
            service.deleteIctAsset(USER_ID, assetId);

            Map<String, Object> depMap = service.getDependencyMap(USER_ID);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> links = (List<Map<String, Object>>) depMap.get("links");
            assertThat(links).isEmpty();

            // Function should still exist
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> functions = (List<Map<String, Object>>) depMap.get("functions");
            assertThat(functions).hasSize(1);
        }
    }

    @Nested
    class DeleteLink {

        @Test
        void deletingLink_removesOnlyThatLink() {
            when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(Collections.emptyList());

            // Create actual nodes
            Map<String, Object> funcAResult = service.addBusinessFunction(USER_ID, Map.of("name", "Func A"));
            @SuppressWarnings("unchecked")
            String funcAId = (String) ((Map<String, Object>) funcAResult.get("function")).get("id");
            Map<String, Object> assetBResult = service.addIctAsset(USER_ID, Map.of("name", "Asset B"));
            @SuppressWarnings("unchecked")
            String assetBId = (String) ((Map<String, Object>) assetBResult.get("asset")).get("id");

            Map<String, Object> funcCResult = service.addBusinessFunction(USER_ID, Map.of("name", "Func C"));
            @SuppressWarnings("unchecked")
            String funcCId = (String) ((Map<String, Object>) funcCResult.get("function")).get("id");
            Map<String, Object> assetDResult = service.addIctAsset(USER_ID, Map.of("name", "Asset D"));
            @SuppressWarnings("unchecked")
            String assetDId = (String) ((Map<String, Object>) assetDResult.get("asset")).get("id");

            // Add two links
            Map<String, Object> link1Result = service.addLink(USER_ID,
                    Map.of("sourceId", funcAId, "targetId", assetBId));
            @SuppressWarnings("unchecked")
            String link1Id = (String) ((Map<String, Object>) link1Result.get("link")).get("id");

            service.addLink(USER_ID, Map.of("sourceId", funcCId, "targetId", assetDId));

            // Delete only the first link
            Map<String, Object> result = service.deleteLink(USER_ID, link1Id);
            assertThat(result.get("success")).isEqualTo(true);

            Map<String, Object> depMap = service.getDependencyMap(USER_ID);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> links = (List<Map<String, Object>>) depMap.get("links");
            assertThat(links).hasSize(1);
            assertThat(links.get(0).get("sourceId")).isEqualTo(funcCId);
        }
    }

    @Nested
    class GetDependencyMap {

        @Test
        void returnsFunctionsAssetsProvidersLinksAndStats() {
            when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(Collections.emptyList());

            service.addBusinessFunction(USER_ID, Map.of("name", "Func1"));
            service.addIctAsset(USER_ID, Map.of("name", "Asset1"));

            Map<String, Object> depMap = service.getDependencyMap(USER_ID);

            assertThat(depMap).containsKeys("functions", "assets", "providers", "links", "stats");
        }

        @Test
        void includesIctProvidersFromDatabase() {
            IctProviderEntity provider = new IctProviderEntity();
            provider.setId("prov-1");
            provider.setProviderName("CloudCorp");
            provider.setServiceType("CLOUD");
            provider.setCriticality("HIGH");
            provider.setProviderCountry("DE");
            provider.setRiskScore(75);

            when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(provider));

            Map<String, Object> depMap = service.getDependencyMap(USER_ID);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> providers = (List<Map<String, Object>>) depMap.get("providers");
            assertThat(providers).hasSize(1);
            assertThat(providers.get(0).get("id")).isEqualTo("provider-prov-1");
            assertThat(providers.get(0).get("name")).isEqualTo("CloudCorp");
            assertThat(providers.get(0).get("type")).isEqualTo("provider");
            assertThat(providers.get(0).get("serviceType")).isEqualTo("CLOUD");
            assertThat(providers.get(0).get("criticality")).isEqualTo("HIGH");
            assertThat(providers.get(0).get("country")).isEqualTo("DE");
            assertThat(providers.get(0).get("riskScore")).isEqualTo(75);
        }

        @Test
        void statsCalculateCorrectly() {
            IctProviderEntity provider = new IctProviderEntity();
            provider.setId("prov-1");
            provider.setProviderName("Provider1");
            provider.setServiceType("SaaS");
            provider.setCriticality("MEDIUM");
            provider.setProviderCountry("NL");
            provider.setRiskScore(50);

            when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(provider));

            Map<String, Object> func1Result = service.addBusinessFunction(USER_ID, Map.of("name", "Func1", "criticality", "CRITICAL"));
            @SuppressWarnings("unchecked")
            String func1Id = (String) ((Map<String, Object>) func1Result.get("function")).get("id");
            service.addBusinessFunction(USER_ID, Map.of("name", "Func2", "criticality", "NORMAL"));
            Map<String, Object> asset1Result = service.addIctAsset(USER_ID, Map.of("name", "Asset1"));
            @SuppressWarnings("unchecked")
            String asset1Id = (String) ((Map<String, Object>) asset1Result.get("asset")).get("id");
            service.addIctAsset(USER_ID, Map.of("name", "Asset2"));
            service.addIctAsset(USER_ID, Map.of("name", "Asset3"));
            service.addLink(USER_ID, Map.of("sourceId", func1Id, "targetId", asset1Id));

            Map<String, Object> depMap = service.getDependencyMap(USER_ID);
            @SuppressWarnings("unchecked")
            Map<String, Object> stats = (Map<String, Object>) depMap.get("stats");

            assertThat(stats.get("totalFunctions")).isEqualTo(2);
            assertThat(stats.get("totalAssets")).isEqualTo(3);
            assertThat(stats.get("totalProviders")).isEqualTo(1);
            assertThat(stats.get("totalLinks")).isEqualTo(1);
            assertThat(stats.get("criticalFunctions")).isEqualTo(1L);
        }

        @Test
        void emptyMap_returnsZeroStats() {
            when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(Collections.emptyList());

            Map<String, Object> depMap = service.getDependencyMap(USER_ID);
            @SuppressWarnings("unchecked")
            Map<String, Object> stats = (Map<String, Object>) depMap.get("stats");

            assertThat(stats.get("totalFunctions")).isEqualTo(0);
            assertThat(stats.get("totalAssets")).isEqualTo(0);
            assertThat(stats.get("totalProviders")).isEqualTo(0);
            assertThat(stats.get("totalLinks")).isEqualTo(0);
            assertThat(stats.get("criticalFunctions")).isEqualTo(0L);
        }
    }

    @Nested
    class AnalyzeRisks {

        @BeforeEach
        void setUp() {
            lenient().when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(Collections.emptyList());
        }

        @Test
        void unmappedCriticalFunction_detectedAsHighSeverity() {
            service.addBusinessFunction(USER_ID,
                    Map.of("name", "Critical Payments", "criticality", "CRITICAL"));

            Map<String, Object> risks = service.analyzeRisks(USER_ID);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> unmapped = (List<Map<String, Object>>) risks.get("unmappedFunctions");
            assertThat(unmapped).hasSize(1);
            assertThat(unmapped.get(0).get("function")).isEqualTo("Critical Payments");
            assertThat(unmapped.get(0).get("severity")).isEqualTo("HIGH");
            assertThat(unmapped.get(0).get("risk")).asString().contains("No ICT assets mapped");
        }

        @Test
        void unmappedNormalFunction_detectedAsMediumSeverity() {
            service.addBusinessFunction(USER_ID,
                    Map.of("name", "Internal Reporting", "criticality", "NORMAL"));

            Map<String, Object> risks = service.analyzeRisks(USER_ID);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> unmapped = (List<Map<String, Object>>) risks.get("unmappedFunctions");
            assertThat(unmapped).hasSize(1);
            assertThat(unmapped.get(0).get("severity")).isEqualTo("MEDIUM");
        }

        @Test
        void singlePointOfFailure_detectedForCriticalFunctionWithOneLink() {
            // Add a critical function
            Map<String, Object> funcResult = service.addBusinessFunction(USER_ID,
                    Map.of("name", "Core Trading", "criticality", "CRITICAL"));
            @SuppressWarnings("unchecked")
            String funcId = (String) ((Map<String, Object>) funcResult.get("function")).get("id");

            // Add an asset
            Map<String, Object> assetResult = service.addIctAsset(USER_ID,
                    Map.of("name", "Trading Platform"));
            @SuppressWarnings("unchecked")
            String assetId = (String) ((Map<String, Object>) assetResult.get("asset")).get("id");

            // Link them (only one link = single point of failure)
            service.addLink(USER_ID, Map.of("sourceId", funcId, "targetId", assetId));

            Map<String, Object> risks = service.analyzeRisks(USER_ID);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> spof = (List<Map<String, Object>>) risks.get("singlePointsOfFailure");
            assertThat(spof).hasSize(1);
            assertThat(spof.get(0).get("function")).isEqualTo("Core Trading");
            assertThat(spof.get(0).get("severity")).isEqualTo("HIGH");
            assertThat(spof.get(0).get("risk")).asString().contains("Single point of failure");

            // Should NOT appear in unmapped
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> unmapped = (List<Map<String, Object>>) risks.get("unmappedFunctions");
            assertThat(unmapped).isEmpty();
        }

        @Test
        void concentrationRisk_detectedWhenThreeOrMoreDependenciesOnSameProvider() {
            IctProviderEntity provider = new IctProviderEntity();
            provider.setId("prov-aws");
            provider.setProviderName("AWS");
            provider.setServiceType("CLOUD");
            provider.setCriticality("CRITICAL");
            provider.setProviderCountry("US");
            provider.setRiskScore(80);

            when(providerRepo.findByUserIdOrderByCreatedAtDesc(USER_ID))
                    .thenReturn(List.of(provider));

            String providerNodeId = "provider-prov-aws";

            // Create 3 functions as source nodes
            Map<String, Object> f1 = service.addBusinessFunction(USER_ID, Map.of("name", "Func 1"));
            @SuppressWarnings("unchecked")
            String f1Id = (String) ((Map<String, Object>) f1.get("function")).get("id");
            Map<String, Object> f2 = service.addBusinessFunction(USER_ID, Map.of("name", "Func 2"));
            @SuppressWarnings("unchecked")
            String f2Id = (String) ((Map<String, Object>) f2.get("function")).get("id");
            Map<String, Object> f3 = service.addBusinessFunction(USER_ID, Map.of("name", "Func 3"));
            @SuppressWarnings("unchecked")
            String f3Id = (String) ((Map<String, Object>) f3.get("function")).get("id");

            // Create 3 links targeting the same provider
            service.addLink(USER_ID, Map.of("sourceId", f1Id, "targetId", providerNodeId));
            service.addLink(USER_ID, Map.of("sourceId", f2Id, "targetId", providerNodeId));
            service.addLink(USER_ID, Map.of("sourceId", f3Id, "targetId", providerNodeId));

            Map<String, Object> risks = service.analyzeRisks(USER_ID);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> concentration =
                    (List<Map<String, Object>>) risks.get("concentrationRisks");
            assertThat(concentration).hasSize(1);
            assertThat(concentration.get(0).get("provider")).isEqualTo("AWS");
            assertThat(concentration.get(0).get("dependencyCount")).isEqualTo(3);
            assertThat(concentration.get(0).get("severity")).isEqualTo("HIGH");
        }

        @Test
        void riskLevelCritical_whenThreeOrMoreHighCriticalIssues() {
            // Create 3 critical functions each with single point of failure
            for (int i = 1; i <= 3; i++) {
                Map<String, Object> funcResult = service.addBusinessFunction(USER_ID,
                        Map.of("name", "Critical Func " + i, "criticality", "CRITICAL"));
                @SuppressWarnings("unchecked")
                String funcId = (String) ((Map<String, Object>) funcResult.get("function")).get("id");

                Map<String, Object> assetResult = service.addIctAsset(USER_ID,
                        Map.of("name", "Asset " + i));
                @SuppressWarnings("unchecked")
                String assetId = (String) ((Map<String, Object>) assetResult.get("asset")).get("id");

                service.addLink(USER_ID, Map.of("sourceId", funcId, "targetId", assetId));
            }

            Map<String, Object> risks = service.analyzeRisks(USER_ID);

            assertThat(risks.get("riskLevel")).isEqualTo("CRITICAL");
        }

        @Test
        void riskLevelLow_whenNoIssues() {
            // Add a NORMAL function with two links (not critical, not single point of failure)
            Map<String, Object> funcResult = service.addBusinessFunction(USER_ID,
                    Map.of("name", "Standard Function", "criticality", "NORMAL"));
            @SuppressWarnings("unchecked")
            String funcId = (String) ((Map<String, Object>) funcResult.get("function")).get("id");

            Map<String, Object> asset1Result = service.addIctAsset(USER_ID,
                    Map.of("name", "Asset A"));
            @SuppressWarnings("unchecked")
            String asset1Id = (String) ((Map<String, Object>) asset1Result.get("asset")).get("id");

            Map<String, Object> asset2Result = service.addIctAsset(USER_ID,
                    Map.of("name", "Asset B"));
            @SuppressWarnings("unchecked")
            String asset2Id = (String) ((Map<String, Object>) asset2Result.get("asset")).get("id");

            service.addLink(USER_ID, Map.of("sourceId", funcId, "targetId", asset1Id));
            service.addLink(USER_ID, Map.of("sourceId", funcId, "targetId", asset2Id));

            Map<String, Object> risks = service.analyzeRisks(USER_ID);

            assertThat(risks.get("riskLevel")).isEqualTo("LOW");
            assertThat(risks.get("totalRisks")).isEqualTo(0);
        }

        @Test
        void noFalsePositives_whenEverythingIsProperlyMapped() {
            // Add a CRITICAL function with 2 supporting assets (no SPOF)
            Map<String, Object> funcResult = service.addBusinessFunction(USER_ID,
                    Map.of("name", "Well-Mapped Function", "criticality", "CRITICAL"));
            @SuppressWarnings("unchecked")
            String funcId = (String) ((Map<String, Object>) funcResult.get("function")).get("id");

            Map<String, Object> asset1Result = service.addIctAsset(USER_ID,
                    Map.of("name", "Primary System"));
            @SuppressWarnings("unchecked")
            String asset1Id = (String) ((Map<String, Object>) asset1Result.get("asset")).get("id");

            Map<String, Object> asset2Result = service.addIctAsset(USER_ID,
                    Map.of("name", "Backup System"));
            @SuppressWarnings("unchecked")
            String asset2Id = (String) ((Map<String, Object>) asset2Result.get("asset")).get("id");

            // Two links so it is not a single point of failure
            service.addLink(USER_ID, Map.of("sourceId", funcId, "targetId", asset1Id));
            service.addLink(USER_ID, Map.of("sourceId", funcId, "targetId", asset2Id));

            Map<String, Object> risks = service.analyzeRisks(USER_ID);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> spof = (List<Map<String, Object>>) risks.get("singlePointsOfFailure");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> concentration =
                    (List<Map<String, Object>>) risks.get("concentrationRisks");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> unmapped = (List<Map<String, Object>>) risks.get("unmappedFunctions");

            assertThat(spof).isEmpty();
            assertThat(concentration).isEmpty();
            assertThat(unmapped).isEmpty();
            assertThat(risks.get("totalRisks")).isEqualTo(0);
            assertThat(risks.get("riskLevel")).isEqualTo("LOW");
        }
    }
}
