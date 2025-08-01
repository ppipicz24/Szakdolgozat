import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  _error = signal('');

  error = this._error.asReadonly();

  showError(message: string) {
    this._error.set(message);
  }

  clearError() {
    this._error.set('');
  }
}
