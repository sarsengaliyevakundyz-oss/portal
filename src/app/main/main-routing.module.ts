import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LayoutComponent} from './layout/layout.component';
import {MainPageComponent} from './pages/main-page/main-page.component';
import {SystemsComponent} from './pages/systems/systems.component';
import {SystemChildComponent} from './pages/system-child/system-child.component';
import {NewsPageComponent} from './pages/news-page/news-page.component';
import {ProfileComponent} from './pages/profile/profile.component';

const routes: Routes = [
  {path: '', component: LayoutComponent, children: [
      {path: '', component: MainPageComponent},
      {path: 'systems', component: SystemsComponent},
      {path: 'systems/:id', component: SystemChildComponent},
      {path: 'news', component: NewsPageComponent},
      {path: 'profile', component: ProfileComponent},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
