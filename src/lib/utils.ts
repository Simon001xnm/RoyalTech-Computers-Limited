import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCsv<T extends Record<string, any>>(filename: string, data: T[], columnMapping: Record<string, string>) {
  const columnHeaders = Object.values(columnMapping);
  const columnKeys = Object.keys(columnMapping);

  const csvRows = [
    columnHeaders.join(','),
    ...data.map(row =>
      columnKeys
        .map(key => {
          let cell = row[key] === null || row[key] === undefined ? '' : String(row[key]);
          cell = cell.replace(/"/g, '""');
          if (cell.includes(',')) {
            cell = `"${cell}"`;
          }
          return cell;
        })
        .join(',')
    ),
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Converts a numeric figure into its full English word representation.
 * Handles thousands, hundreds, tens, cents and decimals in correct order.
 */
export function numberToWords(num: number): string {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];

  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' HUNDRED';
      n %= 100;
      if (n > 0) str += ' AND ';
    }
    if (n >= 10 && n < 20) {
      str += teens[n - 10];
    } else {
      if (n >= 20) {
        str += tens[Math.floor(n / 10)];
        if (n % 10 > 0) str += '-' + ones[n % 10];
      } else if (n > 0) {
        str += ones[n];
      }
    }
    return str;
  }

  if (num === 0) return 'ZERO SHILLINGS ONLY';

  const absoluteNum = Math.abs(num);
  const integerPart = Math.floor(absoluteNum);
  const decimalPart = Math.round((absoluteNum - integerPart) * 100);

  let result = '';
  
  const billion = Math.floor(integerPart / 1000000000);
  const million = Math.floor((integerPart % 1000000000) / 1000000);
  const thousand = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  if (billion > 0) {
    result += convertGroup(billion) + ' BILLION ';
  }
  if (million > 0) {
    result += convertGroup(million) + ' MILLION ';
  }
  if (thousand > 0) {
    result += convertGroup(thousand) + ' THOUSAND ';
  }
  if (remainder > 0) {
    if (result !== '' && remainder < 100) {
      result += 'AND ';
    }
    result += convertGroup(remainder);
  }

  result = result.trim();
  if (result === '' && integerPart === 0) result = 'ZERO';
  
  result += ' SHILLINGS';
  
  if (decimalPart > 0) {
    result += ' AND ' + convertGroup(decimalPart) + ' CENTS';
  }
  
  return result.trim() + ' ONLY';
}
