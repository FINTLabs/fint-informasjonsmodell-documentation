import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Component } from '@angular/core';

import { Model } from './EA/model/Model';
import { ModelService } from './EA/model.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  repos: any[];
  get selectedRepo(): string { return this.modelService.version; }
  set selectedRepo(value: string) {
    this.modelService.version = value;
    if (this.route.snapshot.queryParams['v'] != value) {
      const urlTree = this.router.parseUrl(this.router.url);
      urlTree.queryParams = {};
      this.router.navigate([urlTree.toString()], { queryParams: this.modelService.queryParams });
    }
  }

  get isLoading() { return this.modelService.isLoading; }
  set isLoading(flag) { this.modelService.isLoading = flag; }

  get model(): Model { return this.modelService.model; }
  get queryParams() { return this.modelService.queryParams; }

  get searchValue(): string { return this.modelService.searchString; }
  set searchValue(value: string) {
    this.modelService.searchString = value;
    this.router.navigate(['/docs'], { queryParams: this.modelService.queryParams });
  }

  constructor(private modelService: ModelService, private router: Router, private route: ActivatedRoute, private titleService: Title) {
    this.titleService.setTitle('FINT');
    this.modelService.versionChanged.subscribe(v => this.selectedRepo = v);
    this.route.queryParams.subscribe((params: any) => {
      if (params.s) { this.searchValue = params.s; }
      if (params.v) { this.modelService.version = params.v; }
    });
    this.modelService.fetchVersions().subscribe(r => this.repos = r);
  }
}
