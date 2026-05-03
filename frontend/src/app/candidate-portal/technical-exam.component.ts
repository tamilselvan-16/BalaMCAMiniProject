import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-technical-exam',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="exam-container">
      <div class="glass-card exam-card">
        <header class="exam-header">
          <div>
            <h1 style="font-size: 2rem; margin-bottom: 8px;">Technical Examination</h1>
            <p style="color: var(--text-secondary);">Application ID: {{appId}}</p>
          </div>
          <div class="timer-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Proctored Session
          </div>
        </header>

        <div *ngIf="loading" class="loader-container">
          <div class="loader"></div>
          <p>Loading questions...</p>
        </div>

        <div *ngIf="!loading && questions.length > 0">
          <div *ngFor="let q of questions; let i = index" class="question-block">
            <p class="question-text">
              <span class="q-number">Q{{i + 1}}.</span> {{q.question_text}}
            </p>
            <div class="options-grid">
              <label *ngFor="let opt of q.options" 
                     class="option-card" 
                     [class.selected]="answers[q._id] === opt">
                <input type="radio" [name]="'q' + q._id" [value]="opt" [(ngModel)]="answers[q._id]">
                <span>{{opt}}</span>
              </label>
            </div>
          </div>

          <div class="exam-footer" style="justify-content: flex-end;">
            <button class="btn-primary submit-btn" (click)="handleFinalSubmit()" [disabled]="submitting">
              {{ submitting ? 'Submitting...' : 'Finish & Submit Exam' }}
            </button>
          </div>
        </div>

        <div *ngIf="!loading && questions.length === 0" class="error-state">
          <h3>No questions available for this exam.</h3>
          <button class="btn-primary" (click)="cancel()">Go Back</button>
        </div>
      </div>

      <!-- Custom Confirmation Modal -->
      <div class="modal-overlay" *ngIf="showSubmitModal" (click)="closeModals()">
        <div class="modal-content glass-card custom-dialog" (click)="$event.stopPropagation()">
          <div class="dialog-icon success">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          
          <h2>Submit Examination?</h2>
          <p style="color: var(--text-secondary); margin-bottom: 2rem; line-height: 1.6;">
            {{ unansweredCount > 0 
               ? 'You have ' + unansweredCount + ' unanswered questions. Are you sure you want to submit now?' 
               : 'Great job! You have answered all questions. Ready to submit your evaluation?' }}
          </p>
          
          <div class="dialog-actions">
            <button class="btn-secondary" (click)="closeModals()">Stay & Review</button>
            <button class="btn-primary" 
                    style="background: var(--success);"
                    (click)="confirmSubmit()">
              Yes, Submit Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .exam-container {
      min-height: 100vh;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent),
                  radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.05), transparent);
      display: flex;
      justify-content: center;
      padding: 40px 20px;
    }
    .exam-card {
      width: 100%;
      max-width: 900px;
      padding: 40px;
      height: fit-content;
    }
    .exam-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--glass-border);
    }
    .timer-badge {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      padding: 8px 16px;
      border-radius: 30px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .question-block {
      margin-bottom: 40px;
      animation: fadeIn 0.5s ease forwards;
    }
    .question-text {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .q-number {
      color: var(--accent-primary);
      margin-right: 10px;
    }
    .options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 12px;
    }
    .option-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      padding: 18px 24px;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .option-card:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateX(8px);
    }
    .option-card.selected {
      background: rgba(99, 102, 241, 0.12);
      border-color: var(--accent-primary);
      box-shadow: 0 0 25px rgba(99, 102, 241, 0.1);
    }
    input[type="radio"] {
      width: 22px;
      height: 22px;
      accent-color: var(--accent-primary);
      cursor: pointer;
    }
    .exam-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid var(--glass-border);
    }
    .submit-btn {
      padding: 14px 40px;
      font-size: 1.1rem;
      background: var(--success);
    }
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--glass-border);
      color: var(--text-secondary);
      padding: 14px 30px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-secondary:hover {
      background: rgba(255,255,255,0.05);
      color: var(--text-primary);
    }
    .custom-dialog {
      max-width: 450px;
      padding: 40px;
      text-align: center;
      animation: modalScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .dialog-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .dialog-icon.warning { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    .dialog-icon.success { background: rgba(34, 197, 94, 0.1); color: var(--success); }
    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    @keyframes modalScale {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    .loader-container { text-align: center; padding: 60px; }
    .loader {
      border: 4px solid rgba(255,255,255,0.1);
      border-top: 4px solid var(--accent-primary);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    @media (max-width: 600px) {
      .options-grid { grid-template-columns: 1fr; }
      .exam-footer { flex-direction: column-reverse; gap: 15px; }
      .btn-secondary, .submit-btn { width: 100%; }
    }
  `]
})
export class TechnicalExamComponent implements OnInit {
  appId: string = '';
  jobId: string = '';
  questions: any[] = [];
  answers: { [key: string]: string } = {};
  loading = true;
  submitting = false;
  showSubmitModal = false;
  unansweredCount = 0;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.appId = this.route.snapshot.paramMap.get('appId') || '';
    this.jobId = this.route.snapshot.paramMap.get('jobId') || '';
    
    if (!this.appId || !this.jobId) {
      this.notify.error('Invalid exam session');
      this.router.navigate(['/candidate-portal']);
      return;
    }
    
    this.loadQuestions();
  }

  loadQuestions() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    this.http.get<any[]>(`http://localhost:8001/technical/questions/${this.jobId}`, { headers }).subscribe({
      next: (data) => {
        this.questions = data.map(q => ({
          ...q,
          _id: this.normalizeId(q._id)
        }));
        this.loading = false;
      },
      error: () => {
        this.notify.error('Failed to load questions');
        this.loading = false;
      }
    });
  }

  handleFinalSubmit() {
    console.log('Final submit clicked. Answers:', this.answers);
    const answeredCount = Object.keys(this.answers).length;
    this.unansweredCount = this.questions.length - answeredCount;
    console.log(`Questions: ${this.questions.length}, Answered: ${answeredCount}, Unanswered: ${this.unansweredCount}`);
    this.showSubmitModal = true;
  }

  confirmSubmit() {
    this.showSubmitModal = false;
    this.submitExam();
  }

  closeModals() {
    this.showSubmitModal = false;
  }

  async submitExam() {
    this.submitting = true;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const appId = this.normalizeId(this.appId);

    const allAnswers = this.questions.map(q => ({
      application_id: appId,
      question_id: this.normalizeId(q._id),
      answer_text: this.answers[q._id] || 'No Answer'
    }));

    console.log('Submitting bulk answers...', allAnswers);

    try {
      await firstValueFrom(this.http.post('http://localhost:8001/technical/answers/bulk', allAnswers, { headers }));
      console.log('Bulk answers submitted. Updating status...');

      const formData = new FormData();
      formData.append('status', 'Exam Finished');

      await firstValueFrom(this.http.put(`http://localhost:8001/applications/${appId}/status`, formData, { headers }));
      
      this.notify.success('Exam submitted successfully!');
      this.router.navigate(['/candidate']);
    } catch (err: any) {
      console.error('Submission failed:', err);
      const errorMsg = err.error?.detail || 'Failed to submit exam. Please try again.';
      this.notify.error(errorMsg);
      this.submitting = false;
    }
  }

  cancel() {
    this.router.navigate(['/candidate']);
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
