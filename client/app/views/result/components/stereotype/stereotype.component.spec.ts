/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// import { Http } from '@angular/http';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
// import { MaterialModule } from '@angular/material';

import { Observable } from 'rxjs';

// import { LibSharedModule, FintDialogService } from 'fint-shared-components';

import { StereotypeComponent } from './stereotype.component';
import { Package } from 'app/EA/model/Package';
import { Classification } from 'app/EA/model/Classification';
import { ModelService } from 'app/EA/model.service';
import { JSON_XMI21_Mapper } from 'app/EA/mapper/JSON_XMI21_Mapper';

describe('StereotypeComponent', () => {
  let component: StereotypeComponent;
  let fixture: ComponentFixture<TestComponentWrapper>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        // MaterialModule
        // LibSharedModule,
        RouterTestingModule,
      ],
      declarations: [ TestComponentWrapper, StereotypeComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponentWrapper);
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


@Component({
 selector  : 'test-cmp',
 template  : '<app-stereotype [stereotype]="stereotype"></app-stereotype>'
})
class TestComponentWrapper {
  stereotype = {
    name: 'testPackage',
    packagedElement: [
      { name: 'testClass' }
    ],
    _allClassCache: [ // Bypass the ModelService `allOfXmiType` call
      { isVisible: () => true }
    ]
  };
  constructor() {
    Object.setPrototypeOf(this.stereotype.packagedElement[0], new Classification());
    Object.setPrototypeOf(this.stereotype, new Package());
  }
}
