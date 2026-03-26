import { Injectable } from '@angular/core';

export interface ClassificationQuestion {
  id: string;
  questionKey: string;
  questionTextEn: string;
  questionTextEt: string;
  questionType: string;
  options: string | null;
  category: string;
  helpTextEn: string | null;
  helpTextEt: string | null;
  sortOrder: number;
  dependsOnKey: string | null;
  dependsOnAnswer: string | null;
}

export interface ClassificationResult {
  riskLevel: string;
  rationale: string;
  applicableArticles: string[];
  recommendedActions: string[];
  deadline: string;
}

const PROHIBITED_KEYS = [
  'PROHIBITED_SOCIAL_SCORING', 'PROHIBITED_SUBLIMINAL', 'PROHIBITED_VULNERABILITY',
  'PROHIBITED_FACIAL_SCRAPING', 'PROHIBITED_EMOTION_WORKPLACE',
  'PROHIBITED_BIOMETRIC_CATEGORIZATION', 'PROHIBITED_PREDICTIVE_POLICING'
];

const HIGH_RISK_ANNEX_III_KEYS = [
  'HIGH_BIOMETRICS', 'HIGH_CRITICAL_INFRASTRUCTURE', 'HIGH_EDUCATION', 'HIGH_EMPLOYMENT',
  'HIGH_ESSENTIAL_SERVICES', 'HIGH_LAW_ENFORCEMENT', 'HIGH_MIGRATION', 'HIGH_JUSTICE'
];

const HIGH_RISK_SAFETY_KEYS = ['HIGH_SAFETY_COMPONENT', 'HIGH_SAFETY_THIRD_PARTY'];

const LIMITED_RISK_KEYS = ['LIMITED_CHATBOT', 'LIMITED_SYNTHETIC_CONTENT', 'LIMITED_EMOTION_RECOGNITION'];

const EXEMPTION_KEYS = [
  'EXEMPTION_NARROW_PROCEDURAL', 'EXEMPTION_IMPROVE_HUMAN_ACTIVITY',
  'EXEMPTION_PREPARATORY_TASK', 'EXEMPTION_DETECT_PATTERNS'
];

const PROHIBITED_ARTICLES: Record<string, string> = {
  PROHIBITED_SOCIAL_SCORING: 'Article 5(1)(c)',
  PROHIBITED_SUBLIMINAL: 'Article 5(1)(a)',
  PROHIBITED_VULNERABILITY: 'Article 5(1)(b)',
  PROHIBITED_FACIAL_SCRAPING: 'Article 5(1)(e)',
  PROHIBITED_EMOTION_WORKPLACE: 'Article 5(1)(f)',
  PROHIBITED_BIOMETRIC_CATEGORIZATION: 'Article 5(1)(g)',
  PROHIBITED_PREDICTIVE_POLICING: 'Article 5(1)(d)'
};

const HIGH_RISK_ARTICLES: Record<string, string> = {
  HIGH_BIOMETRICS: 'Annex III, Area 1 \u2014 Biometrics',
  HIGH_CRITICAL_INFRASTRUCTURE: 'Annex III, Area 2 \u2014 Critical Infrastructure',
  HIGH_EDUCATION: 'Annex III, Area 3 \u2014 Education',
  HIGH_EMPLOYMENT: 'Annex III, Area 4 \u2014 Employment',
  HIGH_ESSENTIAL_SERVICES: 'Annex III, Area 5 \u2014 Essential Services',
  HIGH_LAW_ENFORCEMENT: 'Annex III, Area 6 \u2014 Law Enforcement',
  HIGH_MIGRATION: 'Annex III, Area 7 \u2014 Migration',
  HIGH_JUSTICE: 'Annex III, Area 8 \u2014 Justice'
};

const HIGH_RISK_OBLIGATION_ARTICLES = [
  'Article 9 \u2014 Risk Management System',
  'Article 10 \u2014 Data and Data Governance',
  'Article 11 \u2014 Technical Documentation',
  'Article 12 \u2014 Record-Keeping / Logging',
  'Article 13 \u2014 Transparency and Information to Deployers',
  'Article 14 \u2014 Human Oversight',
  'Article 15 \u2014 Accuracy, Robustness and Cybersecurity',
  'Article 17 \u2014 Quality Management System',
  'Article 27 \u2014 Fundamental Rights Impact Assessment (Deployers)',
  'Article 43 \u2014 Conformity Assessment',
  'Article 49 \u2014 EU Database Registration',
  'Article 72 \u2014 Post-Market Monitoring',
  'Article 73 \u2014 Serious Incident Reporting'
];

const HIGH_RISK_ACTIONS = [
  'Establish a risk management system (Article 9)',
  'Implement data governance procedures (Article 10)',
  'Prepare technical documentation (Article 11)',
  'Implement logging capabilities (Article 12)',
  'Ensure transparency to deployers (Article 13)',
  'Design human oversight mechanisms (Article 14)',
  'Test accuracy, robustness, and cybersecurity (Article 15)',
  'Establish quality management system (Article 17)',
  'Conduct fundamental rights impact assessment (Article 27)',
  'Plan conformity assessment (Article 43)',
  'Register in EU database (Article 49)'
];

@Injectable({ providedIn: 'root' })
export class AiActClassifierService {

  getQuestions(): ClassificationQuestion[] {
    let order = 0;
    const questions: ClassificationQuestion[] = [];

    const q = (key: string, textEn: string, textEt: string, category: string, helpEn: string | null, helpEt: string | null): ClassificationQuestion => ({
      id: key,
      questionKey: key,
      questionTextEn: textEn,
      questionTextEt: textEt,
      questionType: 'YES_NO',
      options: null,
      category,
      helpTextEn: helpEn,
      helpTextEt: helpEt,
      sortOrder: order++,
      dependsOnKey: null,
      dependsOnAnswer: null
    });

    // PROHIBITED (Article 5)
    questions.push(q('PROHIBITED_SOCIAL_SCORING',
      'Does this AI system evaluate or classify people based on social behavior or personal characteristics for social scoring?',
      'Kas see tehisintellektis\u00fcsteem hindab v\u00f5i klassifitseerib inimesi sotsiaalse k\u00e4itumise v\u00f5i isikuomaduste alusel sotsiaalse hindamise eesm\u00e4rgil?',
      'PROHIBITED',
      'Social scoring systems that evaluate trustworthiness are prohibited under Article 5(1)(c).',
      'Sotsiaalsed hindamiss\u00fcsteemid, mis hindavad usaldusv\u00e4\u00e4rsust, on artikli 5(1)(c) alusel keelatud.'));

    questions.push(q('PROHIBITED_SUBLIMINAL',
      'Does this AI system use subliminal, manipulative, or deceptive techniques to distort behavior?',
      'Kas see tehisintellektis\u00fcsteem kasutab alateadlikke, manipuleerivaid v\u00f5i petlikke tehnikaid k\u00e4itumise moonutamiseks?',
      'PROHIBITED',
      'AI systems using subliminal techniques beyond a person\'s consciousness are prohibited under Article 5(1)(a).',
      'Tehisintellektis\u00fcsteemid, mis kasutavad inimese teadvusest v\u00e4ljaspool olevaid alateadlikke tehnikaid, on artikli 5(1)(a) alusel keelatud.'));

    questions.push(q('PROHIBITED_VULNERABILITY',
      'Does this AI system exploit vulnerabilities of specific groups (age, disability, social situation)?',
      'Kas see tehisintellektis\u00fcsteem kasutab \u00e4ra konkreetsete r\u00fchmade haavatavusi (vanus, puue, sotsiaalne olukord)?',
      'PROHIBITED',
      'Exploiting vulnerabilities of specific groups is prohibited under Article 5(1)(b).',
      'Konkreetsete r\u00fchmade haavatavuste \u00e4rakasutamine on artikli 5(1)(b) alusel keelatud.'));

    questions.push(q('PROHIBITED_FACIAL_SCRAPING',
      'Does this AI system create or expand facial recognition databases through untargeted scraping?',
      'Kas see tehisintellektis\u00fcsteem loob v\u00f5i laiendab n\u00e4otuvastuselise andmebaase suunamata kraapimise teel?',
      'PROHIBITED',
      'Untargeted scraping of facial images from the internet or CCTV is prohibited under Article 5(1)(e).',
      'N\u00e4opiltide suunamata kraapimine internetist v\u00f5i CCTV-st on artikli 5(1)(e) alusel keelatud.'));

    questions.push(q('PROHIBITED_EMOTION_WORKPLACE',
      'Does this AI system infer emotions in workplaces or educational institutions (except medical/safety)?',
      'Kas see tehisintellektis\u00fcsteem tuletab emotsioone t\u00f6\u00f6kohtades v\u00f5i haridusasutustes (v.a meditsiini-/ohutuse eesm\u00e4rgil)?',
      'PROHIBITED',
      'Emotion inference in workplaces and educational institutions is prohibited under Article 5(1)(f), with medical and safety exceptions.',
      'Emotsioonide tuletamine t\u00f6\u00f6kohtades ja haridusasutustes on artikli 5(1)(f) alusel keelatud, v.a meditsiini- ja ohutuse erandid.'));

    questions.push(q('PROHIBITED_BIOMETRIC_CATEGORIZATION',
      'Does this AI system categorize people based on biometric data to infer race, political opinions, religion, or sexual orientation?',
      'Kas see tehisintellektis\u00fcsteem kategoriseerib inimesi biomeetriliste andmete alusel, et tuletada rassi, poliitilisi vaateid, usku v\u00f5i seksuaalset s\u00e4ttumust?',
      'PROHIBITED',
      'Biometric categorization to infer sensitive attributes is prohibited under Article 5(1)(g).',
      'Biomeetriline kategoriseerimine tundlike omaduste tuletamiseks on artikli 5(1)(g) alusel keelatud.'));

    questions.push(q('PROHIBITED_PREDICTIVE_POLICING',
      'Does this AI system make risk assessments of individuals for predicting criminal offenses based solely on profiling?',
      'Kas see tehisintellektis\u00fcsteem teostab isikute riskihindamisi kuritegevuse ennustamiseks ainult profiilianal\u00fc\u00fcsi alusel?',
      'PROHIBITED',
      'Individual predictive policing based solely on profiling is prohibited under Article 5(1)(d).',
      'Individuaalne ennustav politseitegevus ainult profiilianal\u00fc\u00fcsi alusel on artikli 5(1)(d) alusel keelatud.'));

    // HIGH RISK - Annex III
    questions.push(q('HIGH_BIOMETRICS',
      'Is this AI system used for biometric identification or categorization of natural persons?',
      'Kas seda tehisintellektis\u00fcsteemi kasutatakse f\u00fc\u00fcsiliste isikute biomeetriliseks tuvastamiseks v\u00f5i kategoriseerimiseks?',
      'HIGH_RISK',
      'Biometric identification systems are classified as high-risk under Annex III, Area 1.',
      'Biomeetrilised tuvastuss\u00fcsteemid on klassifitseeritud k\u00f5rge riskiga Annex III, piirkond 1 alusel.'));

    questions.push(q('HIGH_CRITICAL_INFRASTRUCTURE',
      'Is this AI system used as a safety component in critical infrastructure (traffic, utilities, digital)?',
      'Kas seda tehisintellektis\u00fcsteemi kasutatakse kriitilise taristu (liiklus, kommunaalteenused, digitaalne) ohutuskomponendina?',
      'HIGH_RISK',
      'AI safety components in critical infrastructure are high-risk under Annex III, Area 2.',
      'Tehisintellekti ohutuskomponendid kriitilises taristus on k\u00f5rge riskiga Annex III, piirkond 2 alusel.'));

    questions.push(q('HIGH_EDUCATION',
      'Is this AI system used in education for admission, assessment, or monitoring of students?',
      'Kas seda tehisintellektis\u00fcsteemi kasutatakse hariduses vastuv\u00f5tuks, hindamiseks v\u00f5i \u00f5pilaste j\u00e4lgimiseks?',
      'HIGH_RISK',
      'AI in educational admission, assessment, or monitoring is high-risk under Annex III, Area 3.',
      'Tehisintellekt haridusalases vastuv\u00f5tus, hindamises v\u00f5i j\u00e4lgimises on k\u00f5rge riskiga Annex III, piirkond 3 alusel.'));

    questions.push(q('HIGH_EMPLOYMENT',
      'Is this AI system used in employment for recruitment, selection, or HR decisions?',
      'Kas seda tehisintellektis\u00fcsteemi kasutatakse t\u00f6\u00f6h\u00f5ives v\u00e4rbamiseks, valikuks v\u00f5i personaliotsusteks?',
      'HIGH_RISK',
      'AI in recruitment, hiring, or HR decisions is high-risk under Annex III, Area 4.',
      'Tehisintellekt v\u00e4rbamises, t\u00f6\u00f6lev\u00f5tmises v\u00f5i personaliotsustes on k\u00f5rge riskiga Annex III, piirkond 4 alusel.'));

    questions.push(q('HIGH_ESSENTIAL_SERVICES',
      'Is this AI system used for access to essential services (credit scoring, insurance, social benefits)?',
      'Kas seda tehisintellektis\u00fcsteemi kasutatakse p\u00f5hiteenustele juurde\u0070\u00e4\u00e4suks (krediidiskoor, kindlustus, sotsiaaltoetused)?',
      'HIGH_RISK',
      'AI systems affecting access to essential services are high-risk under Annex III, Area 5.',
      'Tehisintellektis\u00fcsteemid, mis m\u00f5jutavad juurde\u0070\u00e4\u00e4su p\u00f5hiteenustele, on k\u00f5rge riskiga Annex III, piirkond 5 alusel.'));

    questions.push(q('HIGH_LAW_ENFORCEMENT',
      'Is this AI system used by law enforcement for risk assessment, lie detection, or evidence evaluation?',
      'Kas seda tehisintellektis\u00fcsteemi kasutavad \u00f5iguskaitseasutused riskihindamiseks, valetuvastuseks v\u00f5i t\u00f5endite hindamiseks?',
      'HIGH_RISK',
      'AI systems used in law enforcement are high-risk under Annex III, Area 6.',
      'Tehisintellektis\u00fcsteemid, mida kasutatakse \u00f5iguskaitseks, on k\u00f5rge riskiga Annex III, piirkond 6 alusel.'));

    questions.push(q('HIGH_MIGRATION',
      'Is this AI system used in migration, asylum, or border control?',
      'Kas seda tehisintellektis\u00fcsteemi kasutatakse migratsiooni, varjupaiga v\u00f5i piirikontrolli valdkonnas?',
      'HIGH_RISK',
      'AI used in migration and border management is high-risk under Annex III, Area 7.',
      'Tehisintellekt, mida kasutatakse migratsiooni ja piirikontrolli valdkonnas, on k\u00f5rge riskiga Annex III, piirkond 7 alusel.'));

    questions.push(q('HIGH_JUSTICE',
      'Is this AI system used in justice and democratic processes?',
      'Kas seda tehisintellektis\u00fcsteemi kasutatakse \u00f5igusem\u00f5istmise ja demokraatlike protsesside valdkonnas?',
      'HIGH_RISK',
      'AI in judicial or democratic processes is high-risk under Annex III, Area 8.',
      'Tehisintellekt kohtu- v\u00f5i demokraatlikes protsessides on k\u00f5rge riskiga Annex III, piirkond 8 alusel.'));

    // SAFETY (Art 6(1))
    questions.push(q('HIGH_SAFETY_COMPONENT',
      'Is this AI system a safety component of a product covered by EU product safety legislation?',
      'Kas see tehisintellektis\u00fcsteem on ELi tooteohutuse \u00f5igusaktidega h\u00f5lmatud toote ohutuskomponent?',
      'SAFETY',
      'AI systems that are safety components of regulated products are high-risk under Article 6(1).',
      'Tehisintellektis\u00fcsteemid, mis on reguleeritud toodete ohutuskomponendid, on k\u00f5rge riskiga artikli 6(1) alusel.'));

    questions.push(q('HIGH_SAFETY_THIRD_PARTY',
      'Does the product with this AI safety component require third-party conformity assessment?',
      'Kas toode, milles on see tehisintellekti ohutuskomponent, n\u00f5uab kolmanda osapoole vastavushindamist?',
      'SAFETY',
      'Products requiring third-party assessment and containing AI are high-risk under Article 6(1).',
      'Tooted, mis n\u00f5uavad kolmanda osapoole hindamist ja sisaldavad tehisintellekti, on k\u00f5rge riskiga artikli 6(1) alusel.'));

    // LIMITED (Art 50)
    questions.push(q('LIMITED_CHATBOT',
      'Does this AI system interact directly with natural persons (chatbot, virtual assistant)?',
      'Kas see tehisintellektis\u00fcsteem suhtleb otse f\u00fc\u00fcsiliste isikutega (vestlusrobot, virtuaalne assistent)?',
      'LIMITED',
      'AI systems interacting with persons must disclose their AI nature under Article 50(1).',
      'Isikutega suhtlevad tehisintellektis\u00fcsteemid peavad artikli 50(1) alusel avaldama oma tehisintellekti olemuse.'));

    questions.push(q('LIMITED_SYNTHETIC_CONTENT',
      'Does this AI system generate synthetic content (text, images, audio, video)?',
      'Kas see tehisintellektis\u00fcsteem genereerib s\u00fcnteetilist sisu (tekst, pildid, heli, video)?',
      'LIMITED',
      'Synthetic content must be labeled as AI-generated under Article 50(2)(4).',
      'S\u00fcnteetiline sisu peab olema m\u00e4rgitud tehisintellekti poolt genereerituks artikli 50(2)(4) alusel.'));

    questions.push(q('LIMITED_EMOTION_RECOGNITION',
      'Does this AI system perform emotion recognition or biometric categorization?',
      'Kas see tehisintellektis\u00fcsteem teostab emotsioonituvastust v\u00f5i biomeetrilist kategoriseerimist?',
      'LIMITED',
      'Emotion recognition systems must disclose this to exposed persons under Article 50(3).',
      'Emotsioonituvastuss\u00fcsteemid peavad artikli 50(3) alusel seda avaldama puudutatud isikutele.'));

    // EXEMPTION (Art 6(3))
    questions.push(q('EXEMPTION_NARROW_PROCEDURAL',
      'Does this AI system perform only a narrow procedural task?',
      'Kas see tehisintellektis\u00fcsteem t\u00e4idab ainult kitsast protseduuri \u00fclesannet?',
      'EXEMPTION', null, null));

    questions.push(q('EXEMPTION_IMPROVE_HUMAN_ACTIVITY',
      'Does this AI system only improve the result of a previously completed human activity?',
      'Kas see tehisintellektis\u00fcsteem ainult parandab varem l\u00f5petatud inimtegevuse tulemust?',
      'EXEMPTION', null, null));

    questions.push(q('EXEMPTION_PREPARATORY_TASK',
      'Is this AI system used only for a preparatory task for an assessment?',
      'Kas seda tehisintellektis\u00fcsteemi kasutatakse ainult hindamise ettevalmistava \u00fclesande jaoks?',
      'EXEMPTION', null, null));

    questions.push(q('EXEMPTION_DETECT_PATTERNS',
      'Does this AI system only detect patterns without replacing human assessment?',
      'Kas see tehisintellektis\u00fcsteem ainult tuvastab mustreid, asendamata inimhinnangut?',
      'EXEMPTION', null, null));

    return questions;
  }

  classify(answers: Record<string, string>): ClassificationResult {
    const isYes = (key: string) => {
      const v = answers[key];
      return v === 'YES' || v === 'true';
    };

    // 1. Check PROHIBITED
    const triggeredProhibited = PROHIBITED_KEYS.filter(k => isYes(k));
    if (triggeredProhibited.length > 0) {
      const articles = triggeredProhibited.map(k => PROHIBITED_ARTICLES[k]).filter(Boolean);
      return {
        riskLevel: 'UNACCEPTABLE',
        rationale: 'This AI system falls under prohibited AI practices as defined in Article 5 of the AI Act.',
        applicableArticles: articles,
        recommendedActions: [
          'Immediately cease deployment of this AI system',
          'Consult legal counsel specialized in AI regulation',
          'Document the decision and notify relevant stakeholders'
        ],
        deadline: 'Already in effect (since February 2025)'
      };
    }

    // 2. Check Annex III high-risk
    const triggeredAnnexIII = HIGH_RISK_ANNEX_III_KEYS.filter(k => isYes(k));
    if (triggeredAnnexIII.length > 0) {
      const allExempted = EXEMPTION_KEYS.every(k => isYes(k));
      if (!allExempted) {
        const articles = [
          ...triggeredAnnexIII.map(k => HIGH_RISK_ARTICLES[k]).filter(Boolean),
          ...HIGH_RISK_OBLIGATION_ARTICLES
        ];
        return {
          riskLevel: 'HIGH',
          rationale: 'This AI system is classified as high-risk under Annex III of the AI Act.',
          applicableArticles: articles,
          recommendedActions: HIGH_RISK_ACTIONS,
          deadline: '2 August 2026'
        };
      }
    }

    // 3. Check safety component
    const triggeredSafety = HIGH_RISK_SAFETY_KEYS.filter(k => isYes(k));
    if (triggeredSafety.length > 0) {
      const articles = [
        'Article 6(1) \u2014 Safety component of regulated product',
        ...HIGH_RISK_OBLIGATION_ARTICLES
      ];
      return {
        riskLevel: 'HIGH',
        rationale: 'This AI system is a safety component of a product covered by EU harmonization legislation (Article 6(1)), making it high-risk.',
        applicableArticles: articles,
        recommendedActions: HIGH_RISK_ACTIONS,
        deadline: '2 August 2027 (Annex I products)'
      };
    }

    // 4. Check limited risk
    const triggeredLimited = LIMITED_RISK_KEYS.filter(k => isYes(k));
    if (triggeredLimited.length > 0) {
      const articles: string[] = [];
      if (isYes('LIMITED_CHATBOT')) articles.push('Article 50(1) \u2014 AI interaction disclosure');
      if (isYes('LIMITED_SYNTHETIC_CONTENT')) articles.push('Article 50(2)(4) \u2014 Synthetic content labeling');
      if (isYes('LIMITED_EMOTION_RECOGNITION')) articles.push('Article 50(3) \u2014 Emotion recognition disclosure');
      return {
        riskLevel: 'LIMITED',
        rationale: 'This AI system has transparency obligations under Article 50 of the AI Act.',
        applicableArticles: articles,
        recommendedActions: [
          'Implement clear disclosure that users are interacting with AI',
          'Label AI-generated content appropriately',
          'Ensure transparency information is accessible and understandable',
          'Document transparency measures taken'
        ],
        deadline: '2 August 2026'
      };
    }

    // 5. Default MINIMAL
    return {
      riskLevel: 'MINIMAL',
      rationale: 'This AI system does not fall under any regulated category of the AI Act. No specific compliance obligations apply, though voluntary codes of conduct are encouraged.',
      applicableArticles: ['Article 95 \u2014 Voluntary codes of conduct'],
      recommendedActions: [
        'Consider adopting voluntary codes of conduct',
        'Maintain basic documentation of the AI system',
        'Monitor regulatory updates for potential reclassification'
      ],
      deadline: 'N/A \u2014 no mandatory compliance deadline'
    };
  }
}
