import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type QuantityType = 'length' | 'weight' | 'volume' | 'temperature';
export type OperationType =
  | 'convert'
  | 'compare'
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide';

export interface CalculationInput {
  selectedType: QuantityType;
  selectedOperation: OperationType;
  firstValue: number;
  firstUnit: string;
  secondValue: number;
  secondUnit: string;
  userEmail: string;
  userName: string;
}

interface UnitTransform {
  backendUnit: string;
  backendValue: number;
}

@Injectable({ providedIn: 'root' })
export class BackendApiService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  login(payload: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/api/auth/login`, payload);
  }

  signup(payload: { name: string; email: string; password: string }): Observable<string> {
    return this.http.post(`${this.apiUrl}/user/api/auth/register`, payload, {
      responseType: 'text'
    });
  }

  getGoogleOauthUrl(): string {
    return `${this.apiUrl}/user/oauth2/authorization/google`;
  }

  runCalculation(input: CalculationInput): Observable<any> {
    const firstTransform = this.mapToBackendUnit(
      input.selectedType,
      input.firstUnit,
      input.firstValue
    );

    const secondTransform = this.mapToBackendUnit(
      input.selectedType,
      input.secondUnit,
      input.secondValue
    );

    const payload = {
      userEmail: input.userEmail,
      userName: input.userName,
      thisQuantityDTO: {
        value: firstTransform.backendValue,
        unit: firstTransform.backendUnit,
        measurementType: input.selectedType.toUpperCase()
      },
      thatQuantityDTO: {
        value: secondTransform.backendValue,
        unit: secondTransform.backendUnit,
        measurementType: input.selectedType.toUpperCase()
      }
    };

    return this.http.post(
      `${this.apiUrl}/measurement/api/v1/quantities/${input.selectedOperation}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  getMyHistory(userEmail: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/measurement/api/v1/quantities/history/my?userEmail=${encodeURIComponent(userEmail)}`,
      { headers: this.getAuthHeaders() }
    );
  }

  toUiValue(type: QuantityType, backendValue: number, uiUnit: string): number {
    if (type === 'temperature') {
      return backendValue;
    }

    if (type === 'length') {
      const centimetersPerUnit: Record<string, number> = {
        centimeters: 1,
        inches: 2.54,
        feet: 30.48,
        yards: 91.44
      };
      return backendValue / centimetersPerUnit[uiUnit];
    }

    if (type === 'weight') {
      const gramPerUnit: Record<string, number> = {
        gram: 1,
        kilogram: 1000,
        pound: 453.592
      };
      return backendValue / gramPerUnit[uiUnit];
    }

    const litrePerUnit: Record<string, number> = {
      millilitre: 0.001,
      litre: 1,
      gallon: 3.78541
    };
    return backendValue / litrePerUnit[uiUnit];
  }

  private mapToBackendUnit(type: QuantityType, uiUnit: string, uiValue: number): UnitTransform {
    if (type === 'temperature') {
      const tempMap: Record<string, string> = {
        celsius: 'CELSIUS',
        fahrenheit: 'FAHRENHEIT',
        kelvin: 'KELVIN'
      };
      return {
        backendUnit: tempMap[uiUnit],
        backendValue: uiValue
      };
    }

    if (type === 'length') {
      const centimetersPerUnit: Record<string, number> = {
        centimeters: 1,
        inches: 2.54,
        feet: 30.48,
        yards: 91.44
      };
      return {
        backendUnit: 'CENTIMETERS',
        backendValue: uiValue * centimetersPerUnit[uiUnit]
      };
    }

    if (type === 'weight') {
      const gramPerUnit: Record<string, number> = {
        gram: 1,
        kilogram: 1000,
        pound: 453.592
      };
      return {
        backendUnit: 'GRAM',
        backendValue: uiValue * gramPerUnit[uiUnit]
      };
    }

    const litresPerUnit: Record<string, number> = {
      millilitre: 0.001,
      litre: 1,
      gallon: 3.78541
    };

    return {
      backendUnit: 'LITRE',
      backendValue: uiValue * litresPerUnit[uiUnit]
    };
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}