import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonInput } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chatbubbleEllipsesOutline, createOutline, searchOutline, settingsOutline, personAddOutline, logOutOutline } from 'ionicons/icons';
import { ChatService, Conversation, WatsUpUser, MessageRequest } from '../services/chat.service';

@Component({
  selector: 'app-chats',
  templateUrl: 'chats.page.html',
  styleUrls: ['chats.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonInput],
})
export class ChatsPage implements OnInit, OnDestroy {
  readonly chatIcon = chatbubbleEllipsesOutline;
  readonly createIcon = createOutline;
  readonly searchIcon = searchOutline;
  readonly settingsIcon = settingsOutline;
  readonly contactIcon = personAddOutline;
  readonly logoutIcon = logOutOutline;
  userName = 'there';
  conversations: Conversation[] = [];
  users: WatsUpUser[] = [];
  searchTerm = '';
  showAddModal = false;
  showRequestModal = false;
  newContactPhone = '';
  requestPhone = '';
  requestText = '';
  errorMessage = '';
  requests: MessageRequest[] = [];
  private refreshTimer?: ReturnType<typeof setInterval>;
  private cacheKey(kind: string): string { const user = JSON.parse(localStorage.getItem('watsup_user') || '{}'); return `watsup_${kind}_${user.id || 'guest'}`; }

  constructor(private readonly router: Router, private readonly chatService: ChatService, private readonly changeDetector: ChangeDetectorRef) {
    addIcons({ chatbubbleEllipsesOutline, createOutline, searchOutline, settingsOutline, personAddOutline, logOutOutline });
  }

  ngOnInit(): void {
    const currentUser = JSON.parse(localStorage.getItem('watsup_user') || '{}');
    this.userName = currentUser.displayName || 'there';
    this.searchTerm = localStorage.getItem(this.cacheKey('search')) || '';
    this.loadData();
    this.refreshTimer = setInterval(() => this.loadData(true), 3000);
  }

  ngOnDestroy(): void { if (this.refreshTimer) clearInterval(this.refreshTimer); }
  saveSearch(value: string): void { this.searchTerm = value; localStorage.setItem(this.cacheKey('search'), value); }
  private uniqueConversations(items: Conversation[]): Conversation[] {
    const byName = new Map<string, Conversation>();
    for (const item of items) {
      const key = item.name.trim().toLowerCase();
      const current = byName.get(key);
      if (!current || (!current.lastMessage && item.lastMessage) || (Boolean(current.lastMessage) === Boolean(item.lastMessage) && new Date(item.lastMessageAt || 0).getTime() > new Date(current.lastMessageAt || 0).getTime())) byName.set(key, item);
    }
    return [...byName.values()];
  }

  loadData(silent = false): void {
    const cachedConversations = localStorage.getItem(this.cacheKey('conversations'));
    const cachedContacts = localStorage.getItem(this.cacheKey('contacts'));
    if (cachedConversations) this.conversations = this.uniqueConversations(JSON.parse(cachedConversations));
    if (cachedContacts) this.users = JSON.parse(cachedContacts);
    this.chatService.conversations().subscribe({
      next: (items) => { this.conversations = this.uniqueConversations(items); localStorage.setItem(this.cacheKey('conversations'), JSON.stringify(this.conversations)); this.changeDetector.detectChanges(); },
      error: () => { if (!silent && !this.conversations.length) this.errorMessage = 'Could not load conversations. Check that the API and MySQL are running.'; },
    });
    this.chatService.contacts().subscribe({
      next: (items) => { this.users = items; localStorage.setItem(this.cacheKey('contacts'), JSON.stringify(items)); this.changeDetector.detectChanges(); },
      error: () => { if (!silent && !this.users.length) this.errorMessage = 'Could not load saved contacts. Check that the API and MySQL are running.'; },
    });
    this.chatService.requests().subscribe({ next: items => { this.requests = items; this.changeDetector.detectChanges(); }, error: () => undefined });
  }

  acceptRequest(request: MessageRequest): void { this.chatService.acceptRequest(request.id).subscribe({ next: result => { this.requests = this.requests.filter(item => item.id !== request.id); this.loadData(); this.router.navigate(['/conversation', result.conversationId], { queryParams: { name: request.senderName } }); }, error: () => this.errorMessage = 'Could not accept message request.' }); }
  declineRequest(request: MessageRequest): void { this.chatService.declineRequest(request.id).subscribe({ next: () => this.requests = this.requests.filter(item => item.id !== request.id), error: () => this.errorMessage = 'Could not decline request.' }); }

  get filteredContacts(): WatsUpUser[] { const query = this.searchTerm.trim().toLowerCase(); return query ? this.users.filter(user => user.displayName.toLowerCase().includes(query) || user.phone.includes(query)) : this.users; }

  addContact(): void { this.showAddModal = true; this.errorMessage = ''; this.newContactPhone = ''; }
  closeAddModal(): void { this.showAddModal = false; }
  openRequestModal(): void { this.showRequestModal = true; this.errorMessage = ''; this.requestPhone = ''; this.requestText = ''; }
  closeRequestModal(): void { this.showRequestModal = false; }
  submitRequest(): void {
    const phone = this.requestPhone.trim(); const text = this.requestText.trim();
    if (!phone || !text) { this.errorMessage = 'Enter a phone number and message.'; return; }
    this.chatService.sendRequest(phone, text).subscribe({ next: () => { this.showRequestModal = false; }, error: error => this.errorMessage = error.error?.message || 'Could not send message request.' });
  }
  submitAddContact(): void {
    const phone = this.newContactPhone.trim();
    if (!phone) { this.errorMessage = 'Enter a phone number.'; return; }
    this.chatService.addContact(phone).subscribe({ next: contact => { this.users = [...this.users, contact].sort((a, b) => a.displayName.localeCompare(b.displayName)); localStorage.setItem(this.cacheKey('contacts'), JSON.stringify(this.users)); this.showAddModal = false; }, error: error => this.errorMessage = error.error?.message || 'Could not add contact.' });
  }

  openChat(chat: Conversation): void { this.router.navigate(['/conversation', chat.id], { queryParams: { name: chat.name, lastMessage: chat.lastMessage || '' } }); }

  startChat(user: WatsUpUser): void {
    this.chatService.createConversation(user.id).subscribe({ next: (chat) => this.router.navigate(['/conversation', chat.id], { queryParams: { name: user.displayName } }), error: () => this.errorMessage = 'Could not start conversation.' });
  }

  logout(): void {
    localStorage.removeItem('watsup_token');
    localStorage.removeItem('watsup_user');
    localStorage.removeItem('watsup_contacts');
    localStorage.removeItem('watsup_conversations');
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}
