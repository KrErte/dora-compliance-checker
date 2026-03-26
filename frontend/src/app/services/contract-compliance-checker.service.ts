import { Injectable } from '@angular/core';

export interface ContractCheck {
  requirementId: number;
  requirementEt: string;
  requirementEn: string;
  doraReference: string;
  status: 'found' | 'partial' | 'missing';
  quote: string;
  recommendationEt: string;
  recommendationEn: string;
}

export interface ContractComplianceResult {
  scorePercentage: number;
  complianceLevel: 'GREEN' | 'YELLOW' | 'RED';
  foundCount: number;
  partialCount: number;
  missingCount: number;
  totalRequirements: number;
  summary: string;
  findings: ContractCheck[];
}

interface RequirementRule {
  id: number;
  requirementEt: string;
  requirementEn: string;
  doraReference: string;
  // Keywords that indicate FOUND (strong evidence)
  foundKeywords: (string | RegExp)[];
  // Keywords that indicate PARTIAL (weak/vague evidence)
  partialKeywords: string[];
  recommendationEt: string;
  recommendationEn: string;
}

@Injectable({ providedIn: 'root' })
export class ContractComplianceCheckerService {

  private rules: RequirementRule[] = [
    {
      id: 1,
      requirementEt: 'Teenuse ulatus ja kvaliteet (SLA, KPI-d)',
      requirementEn: 'Service scope and quality (SLA, KPIs)',
      doraReference: 'Art. 30(2)(a)',
      foundKeywords: [
        'sla', 'service level agreement', 'teenustaseme',
        /\d{2,3}[\.,]\d*\s*%/, // 99.9%, 99.5% etc
        'uptime', 'kättesaadavus', 'response time', 'reageerimisaeg',
        'rto', 'rpo', 'penalty', 'leppetrahv', 'credit', 'kpi'
      ],
      partialKeywords: [
        'service level', 'teenustase', 'best effort', 'commercially reasonable',
        'high availability', 'kõrge käideldavus', 'performance', 'jõudlus',
        'quality of service', 'teenuse kvaliteet'
      ],
      recommendationEt: 'Lisage konkreetsed mõõdetavad teenustasemed (nt 99.5% uptime), KPI-d ja sanktsioonid rikkumise eest.',
      recommendationEn: 'Add specific measurable service levels (e.g. 99.5% uptime), KPIs, and penalties for breaches.'
    },
    {
      id: 2,
      requirementEt: 'Andmete asukoht ja töötlemine (EU/EEA)',
      requirementEn: 'Data location and processing (EU/EEA)',
      doraReference: 'Art. 30(2)(b)',
      foundKeywords: [
        'eu/eea', 'eu/emp', 'european union', 'euroopa liit',
        'european economic area', 'euroopa majanduspiirkond',
        'data residency', 'andmete asukoht',
        'data center location', 'andmekeskuse asukoht',
        /gdpr.*location/i, /location.*eu/i, /eu.*data.*center/i
      ],
      partialKeywords: [
        'gdpr', 'isikuandmete kaitse', 'data protection', 'andmekaitse',
        'data processing agreement', 'dpa', 'andmetöötlusleping',
        'applicable data protection', 'privacy', 'privaatsus'
      ],
      recommendationEt: 'Määrake konkreetne andmete töötlemise asukoht EU/EMP piires ja andmekeskuste asukohad.',
      recommendationEn: 'Specify explicit data processing location within EU/EEA and data center locations.'
    },
    {
      id: 3,
      requirementEt: 'Auditeerimis- ja inspekteerimisõigus',
      requirementEn: 'Audit and inspection rights',
      doraReference: 'Art. 30(2)(c)',
      foundKeywords: [
        'audit right', 'auditeerimisõigus', 'inspection right', 'inspekteerimisõigus',
        'on-site audit', 'kohapealne audit', 'right to audit', 'õigus auditeerida',
        'third-party auditor', 'sõltumatu audiitor', 'independent auditor',
        'access to premises', 'ligipääs ruumidele'
      ],
      partialKeywords: [
        'audit', 'audiit', 'inspection', 'inspekteerimine',
        'soc2', 'soc 2', 'iso 27001', 'certification', 'sertifikaat',
        'compliance report', 'vastavusaruanne', 'review', 'ülevaatus'
      ],
      recommendationEt: 'Lisage piiramatu auditeerimisõigus, sh kohapealne audit ja kolmanda osapoole audiitorite kaasamine.',
      recommendationEn: 'Add unrestricted audit rights including on-site audits and engagement of third-party auditors.'
    },
    {
      id: 4,
      requirementEt: 'Intsidentidest teavitamine 24h jooksul',
      requirementEn: 'Incident notification within 24h',
      doraReference: 'Art. 30(2)(d)',
      foundKeywords: [
        /\d+\s*(hours?|tundi|h)\s*(of|after|from|pärast|jooksul)/i,
        /within\s*\d+\s*hours?/i, /\d+\s*tunni\s*jooksul/i,
        'incident reporting within', 'severity classification',
        'raskusaste klassifikatsioon', 'root cause analysis',
        'juurpõhjuse analüüs', 'escalation procedure', 'eskalatsioon'
      ],
      partialKeywords: [
        'incident notification', 'intsidendi teavitus', 'incident reporting',
        'intsidentidest teavitamine', 'breach notification', 'rikkumise teavitus',
        'promptly', 'viivitamatult', 'without delay', 'without undue delay',
        'as soon as practicable', 'esimesel võimalusel'
      ],
      recommendationEt: 'Määrake konkreetne teavitamise tähtaeg (≤24h), raskusastme klassifikatsioon ja eskalatsiooniprotseduurid.',
      recommendationEn: 'Specify concrete notification deadline (≤24h), severity classification, and escalation procedures.'
    },
    {
      id: 5,
      requirementEt: 'Väljumisstrateegia ja andmete tagastamine',
      requirementEn: 'Exit strategy and data return',
      doraReference: 'Art. 30(2)(e)',
      foundKeywords: [
        'exit strategy', 'väljumisstrateegia', 'exit plan', 'väljumisplaan',
        'data return', 'andmete tagastamine', 'data migration', 'andmete migratsioon',
        'transition assistance', 'üleminekuabi', 'transition period', 'üleminekuperiood',
        'data export', 'andmete eksport', 'data deletion', 'andmete kustutamine',
        'post-termination', 'pärast lõpetamist'
      ],
      partialKeywords: [
        'termination', 'lõpetamine', 'ülesütlemine', 'expiry', 'aegumine',
        'upon termination', 'lepingu lõppemisel', 'notice period', 'etteteatamistähtaeg',
        'wind-down', 'handover', 'üleandmine'
      ],
      recommendationEt: 'Lisage andmete tagastamise/kustutamise protseduurid, üleminekuperiood ja andmete eksportimise vorming.',
      recommendationEn: 'Add data return/deletion procedures, transition period, and data export format specifications.'
    },
    {
      id: 6,
      requirementEt: 'Alltöövõtjate tingimused',
      requirementEn: 'Subcontracting conditions',
      doraReference: 'Art. 30(2)(f)',
      foundKeywords: [
        'prior written consent', 'eelnev kirjalik nõusolek',
        'prior approval', 'eelnev heakskiit',
        'subcontractor list', 'allhankijate loetelu',
        'right to object', 'õigus esitada vastuväiteid',
        'flow-down', 'sub-processor list', 'volitatud töötlejate loetelu'
      ],
      partialKeywords: [
        'subcontract', 'allhange', 'alltöövõtja', 'sub-processor', 'volitatud töötleja',
        'third party', 'kolmas osapool', 'third-party provider',
        'outsourc', 'delegat'
      ],
      recommendationEt: 'Nõudke eelnevat kirjalikku nõusolekut allhankijate kasutamiseks, allhankijate loendit ja õigust vastuväiteid esitada.',
      recommendationEn: 'Require prior written consent for subcontractors, maintain subcontractor list, and right to object.'
    },
    {
      id: 7,
      requirementEt: 'Turvameetmed (ISO 27001, krüpteerimine)',
      requirementEn: 'Security measures (ISO 27001, encryption)',
      doraReference: 'Art. 30(2)(g)',
      foundKeywords: [
        'iso 27001', 'soc2', 'soc 2', 'nist',
        'aes-256', 'aes256', 'tls 1.3', 'tls 1.2',
        'encryption at rest', 'krüpteerimine puhkeolekus',
        'encryption in transit', 'krüpteerimine edastamisel',
        'penetration test', 'läbistustest', 'vulnerability management',
        'haavatavuste haldus', 'multi-factor', 'mitmefaktoriline'
      ],
      partialKeywords: [
        'encryption', 'krüpteerimine', 'security measures', 'turvameetmed',
        'information security', 'infoturve', 'cybersecurity', 'küberturve',
        'appropriate security', 'industry-standard', 'reasonable safeguards',
        'access control', 'juurdepääsukontroll'
      ],
      recommendationEt: 'Viidake konkreetsetele standarditele (ISO 27001, SOC2), krüpteerimise nõuetele ja regulaarsetele turvatestidele.',
      recommendationEn: 'Reference specific standards (ISO 27001, SOC2), encryption requirements, and regular security testing.'
    },
    {
      id: 8,
      requirementEt: 'Ärijätkuvuse ja katastroofitaaste plaan',
      requirementEn: 'Business continuity and disaster recovery',
      doraReference: 'Art. 30(2)(h)',
      foundKeywords: [
        'bcp', 'drp', 'business continuity plan', 'ärijätkuvusplaan',
        'disaster recovery plan', 'katastroofitaaste plaan',
        /rto\s*[:=]?\s*\d+/i, /rpo\s*[:=]?\s*\d+/i,
        'recovery time objective', 'taastamise ajaeesmärk',
        'recovery point objective', 'taastamispunkti eesmärk',
        'failover', 'backup site', 'varukoopia', 'disaster recovery site'
      ],
      partialKeywords: [
        'business continuity', 'ärijätkuvus', 'disaster recovery', 'katastroofitaaste',
        'backup', 'varundamine', 'recovery', 'taastamine',
        'continuity', 'järjepidevus', 'resilience', 'vastupidavus'
      ],
      recommendationEt: 'Lisage BCP/DRP olemasolu nõue, RPO/RTO eesmärgid, testimise sagedus ja varukoopiameetodid.',
      recommendationEn: 'Add BCP/DRP requirements, RPO/RTO targets, testing frequency, and backup procedures.'
    }
  ];

  analyze(text: string): ContractComplianceResult {
    const lowerText = text.toLowerCase();
    const findings: ContractCheck[] = [];

    for (const rule of this.rules) {
      const { status, quote } = this.evaluateRule(rule, text, lowerText);

      findings.push({
        requirementId: rule.id,
        requirementEt: rule.requirementEt,
        requirementEn: rule.requirementEn,
        doraReference: rule.doraReference,
        status,
        quote,
        recommendationEt: status === 'found' ? '' : rule.recommendationEt,
        recommendationEn: status === 'found' ? '' : rule.recommendationEn,
      });
    }

    const foundCount = findings.filter(f => f.status === 'found').length;
    const partialCount = findings.filter(f => f.status === 'partial').length;
    const missingCount = findings.filter(f => f.status === 'missing').length;
    const total = findings.length;
    const score = total > 0 ? Math.round((foundCount + partialCount * 0.5) / total * 1000) / 10 : 0;
    const level: 'GREEN' | 'YELLOW' | 'RED' = score >= 80 ? 'GREEN' : score >= 50 ? 'YELLOW' : 'RED';

    return {
      scorePercentage: score,
      complianceLevel: level,
      foundCount,
      partialCount,
      missingCount,
      totalRequirements: total,
      summary: this.generateSummary(foundCount, partialCount, missingCount, score),
      findings
    };
  }

  private evaluateRule(rule: RequirementRule, originalText: string, lowerText: string): { status: 'found' | 'partial' | 'missing'; quote: string } {
    // Check for strong (found) keywords first
    for (const kw of rule.foundKeywords) {
      if (kw instanceof RegExp) {
        const match = originalText.match(kw) || lowerText.match(kw);
        if (match) {
          const quote = this.extractContext(originalText, match.index ?? 0, match[0].length);
          return { status: 'found', quote };
        }
      } else {
        const idx = lowerText.indexOf(kw.toLowerCase());
        if (idx !== -1) {
          const quote = this.extractContext(originalText, idx, kw.length);
          return { status: 'found', quote };
        }
      }
    }

    // Check for weak (partial) keywords
    for (const kw of rule.partialKeywords) {
      const idx = lowerText.indexOf(kw.toLowerCase());
      if (idx !== -1) {
        const quote = this.extractContext(originalText, idx, kw.length);
        return { status: 'partial', quote };
      }
    }

    return { status: 'missing', quote: '' };
  }

  private extractContext(text: string, matchIndex: number, matchLength: number): string {
    const contextRadius = 120;
    const start = Math.max(0, matchIndex - contextRadius);
    const end = Math.min(text.length, matchIndex + matchLength + contextRadius);

    let snippet = text.substring(start, end).trim();

    // Clean up: trim to sentence boundaries if possible
    if (start > 0) {
      const sentenceStart = snippet.indexOf('. ');
      if (sentenceStart !== -1 && sentenceStart < 40) {
        snippet = snippet.substring(sentenceStart + 2);
      } else {
        snippet = '...' + snippet;
      }
    }
    if (end < text.length) {
      const sentenceEnd = snippet.lastIndexOf('. ');
      if (sentenceEnd !== -1 && sentenceEnd > snippet.length - 40) {
        snippet = snippet.substring(0, sentenceEnd + 1);
      } else {
        snippet = snippet + '...';
      }
    }

    return snippet.replace(/\s+/g, ' ').trim();
  }

  private generateSummary(found: number, partial: number, missing: number, score: number): string {
    const total = found + partial + missing;
    if (score >= 80) {
      return `Leping vastab suuremas osas DORA Art. 30 nõuetele (${found}/${total} leitud). / Contract largely meets DORA Art. 30 requirements (${found}/${total} found).`;
    } else if (score >= 50) {
      return `Leping vastab osaliselt DORA Art. 30 nõuetele. ${missing} nõuet puudu, ${partial} osaliselt kaetud. / Contract partially meets DORA Art. 30 requirements. ${missing} missing, ${partial} partially covered.`;
    } else {
      return `Leping ei vasta suures osas DORA Art. 30 nõuetele. ${missing} nõuet puudu. / Contract largely fails DORA Art. 30 requirements. ${missing} requirements missing.`;
    }
  }
}
