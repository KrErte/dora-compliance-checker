package com.dorachecker.service;

import com.dorachecker.model.DoraQuestion;
import com.dorachecker.model.DoraQuestion.QuestionCategory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class QuestionService {

    private final List<DoraQuestion> questions;

    public QuestionService() {
        this.questions = List.of(
            new DoraQuestion(1,
                "Kas leping määratleb ICT teenuse ulatuse ja kvaliteedi?",
                "Does the contract define the scope and quality of the ICT service?",
                "DORA Art. 30(2)(a)",
                "DORA nõuab, et ICT lepingud sisaldaksid selget teenuse kirjeldust, sh ulatust, kvaliteeti ja teenustasemeid. See tagab, et mõlemad pooled mõistavad kohustusi.",
                "Lisage lepingusse detailne teenuse kirjeldus koos kvaliteedinõuetega.",
                QuestionCategory.SERVICE_LEVEL,
                2, "HIGH",
                "Teenusepakkuja kohustub osutama IKT-teenuseid vastavalt käesoleva lepingu Lisas 1 sätestatud teenuse kirjeldusele. " +
                "Teenuse kirjeldus sisaldab vähemalt: (a) teenuse ulatuse täpset määratlust; (b) kvaliteedinõudeid ja aktsepteeritavaid " +
                "teenustasemeid; (c) mõõdetavaid tulemusnäitajaid; (d) teenuse osutamise ajakava ja tingimusi. Teenusepakkuja tagab, " +
                "et osutatav teenus vastab igal ajal kokkulepitud kirjeldusele ja kvaliteedinõuetele."
            ),
            new DoraQuestion(2,
                "Kas on teenustasemed (SLA) mõõdetavate KPI-dega?",
                "Are there service levels (SLA) with measurable KPIs?",
                "DORA Art. 30(2)(a)",
                "Mõõdetavad KPI-d on vajalikud teenuse kvaliteedi jälgimiseks ja lepingu täitmise kontrollimiseks. Ilma nendeta puudub objektiivne alus teenuse hindamiseks.",
                "Määratlege konkreetsed KPI-d nagu kättesaadavus (%), reageerimisaeg ja lahendusaeg.",
                QuestionCategory.SERVICE_LEVEL,
                2, "HIGH",
                "Pooled lepivad kokku järgmistes teenustasemetes (SLA): (a) teenuse kättesaadavus vähemalt 99,5% kalendrikuus; " +
                "(b) kriitilistele intsidentidele reageerimise aeg kuni 15 minutit; (c) kriitilistele intsidentidele lahendamise " +
                "aeg kuni 4 tundi; (d) planeeritud hooldustööde etteteatamise aeg vähemalt 5 tööpäeva. Teenustasemete täitmist " +
                "mõõdetakse ja raporteeritakse igakuiselt. SLA rikkumisel kohalduvad Lisas 2 sätestatud leppetrahvid."
            ),
            new DoraQuestion(3,
                "Kas teenusepakkuja teavitab intsidentidest 24h jooksul?",
                "Does the provider notify about incidents within 24 hours?",
                "DORA Art. 30(2)(e)",
                "Kiire intsidentidest teavitamine on kriitilise tähtsusega, et finantsasutus saaks õigeaegselt reageerida ja täita oma teavituskohustusi järelevalveasutuste ees.",
                "Lisage lepingusse intsidentidest teavitamise kord koos ajaliste piirangutega.",
                QuestionCategory.INCIDENT,
                3, "CRITICAL",
                "Teenusepakkuja kohustub teavitama Tellijat kõigist IKT intsidentidest viivitamata, kuid mitte hiljem kui: " +
                "(a) kriitilistest intsidentidest 1 tunni jooksul nende avastamisest; (b) olulistest intsidentidest 4 tunni jooksul; " +
                "(c) muudest intsidentidest 24 tunni jooksul. Teavitus sisaldab vähemalt: intsidendi kirjeldust, mõjuhinnangut, " +
                "rakendatud esmaseid meetmeid ja eeldatavat lahendamise aega. Teenusepakkuja esitab lõpliku intsidendiaruande " +
                "5 tööpäeva jooksul intsidendi lahendamisest."
            ),
            new DoraQuestion(4,
                "Kas lepingus on auditeerimisõiguse klausel?",
                "Does the contract include an audit right clause?",
                "DORA Art. 30(2)(d)",
                "Auditeerimisõigus võimaldab finantsasutusel ja järelevalveasutustel kontrollida teenusepakkuja tegevust, turvameetmeid ja lepingu täitmist.",
                "Lisage klausel, mis annab õiguse auditeerida teenusepakkujat, sh kohapealsed kontrollid.",
                QuestionCategory.AUDIT,
                3, "CRITICAL",
                "Tellijal ja tema poolt volitatud kolmandatel isikutel (sh välisaudiitoritel) on õigus auditeerida Teenusepakkuja " +
                "tegevust käesoleva lepingu täitmisel, sealhulgas: (a) teostada kohapealseid kontrolle Teenusepakkuja ruumides " +
                "etteteatamisega vähemalt 10 tööpäeva; (b) teostada erakorralist auditit 48-tunnise etteteatamisega juhul, " +
                "kui esineb põhjendatud kahtlus lepingu rikkumises; (c) tutvuda kõigi lepingu täitmisega seotud dokumentide, " +
                "logide ja süsteemidega. Teenusepakkuja kohustub tegema auditi läbiviimiseks igakülgset koostööd. " +
                "Finantsjärelevalve asutusel on samaväärsed auditeerimisõigused vastavalt DORA artiklile 30(2)(d)."
            ),
            new DoraQuestion(5,
                "Kas on exit-strateegia lepingu lõppemisel?",
                "Is there an exit strategy for contract termination?",
                "DORA Art. 30(2)(f)",
                "Exit-strateegia tagab teenuse sujuva ülemineku teisele pakkujale või in-house lahendusele, vältides teenuse katkestusi ja andmete kaotust.",
                "Koostage detailne exit-plaan koos ajakava, andmete migratsiooni ja üleminekuperioodiga.",
                QuestionCategory.EXIT_STRATEGY,
                3, "CRITICAL",
                "Lepingu lõppemisel või ülesütlemisel kohaldub järgmine exit-strateegia: (a) Teenusepakkuja tagab üleminekuperioodi " +
                "kestusega vähemalt 12 kuud, mille jooksul teenuse osutamine jätkub muutumatul tasemel; (b) Teenusepakkuja abistab " +
                "Tellijat teenuse üleviimisel uuele pakkujale või Tellija enda taristusse; (c) kogu Tellija andmestik tagastatakse " +
                "kokkulepitud formaadis 30 kalendripäeva jooksul; (d) Teenusepakkuja kustutab kõik Tellija andmed oma süsteemidest " +
                "90 kalendripäeva jooksul pärast andmete üleandmist, välja arvatud seadusest tulenevad säilitamiskohustused; " +
                "(e) üleminekuperioodil kehtivad kõik lepingus sätestatud teenustasemed täies ulatuses."
            ),
            new DoraQuestion(6,
                "Kas andmete asukoht on määratletud (EL/mitte-EL)?",
                "Is the data location defined (EU/non-EU)?",
                "DORA Art. 30(2)(b)",
                "Andmete asukoha teadmine on oluline andmekaitse, suveräänsuse ja regulatiivsete nõuete täitmise seisukohalt. EL-välised asukohad võivad tekitada täiendavaid riske.",
                "Fikseerige lepingus andmete töötlemise ja hoiustamise asukohad ning piirangud.",
                QuestionCategory.DATA,
                2, "HIGH",
                "Teenusepakkuja töötleb ja hoiustab kõiki Tellija andmeid üksnes Euroopa Liidu ja Euroopa Majanduspiirkonna " +
                "liikmesriikide territooriumil asuvates andmekeskustes. Andmete töötlemise asukohad on: [täpsustada]. " +
                "Teenusepakkuja ei edasta Tellija andmeid kolmandatesse riikidesse ilma Tellija eelneva kirjaliku nõusolekuta. " +
                "Andmete asukoha muutmisest teavitab Teenusepakkuja Tellijat vähemalt 90 kalendripäeva ette."
            ),
            new DoraQuestion(7,
                "Kas subkontraktorite kasutamine nõuab nõusolekut?",
                "Does the use of subcontractors require consent?",
                "DORA Art. 30(2)(a)",
                "Subkontraktorite kontrollimatu kasutamine suurendab tarneahela riske. Finantsasutusel peab olema ülevaade ja kontroll allhankijate üle.",
                "Nõudke lepingus eelnevat kirjalikku nõusolekut subkontraktorite kaasamiseks.",
                QuestionCategory.SUBCONTRACTING,
                2, "HIGH",
                "Teenusepakkuja ei kaasa lepingu täitmiseks allhankijaid ilma Tellija eelneva kirjaliku nõusolekuta. " +
                "Teenusepakkuja esitab allhankija kaasamise taotluse koos järgmise teabega: (a) allhankija nimi ja registrikood; " +
                "(b) delegeeritavate teenuste kirjeldus; (c) allhankija kvalifikatsioon ja turvameetmed; " +
                "(d) andmete töötlemise asukohad. Teenusepakkuja vastutab allhankija tegevuse eest nagu oma tegevuse eest. " +
                "Tellijal on õigus nõuda allhankija asendamist mõjuval põhjusel."
            ),
            new DoraQuestion(8,
                "Kas on andmete tagastamise klausel?",
                "Is there a data return clause?",
                "DORA Art. 30(2)(f)",
                "Andmete tagastamise klausel tagab, et lepingu lõppemisel saab finantsasutus kõik oma andmed tagasi turvalises ja kasutatavas formaadis.",
                "Määratlege andmete tagastamise formaat, ajakava ja kustutamise kord lepingu lõppemisel.",
                QuestionCategory.EXIT_STRATEGY,
                2, "HIGH",
                "Lepingu lõppemisel kohustub Teenusepakkuja: (a) tagastama kõik Tellija andmed masinloetavas standardformaadis " +
                "(CSV, JSON, XML või muu kokkulepitud formaat) 30 kalendripäeva jooksul; (b) tagama andmete terviklikkuse ja " +
                "täielikkuse tagastamisel; (c) esitama kirjaliku kinnituse kõigi Tellija andmete kustutamise kohta oma süsteemidest " +
                "hiljemalt 90 kalendripäeva jooksul pärast andmete edukat tagastamist; (d) säilitama andmete varukoopiaid " +
                "üleminekuperioodil vastavalt kokkulepitud taastamiskavale."
            ),
            new DoraQuestion(9,
                "Kas teenusepakkuja järgib küberturvalisuse standardeid?",
                "Does the provider follow cybersecurity standards?",
                "DORA Art. 30(2)(c)",
                "Küberturvalisuse standardite järgimine (nt ISO 27001, SOC 2) annab kindluse, et teenusepakkuja rakendab piisavaid turvameetmeid.",
                "Nõudke tunnustatud turvastandardite sertifikaate ja regulaarset vastavuse tõendamist.",
                QuestionCategory.RISK,
                2, "HIGH",
                "Teenusepakkuja kohustub: (a) omama ja säilitama kehtivat ISO/IEC 27001 sertifikaati või samaväärset tunnustatud " +
                "infoturbe sertifikaati; (b) esitama Tellijale kehtiva sertifikaadi koopia lepingu sõlmimisel ja selle uuendamisel; " +
                "(c) teavitama Tellijat viivitamata sertifikaadi peatamisest, tühistamisest või sertifitseerimise ulatuse " +
                "muutumisest; (d) võimaldama Tellijal tutvuda SOC 2 Type II aruande või samaväärsega kord aastas. " +
                "Sertifikaadi kaotamine on lepingu oluline rikkumine."
            ),
            new DoraQuestion(10,
                "Kas on disaster recovery nõuded?",
                "Are there disaster recovery requirements?",
                "DORA Art. 30(2)(c)",
                "Disaster recovery plaan tagab teenuse taastamise kriisiolukordades. DORA nõuab, et kriitiliste ICT teenuste jaoks oleks olemas taasteplaan.",
                "Lisage lepingusse RTO/RPO nõuded ja regulaarsed taastamistestid.",
                QuestionCategory.CONTINUITY,
                3, "CRITICAL",
                "Teenusepakkuja tagab järgmised taastamise parameetrid: (a) taastamise sihteesmärk (RTO) kriitiliste teenuste " +
                "puhul kuni 4 tundi; (b) andmete taastamise punkt (RPO) kuni 1 tund; (c) Teenusepakkuja testib taastamiskavasid " +
                "vähemalt kord aastas ja esitab testitulemused Tellijale 10 tööpäeva jooksul; (d) Teenusepakkuja teavitab " +
                "Tellijat taastamiskava olulisest muutmisest vähemalt 30 kalendripäeva ette; (e) taastamiskava hõlmab " +
                "geograafiliselt eraldatud varuandmekeskust."
            ),
            new DoraQuestion(11,
                "Kas on konfidentsiaalsuskohustus?",
                "Is there a confidentiality obligation?",
                "DORA Art. 30(2)(b)",
                "Konfidentsiaalsuskohustus kaitseb finantsasutuse tundlikku teavet ja kliendiandmeid volitamata avaldamise eest.",
                "Lisage lepingusse konfidentsiaalsusklausel, mis kehtib ka pärast lepingu lõppemist.",
                QuestionCategory.LEGAL,
                1, "MEDIUM",
                "Teenusepakkuja kohustub hoidma konfidentsiaalsena kogu Tellija äriteabe, kliendiandmed, tehnilise dokumentatsiooni " +
                "ja muu lepingu täitmise käigus teatavaks saanud teabe. Konfidentsiaalsuskohustus kehtib lepingu kehtivuse ajal " +
                "ja 5 aastat pärast lepingu lõppemist. Teenusepakkuja tagab, et konfidentsiaalsuskohustus laieneb ka tema " +
                "töötajatele ja allhankijatele. Konfidentsiaalsuskohustuse rikkumine on lepingu oluline rikkumine."
            ),
            new DoraQuestion(12,
                "Kas vastutuse piirid on määratud?",
                "Are liability limits defined?",
                "DORA Art. 30(2)(a)",
                "Vastutuse piiride selge määratlemine kaitseb finantsasutust ülemääraste riskide eest ja tagab, et teenusepakkuja kannab vastutust oma kohustuste rikkumise eest.",
                "Määratlege vastutuse ülem- ja alampiirid ning vastutuse jaotus poolte vahel.",
                QuestionCategory.LEGAL,
                1, "MEDIUM",
                "Teenusepakkuja vastutuse ülempiir lepingu rikkumisest tuleneva otsese kahju eest on võrdne 12 kuu teenustasuga. " +
                "Vastutuse ülempiir ei kohaldu: (a) konfidentsiaalsuskohustuse rikkumisele; (b) isikuandmete kaitse rikkumisele; " +
                "(c) tahtlikule lepingurikkumisele; (d) intellektuaalomandi rikkumisele. Teenusepakkuja on kohustatud hüvitama " +
                "Tellijale lepingu rikkumisest tuleneva otsese kahju, sealhulgas regulatiivsed trahvid ja sanktsioonid, " +
                "mis on otseselt põhjustatud Teenusepakkuja rikkumisest."
            ),
            new DoraQuestion(13,
                "Kas tehakse regulaarseid turvateste?",
                "Are regular security tests conducted?",
                "DORA Art. 30(2)(c)",
                "Regulaarsed turvatestid (penetratsioonitestid, haavatavuste skaneerimine) on vajalikud turvalisuse taseme hindamiseks ja nõrkuste tuvastamiseks.",
                "Nõudke vähemalt iga-aastaseid penetratsiooniteste ja kvartaalseid haavatavuste skaneerimisi.",
                QuestionCategory.RISK,
                2, "HIGH",
                "Teenusepakkuja kohustub: (a) teostama Tellija teenuseid hõlmavaid penetratsiooniteste vähemalt kord aastas " +
                "sõltumatu kolmanda osapoole poolt; (b) teostama haavatavuste skaneerimist vähemalt kvartaalselt; " +
                "(c) esitama testide tulemused Tellijale 10 tööpäeva jooksul; (d) koostama leitud haavatavuste kohta " +
                "paranduskava järgmiste tähtaegadega: kriitilised — 24 tundi, kõrge riskitasemega — 7 päeva, " +
                "keskmise riskitasemega — 30 päeva; (e) võimaldama Tellijal teostada sõltumatuid turvateste."
            ),
            new DoraQuestion(14,
                "Kas on koostöö finantsjärelevalvega?",
                "Is there cooperation with financial supervisory authorities?",
                "DORA Art. 30(2)(d)",
                "Teenusepakkuja peab olema valmis tegema koostööd finantsjärelevalve asutustega, sh võimaldama juurdepääsu ja auditeid.",
                "Lisage klausel teenusepakkuja kohustusest teha koostööd järelevalveasutustega.",
                QuestionCategory.AUDIT,
                3, "CRITICAL",
                "Teenusepakkuja kohustub tegema täielikku koostööd Tellija finantsjärelevalve asutusega (Finantsinspektsioon) " +
                "ja teiste pädevate asutustega, sealhulgas: (a) võimaldama järelevalveasutusel juurdepääsu Teenusepakkuja " +
                "ruumidele, süsteemidele ja dokumentatsioonile; (b) vastama järelevalveasutuse päringutele ettenähtud tähtaegadel; " +
                "(c) osalema järelevalveasutuse poolt korraldatud kontrollides; (d) esitama järelevalveasutusele nõutud aruandlust. " +
                "Käesolev kohustus ei ole piiratud ühegi konfidentsiaalsusklausliga."
            ),
            new DoraQuestion(15,
                "Kas on teenusepakkuja maksejõuetuse klausel?",
                "Is there a provider insolvency clause?",
                "DORA Art. 30(2)(f)",
                "Maksejõuetuse klausel kaitseb finantsasutust olukorras, kus teenusepakkuja muutub maksejõuetuks, tagades teenuse jätkuvuse ja andmete kättesaadavuse.",
                "Lisage lepingusse sätted teenuse jätkuvuse ja andmete tagastamise kohta pakkuja maksejõuetuse korral.",
                QuestionCategory.CONTINUITY,
                2, "HIGH",
                "Teenusepakkuja maksejõuetuse, pankroti, likvideerimise või muu sarnase sündmuse korral: (a) Tellijal on õigus " +
                "leping erakorraliselt üles öelda ilma leppetrahvita; (b) Teenusepakkuja (või tema pankrotihaldur) tagab " +
                "Tellijale juurdepääsu andmetele ja süsteemidele vähemalt 60 kalendripäeva jooksul; (c) Teenusepakkuja on " +
                "kohustatud üle andma kogu Tellija andmestiku ja teenuse osutamiseks vajaliku dokumentatsiooni; " +
                "(d) Tellija andmed ei kuulu Teenusepakkuja pankrotivarasse. Teenusepakkuja kohustub viivitamata teavitama " +
                "Tellijat mis tahes maksejõuetuse tunnustest."
            ),
            new DoraQuestion(16,
                "Kas teenusepakkuja annab kandidaatidele värbamisprotsessis tagasisidet?",
                "Does the provider give candidates feedback during the recruitment process?",
                "DORA Art. 30 – personaliriskid",
                "ICT-teenusepakkuja värbamisprotsessis võib esineda kommunikatsiooniprobleeme, kus kandidaatidele ei anta pärast intervjuud lõplikku tagasisidet.",
                "Kehtestage värbamisprotsessis kohustuslik tagasisideetapp.",
                QuestionCategory.RECRUITMENT,
                1, "MEDIUM",
                "Teenusepakkuja kohustub rakendama struktureeritud personalijuhtimise protsesse, mis tagavad teenuse osutamiseks " +
                "vajaliku kompetentsi kättesaadavuse, sealhulgas: (a) värbamisprotsessi läbipaistvuse ja efektiivsuse tagamine; " +
                "(b) kandidaatidele tagasiside andmine mõistliku aja jooksul; (c) kvalifitseeritud personali piisava hulga tagamine."
            ),
            new DoraQuestion(17,
                "Kas teenusepakkujal on kaugtööks kohandatud sisseelamisprotsess?",
                "Does the provider have a remote-adapted onboarding process?",
                "DORA Art. 30 – personaliriskid",
                "Kaugtöö tingimustes tuleb sisseelamisprotsess põhjalikult läbi mõelda. Puudulik onboarding suurendab riski.",
                "Töötage välja struktureeritud kaugtöö sisseelamisplaan koos mentori määramisega.",
                QuestionCategory.RECRUITMENT,
                1, "MEDIUM",
                "Teenusepakkuja kohustub tagama, et teenuse osutamisega seotud uued töötajad läbivad struktureeritud " +
                "sisseelamisprotsessi, mis hõlmab: (a) infoturbe ja andmekaitse koolitust; (b) Tellija teenuse spetsiifika " +
                "tutvustust; (c) juurdepääsuõiguste kontrollitud väljastamist; (d) mentorlusprogrammi esimese 90 päeva jooksul."
            ),
            new DoraQuestion(18,
                "Kas teenusepakkuja töötajate voolavus on stabiilne?",
                "Is the provider's employee turnover stable?",
                "DORA Art. 30 – personaliriskid",
                "Märkimisväärne töötajate arvu kõikumine viitab võimalikele hoidmisprobleemidele.",
                "Nõudke teenusepakkujalt töötajate voolavuse statistikat ja personali stabiilsusplaani.",
                QuestionCategory.RECRUITMENT,
                1, "MEDIUM",
                "Teenusepakkuja kohustub: (a) teavitama Tellijat Tellija teenust puudutavate võtmetöötajate lahkumisest 5 tööpäeva " +
                "jooksul; (b) tagama võtmetöötajate asendamise kvalifitseeritud personaliga 30 kalendripäeva jooksul; " +
                "(c) esitama Tellijale kord aastas ülevaate teenust puudutava personali voolavusest; " +
                "(d) säilitama piisava teadmiste dokumentatsiooni personali vahetumise mõju minimeerimiseks."
            ),
            new DoraQuestion(19,
                "Kas teenusepakkuja kasumimarginaal on jätkusuutlik?",
                "Is the provider's profit margin sustainable?",
                "DORA Art. 30 – finantsriskid",
                "Äärmiselt õhuke kasumimarginaal seab kahtluse alla teenusepakkuja pikaajalise jätkusuutlikkuse.",
                "Analüüsige teenusepakkuja viimase 3 aasta finantsaruandeid.",
                QuestionCategory.FINANCIAL_REPORTING,
                1, "MEDIUM",
                "Teenusepakkuja kohustub esitama Tellijale kord aastas oma auditeeritud majandusaasta aruande 30 kalendripäeva " +
                "jooksul selle kinnitamisest. Teenusepakkuja teavitab Tellijat viivitamata, kui tema kasumimarginaal langeb " +
                "alla 3% või tekivad muud olulised finantsriskid, mis võivad mõjutada teenuse osutamise jätkusuutlikkust."
            ),
            new DoraQuestion(20,
                "Kas teenusepakkuja käibekapital on positiivne?",
                "Is the provider's working capital positive?",
                "DORA Art. 30 – finantsriskid",
                "Negatiivne käibekapital näitab likviidsusriski ja võib ohustada teenuse osutamise jätkuvust.",
                "Nõudke teenusepakkujalt kvartaalseid finantsaruandeid.",
                QuestionCategory.FINANCIAL_REPORTING,
                1, "MEDIUM",
                "Teenusepakkuja kohustub: (a) säilitama positiivse käibekapitali kogu lepingu kehtivuse ajal; " +
                "(b) teavitama Tellijat viivitamata käibekapitali muutumisest negatiivseks; " +
                "(c) esitama Tellija nõudmisel kvartaalseid finantsülevaateid. Negatiivse käibekapitali korral on Tellijal " +
                "õigus nõuda täiendavaid tagatisi teenuse jätkuvuse tagamiseks."
            ),
            new DoraQuestion(21,
                "Kas teenusepakkujal on olnud ootamatuid suuri kahjumeid?",
                "Has the provider experienced unexpected large losses?",
                "DORA Art. 30 – finantsriskid",
                "Ootamatud suured varade mahakandmised viitavad varade ülehindamisele või strateegilistele eksimustele.",
                "Kontrollige teenusepakkuja viimase 5 aasta kasumiaruandeid.",
                QuestionCategory.FINANCIAL_REPORTING,
                1, "MEDIUM",
                "Teenusepakkuja kohustub teavitama Tellijat 10 tööpäeva jooksul igast erakorralisest finantsündmusest, " +
                "mis ületab 10% Teenusepakkuja aastakäibest, sealhulgas ootamatud kahjumid, varade mahakandmised, " +
                "kohtuvaidluste tulemused ja regulatiivsed trahvid."
            ),
            new DoraQuestion(22,
                "Kas teenusepakkuja kohustuste kasv on proportsionaalne varade kasvuga?",
                "Is the provider's liability growth proportional to asset growth?",
                "DORA Art. 30 – finantsriskid",
                "Kui kohustused kasvavad varadest kiiremini, suurendab kasvav finantsvõimendus maksejõuetusriski.",
                "Jälgige teenusepakkuja võlakordaja dünaamikat.",
                QuestionCategory.FINANCIAL_REPORTING,
                1, "MEDIUM",
                "Teenusepakkuja kohustub säilitama võlakordaja (kohustused/varad) tasemel, mis ei ületa 0,7. " +
                "Teenusepakkuja esitab Tellijale kord aastas oma bilansi põhinäitajad. Võlakordaja ületamisel 0,8 on Tellijal " +
                "õigus nõuda täiendavaid tagatisi, sealhulgas emaettevõtte garantiid või pangagarantiid."
            ),
            new DoraQuestion(23,
                "Kas on kehtestatud ICT riskihalduse raamistik?",
                "Is there an ICT risk management framework in place?",
                "DORA Art. 6(1)",
                "DORA nõuab finantsasutustelt põhjalikku ICT riskihalduse raamistikku.",
                "Kehtestage dokumenteeritud ICT riskihalduse raamistik.",
                QuestionCategory.ICT_RISK_MANAGEMENT,
                3, "CRITICAL",
                "Teenusepakkuja kohustub rakendama ja säilitama ICT riskihalduse raamistikku, mis hõlmab: " +
                "(a) ICT riskide tuvastamise, hindamise ja maandamise protsesse; (b) riskide regulaarset ülevaatust vähemalt " +
                "kord aastas; (c) riskiisu määratlemist ja jälgimist; (d) juhtkonna tasandil vastutuse määramist ICT riskide eest; " +
                "(e) dokumenteeritud ICT turvapoliitikat. Raamistik peab vastama DORA artikli 6 nõuetele."
            ),
            new DoraQuestion(24,
                "Kas ICT süsteemid ja varad on kaardistatud ja klassifitseeritud?",
                "Are ICT systems and assets mapped and classified?",
                "DORA Art. 8(1)",
                "Finantsasutused peavad tuvastama, klassifitseerima ja dokumenteerima kõik ICT varad.",
                "Looge ja hoidke ajakohasena ICT varade register.",
                QuestionCategory.ICT_RISK_MANAGEMENT,
                3, "CRITICAL",
                "Teenusepakkuja kohustub: (a) pidama ajakohast ICT varade registrit, mis hõlmab kõiki Tellija teenuse " +
                "osutamiseks kasutatavaid süsteeme, rakendusi ja andmeid; (b) klassifitseerima varad kriitilisuse astme järgi; " +
                "(c) kaardistama varade omavahelised sõltuvused; (d) ajakohastama registrit vähemalt kvartaalselt ja pärast " +
                "olulisi muudatusi; (e) esitama varade registri Tellijale nõudmisel."
            ),
            new DoraQuestion(25,
                "Kas on olemas ICT ärijätkuvuse poliitika?",
                "Is there an ICT business continuity policy?",
                "DORA Art. 11(1)",
                "DORA nõuab ICT ärijätkuvuse poliitikat kriitiliste funktsioonide toimimise tagamiseks häirete korral.",
                "Koostage ICT ärijätkuvuse poliitika koos RTO/RPO eesmärkidega.",
                QuestionCategory.ICT_RISK_MANAGEMENT,
                3, "CRITICAL",
                "Teenusepakkuja kohustub kehtestama ja rakendama ICT ärijätkuvuse poliitika, mis sisaldab: " +
                "(a) kriitiliste teenuste ja funktsioonide loetelu; (b) ärijätkuvuse strateegiaid ja taastamiskavasid; " +
                "(c) RTO ja RPO eesmärke iga kriitilise teenuse jaoks; (d) kriisijuhtimise protsessi ja kommunikatsiooniplaani; " +
                "(e) ressursside jaotamise plaani kriisiolukordades. Ärijätkuvuse plaane testitakse vähemalt kord aastas."
            ),
            new DoraQuestion(26,
                "Kas on ICT turvalisuse poliitika ja juurdepääsukontroll?",
                "Is there an ICT security policy and access control?",
                "DORA Art. 9(1)",
                "Finantsasutused peavad kehtestama ICT turvalisuse poliitika.",
                "Rakendage vähimõiguse põhimõtet ja mitmefaktorilist autentimist.",
                QuestionCategory.ICT_RISK_MANAGEMENT,
                3, "CRITICAL",
                "Teenusepakkuja kohustub rakendama järgmisi turvameetmeid: (a) vähimõiguse põhimõtet (least privilege) kõigi " +
                "juurdepääsuõiguste määramisel; (b) mitmefaktorilist autentimist (MFA) kõigile privilegeeritud kasutajatele " +
                "ja kaugjuurdepääsule; (c) juurdepääsuõiguste regulaarset ülevaatust vähemalt kvartaalselt; " +
                "(d) automaatset logimist kõigist juurdepääsusündmustest; (e) andmete krüpteerimist nii edastamisel (TLS 1.2+) " +
                "kui hoiustamisel (AES-256); (f) võrgu segmenteerimist ja tulemüüri reegleid."
            ),
            new DoraQuestion(27,
                "Kas on ICT intsidentide klassifitseerimise protsess?",
                "Is there an ICT incident classification process?",
                "DORA Art. 18(1)",
                "DORA nõuab ICT intsidentide klassifitseerimist raskusastme järgi.",
                "Kehtestage intsidentide klassifitseerimise maatriks.",
                QuestionCategory.INCIDENT_MANAGEMENT,
                3, "CRITICAL",
                "Teenusepakkuja kohustub klassifitseerima kõik ICT intsidendid järgmise raskusastme skaala alusel: " +
                "(a) KRIITILINE — teenuse täielik katkestus, andmelekkimine, rohkem kui 10% klientidest mõjutatud; " +
                "(b) OLULINE — teenuse osaline katkestus, kestus üle 2 tunni, rohkem kui 1% klientidest mõjutatud; " +
                "(c) TAVALINE — üksikud tõrked, mõju piiratud, kestus alla 2 tunni. Klassifikatsioon määratakse " +
                "DORA artikli 18 kriteeriumide alusel."
            ),
            new DoraQuestion(28,
                "Kas on oluliste ICT intsidentide teavitamise protsess?",
                "Is there a major ICT incident notification process?",
                "DORA Art. 19(1)",
                "Finantsasutused peavad teavitama pädevat asutust olulistest ICT intsidentidest.",
                "Automatiseerige intsidentide teavitamise protsess.",
                QuestionCategory.INCIDENT_MANAGEMENT,
                3, "CRITICAL",
                "Teenusepakkuja kohustub toetama Tellijat DORA artikli 19 kohase intsidentide teavitamise protsessis: " +
                "(a) esitama Tellijale esialgse intsidenditeate 1 tunni jooksul kriitilise intsidendi avastamisest; " +
                "(b) esitama vahearuande 24 tunni jooksul koos üksikasjaliku mõjuanalüüsiga; " +
                "(c) esitama lõpliku intsidendiaruande 5 tööpäeva jooksul intsidendi lahendamisest, mis sisaldab " +
                "juurpõhjuse analüüsi ja parandavaid meetmeid; (d) sisaldama teavituses kõiki DORA artiklis 19(4) nõutud andmeid."
            ),
            new DoraQuestion(29,
                "Kas intsidentidest õpitakse ja rakendatakse parandusi?",
                "Are lessons learned from incidents and improvements applied?",
                "DORA Art. 13(1)",
                "Pärast iga olulist ICT intsidenti tuleb läbi viia juurpõhjuse analüüs.",
                "Kehtestage post-mortem protsess.",
                QuestionCategory.INCIDENT_MANAGEMENT,
                2, "HIGH",
                "Teenusepakkuja kohustub pärast iga olulist intsidenti: (a) viima läbi juurpõhjuse analüüsi (Root Cause Analysis) " +
                "10 tööpäeva jooksul; (b) koostama parandavate meetmete plaani koos vastutajate ja tähtaegadega; " +
                "(c) rakendama parandavad meetmed kokkulepitud tähtaegadeks; (d) esitama Tellijale kvartaalse ülevaate " +
                "kõigist intsidentidest ja rakendatud parandavatest meetmetest."
            ),
            new DoraQuestion(30,
                "Kas on küberrünnakute tuvastamise ja reageerimise võimekus?",
                "Is there a cyber threat detection and response capability?",
                "DORA Art. 10(1)",
                "DORA nõuab mehhanisme ebatavaliste tegevuste tuvastamiseks ICT süsteemides.",
                "Rakendage SIEM-lahendus ja 24/7 monitooring.",
                QuestionCategory.INCIDENT_MANAGEMENT,
                3, "CRITICAL",
                "Teenusepakkuja kohustub rakendama järgmisi küberohtude tuvastamise ja reageerimise meetmeid: " +
                "(a) pidev automaatne monitooring (SIEM/SOC) 24/7 režiimis; (b) anomaaliate tuvastamise süsteem " +
                "võrguliikluse ja kasutajakäitumise analüüsiks; (c) automatiseeritud häiresüsteem kriitiliste sündmuste jaoks; " +
                "(d) dokumenteeritud intsidentidele reageerimise protseduurid; (e) regulaarselt uuendatavad " +
                "küberohu indikaatorite (IoC) andmebaasid."
            ),
            new DoraQuestion(31,
                "Kas viiakse läbi regulaarseid ICT turvalisuse teste?",
                "Are regular ICT security tests conducted?",
                "DORA Art. 24(1)",
                "DORA nõuab ICT turvalisuse testimise programmi.",
                "Koostage iga-aastane testimiskava.",
                QuestionCategory.TESTING,
                2, "HIGH",
                "Teenusepakkuja kohustub teostama järgmisi turvalisuse teste: (a) haavatavuste skaneerimist kvartaalselt; " +
                "(b) penetratsiooniteste vähemalt kord aastas sõltumatu kolmanda osapoole poolt; " +
                "(c) avatud lähtekoodiga tarkvara komponentide turvaanalüüsi (SCA) igas arendustsüklis; " +
                "(d) võrguturvalisuse hindamist poolaastas. Kõigi testide tulemused esitatakse Tellijale 10 tööpäeva jooksul."
            ),
            new DoraQuestion(32,
                "Kas kriitiliste ICT süsteemide jaoks tehakse TLPT teste?",
                "Are TLPT (Threat-Led Penetration Tests) conducted for critical ICT systems?",
                "DORA Art. 26(1)",
                "Olulised finantsasutused peavad läbima ohupõhise penetratsioonitestimise (TLPT) vähemalt iga 3 aasta järel.",
                "Planeerige TLPT testimine kooskõlas pädevate asutustega.",
                QuestionCategory.TESTING,
                2, "HIGH",
                "Teenusepakkuja kohustub osalema Tellija TLPT (Threat-Led Penetration Testing) programmis vastavalt " +
                "DORA artiklile 26: (a) võimaldama TLPT teste oma kriitilistes süsteemides, mis toetavad Tellija teenuseid; " +
                "(b) tegema koostööd TLPT testimeeskonnaga (Red Team); (c) abistama Tellijat TIBER-EU või samaväärsete " +
                "raamistike kohaste testide planeerimisel; (d) rakendama TLPT testide käigus leitud puuduste parandamise " +
                "meetmeid kokkulepitud tähtaegadeks."
            ),
            new DoraQuestion(33,
                "Kas testimise tulemused dokumenteeritakse ja puudused kõrvaldatakse?",
                "Are test results documented and deficiencies remediated?",
                "DORA Art. 24(5)",
                "Kõigi ICT turvalisuse testide tulemused tuleb dokumenteerida ja puudused klassifitseerida.",
                "Rakendage leitud haavatavuste parandamise SLA.",
                QuestionCategory.TESTING,
                2, "HIGH",
                "Teenusepakkuja kohustub: (a) dokumenteerima kõigi turvalisuse testide tulemused struktureeritud formaadis; " +
                "(b) klassifitseerima leitud haavatavused CVSS skaala alusel; (c) koostama paranduskava järgmiste SLA-dega: " +
                "CVSS 9.0+ (kriitiline) — 24 tundi; CVSS 7.0-8.9 (kõrge) — 7 päeva; CVSS 4.0-6.9 (keskmine) — 30 päeva; " +
                "(d) tõendama Tellijale paranduste rakendamist; (e) säilitama testitulemuste ajalugu vähemalt 3 aastat."
            ),
            new DoraQuestion(34,
                "Kas ICT ärijätkuvuse plaane testitakse regulaarselt?",
                "Are ICT business continuity plans tested regularly?",
                "DORA Art. 11(6)",
                "ICT ärijätkuvuse ja taastamise plaane tuleb testida vähemalt kord aastas.",
                "Viige läbi iga-aastased ärijätkuvuse harjutused.",
                QuestionCategory.TESTING,
                2, "HIGH",
                "Teenusepakkuja kohustub testima ärijätkuvuse ja taastamiskavasid: (a) täismahus failover-testid " +
                "vähemalt kord aastas; (b) andmete taastamise testid vähemalt poolaastas; " +
                "(c) kriisikommunikatsiooni harjutused kord aastas; (d) tabletop-harjutused koos Tellijaga vähemalt " +
                "kord aastas; (e) testide tulemused ja paranduskava esitatakse Tellijale 10 tööpäeva jooksul."
            ),
            new DoraQuestion(35,
                "Kas finantsasutus osaleb küberohuteavet jagavas kogukonnas?",
                "Does the financial entity participate in a cyber threat intelligence sharing community?",
                "DORA Art. 45(1)",
                "DORA julgustab finantsasutusi osalema küberohuteavet jagavates kogukondades.",
                "Liituge valdkondliku ISAC-ga.",
                QuestionCategory.INFORMATION_SHARING,
                1, "MEDIUM",
                "Teenusepakkuja kohustub: (a) osalema vähemalt ühes valdkondlikus küberohuteavet jagavas kogukonnas " +
                "(ISAC, CERT või samaväärne); (b) jagama Tellijaga asjakohast küberohuteavet, mis võib mõjutada Tellija " +
                "teenuseid; (c) integreerima saadud ohuteabe oma kaitsemeetmetesse; (d) rakendama struktureeritud " +
                "ohuteabe jagamise protsessi (nt STIX/TAXII formaadis)."
            ),
            new DoraQuestion(36,
                "Kas on protsess küberohu teabe vastuvõtmiseks ja kasutamiseks?",
                "Is there a process for receiving and using cyber threat intelligence?",
                "DORA Art. 45(2)",
                "Saadud küberohuteavet tuleb analüüsida, valideerida ja integreerida oma riskihalduse protsessidesse.",
                "Kehtestage ohuteabe töötlemise protsess.",
                QuestionCategory.INFORMATION_SHARING,
                1, "MEDIUM",
                "Teenusepakkuja kohustub kehtestama küberohuteavet töötlemise protsessi: (a) sissetulevate ohuteadete " +
                "vastuvõtmine ja triaaž; (b) ohuteabe valideerimine ja rikastamine kontekstiga; (c) asjakohase ohuteabe " +
                "levitamine vastutavatele meeskondadele; (d) ohuteabe põhjal kaitsemeetmete ajakohastamine; " +
                "(e) ohuteabe töötlemise efektiivsuse regulaarne hindamine."
            ),
            new DoraQuestion(37,
                "Kas jagatakse olulist intsidendi teavet teiste finantsasutustega?",
                "Is significant incident information shared with other financial entities?",
                "DORA Art. 45(3)",
                "Anonümiseeritud intsidendi teabe jagamine aitab kogu finantssektoril paremini valmistuda sarnasteks rünnakuteks.",
                "Osalege regulaarselt sektoripõhistel intsidendi jagamise kohtumistel.",
                QuestionCategory.INFORMATION_SHARING,
                1, "MEDIUM",
                "Teenusepakkuja kohustub toetama Tellijat intsidenditeabe jagamisel: (a) koostama anonümiseeritud " +
                "intsidendiraporteid jagamiseks finantssektori kogukonnaga; (b) osalema Tellija algatatud intsidentide " +
                "jagamise kohtumistel; (c) panustama DORA artikli 45 kohastesse vabatahtlikesse teabevahetusmehhanismidesse; " +
                "(d) tagama, et jagatud teave ei sisalda konfidentsiaalset äriteamet."
            )
        );
    }

    public List<DoraQuestion> getAllQuestions() {
        return questions;
    }

    public Optional<DoraQuestion> getById(int id) {
        return questions.stream().filter(q -> q.id() == id).findFirst();
    }
}
