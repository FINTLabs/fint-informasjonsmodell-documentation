import * as D3 from 'app/d3.bundle';

interface BoundedBoxForce<NodeDatum extends D3.SimulationNodeDatum> extends D3.Force<any, undefined> {
  // size?(size?: number): this;
  size?(size: (node: NodeDatum, i?: number, nodes?: NodeDatum[]) => [number, number]): this;
  bounds?(boundaries: BoundaryBox<NodeDatum>): any;
}

export interface BoundaryBox<NodeDatum> {
  x0: any; x1: any; y0: any; y1: any;
}

/**
 * Make sure nodes do not render outside boundaries.
 * https://bl.ocks.org/cmgiven/547658968d365bcc324f3e62e175709b
 */
export function forceBoundedBox <NodeDatum extends D3.SimulationNodeDatum> (): BoundedBoxForce<NodeDatum> {
  let nodes, sizes;
  let bounds: BoundaryBox<NodeDatum>;
  
  const constant = (x: [number, number]) => () => x;
  let size: any = constant([0, 0]);

  const force: BoundedBoxForce<NodeDatum> = function () {
    let node, size;
    let xi, x0, x1, yi, y0, y1;
    let i = -1;
    while (++i < nodes.length) {
      node = nodes[i];
      size = sizes[i];
      xi = node.x + node.vx;
      yi = node.y + node.vy;
      x0 = (typeof bounds.x0 === 'function' ? bounds.x0(node) : bounds.x0) - xi;
      x1 = (typeof bounds.x1 === 'function' ? bounds.x1(node) : bounds.x1) - (xi + size[0]);
      y0 = (typeof bounds.y0 === 'function' ? bounds.y0(node) : bounds.y0) - yi;
      y1 = (typeof bounds.y1 === 'function' ? bounds.y1(node) : bounds.y1) - (yi + size[1]);
      if (x0 > 0 || x1 < 0) {
        node.x += node.vx;
        node.vx = -node.vx;
        if (node.vx < x0) { node.vx += x0 - node.vx; }
        if (node.vx > x1) { node.vx += x1 - node.vx; }
      }
      if (y0 > 0 || y1 < 0) {
        node.y += node.vy;
        node.vy = -node.vy;
        if (node.vy < y0) { node.vy += y0 - node.vy; }
        if (node.vy > y1) { node.vy += y1 - node.vy; }
      }
    }
  }

  force.initialize = function (_) {
    sizes = (nodes = _).map(size);
  }

  force.bounds = function (_) {
    return (arguments.length ? (bounds = _, force) : bounds);
  }

  force.size = function (_) {
    return (arguments.length ? (size = typeof _ === 'function' ? _ : constant(_), force) : size);
  }

  return force;
}
