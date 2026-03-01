import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './auth/auth.guard';

// DORA Article 30 ICT Contract Compliance Engine
// Core: Assessment, Contract Audit, Results, Methodology, History
// Enabled: Guardian (monitoring), Incident Simulator

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing.component').then(m => m.LandingComponent),
    data: { seoTitle: 'DORA Compliance Platform for Baltic Financial Institutions', seoDescription: 'Automated DORA compliance assessment, ICT contract analysis, and regulatory tools. Free self-assessment for Baltic financial institutions.' }
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
    canActivate: [guestGuard],
    data: { seoTitle: 'Login' }
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
    data: { seoTitle: 'Register' }
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
    data: { seoTitle: 'Forgot Password' }
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [guestGuard],
    data: { seoTitle: 'Reset Password' }
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'oauth/callback',
    loadComponent: () => import('./pages/oauth-callback.component').then(m => m.OAuthCallbackComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Dashboard' }
  },
  {
    path: 'assessment',
    loadComponent: () => import('./pages/assessment.component').then(m => m.AssessmentComponent),
    // No authGuard - free demo access for self-assessment
    data: { seoTitle: 'DORA Self-Assessment', seoDescription: 'Free DORA compliance self-assessment. Evaluate your ICT risk management, incident reporting, and digital resilience against DORA requirements.' }
  },
  {
    path: 'results/:id',
    loadComponent: () => import('./pages/results.component').then(m => m.ResultsComponent),
    // No authGuard - results available immediately, details require email
    data: { seoTitle: 'Assessment Results' }
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/history.component').then(m => m.HistoryComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Assessment History' }
  },
  {
    path: 'certificate/:id',
    loadComponent: () => import('./pages/certificate.component').then(m => m.CertificateComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Compliance Certificate' }
  },
  {
    path: 'contract-generator',
    loadComponent: () => import('./pages/contract-generator.component').then(m => m.ContractGeneratorComponent),
    // No authGuard - free access
    data: { seoTitle: 'ICT Contract Generator', seoDescription: 'Generate DORA-compliant ICT service contracts with all required Article 30 clauses. Free contract template generator.' }
  },
  {
    path: 'contract-checklist',
    loadComponent: () => import('./pages/contract-checklist.component').then(m => m.ContractChecklistComponent),
    data: { seoTitle: 'DORA Art. 30 Contract Checklist', seoDescription: 'Check if your ICT contracts contain all mandatory DORA Article 30 clauses. Free interactive contract compliance checklist.' }
  },
  {
    path: 'contract-analysis',
    loadComponent: () => import('./pages/contract-analysis.component').then(m => m.ContractAnalysisComponent),
    // No authGuard - free access for demo/sample
    data: { seoTitle: 'ICT Contract Analysis', seoDescription: 'AI-powered DORA Article 30 contract compliance analysis. Upload your ICT contracts for automated regulatory gap detection.' }
  },
  {
    path: 'bulk-analysis',
    loadComponent: () => import('./pages/bulk-contract-analysis.component').then(m => m.BulkContractAnalysisComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Bulk Contract Analysis', seoDescription: 'Upload and analyze up to 50 contracts at once. Get a portfolio-level DORA compliance overview.' }
  },
  {
    path: 'contract-results/:id',
    loadComponent: () => import('./pages/contract-results.component').then(m => m.ContractResultsComponent),
    // No authGuard - free access for demo flow
    data: { seoTitle: 'Contract Analysis Results' }
  },
  {
    path: 'contract-comparison/:id',
    loadComponent: () => import('./pages/contract-comparison.component').then(m => m.ContractComparisonComponent),
    // No authGuard - free access for demo flow
    data: { seoTitle: 'Contract Comparison' }
  },
  {
    path: 'methodology',
    loadComponent: () => import('./pages/methodology.component').then(m => m.MethodologyComponent),
    // No authGuard - educational content is free
    data: { seoTitle: 'Assessment Methodology', seoDescription: 'DoraAudit assessment methodology based on DORA regulation requirements. Learn how we evaluate ICT risk management compliance.' }
  },
  {
    path: 'supply-chain',
    loadComponent: () => import('./pages/supply-chain-nerve-center.component').then(m => m.SupplyChainNerveCenterComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'ICT Supply Chain Management' }
  },
  {
    path: 'guardian',
    loadComponent: () => import('./pages/guardian-dashboard.component').then(m => m.GuardianDashboardComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Guardian – Contract Monitoring' }
  },
  {
    path: 'guardian/alerts',
    loadComponent: () => import('./pages/guardian-alerts.component').then(m => m.GuardianAlertsComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Guardian Alerts' }
  },
  {
    path: 'incident-simulator',
    loadComponent: () => import('./pages/incident-simulator.component').then(m => m.IncidentSimulatorComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'ICT Incident Simulator', seoDescription: 'Simulate DORA-compliant ICT incident response scenarios. Practice incident classification and reporting workflows.' }
  },
  {
    path: 'remediation',
    loadComponent: () => import('./pages/remediation-tracker.component').then(m => m.RemediationTrackerComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Remediation Tracker', seoDescription: 'Track and manage DORA compliance remediation actions. Monitor progress of fixes and improvements across all five DORA pillars.' }
  },
  {
    path: 'incident-reporting',
    loadComponent: () => import('./pages/incident-reporting.component').then(m => m.IncidentReportingComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Incident Reporting', seoDescription: 'DORA Article 19 ICT incident reporting workflow. Manage initial, intermediate, and final reports with automated deadline tracking.' }
  },
  {
    path: 'incident-decision-tree',
    loadComponent: () => import('./pages/incident-decision-tree.component').then(m => m.IncidentDecisionTreeComponent),
    // No authGuard - free tool for incident classification
    data: { seoTitle: 'ICT Incident Classification Decision Tree', seoDescription: 'Interactive DORA Article 18 incident classification tool. Determine severity, reporting obligations, and timelines for ICT-related incidents.' }
  },
  {
    path: 'tlpt',
    loadComponent: () => import('./pages/tlpt-module.component').then(m => m.TlptModuleComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'TLPT Module', seoDescription: 'DORA Article 26-27 Threat-Led Penetration Testing. Plan, track, and manage TLPT tests with TIBER-EU framework support.' }
  },
  {
    path: 'concentration-risk',
    loadComponent: () => import('./pages/concentration-risk.component').then(m => m.ConcentrationRiskComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Concentration Risk Analysis', seoDescription: 'DORA Article 29 ICT provider concentration risk analysis. Identify over-reliance on single providers.' }
  },
  {
    path: 'training',
    loadComponent: () => import('./pages/training-tracker.component').then(m => m.TrainingTrackerComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Training & Awareness Tracker', seoDescription: 'Track DORA-required training for board members and staff. Monitor compliance awareness program completion.' }
  },
  {
    path: 'maturity',
    loadComponent: () => import('./pages/maturity-model.component').then(m => m.MaturityModelComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Maturity Model Assessment', seoDescription: 'DORA compliance maturity assessment on 0-5 scale. Evaluate operational resilience maturity across all five DORA pillars.' }
  },
  {
    path: 'compliance-trend',
    loadComponent: () => import('./pages/compliance-trend.component').then(m => m.ComplianceTrendComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Compliance Trend', seoDescription: 'Track DORA compliance improvement over time. Historical assessment comparison and progress visualisation.' }
  },
  {
    path: 'risk-heatmap',
    loadComponent: () => import('./pages/risk-heatmap.component').then(m => m.RiskHeatmapComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Risk Heat Map', seoDescription: 'Visual heat map of DORA compliance risks by pillar and category. Identify highest-risk areas at a glance.' }
  },
  {
    path: 'exit-strategies',
    loadComponent: () => import('./pages/exit-strategy.component').then(m => m.ExitStrategyComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Exit Strategies', seoDescription: 'DORA Art. 28 & 30 exit strategy management for critical ICT providers. Plan transitions with alternative provider assessment.' }
  },
  {
    path: 'audit-trail',
    loadComponent: () => import('./pages/audit-trail.component').then(m => m.AuditTrailComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Audit Trail', seoDescription: 'Exportable compliance activity log for regulators. Evidence of DORA compliance activities and assessments.' }
  },
  {
    path: 'info-sharing',
    loadComponent: () => import('./pages/info-sharing.component').then(m => m.InfoSharingComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Information Sharing', seoDescription: 'DORA Article 45 cyber threat intelligence sharing management. Track ISAC, CERT and bilateral arrangements.' }
  },
  {
    path: 'team',
    loadComponent: () => import('./pages/team-management.component').then(m => m.TeamManagementComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Team Management', seoDescription: 'Manage your organization, invite team members, and collaborate on DORA compliance.' }
  },
  {
    path: 'group-entities',
    loadComponent: () => import('./pages/group-entity.component').then(m => m.GroupEntityComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Group Entity Management', seoDescription: 'DORA Art. 11 consolidated digital operational resilience management for financial groups.' }
  },
  {
    path: 'command-center',
    loadComponent: () => import('./pages/command-center.component').then(m => m.CommandCenterComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Compliance Command Center', seoDescription: 'Real-time DORA compliance operational overview. Monitor pillar health, track deadlines, and manage all compliance modules.' }
  },
  {
    path: 'trust-seal',
    loadComponent: () => import('./pages/trust-seal.component').then(m => m.TrustSealComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'DORA Trust Seal', seoDescription: 'Get your embeddable DORA compliance badge. Show clients and partners your organization is DORA-compliant.' }
  },
  {
    path: 'vendor-questionnaires',
    loadComponent: () => import('./pages/vendor-questionnaire-list.component').then(m => m.VendorQuestionnaireListComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Vendor Questionnaires', seoDescription: 'Send DORA compliance self-assessment questionnaires to your ICT service providers.' }
  },
  {
    path: 'vendor-survey/:token',
    loadComponent: () => import('./pages/vendor-questionnaire-public.component').then(m => m.VendorQuestionnairePublicComponent),
    // No authGuard - public access via token
    data: { seoTitle: 'Vendor Self-Assessment' }
  },
  {
    path: 'negotiations',
    loadComponent: () => import('./pages/negotiation-list.component').then(m => m.NegotiationListComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Negotiations', seoDescription: 'Manage DORA contract compliance negotiations with vendors. Track negotiation items, generate strategies, and draft emails.' }
  },
  {
    path: 'negotiations/:id',
    loadComponent: () => import('./pages/negotiation-detail.component').then(m => m.NegotiationDetailComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Negotiation Details' }
  },
  {
    path: 'integrations',
    loadComponent: () => import('./pages/integrations.component').then(m => m.IntegrationsComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Integrations', seoDescription: 'Connect Slack, Microsoft Teams, and custom webhooks to receive real-time DORA compliance notifications.' }
  },
  {
    path: 'settings/sso',
    loadComponent: () => import('./pages/sso-settings.component').then(m => m.SsoSettingsComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'SSO Settings', seoDescription: 'Configure SAML2 or OIDC Single Sign-On for your organization.' }
  },
  {
    path: 'regulatory-updates',
    loadComponent: () => import('./pages/regulatory-updates.component').then(m => m.RegulatoryUpdatesComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Regulatory Updates' }
  },
  {
    path: 'timeline',
    loadComponent: () => import('./pages/regulatory-timeline.component').then(m => m.RegulatoryTimelineComponent),
    // No authGuard - educational content is free
    data: { seoTitle: 'DORA Regulatory Timeline', seoDescription: 'Complete DORA regulation implementation timeline. Key dates, milestones, and deadlines for financial institutions.' }
  },
  {
    path: 'vendors',
    loadComponent: () => import('./pages/vendor-database.component').then(m => m.VendorDatabaseComponent),
    // No authGuard - public database
    data: { seoTitle: 'ICT Provider Database', seoDescription: 'Browse Baltic ICT service providers registered with financial regulators. CTPP directory and provider risk profiles.' }
  },
  {
    path: 'company-profile',
    loadComponent: () => import('./pages/company-profile.component').then(m => m.CompanyProfileComponent),
    // No authGuard - public company profiles
    data: { seoTitle: 'Company DORA Profile' }
  },
  {
    path: 'playbook',
    loadComponent: () => import('./pages/playbook-generator.component').then(m => m.PlaybookGeneratorComponent),
    // No authGuard - free tool
    data: { seoTitle: 'DORA Action Playbook', seoDescription: 'Generate a personalized DORA compliance action plan. Step-by-step playbook based on your assessment results.' }
  },
  {
    path: 'pillar/:id',
    loadComponent: () => import('./pages/pillar-info.component').then(m => m.PillarInfoComponent),
    data: { seoTitle: 'DORA Pillar Details' }
  },
  {
    path: 'nis2/scope-check',
    loadComponent: () => import('./pages/nis2-scope-check.component').then(m => m.Nis2ScopeCheckComponent),
    // No authGuard - free tool
    data: { seoTitle: 'NIS2 Scope Check', seoDescription: 'Check if your organization falls under NIS2 directive scope. Free NIS2 applicability assessment tool.' }
  },
  {
    path: 'nis2/assessment',
    loadComponent: () => import('./pages/nis2-assessment.component').then(m => m.Nis2AssessmentComponent),
    // No authGuard - free tool
    data: { seoTitle: 'NIS2 Compliance Assessment', seoDescription: 'Comprehensive NIS2 directive compliance assessment. Evaluate your cybersecurity measures against NIS2 requirements.' }
  },
  {
    path: 'nis2/results',
    loadComponent: () => import('./pages/nis2-results.component').then(m => m.Nis2ResultsComponent),
    // No authGuard - free tool
    data: { seoTitle: 'NIS2 Assessment Results' }
  },
  {
    path: 'board-risk',
    loadComponent: () => import('./pages/board-risk.component').then(m => m.BoardRiskComponent),
    // No authGuard - free tool
    data: { seoTitle: 'Board Risk Dashboard', seoDescription: 'Executive-level ICT risk dashboard for board members. Visualize DORA compliance status and key risk indicators.' }
  },
  {
    path: 'board-report',
    loadComponent: () => import('./pages/board-report-generator.component').then(m => m.BoardReportGeneratorComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Board Report Generator', seoDescription: 'Generate professional board-ready DORA compliance reports with one click. Instant executive summaries, pillar dashboards, and recommendations.' }
  },
  {
    path: 'fine-calculator',
    loadComponent: () => import('./pages/fine-calculator.component').then(m => m.FineCalculatorComponent),
    // No authGuard - free tool
    data: { seoTitle: 'DORA Fine Calculator', seoDescription: 'Calculate potential DORA non-compliance penalties. Estimate regulatory fines based on your organization profile.' }
  },
  {
    path: 'cost-calculator',
    loadComponent: () => import('./pages/cost-calculator.component').then(m => m.CostCalculatorComponent),
    // No authGuard - free ROI tool
    data: { seoTitle: 'DORA Compliance Cost Calculator', seoDescription: 'Estimate the investment needed for full DORA compliance and compare against potential fines. Unique ROI calculator for financial institutions.' }
  },
  {
    path: 'workspace',
    loadComponent: () => import('./pages/workspace.component').then(m => m.WorkspaceComponent),
    // No authGuard - free tier available
    data: { seoTitle: 'Compliance Workspace' }
  },
  {
    path: 'workspace/:id',
    loadComponent: () => import('./pages/workspace.component').then(m => m.WorkspaceComponent),
    data: { seoTitle: 'Compliance Workspace' }
  },
  // Register of Information (RoI) — DORA Art. 28(3)
  {
    path: 'roi',
    loadComponent: () => import('./pages/roi/roi-dashboard.component').then(m => m.RoiDashboardComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Register of Information' }
  },
  {
    path: 'roi/new',
    loadComponent: () => import('./pages/roi/roi-wizard.component').then(m => m.RoiWizardComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'New Register Entry' }
  },
  {
    path: 'roi/:id/edit',
    loadComponent: () => import('./pages/roi/roi-wizard.component').then(m => m.RoiWizardComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Edit Register Entry' }
  },
  {
    path: 'dora-explorer',
    loadComponent: () => import('./pages/dora-explorer.component').then(m => m.DoraExplorerComponent),
    // No authGuard - free SEO content page
    data: { seoTitle: 'DORA Regulation Explorer', seoDescription: 'Interactive browser for the EU DORA regulation (2022/2554). Search articles, read plain-language explanations, and understand compliance requirements.' }
  },
  {
    path: 'framework-mapping',
    loadComponent: () => import('./pages/framework-mapping.component').then(m => m.FrameworkMappingComponent),
    // No authGuard - free SEO content
    data: { seoTitle: 'Multi-Framework Compliance Mapping', seoDescription: 'See how DORA maps to ISO 27001, NIS2, GDPR, and COBIT. Calculate your existing compliance coverage and identify gaps.' }
  },
  {
    path: 'training-quiz',
    loadComponent: () => import('./pages/training-quiz.component').then(m => m.TrainingQuizComponent),
    // No authGuard - free training tool
    data: { seoTitle: 'DORA Staff Training Quiz', seoDescription: 'Interactive DORA compliance training quiz. Test your team knowledge on ICT risk management, incident reporting, and digital resilience.' }
  },
  {
    path: 'policy-generator',
    loadComponent: () => import('./pages/policy-generator.component').then(m => m.PolicyGeneratorComponent),
    // No authGuard - free tool
    data: { seoTitle: 'DORA Policy Document Generator', seoDescription: 'Generate complete DORA-compliant policy documents. ICT risk management, incident response, business continuity, and more.' }
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog.component').then(m => m.BlogComponent),
    // No authGuard - public SEO content
    data: { seoTitle: 'DORA & NIS2 Blog', seoDescription: 'Practical guides and articles about DORA and NIS2 compliance. ICT contract requirements, incident reporting, register of information, and more.' }
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog.component').then(m => m.BlogComponent),
    // No authGuard - public SEO content
    data: { seoTitle: 'Blog Article' }
  },
  {
    path: 'comparison',
    loadComponent: () => import('./pages/comparison.component').then(m => m.ComparisonComponent),
    // No authGuard - public SEO landing page
    data: { seoTitle: 'DoraAudit vs Competitors', seoDescription: 'Compare DoraAudit with other DORA compliance platforms. Feature comparison, pricing, and Baltic market focus.' }
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pages/pricing.component').then(m => m.PricingComponent),
    data: { seoTitle: 'Pricing', seoDescription: 'DoraAudit pricing plans. Free self-assessment, Professional tier with exports and certificates, Enterprise with custom branding.' }
  },
  {
    path: 'payment/success',
    loadComponent: () => import('./pages/payment-success.component').then(m => m.PaymentSuccessComponent),
    data: { seoTitle: 'Payment Successful' }
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about.component').then(m => m.AboutComponent),
    data: { seoTitle: 'About DoraAudit', seoDescription: 'DoraAudit is a DORA compliance platform built for Baltic financial institutions. Automated assessments, contract analysis, and regulatory tools.' }
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy.component').then(m => m.PrivacyComponent),
    data: { seoTitle: 'Privacy Policy' }
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms.component').then(m => m.TermsComponent),
    data: { seoTitle: 'Terms of Service' }
  },
  {
    path: 'settings/branding',
    loadComponent: () => import('./pages/branding-settings.component').then(m => m.BrandingSettingsComponent),
    canActivate: [authGuard],
    data: { seoTitle: 'Branding Settings' }
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./pages/admin-users.component').then(m => m.AdminUsersComponent),
    canActivate: [adminGuard],
    data: { seoTitle: 'Admin – Users' }
  },
  {
    path: 'admin/leads',
    loadComponent: () => import('./pages/admin-leads.component').then(m => m.AdminLeadsComponent),
    canActivate: [adminGuard],
    data: { seoTitle: 'Admin – Leads' }
  },
  {
    path: 'admin/leads/:id',
    loadComponent: () => import('./pages/admin-lead-detail.component').then(m => m.AdminLeadDetailComponent),
    canActivate: [adminGuard],
    data: { seoTitle: 'Lead Details' }
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found.component').then(m => m.NotFoundComponent),
    data: { seoTitle: 'Page Not Found' }
  }
];
