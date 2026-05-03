import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="glass-card login-card">
        <h1 class="brand" style="text-align: center; margin-bottom: 2rem; font-size: 2.5rem;">Nova Recruit AI</h1>
        
        <div class="tabs">
          <button [class.active]="role === 'Candidate'" (click)="role = 'Candidate'">Candidate</button>
          <button [class.active]="role === 'HR'" (click)="role = 'HR'">HR</button>
          <button [class.active]="role === 'Technical Panel'" (click)="role = 'Technical Panel'">Tech Panel</button>
        </div>

        <form (submit)="onSubmit()">
          <div *ngIf="role === 'Candidate'">
            <input type="text" class="input-field" [(ngModel)]="name" name="name" placeholder="Full Name" required>
            <input type="text" inputmode="email" autocapitalize="none" spellcheck="false" class="input-field" [(ngModel)]="email" name="email" placeholder="Email Address" required>
            <input type="text" class="input-field" [(ngModel)]="mobile" name="mobile" placeholder="Mobile Number" required>
          </div>

          <div *ngIf="role !== 'Candidate'">
            <input type="text" class="input-field" [(ngModel)]="username" name="username" placeholder="Username" required>
            <input type="password" class="input-field" [(ngModel)]="password" name="password" placeholder="Password" required>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem;">Login to Dashboard</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent),
                  radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.1), transparent);
    }
    .login-card {
      width: 100%;
      max-width: 450px;
      padding: 3rem;
    }
    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 2rem;
      background: rgba(255,255,255,0.05);
      padding: 4px;
      border-radius: 12px;
    }
    .tabs button {
      flex: 1;
      padding: 10px;
      border: none;
      background: none;
      color: var(--text-secondary);
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s ease;
      font-weight: 500;
    }
    .tabs button.active {
      background: var(--accent-primary);
      color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
  `]
})
export class LoginComponent {
  role: 'Candidate' | 'HR' | 'Technical Panel' = 'Candidate';
  username = '';
  password = '';
  mobile = '';
  name = '';
  email = '';

  constructor(private auth: AuthService, 
              private router: Router,
              private notify: NotificationService) {}

  onSubmit() {
    if (this.role === 'Candidate') {
      this.auth.loginCandidate(this.mobile, this.name, this.email).subscribe({
        next: () => {
          this.notify.success('Welcome!');
          this.router.navigate(['/candidate']);
        },
        error: (err) => this.notify.error('Login failed. Please check your details.')
      });
    } else {
      this.auth.login(this.username, this.password).subscribe({
        next: (res) => {
          this.notify.success('Login successful!');
          if (res.role === 'HR') this.router.navigate(['/hr']);
          else this.router.navigate(['/tech']);
        },
        error: (err) => this.notify.error('Invalid username or password')
      });
    }
  }
}
