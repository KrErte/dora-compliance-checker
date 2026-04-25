package com.dorachecker.service;

import com.dorachecker.model.ClassificationQuestionEntity;
import com.dorachecker.model.ClassificationQuestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiActClassificationQuestionSeeder {

  private static final Logger log =
      LoggerFactory.getLogger(AiActClassificationQuestionSeeder.class);

  @Bean
  public ApplicationRunner seedAiActClassificationQuestions(ClassificationQuestionRepository repo) {
    return args -> {
      if (repo.countByActiveTrue() > 0) {
        log.info("AI Act classification questions already seeded, skipping.");
        return;
      }
      log.info("Seeding AI Act classification questions...");
      int order = 0;

      // === PROHIBITED (Article 5) ===
      repo.save(
          question(
              "PROHIBITED_SOCIAL_SCORING",
              "Does this AI system evaluate or classify people based on social behavior or personal characteristics for social scoring?",
              "Kas see tehisintellektisüsteem hindab või klassifitseerib inimesi sotsiaalse käitumise või isikuomaduste alusel sotsiaalse hindamise eesmärgil?",
              "PROHIBITED",
              order++,
              "Social scoring systems that evaluate trustworthiness are prohibited under Article 5(1)(c).",
              "Sotsiaalsed hindamissüsteemid, mis hindavad usaldusväärsust, on artikli 5(1)(c) alusel keelatud."));

      repo.save(
          question(
              "PROHIBITED_SUBLIMINAL",
              "Does this AI system use subliminal, manipulative, or deceptive techniques to distort behavior?",
              "Kas see tehisintellektisüsteem kasutab alateadlikke, manipuleerivaid või petlikke tehnikaid käitumise moonutamiseks?",
              "PROHIBITED",
              order++,
              "AI systems using subliminal techniques beyond a person's consciousness are prohibited under Article 5(1)(a).",
              "Tehisintellektisüsteemid, mis kasutavad inimese teadvusest väljaspool olevaid alateadlikke tehnikaid, on artikli 5(1)(a) alusel keelatud."));

      repo.save(
          question(
              "PROHIBITED_VULNERABILITY",
              "Does this AI system exploit vulnerabilities of specific groups (age, disability, social situation)?",
              "Kas see tehisintellektisüsteem kasutab ära konkreetsete rühmade haavatavusi (vanus, puue, sotsiaalne olukord)?",
              "PROHIBITED",
              order++,
              "Exploiting vulnerabilities of specific groups is prohibited under Article 5(1)(b).",
              "Konkreetsete rühmade haavatavuste ärakasutamine on artikli 5(1)(b) alusel keelatud."));

      repo.save(
          question(
              "PROHIBITED_FACIAL_SCRAPING",
              "Does this AI system create or expand facial recognition databases through untargeted scraping?",
              "Kas see tehisintellektisüsteem loob või laiendab näotuvastuselise andmebaase suunamata kraapimise teel?",
              "PROHIBITED",
              order++,
              "Untargeted scraping of facial images from the internet or CCTV is prohibited under Article 5(1)(e).",
              "Näopiltide suunamata kraapimine internetist või CCTV-st on artikli 5(1)(e) alusel keelatud."));

      repo.save(
          question(
              "PROHIBITED_EMOTION_WORKPLACE",
              "Does this AI system infer emotions in workplaces or educational institutions (except medical/safety)?",
              "Kas see tehisintellektisüsteem tuletab emotsioone töökohtades või haridusasutustes (v.a meditsiini-/ohutuse eesmärgil)?",
              "PROHIBITED",
              order++,
              "Emotion inference in workplaces and educational institutions is prohibited under Article 5(1)(f), with medical and safety exceptions.",
              "Emotsioonide tuletamine töökohtades ja haridusasutustes on artikli 5(1)(f) alusel keelatud, v.a meditsiini- ja ohutuse erandid."));

      repo.save(
          question(
              "PROHIBITED_BIOMETRIC_CATEGORIZATION",
              "Does this AI system categorize people based on biometric data to infer race, political opinions, religion, or sexual orientation?",
              "Kas see tehisintellektisüsteem kategoriseerib inimesi biomeetriliste andmete alusel, et tuletada rassi, poliitilisi vaateid, usku või seksuaalset sättumust?",
              "PROHIBITED",
              order++,
              "Biometric categorization to infer sensitive attributes is prohibited under Article 5(1)(g).",
              "Biomeetriline kategoriseerimine tundlike omaduste tuletamiseks on artikli 5(1)(g) alusel keelatud."));

      repo.save(
          question(
              "PROHIBITED_PREDICTIVE_POLICING",
              "Does this AI system make risk assessments of individuals for predicting criminal offenses based solely on profiling?",
              "Kas see tehisintellektisüsteem teostab isikute riskihindamisi kuritegevuse ennustamiseks ainult profiilianalüüsi alusel?",
              "PROHIBITED",
              order++,
              "Individual predictive policing based solely on profiling is prohibited under Article 5(1)(d).",
              "Individuaalne ennustav politseitegevus ainult profiilianalüüsi alusel on artikli 5(1)(d) alusel keelatud."));

      // === HIGH RISK — Annex III ===
      repo.save(
          question(
              "HIGH_BIOMETRICS",
              "Is this AI system used for biometric identification or categorization of natural persons?",
              "Kas seda tehisintellektisüsteemi kasutatakse füüsiliste isikute biomeetriliseks tuvastamiseks või kategoriseerimiseks?",
              "HIGH_RISK",
              order++,
              "Biometric identification systems are classified as high-risk under Annex III, Area 1.",
              "Biomeetrilised tuvastussüsteemid on klassifitseeritud kõrge riskiga Annex III, piirkond 1 alusel."));

      repo.save(
          question(
              "HIGH_CRITICAL_INFRASTRUCTURE",
              "Is this AI system used as a safety component in critical infrastructure (traffic, utilities, digital)?",
              "Kas seda tehisintellektisüsteemi kasutatakse kriitilise taristu (liiklus, kommunaalteenused, digitaalne) ohutuskomponendina?",
              "HIGH_RISK",
              order++,
              "AI safety components in critical infrastructure are high-risk under Annex III, Area 2.",
              "Tehisintellekti ohutuskomponendid kriitilises taristus on kõrge riskiga Annex III, piirkond 2 alusel."));

      repo.save(
          question(
              "HIGH_EDUCATION",
              "Is this AI system used in education for admission, assessment, or monitoring of students?",
              "Kas seda tehisintellektisüsteemi kasutatakse hariduses vastuvõtuks, hindamiseks või õpilaste jälgimiseks?",
              "HIGH_RISK",
              order++,
              "AI in educational admission, assessment, or monitoring is high-risk under Annex III, Area 3.",
              "Tehisintellekt haridusalases vastuvõtus, hindamises või jälgimises on kõrge riskiga Annex III, piirkond 3 alusel."));

      repo.save(
          question(
              "HIGH_EMPLOYMENT",
              "Is this AI system used in employment for recruitment, selection, or HR decisions?",
              "Kas seda tehisintellektisüsteemi kasutatakse tööhõives värbamiseks, valikuks või personaliotsusteks?",
              "HIGH_RISK",
              order++,
              "AI in recruitment, hiring, or HR decisions is high-risk under Annex III, Area 4.",
              "Tehisintellekt värbamises, töölevõtmises või personaliotsustes on kõrge riskiga Annex III, piirkond 4 alusel."));

      repo.save(
          question(
              "HIGH_ESSENTIAL_SERVICES",
              "Is this AI system used for access to essential services (credit scoring, insurance, social benefits)?",
              "Kas seda tehisintellektisüsteemi kasutatakse põhiteenustele juurdepääsuks (krediidiskoor, kindlustus, sotsiaaltoetused)?",
              "HIGH_RISK",
              order++,
              "AI systems affecting access to essential services are high-risk under Annex III, Area 5.",
              "Tehisintellektisüsteemid, mis mõjutavad juurdepääsu põhiteenustele, on kõrge riskiga Annex III, piirkond 5 alusel."));

      repo.save(
          question(
              "HIGH_LAW_ENFORCEMENT",
              "Is this AI system used by law enforcement for risk assessment, lie detection, or evidence evaluation?",
              "Kas seda tehisintellektisüsteemi kasutavad õiguskaitseasutused riskihindamiseks, valetuvastuseks või tõendite hindamiseks?",
              "HIGH_RISK",
              order++,
              "AI systems used in law enforcement are high-risk under Annex III, Area 6.",
              "Tehisintellektisüsteemid, mida kasutatakse õiguskaitseks, on kõrge riskiga Annex III, piirkond 6 alusel."));

      repo.save(
          question(
              "HIGH_MIGRATION",
              "Is this AI system used in migration, asylum, or border control?",
              "Kas seda tehisintellektisüsteemi kasutatakse migratsiooni, varjupaiga või piirikontrolli valdkonnas?",
              "HIGH_RISK",
              order++,
              "AI used in migration and border management is high-risk under Annex III, Area 7.",
              "Tehisintellekt, mida kasutatakse migratsiooni ja piirikontrolli valdkonnas, on kõrge riskiga Annex III, piirkond 7 alusel."));

      repo.save(
          question(
              "HIGH_JUSTICE",
              "Is this AI system used in justice and democratic processes?",
              "Kas seda tehisintellektisüsteemi kasutatakse õigusemõistmise ja demokraatlike protsesside valdkonnas?",
              "HIGH_RISK",
              order++,
              "AI in judicial or democratic processes is high-risk under Annex III, Area 8.",
              "Tehisintellekt kohtu- või demokraatlikes protsessides on kõrge riskiga Annex III, piirkond 8 alusel."));

      // === HIGH RISK — Safety Component (Art 6(1)) ===
      repo.save(
          question(
              "HIGH_SAFETY_COMPONENT",
              "Is this AI system a safety component of a product covered by EU product safety legislation?",
              "Kas see tehisintellektisüsteem on ELi tooteohutuse õigusaktidega hõlmatud toote ohutuskomponent?",
              "SAFETY",
              order++,
              "AI systems that are safety components of regulated products are high-risk under Article 6(1).",
              "Tehisintellektisüsteemid, mis on reguleeritud toodete ohutuskomponendid, on kõrge riskiga artikli 6(1) alusel."));

      repo.save(
          question(
              "HIGH_SAFETY_THIRD_PARTY",
              "Does the product with this AI safety component require third-party conformity assessment?",
              "Kas toode, milles on see tehisintellekti ohutuskomponent, nõuab kolmanda osapoole vastavushindamist?",
              "SAFETY",
              order++,
              "Products requiring third-party assessment and containing AI are high-risk under Article 6(1).",
              "Tooted, mis nõuavad kolmanda osapoole hindamist ja sisaldavad tehisintellekti, on kõrge riskiga artikli 6(1) alusel."));

      // === LIMITED RISK (Art 50) ===
      repo.save(
          question(
              "LIMITED_CHATBOT",
              "Does this AI system interact directly with natural persons (chatbot, virtual assistant)?",
              "Kas see tehisintellektisüsteem suhtleb otse füüsiliste isikutega (vestlusrobot, virtuaalne assistent)?",
              "LIMITED",
              order++,
              "AI systems interacting with persons must disclose their AI nature under Article 50(1).",
              "Isikutega suhtlevad tehisintellektisüsteemid peavad artikli 50(1) alusel avaldama oma tehisintellekti olemuse."));

      repo.save(
          question(
              "LIMITED_SYNTHETIC_CONTENT",
              "Does this AI system generate synthetic content (text, images, audio, video)?",
              "Kas see tehisintellektisüsteem genereerib sünteetilist sisu (tekst, pildid, heli, video)?",
              "LIMITED",
              order++,
              "Synthetic content must be labeled as AI-generated under Article 50(2)(4).",
              "Sünteetiline sisu peab olema märgitud tehisintellekti poolt genereerituks artikli 50(2)(4) alusel."));

      repo.save(
          question(
              "LIMITED_EMOTION_RECOGNITION",
              "Does this AI system perform emotion recognition or biometric categorization?",
              "Kas see tehisintellektisüsteem teostab emotsioonituvastust või biomeetrilist kategoriseerimist?",
              "LIMITED",
              order++,
              "Emotion recognition systems must disclose this to exposed persons under Article 50(3).",
              "Emotsioonituvastussüsteemid peavad artikli 50(3) alusel seda avaldama puudutatud isikutele."));

      // === EXEMPTIONS (Art 6(3)) ===
      repo.save(
          question(
              "EXEMPTION_NARROW_PROCEDURAL",
              "Does this AI system perform only a narrow procedural task?",
              "Kas see tehisintellektisüsteem täidab ainult kitsast protseduuri ülesannet?",
              "EXEMPTION",
              order++,
              null,
              null));

      repo.save(
          question(
              "EXEMPTION_IMPROVE_HUMAN_ACTIVITY",
              "Does this AI system only improve the result of a previously completed human activity?",
              "Kas see tehisintellektisüsteem ainult parandab varem lõpetatud inimtegevuse tulemust?",
              "EXEMPTION",
              order++,
              null,
              null));

      repo.save(
          question(
              "EXEMPTION_PREPARATORY_TASK",
              "Is this AI system used only for a preparatory task for an assessment?",
              "Kas seda tehisintellektisüsteemi kasutatakse ainult hindamise ettevalmistava ülesande jaoks?",
              "EXEMPTION",
              order++,
              null,
              null));

      repo.save(
          question(
              "EXEMPTION_DETECT_PATTERNS",
              "Does this AI system only detect patterns without replacing human assessment?",
              "Kas see tehisintellektisüsteem ainult tuvastab mustreid, asendamata inimhinnangut?",
              "EXEMPTION",
              order++,
              null,
              null));

      log.info("Seeded {} AI Act classification questions.", order);
    };
  }

  private ClassificationQuestionEntity question(
      String key,
      String textEn,
      String textEt,
      String category,
      int order,
      String helpEn,
      String helpEt) {
    ClassificationQuestionEntity q = new ClassificationQuestionEntity();
    q.setQuestionKey(key);
    q.setQuestionTextEn(textEn);
    q.setQuestionTextEt(textEt);
    q.setQuestionType("YES_NO");
    q.setCategory(category);
    q.setSortOrder(order);
    q.setHelpTextEn(helpEn);
    q.setHelpTextEt(helpEt);
    q.setActive(true);
    return q;
  }
}
