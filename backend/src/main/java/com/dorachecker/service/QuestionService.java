package com.dorachecker.service;

import com.dorachecker.model.DoraQuestion;
import com.dorachecker.model.DoraQuestion.QuestionCategory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionService {

    private final List<DoraQuestion> questions = List.of(
            new DoraQuestion(1,
                    "Kas leping määratleb ICT teenuse ulatuse ja kvaliteedi?",
                    "Does the contract define the scope and quality of the ICT service?",
                    "DORA Art. 30(2)(a)",
                    "DORA nõuab, et ICT lepingud sisaldaksid selget teenuse kirjeldust, sh ulatust, kvaliteeti ja teenustasemeid. See tagab, et mõlemad pooled mõistavad kohustusi.",
                    "Lisage lepingusse detailne teenuse kirjeldus koos kvaliteedinõuetega.",
                    QuestionCategory.SERVICE_LEVEL),

            new DoraQuestion(2,
                    "Kas on teenustasemed (SLA) mõõdetavate KPI-dega?",
                    "Are there service levels (SLA) with measurable KPIs?",
                    "DORA Art. 30(2)(a)",
                    "Mõõdetavad KPI-d on vajalikud teenuse kvaliteedi jälgimiseks ja lepingu täitmise kontrollimiseks. Ilma nendeta puudub objektiivne alus teenuse hindamiseks.",
                    "Määratlege konkreetsed KPI-d nagu kättesaadavus (%), reageerimisaeg ja lahendusaeg.",
                    QuestionCategory.SERVICE_LEVEL),

            new DoraQuestion(3,
                    "Kas teenusepakkuja teavitab intsidentidest 24h jooksul?",
                    "Does the provider notify about incidents within 24 hours?",
                    "DORA Art. 30(2)(e)",
                    "Kiire intsidentidest teavitamine on kriitilise tähtsusega, et finantsasutus saaks õigeaegselt reageerida ja täita oma teavituskohustusi järelevalveasutuste ees.",
                    "Lisage lepingusse intsidentidest teavitamise kord koos ajaliste piirangutega.",
                    QuestionCategory.INCIDENT),

            new DoraQuestion(4,
                    "Kas lepingus on auditeerimisõiguse klausel?",
                    "Does the contract include an audit right clause?",
                    "DORA Art. 30(2)(d)",
                    "Auditeerimisõigus võimaldab finantsasutusel ja järelevalveasutustel kontrollida teenusepakkuja tegevust, turvameetmeid ja lepingu täitmist.",
                    "Lisage klausel, mis annab õiguse auditeerida teenusepakkujat, sh kohapealsed kontrollid.",
                    QuestionCategory.AUDIT),

            new DoraQuestion(5,
                    "Kas on exit-strateegia lepingu lõppemisel?",
                    "Is there an exit strategy for contract termination?",
                    "DORA Art. 30(2)(f)",
                    "Exit-strateegia tagab teenuse sujuva ülemineku teisele pakkujale või in-house lahendusele, vältides teenuse katkestusi ja andmete kaotust.",
                    "Koostage detailne exit-plaan koos ajakava, andmete migratsiooni ja üleminekuperioodiga.",
                    QuestionCategory.EXIT_STRATEGY),

            new DoraQuestion(6,
                    "Kas andmete asukoht on määratletud (EL/mitte-EL)?",
                    "Is the data location defined (EU/non-EU)?",
                    "DORA Art. 30(2)(b)",
                    "Andmete asukoha teadmine on oluline andmekaitse, suveräänsuse ja regulatiivsete nõuete täitmise seisukohalt. EL-välised asukohad võivad tekitada täiendavaid riske.",
                    "Fikseerige lepingus andmete töötlemise ja hoiustamise asukohad ning piirangud.",
                    QuestionCategory.DATA),

            new DoraQuestion(7,
                    "Kas subkontraktorite kasutamine nõuab nõusolekut?",
                    "Does the use of subcontractors require consent?",
                    "DORA Art. 30(2)(a)",
                    "Subkontraktorite kontrollimatu kasutamine suurendab tarneahela riske. Finantsasutusel peab olema ülevaade ja kontroll allhankijate üle.",
                    "Nõudke lepingus eelnevat kirjalikku nõusolekut subkontraktorite kaasamiseks.",
                    QuestionCategory.SUBCONTRACTING),

            new DoraQuestion(8,
                    "Kas on andmete tagastamise klausel?",
                    "Is there a data return clause?",
                    "DORA Art. 30(2)(f)",
                    "Andmete tagastamise klausel tagab, et lepingu lõppemisel saab finantsasutus kõik oma andmed tagasi turvalises ja kasutatavas formaadis.",
                    "Määratlege andmete tagastamise formaat, ajakava ja kustutamise kord lepingu lõppemisel.",
                    QuestionCategory.EXIT_STRATEGY),

            new DoraQuestion(9,
                    "Kas teenusepakkuja järgib küberturvalisuse standardeid?",
                    "Does the provider follow cybersecurity standards?",
                    "DORA Art. 30(2)(c)",
                    "Küberturvalisuse standardite järgimine (nt ISO 27001, SOC 2) annab kindluse, et teenusepakkuja rakendab piisavaid turvameetmeid.",
                    "Nõudke tunnustatud turvastandardite sertifikaate ja regulaarset vastavuse tõendamist.",
                    QuestionCategory.RISK),

            new DoraQuestion(10,
                    "Kas on disaster recovery nõuded?",
                    "Are there disaster recovery requirements?",
                    "DORA Art. 30(2)(c)",
                    "Disaster recovery plaan tagab teenuse taastamise kriisiolukordades. DORA nõuab, et kriitiliste ICT teenuste jaoks oleks olemas taasteplaan.",
                    "Lisage lepingusse RTO/RPO nõuded ja regulaarsed taastamistestid.",
                    QuestionCategory.CONTINUITY),

            new DoraQuestion(11,
                    "Kas on konfidentsiaalsuskohustus?",
                    "Is there a confidentiality obligation?",
                    "DORA Art. 30(2)(b)",
                    "Konfidentsiaalsuskohustus kaitseb finantsasutuse tundlikku teavet ja kliendiandmeid volitamata avaldamise eest.",
                    "Lisage lepingusse konfidentsiaalsusklausel, mis kehtib ka pärast lepingu lõppemist.",
                    QuestionCategory.LEGAL),

            new DoraQuestion(12,
                    "Kas vastutuse piirid on määratud?",
                    "Are liability limits defined?",
                    "DORA Art. 30(2)(a)",
                    "Vastutuse piiride selge määratlemine kaitseb finantsasutust ülemääraste riskide eest ja tagab, et teenusepakkuja kannab vastutust oma kohustuste rikkumise eest.",
                    "Määratlege vastutuse ülem- ja alampiirid ning vastutuse jaotus poolte vahel.",
                    QuestionCategory.LEGAL),

            new DoraQuestion(13,
                    "Kas tehakse regulaarseid turvateste?",
                    "Are regular security tests conducted?",
                    "DORA Art. 30(2)(c)",
                    "Regulaarsed turvatestid (penetratsioonitestid, haavatavuste skaneerimine) on vajalikud turvalisuse taseme hindamiseks ja nõrkuste tuvastamiseks.",
                    "Nõudke vähemalt iga-aastaseid penetratsiooniteste ja kvartaalseid haavatavuste skaneerimisi.",
                    QuestionCategory.RISK),

            new DoraQuestion(14,
                    "Kas on koostöö finantsjärelevalvega?",
                    "Is there cooperation with financial supervisory authorities?",
                    "DORA Art. 30(2)(d)",
                    "Teenusepakkuja peab olema valmis tegema koostööd finantsjärelevalve asutustega, sh võimaldama juurdepääsu ja auditeid.",
                    "Lisage klausel teenusepakkuja kohustusest teha koostööd järelevalveasutustega.",
                    QuestionCategory.AUDIT),

            new DoraQuestion(15,
                    "Kas on teenusepakkuja maksejõuetuse klausel?",
                    "Is there a provider insolvency clause?",
                    "DORA Art. 30(2)(f)",
                    "Maksejõuetuse klausel kaitseb finantsasutust olukorras, kus teenusepakkuja muutub maksejõuetuks, tagades teenuse jätkuvuse ja andmete kättesaadavuse.",
                    "Lisage lepingusse sätted teenuse jätkuvuse ja andmete tagastamise kohta pakkuja maksejõuetuse korral.",
                    QuestionCategory.CONTINUITY),

            // Finestmedia värbamisprotsessi probleemidest tulenevad küsimused
            new DoraQuestion(16,
                    "Kas teenusepakkuja annab kandidaatidele värbamisprotsessis tagasisidet?",
                    "Does the provider give candidates feedback during the recruitment process?",
                    "Finestmedia audit – värbamine",
                    "Finestmedia värbamisprotsessis tuvastati, et kandidaatidele ei antud pärast intervjuud lõplikku tagasisidet. See viitab kommunikatsiooniprobleemidele ja võib kahjustada tööandja mainet ning raskendada kvalifitseeritud ICT-spetsialistide leidmist.",
                    "Kehtestage värbamisprotsessis kohustuslik tagasisideetapp – iga kandidaat peab saama vastuse hiljemalt 5 tööpäeva jooksul.",
                    QuestionCategory.RECRUITMENT),

            new DoraQuestion(17,
                    "Kas teenusepakkujal on kaugtööks kohandatud sisseelamisprotsess?",
                    "Does the provider have a remote-adapted onboarding process?",
                    "Finestmedia audit – värbamine",
                    "Finestmedia personalijuht tunnistas, et sisseelamisprotsess tuleb kaugtöö tingimustes täielikult ümber mõtestada. Puudulik onboarding suurendab riski, et uued töötajad ei integreeru meeskonda ja teevad kriitilistes süsteemides vigu.",
                    "Töötage välja struktureeritud kaugtöö sisseelamisplaan koos mentori määramisega, regulaarsete kontrollkohtumistega ja selgete esimese 90 päeva eesmärkidega.",
                    QuestionCategory.RECRUITMENT),

            new DoraQuestion(18,
                    "Kas teenusepakkuja töötajate voolavus on stabiilne?",
                    "Is the provider's employee turnover stable?",
                    "Finestmedia audit – värbamine",
                    "Finestmedia töötajate arv kõikus märkimisväärselt (65→59→70→80 aastatel 2021–2024), mis viitab võimalikele hoidmisprobleemidele. Kõrge voolavus ICT-teenusepakkujas ohustab teenuse kvaliteeti ja teadmiste järjepidevust.",
                    "Nõudke teenusepakkujalt töötajate voolavuse statistikat ja personali stabiilsusplaani. Lisage lepingusse klausel võtmetöötajate vahetumisest teavitamise kohta.",
                    QuestionCategory.RECRUITMENT),

            // Finestmedia majandusaruannetest tulenevad küsimused
            new DoraQuestion(19,
                    "Kas teenusepakkuja kasumimarginaal on jätkusuutlik?",
                    "Is the provider's profit margin sustainable?",
                    "Finestmedia audit – finantsid",
                    "Finestmedia kasumimarginaal 2024. aastal oli vaid 0,17% (€11 754 kasumit €6,7M käibelt). Äärmiselt õhuke marginaal seab kahtluse alla teenusepakkuja pikaajalise jätkusuutlikkuse ja võime investeerida teenuse kvaliteeti.",
                    "Analüüsige teenusepakkuja viimase 3 aasta finantsaruandeid. Kasumimarginaal alla 3% on hoiatusmärk – kaaluge riskimaandamismeetmeid.",
                    QuestionCategory.FINANCIAL_REPORTING),

            new DoraQuestion(20,
                    "Kas teenusepakkuja käibekapital on positiivne?",
                    "Is the provider's working capital positive?",
                    "Finestmedia audit – finantsid",
                    "Finestmedia negatiivne käibekapital (-€473 592 aastal 2024, prognoos -€743 178 aastal 2025) näitab, et lühiajalised kohustused ületavad käibevarasid. See tekitab likviidsusriski ja võib ohustada teenuse osutamise jätkuvust.",
                    "Nõudke teenusepakkujalt kvartaalseid finantsaruandeid. Negatiivne käibekapital nõuab kohest riskihindamist ja exit-plaani aktiveerimise kaalumist.",
                    QuestionCategory.FINANCIAL_REPORTING),

            new DoraQuestion(21,
                    "Kas teenusepakkujal on olnud ootamatuid suuri kahjumeid?",
                    "Has the provider experienced unexpected large losses?",
                    "Finestmedia audit – finantsid",
                    "Finestmedia kandis 2022. aastal maha immateriaalseid varasid summas €616 577, mis tõi kaasa puhaskahjumi -€692 116. Sellised ootamatud suured mahakandmised viitavad varade ülehindamisele või strateegilistele eksimustele, mis seavad kahtluse alla juhtimise kvaliteedi.",
                    "Kontrollige teenusepakkuja viimase 5 aasta kasumiaruandeid erakorraliste kulude osas. Nõudke selgitust suuremate mahakandmiste ja ühekordsete kulude kohta.",
                    QuestionCategory.FINANCIAL_REPORTING),

            new DoraQuestion(22,
                    "Kas teenusepakkuja kohustuste kasv on proportsionaalne varade kasvuga?",
                    "Is the provider's liability growth proportional to asset growth?",
                    "Finestmedia audit – finantsid",
                    "Finestmedia kohustused kasvavad varadest kiiremini (võlakordaja tõusis 0,67-lt 0,71-le). Kasvav finantsvõimendus suurendab maksejõuetusriski ja võib ohustada teenuse jätkuvust.",
                    "Jälgige teenusepakkuja võlakordaja (kohustused/varad) dünaamikat. Kordaja üle 0,7 on hoiatusmärk – kaaluge täiendavaid garantiisid.",
                    QuestionCategory.FINANCIAL_REPORTING)
    );

    public List<DoraQuestion> getAllQuestions() {
        return questions;
    }

    public DoraQuestion getQuestion(int id) {
        return questions.stream()
                .filter(q -> q.id() == id)
                .findFirst()
                .orElse(null);
    }
}
