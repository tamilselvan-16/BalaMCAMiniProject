import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-technical-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="eval-container">
      <div class="glass-card eval-card">
        <header class="eval-header">
          <div>
            <h1 style="font-size: 2rem; margin-bottom: 8px;">Technical Assessment Review</h1>
            <p style="color: var(--text-secondary);">Candidate: {{app?.candidate_name}} | {{app?.candidate_email}}</p>
          </div>
          <div class="status-badge">
            Evaluation Phase
          </div>
        </header>

        <div *ngIf="loading" class="loader-container">
          <div class="loader"></div>
          <p>Fetching candidate responses...</p>
        </div>

        <div *ngIf="!loading && currentAnswers.length > 0">
          <div *ngFor="let ans of currentAnswers; let i = index" class="q-block">
            <div class="q-header">
              <span class="q-num">Q{{i+1}}</span>
              <p class="q-text">{{getQuestionObj(ans.question_id)?.question_text}}</p>
            </div>
            
            <div class="ans-grid" style="grid-template-columns: 1fr;">
              <div class="ans-item">
                <label>Candidate Response</label>
                <div class="ans-val" [class.wrong]="isWrong(ans)" [class.correct]="isCorrect(ans)">
                  {{ans.answer_text || 'No answer provided'}}
                </div>
              </div>
            </div>

            <div class="eval-actions">
              <div class="btn-group">
                <button class="action-btn correct" 
                        [class.active]="evaluations[ans._id].score === 1" 
                        (click)="evaluations[ans._id].score = 1">
                  Mark Correct
                </button>
                <button class="action-btn wrong" 
                        [class.active]="evaluations[ans._id].score === 0" 
                        (click)="markWrong(ans)">
                  Mark Wrong
                </button>
              </div>
              <input type="text" class="input-field feedback-input" 
                     [(ngModel)]="evaluations[ans._id].feedback" 
                     placeholder="Add technical feedback for this answer...">
            </div>
          </div>

          <div class="eval-footer">
            <div class="score-summary">
              <span class="score-label">Final Score</span>
              <span class="score-value">{{getTotalScore()}} / {{currentAnswers.length}}</span>
            </div>
            <div class="footer-btns">
              <button class="btn-secondary" (click)="goBack()">Cancel Review</button>
              <button class="btn-primary reject" (click)="confirmEvaluation('Technical Rejected')" [disabled]="submitting">Reject Candidate</button>
              <button class="btn-primary pass" (click)="confirmEvaluation('Technical Passed')" [disabled]="submitting">Pass & Select</button>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && currentAnswers.length === 0" class="error-state">
          <h3>No answers found for this application.</h3>
          <button class="btn-primary" (click)="goBack()">Go Back</button>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <div class="modal-overlay" *ngIf="showConfirm" (click)="showConfirm = false">
        <div class="modal-content glass-card confirm-dialog" (click)="$event.stopPropagation()">
          <div class="dialog-icon" [class.pass-icon]="pendingStatus === 'Technical Passed'" [class.reject-icon]="pendingStatus === 'Technical Rejected'">
            <svg *ngIf="pendingStatus === 'Technical Passed'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <svg *ngIf="pendingStatus === 'Technical Rejected'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <h2>{{ pendingStatus === 'Technical Passed' ? 'Pass Candidate?' : 'Reject Candidate?' }}</h2>
          <p style="color: var(--text-secondary); margin-bottom: 2rem;">
            You are about to finalize the technical evaluation for <strong>{{app?.candidate_name}}</strong> with a score of <strong>{{getTotalScore()}}/{{currentAnswers.length}}</strong>.
          </p>
          <div class="dialog-btns">
            <button class="btn-secondary" (click)="showConfirm = false">Wait, Review Again</button>
            <button class="btn-primary" 
                    [style.background]="pendingStatus === 'Technical Passed' ? 'var(--success)' : 'var(--danger)'"
                    (click)="submitEvaluation()">
              {{ pendingStatus === 'Technical Passed' ? 'Yes, Pass Candidate' : 'Yes, Reject Candidate' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .eval-container {
      min-height: 100vh;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.05), transparent),
                  radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.05), transparent);
      padding: 40px 20px;
      display: flex;
      justify-content: center;
    }
    .eval-card {
      width: 100%;
      max-width: 1000px;
      padding: 40px;
      height: fit-content;
    }
    .eval-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 25px;
      border-bottom: 1px solid var(--glass-border);
    }
    .status-badge {
      background: rgba(99, 102, 241, 0.1);
      color: var(--accent-primary);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    .q-block {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 16px;
      border: 1px solid var(--glass-border);
      padding: 25px;
      margin-bottom: 30px;
      transition: all 0.3s;
    }
    .q-block:hover { border-color: rgba(99, 102, 241, 0.3); transform: translateY(-2px); }
    .q-header { display: flex; gap: 15px; margin-bottom: 20px; }
    .q-num {
      background: var(--accent-primary);
      color: white;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: bold;
      height: fit-content;
    }
    .q-text { font-size: 1.15rem; font-weight: 500; color: var(--text-primary); line-height: 1.4; }
    .ans-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
    .ans-item label { display: block; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
    .ans-val {
      padding: 12px 16px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid transparent;
      font-weight: 500;
    }
    .ans-val.correct { color: var(--success); border-color: rgba(34, 197, 94, 0.3); background: rgba(34, 197, 94, 0.05); }
    .ans-val.wrong { color: var(--danger); border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); }
    
    .eval-actions { display: flex; gap: 15px; align-items: center; }
    .btn-group { display: flex; gap: 1px; background: var(--glass-border); border-radius: 8px; overflow: hidden; padding: 1px; }
    .action-btn {
      padding: 10px 20px;
      border: none;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }
    .action-btn.correct.active { background: var(--success); color: white; }
    .action-btn.wrong.active { background: var(--danger); color: white; }
    .feedback-input { flex: 1; margin-bottom: 0; padding: 10px 15px; }

    .eval-footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 1px solid var(--glass-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .score-summary { display: flex; flex-direction: column; }
    .score-label { font-size: 0.85rem; color: var(--text-secondary); }
    .score-value { font-size: 1.75rem; font-weight: 700; color: var(--accent-primary); }
    .footer-btns { display: flex; gap: 15px; }
    .btn-primary.pass { background: var(--success); }
    .btn-primary.reject { background: var(--danger); }
    .btn-secondary { background: transparent; border: 1px solid var(--glass-border); padding: 12px 25px; border-radius: 8px; color: var(--text-secondary); cursor: pointer; transition: all 0.3s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }

    .confirm-dialog { max-width: 450px; padding: 40px; text-align: center; }
    .dialog-icon { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    .pass-icon { background: rgba(34, 197, 94, 0.1); color: var(--success); }
    .reject-icon { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    .dialog-btns { display: flex; gap: 12px; justify-content: center; }

    .loader-container { text-align: center; padding: 60px; }
    .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid var(--accent-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class TechnicalEvaluationComponent implements OnInit {
  appId: string = '';
  app: any = null;
  currentAnswers: any[] = [];
  questionsData: any[] = [];
  evaluations: { [key: string]: { score: number, feedback: string } } = {};
  loading = true;
  submitting = false;
  showConfirm = false;
  pendingStatus = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.appId = this.route.snapshot.paramMap.get('appId') || '';
    if (!this.appId) {
      this.notify.error('Invalid evaluation session');
      this.router.navigate(['/tech']);
      return;
    }
    this.loadData();
  }

  async loadData() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    try {
      // Load application details
      const apps = await firstValueFrom(this.http.get<any[]>('http://localhost:8001/technical/applications/evaluation-pending', { headers }));
      const normalizedApps = apps.map(a => ({ ...a, _id: this.normalizeId(a._id), job_id: this.normalizeId(a.job_id) }));
      this.app = normalizedApps.find(a => a._id === this.appId);
      
      if (!this.app) {
        this.notify.error('Application not found');
        this.router.navigate(['/tech']);
        return;
      }

      // Load questions for the job
      this.questionsData = await firstValueFrom(this.http.get<any[]>(`http://localhost:8001/technical/questions/${this.app.job_id}`, { headers }));
      
      // Load candidate answers
      const answers = await firstValueFrom(this.http.get<any[]>(`http://localhost:8001/technical/answers/${this.appId}`, { headers }));
      
      // Use a Map to ensure only one answer per unique question ID (fixes the '24 questions' issue)
      const uniqueAnswersMap = new Map();
      answers.forEach(a => {
        // Keep the latest answer if there are duplicates
        uniqueAnswersMap.set(a.question_id, a);
      });
      
      this.currentAnswers = Array.from(uniqueAnswersMap.values());
      
      this.currentAnswers.forEach(a => {
        // Normalize IDs to strings
        a._id = this.normalizeId(a._id);
        a.question_id = this.normalizeId(a.question_id);
        a.application_id = this.normalizeId(a.application_id);

        const q = this.getQuestionObj(a.question_id);
        let initialScore = a.score || 0;
        if (q && q.correct_answer && a.answer_text === q.correct_answer) {
          initialScore = 1;
        }
        this.evaluations[a._id] = { score: initialScore, feedback: a.feedback || '' };
      });

      this.loading = false;
    } catch (error) {
      this.notify.error('Failed to load evaluation data');
      this.router.navigate(['/tech']);
    }
  }

  getQuestionObj(qId: string) {
    return this.questionsData.find(q => q._id === qId);
  }

  isCorrect(ans: any) {
    const q = this.getQuestionObj(ans.question_id);
    return q && q.correct_answer && ans.answer_text === q.correct_answer;
  }

  isWrong(ans: any) {
    const q = this.getQuestionObj(ans.question_id);
    return q && q.correct_answer && ans.answer_text !== q.correct_answer;
  }

  markWrong(ans: any) {
    this.evaluations[ans._id].score = 0;
    if (!this.evaluations[ans._id].feedback) {
      this.evaluations[ans._id].feedback = 'Incorrect answer';
    }
  }

  getTotalScore() {
    return Object.values(this.evaluations).reduce((sum, ev) => sum + (ev.score || 0), 0);
  }

  confirmEvaluation(status: string) {
    this.pendingStatus = status;
    this.showConfirm = true;
  }

  async submitEvaluation() {
    this.showConfirm = false;
    this.submitting = true;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    
    try {
      const evalPromises = this.currentAnswers.map(ans => {
        const ev = this.evaluations[ans._id];
        const score = ev.score ?? 0;
        const feedback = encodeURIComponent(ev.feedback || '');
        return firstValueFrom(this.http.put(`http://localhost:8001/technical/answers/${ans._id}/score?score=${score}&feedback=${feedback}`, {}, { headers }));
      });

      await Promise.all(evalPromises);

      const formData = new FormData();
      formData.append('status', this.pendingStatus);
      
      await firstValueFrom(this.http.put(`http://localhost:8001/applications/${this.appId}/status`, formData, { headers }));
      
      this.notify.success(`Evaluation finalized for ${this.app.candidate_name}`);
      this.router.navigate(['/tech']);
    } catch (error) {
      this.notify.error('Failed to submit evaluation');
      this.submitting = false;
    }
  }

  goBack() {
    this.router.navigate(['/tech']);
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
