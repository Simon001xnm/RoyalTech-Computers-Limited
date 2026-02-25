
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
          // Escape quotes and wrap in quotes if it contains a comma
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
