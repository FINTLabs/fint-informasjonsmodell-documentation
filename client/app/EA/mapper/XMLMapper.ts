import { Model } from '../model/Model';
import { IMapper } from './IMapper';

export class XMLMapper implements IMapper {
  xml: XMLDocument;
  modelRoot: Model;
  flatModel: { [key: string]: any } = {};

  constructor(modelData: any) {
    this.xml = new DOMParser().parseFromString(modelData, 'application/xml');
  }

  parse(): Model {
    // @ts-ignore
    const context = this.xml.ownerDocument == null ? this.xml.documentElement : this.xml.ownerDocument.documentElement;
    const nsResolver = this.xml.createNSResolver(context);
    const xpathResult = document.evaluate('//uml:Model', this.xml, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    let index = -1;
    while (++index < xpathResult.snapshotLength) {
    }
    return null;
  }

  allOfXmiType(type: string, from?: any): any {
    return null;
  }
}
