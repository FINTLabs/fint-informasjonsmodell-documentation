/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
// import { MaterialModule } from '@angular/material';

import { of } from 'rxjs';

// import { LibSharedModule } from 'fint-shared-components';

import { InViewService } from '../../in-view.service';

import { DetailsComponent } from '../../details/details.component';

import { ClassComponent } from './class.component';
import { Classification } from 'app/EA/model/Classification';
import { Package } from 'app/EA/model/Package';

describe('ClassComponent', () => {
  let component: ClassComponent;
  let fixture: ComponentFixture<TestComponentWrapper>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        // MaterialModule,
        // LibSharedModule,
        RouterTestingModule
      ],
      declarations: [ TestComponentWrapper, ClassComponent, DetailsComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        InViewService,
        {
          provide: ActivatedRoute, useValue: {
            params: of({ id: 'test' }),
            queryParams: of({s: ''})
          }
        }
      ]
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
    selector: 'test-cmp',
    template: '<app-class [classification]="class"></app-class>',
    standalone: false
})
class TestComponentWrapper {
  class = {
    name: 'testClass',
    extension: {},
    parent: {
      name: 'testPackage',
      parent: {
        name: 'FINT'
      }
    }
  };
  constructor() {
    Object.setPrototypeOf(this.class.parent.parent, new Package());
    Object.setPrototypeOf(this.class.parent, new Package());
    Object.setPrototypeOf(this.class, new Classification());
  }
}
