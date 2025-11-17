import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Método GET genérico
   */
  get<T>(endpoint: string, params?: HttpParams | { [key: string]: any }): Observable<T> {
    // Convertir objeto simple a HttpParams si es necesario
    let httpParams: HttpParams | undefined;

    if (params) {
      if (params instanceof HttpParams) {
        httpParams = params;
      } else {
        httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            httpParams = httpParams!.set(key, params[key].toString());
          }
        });
      }
    }

    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * Método POST genérico
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * Método PUT genérico
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * Método PATCH genérico
   */
  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * Método DELETE genérico
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en petición HTTP:', error);
    return throwError(() => error);
  }
}