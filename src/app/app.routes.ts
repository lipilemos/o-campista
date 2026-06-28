import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/app-menu/app-menu.component').then((m) => m.AppMenuComponent),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'account',
        loadComponent: () =>
          import('./pages/account/account.component').then((m) => m.AccountComponent),
      },
      {
        path: 'mapa',
        loadComponent: () =>
          import('./pages/map/map.component').then((m) => m.MapComponent),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./pages/chat/chat.component').then((m) => m.ChatComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/chat/chat-list/chat-list.component').then(
                (m) => m.ChatListComponent,
              ),
          },
          {
            path: 'criar-grupo',
            loadComponent: () =>
              import('./pages/chat/chat-create-group/chat-create-group.component').then(
                (m) => m.ChatCreateGroupComponent,
              ),
          },
          {
            path: 'entrar-grupo',
            loadComponent: () =>
              import('./pages/chat/chat-join-group/chat-join-group.component').then(
                (m) => m.ChatJoinGroupComponent,
              ),
          },
          {
            path: 'entrar-grupo/:codigo',
            loadComponent: () =>
              import('./pages/chat/chat-join-group/chat-join-group.component').then(
                (m) => m.ChatJoinGroupComponent,
              ),
          },
        ],
      },
      {
        path: 'checklist',
        loadComponent: () =>
          import('./pages/checklist/checklist.component').then((m) => m.ChecklistComponent),
      },
      {
        path: 'gift',
        loadComponent: () =>
          import('./pages/gift/gift.component').then((m) => m.GiftComponent),
      },
    ],
  },
  {
    path: 'chat/:salaId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/chat/chat-conversation/chat-conversation.component').then(
        (m) => m.ChatConversationComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
