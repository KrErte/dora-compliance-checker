import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing.component').then(m => m.LandingComponent)
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
    path: 'assessment',
    loadComponent: () => import('./pages/assessment.component').then(m => m.AssessmentComponent),
    canActivate: [authGuard]
  },
  {
    path: 'results/:id',
    loadComponent: () => import('./pages/results.component').then(m => m.ResultsComponent),
    canActivate: [authGuard]
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
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'compare',
    loadComponent: () => import('./pages/compare.component').then(m => m.CompareComponent),
    canActivate: [authGuard]
  },
  {
    path: 'contract-analysis',
    loadComponent: () => import('./pages/contract-analysis.component').then(m => m.ContractAnalysisComponent),
    canActivate: [authGuard]
  },
  {
    path: 'code-analysis',
    loadComponent: () => import('./pages/code-analysis.component').then(m => m.CodeAnalysisComponent),
    canActivate: [authGuard]
  },
  {
    path: 'contract-results/:id',
    loadComponent: () => import('./pages/contract-results.component').then(m => m.ContractResultsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'negotiations',
    loadComponent: () => import('./pages/negotiation-list.component').then(m => m.NegotiationListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'negotiations/:id',
    loadComponent: () => import('./pages/negotiation-detail.component').then(m => m.NegotiationDetailComponent),
    canActivate: [authGuard]
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
    path: 'regulatory-updates',
    loadComponent: () => import('./pages/regulatory-updates.component').then(m => m.RegulatoryUpdatesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'incident-simulator',
    loadComponent: () => import('./pages/incident-simulator.component').then(m => m.IncidentSimulatorComponent),
    canActivate: [authGuard]
  }
];
