import {EALinkBase} from './EALinkBase';
import {Classification} from './Classification';

export class Association extends EALinkBase {
  static umlId = 'uml:Association';
  declare parent: any;
  extension: any;

  isOpen = false;

  _lastClass: Classification;

  constructor() {
    super();
  }


  getAssociationEnd(clas: Classification) {
    let start = this.start !== this.end, end = this.start !== this.end;
    if (this.start === this.end) {
      if (!this._lastClass) {
        start = true;
        this._lastClass = clas;
      } else {
        end = true;
        this._lastClass = null;
      }
    }
    if (start && this.start === clas.xmiId) {
      return this.extension.target[0];
    }
    if (end && this.end === clas.xmiId) {
      return this.extension.source[0];
    }
  }
}
