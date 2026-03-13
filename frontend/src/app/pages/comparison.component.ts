import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../lang.service';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="badge">{{ lang.l('Võrdlus 2026', 'Comparison 2026') }}</div>
      <h1>{{ lang.l('DORA vastavustööriist:', 'DORA compliance tool:') }}<br><span>{{ lang.l('milline valida?', 'which one to choose?') }}</span></h1>
      <p>{{ lang.l('Objektiivne võrdlus kolme juhtiva DORA compliance platvormi vahel — hind, funktsioonid, sobivus Eesti turule.', 'Objective comparison of three leading DORA compliance platforms — price, features, and suitability for the Estonian market.') }}</p>
    </section>

    <!-- SEO INTRO -->
    <section class="seo-section">
      <h2>{{ lang.l('Miks on DORA vastavustööriist vajalik?', 'Why is a DORA compliance tool necessary?') }}</h2>
      <p>{{ lang.l('DORA (Digital Operational Resilience Act) jõustus 17. jaanuaril 2025 ja kohaldub kõigile EL-i finantsasutustele — pankadest kindlustuseni, fondidest fintech-ettevõteteni. Mittevastavuse korral võivad trahvid ulatuda kuni 2% aastasest ülemaailmsest käibest.', 'DORA (Digital Operational Resilience Act) entered into force on January 17, 2025 and applies to all EU financial institutions — from banks to insurance, funds to fintech companies. Non-compliance fines can reach up to 2% of annual global turnover.') }}</p>
      <p>{{ lang.l('Turule on tekkinud mitmeid compliance tööriistasid, kuid need erinevad hinna, funktsionaalsuse ja lokaliseerituse poolest märkimisväärselt. Allpool võrdleme kolme peamist valikut.', 'Several compliance tools have emerged on the market, but they differ significantly in price, functionality, and localization. Below we compare the three main options.') }}</p>
    </section>

    <!-- PRICING -->
    <section class="pricing-strip">
      <div class="price-card">
        <h3>Copla</h3>
        <div class="tagline">{{ lang.l('Pan-EU CISO platvorm', 'Pan-EU CISO platform') }}</div>
        <div class="price-amount">€375</div>
        <div class="price-period">{{ lang.l('/kuu (DORA moodul)', '/mo (DORA module)') }}</div>
        <div class="price-annual">{{ lang.l('~€5,000 esimesel aastal', '~€5,000 first year') }}</div>
        <div class="price-note">{{ lang.l('+ €499 onboarding tasu', '+ €499 onboarding fee') }}<br>{{ lang.l('Demo booking nõutav', 'Demo booking required') }}</div>
      </div>
      <div class="price-card featured">
        <h3>DoraAudit.eu</h3>
        <div class="tagline">{{ lang.l('Eesti-spetsiifiline DORA + NIS2', 'Estonia-specific DORA + NIS2') }}</div>
        <div class="price-amount">€149</div>
        <div class="price-period">/{{ lang.l('kuu (Professional)', 'mo (Professional)') }}</div>
        <div class="price-annual">{{ lang.l('€1,788 aastas — säästad 64%', '€1,788/year — save 64%') }}</div>
        <div class="price-note">{{ lang.l('Onboarding tasuta', 'Free onboarding') }}<br>{{ lang.l('Kohene iseteenindus, 5 min', 'Instant self-service, 5 min') }}</div>
      </div>
      <div class="price-card">
        <h3>DoraRegister.io</h3>
        <div class="tagline">{{ lang.l('RoI register tööriist', 'RoI register tool') }}</div>
        <div class="price-amount">€200+</div>
        <div class="price-period">{{ lang.l('/kuu (lepingute arvu järgi)', '/mo (by contract count)') }}</div>
        <div class="price-annual">{{ lang.l('€2,400+ aastas', '€2,400+/year') }}</div>
        <div class="price-note">{{ lang.l('Ainult RoI fookus', 'RoI focus only') }}<br>{{ lang.l('Demo booking nõutav', 'Demo booking required') }}</div>
      </div>
    </section>

    <!-- COMPARISON TABLE -->
    <section class="table-wrap">
      <h2>{{ lang.l('Funktsioonide võrdlus', 'Feature Comparison') }}</h2>
      <table>
        <thead>
          <tr>
            <th>{{ lang.l('Omadus', 'Feature') }}</th>
            <th>DoraAudit.eu</th>
            <th>Copla</th>
            <th>DoraRegister.io</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ lang.l('DORA vastavushindamine', 'DORA compliance assessment') }}</td>
            <td class="cell-highlight">{{ lang.l('✓ 37 küsimust + PDF', '✓ 37 questions + PDF') }}</td>
            <td><span class="check">✓</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>{{ lang.l('NIS2 kohalduvuskontroll', 'NIS2 scope check') }}</td>
            <td class="cell-highlight">{{ lang.l('✓ Tasuta', '✓ Free') }}</td>
            <td><span class="check">✓</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>{{ lang.l('ICT lepinguanalüüs (AI)', 'ICT contract analysis (AI)') }}</td>
            <td class="cell-highlight">{{ lang.l('✓ Multi-regulatsioon', '✓ Multi-regulation') }}</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>Supply Chain / RoI {{ lang.l('register', 'register') }}</td>
            <td><span class="check">✓</span></td>
            <td><span class="check">✓</span></td>
            <td><span class="check">✓</span> {{ lang.l('Fookus', 'Focus') }}</td>
          </tr>
          <tr>
            <td>{{ lang.l('Trahvikalkulaator', 'Fine calculator') }}</td>
            <td class="cell-highlight">{{ lang.l('✓ Tasuta', '✓ Free') }}</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>{{ lang.l('Juhatuse vastutuse kalkulaator', 'Board liability calculator') }}</td>
            <td class="cell-highlight">{{ lang.l('✓ Ainulaadne', '✓ Unique') }}</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>{{ lang.l('Sektori benchmark', 'Sector benchmark') }}</td>
            <td class="cell-highlight">{{ lang.l('✓ Reaalne andmestik', '✓ Real data') }}</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>{{ lang.l('xBRL-CSV eksport', 'xBRL-CSV export') }}</td>
            <td><span class="soon">{{ lang.l('TULEKUL', 'COMING') }}</span></td>
            <td><span class="check">✓</span></td>
            <td><span class="check">✓</span></td>
          </tr>
          <tr>
            <td>{{ lang.l('Ülesannete haldamine', 'Task management') }}</td>
            <td><span class="soon">{{ lang.l('TULEKUL', 'COMING') }}</span></td>
            <td><span class="check">✓</span></td>
            <td><span class="check">✓</span></td>
          </tr>
          <tr>
            <td>{{ lang.l('Eesti keel', 'Estonian language') }}</td>
            <td class="cell-highlight">{{ lang.l('✓ Täielik', '✓ Full') }}</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>{{ lang.l('Äriregistri integratsioon', 'Business registry integration') }}</td>
            <td class="cell-highlight">✓</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>{{ lang.l('Kohene iseteenindus', 'Instant self-service') }}</td>
            <td class="cell-highlight">{{ lang.l('✓ 5 minutit', '✓ 5 minutes') }}</td>
            <td><span class="cross">✗</span> {{ lang.l('Demo nõutav', 'Demo required') }}</td>
            <td><span class="cross">✗</span> {{ lang.l('Demo nõutav', 'Demo required') }}</td>
          </tr>
          <tr>
            <td>{{ lang.l('Andmed EL-is', 'Data in EU') }}</td>
            <td><span class="check">✓</span> {{ lang.l('Saksamaa', 'Germany') }}</td>
            <td><span class="check">✓</span></td>
            <td><span class="check">✓</span></td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- SAVINGS CALCULATOR -->
    <section class="savings">
      <h2>{{ lang.l('Kui palju sa säästad DoraAudit.eu-ga?', 'How much do you save with DoraAudit.eu?') }}</h2>
      <div class="context">{{ lang.l('Võrreldes Copla DORA mooduliga (esimese aasta kulu)', 'Compared to Copla DORA module (first year cost)') }}</div>
      <div class="big-number">€3,211</div>
      <div class="context">{{ lang.l('säästu esimesel aastal', 'saved in the first year') }}</div>
      <div class="savings-grid">
        <div>
          <div class="stat-label">DoraAudit.eu</div>
          <div class="stat-value green">€1,788/{{ lang.l('a', 'yr') }}</div>
        </div>
        <div>
          <div class="stat-label">Copla</div>
          <div class="stat-value red">€4,999/{{ lang.l('a', 'yr') }}</div>
        </div>
        <div>
          <div class="stat-label">{{ lang.l('Sääst', 'Savings') }}</div>
          <div class="stat-value green">64%</div>
        </div>
      </div>
    </section>

    <!-- FAQ SEO SECTION -->
    <section class="faq">
      <h2>{{ lang.l('Korduma kippuvad küsimused', 'Frequently Asked Questions') }}</h2>

      <div class="faq-item">
        <h3>{{ lang.l('Kas DoraAudit.eu sobib väikestele fintech-ettevõtetele?', 'Is DoraAudit.eu suitable for small fintech companies?') }}</h3>
        <p>{{ lang.l('Jah. DoraAudit.eu on loodud just Eesti väikeste ja keskmiste finantsasutuste jaoks. €149/kuu Professional plaan katab kõik DORA hindamise vajadused — ilma konsultandi palkamiseta ja pikka müügiprotsessita.', 'Yes. DoraAudit.eu is designed specifically for small and medium Estonian financial institutions. The €149/month Professional plan covers all DORA assessment needs — without hiring consultants or lengthy sales processes.') }}</p>
      </div>

      <div class="faq-item">
        <h3>{{ lang.l('Mille poolest erineb DoraAudit.eu Copla-st?', 'How does DoraAudit.eu differ from Copla?') }}</h3>
        <p>{{ lang.l('Copla on Pan-EU CISO platvorm, mis maksab €4,500+/aastas ja nõuab demo bookingut. DoraAudit.eu on Eesti-spetsiifiline, eestikeelne, 3x odavam ja pakub kohest iseteenindust. Lisaks on DoraAudit.eu-l ainulaadsed tööriistad nagu juhatuse vastutuse kalkulaator ja AI-põhine lepinguanalüüs.', 'Copla is a Pan-EU CISO platform that costs €4,500+/year and requires a demo booking. DoraAudit.eu is Estonia-specific, available in Estonian, 3x cheaper, and offers instant self-service. Additionally, DoraAudit.eu has unique tools like the board liability calculator and AI-powered contract analysis.') }}</p>
      </div>

      <div class="faq-item">
        <h3>{{ lang.l('Mille poolest erineb DoraAudit.eu DoraRegister.io-st?', 'How does DoraAudit.eu differ from DoraRegister.io?') }}</h3>
        <p>{{ lang.l('DoraRegister.io keskendub ainult DORA Register of Information (RoI) haldamisele. DoraAudit.eu katab kogu DORA vastavuse tsükli — hindamisest lepinguanalüüsini ja tarneahela riskijuhtimiseni. Lisaks pakub DoraAudit.eu NIS2 tööriistasid ja on täielikult eestikeelne.', 'DoraRegister.io focuses solely on DORA Register of Information (RoI) management. DoraAudit.eu covers the entire DORA compliance cycle — from assessment to contract analysis and supply chain risk management. It also offers NIS2 tools and is fully available in Estonian.') }}</p>
      </div>

      <div class="faq-item">
        <h3>{{ lang.l('Kas DoraAudit.eu katab ka NIS2 nõuded?', 'Does DoraAudit.eu also cover NIS2 requirements?') }}</h3>
        <p>{{ lang.l('Jah. Business plaan (€299/kuu) katab nii DORA kui NIS2 ühes kohas. Tasuta NIS2 Scope Checker aitab tuvastada, kas NIS2 sinu ettevõttele kohaldub.', 'Yes. The Business plan (€299/month) covers both DORA and NIS2 in one place. The free NIS2 Scope Checker helps determine if NIS2 applies to your company.') }}</p>
      </div>

      <div class="faq-item">
        <h3>{{ lang.l('Kui kiiresti saan tulemusi?', 'How quickly can I get results?') }}</h3>
        <p>{{ lang.l('~15 minutit. Registreeru, täida 37-küsimuslik hindamine ja saa koheselt compliance score, riskimaatriks, sektori benchmark ja PDF raport. Pole vaja demo bookingut ega müügikõnesid.', '~15 minutes. Register, complete the 37-question assessment, and instantly get your compliance score, risk matrix, sector benchmark, and PDF report. No demo booking or sales calls needed.') }}</p>
      </div>

      <div class="faq-item">
        <h3>{{ lang.l('Kus mu andmed asuvad?', 'Where is my data stored?') }}</h3>
        <p>{{ lang.l('Kõik andmed hoiustatakse Euroopa Liidus (Hetzner, Saksamaa). AES-256 krüpteering, GDPR-kooskõlaline.', 'All data is stored in the European Union (Hetzner, Germany). AES-256 encryption, GDPR-compliant.') }}</p>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <h2>{{ lang.l('Alusta DORA hindamist ~15 minutiga', 'Start your DORA assessment in ~15 minutes') }}</h2>
      <p>{{ lang.l('Tasuta tööriistadega saad kohe teada, kus su ettevõte DORA ja NIS2 nõuetega seisab.', 'With free tools, instantly find out where your company stands with DORA and NIS2 requirements.') }}</p>
      <div class="btn-group">
        <a routerLink="/register" class="btn btn-primary">
          {{ lang.l('Alusta tasuta →', 'Start free →') }}
        </a>
        <a routerLink="/pricing" class="btn btn-secondary">
          {{ lang.l('Vaata plaane', 'View plans') }}
        </a>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'DM Sans', sans-serif;
      color: #e2e8f0;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* HERO */
    .hero {
      padding: 80px 24px 60px;
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
      position: relative;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 400px;
      background: radial-gradient(ellipse, rgba(34, 197, 94, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .badge {
      display: inline-block;
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
      padding: 6px 16px;
      border-radius: 100px;
      margin-bottom: 24px;
      background: rgba(34, 197, 94, 0.15);
    }

    h1 {
      font-size: clamp(32px, 5vw, 52px);
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: 20px;
    }

    h1 span { color: #22c55e; }

    .hero p {
      font-size: 18px;
      color: #94a3b8;
      max-width: 600px;
      margin: 0 auto 40px;
    }

    /* SEO CONTENT SECTION */
    .seo-section {
      max-width: 760px;
      margin: 0 auto;
      padding: 0 24px 60px;
    }

    .seo-section h2 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #e2e8f0;
    }

    .seo-section p {
      color: #94a3b8;
      font-size: 16px;
      margin-bottom: 16px;
    }

    /* PRICING COMPARISON */
    .pricing-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      max-width: 960px;
      margin: 0 auto 80px;
      padding: 0 24px;
    }

    .price-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 32px 28px;
      text-align: center;
      transition: all 0.3s ease;
      position: relative;
    }

    .price-card.featured {
      border-color: #22c55e;
      box-shadow: 0 0 40px rgba(34, 197, 94, 0.08);
    }

    .price-card.featured::before {
      content: '★';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 1px;
      color: #0a0f1a;
      background: #22c55e;
      padding: 4px 14px;
      border-radius: 100px;
    }

    .price-card h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .price-card .tagline {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 24px;
    }

    .price-amount {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .price-card.featured .price-amount { color: #22c55e; }

    .price-period {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .price-annual {
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      color: #94a3b8;
      padding: 6px 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
      display: inline-block;
      margin-bottom: 24px;
    }

    .price-card.featured .price-annual {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }

    .price-note {
      font-size: 13px;
      color: #64748b;
      padding-top: 16px;
      border-top: 1px solid #1e293b;
    }

    /* FEATURE TABLE */
    .table-wrap {
      max-width: 960px;
      margin: 0 auto 80px;
      padding: 0 24px;
      overflow-x: auto;
    }

    .table-wrap h2 {
      font-size: 28px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 40px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 15px;
    }

    thead th {
      text-align: left;
      padding: 14px 16px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      border-bottom: 2px solid #1e293b;
    }

    thead th:nth-child(2) {
      color: #22c55e;
      border-bottom-color: #22c55e;
    }

    tbody td {
      padding: 14px 16px;
      border-bottom: 1px solid #1e293b;
      vertical-align: middle;
    }

    tbody tr:hover { background: rgba(255,255,255,0.02); }

    td:first-child {
      font-weight: 500;
      color: #e2e8f0;
    }

    .check { color: #22c55e; font-size: 18px; }
    .cross { color: #ef4444; font-size: 18px; opacity: 0.6; }
    .soon { color: #f59e0b; font-size: 12px; font-family: 'DM Mono', monospace; }
    .cell-highlight {
      background: rgba(34, 197, 94, 0.15);
      font-weight: 600;
      color: #22c55e;
      border-radius: 4px;
    }

    /* SAVINGS CALC */
    .savings {
      max-width: 760px;
      margin: 0 auto 80px;
      padding: 40px;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.06) 0%, rgba(34, 197, 94, 0.02) 100%);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 20px;
      text-align: center;
    }

    .savings h2 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .savings .big-number {
      font-size: 56px;
      font-weight: 700;
      color: #22c55e;
      letter-spacing: -0.03em;
      margin: 20px 0 8px;
    }

    .savings .context {
      font-size: 16px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .savings-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 32px;
      text-align: center;
    }

    .savings-grid .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .savings-grid .stat-value {
      font-size: 24px;
      font-weight: 700;
    }

    .savings-grid .stat-value.green { color: #22c55e; }
    .savings-grid .stat-value.red { color: #ef4444; opacity: 0.7; }

    /* CTA */
    .cta-section {
      text-align: center;
      padding: 60px 24px 100px;
      max-width: 600px;
      margin: 0 auto;
    }

    .cta-section h2 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .cta-section p {
      color: #94a3b8;
      font-size: 16px;
      margin-bottom: 32px;
    }

    .btn-group {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: #22c55e;
      color: #0a0f1a;
    }

    .btn-primary:hover {
      background: #16a34a;
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(34, 197, 94, 0.25);
    }

    .btn-secondary {
      background: transparent;
      color: #e2e8f0;
      border: 1px solid #1e293b;
    }

    .btn-secondary:hover {
      border-color: #94a3b8;
      background: rgba(255,255,255,0.03);
    }

    /* FAQ / SEO */
    .faq {
      max-width: 760px;
      margin: 0 auto 80px;
      padding: 0 24px;
    }

    .faq h2 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 32px;
      text-align: center;
    }

    .faq-item {
      border-bottom: 1px solid #1e293b;
      padding: 20px 0;
    }

    .faq-item h3 {
      font-size: 17px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #e2e8f0;
    }

    .faq-item p {
      font-size: 15px;
      color: #94a3b8;
      line-height: 1.7;
    }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .pricing-strip { grid-template-columns: 1fr; max-width: 400px; }
      .savings-grid { grid-template-columns: 1fr; gap: 16px; }
      .savings { margin-left: 24px; margin-right: 24px; padding: 28px 20px; }
    }
  `]
})
export class ComparisonComponent {
  constructor(public lang: LangService) {}
}
