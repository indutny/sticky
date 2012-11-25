define(function() {
  var exports = {};

  function UI(canvas, sprites) {
    this.canvas = canvas;
    this.sprites = sprites;
    this.width = 1;
    this.height = 1;

    this.ctx = canvas.getContext('2d');
    this.ctx.mozspritesmoothingEnabled = false;
    this.ctx.webkitspritesmoothingEnabled = false;
    this.ctx.msspritesmoothingEnabled = false;

    this.cellWidth = 64;
    this.cellHeight = 32;

    this.items = [];
    this.center = null;

    this.init();
  };
  exports.UI = UI;
  exports.create = function create(canvas, sprites) {
    return new UI(canvas, sprites);
  };

  UI.prototype.init = function init() {
    var self = this;

    // Resize field with window
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
    this.ctx.save();
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();

    this.ctx.save();

    var center = this.project(this.center.x, this.center.y, this.center.z);
    var cx = Math.round(this.width / 2 - center.x);
    var cy = Math.round(this.height / 2 - center.y);

    this.ctx.translate(cx, cy);

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
        misses.push(current);
        this.items.splice(i, 1);
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
    return x > 0 ? (x | 0) : -((-x) | 0);
  }

  UI.prototype.renderItems = function renderItems() {
    var firstZ = round(this.items[0] && this.items[0].z || 0),
        lastZ = round(this.items[this.items.length - 1] &&
                          this.items[this.items.length - 1].z || 0),
        centerZ = round(this.center.z);

    if (firstZ < centerZ + 1) {
      firstZ = centerZ + 1;
    }

    document.location.hash = firstZ;
    for (var i = 0; i < this.items.length; i++) {
      var block = this.items[i],
          z = round(block.z);

      // Maximum visible depth is limited
      if (z - centerZ  >= 5) continue;

      this.ctx.save();
      if (centerZ - z > 0) {
        // Items above the player transparent
        this.ctx.globalAlpha = 0.4;
      } else if (centerZ === z) {
        // Items above the player transparent
      } else if (firstZ != z) {
        // Apply shadow
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.fillRect(-this.width / 2, -this.height / 2,
                          this.width, this.height);
        this.ctx.restore();
        firstZ = z;
      }

      block.render(this.ctx);
      this.ctx.restore();
    }
  };

  UI.prototype.setCenter = function setCenter(x, y, z) {
    this.center = { x: x, y: y, z: z};
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
    this.id = itemId++;
    this.x = x;
    this.y = y;
    this.z = z;
    this._x = null;
    this._y = null;
    this._z = null;
    this.point = null;
    this.field = null;

    this.onmove = null;
  };
  exports.Item = Item;

  Item.compare = function compare(a, b) {
    var ax = round(a.x),
        ay = round(a.y),
        az = round(a.z),
        bx = round(b.x),
        by = round(b.y),
        bz = round(b.z);

    if (az > bz) return -1;
    if (az < bz) return 1;

    // If items on the same line - sort them by id
    // (just for comparison stability)
    if (ax + ay === bx + by) return a.id - b.id;

    return ax + ay - bx - by;
  };

  Item.prototype.init = function init(field) {
    this.field = field;
  };

  Item.prototype.render = function render(ctx) {
    // Use cached projection if not changed
    if (this._x !== this.x || this._y !== this.y || this._z !== this.z) {
      this.point = this.field.project(this.x, this.y, this.z);
      this._x = this.x;
      this._y = this.y;
      this._z = this.z;

      // Emit onmove
      if (this.onmove) this.onmove();
    }
  };

  return exports;
});
