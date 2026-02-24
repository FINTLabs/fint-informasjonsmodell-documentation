import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
// import { MaterialModule } from '@angular/material';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faThumbtack, faCaretRight, faArrowRight, faCaretDown, faTable, faListAlt, faIdCard,
  faBars, faPuzzlePiece, faForward, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';

// import { LibSharedModule } from 'fint-shared-components';
import { AppRoutingModule } from './app-routing.module';
import { ResultModule } from './views/result/result.module';

import { ModelService } from './EA/model.service';

import { AppComponent } from './app.component';
import { ModelComponent } from './views/model/model.component';
import { ModelStateService } from './views/model/model-state.service';
import { MarkdownToHtmlPipe } from './EA/mapper/MarkdownToHtml.pipe';

@NgModule({ 
  declarations: [
        AppComponent,
        ModelComponent,
        MarkdownToHtmlPipe
    ],
    bootstrap: [AppComponent], 
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        FontAwesomeModule,
        MatProgressSpinnerModule,
        AppRoutingModule,
        ResultModule
      ], 
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        ModelService, 
        ModelStateService, 
        provideHttpClient(withInterceptorsFromDi())
      ]
    })


export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faThumbtack, faCaretRight, faArrowRight, faCaretDown, faTable, faListAlt, faIdCard,
      faBars, faPuzzlePiece, faForward, faCheck);
  }
}
