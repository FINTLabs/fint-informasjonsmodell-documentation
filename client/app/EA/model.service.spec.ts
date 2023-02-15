/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
// import { HttpModule } from '@angular/http';
// import { MaterialModule } from '@angular/material';

// import { LibSharedModule } from 'fint-shared-components';

import { ModelService } from './model.service';
import { IModelContainer, Model } from 'app/EA/model/Model';

describe('Service: ModelService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        // HttpModule,
        // MaterialModule,
        // LibSharedModule
      ],
      providers: [ModelService]
    });

  });

  it('should create the service', inject([ModelService], (service: ModelService) => {
    expect(service).toBeTruthy();
  }));
});
