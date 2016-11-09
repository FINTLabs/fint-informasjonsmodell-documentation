import { Stereotype } from './Stereotype';
import { Collaboration } from './Collaboration';
import { EABaseClass } from './EABaseClass';

/**
 *
 */
export class Package extends EABaseClass {
  collaboration: Collaboration;
  package: Package;
  stereotypes: Stereotype[];

  constructor(json: {}) {
    super(json);
    if (json['Namespace.ownedElement'] && json['Namespace.ownedElement'].Collaboration) {
      this.collaboration = new Collaboration(json['Namespace.ownedElement'].Collaboration);
    }
    if (json['Namespace.ownedElement'] && json['Namespace.ownedElement'].Package) {
      if (Array.isArray(json['Namespace.ownedElement'].Package)) {
        this.stereotypes = json['Namespace.ownedElement'].Package.map(cls => new Stereotype(cls));
      } else {
        this.package = new Package(json['Namespace.ownedElement'].Package);
      }
    }
  }

  findById(xmlId: string): EABaseClass {
    if (this.id === xmlId) { return this; }

    let match = this.filterChildren(this.stereotypes, xmlId);
    if (match) { return match; }

    if (this.collaboration) {
      let col = this.collaboration.findById(xmlId);
      if (col) { return col; }
    }

    if (this.package) {
      return this.package.findById(xmlId);
    }
    return null;
  }
}
