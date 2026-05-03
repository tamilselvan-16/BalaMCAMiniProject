import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div *ngFor="let n of notifications$ | async" 
           class="notification-toast" 
           [class]="n.type"
           (click)="remove(n.id)">
        <div class="content">
          <div class="icon">
            <svg *ngIf="n.type === 'success'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            <svg *ngIf="n.type === 'error'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <svg *ngIf="n.type === 'info'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <div class="text-group">
            <span class="type-label">{{n.type | titlecase}}</span>
            <p class="message">{{n.message}}</p>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 32px;
      right: 32px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 16px;
      pointer-events: none;
    }
    .notification-toast {
      pointer-events: auto;
      min-width: 320px;
      max-width: 400px;
      position: relative;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      animation: toastIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .content {
      padding: 16px 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    .icon {
      padding: 8px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .success .icon { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .error .icon { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .info .icon { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }

    .text-group { display: flex; flex-direction: column; gap: 2px; }
    .type-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; }
    .message { font-size: 0.9375rem; font-weight: 500; color: #f8fafc; line-height: 1.4; margin: 0; }

    .progress-bar { height: 3px; width: 100%; background: rgba(255,255,255,0.05); position: absolute; bottom: 0; }
    .progress-fill { height: 100%; width: 100%; animation: progress 5s linear forwards; }
    
    .success .progress-fill { background: #10b981; }
    .error .progress-fill { background: #ef4444; }
    .info .progress-fill { background: #3b82f6; }

    @keyframes toastIn {
      from { transform: translateX(100%) scale(0.9); opacity: 0; }
      to { transform: translateX(0) scale(1); opacity: 1; }
    }
    @keyframes progress { from { width: 100%; } to { width: 0%; } }
  `]
})
export class NotificationsComponent {
  notifications$;
  constructor(private service: NotificationService) {
    this.notifications$ = this.service.notifications$;
  }
  remove(id: number) { this.service.remove(id); }
}
