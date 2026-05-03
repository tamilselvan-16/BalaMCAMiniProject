import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HrDashboardComponent } from './hr-dashboard/hr-dashboard.component';
import { CandidatePortalComponent } from './candidate-portal/candidate-portal.component';
import { TechPanelComponent } from './tech-panel/tech-panel.component';
import { TechnicalExamComponent } from './candidate-portal/technical-exam.component';
import { TechnicalEvaluationComponent } from './tech-panel/technical-evaluation.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'hr', component: HrDashboardComponent },
  { path: 'candidate', component: CandidatePortalComponent },
  { path: 'tech', component: TechPanelComponent },
  { path: 'exam/:jobId/:appId', component: TechnicalExamComponent },
  { path: 'evaluate/:appId', component: TechnicalEvaluationComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
