import { Component, Input, OnInit, ElementRef, Renderer2 } from '@angular/core';

import { Package } from 'app/EA/model/Package';
import { Stereotype } from 'app/EA/model/Stereotype';

@Component({
    selector: 'app-stereotype',
    templateUrl: './stereotype.component.html',
    styleUrls: ['./stereotype.component.scss'],
    standalone: false
})
export class StereotypeComponent implements OnInit {
  @Input() stereotype: Package;
  constructor(private elm: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
    if (this.stereotype.packagedElement) {
      this.renderer.addClass(this.elm.nativeElement, 'package-container');
    }
  }

  visibleClasses() {
    return this.stereotype.allClasses.filter(c => c.isVisible());
  }
}
