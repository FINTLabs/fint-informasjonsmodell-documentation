import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DomSanitizer, SafeStyle, Title} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import * as D3 from 'app/d3.bundle';
import {forceRectCollide} from './util/ForceRectCollide';
import {forceBoundedBox} from './util/BoundedBox';
import {ModelService} from 'app/EA/model.service';
import {IModelContainer} from 'app/EA/model/Model';
import {EALinkBase} from 'app/EA/model/EALinkBase';
import {EANode} from 'app/EA/model/EANode';
// import { Stereotype } from 'app/EA/model/Stereotype';
import {Classification} from 'app/EA/model/Classification';
import {Generalization} from 'app/EA/model/Generalization';
import {Association} from 'app/EA/model/Association';
import {Package} from 'app/EA/model/Package';
import {EANodeContainer} from 'app/EA/model/EANodeContainer';
import {ModelStateService} from 'app/views/model/model-state.service';
import {Stereotype} from 'app/EA/model/Stereotype';

// import forceGravityGroup from './util/ForceGravityGroup';

export interface ILegendItem {
  xmiId: string;
  name: string;
  pkg: EANodeContainer;
  fill: SafeStyle;
  active: boolean;
  colors: string[];
  parent: string;
}

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrls: ['./model.component.scss']
})
export class ModelComponent implements OnInit, AfterViewInit, OnDestroy {

  // Elements
  @ViewChild('container') element: ElementRef;
  private htmlElement: HTMLElement;
  private host;
  private svg;


  // Our datasource
  private model: IModelContainer;

  // Properties we need to destroy when we exit this view
  private versionSubscription: Subscription;
  private simulation: D3.Simulation<EANode, EALinkBase>;

  // Data arrays for D3 rendering
  private links;
  private hull;
  private nodes;
  private nodeElements;

  // Properties used by hull
  private hullOffset = 10;
  private hullCurve = D3.line().curve(D3.curveCatmullRomClosed);

  // Properties used in D3 drag event
  private maxVelocity = 8;
  private offsetX;
  private offsetY;

  get isSticky() {
    return this.state.isSticky;
  }

  set isSticky(value) {
    this.state.isSticky = value;
    if (this.nodes && this.simulation && value === false) {
      this.nodeElements.forEach(d => {
        d.fx = null;
        d.fy = null;
      });
      this.simulation.alpha(0.5).restart();
    }
  }

  private get width() {
    return this.htmlElement.clientWidth - 200;
  }

  private get height() {
    return this.htmlElement.clientHeight;
  }

  get isLoading() {
    return this.modelService.isLoading;
  }

  set isLoading(flag) {
    this.modelService.isLoading = flag;
  }

  constructor(
    private modelService: ModelService,
    private router: Router,
    private titleService: Title,
    private sanitizer: DomSanitizer,
    private state: ModelStateService
  ) {
  }

  ngOnInit() {
    this.titleService.setTitle('Model | Fint');
  }

  ngAfterViewInit() {
    this.htmlElement = this.element.nativeElement;
    this.host = D3.select(this.htmlElement);

    // Load data and render
    this.modelService.searchString = '';
    this.versionSubscription = this.modelService.versionChanged.subscribe(v => this.loadData());
    this.loadData(); // Initial load
  }

  ngOnDestroy() {
    if (this.versionSubscription) {
      this.versionSubscription.unsubscribe();
    }
    if (this.simulation) {
      this.simulation.stop();
    }
  }

  loadData() {
    const me = this;
    this.isLoading = true;
    if (this.simulation) {
      this.simulation.stop();
    }
    this.modelService.fetchModel().subscribe(model => {
      // Reset
      me.resetLegend();
      // me.colorsFlat = [];
      // me.legend = [];
      me.links = null;
      me.hull = null;
      me.nodes = null;

      me.model = model;
      me.render();
      me.isLoading = false;
    });
  }

  // ###########################################
  // RENDERING FUNCTIONS
  // ###########################################
  /**
   * This renderes the svg canvas and definitions, and defines the simulation
   * forces to be used.
   *
   * The actual rendering of elements is delegated to other methods:
   * - renderHulls
   * - renderLinks
   * - renderClasses
   *
   * This method is called each time the application receives new data (i.e. each time
   * the `loadData` method is called).
   */
  private render() {
    const me = this;

    // Create container element
    this.host.html('');
    this.svg = this.host.append('svg')
      .attr('class', 'diagram model')
      .attr('transform', 'translate(0,0)');

    // Define Arrow markers
    const defs = this.svg.append('defs');
    defs
      .selectAll('marker')
      .data(['neutral', 'source', 'target'])
      .enter()
      .append('marker')
      .attr('id', m => 'arrow_' + m)
      .attr('class', m => m)
      .attr('refX', 6)
      .attr('refY', 6)
      .attr('markerWidth', 30)
      .attr('markerHeight', 30)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 12 6 0 12 3 6')
      .attr('class', 'arrowHead');

    // Define reusable drop shadow filter
    const filter = defs.append('filter')
      .attr('id', 'dropshadow');
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 2)
      .attr('result', 'offOut');
    filter.append('feOffset')
      .attr('in', 'offOut')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('result', 'blurOut');
    filter.append('feBlend')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blurOut')
      .attr('mode', 'normal');

    // Extract data to present
    const allLinks = this.modelService.getLinkNodes();
    this.nodeElements = this.modelService.getNodes(this.model.modelBase);
    const packageLinks = this.nodeElements
      .map(c => {
        return {source: c, target: c.parentPackage};
      })
      .filter(c => typeof c.target !== 'undefined');

    // Render data containers
    this.svg.append('g').attr('class', 'hulls');
    this.svg.append('g').attr('class', 'links');
    this.svg.append('g').attr('class', 'nodes');

    // Render data
    this.hull = this.renderHulls(this.nodeElements);
    this.links = this.renderLinks(allLinks);
    this.nodes = this.renderClasses(this.nodeElements);

    // Setup force directed simulation
    this.simulation = D3.forceSimulation<EANode>(this.nodeElements)
    // Apply link force
      .force('link', D3.forceLink(allLinks).id((l: any) => l.xmiId).strength(0.3)
        .distance((l: EALinkBase) => { // larger distance for bigger groups:
          const n1: EANode = l.source, n2: EANode = l.target;
          return n1.parentPackage === n2.parentPackage ? 10 : 50;
        }))

      // Group nodes/packages in same parent package together.
      // This is done by creating an invisible link between the node and the parent package
      .force('group', D3.forceLink(packageLinks).strength(1).distance((l) => {
        if (l.source instanceof Classification && l.target instanceof Package) {
          return 0;
        }
        if (l.source instanceof Package && l.target instanceof Package) {
          return 30;
        }
        return 100;
      }))

      // Apply collision detection, avoiding node overlap
      .force('collision', forceRectCollide<EANode>()
        .size(d => [d.width + 10, d.height + 10]).iterations(2))

      // Apply node repellant, keeping each node at a distance
      .force('charge', D3.forceManyBody<EANode>()
        .strength((c: EANode) => -600))

      // Apply center of gravity
      .force('center', D3.forceCenter(this.width / 2, this.height / 2))

      // Apply boundaries, avoid nodes being rendered off-canvas
      .force('box', forceBoundedBox<EANode>()
        .size(d => [d.width, d.height])
        .bounds({x0: 0, y0: this.hullOffset * 3, x1: d => this.width, y1: d => this.height - (this.hullOffset * 3)}))

      // Lastly, apply custom force logic for each tick.
      .on('tick', () => this.update());
  }

  /**
   * Groups nodes in packages using D3 convexHulls
   *
   * @param nodes A collection of `EANode` nodes to group
   */
  private renderHulls(nodes: EANode[]) {
    const hull = this.svg.select('g.hulls').selectAll('g.hull').data(this.createHullData(nodes), d => d.group);

    const hullGroup = hull.enter().append('g').attr('class', 'hull');
    hullGroup.append('path')
      .attr('class', d => `hull ${this.modelService.cleanId(d.group)} ${d.classPath}`)
      .attr('d', d => this.hullCurve(d.path))
      .style('fill', d => this.getColorFromPackageId(d.group))
      .on('mouseover', d => {
        this.addClass(document.querySelector(`.legend .colors .box.${d.group}`), 'spotlight');
      })
      .on('mouseleave', d => {
        [].forEach.call(document.querySelectorAll('.legend .colors .box'), elm => this.removeClass(elm, 'spotlight'));
      })
      .call(this.hullDragBehaviour());

    hullGroup.append('title').text(d => d.name);

    // On data removal, remove hull path;
    hull.exit().remove();

    return hull;
  }

  /**
   * Renders every link. A link is either a generalization or an assosiation.
   *
   * @param allLinks A collection of `EALinkBase` linknodes to render
   */
  private renderLinks(allLinks: EALinkBase[]) {
    const links = this.svg.select('g.links').selectAll('line').data(allLinks, d => d.xmiId);

    // On new data, add link line
    const linkEnter = links.enter().append('line')
      .attr('class', (l: EALinkBase) => {
        if (l instanceof Generalization) {
          return `generalization source_${l.source.xmiId} target_${l.target.xmiId}`;
        }
        if (l instanceof Association) {
          return `association source_${l.source.xmiId} target_${l.target.xmiId}`;
        }
      })
      .attr('marker-end', d => {
        if (d instanceof Generalization) {
          return 'url(#arrow_neutral)';
        }
      });

    // On data removal, remove link line
    links.exit().remove();
    return links;
  }

  /**
   * Renders every class
   *
   * @param classes A Collection of `EANode` nodes to render
   */
  private renderClasses(classes: EANode[]) {
    const nodes = this.svg.select('g.nodes').selectAll('g.element').data(classes, d => d.xmiId);

    // On new data, create class elements
    const nodeEnter = nodes.enter()
      .append('g')
      .attr('class', (c: EANode) => {
        const cls = ['element', c.cleanId(c.name), c.packagePath].concat(c.cssPackages);
        if (c instanceof Classification) {
          return [c.type.toLowerCase(), c.parentPackage.xmiId].concat(cls).join(' ');
        }
        if (c instanceof Package) {
          return ['package', c.xmiId].concat(cls).join(' ');
        }
      })
      .attr('id', (c: EANode) => c.xmiId);

    // Add a mouseover tooltip
    nodeEnter.append('title').text((c: EANode) => (c instanceof Classification ? c.documentationHeader : ''));

    // Add a rectangle
    nodeEnter.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('width', (c: EANode) => { // Calculate the width of the rectangle based on the length of text it should display
        // Create a temp element using the text
        const el = <SVGGElement> D3.select('svg.model.diagram').append('text')
          .text(c.name).attr('font-size', 13).node();
        if (el) {
          c.width = el.getBBox().width + 20;                        // Gets the calculated text size
          el.remove ? el.remove() : el.parentNode.removeChild(el);  // Remove temp element, supporting IE
          return c.width;                                           // Return the calculated width
        }
        return 0;
      })
      .attr('height', (c: EANode) => c.height)
      .style('filter', c => c.isBaseClass ? 'url(#dropshadow)' : '')
      .style('fill', c => this.isDeprecated(c) && '#fd9696'); // TODO: Can we get this color def from _variables.scss?

    // Add the text
    nodeEnter.append('text').text((c: EANode) => c instanceof Classification ? c.name : ''/*`P:${c.name}`*/)
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-size', 13);

    // Apply event handling
    nodeEnter
    // MouseOver
      .on('mouseover', (event, c: EANode) => {
        if (c instanceof Classification) {
          [].forEach.call(document.querySelectorAll('.source_' + c.xmiId), elm => {
            this.addClasses(elm, ['over', 'source']);
            D3.select(elm).attr('marker-end', d => {
              if (d instanceof Generalization) {
                return 'url(#arrow_source)';
              }
            });
          });
          [].forEach.call(document.querySelectorAll('.target_' + c.xmiId), elm => {
            this.addClasses(elm, ['over', 'target']);
            D3.select(elm).attr('marker-end', d => {
              if (d instanceof Generalization) {
                return 'url(#arrow_target)';
              }
            });
          });
          const p = c.parentPackage.xmiId;
          this.addClass(document.querySelector(`.legend .colors .box.${p}`), 'spotlight');
          this.findHull(p);
        }
      })
      // MouseOut
      .on('mouseout', (event, c: EANode) => {
        if (c instanceof Classification) {
          [].forEach.call(document.querySelectorAll('.source_' + c.xmiId + ', .target_' + c.xmiId), elm => {
            this.removeClasses(elm, ['over', 'source', 'target']);
            D3.select(elm).attr('marker-end', d => {
              if (d instanceof Generalization) {
                return 'url(#arrow_neutral)';
              }
            });
          });
          [].forEach.call(document.querySelectorAll('.legend .colors .box'), elm => this.removeClass(elm, 'spotlight'));
          this.clearHull();
        }
      })
      // Click event
      .on('click', (e, d) => this.clicked(e, d))
      // Drag handling
      .call(this.nodeDragBehaviour());

    // On data removal, remove class elements
    nodes.exit().remove();

    return nodes;
  }

  /**
   * Called each simulation tick
   */
  update() {
    const me = this;
    // Animate nodes
    this.svg.select('g.nodes').selectAll('g.element').attr('transform', (c: EANode) => `translate(${c.x}, ${c.y})`);

    // Animate hull
    this.svg.select('g.hulls').selectAll('path').data(this.createHullData(this.nodeElements)).attr('d', d => this.hullCurve(d.path));

    // Animate links
    this.svg.select('g.links').selectAll('line')
      .each((l: EALinkBase, i, nodes) => {
        const source = this.createMatrix(l.source);
        const target = this.createMatrix(l.target);
        const offset = l instanceof Generalization ? 4 : 0;

        let x;
        if (source.xLeft <= target.xRight && source.xRight >= target.xLeft) {
          x = l.target.width / 2.0 + l.target.x;
        } else if (source.xLeft < target.xLeft) {
          x = target.xLeft - offset;
        } else {
          x = target.xRight + offset;
        }

        let y;
        if (source.yTop <= target.yBottom && source.yBottom >= target.yTop) {
          y = l.target.height / 2.0 + l.target.y - offset;
        } else if (source.yTop < target.yTop) {
          y = l.target.y - offset;
        } else {
          y = target.yBottom + offset;
        }

        D3.select(nodes[i])
          .attr('x1', source.xCenter)
          .attr('y1', source.yCenter)
          .attr('x2', x)
          .attr('y2', y);
      });
  }

  createMatrix(c: EANode) {
    return {
      xLeft: c.x,
      xCenter: (c.width / 2) + c.x,
      xRight: c.x + c.width,

      yTop: c.y,
      yCenter: (c.height / 2) + c.y,
      yBottom: c.y + c.height,
    };
  }

  // ###########################################
  // DATA CREATORS
  // ###########################################
  private createHullData(nodes: EANode[]) {
    const hulls = {};
    const concatParent = (thisPkg, hullData) => {
      const pkg = thisPkg.parentPackage;
      if (pkg && hulls[pkg.xmiId]) {
        hulls[pkg.xmiId] = hulls[pkg.xmiId].concat(hullData);
        concatParent(pkg, hulls[pkg.xmiId]);
      }
    };

    // create point sets
    for (let k = 0; k < nodes.length; ++k) {
      const n = nodes[k];
      const pkg = n.parentPackage;

      const width = n.width, height = n.height;
      if (!pkg || pkg.stereotype == null || pkg.classes.length === 0 && !(pkg instanceof Stereotype)) {
        // Skip if this node has no group, or if it is a package with no direct classes related to it
        continue;
      }

      const i = pkg.xmiId;
      const l = hulls[i] || (hulls[i] = []);
      this.addToLegend(pkg);

      // Create hull data, an array list of x,y coords encapsulating the element
      l.push([n.x - this.hullOffset, n.y - this.hullOffset]);
      l.push([n.x - this.hullOffset, n.y + height + this.hullOffset]);
      l.push([n.x + width + this.hullOffset, n.y - this.hullOffset]);
      l.push([n.x + width + this.hullOffset, n.y + height + this.hullOffset]);
      concatParent(pkg, l); // Include this hull in parent packages hull, so parent package also encapsulates this package
    }

    // create convex hulls
    const hullset = [];
    for (const h in hulls) {
      if (h) {
        const obj = this.modelService.findByXmiId(h);
        const name = obj ? obj.name : '';
        const classPath = obj ? obj.packagePath : '';
        // This creates the actual path for the hull based on our array list
        hullset.push({group: h, name: name, classPath: classPath, path: D3.polygonHull(hulls[h])});
      }
    }

    return hullset;
  }

  // ###########################################
  // LEGEND
  // ###########################################
  types = [
    {name: 'Hoved klasse', type: 'mainclass'},
    {name: 'Kompleks datatype', type: 'class'},
    {name: 'Abstrakt', type: 'abstract'},
    {name: 'Referanse', type: 'referanse'},
    {name: 'Utgår', type: 'deprecated'},
  ];
  lines = [
    {name: 'Arv', type: 'generalization'},
    {name: 'Relasjon', type: 'association'},
  ];
  // https://observablehq.com/@d3/color-schemes
  colorSchemes = ['Blues', 'Oranges', 'Greens', 'Purples', 'Greys', 'Reds', 'BuGn', 'BuPu', 'OrRd'];

  get legendVisible() {
    return this.state.legendVisible;
  }

  set legendVisible(value) {
    this.state.legendVisible = value;
  }

  colorsFlat: ILegendItem[] = [];
  legend = [];
  setActiveTimeout;

  get allActive() {
    return !this.colorsFlat.some(c => !c.active);
  }

  set allActive(value) {
    this.colorsFlat.forEach(c => c.active = value);
  }

  resetLegend() {
    this.colorsFlat = [];
    this.legend = [];
  }

  addToLegend(pkg: EANodeContainer) {
    const xmiId = pkg.xmiId;
    if (pkg.stereotype != null && this.legend.findIndex(l => l.xmiId === pkg.stereotype.xmiId) < 0) {
      // Make sure the stereotype exists
      const col = this.createLegendItem(pkg.stereotype.name, pkg.stereotype.xmiId, pkg.stereotype,
        pkg.stereotype.xmiId, pkg.stereotype.xmiId);
      this.legend.push(col);
      this.colorsFlat.push(col);
    }
    if (pkg.stereotype != null && pkg.stereotype !== pkg) {
      // Add color to stereotype
      const stereotype = this.legend.find(l => l.xmiId === pkg.stereotype.xmiId);
      if (stereotype.colors.findIndex(c => c.xmiId === xmiId) < 0) {
        const col = this.createLegendItem(pkg.name, xmiId, pkg, pkg.xmiId, pkg.stereotype.xmiId);
        stereotype.colors.push(col);
        this.colorsFlat.push(col);
      }
    }
  }

  private createLegendItem(name: string, xmiId: string, pkg: EANodeContainer, pkgXmiId: string, parent: string): ILegendItem {
    const me = this;
    return <ILegendItem>{
      name: name,
      xmiId: xmiId,
      pkg: pkg,
      fill: this.sanitizer.bypassSecurityTrustStyle(`background: ${this.getColorFromPackageId(pkgXmiId)}`),
      _active: true,
      get active() {
        return this._active;
      },
      set active(value) {
        if (this._active !== value) {
          this._active = value;
          if (this.colors) {
            this.colors.forEach(c => c.active = value);
          }

          if (me.setActiveTimeout) {
            clearTimeout(me.setActiveTimeout);
          }
          me.setActiveTimeout = setTimeout(() => {
            // Recalculate hull, links and nodes
            const activePackages = me.colorsFlat.filter(c => c.active).map(c => c.xmiId);
            const allLinks = me.modelService.getLinkNodes().filter(l => {
              return activePackages.indexOf(l.source.parentPackage.xmiId) > -1
                && activePackages.indexOf(l.target.parentPackage.xmiId) > -1;
            });
            me.nodeElements = me.modelService.getNodes(me.model.modelBase).filter(c => {
              return c.parentPackage && (activePackages.indexOf(c.parentPackage.xmiId) > -1 || activePackages.indexOf(c.xmiId) > -1);
            });

            me.hull = me.renderHulls(me.nodeElements);
            me.links = me.renderLinks(allLinks);
            me.nodes = me.renderClasses(me.nodeElements);

            if (me.simulation) {
              me.simulation.restart();
            }
            me.setActiveTimeout = null;
          }, 100);
        }
      },
      colors: <string[]>[],
      parent: parent
    };
  }

  private getColorFromPackageId(xmiId: string) {
    // Find package based on name
    const pkg = <Package> this.modelService.findByXmiId<Package>(xmiId, Package);

    if (pkg) {
      // Chose color scheme based on stereotype index
      const stereotype = pkg.stereotype;
      if (stereotype) {
        const index = this.model.modelBase.stereotypes.findIndex(s => s.xmiId === stereotype.xmiId);
        const scheme = this.colorSchemes[index];

        // Find index of scheme
        const packages = stereotype.allPackages;
        const childIndex = packages.findIndex(p => p.xmiId === pkg.xmiId);
        return D3[`interpolate${scheme}`](0.7 - (childIndex + 1) / (packages.length + 1.5));
      }
    }
    return 0;
  }

  // ###########################################
  // EVENT HANDLERS
  // ###########################################
  /**
   * Called each time the window is resized. This will kickstart the simulation again.
   */
  @HostListener('window:resize', [])
  forceTick() {
    if (this.simulation) {
      this.simulation.alpha(0.5).restart();
    }
  }

  /**
   * Behaviour events when dragging a hull of nodes
   */
  hullDragBehaviour() {
    // d.fx & d.fy = fixed coords. If these are set, the element will not move from it's position
    return D3.drag()
      .on('start', (event: any, d: any) => {
        D3.selectAll(`g.nodes g.element.${d.group}, g.nodes g.element[class*="${d.classPath}"]`)
          .each((n: any) => {
            n.fx = null;
            n.fy = null;
          }); // Unset fixed coords
        this.simulation.stop();
      })
      .on('drag', (event: any, d: any) => {
        const nodeGroup = parseInt(d.key, 10);
        const dx = event.dx; // change in x coordinates relative to the previous drag
        const dy = event.dy; // change in y coordinates relative to the previous drag
        D3.selectAll(`g.nodes g.element.${d.group}, g.nodes g.element[class*="${d.classPath}"]`)
          .each(function(dd: any) {
            D3.select(this)
              .attr('cx', (n: any) => {
                n.px = n.px + dx;
                n.x =  n.x + dx;
                return n.x;
              })
              .attr('cy', (n: any) => {
                n.py = n.py + dy;
                n.y =  n.y + dy;
                return n.y;
              });
          });
        this.simulation.restart(); // Allow simulation to run slowly while we drag
      })
      .on('end', (event: any, d: any) => {
        D3.selectAll(`g.nodes g.element.${d.group}, g.nodes g.element[class*="${d.classPath}"]`)
          .each((d: any) => {
            d.fx = this.isSticky ? d.x : null; // Set or unset fixed x coords
            d.fy = this.isSticky ? d.y : null; // Set or unset fixed x coords
          });
        this.simulation.alpha(0.2).restart(); // Start the simulation with a low alpha so it will not bounce so much
      });
  }

  findHull(xmiId: string) {
    this.addClass(document.querySelector(`svg path.hull.${xmiId.toLowerCase()}`), 'spotlight');
  }

  clearHull() {
    [].forEach.call(document.querySelectorAll('svg path.hull'), elm => this.removeClass(elm, 'spotlight'));
  }

  clicked(event: any, d: EANode) {
    if (event.defaultPrevented) { return; };
    return d instanceof Classification ? this.router.navigate(['/docs', d.id], {queryParams: this.modelService.queryParams}) : null;
  }

  /**
   * Behaviour events when dragging one node
   */
  nodeDragBehaviour() {
    let sx, sy; // Mouse X/Y coords from original 'start' event
    let vx, vy; // Delta movement (comparing current X/Y coords from original)

    return D3.drag()
      .on('start', function (event: any, d: any) {
        sx = event.x;
        sy = event.y;
        vx = 0;
        vy = 0;
      })
      .on('drag', (event: any, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
        this.simulation.restart(); // Allow simulation to run slowly while we drag
      })
      .on('end', (event: any, d: any) => {
        if (sx === event.x && sy === event.y) {
          return this.clicked(event, d); // Mouse hasn't moved. This should be a click event.
        }
        const vScalingFactor = this.maxVelocity / Math.max(Math.sqrt(vx * vx + vy * vy), this.maxVelocity);
        if (!this.isSticky) {
          d.fx = null;
          d.fy = null; // Unset fixed coords
        }
        d.vx = vx * vScalingFactor;
        d.vy = vy * vScalingFactor;
        this.simulation.alpha(0.2).restart(); // Start the simulation with a low alpha so it will not bounce so much
      });
  }

  // ###########################################
  // DOM Manipulators
  // ###########################################
  addClass(elm: Element, className: string) {
    if (elm) {
      if (elm.classList) {
        elm.classList.add(className);
      } else if (!(new RegExp('(\\s|^)' + className + '(\\s|$)').test(elm.getAttribute('class')))) {
        elm.setAttribute('class', elm.getAttribute('class') + ' ' + className);
      }
    }
  }

  addClasses(elm: Element, classNames: string[]) {
    classNames.forEach(n => this.addClass(elm, n));
  }

  removeClass(elm: Element, className: string) {
    if (elm) {
      if (elm.classList) {
        elm.classList.remove(className);
      } else {
        const removedClass = elm.getAttribute('class').replace(new RegExp('(\\s|^)' + className + '(\\s|$)', 'g'), '$2');
        if (new RegExp('(\\s|^)' + className + '(\\s|$)').test(elm.getAttribute('class'))) {
          elm.setAttribute('class', removedClass);
        }
      }
    }
  }

  removeClasses(elm: Element, classNames: string[]) {
    classNames.forEach(n => this.removeClass(elm, n));
  }

  private isDeprecated(c) {
    let deprecated = false;
    if (c.extension.tags[0] && c.extension.tags[0].tag.length > 0) {
      c.extension.tags[0].tag.forEach(t => {
        if (t.name === 'DEPRECATED') {
          deprecated = true;
        }
      });
    }
    return deprecated;
  }
}
