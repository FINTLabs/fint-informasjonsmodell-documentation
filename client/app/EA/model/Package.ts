import { EANode } from './EANode';
import { EABaseClass } from './EABaseClass';
import { EANodeContainer } from './EANodeContainer';
import { Stereotype } from './Stereotype';
import { Classification } from './Classification';
import { Comment } from './Comment';
import * as D3 from 'app/d3.bundle';

/**
 *
 */
export class Package extends EANodeContainer {
  static umlId = 'uml:Package';

  private _isVisible: boolean;
  private _lastSearch: string;
  public isVisible(): boolean {
    const str = EABaseClass.service.searchString;
    if (str && str.length > 0) {
      if (str == this._lastSearch) { return this._isVisible; }
      const meVisible = super.isVisible();
      const clsVisible = this.allClasses.some(cls => cls.isVisible());

      this._lastSearch = str;
      this._isVisible = (meVisible || clsVisible);
      return this._isVisible;
    }
    return true;
  }

  // Properties for rendering
  width: number = 0;
  height: number = 0;

  constructor() {
    super();
  }

  calculatedWidth(): number {
    const parent = this.parentPackage;
    const bbox = (<SVGGElement>this.boxElement).getBBox();
    let width = 0;
    this.classes.forEach(c => width += c.calculatedWidth());
    this.packages.forEach(p => width += p.calculatedWidth());
    width += (20 * this.classes.length);
    if (parent.width > 0) {
      if (this.x + width > parent.x + parent.width) {
        width = parent.x + parent.width - this.x;
      }
    }
    return width;
  }

  render() {
    // Add a rect
    const container = D3.select(this.boxElement);
    container.attr('class', 'package').attr('id', this.xmiId)
      .append('rect').attrs({ x: this.x, y: this.y, rx: 10, ry: 10 });

    // Add a header
    container.append('text').text(this.name).attrs({ x: this.x + 10, y: this.y + 15 });

    // Render standalone clases
    container.selectAll('g.element')
      .data((d: Package) => d.classes)
      .enter().append('g').each(function (d: Classification) { d.boxElement = <SVGElement>this; });

    // Render packages
    container.selectAll('g.package')
      .data((d: Package) => d.packages)
      .enter().append('g').each(function (d: Package) { d.boxElement = <SVGElement>this; });

    const bbox = (<SVGGElement>this.boxElement).getBBox();
    this.width = this.calculatedWidth();
    this.height = bbox.height;
  }

  update() {
    if (this.boxElement) {
      const parent = this.parentPackage;
      const container = D3.select(this.boxElement);

      // Update children
      this.classes.forEach(c => c.update());
      this.packages.forEach(p => p.update());

      // Calculate width / height
      this.width = this.calculatedWidth();
      this.height = this.calculatedHeight();
      container.select('rect')
        .attrs({ width: this.width, height: this.height });

      container.select('rect').attrs({ x: this.x, y: this.y });
      container.select('text').attrs({ x: this.x + 10, y: this.y + 15 });
      //.attr('transform', `translate(${this.x}, ${this.y})`);
    }
  }
}
