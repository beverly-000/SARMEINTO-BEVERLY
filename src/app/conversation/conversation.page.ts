import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonInput } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, callOutline, send, ellipsisVertical, checkmarkDoneOutline } from 'ionicons/icons';
import { ApiMessage, ChatService } from '../services/chat.service';

@Component({
  selector: 'app-conversation',
  templateUrl: 'conversation.page.html',
  styleUrls: ['conversation.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonInput],
})
export class ConversationPage implements OnInit, OnDestroy {
  readonly backIcon = arrowBackOutline;
  readonly callIcon = callOutline;
  readonly sendIcon = send;
  readonly moreIcon = ellipsisVertical;
  readonly readIcon = checkmarkDoneOutline;
  readonly currentUserId = Number(JSON.parse(localStorage.getItem('watsup_user') || '{}').id || 0);
  conversationId = 0;
  contactName = 'Conversation';
  draft = '';
  messages: ApiMessage[] = [];
  errorMessage = '';
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly router: Router, private readonly route: ActivatedRoute, private readonly chatService: ChatService, private readonly changeDetector: ChangeDetectorRef) { addIcons({ arrowBackOutline, callOutline, send, ellipsisVertical, checkmarkDoneOutline }); }

  ngOnInit(): void { this.conversationId = Number(this.route.snapshot.paramMap.get('id')); this.contactName = this.route.snapshot.queryParamMap.get('name') || 'Conversation'; this.loadMessages(); this.refreshTimer = setInterval(() => this.loadMessages(true), 2000); }
  ngOnDestroy(): void { if (this.refreshTimer) clearInterval(this.refreshTimer); }
  loadMessages(silent = false): void { this.chatService.messages(this.conversationId).subscribe({ next: items => { this.messages = items; if (!items.length) { const text = this.route.snapshot.queryParamMap.get('lastMessage'); if (text) this.messages = [{ id: -1, text, senderId: 0, isRead: true, createdAt: new Date().toISOString() }]; } if (silent) this.errorMessage = ''; this.changeDetector.detectChanges(); }, error: () => { if (!silent) this.errorMessage = 'Could not load messages.'; this.changeDetector.detectChanges(); } }); }

  goBack(): void { this.router.navigateByUrl('/chats'); }

  sendMessage(): void {
    const text = this.draft.trim();
    if (!text) return;
    this.chatService.send(this.conversationId, text).subscribe({ next: message => { this.messages.push(message); this.draft = ''; }, error: () => this.errorMessage = 'Could not send message.' });
  }

  editMessage(message: ApiMessage): void { if (message.senderId !== this.currentUserId) return; const updated = window.prompt('Edit message', message.text)?.trim(); if (!updated || updated === message.text) return; this.chatService.updateMessage(message.id, updated).subscribe({ next: () => message.text = updated, error: () => this.errorMessage = 'Could not update message.' }); }
  deleteMessage(message: ApiMessage): void { if (message.senderId !== this.currentUserId || !window.confirm('Delete this message?')) return; this.chatService.deleteMessage(message.id).subscribe({ next: () => this.messages = this.messages.filter(item => item.id !== message.id), error: () => this.errorMessage = 'Could not delete message.' }); }
}
