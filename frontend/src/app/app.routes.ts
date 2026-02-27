import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './auth/auth.guard';

// DORA Article 30 ICT Contract Compliance Engine
// Core: Assessment, Contract Audit, Results, Methodology, History
// Enabled: Guardian (monitoring), Incident Simulator

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing.component').then(m => m.LandingComponent)
  },
  // Redirects for broken/old links
  {
    path: 'self-assessment',
    redirectTo: 'assessment',
    pathMatch: 'full'
  },
  {
    path: 'nis2',
    redirectTo: 'nis2/scope-check',
    pathMatch: 'full'
  },
  {
    path: 'contract-check',
    redirectTo: 'contract-analysis',
    pathMatch: 'full'
  },
  {
    path: 'scope-check',
    redirectTo: 'nis2/scope-check',
    pathMatch: 'full'
  },
  {
    path: 'sign-in',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'oauth/callback',
    loadComponent: () => import('./pages/oauth-callback.component').then(m => m.OAuthCallbackComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'assessment',
    loadComponent: () => import('./pages/assessment.component').then(m => m.AssessmentComponent)
    // No authGuard - free demo access for self-assessment
  },
  {
    path: 'results/:id',
    loadComponent: () => import('./pages/results.component').then(m => m.ResultsComponent)
    // No authGuard - results available immediately, details require email
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/history.component').then(m => m.HistoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'certificate/:id',
    loadComponent: () => import('./pages/certificate.component').then(m => m.CertificateComponent),
    canActivate: [authGuard]
  },
  {
    path: 'contract-generator',
    loadComponent: () => import('./pages/contract-generator.component').then(m => m.ContractGeneratorComponent)
    // No authGuard - free access
  },
  {
    path: 'contract-analysis',
    loadComponent: () => import('./pages/contract-analysis.component').then(m => m.ContractAnalysisComponent)
    // No authGuard - free access for demo/sample
  },
  {
    path: 'contract-results/:id',
    loadComponent: () => import('./pages/contract-results.component').then(m => m.ContractResultsComponent)
    // No authGuard - free access for demo flow
  },
  {
    path: 'contract-comparison/:id',
    loadComponent: () => import('./pages/contract-comparison.component').then(m => m.ContractComparisonComponent)
    // No authGuard - free access for demo flow
  },
  {
    path: 'methodology',
    loadComponent: () => import('./pages/methodology.component').then(m => m.MethodologyComponent)
    // No authGuard - educational content is free
  },
  {
    path: 'supply-chain',
    loadComponent: () => import('./pages/supply-chain-nerve-center.component').then(m => m.SupplyChainNerveCenterComponent)
    // authGuard removed temporarily for testing
  },
  {
    path: 'guardian',
    loadComponent: () => import('./pages/guardian-dashboard.component').then(m => m.GuardianDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'guardian/alerts',
    loadComponent: () => import('./pages/guardian-alerts.component').then(m => m.GuardianAlertsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'incident-simulator',
    loadComponent: () => import('./pages/incident-simulator.component').then(m => m.IncidentSimulatorComponent),
    canActivate: [authGuard]
  },
  {
    path: 'regulatory-updates',
    loadComponent: () => import('./pages/regulatory-updates.component').then(m => m.RegulatoryUpdatesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'timeline',
    loadComponent: () => import('./pages/regulatory-timeline.component').then(m => m.RegulatoryTimelineComponent)
    // No authGuard - educational content is free
  },
  {
    path: 'vendors',
    loadComponent: () => import('./pages/vendor-database.component').then(m => m.VendorDatabaseComponent)
    // No authGuard - public database
  },
  {
    path: 'company-profile',
    loadComponent: () => import('./pages/company-profile.component').then(m => m.CompanyProfileComponent)
    // No authGuard - public company profiles
  },
  {
    path: 'playbook',
    loadComponent: () => import('./pages/playbook-generator.component').then(m => m.PlaybookGeneratorComponent)
    // No authGuard - free tool
  },
  {
    path: 'pillar/:id',
    loadComponent: () => import('./pages/pillar-info.component').then(m => m.PillarInfoComponent)
  },
  {
    path: 'nis2/scope-check',
    loadComponent: () => import('./pages/nis2-scope-check.component').then(m => m.Nis2ScopeCheckComponent)
    // No authGuard - free tool
  },
  {
    path: 'nis2/assessment',
    loadComponent: () => import('./pages/nis2-assessment.component').then(m => m.Nis2AssessmentComponent)
    // No authGuard - free tool
  },
  {
    path: 'nis2/results',
    loadComponent: () => import('./pages/nis2-results.component').then(m => m.Nis2ResultsComponent)
    // No authGuard - free tool
  },
  {
    path: 'board-risk',
    loadComponent: () => import('./pages/board-risk.component').then(m => m.BoardRiskComponent)
    // No authGuard - free tool
  },
  {
    path: 'fine-calculator',
    loadComponent: () => import('./pages/fine-calculator.component').then(m => m.FineCalculatorComponent)
    // No authGuard - free tool
  },
  {
    path: 'workspace',
    loadComponent: () => import('./pages/workspace.component').then(m => m.WorkspaceComponent)
    // No authGuard - free tier available
  },
  {
    path: 'workspace/:id',
    loadComponent: () => import('./pages/workspace.component').then(m => m.WorkspaceComponent)
  },
  // Register of Information (RoI) — DORA Art. 28(3)
  {
    path: 'roi',
    loadComponent: () => import('./pages/roi/roi-dashboard.component').then(m => m.RoiDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'roi/new',
    loadComponent: () => import('./pages/roi/roi-wizard.component').then(m => m.RoiWizardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'roi/:id/edit',
    loadComponent: () => import('./pages/roi/roi-wizard.component').then(m => m.RoiWizardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'comparison',
    loadComponent: () => import('./pages/comparison.component').then(m => m.ComparisonComponent)
    // No authGuard - public SEO landing page
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pages/pricing.component').then(m => m.PricingComponent)
  },
  {
    path: 'payment/success',
    loadComponent: () => import('./pages/payment-success.component').then(m => m.PaymentSuccessComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy.component').then(m => m.PrivacyComponent)
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'settings/branding',
    loadComponent: () => import('./pages/branding-settings.component').then(m => m.BrandingSettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./pages/admin-users.component').then(m => m.AdminUsersComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/leads',
    loadComponent: () => import('./pages/admin-leads.component').then(m => m.AdminLeadsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/leads/:id',
    loadComponent: () => import('./pages/admin-lead-detail.component').then(m => m.AdminLeadDetailComponent),
    canActivate: [adminGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found.component').then(m => m.NotFoundComponent)
  }
];
