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
                    "DORA Art. 30 – personaliriskid",
                    "ICT-teenusepakkuja värbamisprotsessis võib esineda kommunikatsiooniprobleeme, kus kandidaatidele ei anta pärast intervjuud lõplikku tagasisidet. See võib kahjustada tööandja mainet ning raskendada kvalifitseeritud ICT-spetsialistide leidmist.",
                    "Kehtestage värbamisprotsessis kohustuslik tagasisideetapp – iga kandidaat peab saama vastuse hiljemalt 5 tööpäeva jooksul.",
                    QuestionCategory.RECRUITMENT),

            new DoraQuestion(17,
                    "Kas teenusepakkujal on kaugtööks kohandatud sisseelamisprotsess?",
                    "Does the provider have a remote-adapted onboarding process?",
                    "DORA Art. 30 – personaliriskid",
                    "Kaugtöö tingimustes tuleb sisseelamisprotsess põhjalikult läbi mõelda. Puudulik onboarding suurendab riski, et uued töötajad ei integreeru meeskonda ja teevad kriitilistes süsteemides vigu.",
                    "Töötage välja struktureeritud kaugtöö sisseelamisplaan koos mentori määramisega, regulaarsete kontrollkohtumistega ja selgete esimese 90 päeva eesmärkidega.",
                    QuestionCategory.RECRUITMENT),

            new DoraQuestion(18,
                    "Kas teenusepakkuja töötajate voolavus on stabiilne?",
                    "Is the provider's employee turnover stable?",
                    "DORA Art. 30 – personaliriskid",
                    "Märkimisväärne töötajate arvu kõikumine viitab võimalikele hoidmisprobleemidele. Kõrge voolavus ICT-teenusepakkujas ohustab teenuse kvaliteeti ja teadmiste järjepidevust.",
                    "Nõudke teenusepakkujalt töötajate voolavuse statistikat ja personali stabiilsusplaani. Lisage lepingusse klausel võtmetöötajate vahetumisest teavitamise kohta.",
                    QuestionCategory.RECRUITMENT),

            // Majandusaruannetest tulenevad küsimused
            new DoraQuestion(19,
                    "Kas teenusepakkuja kasumimarginaal on jätkusuutlik?",
                    "Is the provider's profit margin sustainable?",
                    "DORA Art. 30 – finantsriskid",
                    "Äärmiselt õhuke kasumimarginaal (alla 1%) seab kahtluse alla teenusepakkuja pikaajalise jätkusuutlikkuse ja võime investeerida teenuse kvaliteeti.",
                    "Analüüsige teenusepakkuja viimase 3 aasta finantsaruandeid. Kasumimarginaal alla 3% on hoiatusmärk – kaaluge riskimaandamismeetmeid.",
                    QuestionCategory.FINANCIAL_REPORTING),

            new DoraQuestion(20,
                    "Kas teenusepakkuja käibekapital on positiivne?",
                    "Is the provider's working capital positive?",
                    "DORA Art. 30 – finantsriskid",
                    "Negatiivne käibekapital näitab, et lühiajalised kohustused ületavad käibevarasid. See tekitab likviidsusriski ja võib ohustada teenuse osutamise jätkuvust.",
                    "Nõudke teenusepakkujalt kvartaalseid finantsaruandeid. Negatiivne käibekapital nõuab kohest riskihindamist ja exit-plaani aktiveerimise kaalumist.",
                    QuestionCategory.FINANCIAL_REPORTING),

            new DoraQuestion(21,
                    "Kas teenusepakkujal on olnud ootamatuid suuri kahjumeid?",
                    "Has the provider experienced unexpected large losses?",
                    "DORA Art. 30 – finantsriskid",
                    "Ootamatud suured varade mahakandmised viitavad varade ülehindamisele või strateegilistele eksimustele, mis seavad kahtluse alla juhtimise kvaliteedi.",
                    "Kontrollige teenusepakkuja viimase 5 aasta kasumiaruandeid erakorraliste kulude osas. Nõudke selgitust suuremate mahakandmiste ja ühekordsete kulude kohta.",
                    QuestionCategory.FINANCIAL_REPORTING),

            new DoraQuestion(22,
                    "Kas teenusepakkuja kohustuste kasv on proportsionaalne varade kasvuga?",
                    "Is the provider's liability growth proportional to asset growth?",
                    "DORA Art. 30 – finantsriskid",
                    "Kui kohustused kasvavad varadest kiiremini, suurendab kasvav finantsvõimendus maksejõuetusriski ja võib ohustada teenuse jätkuvust.",
                    "Jälgige teenusepakkuja võlakordaja (kohustused/varad) dünaamikat. Kordaja üle 0,7 on hoiatusmärk – kaaluge täiendavaid garantiisid.",
                    QuestionCategory.FINANCIAL_REPORTING),

            // ICT riskihaldus (DORA Art. 5-16)
            new DoraQuestion(23,
                    "Kas on kehtestatud ICT riskihalduse raamistik?",
                    "Is there an ICT risk management framework in place?",
                    "DORA Art. 6(1)",
                    "DORA nõuab finantsasutustelt põhjalikku ICT riskihalduse raamistikku, mis hõlmab strateegiaid, poliitikaid, protseduure ja tööriistu digitaalse tegevuse vastupidavuse tagamiseks.",
                    "Kehtestage dokumenteeritud ICT riskihalduse raamistik, mis sisaldab riskide tuvastamist, hindamist, maandamist ja jälgimist.",
                    QuestionCategory.ICT_RISK_MANAGEMENT),

            new DoraQuestion(24,
                    "Kas ICT süsteemid ja varad on kaardistatud ja klassifitseeritud?",
                    "Are ICT systems and assets mapped and classified?",
                    "DORA Art. 8(1)",
                    "Finantsasutused peavad tuvastama, klassifitseerima ja dokumenteerima kõik ICT varad, sealhulgas riistvara, tarkvara, andmed ja teenused ning nende omavahelised seosed.",
                    "Looge ja hoidke ajakohasena ICT varade register koos kriitilisuse klassifikatsiooniga.",
                    QuestionCategory.ICT_RISK_MANAGEMENT),

            new DoraQuestion(25,
                    "Kas on olemas ICT ärijätkuvuse poliitika?",
                    "Is there an ICT business continuity policy?",
                    "DORA Art. 11(1)",
                    "DORA nõuab ICT ärijätkuvuse poliitikat, mis tagab kriitiliste funktsioonide toimimise häirete korral, sealhulgas taastamiskavad ja kriisijuhtimise protseduurid.",
                    "Koostage ICT ärijätkuvuse poliitika koos RTO/RPO eesmärkidega ja testige seda vähemalt kord aastas.",
                    QuestionCategory.ICT_RISK_MANAGEMENT),

            new DoraQuestion(26,
                    "Kas on ICT turvalisuse poliitika ja juurdepääsukontroll?",
                    "Is there an ICT security policy and access control?",
                    "DORA Art. 9(1)",
                    "Finantsasutused peavad kehtestama ICT turvalisuse poliitika, mis hõlmab juurdepääsukontrolli, krüpteerimist, võrguturvalisust ja andmekaitset.",
                    "Rakendage vähimõiguse põhimõtet, mitmefaktorilist autentimist ja regulaarset juurdepääsuõiguste ülevaatust.",
                    QuestionCategory.ICT_RISK_MANAGEMENT),

            // Intsidentide haldus (DORA Art. 17-23)
            new DoraQuestion(27,
                    "Kas on ICT intsidentide klassifitseerimise protsess?",
                    "Is there an ICT incident classification process?",
                    "DORA Art. 18(1)",
                    "DORA nõuab ICT intsidentide klassifitseerimist raskusastme järgi, kasutades kriteeriume nagu mõjutatud klientide arv, kestus, geograafiline ulatus ja andmekadu.",
                    "Kehtestage intsidentide klassifitseerimise maatriks koos automaatse eskalatsiooni reeglitega.",
                    QuestionCategory.INCIDENT_MANAGEMENT),

            new DoraQuestion(28,
                    "Kas on oluliste ICT intsidentide teavitamise protsess?",
                    "Is there a major ICT incident notification process?",
                    "DORA Art. 19(1)",
                    "Finantsasutused peavad teavitama pädevat asutust olulistest ICT intsidentidest ettenähtud aja jooksul, esitades esialgse, vahe- ja lõpparuande.",
                    "Automatiseerige intsidentide teavitamise protsess: esialgne teade 4h jooksul, vahearuanne 72h jooksul, lõpparuanne 1 kuu jooksul.",
                    QuestionCategory.INCIDENT_MANAGEMENT),

            new DoraQuestion(29,
                    "Kas intsidentidest õpitakse ja rakendatakse parandusi?",
                    "Are lessons learned from incidents and improvements applied?",
                    "DORA Art. 13(1)",
                    "Pärast iga olulist ICT intsidenti tuleb läbi viia juurpõhjuse analüüs ja rakendada parandavad meetmed kordumise vältimiseks.",
                    "Kehtestage post-mortem protsess, mis hõlmab juurpõhjuse analüüsi, parandavate meetmete plaani ja nende elluviimise jälgimist.",
                    QuestionCategory.INCIDENT_MANAGEMENT),

            new DoraQuestion(30,
                    "Kas on küberrünnakute tuvastamise ja reageerimise võimekus?",
                    "Is there a cyber threat detection and response capability?",
                    "DORA Art. 10(1)",
                    "DORA nõuab mehhanisme ebatavaliste tegevuste tuvastamiseks ICT süsteemides, sealhulgas automaatset jälgimist, logide analüüsi ja anomaaliate tuvastamist.",
                    "Rakendage SIEM-lahendus, 24/7 monitooring ja automatiseeritud häiresüsteem kriitiliste sündmuste jaoks.",
                    QuestionCategory.INCIDENT_MANAGEMENT),

            // Testimine (DORA Art. 24-27)
            new DoraQuestion(31,
                    "Kas viiakse läbi regulaarseid ICT turvalisuse teste?",
                    "Are regular ICT security tests conducted?",
                    "DORA Art. 24(1)",
                    "DORA nõuab ICT turvalisuse testimise programmi, mis hõlmab haavatavuste skaneerimist, avatud lähtekoodiga tarkvara analüüsi, võrguturvalisuse hindamist ja penetratsiooniteste.",
                    "Koostage iga-aastane testimiskava: kvartaalsed haavatavuste skaneeringud, iga-aastased penetratsioonitestid ja pidev koodi turvaanalüüs.",
                    QuestionCategory.TESTING),

            new DoraQuestion(32,
                    "Kas kriitiliste ICT süsteemide jaoks tehakse TLPT teste?",
                    "Are TLPT (Threat-Led Penetration Tests) conducted for critical ICT systems?",
                    "DORA Art. 26(1)",
                    "Olulised finantsasutused peavad läbima ohupõhise penetratsioonitestimise (TLPT) vähemalt iga 3 aasta järel, kasutades TIBER-EU või samaväärseid raamistikke.",
                    "Planeerige TLPT testimine kooskõlas pädevate asutustega. Kaasake sõltumatud Red Team testimise teenusepakkujad.",
                    QuestionCategory.TESTING),

            new DoraQuestion(33,
                    "Kas testimise tulemused dokumenteeritakse ja puudused kõrvaldatakse?",
                    "Are test results documented and deficiencies remediated?",
                    "DORA Art. 24(5)",
                    "Kõigi ICT turvalisuse testide tulemused tuleb dokumenteerida, puudused klassifitseerida riskitaseme järgi ja koostada paranduskava koos tähtaegadega.",
                    "Rakendage leitud haavatavuste parandamise SLA: kriitilised 24h, kõrged 7 päeva, keskmised 30 päeva.",
                    QuestionCategory.TESTING),

            new DoraQuestion(34,
                    "Kas ICT ärijätkuvuse plaane testitakse regulaarselt?",
                    "Are ICT business continuity plans tested regularly?",
                    "DORA Art. 11(6)",
                    "ICT ärijätkuvuse ja taastamise plaane tuleb testida vähemalt kord aastas ning pärast olulisi muudatusi ICT süsteemides.",
                    "Viige läbi iga-aastased ärijätkuvuse harjutused, sh failover-testid, andmete taastamise testid ja kriisikommunikatsiooni harjutused.",
                    QuestionCategory.TESTING),

            // Info jagamine (DORA Art. 45)
            new DoraQuestion(35,
                    "Kas finantsasutus osaleb küberohuteavet jagavas kogukonnas?",
                    "Does the financial entity participate in a cyber threat intelligence sharing community?",
                    "DORA Art. 45(1)",
                    "DORA julgustab finantsasutusi osalema küberohuteavet jagavates kogukondades, et vahetada teavet küberohtude, haavatavuste, kompromissinäitajate ja ründetehnikate kohta.",
                    "Liituge valdkondliku ISAC-ga (Information Sharing and Analysis Center) või samaväärsete koostöövormidega.",
                    QuestionCategory.INFORMATION_SHARING),

            new DoraQuestion(36,
                    "Kas on protsess küberohu teabe vastuvõtmiseks ja kasutamiseks?",
                    "Is there a process for receiving and using cyber threat intelligence?",
                    "DORA Art. 45(2)",
                    "Saadud küberohuteavet tuleb analüüsida, valideerida ja integreerida oma ICT riskihalduse protsessidesse, et parandada kaitsemeetmeid ja reageerimiskiirust.",
                    "Kehtestage ohuteabe töötlemise protsess: vastuvõtt, valideerimine, rikastamine, levitamine ja rakendamine kaitsemeetmetesse.",
                    QuestionCategory.INFORMATION_SHARING),

            new DoraQuestion(37,
                    "Kas jagatakse olulist intsidendi teavet teiste finantsasutustega?",
                    "Is significant incident information shared with other financial entities?",
                    "DORA Art. 45(3)",
                    "Anonümiseeritud intsidendi teabe jagamine aitab kogu finantssektoril paremini valmistuda sarnasteks rünnakuteks ja tugevdada kollektiivset kaitset.",
                    "Osalege regulaarselt sektoripõhistel intsidendi jagamise kohtumistel ja panustage anonümiseeritud juhtumite andmebaasidesse.",
                    QuestionCategory.INFORMATION_SHARING)
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
