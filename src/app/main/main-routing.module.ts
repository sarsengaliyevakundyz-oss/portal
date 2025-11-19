import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LayoutComponent} from './layout/layout.component';
import {MainPageComponent} from './pages/main-page/main-page.component';
import {SystemsComponent} from './pages/systems/systems.component';
import {SystemChildComponent} from './pages/system-child/system-child.component';
import {NewsPageComponent} from './pages/news-page/news-page.component';
import {ProfileComponent} from '../admin/pages/profile/profile.component';
import {NewsDetailComponent} from './pages/news-page/news-detail/news-detail.component';
import {DocumentsComponent} from './pages/documents/documents.component';

const routes: Routes = [
  {path: '', component: LayoutComponent, children: [
      {path: '', component: MainPageComponent},
      {path: 'systems', component: SystemsComponent},
      {path: 'systems/:id', component: SystemChildComponent},
      {path: 'news', component: NewsPageComponent},
      {path: 'news/:id', component: NewsDetailComponent},
      {path: 'documentation', component: DocumentsComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
