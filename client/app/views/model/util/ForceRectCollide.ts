import * as D3 from 'app/d3.bundle';

interface RectCollideForce<NodeDatum extends D3.SimulationNodeDatum> extends D3.Force<any, undefined> {
  // size?(size?: number): this;
  size?(size: (node: NodeDatum, i?: number, nodes?: NodeDatum[]) => [number, number]): this;
  strength?(s?: number): any;
  iterations?(s?: number): any;
}

/**
 * Try to make nodes not overlap
 * https://bl.ocks.org/cmgiven/547658968d365bcc324f3e62e175709b
 */
export function forceRectCollide<NodeDatum extends D3.SimulationNodeDatum> (): RectCollideForce<NodeDatum> {
  let nodes, sizes, masses;

  const constant = (x: [number, number]) => () => x;
  let size: any = constant([0, 0]);
  let strength = 1;
  let iterations = 1;

  const force: RectCollideForce<NodeDatum> = function () {
    let node, size, mass, xi, yi;
    let i = -1;
    while (++i < iterations) {
      let j = -1;
      const tree = D3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare);

      while (++j < nodes.length) {
        node = nodes[j];
        size = sizes[j];
        mass = masses[j];
        xi = xCenter(node);
        yi = yCenter(node);

        tree.visit(apply);
      }
    }

    function apply(quad, x0, y0, x1, y1) {
      const data = quad.data;
      const xSize = (size[0] + quad.size[0]) / 2;
      const ySize = (size[1] + quad.size[1]) / 2;
      if (data) {
        if (data.index <= node.index) { return; }

        let x = xi - xCenter(data);
        let y = yi - yCenter(data);
        const xd = Math.abs(x) - xSize;
        const yd = Math.abs(y) - ySize;

        if (xd < 0 && yd < 0) {
          const l = Math.sqrt(x * x + y * y);
          const m = masses[data.index] / (mass + masses[data.index]);

          if (Math.abs(xd) < Math.abs(yd)) {
            node.vx -= (x *= xd / l * strength) * m;
            data.vx += x * (1 - m);
          } else {
            node.vy -= (y *= yd / l * strength) * m;
            data.vy += y * (1 - m);
          }
        }
      }

      return x0 > xi + xSize || y0 > yi + ySize ||
        x1 < xi - xSize || y1 < yi - ySize;
    }

    function prepare(quad) {
      if (quad.data) {
        quad.size = sizes[quad.data.index];
      } else {
        quad.size = [0, 0];
        let i = -1;
        while (++i < 4) {
          if (quad[i] && quad[i].size) {
            quad.size[0] = Math.max(quad.size[0], quad[i].size[0]);
            quad.size[1] = Math.max(quad.size[1], quad[i].size[1]);
          }
        }
      }
    }
  }

  function xCenter(d) { return d.x + d.vx + sizes[d.index][0] / 2; }
  function yCenter(d) { return d.y + d.vy + sizes[d.index][1] / 2; }

  force.initialize = function (_) {
    sizes = (nodes = _).map(size);
    masses = sizes.map(function (d) { return d[0] * d[1]; })
  }

  force.size = function (_) {
    return (arguments.length ? (size = typeof _ === 'function' ? _ : constant(_), force) : size)
  }

  force.strength = function (_) {
    return (arguments.length ? (strength = +_, force) : strength);
  }

  force.iterations = function (_) {
    return (arguments.length ? (iterations = +_, force) : iterations);
  }
  return force;
}
