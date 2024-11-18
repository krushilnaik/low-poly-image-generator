(function () {
  "use strict";
  function log() {
    const now = new Date(),
      time = now.toLocaleTimeString() + "." + now.getMilliseconds().toString().padEnd(3, "0");
    console.log.apply(console, [time].concat(Array.from(arguments)));
  }
  function debugColor(i) {
    //https://coolors.co/ffbe0b-fb5607-ff006e-8338ec-3a86ff-79ff4d
    //https://learnui.design/tools/data-color-picker.html#divergent
    const colors = [
      [0xff, 0x00, 0x00],
      [0xff, 0xff, 0x00],
      [0x00, 0xff, 0x00],
      [0x00, 0xff, 0xff],
      [0x00, 0x00, 0xff],
      [0xff, 0x00, 0xff],
    ];
    const color = colors[i % colors.length];
    return color;
  }

  const _state = {
    // options: {
    //   canny: {
    //     blur_radius: 5, //5,
    //     low_threshold: 1,
    //     high_threshold: 50, //80,
    //   },
    //   tracing: {
    //     minLength: 10, //10,
    //     lineTolerance: 4, //7,
    //     clustering: 3,
    //     useDelaunay: true,
    //   },
    //   customPoints: [],
    // },
    // image: {
    //   width: 0,
    //   height: 0,
    //   traced: [],
    // },
    options: {
      canny: {
        blur_radius: 5, //5,
        low_threshold: 1,
        high_threshold: 50, //80,
      },
      tracing: {
        minLength: 18, //10,
        lineTolerance: 4, //7,
        clustering: 3,
        useDelaunay: true,
      },
      customPoints: [],
    },
    image: {
      width: 0,
      height: 0,
      traced: [],
    },
  };
  /*
    //Somehow, canny calculations turn out slightly different in Firefox,
    //and these settings look better on the example image:
    if(navigator.userAgent.toLowerCase().includes('firefox')) {
        _state.options.canny.blur_radius = 5;
        _state.options.tracing.lineTolerance = 2;
        _state.options.tracing.clustering = 4;
        _state.options.customPoints = [[79, 0], [216, 0], [256, 0], [356, 154], [267, 148], [303, 250], [275, 190], [270, 109], [145, 285], [194, 248], [265, 345], [0, 400], [212, 169]];
    }
    */

  let _img,
    _w,
    _h,
    //Original image:
    _ctxSource,
    _sourceData,
    //Edge detection/tracing:
    _ctx,
    _imageData,
    _data_u32,
    _bitmap;

  function setImage(img) {
    const firstImage = !_img;
    _img = img;
    _w = img.width;
    _h = img.height;

    const measure = Math.max(_w, _h);
    if (measure > 600) {
      const shrink = 600 / measure;
      _w = Math.round(_w * shrink);
      _h = Math.round(_h * shrink);
    }
    _state.image.width = _w;
    _state.image.height = _h;
    if (!firstImage) {
      _state.options.customPoints = [];
    }

    _ctx = document.querySelector("#edges").getContext("2d");
    _ctxSource = document.querySelector("#source").getContext("2d");

    _bitmap = new jsfeat.matrix_t(_w, _h, jsfeat.U8C1_t);
  }

  function setPixel(i, r, g, b) {
    const alpha = 0xff << 24;
    _data_u32[i] = alpha | (b << 16) | (g << 8) | r;
  }

  function render() {
    _ctxSource.drawImage(_img, 0, 0, _w, _h);
    _sourceData = _ctxSource.getImageData(0, 0, _w, _h);

    const ctx = _ctx,
      canny = _state.options.canny;

    ctx.drawImage(_img, 0, 0, _w, _h);
    _imageData = ctx.getImageData(0, 0, _w, _h);

    log("grayscale");
    jsfeat.imgproc.grayscale(_imageData.data, _w, _h, _bitmap);

    var r = canny.blur_radius | 0;
    var kernel_size = (r + 1) << 1;

    log("gauss blur", r, kernel_size);
    jsfeat.imgproc.gaussian_blur(_bitmap, _bitmap, kernel_size, 0);

    log("canny edge");
    jsfeat.imgproc.canny(_bitmap, _bitmap, canny.low_threshold, canny.high_threshold);

    // render result back to canvas
    //log("render", _bitmap);
    _data_u32 = new Uint32Array(_imageData.data.buffer);

    let i = _bitmap.cols * _bitmap.rows,
      pix = 0;
    while (--i >= 0) {
      pix = _bitmap.data[i] ? 160 : 0;
      setPixel(i, pix, pix, pix);
    }
    ctx.putImageData(_imageData, 0, 0);

    trace();
  }

  function trace() {
    log("trace lines");

    //Put our bitmap in a 2d grid:
    const grid = [];
    let i = 0;
    for (let y = 0; y < _h; y++) {
      const row = _bitmap.data.slice(i, i + _w);
      grid.push(row);
      i += _w;
    }

    //Trace continuous lines:
    const traces = [];
    for (let y = 0; y < _h; y++) {
      for (let x = 0; x < _w; x++) {
        const px = grid[y][x];
        if (px) {
          traces.push.apply(traces, _traceFrom(x, y, grid));
        }
      }
    }
    log("traced lines", traces.length); //.reduce((sum, x) => sum + x.length, 0));

    const tracing = _state.options.tracing;
    const importantLines = [];
    traces.forEach((trace) => {
      if (trace.length < tracing.minLength) {
        return;
      }

      //Mark pixels:
      const [r, g, b] = debugColor(importantLines.length);
      trace.forEach(([x, y]) => setPixel(y * _w + x, r, g, b));

      importantLines.push(trace);
    });
    _ctx.putImageData(_imageData, 0, 0);
    _state.image.traced = importantLines;
    log("drawn lines", importantLines.length);
  }

  function _traceFrom(x_1, y_1, grid) {
    //const lines = [];
    const branches = [];

    function checkPixel(x, y) {
      return grid[y] && grid[y][x];
    }
    function findNext(x, y, findAll) {
      const options = [];
      //Check up/down/left/right first, and only diagonals if we don't find anything.
      //This will let us trace "staircases" as one line, and not a series or intersections.
      if (checkPixel(x, y - 1)) {
        options.push(tuple(x, y - 1));
      }
      if (checkPixel(x, y + 1)) {
        options.push(tuple(x, y + 1));
      }
      if (checkPixel(x - 1, y)) {
        options.push(tuple(x - 1, y));
      }
      if (checkPixel(x + 1, y)) {
        options.push(tuple(x + 1, y));
      }

      if (options.length && !findAll) {
        return options;
      }

      if (checkPixel(x - 1, y - 1)) {
        options.push(tuple(x - 1, y - 1));
      }
      if (checkPixel(x + 1, y - 1)) {
        options.push(tuple(x + 1, y - 1));
      }
      if (checkPixel(x - 1, y + 1)) {
        options.push(tuple(x - 1, y + 1));
      }
      if (checkPixel(x + 1, y + 1)) {
        options.push(tuple(x + 1, y + 1));
      }

      return options;
    }
    function collect(a, b, branch) {
      branch.push(tuple(a, b));
      grid[b][a] = 0;
    }
    function addBranch(startX, startY) {
      const branch = [];
      collect(startX, startY, branch);
      branches.push(branch);
      return branch;
    }

    //Start by initing our main branch
    addBranch(x_1, y_1);

    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      let [x0, y0] = branch[0],
        [x, y] = branch[branch.length - 1];

      let nexts,
        pass = 1,
        endOfLine = false;
      while (true) {
        nexts = findNext(x, y);

        //If we reach an intersection:
        if (nexts.length > 1 && branch.length > 1) {
          //This may just be a 1px branch/noise, or a small section where the edge is 2px wide.
          //To test that, we look at all the pixels we can reach from the first step of a new branch.
          //If there are no more pixels than we can reach from our current position,
          //it's just noise and not an actual branch.
          const currentReach = findNext(x, y, true);
          let maxReach = -1,
            maxBranch,
            toDelete = [];
          nexts = nexts.filter(([xx, yy]) => {
            const branchReach = findNext(xx, yy, true),
              branchHasNewPixels = branchReach.some((px) => !currentReach.includes(px));
            if (branchReach.length > maxReach) {
              maxReach = branchReach.length;
              maxBranch = tuple(xx, yy);
            }

            //If we decide this is just noise, clear the pixel so it's not picked up by a later traceFrom().
            //Do that after this loop is finished, or else it will interfere with the other branches chance at a `maxReach`:
            if (!branchHasNewPixels) {
              toDelete.push(tuple(xx, yy));
            }

            return branchHasNewPixels;
          });
          toDelete.forEach(([xx, yy]) => (grid[yy][xx] = 0));

          //If we filtered away all the branches, keep the one with more pixels.
          //This lets us go around noisy corners or finish noisy line ends:
          if (nexts.length === 0) {
            nexts = [maxBranch];
          }

          //This is a real intersection of branches:
          if (nexts.length > 1) {
            nexts.forEach((coord) => {
              const otherBranch = addBranch(x, y);
              collect(coord[0], coord[1], otherBranch);
            });
            endOfLine = true;
          }
        }

        //Keep following the current branch:
        if (nexts.length && !endOfLine) {
          [x, y] = nexts[0];
          collect(x, y, branch);
        } else {
          endOfLine = true;
        }

        if (endOfLine) {
          if (pass === 1) {
            //Reverse and trace in the other direction from our starting point;
            branch.reverse();
            x = x0;
            y = y0;

            pass = 2;
            endOfLine = false;
          } else {
            break;
          }
        }
      }
    }
    return branches;
  }

  function cluster(points, tolerance) {
    function avgPos(points) {
      const len = points.length;
      let sumX = 0,
        sumY = 0;
      points.forEach(([x, y]) => {
        sumX += x;
        sumY += y;
      });
      return [sumX / len, sumY / len];
    }

    function dist2(a, b) {
      const dx = a[0] - b[0],
        dy = a[1] - b[1];
      return dx * dx + dy * dy;
    }

    const clusters = [];
    let pointInfos = points.map((p, i) => ({
      xy: p,
      //Below, we'll shrink this array of points step by step,
      //so we need to keep track of all points' positions in the original array
      //to report correct .pointIds at the end:
      origIndex: i,
    }));

    //Find and combine the densest cluster of points,
    //one at a time, until there are no clusters left:
    const minClusterDistance2 = 4 * tolerance * tolerance;
    let toRemove,
      failsafe = 0;
    do {
      toRemove = [];
      failsafe++;

      const newPoints = pointInfos.map((p) => p.xy);
      const index = new KDBush(newPoints);

      const clusterCombos = new Set();
      const tempClusters = newPoints
        .map(([x, y]) => {
          const pointIds = index.within(x, y, tolerance),
            population = pointIds.length;

          //We get duplicates of most clusters
          //(point A is right next to B, thus point B is also right next to A):
          const combo = tuple(...pointIds);
          if (clusterCombos.has(combo)) {
            return null;
          }
          clusterCombos.add(combo);

          //We can safely put aside clusters of population 1 (single points) right away.
          //These will never be a part of any actual cluster on subsequent recalculations:
          if (population === 1) {
            const id = pointIds[0],
              pointInfo = pointInfos[id];
            toRemove.push(id);
            clusters.push({
              center: pointInfo.xy,
              pointIds: [pointInfo.origIndex],
            });
            return null;
          }

          return { pointIds, population };
        })
        //Better to build a sorted array one item at a time in the loop above?
        //https://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
        .filter((x) => x)
        .sort((a, b) => b.population - a.population);

      //log('temp', failsafe, tempClusters);

      //Now, we can combine the densest clusters into one point as long as the clusters don't overlap.
      //If we find a group of overlapping clusters, we can only pick the largest one, and then recalculate.
      let prevCenter;
      for (const cl of tempClusters) {
        const ids = cl.pointIds,
          pop = cl.population,
          center = avgPos(ids.map((i) => newPoints[i]));

        let doCombine = false;
        if (prevCenter) {
          const dist = dist2(center, prevCenter);
          if (dist > minClusterDistance2) {
            doCombine = true;
          }
        }
        //This is the first and largest cluster. Always combine:
        else {
          doCombine = true;
        }
        if (!doCombine) {
          break;
        }

        toRemove.push.apply(toRemove, ids);
        clusters.push({
          center,
          pointIds: ids.map((i) => pointInfos[i].origIndex),
        });
        prevCenter = center;
      }

      pointInfos = pointInfos.filter((p, i) => !toRemove.includes(i));
      //log('clusters/points', clusters.length, pointInfos.length)
    } while (pointInfos.length && failsafe < 999);

    return clusters;
  }

  function load() {
    /* Edge/tracing settings */
    (function controls() {
      const canny = new dat.GUI({ autoPlace: false });
      const cannyHeader = canny.addFolder("Canny edge detection");
      cannyHeader.open();
      cannyHeader.add(_state.options.canny, "blur_radius", 0, 10).step(1).onChange(render);
      cannyHeader.add(_state.options.canny, "low_threshold", 1, 200).step(1).onChange(render);
      cannyHeader.add(_state.options.canny, "high_threshold", 1, 200).step(1).onChange(render);

      const tracing = new dat.GUI({ autoPlace: false });
      const tracingHeader = tracing.addFolder("Line tracing");
      tracingHeader.open();
      tracingHeader.add(_state.options.tracing, "minLength", 0, 50).step(1).onChange(render);
      tracingHeader.add(_state.options.tracing, "lineTolerance", 0, 10).step(1); //.onChange(trace);
      tracingHeader.add(_state.options.tracing, "clustering", 0, 10).step(1); //.onChange(trace);
      tracingHeader.add(_state.options.tracing, "useDelaunay").onChange(trace);

      document.querySelector("#controls").insertAdjacentElement("afterbegin", tracing.domElement);
      document.querySelector("#controls").insertAdjacentElement("afterbegin", canny.domElement);
    })();

    /* Additional points for triangulation */
    const pointsPanel = document.querySelector("#custom-points");
    function getSVGCoord(pos) {
      //The SVGs (and canvases) are resized on small screens:
      const w1 = pointsPanel.clientWidth,
        w2 = _state.image.width;
      if (w1 && w2 && w1 !== w2) {
        const stretch = w2 / w1;
        return pos.map((xy) => Math.round(xy * stretch));
      }
      return pos;
    }
    dragTracker({
      container: pointsPanel,
      selector: "[data-draggable]",
      dragOutside: false,
      callback: (node, pos) => {
        //Dispatch a custom event which is handled by the node's Vue component...
        var event = new CustomEvent("dragging", { detail: { pos: getSVGCoord(pos) } });
        node.dispatchEvent(event);
      },
    });
    pointsPanel.addEventListener("click", (e) => {
      //console.log('click', e.target, e);
      if (e.target === pointsPanel) {
        const bounds = pointsPanel.getBoundingClientRect(),
          x = event.clientX - bounds.left,
          y = event.clientY - bounds.top;
        _state.options.customPoints.push(getSVGCoord([x, y]));
      }
    });

    /* Image uploading */
    const img = new Image();
    img.onload = (e) => {
      setImage(img);
      //Changing a canvas' size (which is done by Vue) clears its content,
      //so make sure we render() *after* the size has changed:
      setTimeout(() => {
        render();
        //Don't know why, but on a new image, it takes two renders for the result to "set":
        render();
      }, 0);
    };
    document.querySelector("#sourceImg").onchange = function (e) {
      var url = URL.createObjectURL(this.files[0]);
      img.src = url;
    };
    img.crossOrigin = "anonymous";
    // img.src = "./charizard y.png";
    img.src = "./pokeball.png";
  }

  Vue.component("drag-node", {
    template: '<circle data-draggable @dragging="onDragging" :cx="coord[0]" :cy="coord[1]" :r="r" />',
    props: {
      coord: Array,
      r: { default: 16 },
    },
    model: {
      prop: "coord",
      event: "do_it",
    },
    methods: {
      onDragging(e) {
        const point = e.detail.pos;
        this.$emit("do_it", point);
      },
    },
  });

  new Vue({
    el: "#app",
    mounted() {
      load();
    },
    data: _state,
    computed: {
      size() {
        if (this.image.width) {
          return { width: this.image.width, height: this.image.height };
        }
      },
      sizeSVG() {
        const size = this.size;
        if (size) {
          size.viewBox = [0, 0, this.image.width, this.image.height];
        }
        return size;
      },
      polylines() {
        const tracing = this.options.tracing;

        const polys = this.image.traced.map((trace) => {
          return simplify(trace, tracing.lineTolerance, true);
        });

        //Combine near-duplicate points:
        if (tracing.clustering) {
          const allPoints = polys.flatMap((poly) =>
            poly.map((xy, i) => {
              return {
                originalPoint: xy,
                polyline: poly,
                i,
              };
            })
          );
          log("all", allPoints.length);
          const clustered = cluster(
            allPoints.map((p) => p.originalPoint),
            tracing.clustering
          );
          log("cll", clustered.length /*, JSON.stringify(clustered.map(c => c.center))*/);
          clustered.forEach((cluster) => {
            const center = tuple(...cluster.center);
            cluster.pointIds.forEach((pointIndex) => {
              const pointInfo = allPoints[pointIndex],
                poly = pointInfo.polyline;
              if (center[0] < pointInfo.originalPoint[0] - 50) {
                debugger;
              }
              poly[pointInfo.i] = center;
            });
          });
        }

        return polys;
      },
      triangles() {
        if (!this.polylines.length) {
          return [];
        }

        const points = new Set(),
          edges = [];

        this.polylines.forEach((poly) => {
          let p1 = tuple(...poly[0]),
            p2;
          points.add(p1);
          for (let i = 1; i < poly.length; i++) {
            p2 = tuple(...poly[i]);
            //The clustering of polylines may lead to a few
            //back-to-back duplicate points, which we can skip:
            if (p2 !== p1) {
              points.add(p2);
              edges.push([p1, p2]);
              p1 = p2;
            }
          }
        });

        //Add helper points and corners, and then do a Constrained Delaunay triangulation:
        this.options.customPoints.forEach((p) => points.add(tuple(...p)));
        points.add(tuple(0, 0)).add(tuple(_w, 0)).add(tuple(_w, _h)).add(tuple(0, _h));

        const pointsArr = Array.from(points),
          edgeIndexes = edges.map((edge) => edge.map((p) => pointsArr.indexOf(p)));
        //console.log('cdt 2', JSON.stringify(pointsArr), JSON.stringify(edgeIndexes));

        let delaunay;
        try {
          delaunay = cdt2d(pointsArr, edgeIndexes, {
            delaunay: this.options.tracing.useDelaunay,
          });
        } catch (ex) {
          //"TypeError: Cannot read property 'upperIds' of undefined"
          delaunay = [];
        }
        const triangles = delaunay.map((tri) => tri.map((i) => pointsArr[i]));
        log("triangles", triangles.length);

        return triangles;
      },
    },
    methods: {
      debugColor(i) {
        return `rgb(${debugColor(i)})`;
      },
      pickColor(triangle) {
        const [x, y] = this.centroid(triangle).map(Math.round),
          i = 4 * (y * _w + x);

        const data = _sourceData.data,
          r = data[i],
          g = data[i + 1],
          b = data[i + 2],
          a = data[i + 3];

        //Neares 3-digit hex:
        //return '#' + [r, g, b].map(x => Math.round(x/17).toString(16)).join('');
        return `rgba(${[r, g, b, a > 255 / 2 ? a : 0]})`;
      },
      centroid(triangle) {
        let x = 0,
          y = 0;
        triangle.forEach((point) => {
          x += point[0];
          y += point[1];
        });
        return [x / 3, y / 3];
      },
      downloadSVG(e) {
        const svgContent = document.querySelector("#low-poly").outerHTML,
          blob = new Blob([svgContent], {
            type: "image/svg+xml",
          }),
          url = window.URL.createObjectURL(blob),
          link = e.target;

        link.target = "_blank";
        link.download = "low-poly.svg";
        link.href = url;
      },
    },
  });
})();
