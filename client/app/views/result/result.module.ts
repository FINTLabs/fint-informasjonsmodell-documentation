import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

// import { LibSharedModule } from 'fint-shared-components';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';

import { InViewService } from './in-view.service';

import { DetailsComponent } from './details/details.component';
// import { MarkdownToHtmlModule } from 'markdown-to-html-pipe';
import { HighlightPipe } from './pipes/highlight.pipe';
import { ExpandablePipe } from './pipes/expandable.pipe';

import { ResultRoutes } from './result.routes';
import { ResultComponent } from './result.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { StereotypeComponent } from './components/stereotype/stereotype.component';
import { ClassComponent } from './components/class/class.component';
import { ClassSort } from './pipes/class-sort.pipe';
import { ClassAbstract } from './pipes/class-abstract-sort.pipe';
import { ClassMain } from './pipes/class-main-sort.pipe';
import { ComplexDatatype } from './pipes/class-complesdatatype-sort.pipe';


@NgModule({
  imports: [
    CommonModule,
    // MaterialModule,
    // LibSharedModule,
    FontAwesomeModule,
    RouterModule,
    // MarkdownToHtmlModule,
    MatCardModule,
    MatChipsModule
  ],
  declarations: [
    ResultComponent,
    SidebarComponent,

    StereotypeComponent,
    ClassComponent,

    HighlightPipe,
    ExpandablePipe,
    DetailsComponent,
    ClassSort,
    ClassAbstract,
    ClassMain,
    ComplexDatatype
  ],
  providers: [InViewService]
})
export class ResultModule { }
