import {Component, ElementRef, Input, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {Classification} from 'app/EA/model/Classification';
import {AssociationEnd} from 'app/EA/model/AssociationEnd';

interface AssociationMapper {
  parent: Classification;
  end: AssociationEnd;
}

@Component({
  selector: 'app-class',
  templateUrl: './class.component.html',
  styleUrls: ['./class.component.scss']
})
export class ClassComponent implements OnInit, OnDestroy {
  @Input() classification: Classification;
  searchSubscription: Subscription;
  routeParamSubscription: Subscription;
  isSelected = false;
  searchStr: string;

  _classType;
  get classType() {
    if (!this._classType) {
      switch (this.classification.type.toLowerCase()) {
        case 'mainclass':
          this._classType = 'table';
          break;
        case 'hovedklasse':
          this._classType = 'table';
          break;
        case 'class':
          this._classType = 'table';
          break;
        case 'codelist':
          this._classType = 'list-alt';
          break;
        case 'datatype':
          this._classType = 'id-card-o';
          break;
        case 'enumeration':
          this._classType = 'bars';
          break;
        case 'abstract':
          this._classType = 'puzzle-piece';
          break;
        case 'referanse':
          this._classType = 'forward';
          break;
        default:
          this._classType = '';
      }
    }
    return this._classType;
  }

  _cssClass;
  get cssClass() {
    if (!this._cssClass) {
      const cls = [];
      if (this.classification.deprecated) {
        cls.push('deprecated');
      }
      cls.push(this.classification.type.toLowerCase())
      if (this.isSelected) {
        cls.push('selected');
      }
      this._cssClass = cls.join(' ');
    }
    return this._cssClass;
  }

  _assoc;

  get associations() {
    if (!this._assoc) {
      this._assoc = this.classification.associations.map(r => {
        return <AssociationMapper>{parent: this.classification, end: r.getAssociationEnd(this.classification)};
      }).filter((a: AssociationMapper) => a.end.label != null);

      let c = this.classification;
      while (c.superType) {
        if (!this._assoc) {
          this._assoc = [];
        }
        this._assoc = this._assoc
          .concat(c.superType.associations
            .map(r => {
              return <AssociationMapper>{parent: c.superType, end: r.getAssociationEnd(c.superType)};
            })
            .filter((a: AssociationMapper) => a.end.label != null)
          );
        // .filter((a: AssociationMapper) => a.end == undefined);
        c = c.superType;
      }
    }
    return this._assoc;
  }

  _attribs;

  get attributes() {
    if (!this._attribs) {
      this._attribs = (this.classification.ownedAttribute || []).filter(a => a && !a.hasOwnProperty('association'));
      let c = this.classification;
      while (c.superType) {
        if (!this._attribs) {
          this._attribs = [];
        }
        this._attribs = this._attribs.concat(c.superType.ownedAttribute).filter(a => a && a.association === undefined);
        c = c.superType;
      }
    }
    return this._attribs;
  }

  constructor(private elm: ElementRef, private renderer: Renderer2, private route: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    this.routeParamSubscription = this.route.params.subscribe((params: any) => this.isSelected = params.id === this.classification.id);
    this.searchSubscription = this.route.queryParams.subscribe((params: any) => {
      this.searchStr = params.s;
    });
  }

  ngOnDestroy() {
    // if (this.searchSubscription) { this.searchSubscription.unsubscribe(); }
    if (this.routeParamSubscription) {
      this.routeParamSubscription.unsubscribe();
    }
  }

  openAttribute(attr) {
    this.classification.associations.forEach(a => a.isOpen = false);
    attr.isOpen = !attr.isOpen;
    if (attr.isOpen) {
      setTimeout(() => this.router.navigate(['/docs', this.classification.id, attr.id], {queryParams: this.classification.queryParams}));
    } else {
      setTimeout(() => this.router.navigate(['/docs', this.classification.id], {queryParams: this.classification.queryParams}));
    }
  }

  openAssociation(assoc) {
    const flag = !assoc.isOpen;
    this.classification.associations.forEach(a => a.isOpen = false);
    assoc.isOpen = flag;
  }

  associationDeprecated(assoc) {
    let deprecated = false;
    if (assoc.end.parent.tags[0] && assoc.end.parent.tags[0].tag.length > 0) {
      assoc.end.parent.tags[0].tag.forEach(t => {
        if (t.name === 'DEPRECATED') {
          deprecated = true;
        }
      });
    }
    return deprecated;
  }

  associationDeprecatedDescription(assoc) {
    let deprecatedDescription = '';
    if (assoc.end.parent.tags[0] && assoc.end.parent.tags[0].tag.length > 0) {
      assoc.end.parent.tags[0].tag.forEach(t => {
        if (t.name === 'DEPRECATED') {
          deprecatedDescription = `UTGÅR: ${t.value}`;
        }
      });
    }
    return deprecatedDescription;
  }
}
