import { InViewService } from '../in-view.service';
import { Subscription, fromEvent, throttleTime } from 'rxjs';
import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    standalone: false
})
export class SidebarComponent implements AfterViewInit, OnDestroy {
  @Input() stereotypes: any[] = null;
  onScrollSubscription: Subscription;
  collapsedStereotypes: { [key: string]: boolean } = {};

  constructor(private InView: InViewService) { }


  ngAfterViewInit() {
    this.onScrollSubscription = fromEvent(window, 'scroll')
      .pipe(throttleTime(200))
      .subscribe(e => this.checkElementInView());
  }

  ngOnDestroy() {
    if (this.onScrollSubscription) { this.onScrollSubscription.unsubscribe(); }
  }

  checkElementInView() {
    const me = this;
    this.stereotypes.forEach(type => {
      type.isActive = me.InView.isElmInView(document.getElementById(type.id));
      type.allClasses.forEach(cls => cls.isActive = me.InView.isElmInView(document.getElementById(cls.id)));
    });
  }

  toggleStereotype(stereotypeId: string) {
    this.collapsedStereotypes[stereotypeId] = !this.collapsedStereotypes[stereotypeId];
  }

  isStereotypeCollapsed(stereotypeId: string): boolean {
    return this.collapsedStereotypes[stereotypeId] || false;
  }

  hasAbstractClasses(stereotype: any): boolean {
    if (!stereotype.allClasses) return false;
    return stereotype.allClasses.some(clazz => clazz.isAbstract === 'true');
  }

  hasMainClasses(stereotype: any): boolean {
    if (!stereotype.allClasses) return false;
    return stereotype.allClasses.some(clazz => 
      clazz.extension && 
      clazz.extension.properties && 
      clazz.extension.properties[0] && 
      clazz.extension.properties[0].stereotype === 'hovedklasse'
    );
  }

  hasComplexDatatypeClasses(stereotype: any): boolean {
    if (!stereotype.allClasses) return false;
    return stereotype.allClasses.some(clazz => 
      clazz.extension && 
      clazz.extension.properties && 
      clazz.extension.properties[0] && 
      clazz.extension.properties[0].stereotype === undefined
    );
  }
}
