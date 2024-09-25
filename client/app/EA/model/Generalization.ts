import { EABaseClass } from './EABaseClass';
import { EALinkBase } from './EALinkBase';
import { Classification } from './Classification';
import * as D3 from 'app/d3.bundle';

export class Generalization extends EALinkBase {
  static umlId = 'uml:Generalization';

  general: string;
  private _generalRef;
  get generalRef(): any {
    if (!this._generalRef) {
      this._generalRef = EABaseClass.service.mapper.flatModel[this.general];
    }
    return this._generalRef;
  }

  constructor() {
    super();
  }
}
