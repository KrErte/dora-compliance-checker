import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LangService } from '../lang.service';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api.service';
import { Organization, OrgMember, OrgInvite } from '../models';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white">
            {{ lang.currentLang === 'et' ? 'Meeskonna haldus' : 'Team Management' }}
          </h1>
          <p class="text-sm text-slate-400 mt-1">
            {{ lang.currentLang === 'et' ? 'Halda oma organisatsiooni ja meeskonna liikmeid' : 'Manage your organization and team members' }}
          </p>
        </div>
        <button (click)="showCreateModal = true"
                class="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                       hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
          + {{ lang.currentLang === 'et' ? 'Uus organisatsioon' : 'New Organization' }}
        </button>
      </div>

      <!-- Pending invites for current user -->
      @if (myInvites().length > 0) {
        <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <h3 class="text-sm font-semibold text-amber-400 mb-3">
            {{ lang.currentLang === 'et' ? 'Ootel kutsed' : 'Pending Invitations' }}
          </h3>
          @for (invite of myInvites(); track invite.id) {
            <div class="flex items-center justify-between py-2 border-b border-amber-500/10 last:border-0">
              <div>
                <span class="text-sm text-white">{{ invite.organizationId }}</span>
                <span class="text-xs text-slate-400 ml-2">{{ invite.role }}</span>
              </div>
              <button (click)="acceptInvite(invite.token)"
                      class="px-3 py-1 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                {{ lang.currentLang === 'et' ? 'Nõustu' : 'Accept' }}
              </button>
            </div>
          }
        </div>
      }

      <!-- Organizations list -->
      @if (organizations().length === 0 && !loading()) {
        <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
          <svg class="w-16 h-16 text-slate-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3 class="text-lg font-semibold text-white mb-2">
            {{ lang.currentLang === 'et' ? 'Organisatsioone pole' : 'No Organizations' }}
          </h3>
          <p class="text-sm text-slate-400">
            {{ lang.currentLang === 'et' ? 'Loo oma esimene organisatsioon meeskonnatöö alustamiseks' : 'Create your first organization to start collaborating' }}
          </p>
        </div>
      }

      @for (org of organizations(); track org.id) {
        <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <!-- Org header -->
          <div class="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-700/20 transition-colors"
               (click)="toggleOrg(org.id)">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {{ org.name.substring(0, 2).toUpperCase() }}
              </div>
              <div>
                <h3 class="text-base font-semibold text-white">{{ org.name }}</h3>
                @if (org.description) {
                  <p class="text-xs text-slate-400">{{ org.description }}</p>
                }
              </div>
            </div>
            <div class="flex items-center gap-2">
              @if (org.ownerId === auth.user()?.userId) {
                <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400">OWNER</span>
              }
              <svg class="w-5 h-5 text-slate-400 transition-transform" [class.rotate-180]="expandedOrg() === org.id"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>

          <!-- Expanded content -->
          @if (expandedOrg() === org.id) {
            <div class="border-t border-slate-700/50">
              <!-- Members section -->
              <div class="p-4 sm:p-5">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-sm font-semibold text-slate-300">
                    {{ lang.currentLang === 'et' ? 'Liikmed' : 'Members' }}
                    <span class="text-slate-500 font-normal ml-1">({{ orgMembers().length }})</span>
                  </h4>
                  @if (isOrgAdmin(org)) {
                    <button (click)="showInviteModal = org.id"
                            class="px-3 py-1.5 text-xs rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors">
                      + {{ lang.currentLang === 'et' ? 'Kutsu' : 'Invite' }}
                    </button>
                  }
                </div>

                <div class="space-y-2">
                  @for (member of orgMembers(); track member.id) {
                    <div class="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-700/20">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 text-xs font-bold">
                          {{ (member.fullName || member.email).substring(0, 2).toUpperCase() }}
                        </div>
                        <div>
                          <p class="text-sm text-white">{{ member.fullName || member.email }}</p>
                          <p class="text-xs text-slate-500">{{ member.email }}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                              [ngClass]="{
                                'bg-amber-500/20 text-amber-400': member.role === 'OWNER',
                                'bg-blue-500/20 text-blue-400': member.role === 'ADMIN',
                                'bg-slate-600/30 text-slate-400': member.role === 'MEMBER'
                              }">
                          {{ member.role }}
                        </span>
                        @if (isOrgAdmin(org) && member.role !== 'OWNER' && member.userId !== auth.user()?.userId) {
                          <div class="relative">
                            <select (change)="changeMemberRole(org.id, member.id, $event)"
                                    [value]="member.role"
                                    class="text-xs bg-slate-700 text-slate-300 rounded px-1 py-0.5 border border-slate-600/50">
                              <option value="ADMIN">Admin</option>
                              <option value="MEMBER">Member</option>
                            </select>
                            <button (click)="removeMember(org.id, member.id)"
                                    class="ml-1 text-red-400 hover:text-red-300 text-xs" title="Remove">
                              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M18 6 6 18M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Pending invites -->
              @if (isOrgAdmin(org) && orgInvites().length > 0) {
                <div class="px-4 sm:px-5 pb-4">
                  <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {{ lang.currentLang === 'et' ? 'Ootel kutsed' : 'Pending Invites' }}
                  </h4>
                  @for (invite of orgInvites(); track invite.id) {
                    <div class="flex items-center justify-between py-1.5 text-sm">
                      <div class="flex items-center gap-2">
                        <span class="text-slate-300">{{ invite.email }}</span>
                        <span class="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">{{ invite.role }}</span>
                      </div>
                      <button (click)="cancelInvite(org.id, invite.id)"
                              class="text-xs text-red-400 hover:text-red-300">
                        {{ lang.currentLang === 'et' ? 'Tühista' : 'Cancel' }}
                      </button>
                    </div>
                  }
                </div>
              }

              <!-- Org actions -->
              <div class="px-4 sm:px-5 pb-4 flex gap-2">
                @if (org.ownerId === auth.user()?.userId) {
                  <button (click)="showEditModal = org.id; editName = org.name; editDesc = org.description || ''"
                          class="px-3 py-1.5 text-xs rounded-lg bg-slate-600/30 text-slate-300 hover:bg-slate-600/50 transition-colors">
                    {{ lang.currentLang === 'et' ? 'Muuda' : 'Edit' }}
                  </button>
                  <button (click)="confirmDeleteOrg = org.id"
                          class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                    {{ lang.currentLang === 'et' ? 'Kustuta' : 'Delete' }}
                  </button>
                } @else {
                  <button (click)="leaveOrg(org.id)"
                          class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                    {{ lang.currentLang === 'et' ? 'Lahku' : 'Leave' }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Create org modal -->
      @if (showCreateModal) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showCreateModal = false">
          <div class="bg-slate-800 rounded-xl border border-slate-700/50 shadow-xl w-full max-w-md" (click)="$event.stopPropagation()">
            <div class="p-5 border-b border-slate-700/50">
              <h3 class="text-lg font-semibold text-white">
                {{ lang.currentLang === 'et' ? 'Loo organisatsioon' : 'Create Organization' }}
              </h3>
            </div>
            <div class="p-5 space-y-4">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">
                  {{ lang.currentLang === 'et' ? 'Nimi' : 'Name' }} *
                </label>
                <input [(ngModel)]="newOrgName" type="text"
                       class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white
                              focus:outline-none focus:border-emerald-500/50"
                       [placeholder]="lang.currentLang === 'et' ? 'Organisatsiooni nimi' : 'Organization name'">
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">
                  {{ lang.currentLang === 'et' ? 'Kirjeldus' : 'Description' }}
                </label>
                <textarea [(ngModel)]="newOrgDesc" rows="2"
                          class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white
                                 focus:outline-none focus:border-emerald-500/50"
                          [placeholder]="lang.currentLang === 'et' ? 'Valikuline kirjeldus' : 'Optional description'"></textarea>
              </div>
            </div>
            <div class="p-5 border-t border-slate-700/50 flex justify-end gap-2">
              <button (click)="showCreateModal = false"
                      class="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                {{ lang.currentLang === 'et' ? 'Tühista' : 'Cancel' }}
              </button>
              <button (click)="createOrg()" [disabled]="!newOrgName.trim()"
                      class="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                             hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 transition-all">
                {{ lang.currentLang === 'et' ? 'Loo' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Invite modal -->
      @if (showInviteModal) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showInviteModal = null">
          <div class="bg-slate-800 rounded-xl border border-slate-700/50 shadow-xl w-full max-w-md" (click)="$event.stopPropagation()">
            <div class="p-5 border-b border-slate-700/50">
              <h3 class="text-lg font-semibold text-white">
                {{ lang.currentLang === 'et' ? 'Kutsu liige' : 'Invite Member' }}
              </h3>
            </div>
            <div class="p-5 space-y-4">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Email *</label>
                <input [(ngModel)]="inviteEmail" type="email"
                       class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white
                              focus:outline-none focus:border-violet-500/50"
                       placeholder="user@example.com">
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">
                  {{ lang.currentLang === 'et' ? 'Roll' : 'Role' }}
                </label>
                <select [(ngModel)]="inviteRole"
                        class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white
                               focus:outline-none focus:border-violet-500/50">
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div class="p-5 border-t border-slate-700/50 flex justify-end gap-2">
              <button (click)="showInviteModal = null"
                      class="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                {{ lang.currentLang === 'et' ? 'Tühista' : 'Cancel' }}
              </button>
              <button (click)="sendInvite()" [disabled]="!inviteEmail.trim()"
                      class="px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50 transition-all">
                {{ lang.currentLang === 'et' ? 'Saada kutse' : 'Send Invite' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Edit modal -->
      @if (showEditModal) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showEditModal = null">
          <div class="bg-slate-800 rounded-xl border border-slate-700/50 shadow-xl w-full max-w-md" (click)="$event.stopPropagation()">
            <div class="p-5 border-b border-slate-700/50">
              <h3 class="text-lg font-semibold text-white">
                {{ lang.currentLang === 'et' ? 'Muuda organisatsiooni' : 'Edit Organization' }}
              </h3>
            </div>
            <div class="p-5 space-y-4">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">
                  {{ lang.currentLang === 'et' ? 'Nimi' : 'Name' }}
                </label>
                <input [(ngModel)]="editName" type="text"
                       class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white
                              focus:outline-none focus:border-emerald-500/50">
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">
                  {{ lang.currentLang === 'et' ? 'Kirjeldus' : 'Description' }}
                </label>
                <textarea [(ngModel)]="editDesc" rows="2"
                          class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white
                                 focus:outline-none focus:border-emerald-500/50"></textarea>
              </div>
            </div>
            <div class="p-5 border-t border-slate-700/50 flex justify-end gap-2">
              <button (click)="showEditModal = null"
                      class="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                {{ lang.currentLang === 'et' ? 'Tühista' : 'Cancel' }}
              </button>
              <button (click)="updateOrg()"
                      class="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                             hover:from-emerald-400 hover:to-cyan-400 transition-all">
                {{ lang.currentLang === 'et' ? 'Salvesta' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Delete confirmation -->
      @if (confirmDeleteOrg) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="confirmDeleteOrg = null">
          <div class="bg-slate-800 rounded-xl border border-red-500/30 shadow-xl w-full max-w-sm p-5" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold text-white mb-2">
              {{ lang.currentLang === 'et' ? 'Kustuta organisatsioon?' : 'Delete Organization?' }}
            </h3>
            <p class="text-sm text-slate-400 mb-4">
              {{ lang.currentLang === 'et' ? 'See toiming on pöördumatu. Kõik liikmed eemaldatakse.' : 'This action cannot be undone. All members will be removed.' }}
            </p>
            <div class="flex justify-end gap-2">
              <button (click)="confirmDeleteOrg = null"
                      class="px-4 py-2 text-sm text-slate-400 hover:text-white">
                {{ lang.currentLang === 'et' ? 'Tühista' : 'Cancel' }}
              </button>
              <button (click)="deleteOrg(confirmDeleteOrg!)"
                      class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-400 transition-all">
                {{ lang.currentLang === 'et' ? 'Kustuta' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class TeamManagementComponent implements OnInit {
  organizations = signal<Organization[]>([]);
  orgMembers = signal<OrgMember[]>([]);
  orgInvites = signal<OrgInvite[]>([]);
  myInvites = signal<OrgInvite[]>([]);
  expandedOrg = signal<string | null>(null);
  loading = signal(true);

  showCreateModal = false;
  showInviteModal: string | null = null;
  showEditModal: string | null = null;
  confirmDeleteOrg: string | null = null;

  newOrgName = '';
  newOrgDesc = '';
  inviteEmail = '';
  inviteRole = 'MEMBER';
  editName = '';
  editDesc = '';

  constructor(
    public lang: LangService,
    public auth: AuthService,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.loadOrganizations();
    this.loadMyInvites();
  }

  loadOrganizations() {
    this.loading.set(true);
    this.api.getOrganizations().subscribe({
      next: (orgs) => { this.organizations.set(orgs); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadMyInvites() {
    this.api.getMyOrgInvites().subscribe({
      next: (invites) => this.myInvites.set(invites),
      error: () => {}
    });
  }

  toggleOrg(orgId: string) {
    if (this.expandedOrg() === orgId) {
      this.expandedOrg.set(null);
    } else {
      this.expandedOrg.set(orgId);
      this.loadMembers(orgId);
      this.loadInvites(orgId);
    }
  }

  loadMembers(orgId: string) {
    this.api.getOrgMembers(orgId).subscribe({
      next: (members) => this.orgMembers.set(members),
      error: () => {}
    });
  }

  loadInvites(orgId: string) {
    this.api.getOrgInvites(orgId).subscribe({
      next: (invites) => this.orgInvites.set(invites),
      error: () => this.orgInvites.set([])
    });
  }

  isOrgAdmin(org: Organization): boolean {
    return org.ownerId === this.auth.user()?.userId;
  }

  createOrg() {
    if (!this.newOrgName.trim()) return;
    this.api.createOrganization({ name: this.newOrgName, description: this.newOrgDesc || undefined }).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.newOrgName = '';
        this.newOrgDesc = '';
        this.loadOrganizations();
      }
    });
  }

  updateOrg() {
    if (!this.showEditModal) return;
    this.api.updateOrganization(this.showEditModal, { name: this.editName, description: this.editDesc || undefined }).subscribe({
      next: () => {
        this.showEditModal = null;
        this.loadOrganizations();
      }
    });
  }

  deleteOrg(orgId: string) {
    this.api.deleteOrganization(orgId).subscribe({
      next: () => {
        this.confirmDeleteOrg = null;
        this.expandedOrg.set(null);
        this.loadOrganizations();
      }
    });
  }

  sendInvite() {
    if (!this.showInviteModal || !this.inviteEmail.trim()) return;
    this.api.inviteToOrg(this.showInviteModal, { email: this.inviteEmail, role: this.inviteRole }).subscribe({
      next: () => {
        const orgId = this.showInviteModal!;
        this.showInviteModal = null;
        this.inviteEmail = '';
        this.inviteRole = 'MEMBER';
        this.loadInvites(orgId);
      }
    });
  }

  cancelInvite(orgId: string, inviteId: string) {
    this.api.cancelOrgInvite(orgId, inviteId).subscribe({
      next: () => this.loadInvites(orgId)
    });
  }

  acceptInvite(token: string) {
    this.api.acceptOrgInvite(token).subscribe({
      next: () => {
        this.loadMyInvites();
        this.loadOrganizations();
      }
    });
  }

  changeMemberRole(orgId: string, memberId: string, event: Event) {
    const role = (event.target as HTMLSelectElement).value;
    this.api.updateMemberRole(orgId, memberId, role).subscribe({
      next: () => this.loadMembers(orgId)
    });
  }

  removeMember(orgId: string, memberId: string) {
    this.api.removeOrgMember(orgId, memberId).subscribe({
      next: () => this.loadMembers(orgId)
    });
  }

  leaveOrg(orgId: string) {
    this.api.leaveOrganization(orgId).subscribe({
      next: () => {
        this.expandedOrg.set(null);
        this.loadOrganizations();
      }
    });
  }
}
