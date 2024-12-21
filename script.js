const _state = {
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
  },
  image: {
    width: 570,
    height: 570,
    traced: [],
  },
};

let _img, _w, _h, _ctxSource, _sourceData, _ctx, _imageData, _data_u32, _bitmap;

function setImage(img) {
  _img = img;
  _w = img.width;
  _h = img.height;

  _ctx = document.querySelector("#edges").getContext("2d");
  _ctxSource = document.querySelector("#source").getContext("2d");

  _bitmap = new jsfeat.matrix_t(_w, _h, jsfeat.U8C1_t);
}

function render() {
  _ctxSource.drawImage(_img, 0, 0, _w, _h);
  _sourceData = _ctxSource.getImageData(0, 0, _w, _h);

  const ctx = _ctx,
    canny = _state.options.canny;

  ctx.drawImage(_img, 0, 0, _w, _h);
  _imageData = ctx.getImageData(0, 0, _w, _h);

  jsfeat.imgproc.grayscale(_imageData.data, _w, _h, _bitmap);

  var r = canny.blur_radius | 0;
  var kernel_size = (r + 1) << 1;

  jsfeat.imgproc.gaussian_blur(_bitmap, _bitmap, kernel_size, 0);

  jsfeat.imgproc.canny(_bitmap, _bitmap, canny.low_threshold, canny.high_threshold);

  ctx.putImageData(_imageData, 0, 0);

  trace();
}

function trace() {
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
  const tracing = _state.options.tracing;
  const importantLines = [];
  traces.forEach((trace) => {
    if (trace.length < tracing.minLength) {
      return;
    }

    importantLines.push(trace);
  });
  _ctx.putImageData(_imageData, 0, 0);
  _state.image.traced = importantLines;
}

function _traceFrom(x_1, y_1, grid) {
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

    //Now, we can combine the densest clusters into one point as long as the clusters don't overlap.
    //If we find a group of overlapping clusters, we can only pick the largest one, and then recalculate.
    let prevCenter;
    for (const cl of tempClusters) {
      const ids = cl.pointIds,
        // pop = cl.population,
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
  } while (pointInfos.length && failsafe < 999);

  return clusters;
}

function load() {
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
      console.log(getTriangles());
    }, 0);
  };

  document.querySelector("#sourceImg").onchange = function (e) {
    _ctxSource.clearRect(0, 0, _w, _h);
    var url = URL.createObjectURL(this.files[0]);
    img.src = url;
  };

  img.crossOrigin = "anonymous";
  img.src = "./charizard y.png";
}

function getPolylines() {
  const tracing = _state.options.tracing;

  const polys = _state.image.traced.map((trace) => simplify(trace, tracing.lineTolerance, true));

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

    const clustered = cluster(
      allPoints.map((p) => p.originalPoint),
      tracing.clustering
    );

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
}

function getCentroid(triangle) {
  let x = 0,
    y = 0;
  triangle.forEach((point) => {
    x += point[0];
    y += point[1];
  });
  return [x / 3, y / 3];
}

function getColor(triangle) {
  const [x, y] = getCentroid(triangle).map(Math.round),
    i = 4 * (y * _w + x);

  const data = _sourceData.data,
    r = data[i],
    g = data[i + 1],
    b = data[i + 2],
    a = data[i + 3];

  //Nearest 3-digit hex:
  //return '#' + [r, g, b].map(x => Math.round(x/17).toString(16)).join('');
  return `rgba(${[r, g, b, a > 255 / 2 ? a : 0]})`;
}

function getTriangles() {
  const polylines = getPolylines();

  const svg = document.getElementById("low-poly");

  svg.innerHTML = "";

  if (!polylines.length) {
    return [];
  }

  paths = [];

  const points = new Set(),
    edges = [];

  polylines.forEach((poly) => {
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
  points.add(tuple(0, 0)).add(tuple(_w, 0)).add(tuple(_w, _h)).add(tuple(0, _h));

  const pointsArr = Array.from(points),
    edgeIndexes = edges.map((edge) => edge.map((p) => pointsArr.indexOf(p)));

  let delaunay;
  try {
    delaunay = cdt2d(pointsArr, edgeIndexes, {
      delaunay: true,
    });
  } catch (ex) {
    delaunay = [];
  }

  delaunay.forEach((tri) => {
    const triangle = tri.map((i) => pointsArr[i]);

    const temp = {
      points: "M" + triangle.flat().join(" "),
      color: getColor(triangle),
    };

    if (temp.color !== "rgba(0,0,0,0)") {
      paths.push(temp);
    }

    svg.innerHTML += `<path d='${temp.points}' color='${temp.color}'></path>`;
  });

  return paths;
}

document.addEventListener("DOMContentLoaded", load);
