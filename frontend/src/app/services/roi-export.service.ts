import { Injectable, inject } from '@angular/core';
import { PdfBrandingHelper } from './pdf-branding.helper';
import { LangService } from '../lang.service';

export interface RoiVendor {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  type: string;
  criticality: 'critical' | 'important' | 'normal';
  contractStart?: string;
  contractEnd?: string;
  contractNumber?: string;
  hasExitStrategy?: boolean;
  exitStrategyDescription?: string;
  subcontractors: { name: string; country: string }[];
  leiCode?: string;
  riskScore?: number;
}

@Injectable({ providedIn: 'root' })
export class RoiExportService {
  private readonly lang = inject(LangService);

  constructor(private pdfBranding: PdfBrandingHelper) {}

  /**
   * Export vendors to EBA RoI CSV format (B_02.01 simplified)
   */
  exportToCsv(vendors: RoiVendor[], companyName: string): void {
    // EBA template headers
    const headers = [
      'Arrangement_Reference',
      'Provider_Name',
      'LEI_Code',
      'Country_Code',
      'Service_Type',
      'Criticality',
      'Contract_Start_Date',
      'Contract_End_Date',
      'Exit_Strategy_In_Place',
      'Has_Subcontracting',
      'Subcontractor_Names'
    ];

    const rows = vendors.map((v, index) => {
      const subcontractorNames = v.subcontractors.map(s => s.name).join(', ');
      return [
        `ARR-${String(index + 1).padStart(4, '0')}`,
        this.escapeCSV(v.name),
        v.leiCode || '',
        v.countryCode || '',
        this.mapServiceType(v.type),
        v.criticality || 'normal',
        v.contractStart || '',
        v.contractEnd || '',
        v.hasExitStrategy ? 'true' : 'false',
        v.subcontractors.length > 0 ? 'true' : 'false',
        this.escapeCSV(subcontractorNames)
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    this.downloadBlob(blob, `RoI_Export_${this.sanitizeFilename(companyName)}_${this.getDateString()}.csv`);
  }

  /**
   * Export vendors to PDF summary for board/management
   */
  async exportToPdf(vendors: RoiVendor[], companyName: string): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const branding = this.pdfBranding.getHeaderConfigSync();
    const [cr, cg, cb] = branding.primaryColor;
    const brandName = branding.companyName;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(cr, cg, cb);
    doc.text(this.lang.t('roi_pdf.title'), 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate gray
    doc.text(this.lang.t('roi_pdf.subtitle'), 14, 28);

    // Company info box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 35, pageWidth - 28, 30, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`${this.lang.t('roi_pdf.company')}: ${companyName}`, 20, 45);
    doc.text(`${this.lang.t('roi_pdf.date')}: ${new Date().toLocaleDateString(this.lang.lang() === 'et' ? 'et-EE' : 'en-GB')}`, 20, 52);
    doc.text(`${this.lang.t('roi_pdf.total_providers')}: ${vendors.length}`, 20, 59);

    // Statistics
    const critical = vendors.filter(v => v.criticality === 'critical').length;
    const important = vendors.filter(v => v.criticality === 'important').length;
    const withExitStrategy = vendors.filter(v => v.hasExitStrategy).length;
    const withSubcontractors = vendors.filter(v => v.subcontractors.length > 0).length;

    doc.text(`${this.lang.t('roi_pdf.critical')}: ${critical}`, pageWidth / 2 + 10, 45);
    doc.text(`${this.lang.t('roi_pdf.important')}: ${important}`, pageWidth / 2 + 10, 52);
    doc.text(`${this.lang.t('roi_pdf.with_exit_strategy')}: ${withExitStrategy}/${vendors.length}`, pageWidth / 2 + 10, 59);

    // Risk summary
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(this.lang.t('roi_pdf.summary'), 14, 78);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const summaryText = this.lang.t('roi_pdf.summary_text')
      .replace('{total}', String(vendors.length))
      .replace('{critical}', String(critical))
      .replace('{important}', String(important))
      .replace('{exitCount}', String(withExitStrategy))
      .replace('{subCount}', String(withSubcontractors));

    const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 28);
    doc.text(splitSummary, 14, 86);

    // Providers table
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(this.lang.t('roi_pdf.providers_register'), 14, 105);

    autoTable(doc, {
      startY: 110,
      head: [[this.lang.t('roi_pdf.col_provider'), this.lang.t('roi_pdf.col_country'), this.lang.t('roi_pdf.col_service'), this.lang.t('roi_pdf.col_criticality'), this.lang.t('roi_pdf.col_contract_until'), this.lang.t('roi_pdf.col_exit')]],
      body: vendors.map(v => [
        v.name,
        v.countryCode || '-',
        this.truncate(v.type, 15),
        this.translateCriticality(v.criticality),
        v.contractEnd || '-',
        v.hasExitStrategy ? this.lang.t('roi_pdf.yes') : this.lang.t('roi_pdf.no')
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [cr, cg, cb],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 15 }
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${this.lang.t('roi_pdf.generated')} ${brandName} | ${new Date().toISOString().split('T')[0]} | ${this.lang.t('roi_pdf.page')} ${i}/${pageCount}`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    doc.save(`RoI_Summary_${this.sanitizeFilename(companyName)}_${this.getDateString()}.pdf`);
  }

  private mapServiceType(type: string): string {
    const mapping: Record<string, string> = {
      'Cloud Hosting': 'CLOUD',
      'Network / Transit': 'NETWORK',
      'KYC / Identity': 'KYC',
      'SIEM / Monitoring': 'SECURITY',
      'CDN / WAF': 'CDN',
      'SSL / PKI': 'CERTIFICATES',
      'Identity & Auth': 'IAM',
      'Core Banking': 'CORE_BANKING',
      'Payment Processing': 'PAYMENTS',
      'Data Analytics': 'ANALYTICS',
      'HR / Recruitment': 'HR',
      'CRM / Sales': 'CRM'
    };
    return mapping[type] || 'OTHER';
  }

  private translateCriticality(criticality: string): string {
    const translations: Record<string, string> = {
      'critical': this.lang.t('sc.criticality_critical'),
      'important': this.lang.t('sc.criticality_important'),
      'normal': this.lang.t('sc.criticality_normal')
    };
    return translations[criticality] || criticality;
  }

  private escapeCSV(value: string): string {
    if (!value) return '';
    if (value.includes(';') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private truncate(str: string, maxLength: number): string {
    if (!str) return '-';
    return str.length > maxLength ? str.substring(0, maxLength - 2) + '..' : str;
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
