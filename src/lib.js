/*
  tuple by Ry-♦
  https://stackoverflow.com/a/21839292/1869660
*/
tuple = (function () {
  "use strict";
  let map = new Map();
  function tuple() {
    let current = map;
    let args = Object.freeze(Array.from(arguments));
    for (let item of args) {
      if (current.has(item)) {
        current = current.get(item);
      } else {
        let next = new Map();
        current.set(item, next);
        current = next;
      }
    }
    if (!current._myVal) {
      current._myVal = args;
    }
    return current._myVal;
  }
  return tuple;
})();

/*
  (c) 2017, Vladimir Agafonkin
  Simplify.js, a high-performance JS polyline simplification library
  https://mourner.github.io/simplify-js
*/
simplify = (function () {
  "use strict";
  function n(n, r) {
    var t = n[0] - r[0],
      u = n[1] - r[1];
    return t * t + u * u;
  }
  function r(n, r, t) {
    var u = r[0],
      i = r[1],
      f = t[0] - u,
      o = t[1] - i;
    if (0 !== f || 0 !== o) {
      var e = ((n[0] - u) * f + (n[1] - i) * o) / (f * f + o * o);
      e > 1 ? ((u = t[0]), (i = t[1])) : e > 0 && ((u += f * e), (i += o * e));
    }
    return (f = n[0] - u), (o = n[1] - i), f * f + o * o;
  }
  function t(r, t) {
    for (var u, i = r[0], f = [i], o = 1, e = r.length; e > o; o++) (u = r[o]), n(u, i) > t && (f.push(u), (i = u));
    return i !== u && f.push(u), f;
  }
  function u(n, t, i, f, o) {
    for (var e, v = f, a = t + 1; i > a; a++) {
      var c = r(n[a], n[t], n[i]);
      c > v && ((e = a), (v = c));
    }
    v > f && (e - t > 1 && u(n, t, e, f, o), o.push(n[e]), i - e > 1 && u(n, e, i, f, o));
  }
  function i(n, r) {
    var t = n.length - 1,
      i = [n[0]];
    return u(n, 0, t, r, i), i.push(n[t]), i;
  }
  function f(n, r, u) {
    if (n.length <= 2) return n;
    var f = void 0 !== r ? r * r : 1;
    return (n = u ? n : t(n, f)), (n = i(n, f));
  }
  return f;
})();

/*
  https://github.com/mikolalysenko/cdt2d
  A robust 2D constrained Delaunay triangulation library written in JavaScript
  Copyright (c) 2015 Mikola Lysenko. The MIT License (MIT)
*/
cdt2d = (function () {
  "use strict";
  function r(r, n, t, e, a) {
    for (var u = a + 1; a >= e; ) {
      var o = (e + a) >>> 1,
        i = r[o],
        s = void 0 !== t ? t(i, n) : i - n;
      s >= 0 ? ((u = o), (a = o - 1)) : (e = o + 1);
    }
    return u;
  }
  function n(r, n, t, e, a) {
    for (var u = a + 1; a >= e; ) {
      var o = (e + a) >>> 1,
        i = r[o],
        s = void 0 !== t ? t(i, n) : i - n;
      s > 0 ? ((u = o), (a = o - 1)) : (e = o + 1);
    }
    return u;
  }
  function t(r, n, t, e, a) {
    for (var u = e - 1; a >= e; ) {
      var o = (e + a) >>> 1,
        i = r[o],
        s = void 0 !== t ? t(i, n) : i - n;
      0 > s ? ((u = o), (e = o + 1)) : (a = o - 1);
    }
    return u;
  }
  function e(r, n, t, e, a) {
    for (var u = e - 1; a >= e; ) {
      var o = (e + a) >>> 1,
        i = r[o],
        s = void 0 !== t ? t(i, n) : i - n;
      0 >= s ? ((u = o), (e = o + 1)) : (a = o - 1);
    }
    return u;
  }
  function a(r, n, t, e, a) {
    for (; a >= e; ) {
      var u = (e + a) >>> 1,
        o = r[u],
        i = void 0 !== t ? t(o, n) : o - n;
      if (0 === i) return u;
      0 >= i ? (e = u + 1) : (a = u - 1);
    }
    return -1;
  }
  function u(r, n, t, e, a, u) {
    return "function" == typeof t
      ? u(r, n, t, void 0 === e ? 0 : 0 | e, void 0 === a ? r.length - 1 : 0 | a)
      : u(r, n, void 0, void 0 === t ? 0 : 0 | t, void 0 === e ? r.length - 1 : 0 | e);
  }
  function o(r) {
    var n = { exports: {} };
    return r(n, n.exports), n.exports;
  }
  function i(r, n, t) {
    var e = r * n,
      a = K * r,
      u = a - r,
      o = a - u,
      i = r - o,
      s = K * n,
      f = s - n,
      h = s - f,
      v = n - h,
      l = e - o * h,
      c = l - i * h,
      p = c - o * v,
      g = i * v - p;
    return t ? ((t[0] = g), (t[1] = e), t) : [g, e];
  }
  function s(r, n) {
    var t = r + n,
      e = t - r,
      a = t - e,
      u = n - e,
      o = r - a,
      i = o + u;
    return i ? [i, t] : [t];
  }
  function f(r, n) {
    var t = 0 | r.length,
      e = 0 | n.length;
    if (1 === t && 1 === e) return s(r[0], n[0]);
    var a,
      u,
      o = t + e,
      i = Array(o),
      f = 0,
      h = 0,
      v = 0,
      l = Math.abs,
      c = r[h],
      p = l(c),
      g = n[v],
      d = l(g);
    d > p
      ? ((u = c), (h += 1), t > h && ((c = r[h]), (p = l(c))))
      : ((u = g), (v += 1), e > v && ((g = n[v]), (d = l(g)))),
      (t > h && d > p) || v >= e
        ? ((a = c), (h += 1), t > h && ((c = r[h]), (p = l(c))))
        : ((a = g), (v += 1), e > v && ((g = n[v]), (d = l(g))));
    for (var y, b, m, w, x, A = a + u, M = A - a, I = u - M, j = I, T = A; t > h && e > v; )
      d > p
        ? ((a = c), (h += 1), t > h && ((c = r[h]), (p = l(c))))
        : ((a = g), (v += 1), e > v && ((g = n[v]), (d = l(g)))),
        (u = j),
        (A = a + u),
        (M = A - a),
        (I = u - M),
        I && (i[f++] = I),
        (y = T + A),
        (b = y - T),
        (m = y - b),
        (w = A - b),
        (x = T - m),
        (j = x + w),
        (T = y);
    for (; t > h; )
      (a = c),
        (u = j),
        (A = a + u),
        (M = A - a),
        (I = u - M),
        I && (i[f++] = I),
        (y = T + A),
        (b = y - T),
        (m = y - b),
        (w = A - b),
        (x = T - m),
        (j = x + w),
        (T = y),
        (h += 1),
        t > h && (c = r[h]);
    for (; e > v; )
      (a = g),
        (u = j),
        (A = a + u),
        (M = A - a),
        (I = u - M),
        I && (i[f++] = I),
        (y = T + A),
        (b = y - T),
        (m = y - b),
        (w = A - b),
        (x = T - m),
        (j = x + w),
        (T = y),
        (v += 1),
        e > v && (g = n[v]);
    return j && (i[f++] = j), T && (i[f++] = T), f || (i[f++] = 0), (i.length = f), i;
  }
  function h(r, n, t) {
    var e = r + n,
      a = e - r,
      u = e - a,
      o = n - a,
      i = r - u;
    return t ? ((t[0] = i + o), (t[1] = e), t) : [i + o, e];
  }
  function v(r, n) {
    var t = r.length;
    if (1 === t) {
      var e = J(r[0], n);
      return e[0] ? e : [e[1]];
    }
    var a = Array(2 * t),
      u = [0.1, 0.1],
      o = [0.1, 0.1],
      i = 0;
    J(r[0], n, u), u[0] && (a[i++] = u[0]);
    for (var s = 1; t > s; ++s) {
      J(r[s], n, o);
      var f = u[1];
      N(f, o[0], u), u[0] && (a[i++] = u[0]);
      var h = o[1],
        v = u[1],
        l = h + v,
        c = l - h,
        p = v - c;
      (u[1] = l), p && (a[i++] = p);
    }
    return u[1] && (a[i++] = u[1]), 0 === i && (a[i++] = 0), (a.length = i), a;
  }
  function l(r, n) {
    var t = r + n,
      e = t - r,
      a = t - e,
      u = n - e,
      o = r - a,
      i = o + u;
    return i ? [i, t] : [t];
  }
  function c(r, n) {
    var t = 0 | r.length,
      e = 0 | n.length;
    if (1 === t && 1 === e) return l(r[0], -n[0]);
    var a,
      u,
      o = t + e,
      i = Array(o),
      s = 0,
      f = 0,
      h = 0,
      v = Math.abs,
      c = r[f],
      p = v(c),
      g = -n[h],
      d = v(g);
    d > p
      ? ((u = c), (f += 1), t > f && ((c = r[f]), (p = v(c))))
      : ((u = g), (h += 1), e > h && ((g = -n[h]), (d = v(g)))),
      (t > f && d > p) || h >= e
        ? ((a = c), (f += 1), t > f && ((c = r[f]), (p = v(c))))
        : ((a = g), (h += 1), e > h && ((g = -n[h]), (d = v(g))));
    for (var y, b, m, w, x, A = a + u, M = A - a, I = u - M, j = I, T = A; t > f && e > h; )
      d > p
        ? ((a = c), (f += 1), t > f && ((c = r[f]), (p = v(c))))
        : ((a = g), (h += 1), e > h && ((g = -n[h]), (d = v(g)))),
        (u = j),
        (A = a + u),
        (M = A - a),
        (I = u - M),
        I && (i[s++] = I),
        (y = T + A),
        (b = y - T),
        (m = y - b),
        (w = A - b),
        (x = T - m),
        (j = x + w),
        (T = y);
    for (; t > f; )
      (a = c),
        (u = j),
        (A = a + u),
        (M = A - a),
        (I = u - M),
        I && (i[s++] = I),
        (y = T + A),
        (b = y - T),
        (m = y - b),
        (w = A - b),
        (x = T - m),
        (j = x + w),
        (T = y),
        (f += 1),
        t > f && (c = r[f]);
    for (; e > h; )
      (a = g),
        (u = j),
        (A = a + u),
        (M = A - a),
        (I = u - M),
        I && (i[s++] = I),
        (y = T + A),
        (b = y - T),
        (m = y - b),
        (w = A - b),
        (x = T - m),
        (j = x + w),
        (T = y),
        (h += 1),
        e > h && (g = -n[h]);
    return j && (i[s++] = j), T && (i[s++] = T), s || (i[s++] = 0), (i.length = s), i;
  }
  function p(r, n, t, e, a) {
    (this.a = r), (this.b = n), (this.idx = t), (this.lowerIds = e), (this.upperIds = a);
  }
  function g(r, n, t, e) {
    (this.a = r), (this.b = n), (this.type = t), (this.idx = e);
  }
  function d(r, n) {
    var t = r.a[0] - n.a[0] || r.a[1] - n.a[1] || r.type - n.type;
    return t ? t : r.type !== V && (t = U(r.a, r.b, n.b)) ? t : r.idx - n.idx;
  }
  function y(r, n) {
    return U(r.a, r.b, n);
  }
  function b(r, n, t, e, a) {
    for (var u = H.lt(n, e, y), o = H.gt(n, e, y), i = u; o > i; ++i) {
      for (var s = n[i], f = s.lowerIds, h = f.length; h > 1 && U(t[f[h - 2]], t[f[h - 1]], e) > 0; )
        r.push([f[h - 1], f[h - 2], a]), (h -= 1);
      (f.length = h), f.push(a);
      for (var v = s.upperIds, h = v.length; h > 1 && U(t[v[h - 2]], t[v[h - 1]], e) < 0; )
        r.push([v[h - 2], v[h - 1], a]), (h -= 1);
      (v.length = h), v.push(a);
    }
  }
  function m(r, n) {
    var t;
    return (t = r.a[0] < n.a[0] ? U(r.a, r.b, n.a) : U(n.b, n.a, r.a))
      ? t
      : ((t = n.b[0] < r.b[0] ? U(r.a, r.b, n.b) : U(n.b, n.a, r.b)), t || r.idx - n.idx);
  }
  function w(r, n, t) {
    var e = H.le(r, t, m),
      a = r[e],
      u = a.upperIds,
      o = u[u.length - 1];
    (a.upperIds = [o]), r.splice(e + 1, 0, new p(t.a, t.b, t.idx, [o], u));
  }
  function x(r, n, t) {
    var e = t.a;
    (t.a = t.b), (t.b = e);
    var a = H.eq(r, t, m),
      u = r[a],
      o = r[a - 1];
    (o.upperIds = u.upperIds), r.splice(a, 1);
  }
  function A(r, n) {
    for (var t = r.length, e = n.length, a = [], u = 0; t > u; ++u) a.push(new g(r[u], null, V, u));
    for (var u = 0; e > u; ++u) {
      var o = n[u],
        i = r[o[0]],
        s = r[o[1]];
      i[0] < s[0]
        ? a.push(new g(i, s, X, u), new g(s, i, W, u))
        : i[0] > s[0] && a.push(new g(s, i, X, u), new g(i, s, W, u));
    }
    a.sort(d);
    for (
      var f = a[0].a[0] - (1 + Math.abs(a[0].a[0])) * Math.pow(2, -52),
        h = [new p([f, 1], [f, 0], -1, [], [], [], [])],
        v = [],
        u = 0,
        l = a.length;
      l > u;
      ++u
    ) {
      var c = a[u],
        y = c.type;
      y === V ? b(v, h, r, c.a, c.idx) : y === X ? w(h, r, c) : x(h, r, c);
    }
    return v;
  }
  function M(r, n) {
    (this.stars = r), (this.edges = n);
  }
  function I(r, n, t) {
    for (var e = 1, a = r.length; a > e; e += 2)
      if (r[e - 1] === n && r[e] === t) return (r[e - 1] = r[a - 2]), (r[e] = r[a - 1]), void (r.length = a - 2);
  }
  function j(r, n) {
    for (var t = Array(r), e = 0; r > e; ++e) t[e] = [];
    return new M(t, n);
  }
  function T(r, n, t, e, a, u) {
    var o = n.opposite(e, a);
    if (!(0 > o)) {
      if (e > a) {
        var i = e;
        (e = a), (a = i), (i = u), (u = o), (o = i);
      }
      n.isConstraint(e, a) || (rr(r[e], r[a], r[u], r[o]) < 0 && t.push(e, a));
    }
  }
  function q(r, n) {
    for (var t = [], e = r.length, a = n.stars, u = 0; e > u; ++u)
      for (var o = a[u], i = 1; i < o.length; i += 2) {
        var s = o[i];
        if (!(u > s || n.isConstraint(u, s))) {
          for (var f = o[i - 1], h = -1, v = 1; v < o.length; v += 2)
            if (o[v - 1] === s) {
              h = o[v];
              break;
            }
          0 > h || (rr(r[u], r[s], r[f], r[h]) < 0 && t.push(u, s));
        }
      }
    for (; t.length > 0; ) {
      for (var s = t.pop(), u = t.pop(), f = -1, h = -1, o = a[u], l = 1; l < o.length; l += 2) {
        var c = o[l - 1],
          p = o[l];
        c === s ? (h = p) : p === s && (f = c);
      }
      0 > f ||
        0 > h ||
        rr(r[u], r[s], r[f], r[h]) >= 0 ||
        (n.flip(u, s), T(r, n, t, f, u, h), T(r, n, t, u, h, f), T(r, n, t, h, s, f), T(r, n, t, s, f, h));
    }
  }
  function C(r, n, t, e, a, u, o) {
    (this.cells = r),
      (this.neighbor = n),
      (this.flags = e),
      (this.constraint = t),
      (this.active = a),
      (this.next = u),
      (this.boundary = o);
  }
  function F(r, n) {
    return r[0] - n[0] || r[1] - n[1] || r[2] - n[2];
  }
  function S(r, n) {
    for (var t = r.cells(), e = t.length, a = 0; e > a; ++a) {
      var u = t[a],
        o = u[0],
        i = u[1],
        s = u[2];
      s > i ? o > i && ((u[0] = i), (u[1] = s), (u[2] = o)) : o > s && ((u[0] = s), (u[1] = o), (u[2] = i));
    }
    t.sort(F);
    for (var f = Array(e), a = 0; a < f.length; ++a) f[a] = 0;
    var h = [],
      v = [],
      l = Array(3 * e),
      c = Array(3 * e),
      p = null;
    n && (p = []);
    for (var g = new C(t, l, c, f, h, v, p), a = 0; e > a; ++a)
      for (var u = t[a], d = 0; 3 > d; ++d) {
        var o = u[d],
          i = u[(d + 1) % 3],
          y = (l[3 * a + d] = g.locate(i, o, r.opposite(i, o))),
          b = (c[3 * a + d] = r.isConstraint(o, i));
        0 > y && (b ? v.push(a) : (h.push(a), (f[a] = 1)), n && p.push([i, o, -1]));
      }
    return g;
  }
  function O(r, n, t) {
    for (var e = 0, a = 0; a < r.length; ++a) n[a] === t && (r[e++] = r[a]);
    return (r.length = e), r;
  }
  function k(r, n, t) {
    var e = S(r, t);
    if (0 === n) return t ? e.cells.concat(e.boundary) : e.cells;
    for (
      var a = 1, u = e.active, o = e.next, i = e.flags, s = e.cells, f = e.constraint, h = e.neighbor;
      u.length > 0 || o.length > 0;

    ) {
      for (; u.length > 0; ) {
        var v = u.pop();
        if (i[v] !== -a) {
          (i[v] = a), s[v];
          for (var l = 0; 3 > l; ++l) {
            var c = h[3 * v + l];
            c >= 0 && 0 === i[c] && (f[3 * v + l] ? o.push(c) : (u.push(c), (i[c] = a)));
          }
        }
      }
      var p = o;
      (o = u), (u = p), (o.length = 0), (a = -a);
    }
    var g = O(s, i, n);
    return t ? g.concat(e.boundary) : g;
  }
  function E(r) {
    return [Math.min(r[0], r[1]), Math.max(r[0], r[1])];
  }
  function z(r, n) {
    return r[0] - n[0] || r[1] - n[1];
  }
  function B(r) {
    return r.map(E).sort(z);
  }
  function D(r, n, t) {
    return n in r ? r[n] : t;
  }
  function G(r, n, t) {
    Array.isArray(n) ? ((t = t || {}), (n = n || [])) : ((t = n || {}), (n = []));
    var e = !!D(t, "delaunay", !0),
      a = !!D(t, "interior", !0),
      u = !!D(t, "exterior", !0),
      o = !!D(t, "infinity", !1);
    if ((!a && !u) || 0 === r.length) return [];
    var i = Y(r, n);
    if (e || a !== u || o) {
      for (var s = Z(r.length, B(n)), f = 0; f < i.length; ++f) {
        var h = i[f];
        s.addTriangle(h[0], h[1], h[2]);
      }
      return e && nr(r, s), u ? (a ? (o ? tr(s, 0, o) : s.cells()) : tr(s, 1, o)) : tr(s, -1);
    }
    return i;
  }
  var H = {
      ge: function (n, t, e, a, o) {
        return u(n, t, e, a, o, r);
      },
      gt: function (r, t, e, a, o) {
        return u(r, t, e, a, o, n);
      },
      lt: function (r, n, e, a, o) {
        return u(r, n, e, a, o, t);
      },
      le: function (r, n, t, a, o) {
        return u(r, n, t, a, o, e);
      },
      eq: function (r, n, t, e, o) {
        return u(r, n, t, e, o, a);
      },
    },
    J = i,
    K = +(Math.pow(2, 27) + 1),
    L = f,
    N = h,
    P = v,
    Q = c,
    R = o(function (r) {
      function n(r, n) {
        for (var t = Array(r.length - 1), e = 1; e < r.length; ++e)
          for (var a = (t[e - 1] = Array(r.length - 1)), u = 0, o = 0; u < r.length; ++u) u !== n && (a[o++] = r[e][u]);
        return t;
      }
      function t(r) {
        for (var n = Array(r), t = 0; r > t; ++t) {
          n[t] = Array(r);
          for (var e = 0; r > e; ++e) n[t][e] = "m" + e + "[" + (r - t - 1) + "]";
        }
        return n;
      }
      function e(r) {
        return 1 & r ? "-" : "";
      }
      function a(r) {
        if (1 === r.length) return r[0];
        if (2 === r.length) return "sum(" + r[0] + "," + r[1] + ")";
        var n = r.length >> 1;
        return "sum(" + a(r.slice(0, n)) + "," + a(r.slice(n)) + ")";
      }
      function u(r) {
        if (2 === r.length)
          return ["sum(prod(" + r[0][0] + "," + r[1][1] + "),prod(-" + r[0][1] + "," + r[1][0] + "))"];
        for (var t = [], o = 0; o < r.length; ++o) t.push("scale(" + a(u(n(r, o))) + "," + e(o) + r[0][o] + ")");
        return t;
      }
      function o(r) {
        for (var e = [], o = [], i = t(r), s = [], f = 0; r > f; ++f)
          0 === (1 & f) ? e.push.apply(e, u(n(i, f))) : o.push.apply(o, u(n(i, f))), s.push("m" + f);
        var h = a(e),
          v = a(o),
          l = "orientation" + r + "Exact",
          c =
            "function " +
            l +
            "(" +
            s.join() +
            "){var p=" +
            h +
            ",n=" +
            v +
            ",d=sub(p,n);return d[d.length-1];};return " +
            l,
          p = Function("sum", "prod", "scale", "sub", c);
        return p(L, J, P, Q);
      }
      function i(r) {
        var n = g[r.length];
        return n || (n = g[r.length] = o(r.length)), n.apply(void 0, r);
      }
      function s() {
        for (; g.length <= f; ) g.push(o(g.length));
        for (var n = [], t = ["slow"], e = 0; f >= e; ++e) n.push("a" + e), t.push("o" + e);
        for (
          var a = ["function getOrientation(", n.join(), "){switch(arguments.length){case 0:case 1:return 0;"], e = 2;
          f >= e;
          ++e
        )
          a.push("case ", e, ":return o", e, "(", n.slice(0, e).join(), ");");
        a.push(
          "}var s=new Array(arguments.length);for(var i=0;i<arguments.length;++i){s[i]=arguments[i]};return slow(s);}return getOrientation"
        ),
          t.push(a.join(""));
        var u = Function.apply(void 0, t);
        r.exports = u.apply(void 0, [i].concat(g));
        for (var e = 0; f >= e; ++e) r.exports[e] = g[e];
      }
      var f = 5,
        h = 1.1102230246251565e-16,
        v = (3 + 16 * h) * h,
        l = (7 + 56 * h) * h,
        c = o(3),
        p = o(4),
        g = [
          function () {
            return 0;
          },
          function () {
            return 0;
          },
          function (r, n) {
            return n[0] - r[0];
          },
          function (r, n, t) {
            var e,
              a = (r[1] - t[1]) * (n[0] - t[0]),
              u = (r[0] - t[0]) * (n[1] - t[1]),
              o = a - u;
            if (a > 0) {
              if (0 >= u) return o;
              e = a + u;
            } else {
              if (!(0 > a)) return o;
              if (u >= 0) return o;
              e = -(a + u);
            }
            var i = v * e;
            return o >= i || -i >= o ? o : c(r, n, t);
          },
          function (r, n, t, e) {
            var a = r[0] - e[0],
              u = n[0] - e[0],
              o = t[0] - e[0],
              i = r[1] - e[1],
              s = n[1] - e[1],
              f = t[1] - e[1],
              h = r[2] - e[2],
              v = n[2] - e[2],
              c = t[2] - e[2],
              g = u * f,
              d = o * s,
              y = o * i,
              b = a * f,
              m = a * s,
              w = u * i,
              x = h * (g - d) + v * (y - b) + c * (m - w),
              A =
                (Math.abs(g) + Math.abs(d)) * Math.abs(h) +
                (Math.abs(y) + Math.abs(b)) * Math.abs(v) +
                (Math.abs(m) + Math.abs(w)) * Math.abs(c),
              M = l * A;
            return x > M || -x > M ? x : p(r, n, t, e);
          },
        ];
      s();
    }),
    U = R[3],
    V = 0,
    W = 1,
    X = 2,
    Y = A,
    Z = j,
    $ = M.prototype;
  ($.isConstraint = (function () {
    function r(r, n) {
      return r[0] - n[0] || r[1] - n[1];
    }
    var n = [0, 0];
    return function (t, e) {
      return (n[0] = Math.min(t, e)), (n[1] = Math.max(t, e)), H.eq(this.edges, n, r) >= 0;
    };
  })()),
    ($.removeTriangle = function (r, n, t) {
      var e = this.stars;
      I(e[r], n, t), I(e[n], t, r), I(e[t], r, n);
    }),
    ($.addTriangle = function (r, n, t) {
      var e = this.stars;
      e[r].push(n, t), e[n].push(t, r), e[t].push(r, n);
    }),
    ($.opposite = function (r, n) {
      for (var t = this.stars[n], e = 1, a = t.length; a > e; e += 2) if (t[e] === r) return t[e - 1];
      return -1;
    }),
    ($.flip = function (r, n) {
      var t = this.opposite(r, n),
        e = this.opposite(n, r);
      this.removeTriangle(r, n, t), this.removeTriangle(n, r, e), this.addTriangle(r, e, t), this.addTriangle(n, t, e);
    }),
    ($.edges = function () {
      for (var r = this.stars, n = [], t = 0, e = r.length; e > t; ++t)
        for (var a = r[t], u = 0, o = a.length; o > u; u += 2) n.push([a[u], a[u + 1]]);
      return n;
    }),
    ($.cells = function () {
      for (var r = this.stars, n = [], t = 0, e = r.length; e > t; ++t)
        for (var a = r[t], u = 0, o = a.length; o > u; u += 2) {
          var i = a[u],
            s = a[u + 1];
          t < Math.min(i, s) && n.push([t, i, s]);
        }
      return n;
    });
  var _ = o(function (r) {
      function n(r, n) {
        for (var t = Array(r.length - 1), e = 1; e < r.length; ++e)
          for (var a = (t[e - 1] = Array(r.length - 1)), u = 0, o = 0; u < r.length; ++u) u !== n && (a[o++] = r[e][u]);
        return t;
      }
      function t(r) {
        for (var n = Array(r), t = 0; r > t; ++t) {
          n[t] = Array(r);
          for (var e = 0; r > e; ++e) n[t][e] = "m" + e + "[" + (r - t - 2) + "]";
        }
        return n;
      }
      function e(r) {
        if (1 === r.length) return r[0];
        if (2 === r.length) return "sum(" + r[0] + "," + r[1] + ")";
        var n = r.length >> 1;
        return "sum(" + e(r.slice(0, n)) + "," + e(r.slice(n)) + ")";
      }
      function a(r, n) {
        if ("m" === r.charAt(0)) {
          if ("w" === n.charAt(0)) {
            var t = r.split("[");
            return "w" + n.substr(1) + "m" + t[0].substr(1);
          }
          return "prod(" + r + "," + n + ")";
        }
        return a(n, r);
      }
      function u(r) {
        return r & !0 ? "-" : "";
      }
      function o(r) {
        if (2 === r.length) return ["diff(" + a(r[0][0], r[1][1]) + "," + a(r[1][0], r[0][1]) + ")"];
        for (var t = [], i = 0; i < r.length; ++i) t.push("scale(" + e(o(n(r, i))) + "," + u(i) + r[0][i] + ")");
        return t;
      }
      function i(r, n) {
        for (var t = [], a = 0; n - 2 > a; ++a) t.push("prod(m" + r + "[" + a + "],m" + r + "[" + a + "])");
        return e(t);
      }
      function s(r) {
        for (var a = [], u = [], s = t(r), f = 0; r > f; ++f) (s[0][f] = "1"), (s[r - 1][f] = "w" + f);
        for (var f = 0; r > f; ++f) 0 === (1 & f) ? a.push.apply(a, o(n(s, f))) : u.push.apply(u, o(n(s, f)));
        for (var h = e(a), v = e(u), l = "exactInSphere" + r, c = [], f = 0; r > f; ++f) c.push("m" + f);
        for (var p = ["function ", l, "(", c.join(), "){"], f = 0; r > f; ++f) {
          p.push("var w", f, "=", i(f, r), ";");
          for (var g = 0; r > g; ++g) g !== f && p.push("var w", f, "m", g, "=scale(w", f, ",m", g, "[0]);");
        }
        p.push("var p=", h, ",n=", v, ",d=diff(p,n);return d[d.length-1];}return ", l);
        var d = Function("sum", "diff", "prod", "scale", p.join(""));
        return d(L, Q, J, P);
      }
      function f() {
        return 0;
      }
      function h() {
        return 0;
      }
      function v() {
        return 0;
      }
      function l(r) {
        var n = g[r.length];
        return n || (n = g[r.length] = s(r.length)), n.apply(void 0, r);
      }
      function c() {
        for (; g.length <= p; ) g.push(s(g.length));
        for (var n = [], t = ["slow"], e = 0; p >= e; ++e) n.push("a" + e), t.push("o" + e);
        for (
          var a = ["function testInSphere(", n.join(), "){switch(arguments.length){case 0:case 1:return 0;"], e = 2;
          p >= e;
          ++e
        )
          a.push("case ", e, ":return o", e, "(", n.slice(0, e).join(), ");");
        a.push(
          "}var s=new Array(arguments.length);for(var i=0;i<arguments.length;++i){s[i]=arguments[i]};return slow(s);}return testInSphere"
        ),
          t.push(a.join(""));
        var u = Function.apply(void 0, t);
        r.exports = u.apply(void 0, [l].concat(g));
        for (var e = 0; p >= e; ++e) r.exports[e] = g[e];
      }
      var p = 6,
        g = [f, h, v];
      c();
    }),
    rr = _[4],
    nr = q,
    tr = k,
    er = C.prototype;
  er.locate = (function () {
    var r = [0, 0, 0];
    return function (n, t, e) {
      var a = n,
        u = t,
        o = e;
      return (
        e > t ? n > t && ((a = t), (u = e), (o = n)) : n > e && ((a = e), (u = n), (o = t)),
        0 > a ? -1 : ((r[0] = a), (r[1] = u), (r[2] = o), H.eq(this.cells, r, F))
      );
    };
  })();
  var ar = G;
  return ar;
})();

module.exports = {
  simplify,
  cdt2d,
  tuple,
};
