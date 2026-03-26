import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AiAnalysisResult, DoraAnalysisType } from '../models/parsed-document.model';
import { NetworkMonitorService } from './network-monitor.service';

@Injectable({ providedIn: 'root' })
export class AiAnalysisService {

  constructor(
    private http: HttpClient,
    private networkMonitor: NetworkMonitorService
  ) {}

  async requestAiAnalysis(
    extractedText: string,
    analysisType: DoraAnalysisType
  ): Promise<AiAnalysisResult> {
    const maxChars = 15000;
    const truncatedText = extractedText.substring(0, maxChars);

    const bytesSent = new Blob([truncatedText]).size;
    this.networkMonitor.recordTextSent(bytesSent);

    return firstValueFrom(
      this.http.post<AiAnalysisResult>('/api/v1/analyze/text', {
        text: truncatedText,
        analysisType
      })
    );
  }

  getPreviewText(extractedText: string): string {
    const maxChars = 15000;
    return extractedText.substring(0, maxChars);
  }

  getPreviewBytes(extractedText: string): number {
    return new Blob([this.getPreviewText(extractedText)]).size;
  }
}
