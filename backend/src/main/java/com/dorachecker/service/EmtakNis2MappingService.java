package com.dorachecker.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Optional;

@Service
public class EmtakNis2MappingService {

    public enum AnnexType {
        ANNEX_I,
        ANNEX_II,
        NOT_APPLICABLE
    }

    public record Nis2SectorMapping(
        String sectorCode,
        String sectorNameEn,
        String sectorNameEt,
        AnnexType annexType
    ) {}

    private static final Map<String, Nis2SectorMapping> EMTAK_MAPPINGS = Map.ofEntries(
        // ANNEX_I (Essential)
        Map.entry("35", new Nis2SectorMapping("energy", "Energy", "Energia", AnnexType.ANNEX_I)),
        Map.entry("49", new Nis2SectorMapping("transport", "Transport", "Transport", AnnexType.ANNEX_I)),
        Map.entry("50", new Nis2SectorMapping("transport", "Transport", "Transport", AnnexType.ANNEX_I)),
        Map.entry("51", new Nis2SectorMapping("transport", "Transport", "Transport", AnnexType.ANNEX_I)),
        Map.entry("64", new Nis2SectorMapping("banking", "Banking", "Pangandus", AnnexType.ANNEX_I)),
        Map.entry("65", new Nis2SectorMapping("financial_infra", "Financial Market Infrastructure", "Finantsturu infrastruktuurid", AnnexType.ANNEX_I)),
        Map.entry("66", new Nis2SectorMapping("financial_infra", "Financial Market Infrastructure", "Finantsturu infrastruktuurid", AnnexType.ANNEX_I)),
        Map.entry("86", new Nis2SectorMapping("health", "Health", "Tervishoid", AnnexType.ANNEX_I)),
        Map.entry("36", new Nis2SectorMapping("drinking_water", "Drinking Water", "Joogivesi", AnnexType.ANNEX_I)),
        Map.entry("37", new Nis2SectorMapping("wastewater", "Wastewater", "Reovesi", AnnexType.ANNEX_I)),
        Map.entry("61", new Nis2SectorMapping("digital_infra", "Digital Infrastructure", "Digitaalne infrastruktuur", AnnexType.ANNEX_I)),
        Map.entry("62", new Nis2SectorMapping("ict_b2b", "ICT Service Management (B2B)", "IKT-teenuste haldamine (B2B)", AnnexType.ANNEX_I)),
        Map.entry("63", new Nis2SectorMapping("ict_b2b", "ICT Service Management (B2B)", "IKT-teenuste haldamine (B2B)", AnnexType.ANNEX_I)),
        Map.entry("84", new Nis2SectorMapping("public_admin", "Public Administration", "Avalik haldus", AnnexType.ANNEX_I)),

        // ANNEX_II (Important)
        Map.entry("53", new Nis2SectorMapping("postal", "Postal and Courier Services", "Posti- ja kullerteenused", AnnexType.ANNEX_II)),
        Map.entry("38", new Nis2SectorMapping("waste", "Waste Management", "Jaatmekaitlus", AnnexType.ANNEX_II)),
        Map.entry("20", new Nis2SectorMapping("chemicals", "Chemicals", "Kemikaalid", AnnexType.ANNEX_II)),
        Map.entry("21", new Nis2SectorMapping("chemicals", "Chemicals", "Kemikaalid", AnnexType.ANNEX_II)),
        Map.entry("10", new Nis2SectorMapping("food", "Food Production", "Toidutootmine", AnnexType.ANNEX_II)),
        Map.entry("11", new Nis2SectorMapping("food", "Food Production", "Toidutootmine", AnnexType.ANNEX_II)),
        Map.entry("12", new Nis2SectorMapping("food", "Food Production", "Toidutootmine", AnnexType.ANNEX_II)),
        Map.entry("25", new Nis2SectorMapping("manufacturing", "Manufacturing", "Tootmine", AnnexType.ANNEX_II)),
        Map.entry("26", new Nis2SectorMapping("manufacturing", "Manufacturing", "Tootmine", AnnexType.ANNEX_II)),
        Map.entry("27", new Nis2SectorMapping("manufacturing", "Manufacturing", "Tootmine", AnnexType.ANNEX_II)),
        Map.entry("28", new Nis2SectorMapping("manufacturing", "Manufacturing", "Tootmine", AnnexType.ANNEX_II)),
        Map.entry("29", new Nis2SectorMapping("manufacturing", "Manufacturing", "Tootmine", AnnexType.ANNEX_II)),
        Map.entry("30", new Nis2SectorMapping("manufacturing", "Manufacturing", "Tootmine", AnnexType.ANNEX_II)),
        Map.entry("31", new Nis2SectorMapping("manufacturing", "Manufacturing", "Tootmine", AnnexType.ANNEX_II)),
        Map.entry("32", new Nis2SectorMapping("manufacturing", "Manufacturing", "Tootmine", AnnexType.ANNEX_II)),
        Map.entry("33", new Nis2SectorMapping("manufacturing", "Manufacturing", "Tootmine", AnnexType.ANNEX_II)),
        Map.entry("72", new Nis2SectorMapping("research", "Research", "Teadusuuringud", AnnexType.ANNEX_II))
    );

    public Optional<Nis2SectorMapping> mapEmtakToNis2(String emtakCode) {
        if (emtakCode == null || emtakCode.length() < 2) {
            return Optional.empty();
        }

        // Special case: 51.22 is Space (ANNEX_I)
        if (emtakCode.startsWith("51.22")) {
            return Optional.of(new Nis2SectorMapping("space", "Space", "Kosmos", AnnexType.ANNEX_I));
        }

        // Get first 2 digits (handle both "35" and "35.11" formats)
        String prefix = emtakCode.substring(0, 2);
        return Optional.ofNullable(EMTAK_MAPPINGS.get(prefix));
    }
}
