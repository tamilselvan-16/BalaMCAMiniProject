import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <header>
        <div class="brand">Nova Recruit AI <span style="font-size: 1rem; color: var(--accent-primary); font-weight: 500;">HR Portal</span></div>
        <button class="btn-primary" (click)="logout()">Logout</button>
      </header>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
        <div>
          <h1 style="font-size: 2.5rem; margin-bottom: 8px;">Job Management</h1>
          <p style="color: var(--text-secondary);">Create and manage your recruitment pipelines.</p>
        </div>
        <button class="btn-primary" (click)="isModalOpen = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Post New Job
        </button>
      </div>

      <div class="grid">
        <div class="glass-card" *ngFor="let job of jobs">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <h3>{{job.title}}</h3>
            <span class="badge" [class.badge-success]="job.status === 'Active'" [class.badge-danger]="job.status !== 'Active'">{{job.status}}</span>
          </div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">{{job.description}}</p>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
            <div>Vacancies: {{job.vacancies}}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
              <span>Deadline: {{job.last_date | date:'medium'}}</span>
              <button *ngIf="job.status === 'Active'" class="btn-lock" (click)="lockJob(job)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Lock Position
              </button>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-primary" style="flex: 1; font-size: 0.75rem;" (click)="viewApplicants(job)">View Applicants</button>
            <button class="btn-primary" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); font-size: 0.75rem;" (click)="deleteJob(job._id)">Delete</button>
          </div>
        </div>
      </div>

      <!-- Create Job Modal -->
      <div class="modal-overlay" *ngIf="isModalOpen" (click)="closeModal()">
        <div class="modal-content glass-card" (click)="$event.stopPropagation()">
          <h2>Post New Job</h2>
          <form (submit)="createJob()">
            <input type="text" class="input-field" [(ngModel)]="newJob.title" name="title" placeholder="Job Title" required>
            <textarea class="input-field" [(ngModel)]="newJob.description" name="description" placeholder="Description" required></textarea>
            <input type="text" class="input-field" [(ngModel)]="newJob.skills" name="skills" placeholder="Skills (comma separated)" required>
            <div style="display: flex; gap: 12px; align-items: center;">
              <input type="number" class="input-field" [(ngModel)]="newJob.vacancies" name="vacancies" placeholder="Vacancies" min="1" required style="flex: 1;">
              <div style="flex: 2;">
                <input type="datetime-local" class="input-field" [(ngModel)]="newJob.last_date" name="last_date" required>
              </div>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button type="button" class="btn-primary" style="background: transparent;" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary">Create Posting</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Applicants Modal -->
      <div class="modal-overlay" *ngIf="isApplicantsModalOpen" (click)="isApplicantsModalOpen = false">
        <div class="modal-content glass-card" style="max-width: 900px;" (click)="$event.stopPropagation()">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2>Applicants for {{selectedJob?.title}}</h2>
            <div style="display: flex; gap: 8px;">
              <button *ngIf="hasShortlisted()" class="btn-primary" style="background: var(--success); color: white;" (click)="bulkUpdateStatus('Shortlisted', 'Technical Assigned')">
                Process Technical Round (All)
              </button>
              <button class="btn-primary" style="background: var(--accent-primary); color: white;" (click)="viewApplicants(selectedJob)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                Refresh
              </button>
              <button class="btn-primary" style="background: transparent;" (click)="isApplicantsModalOpen = false">Close</button>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>AI Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let app of applicants">
                  <td>{{app.candidate_name}}</td>
                  <td>{{app.candidate_email}}</td>
                  <td>{{app.candidate_mobile}}</td>
                  <td>
                    <div *ngIf="app.ai_score !== undefined && app.ai_score !== null">
                      <div style="font-weight: bold; color: var(--accent-primary);">{{app.ai_score}}%</div>
                      <div style="font-size: 0.7rem; color: var(--text-secondary); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" [title]="app.ai_feedback">
                        {{app.ai_feedback}}
                      </div>
                    </div>
                    <div *ngIf="app.ai_score === undefined || app.ai_score === null" style="color: var(--text-secondary); font-size: 0.8rem;">
                      <span *ngIf="app.status === 'Applied' || app.status === 'AI_Shortlisting'">Processing...</span>
                      <span *ngIf="app.status !== 'Applied' && app.status !== 'AI_Shortlisting'">N/A</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-pending': app.status === 'Applied' || app.status === 'AI_Shortlisting' || app.status === 'AI_Scored',
                      'badge-success': app.status === 'Shortlisted' || app.status === 'Technical Assigned' || app.status === 'Technical Passed' || app.status === 'Final Selected' || app.status === 'Document Uploaded',
                      'badge-danger': app.status === 'Rejected' || app.status === 'Technical Rejected'
                    }">{{app.status}}</span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 8px; flex-direction: column;">
                      <a [href]="'http://localhost:8001/applications/resume/' + app.resume_file_id" target="_blank" class="btn-primary" style="padding: 4px 10px; font-size: 0.7rem; text-align: center;">View Resume</a>
                      <button *ngIf="app.status === 'Technical Passed'" class="btn-approve" (click)="updateStatus(app._id, 'Selected')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Approve Candidate
                      </button>
                      <button *ngIf="app.status === 'Document Uploaded'" class="btn-primary" style="padding: 4px 10px; font-size: 0.7rem; background: var(--accent-primary);" (click)="viewOnboardingDocs(app)">View Onboarding Docs</button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="applicants.length === 0">
                  <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No applications yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Onboarding Docs Modal -->
      <div class="modal-overlay" *ngIf="isDocsModalOpen" (click)="isDocsModalOpen = false">
        <div class="modal-content glass-card" (click)="$event.stopPropagation()">
          <h2>Onboarding Documents for {{selectedAppForDocs?.candidate_name}}</h2>
          <div *ngIf="onboardingDocs.length === 0" style="padding: 2rem; text-align: center; color: var(--text-secondary);">
            No documents uploaded yet.
          </div>
          <div class="table-container" *ngIf="onboardingDocs.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Upload Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let doc of onboardingDocs">
                  <td>{{doc.document_type}}</td>
                  <td>{{doc.uploaded_at | date:'medium'}}</td>
                  <td>
                    <a [href]="'http://localhost:8001/applications/resume/' + doc.file_id" target="_blank" class="btn-primary" style="padding: 4px 10px; font-size: 0.7rem;">View Document</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="margin-top: 1.5rem; text-align: right;">
            <button class="btn-primary" (click)="isDocsModalOpen = false">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; }
    .btn-approve {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
      width: 100%;
    }
    .btn-approve:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
      filter: brightness(1.1);
    }
    .btn-lock {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.3s ease;
    }
    .btn-lock:hover {
      background: var(--danger);
      color: white;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
    }
    .table-container { overflow-x: auto; margin-top: 1rem; border-radius: 8px; border: 1px solid var(--glass-border); }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: rgba(15, 23, 42, 0.8); padding: 12px; font-size: 0.85rem; color: var(--text-secondary); border-bottom: 1px solid var(--glass-border); }
    td { padding: 12px; font-size: 0.85rem; border-bottom: 1px solid var(--glass-border); }
    tr:last-child td { border-bottom: none; }
  `]
})
export class HrDashboardComponent implements OnInit {
  jobs: any[] = [];
  applicants: any[] = [];
  isModalOpen = false;
  isApplicantsModalOpen = false;
  isDocsModalOpen = false;
  selectedJob: any = null;
  selectedAppForDocs: any = null;
  onboardingDocs: any[] = [];
  newJob = { title: '', description: '', skills: '', vacancies: 1, last_date: '' };

  constructor(private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private notify: NotificationService) { }

  ngOnInit() { this.loadJobs(); }

  loadJobs() {
    this.http.get<any[]>('http://localhost:8001/jobs').subscribe(data => {
      this.jobs = data.map(job => ({
        ...job,
        _id: this.normalizeId(job._id)
      }));
    });
  }

  createJob() {
    if (!this.newJob.last_date) {
      this.notify.error('Please select a deadline');
      return;
    }
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const payload = {
      title: this.newJob.title,
      description: this.newJob.description,
      required_skills: this.newJob.skills.split(',').map((s: string) => s.trim()),
      vacancies: this.newJob.vacancies,
      last_date: new Date(this.newJob.last_date).toISOString()
    };
    this.http.post('http://localhost:8001/jobs/', payload, { headers }).subscribe({
      next: () => {
        this.isModalOpen = false;
        this.loadJobs();
        this.notify.success('Job posted successfully!');
        this.newJob = { title: '', description: '', skills: '', vacancies: 1, last_date: '' };
      },
      error: () => this.notify.error('Failed to post job')
    });
  }

  deleteJob(id: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const normalizedId = this.normalizeId(id);
    this.http.delete(`http://localhost:8001/jobs/${normalizedId}`, { headers }).subscribe({
      next: () => {
        this.loadJobs();
        this.notify.success('Job deleted');
      },
      error: () => this.notify.error('Failed to delete job')
    });
  }

  viewApplicants(job: any) {
    this.selectedJob = job;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const jobId = this.normalizeId(job._id);
    this.http.get<any[]>(`http://localhost:8001/applications/job/${jobId}`, { headers }).subscribe({
      next: (data) => {
        this.applicants = data.map(app => ({
          ...app,
          _id: this.normalizeId(app._id)
        }));
        this.isApplicantsModalOpen = true;
      },
      error: () => this.notify.error('Failed to fetch applicants')
    });
  }

  updateStatus(appId: string, status: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const formData = new FormData();
    formData.append('status', status);

    this.http.put(`http://localhost:8001/applications/${appId}/status`, formData, { headers }).subscribe({
      next: () => {
        this.notify.success(`Status updated to ${status}`);
        if (this.selectedJob) {
          this.viewApplicants(this.selectedJob); // Refresh list
        }
      },
      error: () => this.notify.error('Failed to update status')
    });
  }

  hasShortlisted() {
    return this.applicants.some(a => a.status === 'Shortlisted');
  }

  bulkUpdateStatus(fromStatus: string, toStatus: string) {
    if (!this.selectedJob) return;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const formData = new FormData();
    formData.append('from_status', fromStatus);
    formData.append('to_status', toStatus);

    const jobId = this.normalizeId(this.selectedJob._id);
    this.http.put(`http://localhost:8001/applications/job/${jobId}/status-bulk`, formData, { headers }).subscribe({
      next: (res: any) => {
        this.notify.success(res.message);
        this.viewApplicants(this.selectedJob);
      },
      error: () => this.notify.error('Bulk update failed')
    });
  }

  closeModal() {
    this.isModalOpen = false;
    this.newJob = { title: '', description: '', skills: '', vacancies: 1, last_date: '' };
  }

  lockJob(job: any) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const jobId = this.normalizeId(job._id);
    const payload = {
      title: job.title,
      description: job.description,
      required_skills: job.required_skills,
      vacancies: job.vacancies,
      last_date: new Date().toISOString(),
      status: 'Locked'
    };
    this.http.put(`http://localhost:8001/jobs/${jobId}`, payload, { headers }).subscribe({
      next: () => {
        this.loadJobs();
        this.notify.success('Job position locked');
      },
      error: () => this.notify.error('Failed to lock job')
    });
  }

  viewOnboardingDocs(app: any) {
    this.selectedAppForDocs = app;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const appId = this.normalizeId(app._id);
    this.http.get<any[]>(`http://localhost:8001/applications/${appId}/documents`, { headers }).subscribe({
      next: (docs) => {
        this.onboardingDocs = docs;
        this.isDocsModalOpen = true;
      },
      error: () => this.notify.error('Failed to fetch documents')
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  normalizeId(id: any): string {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    if (id.oid) return id.oid;
    if (typeof id === 'object' && id._id) return this.normalizeId(id._id);
    return id.toString();
  }
}
