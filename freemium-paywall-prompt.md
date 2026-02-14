# TASK: Implement Freemium Model with Paywall on Exports

## Context
DoraAudit.eu is a DORA & NIS2 compliance platform built with Angular 19 frontend and Spring Boot backend. It already has LemonSqueezy payment integration. The app currently has: DORA assessment (37 questions), NIS2 scope check, results dashboard with radar chart and risk matrix, PDF export, compliance certificate, and FAAS action plan.

## Goal
Implement a freemium model where ALL features (assessment, data entry, dashboard, results) are completely free and unlimited. The PAYWALL sits only on exports and premium deliverables. This creates sunk cost — users invest hours entering data, making the €29/month upgrade trivial vs redoing work elsewhere.

## What should be FREE (no login required):
- Landing page, all info pages
- DORA compliance assessment (all 37 questions, all 15 domains)
- NIS2 scope check
- Results dashboard (radar chart, risk matrix, scores)
- Basic results summary (on-screen only)
- Register of Information data entry (all providers, contracts, services)
- FAAS action plan (view only)

## What should be behind PAYWALL (requires paid plan):
- PDF board-ready report export
- xBRL-CSV export (for regulator submission)
- Excel export
- Compliance certificate download
- FAAS detailed action plan PDF
- AI contract clause rewriter (if implemented)
- Historical assessment comparison
- Email notifications for expiring contracts

## Implementation Requirements

### 1. Backend - Spring Boot

Create a `UserSubscription` entity or use LemonSqueezy webhook data to track:
```
- userId (or sessionId for anonymous users)
- plan: FREE | STANDARD | ENTERPRISE
- status: ACTIVE | EXPIRED | CANCELLED
- lemonSqueezySubscriptionId
- validUntil
```

Create a `@PremiumFeature` annotation or `PremiumGuard` service:
```java
@Service
public class SubscriptionGuard {
    public boolean canAccess(String userId, Feature feature) {
        // Check if user has active paid subscription
        // Feature enum: PDF_EXPORT, XBRL_EXPORT, EXCEL_EXPORT, CERTIFICATE, AI_REWRITER
    }
}
```

On export endpoints, check subscription status. If not paid, return 403 with JSON body:
```json
{
    "error": "PREMIUM_REQUIRED",
    "feature": "PDF_EXPORT",
    "message": "PDF eksport on saadaval Standard ja Enterprise plaanidel",
    "upgradeUrl": "/pricing"
}
```

### 2. Frontend - Angular

Create a `SubscriptionService` that:
- Tracks current user's plan (store in localStorage + verify with backend)
- Exposes `isPremium(): boolean` and `canAccess(feature: string): boolean`
- Provides `showUpgradeModal(feature: string)` method

Create an `UpgradeModalComponent` that:
- Shows when user clicks any paywalled feature
- Displays what they get with upgrade
- Has prominent CTA to LemonSqueezy checkout
- Uses the existing dark theme styling
- Shows the feature they tried to access: "PDF eksport on saadaval alates €29/kuu"
- Emphasizes their data is saved and waiting: "Sinu hindamise tulemused on salvestatud. Uuenda plaani, et laadida alla professionaalne PDF raport."

Create a `PremiumBadgeComponent`:
- Small lock icon + "PRO" badge
- Place next to all paywalled buttons (export buttons, certificate download, etc.)
- On hover: tooltip "Saadaval Standard plaaniga"

### 3. UX Flow for Paywalled Features

When FREE user clicks "Lae alla PDF":
1. Show `UpgradeModalComponent` with:
   - Lock icon animation
   - Preview/blur of what the PDF looks like (screenshot or mockup)
   - "Sinu DORA hindamine on valmis! Lae alla professionaalne PDF raport."
   - Price: "Alates €29/kuu"
   - CTA button: "Uuenda plaani" → LemonSqueezy checkout
   - Secondary link: "Vaata kõiki plaane" → /pricing
2. Do NOT generate the PDF at all (save server resources)
3. Track the click as a conversion event (for analytics)

### 4. Visual Treatment of Locked Features

On the results dashboard, export buttons should look like:
```html
<button class="export-btn locked" (click)="showUpgradeModal('pdf')">
  <svg><!-- lock icon --></svg>
  <span>Lae alla PDF raport</span>
  <span class="pro-badge">PRO</span>
</button>
```

Style: slightly dimmed/muted compared to free features, but still clearly visible and clickable. The lock should be subtle — not aggressive. We WANT users to click it.

### 5. Pricing Page Updates

Update /pricing page to clearly show:
- FREE tier: "Kõik hindamised ja analüüsid tasuta. Andmed salvestatakse sinu brauseris."
- STANDARD €29/kuu: "PDF raportid, Excel eksport, vastavustunnistus, lepingute teavitused"
- ENTERPRISE €79/kuu: "xBRL-CSV regulaatorile, API ligipääs, mitme ettevõtte tugi, audit log"

### 6. Conversion Tracking

Add simple event tracking for:
- `paywall_shown` — which feature triggered it
- `paywall_upgrade_clicked` — user clicked upgrade CTA
- `paywall_dismissed` — user closed modal without upgrading
- `export_completed` — paid user successfully exported

Store in backend or use a simple analytics approach.

### 7. Copy/Messaging (Estonian)

Upgrade modal messages by feature:
- PDF: "Lae alla professionaalne PDF raport juhatusele esitamiseks"
- xBRL-CSV: "Ekspordi register regulaatorile esitamiseks EBA nõutud formaadis"
- Excel: "Ekspordi kõik andmed Excelisse edasise analüüsi jaoks"
- Certificate: "Lae alla vastavustunnistus oma partneritele esitamiseks"

Bottom line in all modals:
"Sinu andmed on turvaliselt salvestatud. Uuendamine võtab alla 1 minuti."

## Technical Notes
- Keep the privacy-first approach — free tier data stays in browser localStorage
- Paid tier can optionally sync to server (Spring Boot backend)
- LemonSqueezy webhook should update subscription status in real-time
- Add a `X-Subscription-Plan` header to API responses for frontend to cache
- Consider adding a "teaser" — generate first page of PDF as preview image for the modal

## Files to modify/create:
- Backend: SubscriptionGuard.java, SubscriptionController.java, UserSubscription.java
- Frontend: subscription.service.ts, upgrade-modal.component.ts, premium-badge.component.ts
- Update: all export button components, pricing.component.ts, results-dashboard.component.ts
