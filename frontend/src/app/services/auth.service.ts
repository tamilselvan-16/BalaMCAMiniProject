import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8001/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(username: string, pass: string) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', pass);

    return this.http.post<any>(`${this.apiUrl}/login`, formData).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  loginCandidate(mobile: string, name: string, email: string) {
    return this.http.post<any>(`${this.apiUrl}/login/candidate`, { mobile_number: mobile, name, email }).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getToken() {
    const inMemoryToken = this.currentUserSubject.value?.access_token;
    if (inMemoryToken) return inMemoryToken;

    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) return null;

    try {
      const parsed = JSON.parse(savedUser);
      if (parsed?.access_token) {
        this.currentUserSubject.next(parsed);
        return parsed.access_token;
      }
    } catch {
      return null;
    }

    return null;
  }

  getRole() {
    return this.currentUserSubject.value?.role;
  }
}
