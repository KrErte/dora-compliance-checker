import { Injectable, signal, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from '../api.service';
import { ComplianceAlert } from '../models';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  badgeCount = signal(0);
  alerts = signal<ComplianceAlert[]>([]);
  notifications = signal<AppNotification[]>([]);
  private pollInterval: any;
  private isBrowser: boolean;

  constructor(
    private api: ApiService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  startPolling(): void {
    if (!this.isBrowser) return;
    this.refresh();
    this.pollInterval = setInterval(() => this.refresh(), 30000);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  refresh(): void {
    this.api.getComplianceAlerts().subscribe({
      next: (alerts) => {
        this.alerts.set(alerts);
        this.badgeCount.set(alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING').length);
      },
      error: () => {}
    });
    this.api.getUnreadNotifications().subscribe({
      next: (notifs: any[]) => {
        this.notifications.set(notifs.map(n => ({
          id: n.id,
          type: n.type || 'INFO',
          title: n.title || '',
          message: n.message || '',
          read: n.read ?? false,
          createdAt: n.createdAt || '',
          link: n.link
        })));
        // Add unread notifications to badge
        const alertCount = this.alerts().filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING').length;
        this.badgeCount.set(alertCount + notifs.length);
      },
      error: () => {}
    });
  }

  markAsRead(id: number): void {
    this.api.markNotificationRead(String(id)).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
        this.badgeCount.update(c => Math.max(0, c - 1));
      },
      error: () => {}
    });
  }

  markAllAsRead(): void {
    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
        // Only keep alert-based badge count
        const alertCount = this.alerts().filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING').length;
        this.badgeCount.set(alertCount);
      },
      error: () => {}
    });
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return `${Math.floor(diffDay / 7)}w ago`;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
