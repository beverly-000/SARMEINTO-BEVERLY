import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';

export interface WatsUpUser { id: number; phone: string; displayName: string; avatarUrl?: string; }
export interface Conversation { id: number; name: string; avatarUrl?: string; lastMessage?: string; lastMessageAt?: string; }
export interface ApiMessage { id: number; text: string; senderId: number; senderName?: string; isRead: boolean; createdAt: string; }
export interface MessageRequest { id: number; messageText: string; senderId: number; senderName: string; senderPhone: string; createdAt: string; }

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);
  private get apiUrl(): string { return this.config.baseUrl(); }
  private headers(): HttpHeaders { return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('watsup_token') || ''}` }); }
  users() { return this.http.get<WatsUpUser[]>(`${this.apiUrl}/users`, { headers: this.headers() }); }
  contacts() { return this.http.get<WatsUpUser[]>(`${this.apiUrl}/contacts`, { headers: this.headers() }); }
  addContact(phone: string) { return this.http.post<WatsUpUser>(`${this.apiUrl}/contacts`, { phone }, { headers: this.headers() }); }
  removeContact(id: number) { return this.http.delete(`${this.apiUrl}/contacts/${id}`, { headers: this.headers() }); }
  conversations() { return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`, { headers: this.headers() }); }
  createConversation(participantId: number) { return this.http.post<{ id: number }>(`${this.apiUrl}/conversations`, { participantId }, { headers: this.headers() }); }
  messages(id: number) { return this.http.get<ApiMessage[]>(`${this.apiUrl}/conversations/${id}/messages`, { headers: this.headers() }); }
  send(id: number, text: string) { return this.http.post<ApiMessage>(`${this.apiUrl}/conversations/${id}/messages`, { text }, { headers: this.headers() }); }
  updateMessage(id: number, text: string) { return this.http.put(`${this.apiUrl}/messages/${id}`, { text }, { headers: this.headers() }); }
  deleteMessage(id: number) { return this.http.delete(`${this.apiUrl}/messages/${id}`, { headers: this.headers() }); }
  requests() { return this.http.get<MessageRequest[]>(`${this.apiUrl}/message-requests`, { headers: this.headers() }); }
  acceptRequest(id: number) { return this.http.post<{ conversationId: number }>(`${this.apiUrl}/message-requests/${id}/accept`, {}, { headers: this.headers() }); }
  declineRequest(id: number) { return this.http.delete(`${this.apiUrl}/message-requests/${id}`, { headers: this.headers() }); }
  sendRequest(phone: string, text: string) { return this.http.post(`${this.apiUrl}/message-requests`, { phone, text }, { headers: this.headers() }); }
}
