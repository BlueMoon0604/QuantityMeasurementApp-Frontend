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
  secondValue = 2;

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

  constructor(private router: Router, private backendApi: BackendApiService) {}

  ngOnInit(): void {
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.userName = localStorage.getItem('userName') || 'Guest';
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  goToHistory() {
    this.router.navigate(['/history']);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/home']);
  }

  selectType(type: QuantityType) {
    this.selectedType = type;
    this.selectedOperation = 'convert';
    this.resultText = '';
  }

  selectOperation(op: OperationType) {
    this.selectedOperation = op;
    this.resultText = '';
  }

  performAction() {
    this.backendApi.runCalculation({
      selectedType: this.selectedType,
      selectedOperation: this.selectedOperation,
      firstValue: this.firstValue,
      firstUnit: this.firstUnit,
      secondValue: this.secondValue,
      secondUnit: this.secondUnit,
      userEmail: this.userEmail,
      userName: this.userName
    }).subscribe(res => {
      this.resultText = this.buildResultText(res);
    });
  }

  private buildResultText(res: any): string {
    if (this.selectedOperation === 'compare') {
      const compareResult = String(res?.resultString || '').toUpperCase();
      if (compareResult === 'GREATER') {
        return `Result: ${this.firstValue} ${this.firstUnit} is greater than ${this.secondValue} ${this.secondUnit}`;
      }
      if (compareResult === 'LESSER') {
        return `Result: ${this.firstValue} ${this.firstUnit} is smaller than ${this.secondValue} ${this.secondUnit}`;
      }
      return `Result: ${this.firstValue} ${this.firstUnit} is equal to ${this.secondValue} ${this.secondUnit}`;
    }

    const rawResult = Number(res?.resultValue ?? 0);

    if (this.selectedOperation === 'convert') {
      const converted = this.backendApi.toUiValue(this.selectedType, rawResult, this.secondUnit);
      return `Result: ${Number(converted.toFixed(4))} ${this.secondUnit}`;
    }

    if (this.selectedOperation === 'add' || this.selectedOperation === 'subtract') {
      const converted = this.backendApi.toUiValue(this.selectedType, rawResult, this.firstUnit);
      return `Result: ${Number(converted.toFixed(4))} ${this.firstUnit}`;
    }

    if (this.selectedOperation === 'multiply' || this.selectedOperation === 'divide') {
      return `Result: ${Number(rawResult.toFixed(4))} ${this.firstUnit}`;
    }

    return `Result: ${rawResult} ${this.firstUnit}`;
  }

}