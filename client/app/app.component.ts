import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Component } from '@angular/core';

import { Model } from './EA/model/Model';
import { ModelService } from './EA/model.service';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  repos: {[name: string]: string[]} = {
    releases: [],
    branches: []
  };
  get repoKeys() { return Object.keys(this.repos); }
  get selectedRepo(): string { return this.modelService.version; }
  set selectedRepo(value: string) {
    this.modelService.version = value;
    if (this.route.snapshot.queryParams['v'] !== value) {
      const urlTree = this.router.parseUrl(this.router.url);
      urlTree.queryParams = {};
      this.router.navigate([urlTree.toString()], { queryParams: this.modelService.queryParams });
    }
  }

  get isLoading() { return this.modelService.isLoading; }
  // set isLoading(flag) {
  //   if (flag != null && flag !== this.modelService.isLoading) {
  //     this.modelService.isLoading = flag;
  //     this.cdr.detectChanges();
  //   }
  // }

  get model(): Model { return this.modelService.model; }
  get queryParams() { return this.modelService.queryParams; }

  get searchValue(): string { return this.modelService.searchString; }
  set searchValue(value: string) {
    this.modelService.searchString = value;
    this.router.navigate(['/docs'], { queryParams: this.modelService.queryParams });
  }

  get isRoot() {
    return this.router.url === ('/') || this.router.url.substr(0, 2) === ('/?');
  }

  constructor(
    private modelService: ModelService,
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title
  ) {
    this.titleService.setTitle('FINT');
    this.modelService.versionChanged.subscribe(v => this.selectedRepo = v);
    this.route.queryParams.subscribe((params: any) => {
      if (params.s) { this.searchValue = params.s; }
      if (params.v) { this.modelService.version = params.v; }
    });
    this.modelService.fetchVersions().subscribe(r => this.repos.releases =  r);
    this.modelService.fetchBranches().subscribe(r => {
      if (r.length) {
        this.repos.branches = r;
      } else {
        delete this.repos.branches;
      }
    });
  }
}
