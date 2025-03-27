 import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () =>
      import('./main/main.module').then(m => m.MainModule)},
  { path: 'admin', loadChildren: () =>
      import('./admin/admin.module').then(m => m.AdminModule)}

];
