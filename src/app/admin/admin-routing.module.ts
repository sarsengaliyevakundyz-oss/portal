import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LayoutComponent} from '../main/layout/layout.component';
import {AdminLayoutComponent} from './admin-layout/admin-layout.component';
import {ProfileComponent} from './pages/profile/profile.component';
import {DictionariesComponent} from './dictionaries/dictionaries/dictionaries.component';
import {AdminNewsComponent} from './dictionaries/admin-news/admin-news.component';
import {AdminCategoriesComponent} from './dictionaries/admin-categories/admin-categories.component';
import {AdminLocalizatorComponent} from './dictionaries/admin-localizator/admin-localizator.component';
import {AdminRolesComponent} from './dictionaries/roles/admin-roles.component';
import {AdminSystemsComponent} from './dictionaries/systems/admin-systems.component';
import {AdminInstructionsComponent} from './dictionaries/admin-instructions/admin-instructions.component';
import {AnalyticsComponent} from './analytics/analytics.component';

const routes: Routes = [
  {path: '', component: LayoutComponent, children: [
      {path: '', component: AdminLayoutComponent, children: [
          {path: '', redirectTo: 'profile', pathMatch: 'full'},
          {path: 'profile', component: ProfileComponent},
          {path: 'analytics', component: AnalyticsComponent},

          {path: 'dic', component: DictionariesComponent, children: [
              {path: '', redirectTo: 'systems', pathMatch: 'full'},
              {path: 'news',         component: AdminNewsComponent},
              {path: 'categories',   component: AdminCategoriesComponent},
              {path: 'trans',        component: AdminLocalizatorComponent},
              {path: 'roles',        component: AdminRolesComponent},
              {path: 'systems',      component: AdminSystemsComponent},
              {path: 'instructions', component: AdminInstructionsComponent},
            ]}
        ]}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
