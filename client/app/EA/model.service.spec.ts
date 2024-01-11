/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { ModelService } from './model.service';

describe('Service: ModelService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
      ],
      providers: [ModelService]
    });

  });

  it('should create the service', inject([ModelService], (service: ModelService) => {
    expect(service).toBeTruthy();
  }));
});
