import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./main/main.module').then(m => m.MainModule),
    data: { animation: 'main', reuseComponent: true }
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    data: { animation: 'admin', reuseComponent: true }
  },
  // Добавьте редирект для неизвестных путей, если нужно
  { path: '**', redirectTo: '' }
];
