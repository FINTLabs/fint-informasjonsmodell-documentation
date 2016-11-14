import { Association } from '../../EA/model/Association';
import { Classification } from '../../EA/model/Classification';
import { Stereotype } from '../../EA/model/Stereotype';
import { Model } from '../../EA/model/Model';
import { Title } from '@angular/platform-browser';
import { ModelService } from '../../EA/model.service';
import { Router } from '@angular/router';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as D3 from '../../d3.bundle';

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrls: ['./model.component.scss']
})
export class ModelComponent implements OnInit, AfterViewInit {
  @ViewChild('container') element: ElementRef;

  private model: Model;
  private host;
  private svg;
  private width;
  private height;
  private htmlElement: HTMLElement;

  constructor(private modelService: ModelService, private router: Router, private titleService: Title) { }

  ngOnInit() {
    this.titleService.setTitle('FINT | information model');
  }

  ngAfterViewInit() {
    let me = this;
    this.htmlElement = this.element.nativeElement;
    this.host = D3.select(this.htmlElement);

    // Load data and render
    this.modelService.fetchModel().then(function (model: Model) {
      me.model = model;
      me.setup();
      me.render();
    });
  }

  onResize($event) {
    this.update();
  }

  private setup(): void {
    this.width = this.htmlElement.clientWidth;
    this.height = (this.model.package.stereotypes.length * 100);

    this.host.html('');
    this.svg = this.host.append('svg')
      .attr('class', 'diagram')
      .append('g')
      .attr('class', 'model')
      .attr('transform', 'translate(0,0)');
  }

  getAllAssociations() {
    let associations: Association[] = [];
    this.model.package.stereotypes.forEach(type => {
      type.allClasses.forEach(cls => {
        if (cls.associations && cls.associations.length) {
          associations = associations.concat(cls.associations);
        }
      });
    });
    return associations;
  }

  private render() {
    let me = this;
    let associations: Association[] = [];

    // Render associations (in a top layer, so as not to disturb the stereotype groups bounding box,
    // since associations can go accross stereotypes)
    this.svg
      .append('g')
      .attr('class', 'associations')
      .selectAll('g.association')
      .data(this.getAllAssociations())
      .enter()
      .append('g')
      .attr('class', 'association')
      .each(function (d: Association) { d.boxElement = this; })

    // Render stereotypes
    let allStereotypes = this.svg
      .append('g')
      .attr('class', 'stereotypes')
      .selectAll('g.stereotype')
      .data(this.model.package.stereotypes)
      .enter();
    let stereotypeGroup = allStereotypes.append('g')
      .each(function (d: Stereotype) {
        d.boxElement = this;  // Let the stereotype render the element
        D3.select(d.boxElement.querySelector('rect')).on('click', () => me.router.navigate(['/api'], { fragment: d.xmlId }));
      })
      .append('g');

    // Render classes (inside the stereotype group)
    stereotypeGroup.selectAll('g.class')
      .data((d: Stereotype) => d.allClasses)
      .enter()
      .append('g')
      .each(function (d: Classification) {
        d.boxElement = this;  // Let the Class render the element
        if (d.associations && d.associations.length) {
          associations = associations.concat(d.associations);
        }
      })
      .on('click', (d: Classification) => me.router.navigate(['/api'], { fragment: d.xmlId }));

    setTimeout(() => this.update());
  }

  update() {
    // Update every part of the model
    this.model.package.stereotypes.forEach(type => {
      let associations: Association[] = [];
      type.allClasses.forEach(cls => {
        cls.update();
        if (cls.associations && cls.associations.length) {
          associations = associations.concat(cls.associations);
        }
      });
      type.update();
      setTimeout(() => associations.forEach(ass => ass.update()));
    });
  }
}