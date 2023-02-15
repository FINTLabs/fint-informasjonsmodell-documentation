import { EANodeContainer } from './EANodeContainer';
import { Classification } from './Classification';
import { Package } from './Package';
import { EABaseClass } from './EABaseClass';
import * as D3 from 'app/d3.bundle';

/**
 * Represents a top package
 *
 * @export
 * @class Stereotype
 * @extends {Package}
 */
export class Stereotype extends Package {
  static umlId = 'uml:Package';

  width: number = 0;
  height: number = 0;

  // @ts-ignore
  protected _isVisible: boolean;
  declare protected _lastSearch: string;
  public isVisible(): boolean {
    const str = EABaseClass.service.searchString;
    if (str && str.length > 0) {
      if (str == this._lastSearch) { return this._isVisible; }
      const meVisible = super.isVisible();
      const pkgVisible = this.packages.some(pkg => pkg.isVisible());
      const clsVisible = this.allClasses.some(cls => cls.isVisible());

      this._lastSearch = str;
      this._isVisible = (meVisible || pkgVisible || clsVisible);
      return this._isVisible;
    }
    return true;
  }

  /**
   * Creates an instance of Stereotype.
   *
   * @param {{}} json
   * @param {EABaseClass} parent
   *
   * @memberOf Stereotype
   */
  constructor() {
    super();
  }

}
