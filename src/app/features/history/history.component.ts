import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BackendApiService } from '../../core/services/backend-api.service';

interface HistoryItem {
  type: 'length' | 'weight' | 'volume' | 'temperature';
  operation: 'convert' | 'compare' | 'add' | 'subtract' | 'multiply' | 'divide';
  firstValue: number;
  firstUnit: string;
  secondValue: number;
  secondUnit: string;
  resultText: string;
  createdAt: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  userName = '';
  userEmail = '';

  allHistory: HistoryItem[] = [];
  filteredHistory: HistoryItem[] = [];

  typeFilter = 'all';
  operationFilter = 'all';

  constructor(
    private router: Router,
    private backendApi: BackendApiService
  ) {}

  ngOnInit(): void {
    this.userName = localStorage.getItem('userName') || 'User';
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.loadHistory();
  }

  loadHistory(): void {
    if (!this.userEmail) {
      this.allHistory = [];
      this.filteredHistory = [];
      return;
    }

    this.backendApi.getMyHistory(this.userEmail).subscribe({
      next: (response) => {
        this.allHistory = response.map((item) => this.mapToHistoryItem(item));
        this.applyFilters();
      },
      error: (error) => {
        if (error?.status === 401) {
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('authToken');
          this.router.navigate(['/login']);
          return;
        }
        this.allHistory = [];
        this.filteredHistory = [];
      }
    });
  }

  applyFilters(): void {
    this.filteredHistory = this.allHistory.filter((item) => {
      const typeMatch = this.typeFilter === 'all' || item.type === this.typeFilter;
      const operationMatch =
        this.operationFilter === 'all' || item.operation === this.operationFilter;

      return typeMatch && operationMatch;
    });
  }

  clearHistory(): void {
    alert('Clear history is not available from backend API yet.');
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    this.router.navigate(['/home']);
  }

  private mapToHistoryItem(item: any): HistoryItem {
    const selectedType = String(item?.thisMeasurementType || '').toLowerCase() as HistoryItem['type'];
    const operation = String(item?.operation || '').toLowerCase() as HistoryItem['operation'];
    const firstValue = Number(item?.thisValue ?? 0);
    const secondValue = Number(item?.thatValue ?? 0);

    const firstUnit = this.mapUnitForUi(selectedType, String(item?.thisUnit || ''));
    const secondUnit = this.mapUnitForUi(selectedType, String(item?.thatUnit || ''));

    let resultText = '';
    if (operation === 'compare') {
      const result = String(item?.resultString || '').toUpperCase();
      if (result === 'GREATER') {
        resultText = `${firstValue} ${firstUnit} is greater than ${secondValue} ${secondUnit}`;
      } else if (result === 'LESSER') {
        resultText = `${firstValue} ${firstUnit} is smaller than ${secondValue} ${secondUnit}`;
      } else {
        resultText = `${firstValue} ${firstUnit} is equal to ${secondValue} ${secondUnit}`;
      }
    } else if (operation === 'convert') {
      const rawResult = Number(item?.resultValue ?? 0);
      const converted = this.backendApi.toUiValue(selectedType, rawResult, secondUnit);
      resultText = `${firstValue} ${firstUnit} = ${Number(converted.toFixed(4))} ${secondUnit}`;
    } else if (operation === 'multiply' || operation === 'divide') {
      resultText = `Result: ${Number(Number(item?.resultValue ?? 0).toFixed(4))}`;
    } else {
      const rawResult = Number(item?.resultValue ?? 0);
      const converted = this.backendApi.toUiValue(selectedType, rawResult, firstUnit);
      resultText = `Result: ${Number(converted.toFixed(4))} ${firstUnit}`;
    }

    return {
      type: selectedType,
      operation,
      firstValue,
      firstUnit,
      secondValue,
      secondUnit,
      resultText,
      createdAt: this.formatDate(item?.createdAt)
    };
  }

  private mapUnitForUi(type: HistoryItem['type'], unit: string): string {
    const upperUnit = unit.toUpperCase();
    if (type === 'length' && upperUnit === 'CENTIMETERS') {
      return 'centimeters';
    }
    if (type === 'weight' && upperUnit === 'GRAM') {
      return 'gram';
    }
    if (type === 'volume' && upperUnit === 'LITRE') {
      return 'litre';
    }
    return unit.toLowerCase();
  }

  private formatDate(dateInput: string): string {
    if (!dateInput) {
      return '';
    }

    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString();
  }
}