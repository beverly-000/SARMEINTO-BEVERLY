import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'conversation/:id',
    loadComponent: () => import('./conversation/conversation.page').then((m) => m.ConversationPage),
  },
  {
    path: 'chats',
    loadComponent: () => import('./chats/chats.page').then((m) => m.ChatsPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
