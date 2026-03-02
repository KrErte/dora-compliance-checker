import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { LangService } from '../lang.service';
import { Meta, Title } from '@angular/platform-browser';

interface BlogArticle {
  slug: string;
  category: 'DORA' | 'NIS2';
  date: string;
  readTime: number;
  title: { et: string; en: string };
  excerpt: { et: string; en: string };
  content: { et: string; en: string };
  tags: string[];
}

const ARTICLES: BlogArticle[] = [
  {
    slug: 'what-is-dora',
    category: 'DORA',
    date: '2026-02-15',
    readTime: 8,
    title: {
      et: 'Mis on DORA? Juhend finantsasutustele',
      en: 'What is DORA? A Guide for Financial Institutions'
    },
    excerpt: {
      et: 'DORA (Digital Operational Resilience Act) on EL-i määrus, mis kehtestab ühtsed nõuded finantsasutuste digitaalsele vastupidavusele. Artikkel selgitab peamised kohustused ja tähtajad.',
      en: 'DORA (Digital Operational Resilience Act) is an EU regulation establishing uniform requirements for digital operational resilience in financial institutions. This article explains key obligations and deadlines.'
    },
    content: {
      et: `<h2>Mis on DORA?</h2>
<p>DORA ehk <strong>Digital Operational Resilience Act</strong> (EL 2022/2554) on Euroopa Liidu määrus, mis jõustus 16. jaanuaril 2023 ja mida kohaldatakse alates <strong>17. jaanuarist 2025</strong>. Määrus loob ühtse raamistiku finantssektori digitaalse operatiivse vastupidavuse tagamiseks kogu EL-is.</p>

<h2>Keda DORA puudutab?</h2>
<p>DORA kohaldub enam kui <strong>22 000 finantsüksusele</strong> ja IKT-teenusepakkujale kogu EL-is, sealhulgas:</p>
<ul>
<li>Krediidiasutused (pangad)</li>
<li>Investeerimisühingud</li>
<li>Kindlustusandjad ja -vahendajad</li>
<li>Makseasutused ja e-raha asutused</li>
<li>Fondivalitsejad ja pensionifondid</li>
<li>Krüptovarateenuse pakkujad</li>
<li>Kriitilised IKT kolmanda osapoole teenusepakkujad (CTPP)</li>
</ul>

<h2>DORA viis sammast</h2>
<p>Määrus koosneb viiest peamisest valdkonnast:</p>

<h3>1. IKT riskihaldus (Artiklid 5–16)</h3>
<p>Finantsasutused peavad rakendama tervikliku IKT riskihalduse raamistiku, mis hõlmab riskide tuvastamist, kaitset, avastamist, reageerimist ja taastumist.</p>

<h3>2. IKT-ga seotud intsidentide haldamine (Artiklid 17–23)</h3>
<p>Kohustus klassifitseerida, jälgida ja raporteerida olulisi IKT-intsidente pädevatele asutustele. Esialgne teatis tuleb esitada 4 tunni jooksul, vahearuanne 72 tunni jooksul.</p>

<h3>3. Digitaalse operatiivse vastupidavuse testimine (Artiklid 24–27)</h3>
<p>Regulaarne testimine, sh haavatavuse analüüsid ja läbistustestimine. Süsteemselt olulised asutused peavad läbi viima TLPT teste (Threat-Led Penetration Testing) vähemalt iga 3 aasta järel.</p>

<h3>4. IKT kolmanda osapoole riski haldamine (Artiklid 28–44)</h3>
<p>Lepingulised nõuded IKT-teenusepakkujatele, riskihindamine, teaberegister ja auditeerimisõigused. Artikkel 30 kehtestab kohustuslikud lepingutingimused.</p>

<h3>5. Teabe jagamise kokkulepped (Artikkel 45)</h3>
<p>Finantsasutused võivad vahetada küberohuteavet omavahel ja CERT/ISAC asutustega.</p>

<h2>Peamised tähtajad</h2>
<ul>
<li><strong>17. jaanuar 2025</strong> — DORA kohaldamise algus</li>
<li><strong>30. aprill 2025</strong> — Teaberegistri (RoI) esimene esitamine regulaatorile</li>
<li><strong>2025 Q2–Q3</strong> — Esimesed RTS/ITS standardid jõustuvad</li>
<li><strong>17. jaanuar 2026</strong> — CTPP järelevalveraamistik täielikult toimiv</li>
</ul>

<h2>Kuidas DoraAudit aitab?</h2>
<p>DoraAudit pakub automatiseeritud DORA vastavushindamist, lepinguanalüüsi Art. 30 nõuete vastu, teaberegistri (RoI) haldamist ja palju muud. Alustage tasuta hindamisega juba täna.</p>`,
      en: `<h2>What is DORA?</h2>
<p>DORA, the <strong>Digital Operational Resilience Act</strong> (EU 2022/2554), is a European Union regulation that entered into force on January 16, 2023, and applies from <strong>January 17, 2025</strong>. It creates a unified framework for ensuring digital operational resilience across the EU financial sector.</p>

<h2>Who Does DORA Apply To?</h2>
<p>DORA applies to more than <strong>22,000 financial entities</strong> and ICT service providers across the EU, including:</p>
<ul>
<li>Credit institutions (banks)</li>
<li>Investment firms</li>
<li>Insurance and reinsurance undertakings</li>
<li>Payment institutions and e-money institutions</li>
<li>Fund managers and pension funds</li>
<li>Crypto-asset service providers</li>
<li>Critical ICT third-party service providers (CTPPs)</li>
</ul>

<h2>The Five Pillars of DORA</h2>
<p>The regulation is built around five key areas:</p>

<h3>1. ICT Risk Management (Articles 5–16)</h3>
<p>Financial entities must implement a comprehensive ICT risk management framework covering identification, protection, detection, response, and recovery.</p>

<h3>2. ICT-Related Incident Management (Articles 17–23)</h3>
<p>Obligation to classify, monitor, and report major ICT incidents to competent authorities. Initial notification within 4 hours, intermediate report within 72 hours.</p>

<h3>3. Digital Operational Resilience Testing (Articles 24–27)</h3>
<p>Regular testing including vulnerability assessments and penetration testing. Systemically important entities must conduct TLPT (Threat-Led Penetration Testing) at least every 3 years.</p>

<h3>4. ICT Third-Party Risk Management (Articles 28–44)</h3>
<p>Contractual requirements for ICT service providers, risk assessment, register of information, and audit rights. Article 30 establishes mandatory contractual provisions.</p>

<h3>5. Information Sharing Arrangements (Article 45)</h3>
<p>Financial entities may exchange cyber threat intelligence among themselves and with CERT/ISAC bodies.</p>

<h2>Key Deadlines</h2>
<ul>
<li><strong>January 17, 2025</strong> — DORA application date</li>
<li><strong>April 30, 2025</strong> — First Register of Information (RoI) submission to regulators</li>
<li><strong>2025 Q2–Q3</strong> — First RTS/ITS standards enter into force</li>
<li><strong>January 17, 2026</strong> — CTPP oversight framework fully operational</li>
</ul>

<h2>How DoraAudit Helps</h2>
<p>DoraAudit provides automated DORA compliance assessments, contract analysis against Art. 30 requirements, Register of Information (RoI) management, and much more. Start your free assessment today.</p>`
    },
    tags: ['DORA', 'EU 2022/2554', 'compliance', 'financial regulation']
  },
  {
    slug: 'dora-article-30-contracts',
    category: 'DORA',
    date: '2026-02-20',
    readTime: 10,
    title: {
      et: 'DORA Artikkel 30: IKT lepingute nõuded selgitatud',
      en: 'DORA Article 30: ICT Contract Requirements Explained'
    },
    excerpt: {
      et: 'Artikkel 30 kehtestab 27 kohustuslikku lepingutingimust IKT-teenuste lepingutele. Siit leiad täieliku ülevaate, mida sinu lepingud peavad sisaldama.',
      en: 'Article 30 establishes 27 mandatory contractual provisions for ICT service agreements. Here is a complete overview of what your contracts must include.'
    },
    content: {
      et: `<h2>Miks on Artikkel 30 oluline?</h2>
<p>DORA Artikkel 30 on üks kõige praktilisema mõjuga sätted, kuna see nõuab konkreetseid muudatusi kõigis IKT-teenuste lepingutes. Iga finantsasutus, mis kasutab IKT-teenuseid (pilv, tarkvara, infrastruktuur, andmetöötlus), peab tagama, et lepingud vastavad Art. 30 nõuetele.</p>

<h2>27 kohustuslikku lepingutingimust</h2>
<p>Artikkel 30 jagab nõuded kahte kategooriasse:</p>

<h3>Kõikidele IKT-lepingutele (Art. 30 lõige 2):</h3>
<ul>
<li><strong>Teenuse kirjeldus</strong> — Selge ja täielik teenuste loetelu ning kvaliteedinäitajad (SLA)</li>
<li><strong>Andmete asukoht</strong> — Andmete töötlemise ja hoiustamise geograafiline asukoht</li>
<li><strong>Andmekaitse</strong> — Andmete kättesaadavuse, autentsuse, tervikluse ja konfidentsiaalsuse tagamine</li>
<li><strong>Intsidentidest teavitamine</strong> — Kohustus teavitada IKT-intsidentidest ning koostöö kohustus uurimisel</li>
<li><strong>Koostöö regulaatoriga</strong> — Teenusepakkuja koostöökohustus pädeva asutuse ees</li>
<li><strong>Lepingu lõpetamine</strong> — Lõpetamise tingimused, sh üleminekuperiood ja andmete tagastamine</li>
</ul>

<h3>Kriitiliste ja oluliste funktsioonide lepingutele (Art. 30 lõige 3):</h3>
<ul>
<li><strong>Auditeerimisõigused</strong> — Finantsasutuse ja regulaatori juurdepääs auditi teostamiseks</li>
<li><strong>Väljumisstrateegia</strong> — Detailne plaan teenuse üleviimiseks teisele pakkujale</li>
<li><strong>Alltöövõtjate haldamine</strong> — Olulistest alltöövõtjate muudatustest teavitamine</li>
<li><strong>Teenustaseme taastamine</strong> — Konkreetsed RTO ja RPO näitajad</li>
<li><strong>Turvameetmed</strong> — Minimaalsed turvanõuded vastavalt riskihinnangule</li>
</ul>

<h2>Praktiline kontrollnimekiri</h2>
<p>Kasutage DoraAudit lepinguanalüüsi tööriista, et automaatselt kontrollida oma lepingute vastavust kõigile 27 nõudele. Tööriist tuvastab puuduvad klauslid ja pakub soovitusi.</p>

<h2>Levinud puudused</h2>
<p>Meie analüüside põhjal on levinuimad puudused:</p>
<ol>
<li>Puuduv väljumisstrateegia (68% lepingutest)</li>
<li>Ebamäärased auditeerimisõigused (54%)</li>
<li>Puuduv andmete asukoha määratlus (47%)</li>
<li>Puuduv alltöövõtjate muudatustest teavitamise kohustus (43%)</li>
</ol>`,
      en: `<h2>Why is Article 30 Important?</h2>
<p>DORA Article 30 is one of the most practically impactful provisions, as it requires specific changes to all ICT service agreements. Every financial entity using ICT services (cloud, software, infrastructure, data processing) must ensure their contracts comply with Art. 30 requirements.</p>

<h2>27 Mandatory Contractual Provisions</h2>
<p>Article 30 divides requirements into two categories:</p>

<h3>For All ICT Service Agreements (Art. 30(2)):</h3>
<ul>
<li><strong>Service description</strong> — Clear and complete list of services with quality indicators (SLAs)</li>
<li><strong>Data location</strong> — Geographic location of data processing and storage</li>
<li><strong>Data protection</strong> — Ensuring availability, authenticity, integrity, and confidentiality</li>
<li><strong>Incident notification</strong> — Obligation to report ICT incidents and cooperate in investigations</li>
<li><strong>Regulatory cooperation</strong> — Service provider's cooperation obligations with competent authorities</li>
<li><strong>Contract termination</strong> — Termination conditions, including transition period and data return</li>
</ul>

<h3>For Critical or Important Function Contracts (Art. 30(3)):</h3>
<ul>
<li><strong>Audit rights</strong> — Financial entity and regulator access for audit purposes</li>
<li><strong>Exit strategy</strong> — Detailed plan for transitioning to another provider</li>
<li><strong>Subcontractor management</strong> — Notification of material subcontractor changes</li>
<li><strong>Service level recovery</strong> — Specific RTO and RPO targets</li>
<li><strong>Security measures</strong> — Minimum security requirements based on risk assessment</li>
</ul>

<h2>Practical Checklist</h2>
<p>Use DoraAudit's contract analysis tool to automatically check your contracts against all 27 requirements. The tool identifies missing clauses and provides recommendations.</p>

<h2>Common Gaps</h2>
<p>Based on our analyses, the most common gaps are:</p>
<ol>
<li>Missing exit strategy (68% of contracts)</li>
<li>Vague audit rights (54%)</li>
<li>Missing data location specification (47%)</li>
<li>Missing subcontractor change notification obligation (43%)</li>
</ol>`
    },
    tags: ['DORA', 'Article 30', 'ICT contracts', 'compliance']
  },
  {
    slug: 'dora-register-of-information',
    category: 'DORA',
    date: '2026-03-01',
    readTime: 7,
    title: {
      et: 'DORA Teaberegister (RoI): mida pead teadma',
      en: 'DORA Register of Information (RoI): What You Need to Know'
    },
    excerpt: {
      et: 'DORA Art. 28(3) nõuab finantsasutustelt teaberegistri pidamist kõigi IKT kolmanda osapoole lepingute kohta. Selgitame xBRL-CSV formaati ja ESA esitamise nõudeid.',
      en: 'DORA Art. 28(3) requires financial entities to maintain a register of information for all ICT third-party arrangements. We explain the xBRL-CSV format and ESA submission requirements.'
    },
    content: {
      et: `<h2>Mis on teaberegister?</h2>
<p>DORA artikkel 28(3) kohustab finantsasutusi pidama ja ajakohastama <strong>teaberegistrit</strong> (Register of Information, RoI) kõigi IKT kolmanda osapoole teenusepakkujatega sõlmitud lepinguliste kokkulepete kohta.</p>

<h2>xBRL-CSV formaat</h2>
<p>EBA, ESMA ja EIOPA (ESA-d) on kehtestanud standarditud formaadi teaberegistri esitamiseks. Register koosneb <strong>13 tabelist</strong>:</p>
<ul>
<li><strong>B_01.01</strong> — Finantsüksuse identifitseerimisandmed</li>
<li><strong>B_02.01</strong> — IKT kolmanda osapoole teenusepakkujate andmed</li>
<li><strong>B_03.01</strong> — IKT teenuste funktsionaalne klassifikatsioon</li>
<li><strong>B_04.01</strong> — Lepingulised kokkulepped</li>
<li><strong>B_05.01</strong> — IKT teenuste kokkulepped</li>
<li><strong>B_05.02</strong> — Väljumisstrateegiad</li>
<li><strong>B_06.01</strong> — Andmetöötluse jurisdiktsioonid</li>
<li><strong>B_07.01</strong> — Alltöövõtjate ahel</li>
<li>+ 5 lisatabelit (B_99 seeria)</li>
</ul>

<h2>Esitamise tähtajad</h2>
<p>Esimene kohustuslik esitamine pädevale asutusele on <strong>30. aprill 2025</strong>. Edaspidi tuleb registrit ajakohastada vähemalt kord aastas ja esitada regulaatorile nõudmisel.</p>

<h2>Valideerimise reeglid</h2>
<p>ESA on kehtestanud üle <strong>125 valideerimisreegli</strong>, mis kontrollivad:</p>
<ul>
<li>Andmete formaadi korrektsust (kuupäevad, LEI koodid, ISO standardid)</li>
<li>Kohustuslike väljade täitmist</li>
<li>Viitterviklust tabelite vahel (nt B_04.01 viited B_02.01-le)</li>
<li>DPM suletud nimekirjade väärtusi</li>
<li>Loogilisi seoseid (nt kriitiliste funktsioonide väljumisstrateegiad)</li>
</ul>

<h2>DoraAudit RoI moodul</h2>
<p>DoraAudit pakub täielikku RoI haldamise lahendust, mis sisaldab 7-sammulist viisardit, automaatset xBRL-CSV eksporti ja üle 80 valideerimisreegli. Alustage registri koostamist juba täna.</p>`,
      en: `<h2>What is the Register of Information?</h2>
<p>DORA Article 28(3) requires financial entities to maintain and keep up to date a <strong>Register of Information</strong> (RoI) in relation to all contractual arrangements with ICT third-party service providers.</p>

<h2>xBRL-CSV Format</h2>
<p>The EBA, ESMA, and EIOPA (ESAs) have established a standardized format for RoI submission. The register consists of <strong>13 templates</strong>:</p>
<ul>
<li><strong>B_01.01</strong> — Financial entity identification data</li>
<li><strong>B_02.01</strong> — ICT third-party service provider data</li>
<li><strong>B_03.01</strong> — ICT services functional classification</li>
<li><strong>B_04.01</strong> — Contractual arrangements</li>
<li><strong>B_05.01</strong> — ICT service arrangements</li>
<li><strong>B_05.02</strong> — Exit strategies</li>
<li><strong>B_06.01</strong> — Data processing jurisdictions</li>
<li><strong>B_07.01</strong> — Subcontractor chain</li>
<li>+ 5 additional templates (B_99 series)</li>
</ul>

<h2>Submission Deadlines</h2>
<p>The first mandatory submission to the competent authority is <strong>April 30, 2025</strong>. Going forward, the register must be updated at least annually and submitted to the regulator upon request.</p>

<h2>Validation Rules</h2>
<p>The ESAs have established over <strong>125 validation rules</strong> that check:</p>
<ul>
<li>Data format correctness (dates, LEI codes, ISO standards)</li>
<li>Mandatory field completion</li>
<li>Referential integrity between templates (e.g., B_04.01 references to B_02.01)</li>
<li>DPM closed list values</li>
<li>Logical relationships (e.g., exit strategies for critical functions)</li>
</ul>

<h2>DoraAudit RoI Module</h2>
<p>DoraAudit provides a complete RoI management solution including a 7-step wizard, automatic xBRL-CSV export, and over 80 validation rules. Start building your register today.</p>`
    },
    tags: ['DORA', 'RoI', 'xBRL-CSV', 'ESA', 'register of information']
  },
  {
    slug: 'dora-vs-nis2',
    category: 'DORA',
    date: '2026-01-28',
    readTime: 6,
    title: {
      et: 'DORA vs NIS2: peamised erinevused finantsasutustele',
      en: 'DORA vs NIS2: Key Differences for Financial Institutions'
    },
    excerpt: {
      et: 'DORA ja NIS2 on mõlemad EL-i küberturvalisuse regulatsioonid, kuid neil on erinevad kohaldamisalad ja nõuded. Selgitame, kuidas need kaks raamistikku omavahel suhestuvad.',
      en: 'DORA and NIS2 are both EU cybersecurity regulations but with different scopes and requirements. We explain how these two frameworks relate to each other.'
    },
    content: {
      et: `<h2>Kaks regulatsiooni, üks eesmärk</h2>
<p>Nii DORA kui NIS2 on osa EL-i küberturvalisuse strateegiast, kuid nende kohaldamisala erineb:</p>
<ul>
<li><strong>DORA</strong> — spetsiaalselt finantssektorile, lex specialis NIS2 suhtes</li>
<li><strong>NIS2</strong> — laiapõhjaline, hõlmab 18 sektorit (sh energia, transport, tervishoid, digitaalne infrastruktuur)</li>
</ul>

<h2>Peamised erinevused</h2>
<table>
<tr><th>Aspekt</th><th>DORA</th><th>NIS2</th></tr>
<tr><td>Õiguslik vorm</td><td>Määrus (otsekohalduv)</td><td>Direktiiv (riigisisene ülevõtmine)</td></tr>
<tr><td>Kohaldamisala</td><td>Finantssektor</td><td>18 sektorit</td></tr>
<tr><td>Intsidendi raporteerimise tähtaeg</td><td>4h esialgne, 72h vahearuanne</td><td>24h esialgne, 72h täisaruanne</td></tr>
<tr><td>Kolmanda osapoole riskihaldus</td><td>Detailne (Art. 28–44)</td><td>Üldine tarneahela turvalisus</td></tr>
<tr><td>Testimise nõuded</td><td>TLPT iga 3 aastat</td><td>Üldised testimise nõuded</td></tr>
<tr><td>Trahvid</td><td>Art. 50–51 (liikmesriigi otsustada)</td><td>€10M või 2% käibest</td></tr>
</table>

<h2>Lex Specialis põhimõte</h2>
<p>DORA Art. 1(2) sätestab, et finantsasutuste puhul on DORA lex specialis ehk erinorm NIS2 suhtes. See tähendab, et kui finantsasutus täidab DORA nõudeid, loetakse ta vastavaks ka NIS2 nõuetele samas valdkonnas.</p>

<h2>Praktiline mõju</h2>
<p>Finantsasutused peavad primaarelt keskenduma DORA-le, kuid NIS2 nõuded võivad kehtida nende tütarettevõtetele, mis tegutsevad teistes sektorites. DoraAudit pakub mõlema regulatsiooni hindamist ühes platvormis.</p>`,
      en: `<h2>Two Regulations, One Goal</h2>
<p>Both DORA and NIS2 are part of the EU's cybersecurity strategy, but their scope differs:</p>
<ul>
<li><strong>DORA</strong> — specifically for the financial sector, lex specialis to NIS2</li>
<li><strong>NIS2</strong> — broad-based, covering 18 sectors (including energy, transport, healthcare, digital infrastructure)</li>
</ul>

<h2>Key Differences</h2>
<table>
<tr><th>Aspect</th><th>DORA</th><th>NIS2</th></tr>
<tr><td>Legal form</td><td>Regulation (directly applicable)</td><td>Directive (national transposition)</td></tr>
<tr><td>Scope</td><td>Financial sector</td><td>18 sectors</td></tr>
<tr><td>Incident reporting deadline</td><td>4h initial, 72h intermediate</td><td>24h initial, 72h full report</td></tr>
<tr><td>Third-party risk management</td><td>Detailed (Art. 28–44)</td><td>General supply chain security</td></tr>
<tr><td>Testing requirements</td><td>TLPT every 3 years</td><td>General testing requirements</td></tr>
<tr><td>Penalties</td><td>Art. 50–51 (member state decision)</td><td>€10M or 2% of turnover</td></tr>
</table>

<h2>Lex Specialis Principle</h2>
<p>DORA Art. 1(2) establishes that for financial entities, DORA is lex specialis (special law) in relation to NIS2. This means that if a financial entity complies with DORA requirements, it is also considered compliant with NIS2 requirements in the same area.</p>

<h2>Practical Impact</h2>
<p>Financial entities should primarily focus on DORA, but NIS2 requirements may apply to their subsidiaries operating in other sectors. DoraAudit provides assessments for both regulations in a single platform.</p>`
    },
    tags: ['DORA', 'NIS2', 'comparison', 'lex specialis']
  },
  {
    slug: 'nis2-who-does-it-apply-to',
    category: 'NIS2',
    date: '2026-02-10',
    readTime: 7,
    title: {
      et: 'NIS2 direktiiv: kellele see kohaldub?',
      en: 'NIS2 Directive: Who Does It Apply To?'
    },
    excerpt: {
      et: 'NIS2 direktiiv laiendab oluliselt EL-i küberturvalisuse regulatsiooni kohaldamisala. Kontrollige, kas teie organisatsioon kuulub NIS2 kohaldamisalasse.',
      en: 'The NIS2 directive significantly expands the scope of EU cybersecurity regulation. Check whether your organization falls under NIS2 scope.'
    },
    content: {
      et: `<h2>NIS2 ülevaade</h2>
<p>NIS2 (Network and Information Security Directive 2, EL 2022/2555) on EL-i direktiiv, mis asendab algset NIS direktiivi. See jõustus <strong>16. jaanuaril 2023</strong> ja liikmesriigid pidid selle üle võtma <strong>17. oktoobriks 2024</strong>.</p>

<h2>Kohaldamisala</h2>
<p>NIS2 kohaldub organisatsioonidele, mis tegutsevad 18 sektoris ja ületavad teatud suuruskriteeriume:</p>

<h3>Elutähtsad üksused (Lisa I):</h3>
<ul>
<li>Energia (elekter, gaas, nafta, vesinik, kaugküte)</li>
<li>Transport (lennu-, raudtee-, vee-, maanteetransport)</li>
<li>Pangandus ja finantsturuinfrastruktuur</li>
<li>Tervishoid</li>
<li>Joogivesi ja reovee käitlemine</li>
<li>Digitaalne infrastruktuur (DNS, TLD, pilvteenused, andmekeskused)</li>
<li>IKT teenuste haldamine (B2B)</li>
<li>Avalik haldus</li>
<li>Kosmos</li>
</ul>

<h3>Olulised üksused (Lisa II):</h3>
<ul>
<li>Posti- ja kullerteenused</li>
<li>Jäätmekäitlus</li>
<li>Keemia</li>
<li>Toiduainetööstus</li>
<li>Tootmine (meditsiiniseadmed, elektroonika, masinad, sõidukid)</li>
<li>Digitaalsed teenusepakkujad (turud, otsingumootorid, sotsiaalmeedia)</li>
<li>Teadustegevus</li>
</ul>

<h2>Suuruse kriteeriumid</h2>
<p>Üldreeglina kohaldub NIS2 organisatsioonidele, kellel on:</p>
<ul>
<li><strong>Keskmise suurusega:</strong> 50+ töötajat VÕI €10M+ käive</li>
<li><strong>Suurettevõte:</strong> 250+ töötajat VÕI €50M+ käive</li>
</ul>
<p>Mõned sektorid (nt DNS, TLD, avalik haldus) kohalduvad sõltumata suurusest.</p>

<h2>Kasutage DoraAudit NIS2 Scope Checkerit</h2>
<p>Meie tasuta tööriist kontrollib teie ettevõtte registrikoodi alusel, kas NIS2 direktiiv kohaldub. Tulemus saadaval sekunditega.</p>`,
      en: `<h2>NIS2 Overview</h2>
<p>NIS2 (Network and Information Security Directive 2, EU 2022/2555) is an EU directive replacing the original NIS Directive. It entered into force on <strong>January 16, 2023</strong>, and member states were required to transpose it by <strong>October 17, 2024</strong>.</p>

<h2>Scope</h2>
<p>NIS2 applies to organizations operating in 18 sectors that exceed certain size thresholds:</p>

<h3>Essential Entities (Annex I):</h3>
<ul>
<li>Energy (electricity, gas, oil, hydrogen, district heating)</li>
<li>Transport (air, rail, water, road)</li>
<li>Banking and financial market infrastructure</li>
<li>Health</li>
<li>Drinking water and wastewater</li>
<li>Digital infrastructure (DNS, TLD, cloud services, data centers)</li>
<li>ICT service management (B2B)</li>
<li>Public administration</li>
<li>Space</li>
</ul>

<h3>Important Entities (Annex II):</h3>
<ul>
<li>Postal and courier services</li>
<li>Waste management</li>
<li>Chemicals</li>
<li>Food production</li>
<li>Manufacturing (medical devices, electronics, machinery, vehicles)</li>
<li>Digital providers (marketplaces, search engines, social media)</li>
<li>Research</li>
</ul>

<h2>Size Thresholds</h2>
<p>As a general rule, NIS2 applies to organizations with:</p>
<ul>
<li><strong>Medium-sized:</strong> 50+ employees OR €10M+ turnover</li>
<li><strong>Large:</strong> 250+ employees OR €50M+ turnover</li>
</ul>
<p>Some sectors (e.g., DNS, TLD, public administration) apply regardless of size.</p>

<h2>Use DoraAudit's NIS2 Scope Checker</h2>
<p>Our free tool checks whether NIS2 applies to your organization based on your company registry code. Results available in seconds.</p>`
    },
    tags: ['NIS2', 'scope', 'directive', 'cybersecurity']
  },
  {
    slug: 'nis2-incident-reporting',
    category: 'NIS2',
    date: '2026-02-25',
    readTime: 5,
    title: {
      et: 'NIS2 intsidentidest teavitamine: 24–72 tunni ajajoon',
      en: 'NIS2 Incident Reporting: The 24–72 Hour Timeline'
    },
    excerpt: {
      et: 'NIS2 kehtestab ranged intsidentidest teavitamise tähtajad. Esialgne hoiatus 24 tunni jooksul, täisaruanne 72 tunni jooksul. Selgitame protsessi samm-sammult.',
      en: 'NIS2 establishes strict incident notification deadlines. Early warning within 24 hours, full report within 72 hours. We explain the process step by step.'
    },
    content: {
      et: `<h2>Intsidentidest teavitamise kohustus</h2>
<p>NIS2 artikkel 23 kehtestab ranged teavitamise tähtajad oluliste turvaintsidentide korral. Teavitamata jätmine võib kaasa tuua trahvi kuni <strong>€10 miljonit</strong> või <strong>2% aastakäibest</strong>.</p>

<h2>Kolmeastmeline teavitamise ajajoon</h2>

<h3>1. Esialgne hoiatus — 24 tundi</h3>
<p>Esimene teavitus pädevale asutusele (Eestis RIA) tuleb esitada <strong>24 tunni jooksul</strong> pärast intsidendist teadasaamist. See peab sisaldama:</p>
<ul>
<li>Kas intsidendi põhjustas ebaseaduslik tegevus</li>
<li>Kas intsidendil võib olla piiriülene mõju</li>
<li>Esmane mõjuhinnang</li>
</ul>

<h3>2. Intsidendi teavitus — 72 tundi</h3>
<p><strong>72 tunni jooksul</strong> tuleb esitada detailsem teavitus, mis sisaldab:</p>
<ul>
<li>Intsidendi kirjeldus ja tõsidus</li>
<li>Mõjutatud teenused ja kasutajad</li>
<li>Indikaatorid (IoC)</li>
<li>Võetud ja planeeritud meetmed</li>
</ul>

<h3>3. Lõpparuanne — 1 kuu</h3>
<p><strong>Ühe kuu jooksul</strong> pärast intsidendi teavitust tuleb esitada lõpparuanne:</p>
<ul>
<li>Intsidendi täielik kirjeldus ja juurpõhjuse analüüs</li>
<li>Rakendatud meetmed</li>
<li>Piiriülene mõju (kui asjakohane)</li>
</ul>

<h2>Mis on "oluline intsident"?</h2>
<p>NIS2 kohaselt on intsident oluline, kui see:</p>
<ul>
<li>Põhjustab või võib põhjustada tõsiseid häireid teenuste osutamisel</li>
<li>Mõjutab või võib mõjutada füüsilisi või juriidilisi isikuid, tekitades märkimisväärset kahju</li>
</ul>

<h2>Praktiline soovitus</h2>
<p>Koostage intsidendi reageerimise plaan juba enne intsidendi toimumist. DoraAudit intsidendi simulaator võimaldab harjutada raporteerimise protsessi ja kontrollida, kas teie meeskond suudab tähtaegu täita.</p>`,
      en: `<h2>Incident Notification Obligation</h2>
<p>NIS2 Article 23 establishes strict notification deadlines for significant security incidents. Failure to notify can result in fines up to <strong>€10 million</strong> or <strong>2% of annual turnover</strong>.</p>

<h2>Three-Stage Notification Timeline</h2>

<h3>1. Early Warning — 24 Hours</h3>
<p>The first notification to the competent authority must be submitted <strong>within 24 hours</strong> of becoming aware of the incident. It must include:</p>
<ul>
<li>Whether the incident was caused by unlawful activity</li>
<li>Whether the incident may have cross-border impact</li>
<li>Initial impact assessment</li>
</ul>

<h3>2. Incident Notification — 72 Hours</h3>
<p>A more detailed notification must be submitted <strong>within 72 hours</strong>, including:</p>
<ul>
<li>Incident description and severity</li>
<li>Affected services and users</li>
<li>Indicators of compromise (IoC)</li>
<li>Measures taken and planned</li>
</ul>

<h3>3. Final Report — 1 Month</h3>
<p>A final report must be submitted <strong>within one month</strong> of the incident notification:</p>
<ul>
<li>Complete incident description and root cause analysis</li>
<li>Measures implemented</li>
<li>Cross-border impact (if applicable)</li>
</ul>

<h2>What is a "Significant Incident"?</h2>
<p>Under NIS2, an incident is significant if it:</p>
<ul>
<li>Causes or is capable of causing severe operational disruption of services</li>
<li>Affects or is capable of affecting natural or legal persons by causing considerable damage</li>
</ul>

<h2>Practical Advice</h2>
<p>Prepare an incident response plan before an incident occurs. DoraAudit's incident simulator allows you to practice the reporting process and verify that your team can meet the deadlines.</p>`
    },
    tags: ['NIS2', 'incident reporting', 'CSIRT', 'cybersecurity']
  },
  {
    slug: 'dora-compliance-checklist-2025',
    category: 'DORA',
    date: '2026-01-15',
    readTime: 9,
    title: {
      et: 'DORA vastavuse kontrollnimekiri 2025–2026',
      en: 'DORA Compliance Checklist 2025–2026'
    },
    excerpt: {
      et: 'Täielik kontrollnimekiri DORA nõuete täitmiseks. 50+ punkti kõigi viie samba lõikes koos praktiliste juhistega ja tähtaegadega.',
      en: 'Complete checklist for DORA compliance. 50+ items across all five pillars with practical guidance and deadlines.'
    },
    content: {
      et: `<h2>DORA vastavuse kontrollnimekiri</h2>
<p>Kasutage seda kontrollnimekirja, et hinnata oma organisatsiooni valmisolekut DORA nõuete täitmiseks. Nimekiri on jagatud viie samba kaupa.</p>

<h3>Sammas 1: IKT riskihaldus</h3>
<ul>
<li>IKT riskihalduse raamistik on kehtestatud ja juhatuse poolt heaks kiidetud</li>
<li>IKT varade register on koostatud ja ajakohane</li>
<li>Riskihinnangud on läbi viidud kõigi kriitiliste süsteemide kohta</li>
<li>Äriprotsesside mõju analüüs (BIA) on teostatud</li>
<li>IKT turvalisuse poliitikad on dokumenteeritud ja rakendatud</li>
<li>Juurdepääsu halduse protsessid on paigas</li>
<li>Krüpteerimise poliitika on kehtestatud</li>
</ul>

<h3>Sammas 2: Intsidendi haldamine</h3>
<ul>
<li>IKT intsidentide klassifitseerimise raamistik on kehtestatud</li>
<li>Intsidendi reageerimise plaan on dokumenteeritud ja testitud</li>
<li>Teavitamise protsess pädevatele asutustele on paigas (4h/72h)</li>
<li>Intsidentide logimise ja jälgimise süsteemid on rakendatud</li>
<li>Regulaarsed intsidendi simulatsioonid viiakse läbi</li>
</ul>

<h3>Sammas 3: Vastupidavuse testimine</h3>
<ul>
<li>Testimise programm on kehtestatud ja dokumenteeritud</li>
<li>Haavatavuse analüüsid viiakse regulaarselt läbi</li>
<li>Läbistustestimine on planeeritud</li>
<li>TLPT on planeeritud (süsteemselt oluliste üksuste puhul)</li>
<li>Testimise tulemused dokumenteeritakse ja puudused kõrvaldatakse</li>
</ul>

<h3>Sammas 4: Kolmanda osapoole riskihaldus</h3>
<ul>
<li>Teaberegister (RoI) on koostatud kõigi IKT-teenuste lepingute kohta</li>
<li>Lepingud on kontrollitud Art. 30 nõuete vastu</li>
<li>Auditeerimisõigused on lepingutes tagatud</li>
<li>Väljumisstrateegiad on koostatud kriitiliste teenuste jaoks</li>
<li>Alltöövõtjate riskid on hinnatud</li>
<li>Kontsentratsioonianalüüs on teostatud</li>
</ul>

<h3>Sammas 5: Teabe jagamine</h3>
<ul>
<li>Küberohuteavituse kanalid on kehtestatud</li>
<li>CERT/ISAC liikmelisused on kaalutud</li>
<li>Teabe jagamise kokkulepped on dokumenteeritud</li>
</ul>

<h2>Järgmised sammud</h2>
<p>Alustage DoraAudit tasuta hindamisega, et saada personaalne tegevuskava ja detailne skoor iga samba kohta.</p>`,
      en: `<h2>DORA Compliance Checklist</h2>
<p>Use this checklist to assess your organization's readiness for DORA compliance. The list is organized by the five pillars.</p>

<h3>Pillar 1: ICT Risk Management</h3>
<ul>
<li>ICT risk management framework established and approved by management body</li>
<li>ICT asset register compiled and up to date</li>
<li>Risk assessments completed for all critical systems</li>
<li>Business impact analysis (BIA) performed</li>
<li>ICT security policies documented and implemented</li>
<li>Access management processes in place</li>
<li>Encryption policy established</li>
</ul>

<h3>Pillar 2: Incident Management</h3>
<ul>
<li>ICT incident classification framework established</li>
<li>Incident response plan documented and tested</li>
<li>Notification process to competent authorities in place (4h/72h)</li>
<li>Incident logging and monitoring systems implemented</li>
<li>Regular incident simulations conducted</li>
</ul>

<h3>Pillar 3: Resilience Testing</h3>
<ul>
<li>Testing programme established and documented</li>
<li>Vulnerability assessments conducted regularly</li>
<li>Penetration testing planned</li>
<li>TLPT planned (for systemically important entities)</li>
<li>Testing results documented and gaps remediated</li>
</ul>

<h3>Pillar 4: Third-Party Risk Management</h3>
<ul>
<li>Register of Information (RoI) compiled for all ICT service agreements</li>
<li>Contracts reviewed against Art. 30 requirements</li>
<li>Audit rights secured in contracts</li>
<li>Exit strategies prepared for critical services</li>
<li>Subcontractor risks assessed</li>
<li>Concentration risk analysis performed</li>
</ul>

<h3>Pillar 5: Information Sharing</h3>
<ul>
<li>Cyber threat intelligence channels established</li>
<li>CERT/ISAC memberships considered</li>
<li>Information sharing arrangements documented</li>
</ul>

<h2>Next Steps</h2>
<p>Start with DoraAudit's free assessment to get a personalized action plan and detailed score for each pillar.</p>`
    },
    tags: ['DORA', 'checklist', 'compliance', 'pillars']
  },
  {
    slug: 'nis2-penalties-enforcement',
    category: 'NIS2',
    date: '2026-02-05',
    readTime: 5,
    title: {
      et: 'NIS2 trahvid ja jõustamine: mida riskite',
      en: 'NIS2 Penalties and Enforcement: What You Risk'
    },
    excerpt: {
      et: 'NIS2 trahvid võivad ulatuda kuni €10 miljonini. Lisaks kannavad juhatuse liikmed isiklikku vastutust. Ülevaade sanktsioonidest ja jõustamismehhanismidest.',
      en: 'NIS2 fines can reach up to €10 million. Additionally, board members bear personal liability. Overview of sanctions and enforcement mechanisms.'
    },
    content: {
      et: `<h2>NIS2 sanktsioonid</h2>
<p>NIS2 kehtestab oluliselt karmimad sanktsioonid võrreldes algse NIS direktiiviga:</p>

<h3>Elutähtsad üksused:</h3>
<ul>
<li>Kuni <strong>€10 000 000</strong> või <strong>2% ülemaailmsest aastakäibest</strong> (kumb on suurem)</li>
</ul>

<h3>Olulised üksused:</h3>
<ul>
<li>Kuni <strong>€7 000 000</strong> või <strong>1,4% ülemaailmsest aastakäibest</strong> (kumb on suurem)</li>
</ul>

<h2>Juhatuse isiklik vastutus</h2>
<p>NIS2 artikkel 20 kehtestab <strong>juhatuse liikmete isikliku vastutuse</strong>. Juhatus peab:</p>
<ul>
<li>Heaks kiitma küberturvalisuse riskihalduse meetmed</li>
<li>Jälgima nende rakendamist</li>
<li>Läbima küberturvalisuse koolituse</li>
</ul>
<p>Juhatuse liikme isikliku vastutuse kalkuleerimiseks kasutage meie tasuta <strong>Board Risk Calculator</strong> tööriista.</p>

<h2>Jõustamismehhanismid</h2>
<p>Pädevatel asutustel on õigus:</p>
<ul>
<li>Viia läbi kohapealseid ja kaugauditeid</li>
<li>Nõuda andmeid ja dokumente</li>
<li>Anda siduvaid juhiseid ja hoiatusi</li>
<li>Peatada ajutiselt sertifikaate</li>
<li>Nimetada ajutine monitooringu ametnik</li>
</ul>

<h2>Eesti kontekst</h2>
<p>Eestis jõustus küberturvalisuse seaduse muudatus (KüTS), mis võtab üle NIS2 nõuded. Pädevaks asutuseks on <strong>Riigi Infosüsteemi Amet (RIA)</strong>. E-ITS (Eesti infoturbestandard) on peamine raamistik vastavuse hindamiseks.</p>`,
      en: `<h2>NIS2 Sanctions</h2>
<p>NIS2 establishes significantly stricter sanctions compared to the original NIS Directive:</p>

<h3>Essential Entities:</h3>
<ul>
<li>Up to <strong>€10,000,000</strong> or <strong>2% of global annual turnover</strong> (whichever is greater)</li>
</ul>

<h3>Important Entities:</h3>
<ul>
<li>Up to <strong>€7,000,000</strong> or <strong>1.4% of global annual turnover</strong> (whichever is greater)</li>
</ul>

<h2>Board Member Personal Liability</h2>
<p>NIS2 Article 20 establishes <strong>personal liability for management body members</strong>. The board must:</p>
<ul>
<li>Approve cybersecurity risk management measures</li>
<li>Oversee their implementation</li>
<li>Undergo cybersecurity training</li>
</ul>
<p>To calculate board member personal liability exposure, use our free <strong>Board Risk Calculator</strong> tool.</p>

<h2>Enforcement Mechanisms</h2>
<p>Competent authorities have the power to:</p>
<ul>
<li>Carry out on-site and off-site audits</li>
<li>Request data and documents</li>
<li>Issue binding instructions and warnings</li>
<li>Temporarily suspend certifications</li>
<li>Appoint a temporary monitoring officer</li>
</ul>

<h2>Estonian Context</h2>
<p>In Estonia, the Cybersecurity Act amendment (KüTS) transposes NIS2 requirements. The competent authority is the <strong>Estonian Information System Authority (RIA)</strong>. E-ITS (Estonian Information Security Standard) is the primary framework for compliance assessment.</p>`
    },
    tags: ['NIS2', 'penalties', 'enforcement', 'board liability']
  }
];

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Article detail view -->
    @if (selectedArticle) {
      <div class="max-w-3xl mx-auto">
        <a routerLink="/blog" class="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-6">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          {{ lang.t('blog.back_to_articles') }}
        </a>

        <div class="flex items-center gap-3 mb-4">
          <span class="px-2.5 py-1 text-xs font-bold rounded-full"
                [ngClass]="selectedArticle.category === 'DORA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'">
            {{ selectedArticle.category }}
          </span>
          <span class="text-xs text-slate-500">{{ selectedArticle.date }}</span>
          <span class="text-xs text-slate-500">{{ selectedArticle.readTime }} min {{ lang.t('blog.read') }}</span>
        </div>

        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
          {{ lang.l(selectedArticle.title.et, selectedArticle.title.en) }}
        </h1>

        <div class="prose prose-invert prose-emerald max-w-none
                    prose-headings:text-white prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                    prose-h3:text-lg prose-h3:text-slate-200 prose-h3:mt-6 prose-h3:mb-3
                    prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
                    prose-li:text-slate-300 prose-li:mb-1
                    prose-strong:text-white
                    prose-ul:mb-4 prose-ol:mb-4
                    prose-table:border-collapse prose-table:w-full
                    prose-th:bg-slate-700/50 prose-th:text-slate-200 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:border prose-th:border-slate-600
                    prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-slate-700 prose-td:text-slate-300"
             [innerHTML]="lang.l(selectedArticle.content.et, selectedArticle.content.en)">
        </div>

        <div class="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-700/50">
          @for (tag of selectedArticle.tags; track tag) {
            <span class="px-2.5 py-1 text-xs bg-slate-700/50 text-slate-400 rounded-full">{{ tag }}</span>
          }
        </div>

        <!-- CTA -->
        <div class="mt-10 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
          <h3 class="text-lg font-semibold text-white mb-2">
            {{ lang.t('blog.start_your_dora_compliance_assessment') }}
          </h3>
          <p class="text-sm text-slate-400 mb-4">
            {{ lang.t('blog.free_assessment_with_37_questions_get_in') }}
          </p>
          <a routerLink="/assessment" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 transition-all">
            {{ lang.t('blog.start_assessment') }}
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    } @else {
      <!-- Blog listing -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
          </svg>
          {{ lang.t('blog.articles_guides') }}
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-3">
          {{ lang.t('blog.dora_nis2_blog') }}
        </h1>
        <p class="text-slate-400 max-w-2xl mx-auto">
          {{ lang.t('blog.practical_guides_and_articles_about_dora') }}
        </p>
      </div>

      <!-- Category filter -->
      <div class="flex items-center justify-center gap-2 mb-8">
        <button (click)="filterCategory = null"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                [ngClass]="filterCategory === null ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/30'">
          {{ lang.t('blog.all') }}
        </button>
        <button (click)="filterCategory = 'DORA'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                [ngClass]="filterCategory === 'DORA' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/30'">
          DORA
        </button>
        <button (click)="filterCategory = 'NIS2'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                [ngClass]="filterCategory === 'NIS2' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/30'">
          NIS2
        </button>
      </div>

      <!-- Article grid -->
      <div class="grid gap-6 sm:grid-cols-2">
        @for (article of filteredArticles; track article.slug) {
          <a [routerLink]="['/blog', article.slug]"
             class="group block p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800/80 transition-all duration-300">
            <div class="flex items-center gap-3 mb-3">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                    [ngClass]="article.category === 'DORA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'">
                {{ article.category }}
              </span>
              <span class="text-xs text-slate-500">{{ article.date }}</span>
              <span class="text-xs text-slate-500">{{ article.readTime }} min</span>
            </div>
            <h2 class="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors mb-2 leading-snug">
              {{ lang.l(article.title.et, article.title.en) }}
            </h2>
            <p class="text-sm text-slate-400 leading-relaxed line-clamp-3">
              {{ lang.l(article.excerpt.et, article.excerpt.en) }}
            </p>
            <div class="flex items-center gap-1.5 mt-4 text-xs text-emerald-400 group-hover:gap-2.5 transition-all">
              {{ lang.t('blog.read_more') }}
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
          </a>
        }
      </div>

      <!-- Newsletter CTA -->
      <div class="mt-12 p-8 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 text-center">
        <h3 class="text-xl font-semibold text-white mb-2">
          {{ lang.t('blog.stay_informed') }}
        </h3>
        <p class="text-sm text-slate-400 mb-4 max-w-lg mx-auto">
          {{ lang.t('blog.register_a_doraaudit_account_to_receive') }}
        </p>
        <a routerLink="/register" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 transition-all">
          {{ lang.t('blog.register_for_free') }}
        </a>
      </div>
    }
  `,
  styles: [`
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class BlogComponent implements OnInit {
  articles = ARTICLES;
  selectedArticle: BlogArticle | null = null;
  filterCategory: 'DORA' | 'NIS2' | null = null;

  constructor(
    public lang: LangService,
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.selectedArticle = this.articles.find(a => a.slug === slug) || null;
        if (!this.selectedArticle) {
          this.router.navigate(['/blog']);
        } else {
          const title = this.lang.l(this.selectedArticle.title.et, this.selectedArticle.title.en);
          this.titleService.setTitle(`${title} | DoraAudit.eu`);
          const desc = this.lang.l(this.selectedArticle.excerpt.et, this.selectedArticle.excerpt.en);
          this.meta.updateTag({ name: 'description', content: desc });
        }
      } else {
        this.selectedArticle = null;
      }
    });
  }

  get filteredArticles(): BlogArticle[] {
    if (!this.filterCategory) return this.articles;
    return this.articles.filter(a => a.category === this.filterCategory);
  }
}
