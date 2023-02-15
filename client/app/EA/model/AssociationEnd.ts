import {MarkdownToHtmlPipe} from '../mapper/MarkdownToHtml.pipe';
import {EALinkBase} from './EALinkBase';
import {EABaseClass} from './EABaseClass';

import {ExpandablePipe} from '../../views/result/pipes/expandable.pipe';
import {Classification} from './Classification';

export class AssociationEnd extends EALinkBase {
  static pipe = new ExpandablePipe();
  static markPipe = new MarkdownToHtmlPipe();

  private _isVisible: boolean;
  private _lastSearch: string;

  role: [{ parent: {}, name: string }];
  type: [{ parent: {}, aggregation: string, containment: string, multiplicity: string }];
  reference: Classification;
  documentation: [{ value: string }];

  get label() {
    return this.role[0].name;
  }

  get multiplicity() {
    return this.type[0].multiplicity;
  }

  _id;
  get id(): string {
    if (!this._id) {
      this._id = this.cleanId('~' + this.name);
    }
    return this._id;
  }


  _headerClean: string;

  get documentationHeader(): string {
    if (!this._headerClean) {
      const doc = this.getDocumentation();
      const idx = doc.indexOf('\n');
      this._headerClean = idx > 0 ? doc.substr(0, doc.indexOf('\n')) : doc;
    }
    return this._headerClean;
  }

  _docBody: string;

  get documentationBody(): string {
    if (!this._docBody) {
      const doc = this.getDocumentation();
      const idx = doc.indexOf('\n');
      this._docBody = AssociationEnd.markPipe.transform(idx > 0 ? doc.substr(doc.indexOf('\n') + 1) : '');
    }
    return this._docBody;
  }

  _documentation;

  getDocumentation(): string {
    if (!this._documentation && this.documentation) {
      this._documentation = EABaseClass.service.cleanDocumentation(this.documentation.map(e => e.value).join(''));
    }
    return this._documentation || '';
  }


  public isVisible(): boolean {
    const str = EABaseClass.service.searchString;
    if (str && str.length > 0) {
      if (str === this._lastSearch) {
        return this._isVisible;
      }
      const meVisible = super.isVisible();
      const typeVisible = this.match(this.reference.name);
      const labelVisible = this.match(this.label);

      this._lastSearch = str;
      this._isVisible = (meVisible || typeVisible || labelVisible);
      return this._isVisible;
    }
    return true;
  }
}
