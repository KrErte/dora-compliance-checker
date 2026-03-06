package com.dorachecker.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Static database of DORA article sub-requirements for Evidence Gap Analysis.
 * Covers 10 articles across all 5 DORA pillars (~45 requirements total).
 */
public final class DoraArticleRequirements {

    private DoraArticleRequirements() {}

    public static final List<Requirement> ALL_REQUIREMENTS = buildRequirements();

    public static List<Requirement> getByArticles(List<String> articleNumbers) {
        return ALL_REQUIREMENTS.stream()
                .filter(r -> articleNumbers.contains(r.articleNumber()))
                .collect(Collectors.toList());
    }

    public static Map<String, List<Requirement>> groupByArticle(List<String> articleNumbers) {
        return getByArticles(articleNumbers).stream()
                .collect(Collectors.groupingBy(Requirement::articleNumber));
    }

    public static List<String> getSupportedArticles() {
        return ALL_REQUIREMENTS.stream()
                .map(Requirement::articleNumber)
                .distinct()
                .collect(Collectors.toList());
    }

    public record Requirement(
            int id,
            String articleNumber,
            String doraReference,
            String requirementEt,
            String requirementEn,
            String foundCriteria,
            String partialCriteria,
            String missingCriteria
    ) {}

    private static List<Requirement> buildRequirements() {
        List<Requirement> reqs = new ArrayList<>();
        int id = 1;

        // ─── ARTICLE 5: Governance and Organisation (ICT Risk) ───
        reqs.add(new Requirement(id++, "5", "Art. 5(1)",
                "Juhatuse vastutus IKT riskide eest",
                "Board responsibility for ICT risks",
                "Document explicitly assigns ICT risk oversight to the management body/board, with named roles or committees",
                "General governance language mentions IT/ICT but without specific board-level accountability",
                "No mention of board or management body responsibility for ICT/technology risks"));
        reqs.add(new Requirement(id++, "5", "Art. 5(2)",
                "IKT riskijuhtimise raamistiku kinnitamine",
                "ICT risk management framework approval",
                "Board formally approves the ICT risk management framework/policy, with review cycle documented",
                "References an ICT policy or framework but no formal approval process described",
                "No ICT risk management framework or policy referenced"));
        reqs.add(new Requirement(id++, "5", "Art. 5(3)",
                "Piisav IKT eelarve ja ressursid",
                "Adequate ICT budget and resources",
                "Specific budget allocation for ICT security, risk management, or digital resilience mentioned",
                "General reference to 'adequate resources' for IT without specific budget commitments",
                "No mention of ICT budget, resources, or investment in digital resilience"));
        reqs.add(new Requirement(id++, "5", "Art. 5(4)",
                "CISO/IKT turvaülem roll defineeritud",
                "CISO/ICT security officer role defined",
                "Named CISO role or equivalent with clear reporting line to management body",
                "Information security responsibilities mentioned but no dedicated role defined",
                "No CISO, ICT security officer, or equivalent role referenced"));

        // ─── ARTICLE 6: ICT Risk Management Framework (ICT Risk) ───
        reqs.add(new Requirement(id++, "6", "Art. 6(1)",
                "Dokumenteeritud IKT riskijuhtimise raamistik",
                "Documented ICT risk management framework",
                "Comprehensive documented framework covering ICT risk identification, assessment, and mitigation",
                "Some ICT risk procedures exist but not consolidated into a formal framework document",
                "No documented ICT risk management framework"));
        reqs.add(new Requirement(id++, "6", "Art. 6(2)",
                "Identify funktsioon — riskide tuvastamine",
                "Identify function — risk identification",
                "Systematic process for identifying ICT risks including asset inventory, threat assessment, and vulnerability identification",
                "Some risk identification activities mentioned but not systematic or comprehensive",
                "No ICT risk identification process described"));
        reqs.add(new Requirement(id++, "6", "Art. 6(3)",
                "Protect/Detect/Respond/Recover funktsioonid",
                "Protect/Detect/Respond/Recover functions",
                "All four functions covered: protection measures, detection capabilities, response procedures, and recovery plans",
                "Some functions covered but not all four (protect, detect, respond, recover)",
                "No structured approach to protection, detection, response, or recovery"));
        reqs.add(new Requirement(id++, "6", "Art. 6(5)",
                "Iga-aastane raamistiku ülevaatus",
                "Annual framework review",
                "Documented annual (or more frequent) review cycle for the ICT risk framework with review records",
                "Review mentioned but no specific frequency or formal review process",
                "No periodic review of the ICT risk management framework"));
        reqs.add(new Requirement(id++, "6", "Art. 6(6)",
                "Sõltumatu audit / kolmanda osapoole ülevaatus",
                "Independent audit / third-party review",
                "Independent audit of ICT risk framework by internal audit or external auditor, with audit schedule",
                "References to audit or review but no independence requirement or schedule",
                "No independent audit or third-party review of ICT risk management"));

        // ─── ARTICLE 8: Identification (ICT Risk) ───
        reqs.add(new Requirement(id++, "8", "Art. 8(1)",
                "IKT varade inventuur ja klassifikatsioon",
                "ICT asset inventory and classification",
                "Complete inventory of all ICT assets with classification by criticality, including hardware, software, and data",
                "Some asset tracking exists but incomplete inventory or no classification system",
                "No ICT asset inventory or classification system"));
        reqs.add(new Requirement(id++, "8", "Art. 8(2)",
                "Kriitiliste ärifunktsioonide kaardistamine",
                "Mapping of critical business functions",
                "Critical business functions identified and mapped to supporting ICT systems and infrastructure",
                "Some critical functions identified but mapping to ICT systems incomplete",
                "No mapping of critical business functions to ICT systems"));
        reqs.add(new Requirement(id++, "8", "Art. 8(3)",
                "IKT sõltuvuste dokumenteerimine",
                "ICT dependency documentation",
                "Dependencies between ICT systems, third-party providers, and business functions documented",
                "Some dependencies noted but no comprehensive dependency mapping",
                "No documentation of ICT system dependencies"));
        reqs.add(new Requirement(id++, "8", "Art. 8(4)",
                "Regulaarne varade ülevaatus",
                "Regular asset review",
                "Documented schedule for regular review and update of ICT asset inventory",
                "Asset review mentioned but no defined frequency or process",
                "No regular review process for ICT asset inventory"));

        // ─── ARTICLE 9: Protection and Prevention (ICT Risk) ───
        reqs.add(new Requirement(id++, "9", "Art. 9(1)",
                "Juurdepääsukontrolli poliitika",
                "Access control policy",
                "Formal access control policy with least-privilege principle, MFA, regular access reviews",
                "General access control mentioned but lacking specific measures like MFA or access review cycles",
                "No access control policy or user access management described"));
        reqs.add(new Requirement(id++, "9", "Art. 9(2)",
                "Krüpteerimispoliitika",
                "Encryption policy",
                "Encryption requirements for data at rest and in transit, key management procedures documented",
                "Encryption mentioned generally but no specific requirements for at-rest/in-transit or key management",
                "No encryption policy or cryptographic controls described"));
        reqs.add(new Requirement(id++, "9", "Art. 9(3)",
                "Paikamise ja haavatavuste haldamine",
                "Patch and vulnerability management",
                "Documented patch management process with timelines, vulnerability scanning schedule, and remediation SLAs",
                "Patching or vulnerability management mentioned but no specific timelines or procedures",
                "No patch management or vulnerability management process"));
        reqs.add(new Requirement(id++, "9", "Art. 9(4)",
                "Võrgusegmenteerimine ja tulemüürid",
                "Network segmentation and firewalls",
                "Network segmentation strategy documented, firewall rules, DMZ configuration, and network monitoring",
                "General network security mentioned but no specific segmentation or firewall documentation",
                "No network segmentation or perimeter security documentation"));
        reqs.add(new Requirement(id++, "9", "Art. 9(5)",
                "IKT muudatuste haldamine",
                "ICT change management",
                "Formal change management process with testing, approval workflows, rollback procedures",
                "Change management referenced but informal or lacking specific procedures",
                "No ICT change management process described"));

        // ─── ARTICLE 11: Business Continuity (ICT Risk) ───
        reqs.add(new Requirement(id++, "11", "Art. 11(1)",
                "Talitluspidevuse plaan (BCP)",
                "Business continuity plan (BCP)",
                "Documented BCP covering ICT disruption scenarios, activation criteria, roles, and communication procedures",
                "General business continuity language exists but lacks ICT-specific scenarios or detail",
                "No business continuity plan for ICT disruptions"));
        reqs.add(new Requirement(id++, "11", "Art. 11(2)",
                "RTO ja RPO sihtmäärad",
                "RTO and RPO targets",
                "Specific Recovery Time Objectives and Recovery Point Objectives defined for critical systems",
                "Recovery targets mentioned generally but no specific RTO/RPO values for individual systems",
                "No RTO or RPO targets defined"));
        reqs.add(new Requirement(id++, "11", "Art. 11(3)",
                "Testimise ajakava ja harjutused",
                "Testing schedule and exercises",
                "Regular BCP/DR testing schedule (at least annual), with documented test scenarios and results",
                "Testing mentioned but no specific schedule or documented results",
                "No BCP/DR testing schedule or exercises"));
        reqs.add(new Requirement(id++, "11", "Art. 11(4)",
                "Kriisikommunikatsiooni plaan",
                "Crisis communication plan",
                "Crisis communication plan with stakeholder notification procedures, templates, and escalation paths",
                "Some communication references during incidents but no formal crisis communication plan",
                "No crisis communication plan or stakeholder notification procedures"));

        // ─── ARTICLE 17: Incident Management Process (Incident) ───
        reqs.add(new Requirement(id++, "17", "Art. 17(1)",
                "Intsidentide klassifitseerimisprotseduurid",
                "Incident classification procedures",
                "Documented incident classification framework with severity levels, criteria, and escalation thresholds",
                "Some incident categorization exists but criteria are vague or incomplete",
                "No incident classification procedures"));
        reqs.add(new Requirement(id++, "17", "Art. 17(2)",
                "Varajase hoiatamise indikaatorid",
                "Early warning indicators",
                "Defined early warning indicators/KRIs with monitoring dashboards and alert thresholds",
                "Some monitoring exists but no formal early warning indicator framework",
                "No early warning indicators or proactive monitoring"));
        reqs.add(new Requirement(id++, "17", "Art. 17(3)",
                "Rollid ja vastutused intsidentide halduses",
                "Roles and responsibilities in incident management",
                "Clear RACI matrix or role definitions for incident detection, response, escalation, and resolution",
                "General team references but no formal role assignments for incident management",
                "No defined roles or responsibilities for incident management"));
        reqs.add(new Requirement(id++, "17", "Art. 17(4)",
                "Intsidendi logide ja tõendite säilitamine",
                "Incident log and evidence retention",
                "Incident logging requirements with retention periods, chain of custody, and forensic readiness",
                "Logging mentioned but no retention periods or evidence management procedures",
                "No incident logging or evidence retention requirements"));

        // ─── ARTICLE 18: Classification of ICT-related incidents (Incident) ───
        reqs.add(new Requirement(id++, "18", "Art. 18(1)",
                "Intsidentide klassifitseerimiskriteeriumid",
                "Incident classification criteria",
                "Classification criteria based on: clients affected, duration, geographic spread, data losses, critical services impact, economic impact",
                "Some classification criteria exist but not all required dimensions covered",
                "No incident classification criteria defined"));
        reqs.add(new Requirement(id++, "18", "Art. 18(2)",
                "Olulise intsidendi lävi ja kriteeriumid",
                "Major incident threshold and criteria",
                "Clear thresholds defining when an incident qualifies as 'major' under DORA, with quantitative criteria",
                "Some severity distinctions but no clear 'major incident' threshold as required by DORA",
                "No major incident threshold or criteria defined"));
        reqs.add(new Requirement(id++, "18", "Art. 18(3)",
                "Küberrünnaku käsitlemise protseduurid",
                "Cyber attack handling procedures",
                "Specific procedures for cyber attack scenarios including containment, eradication, and recovery steps",
                "General incident response exists but no cyber-attack specific procedures",
                "No cyber attack handling procedures"));

        // ─── ARTICLE 19: Reporting of major ICT-related incidents (Incident) ───
        reqs.add(new Requirement(id++, "19", "Art. 19(1)",
                "Esmane teavitus 4 tunni jooksul",
                "Initial notification within 4 hours",
                "Procedure for initial notification to competent authority within 4 hours of incident classification",
                "Incident notification procedure exists but timing does not meet 4-hour requirement",
                "No initial incident notification procedure"));
        reqs.add(new Requirement(id++, "19", "Art. 19(2)",
                "Vahearuanne 72 tunni jooksul",
                "Intermediate report within 72 hours",
                "Procedure for submitting intermediate report within 72 hours with updated impact assessment",
                "Some follow-up reporting exists but no 72-hour intermediate report requirement",
                "No intermediate reporting procedure"));
        reqs.add(new Requirement(id++, "19", "Art. 19(3)",
                "Lõpparuanne 1 kuu jooksul",
                "Final report within 1 month",
                "Procedure for final incident report within 1 month including root cause analysis and remediation",
                "Post-incident reporting exists but no 1-month timeline or root cause analysis requirement",
                "No final incident report procedure"));
        reqs.add(new Requirement(id++, "19", "Art. 19(4)",
                "Standardvormid ja raporteerimiskanalid",
                "Standard forms and reporting channels",
                "Standardized reporting templates/forms and identified reporting channels to competent authorities",
                "Some reporting templates exist but not aligned with regulatory requirements",
                "No standardized reporting forms or identified reporting channels"));

        // ─── ARTICLE 24: General requirements for TLPT (Testing) ───
        reqs.add(new Requirement(id++, "24", "Art. 24(1)",
                "Digitaalse vastupidavuse testimisprogramm",
                "Digital operational resilience testing programme",
                "Comprehensive testing programme covering all critical ICT systems, updated at least annually",
                "Some testing activities exist but no comprehensive programme or regular schedule",
                "No digital operational resilience testing programme"));
        reqs.add(new Requirement(id++, "24", "Art. 24(2)",
                "Haavatavuse skaneerimise kord",
                "Vulnerability scanning procedures",
                "Regular vulnerability scanning with defined frequency, scope, and remediation timelines",
                "Vulnerability scanning mentioned but no defined frequency or remediation process",
                "No vulnerability scanning procedures"));
        reqs.add(new Requirement(id++, "24", "Art. 24(3)",
                "Võrgu turvatestid ja penetratsioonitestimine",
                "Network security tests and penetration testing",
                "Regular penetration testing (at least annual) of critical systems with documented scope and results",
                "Some security testing mentioned but not comprehensive or regular",
                "No penetration testing or network security testing"));
        reqs.add(new Requirement(id++, "24", "Art. 24(4)",
                "Lähtekoodi analüüs",
                "Source code analysis",
                "Source code review or SAST/DAST procedures for critical applications with documented process",
                "Code review mentioned but no formal source code analysis process",
                "No source code analysis or review procedures"));

        // ─── ARTICLE 30: Key contractual provisions (Third-Party) ───
        reqs.add(new Requirement(id++, "30", "Art. 30(2)(a)",
                "Teenuse ulatus ja kvaliteet (SLA, KPI-d)",
                "Service scope and quality (SLA, KPIs)",
                "Contract specifies measurable service levels such as uptime percentage, response/resolution times, RTO, RPO, or penalty clauses for SLA breaches",
                "SLA or service levels mentioned but without specific metrics or uses vague terms like 'best effort'",
                "No mention of service levels, SLA, uptime, performance targets, or KPIs"));
        reqs.add(new Requirement(id++, "30", "Art. 30(2)(b)",
                "Andmete asukoht ja töötlemine (EU/EEA)",
                "Data location and processing (EU/EEA)",
                "Explicit data residency requirements (EU/EEA), GDPR references, data transfer restrictions, or named data center locations within EU/EEA",
                "Data processing or data protection mentioned but no explicit data location or residency specified",
                "No clause about data location, data processing, data protection, or GDPR"));
        reqs.add(new Requirement(id++, "30", "Art. 30(2)(c)",
                "Auditeerimis- ja inspekteerimisõigus",
                "Audit and inspection rights",
                "Client has unrestricted or broad audit/inspection rights, including on-site access or right to appoint third-party auditors",
                "Audit rights exist but are limited — e.g. only annual audits, limited to SOC2/ISO reports only",
                "No audit, inspection, or review rights clause"));
        reqs.add(new Requirement(id++, "30", "Art. 30(2)(d)",
                "Intsidentidest teavitamine",
                "Incident notification",
                "Incident reporting with specific timeframe (ideally <=24h), severity classification, escalation procedures",
                "Incident notification clause exists but with vague timing or no severity classification",
                "No incident reporting, notification, or breach notification clause"));
        reqs.add(new Requirement(id++, "30", "Art. 30(2)(e)",
                "Väljumisstrateegia ja andmete tagastamine",
                "Exit strategy and data return",
                "Data return/deletion procedures, transition assistance period, data export format, migration support",
                "Termination/exit clause exists but does not address data return, format, or transition support",
                "No exit strategy, termination provisions, or data return clause"));
        reqs.add(new Requirement(id++, "30", "Art. 30(2)(f)",
                "Alltöövõtjate tingimused",
                "Subcontracting conditions",
                "Requires prior written approval for subcontractors, maintains subcontractor list, flow-down of obligations",
                "Subcontracting mentioned but without approval rights or flow-down obligations",
                "No mention of subcontracting, sub-processors, or third-party providers"));
        reqs.add(new Requirement(id++, "30", "Art. 30(2)(g)",
                "Turvameetmed (ISO 27001, krüpteerimine)",
                "Security measures (ISO 27001, encryption)",
                "References specific standards (ISO 27001, SOC2, NIST), encryption requirements, penetration testing, access controls",
                "General security language like 'appropriate security measures' without naming specific standards",
                "No security measures, information security, or cybersecurity clause"));
        reqs.add(new Requirement(id++, "30", "Art. 30(2)(h)",
                "Ärijätkuvuse ja katastroofitaaste plaan",
                "Business continuity and disaster recovery",
                "BCP/DRP documented, RPO/RTO targets specified, testing frequency defined, backup procedures",
                "General continuity or recovery language without specific targets or testing commitments",
                "No business continuity, disaster recovery, or backup clause"));

        return List.copyOf(reqs);
    }
}
