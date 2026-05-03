import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-tech-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <header>
        <div class="brand">Nova Recruit AI <span style="font-size: 1rem; color: var(--accent-primary); font-weight: 500;">Tech Panel</span></div>
        <button class="btn-primary" (click)="logout()">Logout</button>
      </header>

      <div style="margin-bottom: 2rem;">
        <h1 style="font-size: 2.5rem; margin-bottom: 8px;">Technical Evaluation</h1>
        <p style="color: var(--text-secondary);">Manage questions and evaluate candidate technical rounds.</p>
      </div>

      <div class="grid">
        <div class="glass-card">
          <h2>Create Questions</h2>
          <form (submit)="createQuestion()">
            <select class="input-field" [(ngModel)]="selectedJobId" name="jobId" required (change)="loadPendingApps()">
              <option value="">Select a Job</option>
              <option *ngFor="let job of jobs" [value]="job._id">{{job.title}}</option>
            </select>
            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">Question Text</label>
              <textarea class="input-field" [(ngModel)]="questionText" name="qtext" placeholder="e.g. What is the primary use of a 'decorator' in Python?" required></textarea>
            </div>
            
            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">Multiple Choice Options</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 1rem;">
              <div class="opt-group">
                <span class="opt-label">A</span>
                <input type="text" class="input-field" [(ngModel)]="options[0]" name="opt1" placeholder="Option A" required>
              </div>
              <div class="opt-group">
                <span class="opt-label">B</span>
                <input type="text" class="input-field" [(ngModel)]="options[1]" name="opt2" placeholder="Option B" required>
              </div>
              <div class="opt-group">
                <span class="opt-label">C</span>
                <input type="text" class="input-field" [(ngModel)]="options[2]" name="opt3" placeholder="Option C" required>
              </div>
              <div class="opt-group">
                <span class="opt-label">D</span>
                <input type="text" class="input-field" [(ngModel)]="options[3]" name="opt4" placeholder="Option D" required>
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">Correct Answer</label>
              <select class="input-field" [(ngModel)]="correctAnswer" name="correctAns" required>
                <option value="">Select Correct Option</option>
                <option *ngFor="let opt of options" [value]="opt">{{opt}}</option>
              </select>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%; padding: 12px;" 
              [disabled]="selectedJobId && hrProcessingStatus?.has_shortlisted_waiting && !hrProcessingStatus?.has_tech_candidates"
              [style.opacity]="(selectedJobId && hrProcessingStatus?.has_shortlisted_waiting && !hrProcessingStatus?.has_tech_candidates) ? '0.5' : '1'"
              [style.cursor]="(selectedJobId && hrProcessingStatus?.has_shortlisted_waiting && !hrProcessingStatus?.has_tech_candidates) ? 'not-allowed' : 'pointer'">
              Add MCQ Question
            </button>
            <div *ngIf="selectedJobId && hrProcessingStatus?.has_shortlisted_waiting && !hrProcessingStatus?.has_tech_candidates" 
                 style="color: var(--danger); font-size: 0.85rem; margin-top: 10px; text-align: center;">
              ⚠️ Cannot add questions: HR has not processed the shortlisted candidates through the technical round yet.
            </div>
          </form>

          <div *ngIf="existingQuestions.length > 0" style="margin-top: 2rem;">
            <h3>Questions for this Job</h3>
            <div *ngFor="let q of existingQuestions; let i = index" style="margin-bottom: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
              <p><strong>{{i+1}}. {{q.question_text}}</strong></p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem; color: var(--text-secondary);">
                <span>A: {{q.options[0]}}</span>
                <span>B: {{q.options[1]}}</span>
                <span>C: {{q.options[2]}}</span>
                <span>D: {{q.options[3]}}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card">
          <h2>Evaluation Pending</h2>
          <div *ngIf="pendingApps.length === 0" style="color: var(--text-secondary); font-size: 0.875rem;">
            <div *ngIf="selectedJobId && hrProcessingStatus?.has_shortlisted_waiting && !hrProcessingStatus?.has_tech_candidates" 
                 style="background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 1rem; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); margin-bottom: 1rem;">
              ⚠️ HR has not processed the shortlisted candidates through the technical round yet.
            </div>
            <span *ngIf="!selectedJobId || !hrProcessingStatus?.has_shortlisted_waiting">No applications pending evaluation.</span>
          </div>
          
          <div *ngFor="let app of pendingApps" style="margin-top: 1rem; padding: 1rem; border: 1px solid var(--glass-border); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>Candidate:</strong> {{app.candidate_name}} ({{app.candidate_email}})<br>
                <strong>Job:</strong> {{getJobTitle(app.job_id)}}
              </div>
              <button class="btn-primary" (click)="openEvaluationModal(app)">Evaluate</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Evaluation Modal removed and moved to new page -->
    </div>
  `,
  styles: [`
    .opt-group { position: relative; }
    .opt-label {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-weight: bold;
      color: var(--accent-primary);
      font-size: 0.8rem;
      pointer-events: none;
    }
    .opt-group .input-field { padding-left: 35px; margin-bottom: 0; }
    
    .ans-box {
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
    .ans-value {
      font-weight: 500;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid transparent;
    }
    .wrong-val { color: var(--danger); border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); }
    .correct-val { color: var(--success); border-color: rgba(34, 197, 94, 0.3); background: rgba(34, 197, 94, 0.05); }
    
    .eval-btn {
      padding: 8px 20px;
      border-radius: 6px;
      border: 1px solid var(--glass-border);
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.3s;
      font-weight: 600;
    }
    .eval-btn:hover { background: rgba(255,255,255,0.1); }
    .active-correct { background: var(--success) !important; color: white !important; border-color: var(--success) !important; }
    .active-wrong { background: var(--danger) !important; color: white !important; border-color: var(--danger) !important; }
  `]
})
export class TechPanelComponent implements OnInit {
  jobs: any[] = [];
  selectedJobId = '';
  questionText = '';
  options: string[] = ['', '', '', ''];
  correctAnswer = '';
  
  pendingApps: any[] = [];
  hrProcessingStatus: any = null;
  existingQuestions: any[] = [];
  
  selectedApp: any = null;
  // Modal states moved to TechnicalEvaluationComponent

  constructor(private http: HttpClient, 
              private auth: AuthService, 
              private router: Router,
              private notify: NotificationService) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:8001/jobs').subscribe(data => this.jobs = data);
    this.loadPendingApps();
  }

  loadPendingApps() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    this.http.get<any[]>('http://localhost:8001/technical/applications/evaluation-pending', { headers }).subscribe(data => {
      this.pendingApps = data;
      if (this.selectedJobId) {
        this.loadExistingQuestions();
        this.http.get<any>(`http://localhost:8001/technical/job/${this.selectedJobId}/check-hr-processing`, { headers }).subscribe(status => {
          this.hrProcessingStatus = status;
        });
      } else {
        this.existingQuestions = [];
      }
    });
  }

  loadExistingQuestions() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    this.http.get<any[]>(`http://localhost:8001/technical/questions/${this.selectedJobId}`, { headers }).subscribe(data => {
      this.existingQuestions = data;
    });
  }

  getJobTitle(jobId: string) {
    const job = this.jobs.find(j => j._id === jobId);
    return job ? job.title : jobId;
  }

  createQuestion() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const payload = {
      job_id: this.selectedJobId,
      question_text: this.questionText,
      options: this.options,
      correct_answer: this.correctAnswer
    };
    this.http.post('http://localhost:8001/technical/questions', payload, { headers }).subscribe({
      next: () => {
        this.notify.success('MCQ Question added!');
        this.questionText = '';
        this.options = ['', '', '', ''];
        this.correctAnswer = '';
        this.loadExistingQuestions();
      },
      error: () => this.notify.error('Failed to add question')
    });
  }

  openEvaluationModal(app: any) {
    this.router.navigate(['/evaluate', app._id]);
  }

  // Evaluation methods moved to TechnicalEvaluationComponent

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
