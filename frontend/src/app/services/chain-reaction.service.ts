import { Injectable } from '@angular/core';

export interface Trigger {
  id: string;
  title: string;
  titleEt: string;
  description: string;
  descriptionEt: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: string;
  icon: string;
}

export interface CascadeStep {
  stepNumber: number;
  name: string;
  nameEt: string;
  affectedPillar: string;
  impactPercent: number;
  delayDays: number;
  description: string;
  descriptionEt: string;
}

export interface RemediationStep {
  priority: number;
  action: string;
  actionEt: string;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  timelineDays: number;
  article: string;
}

export interface SimulationResult {
  triggerId: string;
  triggerName: string;
  triggerNameEt: string;
  scoreBefore: number;
  scoreAfter: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  affectedPillars: string[];
  cascadeSteps: CascadeStep[];
  remediationSteps: RemediationStep[];
  totalDegradation: number;
  estimatedRecoveryDays: number;
}

@Injectable({ providedIn: 'root' })
export class ChainReactionService {

  getTriggers(): Trigger[] {
    return [
      {
        id: 'VENDOR_BREACH', title: 'Vendor Data Breach', titleEt: 'Pakkuja andmeleke',
        description: 'Critical ICT provider experiences a data breach',
        descriptionEt: 'Kriitiline IKT pakkuja kogeb andmeleket',
        severity: 'CRITICAL', category: 'Third-Party Risk', icon: 'shield'
      },
      {
        id: 'EVIDENCE_EXPIRY', title: 'Evidence Expiry', titleEt: 'T\u00f5endite aegumine',
        description: 'Key compliance evidence expires',
        descriptionEt: 'V\u00f5tmet\u00e4htsusega vastavust\u00f5endid aeguvad',
        severity: 'HIGH', category: 'Compliance', icon: 'document'
      },
      {
        id: 'REGULATION_CHANGE', title: 'Regulation Change', titleEt: 'Regulatsiooni muudatus',
        description: 'New RTS/ITS standard published',
        descriptionEt: 'Uus RTS/ITS standard avaldatud',
        severity: 'HIGH', category: 'Regulatory', icon: 'document'
      },
      {
        id: 'STAFF_DEPARTURE', title: 'Staff Departure', titleEt: 'T\u00f6\u00f6taja lahkumine',
        description: 'Key compliance officer leaves',
        descriptionEt: 'V\u00f5tmeisikust vastavusametnik lahkub',
        severity: 'MEDIUM', category: 'Operational', icon: 'users'
      },
      {
        id: 'SYSTEM_OUTAGE', title: 'System Outage', titleEt: 'S\u00fcsteemi katkestus',
        description: 'Critical ICT system goes offline',
        descriptionEt: 'Kriitiline IKT s\u00fcsteem l\u00e4heb maha',
        severity: 'CRITICAL', category: 'Infrastructure', icon: 'cloud'
      },
      {
        id: 'AUDIT_FINDING', title: 'Audit Finding', titleEt: 'Auditi leid',
        description: 'Regulator identifies major gap',
        descriptionEt: 'Regulaator tuvastab olulise l\u00fcnga',
        severity: 'HIGH', category: 'Compliance', icon: 'document'
      },
      {
        id: 'CONTRACT_TERMINATION', title: 'Contract Termination', titleEt: 'Lepingu l\u00f5petamine',
        description: 'Critical vendor contract terminated',
        descriptionEt: 'Kriitilise pakkuja leping l\u00f5petatud',
        severity: 'CRITICAL', category: 'Third-Party Risk', icon: 'server'
      }
    ];
  }

  simulateCascade(triggerId: string, currentScore: number = 50): SimulationResult {
    const trigger = this.getTriggers().find(t => t.id === triggerId);
    const cascadeSteps = this.buildCascadeSteps(triggerId);
    const remediationSteps = this.buildRemediationSteps(triggerId);
    const affectedPillars = this.getAffectedPillars(triggerId);

    const totalDegradation = cascadeSteps.reduce((sum, s) => sum + s.impactPercent, 0);
    const scoreAfter = Math.max(0, Math.round(currentScore - totalDegradation));
    const riskLevel = totalDegradation >= 30 ? 'CRITICAL' : totalDegradation >= 20 ? 'HIGH' : 'MEDIUM';
    const estimatedRecoveryDays = Math.round(totalDegradation * 1.5 + 10);

    return {
      triggerId,
      triggerName: trigger?.title ?? triggerId,
      triggerNameEt: trigger?.titleEt ?? triggerId,
      scoreBefore: currentScore,
      scoreAfter,
      riskLevel,
      affectedPillars,
      cascadeSteps,
      remediationSteps,
      totalDegradation,
      estimatedRecoveryDays
    };
  }

  simulateScenario(scenarioId: string, currentScore: number = 50): SimulationResult {
    switch (scenarioId) {
      case 'worst-case': return this.buildWorstCase(currentScore);
      case 'evidence-gap': return this.buildEvidenceGap(currentScore);
      case 'regulatory-storm':
      default: return this.buildRegulatoryStorm(currentScore);
    }
  }

  private buildCascadeSteps(triggerId: string): CascadeStep[] {
    const cs = (n: number, name: string, nameEt: string, pillar: string, impact: number, delay: number, desc: string, descEt: string): CascadeStep =>
      ({ stepNumber: n, name, nameEt, affectedPillar: pillar, impactPercent: impact, delayDays: delay, description: desc, descriptionEt: descEt });

    switch (triggerId) {
      case 'VENDOR_BREACH': return [
        cs(1, 'Data Exposure Detected', 'Andmeleke tuvastatud', 'ICT Third-Party Risk', 8, 0,
          'Sensitive data from ICT provider is compromised, triggering immediate DORA Art. 28 obligations',
          'IKT pakkuja tundlikud andmed on kompromiteeritud, k\u00e4ivitades kohesed DORA art. 28 kohustused'),
        cs(2, 'Incident Report Required', 'Intsidendiaruanne n\u00f5utud', 'ICT Incident Management', 5, 1,
          'Major incident classification triggered \u2014 initial report due to competent authority within 4 hours',
          'Suurintsidendi klassifikatsioon k\u00e4ivitatud \u2014 esialgne aruanne p\u00e4devale asutusele 4 tunni jooksul'),
        cs(3, 'Evidence Invalidated', 'T\u00f5endid kehtetuks', 'ICT Risk Management', 7, 2,
          'Security certifications and audit reports from breached vendor are no longer valid',
          'Turvasertifikaadid ja auditiaruanded rikutud pakkujalt ei kehti enam'),
        cs(4, 'Contract Review Triggered', 'Lepingu \u00fclevaatus k\u00e4ivitatud', 'ICT Third-Party Risk', 4, 3,
          'All contracts with affected provider must be reviewed for breach notification clauses',
          'K\u00f5ik lepingud m\u00f5jutatud pakkujaga tuleb \u00fcle vaadata rikkumisteadete klauslite osas'),
        cs(5, 'Resilience Test Required', 'Vastupidavustest n\u00f5utud', 'Digital Operational Resilience Testing', 6, 7,
          'TLPT and vulnerability assessments must be re-run to verify no lateral compromise',
          'TLPT ja haavatavushindamised tuleb uuesti l\u00e4bi viia k\u00fclgsuunalise kompromiteerimise v\u00e4listamiseks')
      ];
      case 'EVIDENCE_EXPIRY': return [
        cs(1, 'Compliance Gap Created', 'Vastavusl\u00fcnk tekkinud', 'ICT Risk Management', 6, 0,
          'Expired evidence creates an unsubstantiated compliance claim under DORA Art. 6',
          'Aegunud t\u00f5endid tekitavad p\u00f5hjendamata vastavusv\u00e4ite DORA art. 6 alusel'),
        cs(2, 'Audit Readiness Drops', 'Auditiks valmidus langeb', 'ICT Risk Management', 5, 1,
          'Audit trail is incomplete \u2014 regulator could issue a finding',
          'Auditirada on puudulik \u2014 regulaator v\u00f5ib esitada leiu'),
        cs(3, 'Risk Score Increases', 'Riskiskoor t\u00f5useb', 'ICT Third-Party Risk', 4, 3,
          'Vendor risk assessments relying on expired evidence must be flagged',
          'Aegunud t\u00f5enditele tuginevad pakkujate riskihindamised tuleb m\u00e4rgistada'),
        cs(4, 'Remediation Backlog Grows', 'Paranduste mahaj\u00e4\u00e4mus kasvab', 'ICT Risk Management', 3, 5,
          'New remediation items created to gather replacement evidence',
          'Uued parandus\u00fcksused loodud asendustavate t\u00f5endite kogumiseks')
      ];
      case 'REGULATION_CHANGE': return [
        cs(1, 'Gap Analysis Outdated', 'L\u00fcngaanal\u00fc\u00fcs aegunud', 'ICT Risk Management', 7, 0,
          'Current gap analysis no longer reflects the regulatory landscape under new RTS/ITS',
          'Praegune l\u00fcngaanal\u00fc\u00fcs ei kajasta enam regulatiivset maastikku uute RTS/ITS alusel'),
        cs(2, 'Policy Updates Required', 'Poliitikate uuendused n\u00f5utud', 'ICT Risk Management', 5, 3,
          'Internal ICT risk management policies must be updated to reflect new standards',
          'Sisemised IKT riskijuhtimise poliitikad tuleb uuendada uute standardite kajastamiseks'),
        cs(3, 'Testing Framework Impact', 'Testimisraamistiku m\u00f5ju', 'Digital Operational Resilience Testing', 6, 7,
          'TLPT scope and methodology may need revision per updated technical standards',
          'TLPT ulatus ja metoodika v\u00f5ivad vajada \u00fclevaatamist uuendatud tehniliste standardite alusel'),
        cs(4, 'Vendor Compliance Unknown', 'Pakkuja vastavus teadmata', 'ICT Third-Party Risk', 4, 10,
          'Third-party providers must demonstrate compliance with new requirements',
          'Kolmanda osapoole pakkujad peavad t\u00f5endama vastavust uutele n\u00f5uetele'),
        cs(5, 'Training Gap', 'Koolitusl\u00fcnk', 'ICT Risk Management', 3, 14,
          'Staff need retraining on updated regulatory requirements',
          'T\u00f6\u00f6tajad vajavad \u00fcmber\u00f5pet uuendatud regulatiivsete n\u00f5uete osas')
      ];
      case 'STAFF_DEPARTURE': return [
        cs(1, 'Knowledge Gap', 'Teadmisl\u00fcnk', 'ICT Risk Management', 5, 0,
          'Institutional knowledge of compliance procedures leaves with the officer',
          'Institutsionaalsed teadmised vastavusprotseduuridest lahkuvad koos ametnikuga'),
        cs(2, 'Oversight Weakened', 'J\u00e4relevalve n\u00f5rgenenud', 'ICT Third-Party Risk', 4, 1,
          'Ongoing vendor monitoring tasks have no assigned owner',
          'K\u00e4imasolevatel pakkujate j\u00e4lgimis\u00fclesannetel pole m\u00e4\u00e4ratud vastutajat'),
        cs(3, 'Reporting Delays Risk', 'Aruandluse viivituste risk', 'ICT Incident Management', 3, 3,
          'Incident reporting workflows may stall without designated coordinator',
          'Intsidentide raporteerimise t\u00f6\u00f6vood v\u00f5ivad seiskuda ilma m\u00e4\u00e4ratud koordinaatorita'),
        cs(4, 'Audit Preparation Stalls', 'Auditi ettevalmistus seiskub', 'ICT Risk Management', 4, 5,
          'Scheduled audit preparation activities are left unassigned',
          'Planeeritud auditi ettevalmistusetegevused j\u00e4\u00e4vad m\u00e4\u00e4ramata')
      ];
      case 'SYSTEM_OUTAGE': return [
        cs(1, 'Service Disruption', 'Teenuse katkemine', 'ICT Risk Management', 9, 0,
          'Critical ICT system failure impacts business continuity under DORA Art. 11',
          'Kriitilise IKT s\u00fcsteemi rike m\u00f5jutab talitluspidevust DORA art. 11 alusel'),
        cs(2, 'Incident Classification', 'Intsidendi klassifitseerimine', 'ICT Incident Management', 5, 0,
          'Major ICT-related incident requires immediate classification and reporting',
          'Suur IKT-ga seotud intsident n\u00f5uab kohest klassifitseerimist ja raporteerimist'),
        cs(3, 'Dependent Systems Fail', 'S\u00f5ltuvad s\u00fcsteemid kukuvad', 'ICT Risk Management', 7, 1,
          'Downstream systems and services experience cascading failures',
          'Allvoolu s\u00fcsteemid ja teenused kogevad kaskaadrikeid'),
        cs(4, 'Recovery Plan Activated', 'Taastamiskava aktiveeritud', 'Digital Operational Resilience Testing', 4, 1,
          'Business continuity and disaster recovery plans are invoked',
          'Talitluspidevuse ja avariitaastamise kavad k\u00e4ivitatakse'),
        cs(5, 'Provider SLA Breach', 'Pakkuja SLA rikkumine', 'ICT Third-Party Risk', 5, 2,
          'If vendor-hosted, contractual SLA thresholds are breached',
          'Pakkuja majutuse korral rikutakse lepingulisi SLA k\u00fcnniseid'),
        cs(6, 'Post-Incident Review', 'Intsidendij\u00e4rgne \u00fclevaatus', 'ICT Incident Management', 3, 14,
          'Mandatory lessons-learned review and process improvement required',
          'Kohustuslik \u00f5ppetundide \u00fclevaatus ja protsesside parandamine n\u00f5utud')
      ];
      case 'AUDIT_FINDING': return [
        cs(1, 'Formal Finding Issued', 'Ametlik leid v\u00e4ljastatud', 'ICT Risk Management', 8, 0,
          'Regulator documents a material non-compliance finding',
          'Regulaator dokumenteerib olulise mittevastuvuse leiu'),
        cs(2, 'Remediation Mandate', 'Parandusmandaat', 'ICT Risk Management', 5, 1,
          'Mandatory remediation plan with deadlines must be submitted to regulator',
          'Kohustuslik paranduskava t\u00e4htaegadega tuleb esitada regulaatorile'),
        cs(3, 'Enhanced Monitoring', 'Tugevdatud j\u00e4relevalve', 'ICT Third-Party Risk', 4, 3,
          'Regulator may impose enhanced supervision on third-party arrangements',
          'Regulaator v\u00f5ib kehtestada tugevdatud j\u00e4relevalve kolmanda osapoole kokkulepetele'),
        cs(4, 'Board Notification', 'Juhatuse teavitamine', 'ICT Risk Management', 3, 1,
          'Management body must be formally notified per DORA Art. 5 governance requirements',
          'Juhtkonda tuleb ametlikult teavitada DORA art. 5 juhtimisn\u00f5uete kohaselt'),
        cs(5, 'Penalty Risk', 'Trahvirisk', 'ICT Risk Management', 6, 30,
          'If not remediated, administrative penalties under national transposition rules apply',
          'Kui ei parandata, kohaldatakse riikliku \u00fclevotmise reeglite alusel haldustrahve')
      ];
      case 'CONTRACT_TERMINATION': return [
        cs(1, 'Service Continuity Risk', 'Teenuse j\u00e4tkuvuse risk', 'ICT Third-Party Risk', 9, 0,
          'Critical ICT service provider relationship ends \u2014 exit strategy must be invoked',
          'Kriitilise IKT teenusepakkuja suhe l\u00f5peb \u2014 v\u00e4ljumisstrateeg\u00edia tuleb k\u00e4ivitada'),
        cs(2, 'Exit Plan Execution', 'V\u00e4ljumiskava t\u00e4itmine', 'ICT Third-Party Risk', 6, 1,
          'DORA Art. 28 exit strategy must be activated with data migration and transition',
          'DORA art. 28 v\u00e4ljumisstrateeg\u00edia tuleb aktiveerida andmemigratsiooni ja \u00fcleminekuga'),
        cs(3, 'Operational Disruption', 'Operatiivne h\u00e4ire', 'ICT Risk Management', 7, 3,
          'Business functions dependent on terminated provider face interruption',
          '\u00c4rifunktsioonid, mis s\u00f5ltuvad l\u00f5petatud pakkujast, seisavad silmitsi katkestusega'),
        cs(4, 'Replacement Sourcing', 'Asendaja leidmine', 'ICT Third-Party Risk', 4, 7,
          'Alternative provider must be identified, assessed, and onboarded',
          'Alternatiivne pakkuja tuleb tuvastada, hinnata ja kaasata'),
        cs(5, 'Concentration Risk Review', 'Kontsentratsioonirisiki \u00fclevaatus', 'ICT Third-Party Risk', 3, 14,
          'ICT concentration risk register must be updated per DORA Art. 29',
          'IKT kontsentratsioonirisiki register tuleb uuendada DORA art. 29 kohaselt')
      ];
      default: return [
        cs(1, 'Initial Impact', 'Esmane m\u00f5ju', 'ICT Risk Management', 5, 0,
          'The triggered event creates an immediate compliance impact',
          'K\u00e4ivitatud s\u00fcndmus tekitab kohese vastavusm\u00f5ju'),
        cs(2, 'Secondary Effects', 'Sekundaarsed m\u00f5jud', 'ICT Third-Party Risk', 4, 3,
          'Related compliance areas begin to degrade',
          'Seotud vastavusvaldkonnad hakkavad halvenema'),
        cs(3, 'Tertiary Effects', 'Tertsiaa rm\u00f5jud', 'Digital Operational Resilience Testing', 3, 7,
          'Broader compliance posture is affected',
          'Laiem vastavushoiak on m\u00f5jutatud'),
        cs(4, 'Long-term Degradation', 'Pikaajaline halvenemine', 'ICT Incident Management', 2, 14,
          'Sustained impact on overall DORA compliance score',
          'P\u00fcsiv m\u00f5ju \u00fcldisele DORA vastavusskoorile')
      ];
    }
  }

  private buildRemediationSteps(triggerId: string): RemediationStep[] {
    const rs = (p: number, action: string, actionEt: string, effort: 'LOW' | 'MEDIUM' | 'HIGH', days: number, article: string): RemediationStep =>
      ({ priority: p, action, actionEt, effort, timelineDays: days, article });

    switch (triggerId) {
      case 'VENDOR_BREACH': return [
        rs(1, 'Activate incident response plan and notify competent authority within 4 hours',
          'Aktiveeri intsidentide reageerimiskava ja teavita p\u00e4devat asutust 4 tunni jooksul', 'LOW', 1, 'Art. 17'),
        rs(2, 'Isolate affected systems and contain data exposure',
          'Isoleeri m\u00f5jutatud s\u00fcsteemid ja ohjata andmeleket', 'MEDIUM', 1, 'Art. 11'),
        rs(3, 'Request breach details and remediation plan from vendor',
          'N\u00f5ua pakkujalt rikkumise \u00fcksikasjad ja paranduskava', 'MEDIUM', 7, 'Art. 28'),
        rs(4, 'Schedule TLPT to verify no lateral compromise',
          'Planeeri TLPT k\u00fclgsuunalise kompromiteerimise v\u00e4listamiseks', 'HIGH', 30, 'Art. 26'),
        rs(5, 'Review vendor selection criteria and diversification strategy',
          'Vaata \u00fcle pakkuja valikukriteeriumid ja mitmekesistamisstrateegia', 'HIGH', 60, 'Art. 28')
      ];
      case 'EVIDENCE_EXPIRY': return [
        rs(1, 'Identify all expired evidence items and prioritize renewal',
          'Tuvasta k\u00f5ik aegunud t\u00f5endi\u00fcksused ja prioriseeri uuendamine', 'LOW', 3, 'Art. 6'),
        rs(2, 'Request updated certifications from relevant providers',
          'N\u00f5ua uuendatud sertifikaate asjakohastelt pakkujatelt', 'MEDIUM', 14, 'Art. 28'),
        rs(3, 'Set up automated evidence expiry alerts',
          'Seadista automaatsed t\u00f5endite aegumise hoiatused', 'MEDIUM', 7, 'Art. 6'),
        rs(4, 'Implement evidence lifecycle management process',
          'Rakenda t\u00f5endite elutsyklih aldusprotsess', 'HIGH', 30, 'Art. 6')
      ];
      case 'REGULATION_CHANGE': return [
        rs(1, 'Conduct impact assessment of new RTS/ITS requirements',
          'Vii l\u00e4bi uute RTS/ITS n\u00f5uete m\u00f5juhindamine', 'MEDIUM', 7, 'Art. 6'),
        rs(2, 'Update gap analysis to reflect new regulatory standards',
          'Uuenda l\u00fcngaanal\u00fc\u00fcsi uute regulatiivsete standardite kajastamiseks', 'MEDIUM', 14, 'Art. 6'),
        rs(3, 'Revise internal policies and procedures',
          'Vaata \u00fcle ja uuenda sisemisi poliitikaid ja protseduure', 'HIGH', 30, 'Art. 6'),
        rs(4, 'Notify third-party providers of new compliance requirements',
          'Teavita kolmanda osapoole pakkujaid uutest vastavusn\u00f5uetest', 'LOW', 14, 'Art. 28'),
        rs(5, 'Schedule staff training on updated requirements',
          'Planeeri t\u00f6\u00f6tajate koolitus uuendatud n\u00f5uete osas', 'MEDIUM', 30, 'Art. 6')
      ];
      case 'STAFF_DEPARTURE': return [
        rs(1, 'Assign interim compliance officer and transfer responsibilities',
          'M\u00e4\u00e4ra ajutine vastavusametnik ja anna \u00fcle vastutused', 'LOW', 3, 'Art. 5'),
        rs(2, 'Document all in-progress compliance activities',
          'Dokumenteeri k\u00f5ik k\u00e4imasolevad vastavustegevused', 'MEDIUM', 7, 'Art. 6'),
        rs(3, 'Begin recruitment for replacement compliance officer',
          'Alusta asendusvastavusametniku v\u00e4rbamist', 'HIGH', 30, 'Art. 5'),
        rs(4, 'Cross-train team members to reduce single-point-of-failure risk',
          'Koolita meeskonnaliikmeid ristselt, et v\u00e4hendada \u00fchepunktilise rikke riski', 'MEDIUM', 60, 'Art. 5')
      ];
      case 'SYSTEM_OUTAGE': return [
        rs(1, 'Activate business continuity plan and classify incident severity',
          'Aktiveeri talitluspidevuse kava ja klassifitseeri intsidendi t\u00f5sidus', 'LOW', 1, 'Art. 11'),
        rs(2, 'File initial incident report with competent authority if major',
          'Esita esialgne intsidendiaruanne p\u00e4devale asutusele, kui tegemist on suurintsidendiga', 'LOW', 1, 'Art. 19'),
        rs(3, 'Restore critical systems from backup and verify data integrity',
          'Taasta kriitilised s\u00fcsteemid varukoopiast ja kontrolli andmete terviklikkust', 'HIGH', 3, 'Art. 12'),
        rs(4, 'Conduct root cause analysis and update resilience testing scope',
          'Vii l\u00e4bi algp\u00f5hjuse anal\u00fc\u00fcs ja uuenda vastupidavustestimise ulatust', 'MEDIUM', 14, 'Art. 26'),
        rs(5, 'Review and enhance disaster recovery procedures',
          'Vaata \u00fcle ja t\u00e4iusta avariitaastamise protseduurid', 'HIGH', 30, 'Art. 11')
      ];
      case 'AUDIT_FINDING': return [
        rs(1, 'Acknowledge finding and assign remediation owner',
          'Tunnista leidu ja m\u00e4\u00e4ra paranduse vastutaja', 'LOW', 1, 'Art. 6'),
        rs(2, 'Develop detailed remediation plan with milestones',
          'Koosta \u00fcksikasjalik paranduskava vahepealsete eesm\u00e4rkidega', 'MEDIUM', 7, 'Art. 6'),
        rs(3, 'Submit remediation plan to regulator within required timeline',
          'Esita paranduskava regulaatorile n\u00f5utud ajaraamis', 'LOW', 14, 'Art. 6'),
        rs(4, 'Implement corrective actions and gather supporting evidence',
          'Rakenda parandusliked meetmeid ja kogu toetavaid t\u00f5endeid', 'HIGH', 45, 'Art. 6'),
        rs(5, 'Schedule follow-up internal audit to verify closure',
          'Planeeri j\u00e4relaudit sulgemise kontrollimiseks', 'MEDIUM', 60, 'Art. 6')
      ];
      case 'CONTRACT_TERMINATION': return [
        rs(1, 'Activate exit strategy and begin data migration',
          'Aktiveeri v\u00e4ljumisstrateeg\u00edia ja alusta andmemigratsiooni', 'HIGH', 3, 'Art. 28'),
        rs(2, 'Identify and assess alternative ICT service providers',
          'Tuvasta ja hinda alternatiivseid IKT teenusepakkujaid', 'HIGH', 14, 'Art. 28'),
        rs(3, 'Ensure continuity of critical business functions during transition',
          'Taga kriitiliste \u00e4rifunktsioonide j\u00e4tkuvus \u00fclemineku ajal', 'MEDIUM', 7, 'Art. 11'),
        rs(4, 'Onboard replacement provider with full DORA due diligence',
          'Kaasa asenduspakkuja t\u00e4ieliku DORA h\u00f5olsushtomise audiga', 'HIGH', 45, 'Art. 28'),
        rs(5, 'Update ICT concentration risk register',
          'Uuenda IKT kontsentratsioonirisiki registrit', 'LOW', 14, 'Art. 29')
      ];
      default: return [
        rs(1, 'Assess immediate impact and assign response owner',
          'Hinda kohest m\u00f5ju ja m\u00e4\u00e4ra reageerimise vastutaja', 'LOW', 1, 'Art. 6'),
        rs(2, 'Develop and execute remediation plan',
          'Koosta ja t\u00e4ida paranduskava', 'MEDIUM', 14, 'Art. 6'),
        rs(3, 'Review processes to prevent recurrence',
          'Vaata \u00fcle protsessid kordumise v\u00e4ltimiseks', 'LOW', 30, 'Art. 6')
      ];
    }
  }

  private getAffectedPillars(triggerId: string): string[] {
    switch (triggerId) {
      case 'VENDOR_BREACH': return ['ICT Third-Party Risk', 'ICT Incident Management', 'ICT Risk Management', 'Digital Operational Resilience Testing'];
      case 'EVIDENCE_EXPIRY': return ['ICT Risk Management', 'ICT Third-Party Risk'];
      case 'REGULATION_CHANGE': return ['ICT Risk Management', 'Digital Operational Resilience Testing', 'ICT Third-Party Risk'];
      case 'STAFF_DEPARTURE': return ['ICT Risk Management', 'ICT Third-Party Risk', 'ICT Incident Management'];
      case 'SYSTEM_OUTAGE': return ['ICT Risk Management', 'ICT Incident Management', 'Digital Operational Resilience Testing', 'ICT Third-Party Risk'];
      case 'AUDIT_FINDING': return ['ICT Risk Management', 'ICT Third-Party Risk'];
      case 'CONTRACT_TERMINATION': return ['ICT Third-Party Risk', 'ICT Risk Management'];
      default: return ['ICT Risk Management'];
    }
  }

  private buildWorstCase(currentScore: number): SimulationResult {
    const cascadeSteps: CascadeStep[] = [
      { stepNumber: 1, name: 'All Vendors Compromised', nameEt: 'K\u00f5ik pakkujad kompromiteeritud', affectedPillar: 'ICT Third-Party Risk', impactPercent: 15, delayDays: 0, description: 'Simultaneous breach across all ICT providers \u2014 total third-party trust collapse', descriptionEt: 'Samaaegne rikkumine k\u00f5igis IKT pakkujates \u2014 t\u00e4ielik kolmanda osapoole usalduse kokkuvarisemine' },
      { stepNumber: 2, name: 'Mass Incident Filing', nameEt: 'Massiline intsidentide esitamine', affectedPillar: 'ICT Incident Management', impactPercent: 10, delayDays: 0, description: 'Multiple major incidents require parallel reporting to competent authorities', descriptionEt: 'Mitu suurintsidenti n\u00f5uavad paralleelset raporteerimist p\u00e4devatele asutustele' },
      { stepNumber: 3, name: 'Evidence Chain Broken', nameEt: 'T\u00f5endite ahel katkenud', affectedPillar: 'ICT Risk Management', impactPercent: 12, delayDays: 1, description: 'All vendor-provided evidence is invalidated \u2014 compliance posture collapses', descriptionEt: 'K\u00f5ik pakkuja esitatud t\u00f5endid on kehtetuks tunnistatud \u2014 vastavushoiak variseb kokku' },
      { stepNumber: 4, name: 'Resilience Untested', nameEt: 'Vastupidavus testimata', affectedPillar: 'Digital Operational Resilience Testing', impactPercent: 8, delayDays: 2, description: 'Previous resilience test results are void \u2014 full TLPT re-engagement required', descriptionEt: 'Varasemad vastupidavustesti tulemused on t\u00fchised \u2014 vajalik t\u00e4ielik TLPT uuesti l\u00e4biviimine' },
      { stepNumber: 5, name: 'Regulatory Intervention', nameEt: 'Regulatiivne sekkumine', affectedPillar: 'ICT Risk Management', impactPercent: 10, delayDays: 3, description: 'Regulator initiates enhanced supervision and on-site inspection', descriptionEt: 'Regulaator algatab tugevdatud j\u00e4relevalve ja kohapealse inspektsiooni' },
      { stepNumber: 6, name: 'Board Crisis', nameEt: 'Juhatuse kriis', affectedPillar: 'Information Sharing', impactPercent: 5, delayDays: 1, description: 'Management body emergency session required per DORA Art. 5 governance obligations', descriptionEt: 'Juhtkonna h\u00e4daolukorra istung n\u00f5utud DORA art. 5 juhtimiskohustuste alusel' }
    ];
    const totalDegradation = cascadeSteps.reduce((s, c) => s + c.impactPercent, 0);
    return {
      triggerId: 'worst-case', triggerName: 'Worst Case: Total Vendor Failure', triggerNameEt: 'Halvim stsenaarium: pakkujate t\u00e4ielik rike',
      scoreBefore: currentScore, scoreAfter: Math.max(0, Math.round(currentScore - totalDegradation)),
      riskLevel: 'CRITICAL', affectedPillars: ['ICT Third-Party Risk', 'ICT Incident Management', 'ICT Risk Management', 'Digital Operational Resilience Testing', 'Information Sharing'],
      cascadeSteps, totalDegradation, estimatedRecoveryDays: 90,
      remediationSteps: [
        { priority: 1, action: 'Activate full crisis management protocol', actionEt: 'Aktiveeri t\u00e4ielik kriisijuhtimise protokoll', effort: 'LOW', timelineDays: 1, article: 'Art. 17' },
        { priority: 2, action: 'Notify all competent authorities and activate incident response', actionEt: 'Teavita k\u00f5iki p\u00e4devaid asutusi ja aktiveeri intsidentide reageerimine', effort: 'LOW', timelineDays: 1, article: 'Art. 19' },
        { priority: 3, action: 'Begin emergency vendor replacement and exit strategy execution', actionEt: 'Alusta h\u00e4daolukorras pakkuja asendamist ja v\u00e4ljumisstrateeg\u00edia t\u00e4itmist', effort: 'HIGH', timelineDays: 14, article: 'Art. 28' },
        { priority: 4, action: 'Engage external auditors for independent compliance assessment', actionEt: 'Kaasa v\u00e4lisaudiitorid s\u00f5ltumatuks vastavushindamiseks', effort: 'HIGH', timelineDays: 14, article: 'Art. 6' },
        { priority: 5, action: 'Rebuild evidence base and update all risk assessments', actionEt: 'Taasta t\u00f5endite baas ja uuenda k\u00f5ik riskihindamised', effort: 'HIGH', timelineDays: 60, article: 'Art. 6' }
      ]
    };
  }

  private buildEvidenceGap(currentScore: number): SimulationResult {
    const cascadeSteps: CascadeStep[] = [
      { stepNumber: 1, name: '50% Evidence Expires', nameEt: '50% t\u00f5enditest aegub', affectedPillar: 'ICT Risk Management', impactPercent: 10, delayDays: 0, description: 'Half of all compliance evidence simultaneously reaches expiry date', descriptionEt: 'Pool k\u00f5igist vastavust\u00f5enditest j\u00f5uab samaaegselt aegumiskuup\u00e4evani' },
      { stepNumber: 2, name: 'Audit Readiness Collapses', nameEt: 'Auditiks valmidus variseb kokku', affectedPillar: 'ICT Risk Management', impactPercent: 8, delayDays: 1, description: 'Compliance posture cannot be substantiated \u2014 audit would result in findings', descriptionEt: 'Vastavushoiakut ei saa p\u00f5hjendada \u2014 audit tooks kaasa leiud' },
      { stepNumber: 3, name: 'Vendor Assessments Invalid', nameEt: 'Pakkujate hinnangud kehtetud', affectedPillar: 'ICT Third-Party Risk', impactPercent: 6, delayDays: 3, description: 'Vendor due diligence evidence gaps undermine third-party risk ratings', descriptionEt: 'Pakkuja h\u00f5olsuskontrolli t\u00f5endil\u00fcngad \u00f5\u00f5nestavad kolmanda osapoole riskihinnanguid' },
      { stepNumber: 4, name: 'Remediation Surge', nameEt: 'Paranduste laine', affectedPillar: 'ICT Risk Management', impactPercent: 4, delayDays: 5, description: 'Massive remediation backlog created as evidence items need renewal', descriptionEt: 'Massiivne paranduste mahaj\u00e4\u00e4mus tekib, kuna t\u00f5endi\u00fcksused vajavad uuendamist' }
    ];
    const totalDegradation = cascadeSteps.reduce((s, c) => s + c.impactPercent, 0);
    return {
      triggerId: 'evidence-gap', triggerName: 'Evidence Gap: 50% Expiry', triggerNameEt: 'T\u00f5endil\u00fcnk: 50% aegumine',
      scoreBefore: currentScore, scoreAfter: Math.max(0, Math.round(currentScore - totalDegradation)),
      riskLevel: 'HIGH', affectedPillars: ['ICT Risk Management', 'ICT Third-Party Risk'],
      cascadeSteps, totalDegradation, estimatedRecoveryDays: 60,
      remediationSteps: [
        { priority: 1, action: 'Triage expired evidence by criticality and pillar impact', actionEt: 'Prioriseeri aegunud t\u00f5endid kriitilisuse ja sambakaupa m\u00f5ju alusel', effort: 'LOW', timelineDays: 3, article: 'Art. 6' },
        { priority: 2, action: 'Request updated certifications from all vendors', actionEt: 'N\u00f5ua uuendatud sertifikaate k\u00f5igilt pakkujatelt', effort: 'MEDIUM', timelineDays: 14, article: 'Art. 28' },
        { priority: 3, action: 'Implement automated evidence lifecycle monitoring', actionEt: 'Rakenda automaatne t\u00f5endite elutsykli j\u00e4lgimine', effort: 'MEDIUM', timelineDays: 21, article: 'Art. 6' },
        { priority: 4, action: 'Establish rolling renewal schedule to prevent bulk expiry', actionEt: 'Kehtesta j\u00e4tkuv uuendamisgraafik massilise aegumise v\u00e4ltimiseks', effort: 'LOW', timelineDays: 30, article: 'Art. 6' }
      ]
    };
  }

  private buildRegulatoryStorm(currentScore: number): SimulationResult {
    const cascadeSteps: CascadeStep[] = [
      { stepNumber: 1, name: 'Three New Standards Published', nameEt: 'Kolm uut standardit avaldatud', affectedPillar: 'ICT Risk Management', impactPercent: 9, delayDays: 0, description: 'ESAs publish 3 new RTS/ITS simultaneously, requiring comprehensive gap reassessment', descriptionEt: 'ESA-d avaldavad samaaegselt 3 uut RTS/ITS-i, mis n\u00f5uavad p\u00f5hjalikku l\u00fcngade \u00fcmberhindamist' },
      { stepNumber: 2, name: 'Policy Overhaul Required', nameEt: 'Poliitikate \u00fcmberkujundamine n\u00f5utud', affectedPillar: 'ICT Risk Management', impactPercent: 7, delayDays: 3, description: 'Multiple internal policies become non-compliant and need urgent revision', descriptionEt: 'Mitmed sisepoliitikad muutuvad mittevastavaks ja vajavad kiirelt \u00fclevaatamist' },
      { stepNumber: 3, name: 'Testing Scope Expanded', nameEt: 'Testimise ulatus laienenud', affectedPillar: 'Digital Operational Resilience Testing', impactPercent: 6, delayDays: 7, description: 'New technical standards expand TLPT and vulnerability assessment requirements', descriptionEt: 'Uued tehnilised standardid laiendavad TLPT ja haavatavushindamise n\u00f5udeid' },
      { stepNumber: 4, name: 'Vendor Re-assessment', nameEt: 'Pakkujate \u00fcmberhindamine', affectedPillar: 'ICT Third-Party Risk', impactPercent: 5, delayDays: 10, description: 'All third-party arrangements must be reviewed against new contractual requirements', descriptionEt: 'K\u00f5ik kolmanda osapoole kokkulepped tuleb \u00fcle vaadata uute lepinguliste n\u00f5uete suhtes' },
      { stepNumber: 5, name: 'Reporting Format Changes', nameEt: 'Aruandlusvormi muudatused', affectedPillar: 'ICT Incident Management', impactPercent: 4, delayDays: 14, description: 'Incident reporting templates and thresholds updated by new technical standards', descriptionEt: 'Intsidentide raporteerimise mallid ja k\u00fcnnised uuendatud uute tehniliste standardite poolt' },
      { stepNumber: 6, name: 'Staff Overwhelmed', nameEt: 'T\u00f6\u00f6tajad \u00fclekoormatud', affectedPillar: 'ICT Risk Management', impactPercent: 3, delayDays: 7, description: 'Compliance team stretched across multiple parallel implementation workstreams', descriptionEt: 'Vastavusmeeskond on venitatud mitme paralleelse rakendust\u00f6\u00f6voo vahel' }
    ];
    const totalDegradation = cascadeSteps.reduce((s, c) => s + c.impactPercent, 0);
    return {
      triggerId: 'regulatory-storm', triggerName: 'Regulatory Storm: 3 New Standards', triggerNameEt: 'Regulatiivne torm: 3 uut standardit',
      scoreBefore: currentScore, scoreAfter: Math.max(0, Math.round(currentScore - totalDegradation)),
      riskLevel: 'HIGH', affectedPillars: ['ICT Risk Management', 'Digital Operational Resilience Testing', 'ICT Third-Party Risk', 'ICT Incident Management'],
      cascadeSteps, totalDegradation, estimatedRecoveryDays: 75,
      remediationSteps: [
        { priority: 1, action: 'Conduct rapid impact assessment across all three new standards', actionEt: 'Vii l\u00e4bi kiire m\u00f5juhindamine k\u00f5igi kolme uue standardi l\u00f5ikes', effort: 'MEDIUM', timelineDays: 7, article: 'Art. 6' },
        { priority: 2, action: 'Prioritize gap analysis updates by implementation deadline', actionEt: 'Prioriseeri l\u00fcngaanal\u00fc\u00fcsi uuendused rakendamist\u00e4htaja j\u00e4rgi', effort: 'MEDIUM', timelineDays: 14, article: 'Art. 6' },
        { priority: 3, action: 'Engage external consultants to supplement internal capacity', actionEt: 'Kaasa v\u00e4liskonsultandid sisemise v\u00f5imekuse t\u00e4iendamiseks', effort: 'HIGH', timelineDays: 7, article: 'Art. 6' },
        { priority: 4, action: 'Update policies, procedures, and testing frameworks', actionEt: 'Uuenda poliitikaid, protseduure ja testimisraamistikke', effort: 'HIGH', timelineDays: 45, article: 'Art. 6' },
        { priority: 5, action: 'Communicate new requirements to all third-party providers', actionEt: 'Edasta uued n\u00f5uded k\u00f5igile kolmanda osapoole pakkujatele', effort: 'LOW', timelineDays: 14, article: 'Art. 28' }
      ]
    };
  }
}
