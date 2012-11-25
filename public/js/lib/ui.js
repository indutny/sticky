define(function() {
  var exports = {};

  function UI(options) {
    this.canvas = options.canvas;
    this.sprites = options.sprites;
    this.width = 1;
    this.height = 1;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.mozspritesmoothingEnabled = false;
    this.ctx.webkitspritesmoothingEnabled = false;
    this.ctx.msspritesmoothingEnabled = false;

    this.cellWidth = options.cellWidth;
    this.cellHeight = options.cellHeight;
    this.cx = 0;
    this.cy = 0;

    this.items = [];
    this.center = null;
    this.player = null;
    this._changed = false;

    this.init();
  };
  exports.UI = UI;
  exports.create = function create(canvas, sprites) {
    return new UI(canvas, sprites);
  };

  UI.prototype.init = function init() {
    var self = this;

    // Resize UI on window resize
    function onresize() {
      self.resize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onresize);
    onresize();

    // Draw animation
    var onframe = window.mozRequestAnimationFrame ||
                  window.webkitRequestAnimationFrame ||
                  window.msRequestAnimationFrame ||
                  window.RequestAnimationFrame;
    onframe(function render() {
      self.render();
      onframe(render);
    });
  };

  UI.prototype.resize = function resize(width, height) {
    this._changed = true;
    this.width = this.canvas.width = width;
    this.height = this.canvas.height = height;
  };

  UI.prototype.project = function project(x, y, z) {
    return {
      x: Math.round((x - y) * this.cellWidth / 2),
      y: Math.round((1.23 * z + (x + y) / 2) * this.cellHeight),
    };
  };

  UI.prototype.render = function render() {
    if (!this._changed) return;
    this._changed = false;

    this.ctx.save();
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();

    this.ctx.save();

    var center = this.project(this.center.x, this.center.y, this.center.z);
    this.cx = Math.round(this.width / 2 - center.x);
    this.cy = Math.round(this.height / 2 - center.y);

    this.ctx.translate(this.cx, this.cy);

    this.sortItems();
    this.renderItems();

    this.ctx.restore();
  };

  UI.prototype.sortItems = function sortItems() {
    var misses = [];
    for (var i = 0; i < this.items.length - 1; i++) {
      var current = this.items[i],
          next = this.items[i + 1];

      if (Item.compare(current, next) > 0) {
        misses.push(next);
        this.items.splice(i + 1, 1);
        i--;
      }
    }

    if (misses.length > 100) {
      this.items = this.items.concat(misses);
      this.items.sort(Item.compare);
    } else {
      for (var i = 0; i < misses.length; i++) {
        this.insert(misses[i]);
      }
    }
  };

  function round(x) {
    return Math.round(x);
  }

  UI.prototype.renderItems = function renderItems() {
    var firstZ = this.items[0] && this.items[0].rz || 0,
        lastZ = this.items[this.items.length - 1] &&
                this.items[this.items.length - 1].rz || 0,
        centerZ = round(this.center.z);

    if (firstZ < centerZ + 1) {
      firstZ = centerZ + 1;
    }

    var seenPlayer = false;

    document.location.hash = firstZ;
    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i],
          z = item.rz;

      // Maximum visible depth is limited
      if (z - centerZ  >= 5) continue;

      this.ctx.save();
      if (seenPlayer && this.covers(item, this.player)) {
        // Items covering player are transparent
        this.ctx.globalAlpha = 0.3;
      } else if (centerZ < z && firstZ > z) {
        // Apply shadow do items below player
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.fillRect(-this.cx, -this.cy,
                          this.width, this.height);
        this.ctx.restore();
        firstZ = z;
      }

      if (item === this.player) seenPlayer = true;

      item.render(this.ctx);
      this.ctx.restore();
    }
  };

  UI.prototype.covers = function covers(a, b) {
    if (Item.lineCompare(a, b) <= 0) return false;

    var dx = a.projectionRX - b.projectionRX;
        dy = a.projectionRY - b.projectionRY,
        radius = dx * dx + dy * dy;

    return radius < 9000;
  };

  UI.prototype.setCenter = function setCenter(x, y, z) {
    this.center = { x: x, y: y, z: z};
  };

  UI.prototype.setPlayer = function setPlayer(item) {
    this.player = item;
  };

  UI.prototype.add = function add(item) {
    item.init(this);
    this.insert(item);
  };

  UI.prototype.insert = function insert(item) {
    // Fast case
    if (this.items.length === 0) {
      this.items.push(item);
      return;
    }

    // Binary-search + insertion
    var i = 0,
        j = this.items.length - 1,
        middle = 0;

    while (i <= j) {
      middle = (i + j) >> 1;
      var cmp = Item.compare(item, this.items[middle]);

      if (cmp == 0) {
        break;
      } else if (cmp < 0) {
        j = middle - 1;
      } else {
        i = middle + 1;
      }
    }

    if (cmp > 0) {
      middle++;
    }

    // Insert
    this.items.splice(middle, 0, item);
  };

  var itemId = 0;
  function Item(x, y, z) {
    this._id = itemId++;
    this.x = x;
    this.y = y;
    this.z = z;
    this.rx = x;
    this.ry = y;
    this.rz = z;

    this.projectionX = 0;
    this.projectionY = 0;

    this.ui = null;
  };
  exports.Item = Item;

  Item.compare = function compare(a, b) {
    if (a.rz > b.rz) return -1;
    if (a.rz < b.rz) return 1;

    // If items on the same line - sort them by id
    // (just for comparison stability)
    if (a.rx + a.ry === b.rx + b.ry) return a._id - b._id;

    return Item.lineCompare(a, b);
  };

  Item.lineCompare = function lineCompare(a, b) {
    return a.rx + a.ry - b.rx - b.ry;
  };

  Item.prototype.init = function init(ui) {
    this.ui = ui;
    this.setPosition(this.x, this.y, this.z);
  };

  Item.prototype.setPosition = function setPosition(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.rx = round(x);
    this.ry = round(y);
    this.rz = round(z);

    // Move map if player has moved
    if (this === this.ui.player) this.ui.setCenter(this.x, this.y, this.z);

    var p = this.ui.project(x, y, z);
    this.projectionX = p.x;
    this.projectionY = p.y;

    var p = this.ui.project(this.rx, this.ry, this.rz);
    this.projectionRX = p.x;
    this.projectionRY = p.y;

    this.ui._changed = true;
  };

  Item.prototype.move = function move(dx, dy, dz) {
    this.setPosition(this.x + dx, this.y + dy, this.z + dz);
  };
  Item.prototype._move = Item.prototype.move;

  Item.prototype.render = function render(ctx) {
  };

  return exports;
});
