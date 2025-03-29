import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LayoutComponent} from '../main/layout/layout.component';
import {MainPageComponent} from '../main/pages/main-page/main-page.component';
import {SystemsComponent} from '../main/pages/systems/systems.component';
import {SystemChildComponent} from '../main/pages/system-child/system-child.component';
import {NewsPageComponent} from '../main/pages/news-page/news-page.component';
import {AdminLayoutComponent} from './admin-layout/admin-layout.component';
import {ProfileComponent} from './pages/profile/profile.component';
import {DictionariesComponent} from './dictionaries/dictionaries/dictionaries.component';
import {AdminNewsComponent} from './dictionaries/admin-news/admin-news.component';
import {AdminLocalizatorComponent} from './dictionaries/admin-localizator/admin-localizator.component';
import {AdminRolesComponent} from './dictionaries/roles/admin-roles.component';
import {AdminSystemsComponent} from './dictionaries/systems/admin-systems.component';

const routes: Routes = [
  {path: '', component: LayoutComponent, children: [
      {path: '', component: AdminLayoutComponent, children: [
          {path: '', redirectTo: 'profile', pathMatch: 'full'},
          {path: 'profile', component: ProfileComponent},
          {path: 'dic', component: DictionariesComponent, children: [
              {path: 'news', component: AdminNewsComponent},
              {path: 'trans', component: AdminLocalizatorComponent},
              {path: 'roles', component: AdminRolesComponent},
              {path: 'systems', component: AdminSystemsComponent},
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
