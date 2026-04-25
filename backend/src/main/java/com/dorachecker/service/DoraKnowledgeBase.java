package com.dorachecker.service;

public final class DoraKnowledgeBase {

  private DoraKnowledgeBase() {}

  private static volatile String cachedKnowledge;

  public static String getKnowledge() {
    if (cachedKnowledge == null) {
      synchronized (DoraKnowledgeBase.class) {
        if (cachedKnowledge == null) {
          cachedKnowledge = buildKnowledge();
        }
      }
    }
    return cachedKnowledge;
  }

  private static String buildKnowledge() {
    StringBuilder sb = new StringBuilder(12000);

    // ── DORA Articles Overview ──
    sb.append("=== DORA REGULATION (EU 2022/2554) KEY ARTICLES ===\n\n");

    sb.append("Art. 5-6: ICT Risk Management Framework\n");
    sb.append(
        "Financial entities must establish a comprehensive ICT risk management framework, reviewed annually. The management body bears ultimate responsibility for ICT risk.\n\n");

    sb.append("Art. 7: ICT Systems, Protocols and Tools\n");
    sb.append(
        "Entities must use and maintain updated ICT systems that are reliable, have sufficient capacity, and are technologically resilient.\n\n");

    sb.append("Art. 8: Identification of ICT Risk\n");
    sb.append(
        "Identify, classify and document all ICT-supported business functions, information assets, and ICT assets. Maintain inventories and map dependencies.\n\n");

    sb.append("Art. 9: Protection and Prevention\n");
    sb.append(
        "Implement ICT security policies, access controls, encryption, network security, and patch management procedures.\n\n");

    sb.append("Art. 10: Detection\n");
    sb.append(
        "Deploy mechanisms to detect anomalous activities, including network monitoring, security event analysis, and alert thresholds.\n\n");

    sb.append("Art. 11: Response and Recovery\n");
    sb.append(
        "Establish ICT business continuity policy, disaster recovery plans, backup procedures. RTO and RPO must be defined for critical functions.\n\n");

    sb.append("Art. 12: Backup Policies\n");
    sb.append(
        "Maintain backup and restoration procedures. Periodically test backup procedures and ensure backups are stored in a separate location.\n\n");

    sb.append("Art. 13: Learning and Evolving\n");
    sb.append(
        "Gather and analyze post-incident information, conduct reviews, and use lessons learned to improve ICT risk management.\n\n");

    sb.append("Art. 14: Communication\n");
    sb.append(
        "Implement crisis communication plans for responsible disclosure of ICT incidents to clients, counterparts, and the public.\n\n");

    sb.append("Art. 17: ICT-related Incident Classification\n");
    sb.append(
        "Classify incidents by: number of clients affected, duration, geographic spread, data losses, criticality of services, economic impact.\n\n");

    sb.append("Art. 18: Classification Criteria\n");
    sb.append(
        "Major incident criteria: >10% clients, >2h duration, >2 EU member states, data integrity loss, critical service impact.\n\n");

    sb.append("Art. 19: Reporting Major ICT Incidents\n");
    sb.append(
        "Report to competent authority: initial notification (within 4h of classification/24h of detection), intermediate report (within 72h), final report (within 1 month). Use standardized templates.\n\n");

    sb.append("Art. 24-25: General Requirements for ICT Testing\n");
    sb.append(
        "Establish ICT testing programme including vulnerability assessments, network security tests, gap analyses, penetration testing. Test at least annually.\n\n");

    sb.append("Art. 26-27: Threat-Led Penetration Testing (TLPT)\n");
    sb.append(
        "Significant entities must perform TLPT every 3 years using TIBER-EU framework. Must cover critical functions and be performed by independent testers. Results reported to competent authority.\n\n");

    sb.append("Art. 28: Key Principles for ICT Third-Party Risk\n");
    sb.append(
        "Manage ICT third-party risk as integral part of ICT risk framework. Maintain register of information on all ICT third-party arrangements (Register of Information).\n\n");

    sb.append("Art. 29: Preliminary Assessment of ICT Concentration Risk\n");
    sb.append(
        "Before entering new arrangements, assess: substitutability, consequences of large-scale failure, compliance with data protection rules. Identify alternatives for critical providers.\n\n");

    sb.append("Art. 30: Key Contractual Provisions\n");
    sb.append(
        "ICT contracts MUST include: clear service descriptions, data processing locations, SLAs with quantitative targets, incident reporting obligations, audit rights, exit strategies, subcontracting chain transparency, security measures. For critical/important functions: additional requirements including data access guarantees, performance targets, termination rights.\n\n");

    sb.append("Art. 31-44: Oversight Framework for Critical ICT Providers\n");
    sb.append(
        "ESAs designate critical third-party providers (CTPPs). Lead Overseer conducts assessments, issues recommendations. Providers can be subject to periodic fees.\n\n");

    sb.append("Art. 45: Information Sharing\n");
    sb.append(
        "Financial entities may exchange cyber threat intelligence among themselves. Sharing arrangements must protect business confidentiality and personal data.\n\n");

    // ── Assessment Domains ──
    sb.append("\n=== DORA FIVE PILLARS (Assessment Domains) ===\n\n");

    sb.append("Pillar 1: ICT Risk Management (Art. 5-16)\n");
    sb.append(
        "Governance, risk framework, protection, detection, response/recovery, learning.\n\n");

    sb.append("Pillar 2: ICT Incident Management (Art. 17-23)\n");
    sb.append(
        "Incident classification, major incident reporting (4h/72h/1mo), root cause analysis.\n\n");

    sb.append("Pillar 3: Digital Operational Resilience Testing (Art. 24-27)\n");
    sb.append(
        "Annual testing programme, vulnerability assessments, TLPT every 3 years for significant entities.\n\n");

    sb.append("Pillar 4: ICT Third-Party Risk Management (Art. 28-44)\n");
    sb.append(
        "Vendor assessment, Art. 30 contractual requirements, register of information, concentration risk, oversight of critical providers.\n\n");

    sb.append("Pillar 5: Information Sharing (Art. 45)\n");
    sb.append("Cyber threat intelligence sharing arrangements with peers and authorities.\n\n");

    // ── Art 30 Contract Requirements ──
    sb.append("\n=== ART. 30 CONTRACT REQUIREMENTS (22 items) ===\n\n");

    sb.append("1. Clear description of all functions and ICT services (Art 30(2)(a))\n");
    sb.append(
        "2. Locations where data is processed and stored, including EU/EEA requirements (Art 30(2)(a))\n");
    sb.append(
        "3. Data protection and access provisions including return and deletion (Art 30(2)(a))\n");
    sb.append(
        "4. Service level descriptions with quantitative and qualitative targets (Art 30(2)(b))\n");
    sb.append("5. ICT incident reporting assistance obligations (Art 30(2)(c))\n");
    sb.append("6. Business continuity provisions with ICT security testing (Art 30(2)(d))\n");
    sb.append("7. Termination rights and minimum notice periods (Art 30(2)(e))\n");
    sb.append("8. Conditions for participation in TLPT testing (Art 30(2)(f))\n");
    sb.append("9. Full access, inspection and audit rights (Art 30(2)(g))\n");
    sb.append("10. Exit strategy with transition periods and data migration (Art 30(2)(h))\n");
    sb.append("11. Provider cooperation with competent authorities (Art 30(2)(i))\n");
    sb.append("12. Specific termination rights for critical functions (Art 30(3)(a))\n");
    sb.append("13. Sub-outsourcing transparency and prior approval (Art 30(3)(b))\n");
    sb.append("14. Minimum uptime and availability guarantees (Art 30(3)(c))\n");
    sb.append("15. Provider participation in security awareness training (Art 30(3)(d))\n");
    sb.append("16. ICT security measures meeting regulatory standards (Art 30(3)(e))\n");
    sb.append("17. Data access, recovery and return in insolvency scenarios (Art 30(3)(f))\n");
    sb.append("18. Risk management and governance provisions (Art 30(3)(g))\n");
    sb.append("19. Unrestricted supervisory access rights (Art 30(3)(h))\n");
    sb.append("20. Agreed service levels and escalation procedures (Art 30(3)(i))\n");
    sb.append("21. Subcontracting chain transparency for critical functions (Art 30(3)(j))\n");
    sb.append("22. Change notification requirements (Art 30(3)(k))\n\n");

    // ── Glossary ──
    sb.append("\n=== DORA GLOSSARY ===\n\n");
    sb.append(
        "DORA: Digital Operational Resilience Act (EU 2022/2554), effective 17 January 2025\n");
    sb.append("CTPP: Critical Third-Party Provider, designated by ESAs under Art. 31\n");
    sb.append("TLPT: Threat-Led Penetration Testing per TIBER-EU framework (Art. 26-27)\n");
    sb.append(
        "RoI: Register of Information — mandatory register of all ICT third-party arrangements (Art. 28(3))\n");
    sb.append("RTO: Recovery Time Objective — max acceptable downtime after disruption\n");
    sb.append("RPO: Recovery Point Objective — max acceptable data loss window\n");
    sb.append("SLA: Service Level Agreement with quantitative performance targets\n");
    sb.append("ICT: Information and Communication Technology\n");
    sb.append("ESA: European Supervisory Authority (EBA, EIOPA, ESMA)\n\n");

    // ── Platform Tools Directory ──
    sb.append("\n=== DORAAUDIT PLATFORM TOOLS ===\n\n");
    sb.append(
        "1. /assessment — DORA Self-Assessment: 37-question compliance check across all 5 pillars\n");
    sb.append(
        "2. /contract-analysis — AI Contract Analysis: upload ICT contracts for automated DORA Art. 30 gap detection\n");
    sb.append("3. /workspace — Compliance Workspace: manage all contracts and analysis results\n");
    sb.append(
        "4. /contract-generator — Contract Generator: create DORA-compliant ICT contract templates\n");
    sb.append(
        "5. /contract-checklist — Contract Checklist: interactive Art. 30 compliance checklist\n");
    sb.append(
        "6. /incident-reporting — Incident Reporting: DORA Art. 19 incident report workflow (initial/intermediate/final)\n");
    sb.append(
        "7. /incident-decision-tree — Incident Classification: interactive Art. 18 decision tree for classifying ICT incidents\n");
    sb.append(
        "8. /incident-simulator — Incident Simulator: practice ICT incident response scenarios\n");
    sb.append(
        "9. /guardian — Guardian Monitoring: automated contract expiry and compliance alerts\n");
    sb.append(
        "10. /command-center — Command Center: real-time compliance dashboard across all pillars\n");
    sb.append(
        "11. /tlpt — TLPT Module: plan and track Threat-Led Penetration Testing (Art. 26-27)\n");
    sb.append(
        "12. /concentration-risk — Concentration Risk: analyze ICT provider dependency (Art. 29)\n");
    sb.append(
        "13. /roi — Register of Information: DORA Art. 28(3) mandatory register with ESA xBRL-CSV export\n");
    sb.append(
        "14. /dora-explorer — DORA Explorer: browse all DORA articles with plain-language explanations\n");
    sb.append(
        "15. /framework-mapping — Framework Mapping: see how DORA maps to ISO 27001, NIS2, GDPR, COBIT\n");
    sb.append(
        "16. /training-quiz — Training Quiz: interactive DORA knowledge quiz for staff awareness\n");
    sb.append("17. /fine-calculator — Fine Calculator: estimate DORA non-compliance penalties\n");
    sb.append(
        "18. /playbook — Action Playbook: generate a personalized DORA compliance action plan\n");
    sb.append("19. /policy-generator — Policy Generator: create DORA-compliant policy documents\n");
    sb.append(
        "20. /negotiations — Negotiation Manager: AI-powered contract gap negotiation strategies\n");

    return sb.toString();
  }
}
