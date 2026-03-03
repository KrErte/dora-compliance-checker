import { Injectable, computed, signal } from '@angular/core';

export interface ChecklistItem {
  id: string;
  labelKey: string;
  descKey: string;
  route: string;
  completed: boolean;
}

const STORAGE_KEY = 'dora_checklist';

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: 'first_assessment', labelKey: 'checklist.item_assessment', descKey: 'checklist.item_assessment_desc', route: '/assessment/wizard', completed: false },
  { id: 'view_results', labelKey: 'checklist.item_results', descKey: 'checklist.item_results_desc', route: '/history', completed: false },
  { id: 'analyze_contract', labelKey: 'checklist.item_contract', descKey: 'checklist.item_contract_desc', route: '/contract-analysis', completed: false },
  { id: 'explore_dora', labelKey: 'checklist.item_explore', descKey: 'checklist.item_explore_desc', route: '/dora-explorer', completed: false },
  { id: 'download_report', labelKey: 'checklist.item_report', descKey: 'checklist.item_report_desc', route: '/history', completed: false },
];

@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private itemsSignal = signal<ChecklistItem[]>(this.load());
  private dismissedSignal = signal<boolean>(this.loadDismissed());
  private celebrationSignal = signal<boolean>(false);

  items = this.itemsSignal.asReadonly();
  completedCount = computed(() => this.itemsSignal().filter(i => i.completed).length);
  progressPercent = computed(() => Math.round((this.completedCount() / this.itemsSignal().length) * 100));
  allComplete = computed(() => this.completedCount() === this.itemsSignal().length);
  isDismissed = this.dismissedSignal.asReadonly();
  isVisible = computed(() => !this.dismissedSignal() && !this.allComplete());
  showCelebration = this.celebrationSignal.asReadonly();

  markComplete(id: string): void {
    const current = this.itemsSignal();
    const item = current.find(i => i.id === id);
    if (!item || item.completed) return;

    const updated = current.map(i => i.id === id ? { ...i, completed: true } : i);
    this.itemsSignal.set(updated);
    this.save(updated);

    if (updated.every(i => i.completed)) {
      this.celebrationSignal.set(true);
      setTimeout(() => this.celebrationSignal.set(false), 5000);
    }
  }

  isComplete(id: string): boolean {
    return this.itemsSignal().find(i => i.id === id)?.completed ?? false;
  }

  dismiss(): void {
    this.dismissedSignal.set(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY + '_dismissed', 'true');
    }
  }

  detectExistingProgress(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const history = JSON.parse(localStorage.getItem('dora_history') || '[]');
      if (history.length > 0) {
        this.markComplete('first_assessment');
        this.markComplete('view_results');
      }
    } catch { /* ignore */ }
  }

  private load(): ChecklistItem[] {
    if (typeof localStorage === 'undefined') return DEFAULT_ITEMS.map(i => ({ ...i }));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_ITEMS.map(i => ({ ...i }));
      const saved: { id: string; completed: boolean }[] = JSON.parse(raw);
      return DEFAULT_ITEMS.map(def => {
        const s = saved.find(x => x.id === def.id);
        return { ...def, completed: s?.completed ?? false };
      });
    } catch {
      return DEFAULT_ITEMS.map(i => ({ ...i }));
    }
  }

  private loadDismissed(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY + '_dismissed') === 'true';
  }

  private save(items: ChecklistItem[]): void {
    if (typeof localStorage === 'undefined') return;
    const data = items.map(i => ({ id: i.id, completed: i.completed }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}
