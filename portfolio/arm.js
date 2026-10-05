/* Hero drawing: a side view of a 4-axis arm that reaches toward your pointer.
   Inverse kinematics: the gripper points from the shoulder toward the target,
   the wrist sits one tool-length back from the target, and the shoulder/elbow
   are solved as a two-link arm (circle-circle intersection, elbow-up). */
(function () {
  var svg = document.getElementById("arm-svg");
  if (!svg) return;
  var area = document.querySelector("[data-ik-area]") || svg;
  var readout = document.getElementById("arm-readout");
  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var S = { x: 150, y: 286 };          // shoulder joint (joint2)
  var L1 = 135, L2 = 120, L3 = 62;     // upper arm, forearm, wrist-to-fingertip
  var FLOOR = 340;

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }

  // Static parts: grid, ground with hatching, base
  var grid = el("g", { "aria-hidden": "true" });
  for (var x = 0; x <= 520; x += 20) el("line", { x1: x, y1: 0, x2: x, y2: 360, "class": "ln-grid" }, grid);
  for (var y = 0; y <= 360; y += 20) el("line", { x1: 0, y1: y, x2: 520, y2: y, "class": "ln-grid" }, grid);
  el("line", { x1: 30, y1: 360, x2: 490, y2: 360, "class": "ln-ground" });
  for (var h = 36; h < 490; h += 12) el("line", { x1: h, y1: 360, x2: h - 9, y2: 371, "class": "ln-hatch" });
  el("rect", { x: 108, y: 318, width: 84, height: 42, "class": "base-body" });
  el("rect", { x: 98, y: 306, width: 104, height: 12, "class": "base-body" });

  // Moving parts
  function capsule(w) { return el("rect", { "class": "link-body", height: w, rx: w / 2, y: -w / 2, x: -w / 2 }); }
  var link1 = capsule(30), link2 = capsule(25);
  var tool = el("g", {});
  el("rect", { x: -9, y: -11, width: 30, height: 22, rx: 3, "class": "link-body" }, tool);   // wrist housing
  el("rect", { x: 21, y: -14, width: 10, height: 28, "class": "jaw" }, tool);                // palm
  el("rect", { x: 31, y: -14, width: L3 - 31, height: 7, "class": "jaw" }, tool);             // upper finger
  el("rect", { x: 31, y: 7, width: L3 - 31, height: 7, "class": "jaw" }, tool);               // lower finger
  var center = el("polyline", { "class": "ln-center" });
  function joint() {
    var g = el("g", {});
    el("circle", { r: 9, "class": "joint" }, g);
    el("line", { x1: -14, y1: 0, x2: 14, y2: 0, "class": "cmark" }, g);
    el("line", { x1: 0, y1: -14, x2: 0, y2: 14, "class": "cmark" }, g);
    return g;
  }
  var jS = joint(), jE = joint(), jW = joint();
  var target = el("g", { "aria-hidden": "true" });
  el("circle", { r: 7, "class": "target" }, target);
  el("line", { x1: -12, y1: 0, x2: 12, y2: 0, "class": "target" }, target);
  el("line", { x1: 0, y1: -12, x2: 0, y2: 12, "class": "target" }, target);

  function place(node, p, deg) {
    node.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ")" + (deg != null ? " rotate(" + deg.toFixed(2) + ")" : ""));
  }
  function setLink(rect, a, b) {
    var len = Math.hypot(b.x - a.x, b.y - a.y), w = +rect.getAttribute("height");
    rect.setAttribute("width", len + w);
    place(rect, a, Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI);
  }
  function deg(r) { return r * 180 / Math.PI; }
  function norm(d) { while (d > 180) d -= 360; while (d < -180) d += 360; return d; }

  function solve(T) {
    var t = { x: T.x, y: Math.min(T.y, FLOOR) };
    var dx = t.x - S.x, dy = t.y - S.y, dt = Math.hypot(dx, dy) || 1;
    var u = { x: dx / dt, y: dy / dt };                       // tool direction
    var W = { x: t.x - L3 * u.x, y: t.y - L3 * u.y };         // wrist center
    var wx = W.x - S.x, wy = W.y - S.y, d = Math.hypot(wx, wy) || 1;
    var dMax = L1 + L2 - 0.5, dMin = Math.abs(L1 - L2) + 25;
    var dc = Math.max(dMin, Math.min(dMax, d));
    W = { x: S.x + wx / d * dc, y: S.y + wy / d * dc };
    t = { x: W.x + L3 * u.x, y: W.y + L3 * u.y };
    var a = (L1 * L1 - L2 * L2 + dc * dc) / (2 * dc), hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    var ex = wx / d, ey = wy / d;
    var P = { x: S.x + a * ex, y: S.y + a * ey };
    var E1 = { x: P.x - hh * ey, y: P.y + hh * ex }, E2 = { x: P.x + hh * ey, y: P.y - hh * ex };
    var E = E1.y < E2.y ? E1 : E2;                            // elbow up
    return { E: E, W: W, tip: t, u: u };
  }

  function draw(T) {
    var s = solve(T);
    setLink(link1, S, s.E);
    setLink(link2, s.E, s.W);
    place(tool, s.W, deg(Math.atan2(s.u.y, s.u.x)));
    center.setAttribute("points", [S, s.E, s.W, s.tip].map(function (p) { return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" "));
    place(jS, S); place(jE, s.E); place(jW, s.W);
    place(target, T.y > FLOOR ? { x: T.x, y: FLOOR } : T);
    if (readout) {
      var a1 = deg(Math.atan2(-(s.E.y - S.y), s.E.x - S.x));
      var a2 = deg(Math.atan2(-(s.W.y - s.E.y), s.W.x - s.E.x));
      var a3 = deg(Math.atan2(-s.u.y, s.u.x));
      readout.textContent =
        "/joint2/target_angle: " + a1.toFixed(1) + "\n" +
        "/joint3/target_angle: " + norm(a2 - a1).toFixed(1) + "\n" +
        "/joint4/target_angle: " + norm(a3 - a2).toFixed(1);
    }
  }

  var goal = { x: 390, y: 214 }, cur = { x: goal.x, y: goal.y }, raf = 0;
  function tick() {
    var k = reduce ? 1 : 0.16;
    cur.x += (goal.x - cur.x) * k; cur.y += (goal.y - cur.y) * k;
    draw(cur);
    if (Math.abs(goal.x - cur.x) + Math.abs(goal.y - cur.y) > 0.3) raf = requestAnimationFrame(tick); else raf = 0;
  }
  function toSvg(e) {
    var m = svg.getScreenCTM(); if (!m) return null;
    var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(m.inverse());
  }
  function onMove(e) {
    var p = toSvg(e); if (!p) return;
    goal = { x: Math.max(20, Math.min(500, p.x)), y: Math.max(10, p.y) };
    if (!raf) raf = requestAnimationFrame(tick);
  }
  area.addEventListener("pointermove", onMove);
  area.addEventListener("pointerdown", onMove);
  draw(cur);
})();
