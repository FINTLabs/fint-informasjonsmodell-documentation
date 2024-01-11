import { InViewService } from '../in-view.service';
import { Subscription, fromEvent, throttleTime } from 'rxjs';
import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements AfterViewInit, OnDestroy {
  @Input() stereotypes: any[] = null;
  onScrollSubscription: Subscription;
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
}
