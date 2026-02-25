import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../services/admin.service';

@Component({
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">Admin Panel</h1>
          <p class="text-sm text-slate-400 mt-1">User management — {{ users().length }} users</p>
        </div>
      </div>

      <!-- Toast -->
      @if (toast()) {
        <div class="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in"
             [class]="toast()!.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'">
          {{ toast()!.message }}
        </div>
      }

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (error()) {
        <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p class="text-red-400">{{ error() }}</p>
          <button (click)="loadUsers()" class="mt-3 px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            Retry
          </button>
        </div>
      } @else {
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-700/50">
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Provider</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.id) {
                  <tr class="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td class="px-4 py-3 text-slate-300">
                      {{ user.fullName || '—' }}
                      @if (user.earlyAdopter) {
                        <span class="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-400">EA</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-slate-400 font-mono text-xs">{{ user.email }}</td>
                    <td class="px-4 py-3">
                      <select [ngModel]="user.role" (ngModelChange)="updateUser(user, 'role', $event)"
                              class="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1 focus:border-emerald-500 focus:outline-none cursor-pointer">
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td class="px-4 py-3">
                      <select [ngModel]="user.accountTier" (ngModelChange)="updateUser(user, 'accountTier', $event)"
                              class="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1 focus:border-emerald-500 focus:outline-none cursor-pointer">
                        <option value="FREE">FREE</option>
                        <option value="PREMIUM">PREMIUM</option>
                        <option value="STANDARD">STANDARD</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 text-[10px] font-medium rounded-full"
                            [class]="user.authProvider === 'LOCAL' ? 'bg-slate-600/50 text-slate-400' :
                                     user.authProvider === 'GOOGLE' ? 'bg-blue-500/20 text-blue-400' :
                                     'bg-violet-500/20 text-violet-400'">
                        {{ user.authProvider }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-500">{{ formatDate(user.createdAt) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  users = signal<AdminUser[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getUsers().subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.status === 403 ? 'Access denied — admin role required' : 'Failed to load users');
        this.loading.set(false);
      }
    });
  }

  updateUser(user: AdminUser, field: 'role' | 'accountTier', value: string) {
    this.adminService.updateUser(user.id, { [field]: value }).subscribe({
      next: () => {
        (user as any)[field] = value;
        this.showToast(`${user.email} updated — ${field}: ${value}`, 'success');
      },
      error: () => {
        this.showToast(`Failed to update ${user.email}`, 'error');
        this.loadUsers();
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private showToast(message: string, type: 'success' | 'error') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
