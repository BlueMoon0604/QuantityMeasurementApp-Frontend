import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BackendApiService,
  OperationType,
  QuantityType
} from '../../core/services/backend-api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  userName = 'Guest';
  userEmail = '';

  selectedType: QuantityType = 'length';
  selectedOperation: OperationType = 'convert';

  firstValue = 1;
  secondValue = 100;

  firstUnit = 'feet';
  secondUnit = 'inches';

  resultText = '';

  unitMap: Record<QuantityType, string[]> = {
    length: ['feet', 'inches', 'yards', 'centimeters'],
    weight: ['gram', 'kilogram', 'pound'],
    volume: ['litre', 'millilitre', 'gallon'],
    temperature: ['celsius', 'fahrenheit', 'kelvin']
  };

  operationMap: Record<QuantityType, OperationType[]> = {
    length: ['convert', 'compare', 'add', 'subtract', 'multiply', 'divide'],
    weight: ['convert', 'compare', 'add', 'subtract', 'multiply', 'divide'],
    volume: ['convert', 'compare', 'add', 'subtract', 'multiply', 'divide'],
    temperature: ['convert', 'compare']
  };

  constructor(
    private router: Router,
    private backendApi: BackendApiService
  ) {}

  ngOnInit(): void {
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.userName = this.isAuthenticated()
      ? localStorage.getItem('userName') || 'User'
      : 'Guest';
    this.syncDefaultsForType();
  }

  selectType(type: QuantityType): void {
    this.selectedType = type;
    this.selectedOperation = 'convert';
    this.syncDefaultsForType();
    this.performAction();
  }

  selectOperation(op: OperationType): void {
    this.selectedOperation = op;
    this.performAction();
  }

  syncDefaultsForType(): void {
    const units = this.unitMap[this.selectedType];
    this.firstUnit = units[0];
    this.secondUnit = units[1] || units[0];

    if (this.selectedType === 'temperature') {
      this.firstValue = 0;
      this.secondValue = 32;
    } else {
      this.firstValue = 1;
      this.secondValue = 2;
    }
  }

  onInputChange(): void {
    if (this.selectedOperation === 'convert') {
      this.performAction();
    }
  }

  performAction(): void {
    if (!this.isAuthenticated()) {
      this.performLocalCalculation();
      return;
    }

    this.backendApi
      .runCalculation({
        selectedType: this.selectedType,
        selectedOperation: this.selectedOperation,
        firstValue: this.firstValue,
        firstUnit: this.firstUnit,
        secondValue: this.secondValue,
        secondUnit: this.secondUnit,
        userEmail: this.userEmail,
        userName: this.userName
      })
      .subscribe({
        next: (response) => {
          if (this.selectedOperation === 'compare') {
            const compareText = response?.resultString || '';
            if (compareText === 'GREATER') {
              this.resultText = `${this.firstValue} ${this.firstUnit} is greater than ${this.secondValue} ${this.secondUnit}`;
            } else if (compareText === 'LESSER') {
              this.resultText = `${this.firstValue} ${this.firstUnit} is smaller than ${this.secondValue} ${this.secondUnit}`;
            } else {
              this.resultText = `${this.firstValue} ${this.firstUnit} is equal to ${this.secondValue} ${this.secondUnit}`;
            }
            return;
          }

          const backendResult = Number(response?.resultValue ?? 0);

          if (this.selectedOperation === 'convert') {
            const convertedValue = this.backendApi.toUiValue(
              this.selectedType,
              backendResult,
              this.secondUnit
            );
            this.secondValue = this.roundValue(convertedValue);
            this.resultText = `${this.firstValue} ${this.firstUnit} = ${this.secondValue} ${this.secondUnit}`;
            return;
          }

          if (this.selectedOperation === 'multiply' || this.selectedOperation === 'divide') {
            this.resultText = `Result: ${this.roundValue(backendResult)}`;
            return;
          }

          const valueInFirstUnit = this.backendApi.toUiValue(
            this.selectedType,
            backendResult,
            this.firstUnit
          );
          this.resultText = `Result: ${this.roundValue(valueInFirstUnit)} ${this.firstUnit}`;
        },
        error: (error) => {
          if (error?.status === 401) {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            this.userEmail = '';
            this.performLocalCalculation();
            return;
          }

          const message =
            error?.error?.message ||
            error?.error ||
            'Calculation failed. Please verify input and backend services.';
          this.resultText = String(message);
        }
    });
  }

  roundValue(value: number): number {
    return Number(value.toFixed(4));
  }

  private isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!this.userEmail && !!token;
  }

  get isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  private performLocalCalculation(): void {
    if (this.selectedOperation === 'convert') {
      const converted = this.convertValue(
        this.selectedType,
        this.firstValue,
        this.firstUnit,
        this.secondUnit
      );
      this.secondValue = this.roundValue(converted);
      this.resultText = `${this.firstValue} ${this.firstUnit} = ${this.secondValue} ${this.secondUnit}`;
      return;
    }

    if (this.selectedOperation === 'compare') {
      const firstComparable = this.toComparableValue(
        this.selectedType,
        this.firstValue,
        this.firstUnit
      );
      const secondComparable = this.toComparableValue(
        this.selectedType,
        this.secondValue,
        this.secondUnit
      );

      if (firstComparable > secondComparable) {
        this.resultText = `${this.firstValue} ${this.firstUnit} is greater than ${this.secondValue} ${this.secondUnit}`;
      } else if (firstComparable < secondComparable) {
        this.resultText = `${this.firstValue} ${this.firstUnit} is smaller than ${this.secondValue} ${this.secondUnit}`;
      } else {
        this.resultText = `${this.firstValue} ${this.firstUnit} is equal to ${this.secondValue} ${this.secondUnit}`;
      }
      return;
    }

    const firstBase = this.toComparableValue(this.selectedType, this.firstValue, this.firstUnit);
    const secondBase = this.toComparableValue(this.selectedType, this.secondValue, this.secondUnit);

    let resultBase = 0;

    switch (this.selectedOperation) {
      case 'add':
        resultBase = firstBase + secondBase;
        break;
      case 'subtract':
        resultBase = firstBase - secondBase;
        break;
      case 'multiply':
        this.resultText = `Result: ${this.roundValue(firstBase * secondBase)}`;
        return;
      case 'divide':
        if (secondBase === 0) {
          this.resultText = 'Cannot divide by zero';
          return;
        }
        this.resultText = `Result: ${this.roundValue(firstBase / secondBase)}`;
        return;
    }

    const resultInFirstUnit = this.fromComparableValue(
      this.selectedType,
      resultBase,
      this.firstUnit
    );
    this.resultText = `Result: ${this.roundValue(resultInFirstUnit)} ${this.firstUnit}`;
  }

  private convertValue(type: QuantityType, value: number, from: string, to: string): number {
    if (type === 'temperature') {
      return this.convertTemperature(value, from, to);
    }
    const base = this.toComparableValue(type, value, from);
    return this.fromComparableValue(type, base, to);
  }

  private toComparableValue(type: QuantityType, value: number, unit: string): number {
    if (type === 'temperature') {
      return this.convertTemperature(value, unit, 'celsius');
    }

    if (type === 'length') {
      const map: Record<string, number> = {
        centimeters: 1,
        inches: 2.54,
        feet: 30.48,
        yards: 91.44
      };
      return value * map[unit];
    }

    if (type === 'weight') {
      const map: Record<string, number> = {
        gram: 1,
        kilogram: 1000,
        pound: 453.592
      };
      return value * map[unit];
    }

    const map: Record<string, number> = {
      millilitre: 0.001,
      litre: 1,
      gallon: 3.78541
    };
    return value * map[unit];
  }

  private fromComparableValue(type: QuantityType, value: number, unit: string): number {
    if (type === 'temperature') {
      return value;
    }

    if (type === 'length') {
      const map: Record<string, number> = {
        centimeters: 1,
        inches: 2.54,
        feet: 30.48,
        yards: 91.44
      };
      return value / map[unit];
    }

    if (type === 'weight') {
      const map: Record<string, number> = {
        gram: 1,
        kilogram: 1000,
        pound: 453.592
      };
      return value / map[unit];
    }

    const map: Record<string, number> = {
      millilitre: 0.001,
      litre: 1,
      gallon: 3.78541
    };
    return value / map[unit];
  }

  private convertTemperature(value: number, from: string, to: string): number {
    if (from === to) {
      return value;
    }

    let celsius = value;
    if (from === 'fahrenheit') {
      celsius = (value - 32) * 5 / 9;
    } else if (from === 'kelvin') {
      celsius = value - 273.15;
    }

    if (to === 'celsius') {
      return celsius;
    }
    if (to === 'fahrenheit') {
      return (celsius * 9 / 5) + 32;
    }
    return celsius + 273.15;
  }

  goToHistory(): void {
    this.router.navigate(['/history']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    this.userEmail = '';
    this.userName = 'Guest';
    this.router.navigate(['/home']);
  }
}