import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-candidate-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <header>
        <div class="brand">Nova Recruit AI <span style="font-size: 1rem; color: var(--accent-primary); font-weight: 500;">Candidate Portal</span></div>
        <button class="btn-primary" (click)="logout()">Logout</button>
      </header>

      <div style="margin-bottom: 3rem;">
        <h2 style="font-size: 2rem; margin-bottom: 1.5rem;">Available Opportunities</h2>
        <div class="grid" *ngIf="jobs.length > 0">
          <div class="glass-card" *ngFor="let job of jobs">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <h3>{{job.title}}</h3>
              <span class="badge" [class.badge-success]="job.status === 'Active'" [class.badge-danger]="job.status !== 'Active'">
                {{ job.status === 'Active' ? 'Active' : 'Closed' }}
              </span>
            </div>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1.5rem;">{{job.description}}</p>
          <button class="btn-primary"   style="width: 100%;"  [disabled]="job.status !== 'Active' || isApplied(job)"

   
              (click)="selectedJob = job"
            >
              {{
                job.status !== 'Active'
                  ? 'Applications Closed'
                  : isApplied(job)
                    ? 'Applied'
                    : 'Apply Now'
              }}
            </button>
          </div>
        </div>
        <div *ngIf="jobs.length === 0" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          <p>No job postings available at the moment.</p>
        </div>
      </div>

      <div *ngIf="myApplications.length > 0">
        <h2 style="font-size: 2rem; margin-bottom: 1.5rem;">My Applications</h2>
        <div class="grid">
          <div class="glass-card" *ngFor="let app of myApplications">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="margin-bottom: 0;">{{getJobTitle(app)}}</h3>
              <span class="badge" [ngClass]="{
                'badge-pending': app.status === 'Applied' || app.status === 'Exam Finished',
                'badge-success': app.status === 'Selected' || app.status === 'Document Uploaded',
                'badge-danger': app.status === 'Rejected' || app.status === 'Technical Rejected'
              }">{{app.status}}</span>
            </div>
            <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
              Applied on: {{app.applied_at | date:'mediumDate'}}
            </div>
            <div style="display: flex; gap: 8px; flex-direction: column;">
              <a [href]="'http://localhost:8001/applications/resume/' + app.resume_file_id" target="_blank" class="btn-primary" style="width: 100%; background: transparent; border: 1px solid var(--accent-primary); color: var(--accent-primary); text-align: center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                View Resume
              </a>
              <button *ngIf="app.status === 'Technical Assigned'" class="btn-primary" style="width: 100%;" [disabled]="!app.__hasQuestions" (click)="openExamModal(app)">
                {{ app.__hasQuestions ? 'Take Technical Exam' : 'Exam Not Ready' }}
              </button>
              <button *ngIf="app.status === 'Selected'" class="btn-onboarding" (click)="openDocumentModal(app)">
                <div class="onboarding-content">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  <span>Complete Onboarding (Upload Docs)</span>
                </div>
              </button>
              <div *ngIf="app.status === 'Document Uploaded'" style="text-align: center; color: var(--success); font-weight: 600; padding: 10px; background: rgba(34, 197, 94, 0.1); border-radius: 8px;">
                🎉 Thanks for uploading your documents! HR will review them shortly.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Application Modal -->
      <div class="modal-overlay" *ngIf="selectedJob" (click)="closeModal()">
        <div class="modal-content glass-card" (click)="$event.stopPropagation()">
          <h2>Apply for {{selectedJob.title}}</h2>
          <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">Upload your resume (PDF only) to apply.</p>
          
          <input type="file" (change)="onFileSelected($event)" accept=".pdf" style="margin-bottom: 1.5rem;">
          
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
             <button type="button" class="btn-primary" style="background: transparent;" (click)="closeModal()">Cancel</button>
            <button type="button" class="btn-primary" (click)="submitApplication()">Submit Application</button>
          </div>
        </div>
      </div>

      <!-- Exam Modal removed and moved to new page -->

      <!-- Document Upload Modal -->
      <div class="modal-overlay" *ngIf="isDocumentModalOpen" (click)="isDocumentModalOpen = false">
        <div class="modal-content glass-card" (click)="$event.stopPropagation()" style="max-width: 500px;">
          <h2 style="color: var(--success); margin-bottom: 0.5rem;">Congratulations! 🎊</h2>
          <p style="margin-bottom: 2rem; color: var(--text-secondary);">You have been selected. Please upload the following documents in PDF format.</p>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">1. Education Certificate (Degree/Marksheet)</label>
            <input type="file" (change)="onFileSelected($event, 'Education')" accept=".pdf" class="input-field" style="padding: 10px;">
            <div *ngIf="uploadedTypes.has('Education')" style="font-size: 0.75rem; color: var(--success); margin-top: 4px;">✅ Education uploaded</div>
          </div>

          <div style="margin-bottom: 2rem;">
            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">2. Experience Certificate (Offer/Relieving Letter)</label>
            <input type="file" (change)="onFileSelected($event, 'Experience')" accept=".pdf" class="input-field" style="padding: 10px;">
            <div *ngIf="uploadedTypes.has('Experience')" style="font-size: 0.75rem; color: var(--success); margin-top: 4px;">✅ Experience uploaded</div>
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" class="btn-primary" style="background: transparent;" (click)="isDocumentModalOpen = false">Cancel</button>
            <button type="button" class="btn-primary" (click)="finalizeOnboarding()" 
                    [disabled]="!uploadedTypes.has('Education') || !uploadedTypes.has('Experience')"
                    [style.background]="(uploadedTypes.has('Education') && uploadedTypes.has('Experience')) ? 'var(--success)' : ''">
              Finish Onboarding
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; }
    .option-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      padding: 14px 18px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 4px;
      position: relative;
    }
    .option-card:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(99, 102, 241, 0.5);
      transform: translateX(6px);
    }
    .option-card.selected {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--accent-primary);
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
    }
    input[type="radio"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: var(--accent-primary);
    }
    .btn-onboarding {
      width: 100%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      padding: 14px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }
    .btn-onboarding:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
      filter: brightness(1.1);
    }
    .onboarding-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
  `]
})
export class CandidatePortalComponent implements OnInit {
  jobs: any[] = [];
  myApplications: any[] = [];
  selectedJob: any = null;
  selectedFile: File | null = null;
  selectedAppForDoc: any = null;

  isDocumentModalOpen = false;
  uploadedTypes: Set<string> = new Set();
  appliedJobIds: string[] = [];

  constructor(private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private notify: NotificationService) { }

  ngOnInit() {
    this.loadJobs();
    this.loadMyApplications();
  }

  loadJobs() {
    this.http.get<any[]>('http://localhost:8001/jobs').subscribe(data => {
      this.jobs = data;
      this.syncAppliedFlags();
    });
  }

  loadMyApplications() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    this.http.get<any[]>('http://localhost:8001/applications/my-applications', { headers }).subscribe(data => {
      this.myApplications = data.map(app => ({
        ...app,
        _id: this.normalizeId(app._id),
        job_id: this.normalizeId(app.job_id)
      }));
      this.appliedJobIds = Array.from(
        new Set(data.map(app => this.getApplicationJobId(app)).filter(id => id.length > 0))
      );
      this.syncAppliedFlags();
      
      // Check for questions for technical assigned apps
      this.myApplications.forEach(app => {
        if (app.status === 'Technical Assigned') {
          const jobId = this.getApplicationJobId(app);
          this.http.get<any[]>(`http://localhost:8001/technical/questions/${jobId}`, { headers }).subscribe(qs => {
            app.__hasQuestions = qs && qs.length > 0;
          });
        }
      });
    });
  }

  getJobTitle(app: any) {
    const normalizedJobId = this.getApplicationJobId(app);
    const job = this.jobs.find(j => this.getJobId(j) === normalizedJobId);
    return job ? job.title : 'Position';
  }

  normalizeId(id: any): string {
    if (id === null || id === undefined) return '';
    if (typeof id === 'string' || typeof id === 'number') return String(id);

    if (typeof id === 'object') {
      // Handle Mongo/ObjectId serialized shapes from different responses.
      if ('$oid' in id && id.$oid) return String(id.$oid);
      if ('oid' in id && id.oid) return String(id.oid);
      if ('_id' in id && id._id) return this.normalizeId(id._id);
      if ('id' in id && id.id) return this.normalizeId(id.id);
      if (typeof id.toString === 'function') {
        const text = id.toString();
        if (text && text !== '[object Object]') return text;
      }
    }

    return '';
  }

  getJobId(job: any): string {
    return this.normalizeId(job?._id ?? job?.id);
  }

  getApplicationJobId(app: any): string {
    return this.normalizeId(app?.job_id ?? app?.jobId);
  }

  isApplied(job: any): boolean {
    if (job?.__applied) return true;
    const jobId = this.getJobId(job);
    if (this.appliedJobIds.includes(jobId) ||
      this.myApplications.some(app => this.getApplicationJobId(app) === jobId)) {
      return true;
    }

    // Fallback: if IDs are inconsistent, match by displayed title.
    const jobTitle = (job?.title ?? '').trim().toLowerCase();
    if (!jobTitle) return false;
    return this.myApplications.some(app => this.getJobTitle(app).trim().toLowerCase() === jobTitle);
  }

  syncAppliedFlags() {
    const appliedSet = new Set(this.appliedJobIds);
    this.jobs = this.jobs.map(job => ({
      ...job,
      __applied: appliedSet.has(this.getJobId(job))
    }));
  }

  onFileSelected(event: any, type?: string) {
    const file = event.target.files[0];
    if (type && file) {
      this.uploadSingleDoc(file, type);
    } else {
      this.selectedFile = file;
    }
  }

  uploadSingleDoc(file: File, type: string) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const formData = new FormData();
    formData.append('doc_type', type);
    formData.append('file', file);

    const appId = this.normalizeId(this.selectedAppForDoc._id);
    this.http.post(`http://localhost:8001/applications/${appId}/documents`, formData, { headers }).subscribe({
      next: () => {
        this.notify.success(`${type} document uploaded`);
        this.uploadedTypes.add(type);
      },
      error: () => this.notify.error(`Failed to upload ${type}`)
    });
  }

  submitApplication() {
    if (!this.selectedJob) return;
    if (!this.selectedFile) {
      this.notify.error('Please upload a PDF resume before submitting');
      return;
    }

    if (this.selectedJob.status !== 'Active') {
      this.notify.error('This job is no longer accepting applications');
      this.closeModal();
      return;
    }

    const deadline = new Date(this.selectedJob.last_date);
    if (deadline < new Date()) {
      this.notify.error('The application deadline for this job has passed');
      this.closeModal();
      return;
    }

    const formData = new FormData();
    const selectedJobId = this.getJobId(this.selectedJob);
    formData.append('job_id', selectedJobId);
    formData.append('resume', this.selectedFile);

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });

    this.http.post('http://localhost:8001/applications/', formData, { headers }).subscribe({
      next: (res: any) => {
        this.notify.success('Applied successfully!');

        const selectedJobId = this.getJobId(this.selectedJob);

        // ✅ ADD THIS BLOCK HERE
        if (!this.appliedJobIds.includes(selectedJobId)) {
          this.appliedJobIds.push(selectedJobId);
        }

        this.jobs = this.jobs.map(job =>
          this.getJobId(job) === selectedJobId
            ? { ...job, __applied: true }
            : job
        );

        this.myApplications.unshift({
          _id: res.application_id,
          job_id: selectedJobId,
          status: 'Applied',
          applied_at: new Date().toISOString(),
          resume_file_id: res.resume_file_id
        });

        this.loadMyApplications();
        this.closeModal();
      },
      error: () => this.notify.error('Failed to apply')
    });
  }

  closeModal() {
    this.selectedJob = null;
    this.selectedFile = null;
  }

  openExamModal(app: any) {
    const jobId = this.getApplicationJobId(app);
    const appId = this.normalizeId(app._id);
    this.router.navigate(['/exam', jobId, appId]);
  }

  // submitExam moved to TechnicalExamComponent

  openDocumentModal(app: any) {
    this.selectedAppForDoc = app;
    this.isDocumentModalOpen = true;
    this.uploadedTypes.clear();
  }

  finalizeOnboarding() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const formData = new FormData();
    formData.append('status', 'Document Uploaded');

    const appId = this.normalizeId(this.selectedAppForDoc._id);
    this.http.put(`http://localhost:8001/applications/${appId}/status`, formData, { headers }).subscribe(() => {
      this.notify.success('All documents uploaded! Onboarding complete.');
      this.isDocumentModalOpen = false;
      this.loadMyApplications();
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
