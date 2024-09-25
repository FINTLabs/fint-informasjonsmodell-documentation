import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResultRoutes } from './views/result/result.routes';
import { ModelComponent } from './views/model/model.component';

const routes: Routes = [
  { path: '', component: ModelComponent, pathMatch: 'full' },
  ...ResultRoutes,
  { path: '**', redirectTo: '' } // Anything else, go home
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, 
      {
        urlUpdateStrategy: 'eager',
        canceledNavigationResolution: 'replace',
        paramsInheritanceStrategy: 'always'
      }
    )
  ],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
