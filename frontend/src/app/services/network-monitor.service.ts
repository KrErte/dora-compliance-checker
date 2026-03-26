import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkMonitorService {
  readonly filesSent = signal(0);
  readonly textBytesSent = signal(0);

  readonly isSafe = computed(() => this.filesSent() === 0 && this.textBytesSent() === 0);
  readonly hasAiTraffic = computed(() => this.textBytesSent() > 0);

  recordTextSent(bytes: number): void {
    this.textBytesSent.update(v => v + bytes);
  }

  reset(): void {
    this.filesSent.set(0);
    this.textBytesSent.set(0);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
