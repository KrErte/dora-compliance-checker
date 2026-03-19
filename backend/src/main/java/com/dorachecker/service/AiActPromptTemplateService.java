package com.dorachecker.service;

import com.dorachecker.model.AiSystemEntity;
import org.springframework.stereotype.Service;

@Service
public class AiActPromptTemplateService {

    public String buildPrompt(String documentType, AiSystemEntity system, String additionalContext) {
        String systemContext = buildSystemContext(system);
        String extra = additionalContext != null ? "\n\nAdditional context: " + additionalContext : "";

        return switch (documentType) {
            case "FRIA" -> buildFriaPrompt(systemContext, extra);
            case "TECHNICAL_DOC" -> buildTechnicalDocPrompt(systemContext, extra);
            case "RISK_MANAGEMENT" -> buildRiskManagementPrompt(systemContext, extra);
            case "HUMAN_OVERSIGHT" -> buildHumanOversightPrompt(systemContext, extra);
            case "DATA_GOVERNANCE" -> buildDataGovernancePrompt(systemContext, extra);
            case "CONFORMITY_DECLARATION" -> buildConformityPrompt(systemContext, extra);
            case "POST_MARKET_MONITORING" -> buildPostMarketPrompt(systemContext, extra);
            case "TRANSPARENCY_NOTICE" -> buildTransparencyPrompt(systemContext, extra);
            default -> "Generate a compliance document for this AI system.\n\n" + systemContext + extra;
        };
    }

    public String getDocumentTitle(String documentType, String systemName) {
        return switch (documentType) {
            case "FRIA" -> "Fundamental Rights Impact Assessment — " + systemName;
            case "TECHNICAL_DOC" -> "Technical Documentation — " + systemName;
            case "RISK_MANAGEMENT" -> "Risk Management Plan — " + systemName;
            case "HUMAN_OVERSIGHT" -> "Human Oversight Protocol — " + systemName;
            case "DATA_GOVERNANCE" -> "Data Governance Plan — " + systemName;
            case "CONFORMITY_DECLARATION" -> "EU Declaration of Conformity — " + systemName;
            case "POST_MARKET_MONITORING" -> "Post-Market Monitoring Plan — " + systemName;
            case "TRANSPARENCY_NOTICE" -> "Transparency Notice — " + systemName;
            default -> documentType + " — " + systemName;
        };
    }

    private String buildSystemContext(AiSystemEntity system) {
        return String.format("""
            AI System Name: %s
            Description: %s
            Vendor: %s
            Version: %s
            Purpose: %s
            Risk Level: %s
            Deployment Context: %s
            Organization Role: %s
            """,
                system.getName(),
                system.getDescription() != null ? system.getDescription() : "Not specified",
                system.getVendor() != null ? system.getVendor() : "Not specified",
                system.getVersion() != null ? system.getVersion() : "Not specified",
                system.getPurpose() != null ? system.getPurpose() : "Not specified",
                system.getRiskLevel() != null ? system.getRiskLevel() : "Not classified",
                system.getDeploymentContext() != null ? system.getDeploymentContext() : "Not specified",
                system.getOrganizationRole() != null ? system.getOrganizationRole() : "Not specified"
        );
    }

    private String buildFriaPrompt(String ctx, String extra) {
        return """
            You are an EU AI Act compliance expert. Generate a comprehensive Fundamental Rights Impact Assessment (FRIA) document for the following AI system under EU Regulation 2024/1689 (AI Act) Article 27.

            """ + ctx + extra + """

            The FRIA must include:
            1. Executive Summary
            2. AI System Description and Purpose
            3. Fundamental Rights Analysis (dignity, freedom, equality, solidarity, citizens' rights, justice)
            4. Affected Groups Identification
            5. Risk Assessment for Each Right
            6. Mitigation Measures
            7. Monitoring and Review Plan
            8. Stakeholder Consultation Plan
            9. Conclusions and Recommendations

            Format the output as professional Markdown. Be thorough but practical.
            """;
    }

    private String buildTechnicalDocPrompt(String ctx, String extra) {
        return """
            You are an EU AI Act compliance expert. Generate Technical Documentation for the following AI system as required by EU Regulation 2024/1689 (AI Act) Article 11 and Annex IV.

            """ + ctx + extra + """

            The documentation must cover:
            1. General Description of the AI System
            2. Detailed Description of Elements and Development Process
            3. Monitoring, Functioning and Control
            4. Risk Management System Description
            5. Data and Data Governance
            6. Performance Metrics and Benchmarks
            7. Cybersecurity Measures
            8. Description of Changes Throughout Lifecycle
            9. Standards Applied
            10. EU Declaration of Conformity Reference

            Format as professional Markdown.
            """;
    }

    private String buildRiskManagementPrompt(String ctx, String extra) {
        return """
            You are an EU AI Act compliance expert. Generate a Risk Management Plan for the following AI system under EU Regulation 2024/1689 (AI Act) Article 9.

            """ + ctx + extra + """

            Include:
            1. Risk Management Framework
            2. Risk Identification and Analysis
            3. Risk Evaluation and Prioritization
            4. Risk Mitigation Measures
            5. Residual Risk Assessment
            6. Testing and Validation Procedures
            7. Monitoring and Review Schedule
            8. Roles and Responsibilities

            Format as professional Markdown.
            """;
    }

    private String buildHumanOversightPrompt(String ctx, String extra) {
        return """
            You are an EU AI Act compliance expert. Generate a Human Oversight Protocol for the following AI system under EU Regulation 2024/1689 (AI Act) Article 14.

            """ + ctx + extra + """

            Include:
            1. Oversight Requirements and Scope
            2. Human-Machine Interface Design
            3. Operator Competency Requirements
            4. Override and Intervention Procedures
            5. Monitoring Dashboard Specifications
            6. Escalation Procedures
            7. Training Requirements
            8. Documentation and Record-Keeping

            Format as professional Markdown.
            """;
    }

    private String buildDataGovernancePrompt(String ctx, String extra) {
        return """
            You are an EU AI Act compliance expert. Generate a Data Governance Plan for the following AI system under EU Regulation 2024/1689 (AI Act) Article 10.

            """ + ctx + extra + """

            Include:
            1. Data Governance Framework
            2. Training Data Requirements
            3. Data Collection and Sourcing
            4. Data Quality Assurance
            5. Bias Detection and Mitigation
            6. Data Protection and Privacy (GDPR alignment)
            7. Data Retention and Deletion
            8. Data Access Controls

            Format as professional Markdown.
            """;
    }

    private String buildConformityPrompt(String ctx, String extra) {
        return """
            You are an EU AI Act compliance expert. Generate an EU Declaration of Conformity for the following AI system under EU Regulation 2024/1689 (AI Act) Article 47 and Annex V.

            """ + ctx + extra + """

            Include:
            1. AI System Identification
            2. Provider/Manufacturer Details
            3. Statement of Conformity
            4. Referenced Harmonised Standards
            5. Conformity Assessment Procedure Used
            6. Notified Body Details (if applicable)
            7. Declaration Date and Signatory

            Format as professional Markdown. Use formal legal language.
            """;
    }

    private String buildPostMarketPrompt(String ctx, String extra) {
        return """
            You are an EU AI Act compliance expert. Generate a Post-Market Monitoring Plan for the following AI system under EU Regulation 2024/1689 (AI Act) Article 72.

            """ + ctx + extra + """

            Include:
            1. Monitoring Objectives and Scope
            2. Data Collection Strategy
            3. Performance Monitoring Metrics
            4. Incident Reporting Procedures
            5. Feedback Collection Mechanisms
            6. Review and Update Schedule
            7. Communication Plan
            8. Corrective Action Procedures

            Format as professional Markdown.
            """;
    }

    private String buildTransparencyPrompt(String ctx, String extra) {
        return """
            You are an EU AI Act compliance expert. Generate a Transparency Notice for the following AI system under EU Regulation 2024/1689 (AI Act) Article 50.

            """ + ctx + extra + """

            Include:
            1. AI System Identification
            2. Purpose and Intended Use
            3. Capabilities and Limitations
            4. Human Oversight Measures
            5. Data Processing Information
            6. User Rights and Contact Information
            7. Complaint Mechanism
            8. Version and Update History

            Format as professional Markdown. Write for a non-technical audience.
            """;
    }
}
