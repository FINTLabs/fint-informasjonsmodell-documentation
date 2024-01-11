import {MarkdownToHtmlPipe} from '../mapper/MarkdownToHtml.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { EABaseClass } from './EABaseClass';
import { ExpandablePipe } from '../../views/result/pipes/expandable.pipe';
import { Classification } from 'app/EA/model/Classification';

export class Attribute extends EABaseClass {
  static pipe = new ExpandablePipe();
  static markPipe = new MarkdownToHtmlPipe()

  static umlId = 'uml:Property';
  declare parent: any;
  classRef: string;
  extension: any;
  type: any;
  upperValue: any;
  lowerValue: any;

  _id;
  get id(): string {
    if (!this._id) {
      this._id = this.cleanId('~' + this.name);
    }
    return this._id;
  }

  private _isVisible: boolean;
  private _lastSearch: string;

  private _isOpen = false;
  get isOpen() { return this._isOpen; }
  set isOpen(flag) {
    if (flag) { this.parent.members.forEach(m => m.isOpen = false); } // Close others
    this._isOpen = flag;
  }

  _deprecated;
  get deprecated(): boolean {
    let deprecated = false;
    if (this.extension.tags[0] && this.extension.tags[0].tag.length > 0) {
      this.extension.tags[0].tag.forEach(t => {
        if (t.name === 'DEPRECATED') {
          deprecated = true;
        }
      });
    }
    return deprecated;
  }

  _deprecatedDescription;
  get deprecatedDescription(): string {
    let deprecatedDescription = '';
    if (this.extension.tags[0] && this.extension.tags[0].tag.length > 0) {
      this.extension.tags[0].tag.forEach(t => {
        if (t.name === 'DEPRECATED') {
          deprecatedDescription = `UTGÅR: ${t.value}`;
        }
      });
    }
    return deprecatedDescription;
  }

  _documentation: string;
  get documentation(): string {
    if (!this._documentation) {
      if (this.extension && this.extension.documentation) {
        this._documentation = EABaseClass.service.cleanDocumentation(this.extension.documentation.map(e => e.value).join(''));
      } else {
        this._documentation = '';
      }
    }
    return this._documentation;
  }

  _headerClean: string;
  get documentationHeader(): string {
    if (!this._headerClean) {
      const doc = this.documentation;
      const idx = doc.indexOf('\n');
      this._headerClean = this.deprecated ? this.deprecatedDescription : idx > 0 ? doc.substr(0, doc.indexOf('\n')) : doc;
    }
    return this._headerClean;
  }

  _docBody: string;
  get documentationBody(): string {
    if (!this._docBody) {
      const doc = this.documentation;
      const idx = doc.indexOf('\n');
      this._docBody = Attribute.markPipe.transform(idx > 0 ? doc.substr(doc.indexOf('\n') + 1) : '');
      this._docBody += this.deprecated ? this.deprecatedDescription : '';
    }
    return this._docBody;
  }

  _isPrimitive: boolean;
  get isPrimitive() {
    if (!this._isPrimitive) {
      if (this.typeRef) {
        if (this.typeRef.xmiType === 'uml:PrimitiveType') { this._isPrimitive = true; }
        else if (this.typeRef.type === 'XSDsimpleType') { this._isPrimitive = true; }
        else { this._isPrimitive = false; }
      } else {
        this._isPrimitive = true;
      }
    }
    return this._isPrimitive;
  }

  _writable: boolean;
  get writable() {
    if (!this._writable) {
      this._writable = this.extension.stereotype && this.extension.stereotype[0].stereotype === 'writable';
    }
    return this._writable;
  }

  _typeRef;
  get typeRef() {
    if (!this._typeRef) {
      if (this.type && this.type.length) {
        if (this.type.length > 1) { throw new Error('Maximum number of types exceeded on attribute'); }
        this._typeRef = this.type[0].reference;
      }
    }
    return this._typeRef;
  }

  _typeName: string;
  get typeName() {
    if (!this._typeName) {
      if (this.typeRef) { this._typeName = this.typeRef.name; }
      else if (this.extension && this.extension.properties && this.extension.properties.length) {
        this._typeName = this.extension.properties[0].type;
      }
    }
    return this._typeName;
  }

  _multiplicity;
  get multiplicity() {
    if (!this._multiplicity) {
      if (this.extension && this.extension.bounds) {
        const bounds = this.extension.bounds[0];
        if (bounds.lower === bounds.upper) {
          this._multiplicity = bounds.lower;
        } else {
          this._multiplicity = this.extension.bounds.map(b => `${b.lower}..${b.upper}`);
        }
      } else if (this.lowerValue && this.upperValue) {
        this._multiplicity = `${this.lowerValue[0].value}..${this.upperValue[0].value}`
      } else {
        this._multiplicity = '';
      }
    }
    return this._multiplicity;
  }

  constructor(private sanitizer: DomSanitizer) {
    super();
  }

  public isVisible(): boolean {
    const str = EABaseClass.service.searchString;
    if (str && str.length > 0) {
      if (str === this._lastSearch) { return this._isVisible; }
      const meVisible = super.isVisible();
      const typeVisible = this.match(this.typeName);

      this._lastSearch = str;
      this._isVisible = (meVisible || typeVisible);
      return this._isVisible;
    }
    return true;
  }
}
