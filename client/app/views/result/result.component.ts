import { Subscription } from 'rxjs';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { InViewService } from './in-view.service';
import { ModelService } from 'app/EA/model.service';
import { Model } from 'app/EA/model/Model';

@Component({
    selector: 'app-result',
    templateUrl: './result.component.html',
    styleUrls: ['./result.component.scss'],
    standalone: false
})
export class ResultComponent implements OnInit, AfterViewInit, OnDestroy {
  model = null;
  versionChangedSubscription: Subscription;
  routeParamsSubscription: Subscription;
  queryParamsSubscription: Subscription;

  get isLoading() { return this.modelService.isLoading; }
  set isLoading(flag) { this.modelService.isLoading = flag; }

  constructor(
    private modelService: ModelService,
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private InView: InViewService
  ) { }

  visiblePackages() {
    const packages = this.model.filter(pkg => pkg.isVisible());
    return packages;
  }

  ngOnInit() {
    this.titleService.setTitle('Docs | Fint');
    this.isLoading = true;
    this.versionChangedSubscription = this.modelService.versionChanged.subscribe(v => this.loadData());
    this.loadData(); // Initial load
  }

  ngAfterViewInit() {
    // Detect query parameter from search string, and filter
    const me = this;
    this.routeParamsSubscription = this.route.params.subscribe((params: any) => {
      me.modelService.hasModel.then(() => {
        me.goto(params.id, params.attribute == null);
      });
    });
    this.queryParamsSubscription = this.route.queryParams.subscribe((params: any) => {
      me.modelService.hasModel.then(() => {
        me.goto(this.route.snapshot.params['id'], true);
      });
    });
  }

  ngOnDestroy() {
    this.versionChangedSubscription.unsubscribe();
    this.routeParamsSubscription.unsubscribe();
    this.queryParamsSubscription.unsubscribe();
  }

  private loadData() {
    const me = this;
    me.isLoading = true;
    this.modelService.fetchModel().subscribe(model => {
      me.model = me.modelService.getTopPackages();
      me.isLoading = false;
    });
  }

  private goto(id, force?: boolean): boolean {
    let clazz: any;
    if (id) {
      this.modelService.searchString = '';
      clazz = this.modelService.getObjectById(id);
      if (!clazz) { // If class not found, remove reference from url
        this.router.navigate(['/docs'], { queryParams: this.modelService.queryParams });
        document.body.scrollIntoView(); // Goto top and terminate
        return false;
      }
    }

    let attr: any;
    const attribute = this.route.snapshot.params['attribute'];
    if (attribute) {
      attr = clazz.findMember(attribute);
      if (!attr) { // If attribute not found, remove reference from url
        this.router.navigate(['../'], { relativeTo: this.route, queryParams: this.modelService.queryParams });
        return false;
      }

      // Mark attribute as opened
      attr.isOpen = true;
    }

    // If class and attribute tests completes successfully, we scroll class element into view.
    setTimeout(() => {
      const elm = document.querySelector('#' + id);
      if (elm && (force || !this.InView.isElmInView(elm))) {
        elm.scrollIntoView(true);
      }
    });
  }
}
