import { Injectable } from '@angular/core';
import { ParsedDocument, DoraCheck, DoraComplianceResult } from '../models/parsed-document.model';

@Injectable({ providedIn: 'root' })
export class DoraComplianceCheckerService {

  analyzeCompliance(doc: ParsedDocument): DoraComplianceResult {
    const text = doc.extractedText.toLowerCase();

    const checks: DoraCheck[] = [
      {
        article: 'Article 5-6',
        title: 'ICT Risk Management Framework',
        keywords: ['ict risk management', 'risk framework', 'risk appetite',
                   'digital operational resilience strategy', 'risk tolerance'],
        requiredElements: ['governance', 'risk identification', 'risk assessment',
                          'risk mitigation', 'monitoring', 'reporting'],
        found: false, gaps: []
      },
      {
        article: 'Article 8',
        title: 'Identification of ICT Assets',
        keywords: ['asset inventory', 'ict assets', 'asset register',
                   'asset classification', 'critical assets', 'information assets'],
        requiredElements: ['inventory', 'classification', 'dependencies', 'critical functions'],
        found: false, gaps: []
      },
      {
        article: 'Article 9',
        title: 'Protection and Prevention',
        keywords: ['access control', 'authentication', 'encryption',
                   'network security', 'patch management', 'vulnerability'],
        requiredElements: ['access control', 'encryption', 'network segmentation', 'patch management'],
        found: false, gaps: []
      },
      {
        article: 'Article 10',
        title: 'Detection of Anomalous Activities',
        keywords: ['detection', 'monitoring', 'anomaly', 'intrusion detection',
                   'siem', 'log management', 'alerting'],
        requiredElements: ['continuous monitoring', 'alert mechanisms', 'anomaly detection'],
        found: false, gaps: []
      },
      {
        article: 'Article 11',
        title: 'Response and Recovery',
        keywords: ['incident response', 'business continuity', 'disaster recovery',
                   'backup', 'recovery time', 'recovery point', 'bcp', 'drp'],
        requiredElements: ['incident response plan', 'business continuity plan',
                          'backup procedures', 'recovery objectives'],
        found: false, gaps: []
      },
      {
        article: 'Article 13',
        title: 'Learning and Evolving',
        keywords: ['lessons learned', 'post-incident', 'review', 'training',
                   'awareness', 'cyber threat intelligence'],
        requiredElements: ['post-incident review', 'staff training', 'threat intelligence'],
        found: false, gaps: []
      },
      {
        article: 'Article 15',
        title: 'ICT Third-Party Risk Management',
        keywords: ['third party', 'third-party', 'outsourcing', 'vendor',
                   'supplier', 'service provider', 'subcontracting'],
        requiredElements: ['vendor register', 'risk assessment', 'contractual provisions',
                          'exit strategy', 'concentration risk'],
        found: false, gaps: []
      },
      {
        article: 'Article 19-20',
        title: 'ICT Incident Reporting',
        keywords: ['incident classification', 'incident reporting',
                   'major incident', 'notification', 'competent authority'],
        requiredElements: ['classification criteria', 'reporting timeline',
                          'notification template', 'escalation procedure'],
        found: false, gaps: []
      },
      {
        article: 'Article 24-25',
        title: 'Resilience Testing',
        keywords: ['penetration testing', 'threat-led', 'tlpt', 'resilience testing',
                   'vulnerability assessment', 'scenario testing'],
        requiredElements: ['testing programme', 'penetration testing', 'scenario-based testing'],
        found: false, gaps: []
      },
      {
        article: 'Article 28',
        title: 'Register of Information',
        keywords: ['register of information', 'roi', 'contractual arrangements',
                   'ict service providers register'],
        requiredElements: ['provider details', 'service description',
                          'criticality assessment', 'subcontracting chain'],
        found: false, gaps: []
      }
    ];

    for (const check of checks) {
      const keywordHits = check.keywords.filter(kw => text.includes(kw));
      check.found = keywordHits.length > 0;
      check.gaps = check.requiredElements.filter(el => !text.includes(el.toLowerCase()));
    }

    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.found && c.gaps.length === 0).length;
    const partialChecks = checks.filter(c => c.found && c.gaps.length > 0).length;
    const failedChecks = checks.filter(c => !c.found).length;

    return {
      documentName: doc.fileName,
      analyzedAt: new Date(),
      overallScore: Math.round((passedChecks / totalChecks) * 100),
      summary: { total: totalChecks, passed: passedChecks, partial: partialChecks, failed: failedChecks },
      checks,
      recommendations: this.generateRecommendations(checks)
    };
  }

  private generateRecommendations(checks: DoraCheck[]): string[] {
    const recs: string[] = [];
    for (const check of checks) {
      if (!check.found) {
        recs.push(`${check.article} (${check.title}): Document does not address this area. Add a dedicated section covering: ${check.requiredElements.join(', ')}.`);
      } else if (check.gaps.length > 0) {
        recs.push(`${check.article} (${check.title}): Partially covered. Missing elements: ${check.gaps.join(', ')}.`);
      }
    }
    return recs;
  }
}
