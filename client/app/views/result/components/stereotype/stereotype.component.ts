import { Component, Input, OnInit, ElementRef, Renderer } from '@angular/core';

import { Package } from 'app/EA/model/Package';
import { Stereotype } from 'app/EA/model/Stereotype';

@Component({
  selector: 'app-stereotype',
  templateUrl: './stereotype.component.html',
  styleUrls: ['./stereotype.component.scss']
})
export class StereotypeComponent implements OnInit {
  @Input() stereotype: Package;
  constructor(private elm: ElementRef, private renderer: Renderer) { }

  ngOnInit() {
    if (this.stereotype.packagedElement) {
      this.renderer.setElementClass(this.elm.nativeElement, 'package-container', true);
    }
  }

  visibleClasses() {
    return this.stereotype.allClasses.filter(c => c.isVisible());
  }
}
