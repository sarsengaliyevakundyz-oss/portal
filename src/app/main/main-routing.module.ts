import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LayoutComponent} from './layout/layout.component';
import {MainPageComponent} from './pages/main-page/main-page.component';
import {SystemsComponent} from './pages/systems/systems.component';

const routes: Routes = [
  {path: '', component: LayoutComponent, children: [
      {path: '', component: MainPageComponent},
      {path: 'systems', component: SystemsComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
