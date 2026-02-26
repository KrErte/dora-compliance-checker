import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="badge">Võrdlus 2026</div>
      <h1>DORA vastavustööriist:<br><span>milline valida?</span></h1>
      <p>Objektiivne võrdlus kolme juhtiva DORA compliance platvormi vahel — hind, funktsioonid, sobivus Eesti turule.</p>
    </section>

    <!-- SEO INTRO -->
    <section class="seo-section">
      <h2>Miks on DORA vastavustööriist vajalik?</h2>
      <p>DORA (Digital Operational Resilience Act) jõustus 17. jaanuaril 2025 ja kohaldub kõigile EL-i finantsasutustele — pankadest kindlustuseni, fondidest fintech-ettevõteteni. Mittevastavuse korral võivad trahvid ulatuda kuni 2% aastasest ülemaailmsest käibest.</p>
      <p>Turule on tekkinud mitmeid compliance tööriistasid, kuid need erinevad hinna, funktsionaalsuse ja lokaliseerituse poolest märkimisväärselt. Allpool võrdleme kolme peamist valikut.</p>
    </section>

    <!-- PRICING -->
    <section class="pricing-strip">
      <div class="price-card">
        <h3>Copla</h3>
        <div class="tagline">Pan-EU CISO platvorm</div>
        <div class="price-amount">€375</div>
        <div class="price-period">/kuu (DORA moodul)</div>
        <div class="price-annual">~€5,000 esimesel aastal</div>
        <div class="price-note">+ €499 onboarding tasu<br>Demo booking nõutav</div>
      </div>
      <div class="price-card featured">
        <h3>DoraAudit.eu</h3>
        <div class="tagline">Eesti-spetsiifiline DORA + NIS2</div>
        <div class="price-amount">€149</div>
        <div class="price-period">/kuu (Professional)</div>
        <div class="price-annual">€1,788 aastas — säästad 64%</div>
        <div class="price-note">Onboarding tasuta<br>Kohene iseteenindus, 5 min</div>
      </div>
      <div class="price-card">
        <h3>DoraRegister.io</h3>
        <div class="tagline">RoI register tööriist</div>
        <div class="price-amount">€200+</div>
        <div class="price-period">/kuu (lepingute arvu järgi)</div>
        <div class="price-annual">€2,400+ aastas</div>
        <div class="price-note">Ainult RoI fookus<br>Demo booking nõutav</div>
      </div>
    </section>

    <!-- COMPARISON TABLE -->
    <section class="table-wrap">
      <h2>Funktsioonide võrdlus</h2>
      <table>
        <thead>
          <tr>
            <th>Omadus</th>
            <th>DoraAudit.eu</th>
            <th>Copla</th>
            <th>DoraRegister.io</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>DORA vastavushindamine</td>
            <td class="cell-highlight">✓ 37 küsimust + PDF</td>
            <td><span class="check">✓</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>NIS2 kohalduvuskontroll</td>
            <td class="cell-highlight">✓ Tasuta</td>
            <td><span class="check">✓</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>ICT lepinguanalüüs (AI)</td>
            <td class="cell-highlight">✓ Multi-regulatsioon</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>Supply Chain / RoI register</td>
            <td><span class="check">✓</span></td>
            <td><span class="check">✓</span></td>
            <td><span class="check">✓</span> Fookus</td>
          </tr>
          <tr>
            <td>Trahvikalkulaator</td>
            <td class="cell-highlight">✓ Tasuta</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>Juhatuse vastutuse kalkulaator</td>
            <td class="cell-highlight">✓ Ainulaadne</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>Sektori benchmark</td>
            <td class="cell-highlight">✓ Reaalne andmestik</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>xBRL-CSV eksport</td>
            <td><span class="soon">TULEKUL</span></td>
            <td><span class="check">✓</span></td>
            <td><span class="check">✓</span></td>
          </tr>
          <tr>
            <td>Task management</td>
            <td><span class="soon">TULEKUL</span></td>
            <td><span class="check">✓</span></td>
            <td><span class="check">✓</span></td>
          </tr>
          <tr>
            <td>Eesti keel</td>
            <td class="cell-highlight">✓ Täielik</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>Äriregistri integratsioon</td>
            <td class="cell-highlight">✓</td>
            <td><span class="cross">✗</span></td>
            <td><span class="cross">✗</span></td>
          </tr>
          <tr>
            <td>Kohene iseteenindus</td>
            <td class="cell-highlight">✓ 5 minutit</td>
            <td><span class="cross">✗</span> Demo nõutav</td>
            <td><span class="cross">✗</span> Demo nõutav</td>
          </tr>
          <tr>
            <td>Andmed EL-is</td>
            <td><span class="check">✓</span> Saksamaa</td>
            <td><span class="check">✓</span></td>
            <td><span class="check">✓</span></td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- SAVINGS CALCULATOR -->
    <section class="savings">
      <h2>Kui palju sa säästad DoraAudit.eu-ga?</h2>
      <div class="context">Võrreldes Copla DORA mooduliga (esimese aasta kulu)</div>
      <div class="big-number">€3,211</div>
      <div class="context">säästu esimesel aastal</div>
      <div class="savings-grid">
        <div>
          <div class="stat-label">DoraAudit.eu</div>
          <div class="stat-value green">€1,788/a</div>
        </div>
        <div>
          <div class="stat-label">Copla</div>
          <div class="stat-value red">€4,999/a</div>
        </div>
        <div>
          <div class="stat-label">Sääst</div>
          <div class="stat-value green">64%</div>
        </div>
      </div>
    </section>

    <!-- FAQ SEO SECTION -->
    <section class="faq">
      <h2>Korduma kippuvad küsimused</h2>

      <div class="faq-item">
        <h3>Kas DoraAudit.eu sobib väikestele fintech-ettevõtetele?</h3>
        <p>Jah. DoraAudit.eu on loodud just Eesti väikeste ja keskmiste finantsasutuste jaoks. €149/kuu Professional plaan katab kõik DORA hindamise vajadused — ilma konsultandi palkamiseta ja pikka müügiprotsessita.</p>
      </div>

      <div class="faq-item">
        <h3>Mille poolest erineb DoraAudit.eu Copla-st?</h3>
        <p>Copla on Pan-EU CISO platvorm, mis maksab €4,500+/aastas ja nõuab demo bookingut. DoraAudit.eu on Eesti-spetsiifiline, eestikeelne, 3x odavam ja pakub kohest iseteenindust. Lisaks on DoraAudit.eu-l ainulaadsed tööriistad nagu juhatuse vastutuse kalkulaator ja AI-põhine lepinguanalüüs.</p>
      </div>

      <div class="faq-item">
        <h3>Mille poolest erineb DoraAudit.eu DoraRegister.io-st?</h3>
        <p>DoraRegister.io keskendub ainult DORA Register of Information (RoI) haldamisele. DoraAudit.eu katab kogu DORA vastavuse tsükli — hindamisest lepinguanalüüsini ja tarneahela riskijuhtimiseni. Lisaks pakub DoraAudit.eu NIS2 tööriistasid ja on täielikult eestikeelne.</p>
      </div>

      <div class="faq-item">
        <h3>Kas DoraAudit.eu katab ka NIS2 nõuded?</h3>
        <p>Jah. Business plaan (€299/kuu) katab nii DORA kui NIS2 ühes kohas. Tasuta NIS2 Scope Checker aitab tuvastada, kas NIS2 sinu ettevõttele kohaldub.</p>
      </div>

      <div class="faq-item">
        <h3>Kui kiiresti saan tulemusi?</h3>
        <p>5 minutit. Registreeru, täida 37-küsimuslik hindamine ja saa koheselt compliance score, riskimaatriks, sektori benchmark ja PDF raport. Pole vaja demo bookingut ega müügikõnesid.</p>
      </div>

      <div class="faq-item">
        <h3>Kus mu andmed asuvad?</h3>
        <p>Kõik andmed hoiustatakse Euroopa Liidus (Hetzner, Saksamaa). AES-256 krüpteering, GDPR-kooskõlaline.</p>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <h2>Alusta DORA hindamist 5 minutiga</h2>
      <p>Tasuta tööriistadega saad kohe teada, kus su ettevõte DORA ja NIS2 nõuetega seisab.</p>
      <div class="btn-group">
        <a routerLink="/register" class="btn btn-primary">
          Alusta tasuta →
        </a>
        <a routerLink="/pricing" class="btn btn-secondary">
          Vaata plaane
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
      content: 'PARIM VALIK';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'DM Mono', monospace;
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
export class ComparisonComponent {}
