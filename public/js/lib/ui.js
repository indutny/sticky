define([ 'util', 'ee2' ], function(util, EventEmitter) {
  var exports = {};

  function UI(options) {
    EventEmitter.call(this);

    this.options = options;

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
    this.zoneSize = options.zoneSize;
    this.cx = 0;
    this.cy = 0;

    // Nine zones
    this.zones = [];

    this.center = { x: 0, y: 0, z: 0 };
    this.centerProjection = this.project(this.center);
    this.player = null;
    this._changed = false;

    this.init();
  };
  util.inherits(UI, EventEmitter);
  exports.UI = UI;
  exports.create = function create(canvas, sprites) {
    return new UI(canvas, sprites);
  };

  UI.prototype.init = function init() {
    var self = this;

    // Resize UI on window resize
    function onresize() {
      var width = window.innerWidth,
          height = window.innerHeight;

      if (typeof self.options.maxWidth === 'number') {
        width = Math.min(width, self.options.maxWidth);
      }
      if (typeof self.options.maxHeight === 'number') {
        height = Math.min(height, self.options.maxHeight);
      }
      self.resize(width, height);
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

  UI.prototype.add = function add(item) {
    var zone = this.getZone(item.x, item.y, item.z);
    if (!zone) return;

    zone.add(item);
  };

  UI.prototype.resize = function resize(width, height) {
    this._changed = true;
    this.width = this.canvas.width = width;
    this.height = this.canvas.height = height;

    // Center canvas
    this.canvas.style.marginLeft = (window.innerWidth - width) / 2 + 'px';
    this.canvas.style.marginTop = (window.innerHeight - height) / 2 + 'px';
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

    this._timestamp = +new Date;

    this.ctx.save();
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.width, this.height);

    var centerZ = round(this.center.z);

    this.cx = round(this.width / 2 - this.centerProjection.x);
    this.cy = round(this.height / 2 - this.centerProjection.y);

    // Sort items in zones
    for (var i = 0; i < this.zones.length; i++) {
      this.zones[i].sort();
    }

    // Draw items in zones level-by-level
    for (var i = 5; i >= -5; i--) {
      if (i > 0) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.fillRect(0, 0, this.width, this.height);
      }

      for (var j = 0; j < this.zones.length; j++) {
        this.ctx.save();
        this.ctx.translate(this.cx, this.cy);
        this.zones[j].render(this.ctx, i + centerZ);
        this.ctx.restore();
      }
    }

    this.ctx.restore();
  };

  function round(x) {
    return Math.round(x);
  };

  UI.prototype.getItem = function getItem(id) {
    for (var i = 0; i < this.zones.length; i++) {
      var item = this.zones[i].getItem(id);
      if (item) return item;
    }
  };

  UI.prototype.getZone = function getZone(x, y, z) {
    for (var i = 0; i < this.zones.length; i++) {
      if (this.zones[i].containsRaw(x, y, z)) {
        return this.zones[i];
      }
    }

    return false;
  };

  UI.prototype.addZone = function addZone(zone) {
    zone.init(this);
    this.zones.push(zone);
  };

  UI.prototype._setCenter = function setCenter(x, y, z, zoneChanged) {
    this.center = { x: x, y: y, z: z};
    this.centerProjection = this.project(x, y, z);

    if (this.zones.length !== 0 && !zoneChanged) return;

    var configs = [
      [-1, -1, -1], [0, -1, -1], [1, -1, -1],
      [-1, 0, -1],  [0, 0, -1],  [1, 0, -1],
      [-1, 1, -1],  [0, 1, -1],  [1, 1, -1],
      [-1, -1, 0],  [0, -1, 0],  [1, -1, 0],
      [-1, 0, 0],   [0, 0, 0],   [1, 0, 0],
      [-1, 1, 0],   [0, 1, 0],   [1, 1, 0],
      [-1, -1, 1],  [0, -1, 1],  [1, -1, 1],
      [-1, 0, 1],   [0, 0, 1],   [1, 0, 1],
      [-1, 1, 1],   [0, 1, 1],   [1, 1, 1]
    ];

    x = Math.round(x / this.zoneSize) * this.zoneSize;
    y = Math.round(y / this.zoneSize) * this.zoneSize;
    z = Math.round(z / this.zoneSize) * this.zoneSize;

    if (this.zones.length === 0) {
      // Create inital zones

      for (var i = 0; i < configs.length; i++) {
        var conf = configs[i];
        this.addZone(new Zone(x + conf[0] * 2 * this.zoneSize,
                              y + conf[1] * 2 * this.zoneSize,
                              z + conf[2] * 2 * this.zoneSize));
      }

      // load new ones
      for (var i = 0; i < this.zones.length; i++) {
        var zone = this.zones[i];
        this.emit('zone:load', {
          lx: zone.lx,
          ly: zone.ly,
          lz: zone.lz,
          rx: zone.rx,
          ry: zone.ry,
          rz: zone.rz
        });
      }
    } else {
      var cx = this.player.zone.x,
          cy = this.player.zone.y,
          cz = this.player.zone.z;

      var valid = [],
          queue = [];

      // Create new zones
      for (var i = 0; i < configs.length; i++) {
        var zone,
            conf = configs[i],
            zx = cx + conf[0] * (this.zoneSize + 1),
            zy = cy + conf[1] * (this.zoneSize + 1),
            zz = cz + conf[2] * (this.zoneSize + 1),
            newx = cx + conf[0] * 2 * this.zoneSize,
            newy = cy + conf[1] * 2 * this.zoneSize,
            newz = cz + conf[2] * 2 * this.zoneSize;

        // Zone already exists
        if (!(zone = this.getZone(zx, zy, zz))) {
          zone = new Zone(newx, newy, newz);
          queue.push(zone);
          this.addZone(zone);
        }
        valid.push(zone);
      }

      // Remove invalid ones
      for (var i = 0; i < this.zones.length; i++) {
        if (valid.indexOf(this.zones[i]) !== -1) continue;
        this.zones.splice(i, 1);
        i--;
      }

      // load new ones
      for (var i = 0; i < queue.length; i++) {
        var zone = queue[i];
        this.emit('zone:load', {
          lx: zone.lx,
          ly: zone.ly,
          lz: zone.lz,
          rx: zone.rx,
          ry: zone.ry,
          rz: zone.rz
        });
      }
    }

    this.zones.sort(Zone.compare);
  };

  UI.prototype.setPlayer = function setPlayer(item) {
    this.player = item;

    // Reset zones
    this.zones = [];
    this._setCenter(item.x, item.y, item.z);
    this.add(item);
  };

  UI.prototype.handleMove = function handlePlayerMove(item) {
    var zoneChanged = false;

    // Move item to another zone (or remove it) if needed
    if (!item.zone.contains(item)) {
      zoneChanged = true;

      // Remove from it's current zone
      item.remove();

      // Readd to new zone (if any contains it)
      for (var i = 0; i < this.zones.length; i++) {
        if (this.zones[i].contains(item)) {
          this.zones[i].add(item);
          break;
        }
      }
    }

    // Set center and allocate new zones (if needed)
    if (this.player === item) {
      this._setCenter(this.player.x, this.player.y, this.player.z, zoneChanged);
    }
  };

  // Zone is a container of items
  function Zone(x, y, z) {
    EventEmitter.call(this);

    this.items = [];
    this.x = x;
    this.y = y;
    this.z = z;

    this.lx = 0;
    this.ly = 0;
    this.lz = 0;
    this.rx = 0;
    this.ry = 0;
    this.rz = 0;

    this.map = {};

    this.ui = null;
  };
  util.inherits(Zone, EventEmitter);
  exports.Zone = Zone;

  Zone.prototype.init = function init(ui) {
    this.ui = ui;

    // Left-top bounds
    this.lx = this.x - this.ui.zoneSize;
    this.ly = this.y - this.ui.zoneSize;
    this.lz = this.z - this.ui.zoneSize;

    // Right-bottom bounds
    this.rx = this.x + this.ui.zoneSize;
    this.ry = this.y + this.ui.zoneSize;
    this.rz = this.z + this.ui.zoneSize;
  };
  var obj = {};

  Zone.prototype.contains = function contains(item) {
    return this.containsRaw(item.rx, item.ry, item.rz);
  };

  Zone.prototype.containsRaw = function containsRaw(x, y, z) {
    return this.lx <= x && x < this.rx &&
           this.ly <= y && y < this.ry &&
           this.lz <= z && z < this.rz;
  };

  Zone.prototype.getItem = function getItem(id) {
    return this.map.hasOwnProperty(id) && this.map[id];
  };

  Zone.compare = function compare(a, b) {
    if (a.rz > b.rz) return -1;
    if (a.rz < b.rz) return 1;

    return a.rx + a.ry - b.rx - b.ry;
  };

  Zone.prototype.sort = function sort() {
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

  Zone.prototype.render = function render(ctx, z) {
    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];

      if (z !== item.rz) continue;

      ctx.save();

      var coverage;
      if (z <= this.ui.player.rz &&
          (coverage = item.coverage(this.ui.player))) {
        // Items covering player are transparent
        ctx.globalAlpha = coverage;
      }

      item.render(ctx);
      item.postRender();
      ctx.restore();
    }
  };

  Zone.prototype.add = function add(item) {
    if (this.map.hasOwnProperty(item.id)) return;

    item.init(this);
    this.insert(item);
    this.map[item.id] = item;
  };

  Zone.prototype.remove = function remove(item) {
    if (!this.map.hasOwnProperty(item.id)) return;

    var index = this.items.indexOf(item);
    if (index !== -1) this.items.splice(index, 1);
    delete this.map[item.id];
  };

  Zone.prototype.insert = function insert(item) {
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
  function Item(options) {
    EventEmitter.call(this);

    this.id = options.id;
    this._sortId = itemId++;
    this.rx = this.x = options.x;
    this.ry = this.y = options.y;
    this.rz = this.z = options.z;

    this.projectionX = 0;
    this.projectionY = 0;

    this.sprite = null;

    this.animation = [];
    this._io = null;
    this.zone = null;
    this.ui = null;
  };
  util.inherits(Item, EventEmitter);
  exports.Item = Item;

  Item.compare = function compare(a, b) {
    if (a.rz > b.rz) return -1;
    if (a.rz < b.rz) return 1;

    // If items on the same line - sort them by id
    // (just for comparison stability)
    if (a.rx + a.ry === b.rx + b.ry) return a._sortId - b._sortId;

    return Item.lineCompare(a, b);
  };

  Item.lineCompare = function lineCompare(a, b) {
    return a.rx + a.ry - b.rx - b.ry;
  };

  Item.prototype.init = function init(zone) {
    this.zone = zone;
    this.ui = zone.ui;
    this.setPosition(this.x, this.y, this.z);
  };

  Item.prototype.coverage = function coverage(item) {
    if (Item.lineCompare(this, item) <= 0) return false;

    var dx = this.projectionRX - item.projectionRX;
        dy = this.projectionRY - item.projectionRY,
        radius = dx * dx + dy * dy;

    if (radius > 9000) return 0;
    return (3000 + radius) / 18000;
  };

  Item.prototype.setPosition = function setPosition(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.rx = round(x);
    this.ry = round(y);
    this.rz = round(z);

    // Move map if player has moved
    this.ui.handleMove(this);

    var p = this.ui.project(x, y, z);
    this.projectionX = p.x;
    this.projectionY = p.y;

    var p = this.ui.project(this.rx, this.ry, this.rz);
    this.projectionRX = p.x;
    this.projectionRY = p.y;

    this.ui._changed = true;
  };
  Item.prototype._setPosition = Item.prototype.setPosition;

  Item.prototype.move = function move(dx, dy, dz) {
    this.setPosition(this.x + dx, this.y + dy, this.z + dz);
  };
  Item.prototype._move = Item.prototype.move;

  Item.prototype.animate = function animate(props, interval, callback) {
    var self = this;

    this.ui._changed = true;
    this.animation.push(new ItemAnimation(this, props, interval, callback));
  };

  Item.prototype.reset = function reset() {
    if (this.animation.length === 0) return;

    for (var i = 0; i < this.animation.length; i++) {
      var a = this.animation[i];
      a.init();
      a.end();
    }
    this.animation = [];
  };

  Item.prototype.render = function render(ctx) {
    // Nop
  };

  Item.prototype.postRender = function postRender() {
    // Apply animation
    if (this.animation.length === 0) return;

    while (this.animation.length !== 0) {
      var first = this.animation[0];

      // Set start positions
      first.init();

      if (first.start + first.interval <= this.ui._timestamp) {
        this.animation.shift();
        first.end();
        this.ui._changed = true;
        continue;
      }

      first.run(this.ui._timestamp);
      this.ui._changed = true;
      break;
    }
  };

  Item.prototype.command = function command(cmd, options, callback) {
    if (this._io) {
      this._io.emit('c:item:command', { id: this.id, cmd: cmd, args: options });
    }

    if (cmd === 'remove') {
      this.remove();
      if (callback) callback();
      return true;
    }

    return false;
  };

  Item.prototype.remove = function remove() {
    this.zone.remove(this);
  };

  Item.prototype.broadcast = function broadcast(io) {
    this._io = io;
  };

  function ItemAnimation(item, props, interval, callback) {
    this.item = item;

    this.props = props;
    this.sprite = props.sprite;
    this.startX = null;
    this.startY = null;
    this.startZ = null;
    this.x = null;
    this.y = null;
    this.z = null;

    this.start = null;
    this.interval = interval,

    this.callback = callback;
  };

  ItemAnimation.prototype.init = function init() {
    if (this.start !== null) return;

    this.start = +new Date;
    this.x = this.startX = this.item.x;
    this.y = this.startY = this.item.y;
    this.z = this.startZ = this.item.z;

    var names = [ 'x', 'y', 'z' ];

    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      if (this.props.hasOwnProperty(name)) {
        this[name] = this.props[name];
      } else if (this.props.hasOwnProperty('d' + name)) {
        this[name] += this.props['d' + name];
      }
    }
  };

  ItemAnimation.prototype.run = function run(timestamp) {
    var percent = (timestamp - this.start) / this.interval;

    this.item.setPosition(this.startX + (this.x - this.startX) * percent,
                          this.startY + (this.y - this.startY) * percent,
                          this.startZ + (this.z - this.startZ) * percent);
  };

  ItemAnimation.prototype.end = function end() {
    this.item.setPosition(this.x, this.y, this.z);
    if (this.sprite) this.item.sprite = this.sprite;
    if (this.callback) this.callback();
  };

  return exports;
});
