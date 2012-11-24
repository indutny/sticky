define(function() {
  var exports = {};

  function inherits(a, b) {
    a.prototype = Object.create(b.prototype, {
      constructor: {
        value: a,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };

  // Isometric field prototype, responsible for rendering all items on the
  // screen.
  function IField(canvas, images) {
    this.canvas = canvas;
    this.images = images;
    this.width = 1;
    this.height = 1;

    this.ctx = canvas.getContext('2d');
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    this.cellWidth = 64;
    this.cellHeight = 32;

    this.items = [];
    this.center = null;

    this.s2 = Math.sqrt(2);
    this.s3 = Math.sqrt(3);
  };
  exports.IField = IField;
  exports.create = function create(canvas, images) {
    return new IField(canvas, images);
  };

  IField.prototype.resize = function resize(width, height) {
    this.width = this.canvas.width = width;
    this.height = this.canvas.height = height;
  };

  IField.prototype.project = function project(x, y, z) {
    return {
      x: Math.round((x - y) * this.cellWidth / 2),
      y: Math.round((1.23 * z + (x + y) / 2) * this.cellHeight),
    };
  };

  IField.prototype.render = function render() {
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

  IField.prototype.sortItems = function sortItems() {
    for (var i = 0; i < this.items.length - 1; i++) {
      var current = this.items[i],
          next = this.items[i + 1];

      if (Item.compare(current, next) > 0) {
        break;
      }
    }

    if (i !== this.items.length - 1) {
      this.items.sort(Block.compare);
    }
  };

  IField.prototype.renderItems = function renderItems() {
    var firstZ = (this.items[0] && this.items[0].z) | 0,
        lastZ = (this.items[this.items.length - 1] &&
                 this.items[this.items.length - 1].z) | 0;

    if (firstZ < this.center.z) {
      firstZ = this.center.z;
    }

    for (var i = 0; i < this.items.length; i++) {
      var block = this.items[i],
          z = block.z |  0;

      // Maximum visible depth is limited
      if (z - this.center.z  >= 4) continue;

      this.ctx.save();
      if (this.center.z - z > 0) {
        // Items above the player transparent
        this.ctx.globalAlpha = 0.2;
      } else if (this.center.z === z) {
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

  IField.prototype.setCenter = function setCenter(x, y, z) {
    this.center = { x: x, y: y, z: z};
  };

  IField.prototype.add = function add(item) {
    item.init(this);

    // Fast case
    if (this.items.length === 0) this.items.push(item);

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

  function Item(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this._x = null;
    this._y = null;
    this._z = null;
    this.point = null;
    this.field = null;
  };

  Item.compare = function compare(a, b) {
    var ax = a.x | 0,
        ay = a.y | 0,
        az = a.z | 0,
        bx = b.x | 0,
        by = b.y | 0,
        bz = b.z | 0;

    if (az > bz) return -1;
    if (az < bz) return 1;

    return ax - bx + ay - by;
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
    }
  };

  function Block(x, y, z, kind) {
    Item.call(this, x, y, z);

    this.width = 50;

    this.type = 'block';
    this.kind = kind;
  };
  inherits(Block, Item);

  exports.Block = Block;
  exports.createBlock = function createBlock(x, y, z, kind) {
    return new Block(x, y, z, kind);
  };

  Block.prototype.init = function init(field) {
    Item.prototype.init.call(this, field);
    this.image = field.images[this.kind] || field.images.block;
  };

  Block.prototype.render = function render(ctx) {
    Item.prototype.render.call(this, ctx);

    ctx.drawImage(this.image.elem,
                  this.point.x - 32,
                  this.point.y - 8,
                  this.image.width,
                  this.image.height);
  };

  function Player(x, y, z) {
    Item.call(this, x, y, z);
    this.type = 'player';
    this.state = 'normal';

    this.moving = false;
  };
  inherits(Player, Item);

  exports.Player = Player;
  exports.createPlayer = function createPlayer(x, y, z) {
    return new Player(x, y, z);
  };

  Player.prototype.init = function init(field) {
    Item.prototype.init.call(this, field);

    this.images = {
      normal: field.images.player,
      flying: field.images['player-flying']
    };
  };

  function animate(fn, times, interval, cb) {
    function run() {
      fn();
      if (--times > 0) return setTimeout(run, interval);
      cb();
    }
    run();
  };

  Player.prototype.move = function move(dx, dy, dz, cb) {
    var self = this;

    if (this.moving) {
      return;
    }
    this.moving = true;

    this.state = 'flying';
    animate(function() {
      self.z -= 0.03;
    }, 6, 15, function() {
      var times = 6;
      animate(function() {
        self.x += dx / times;
        self.y += dy / times;
        self.z += dz / times;
      }, times, 15, function() {
        self.state = 'normal';
        animate(function() {
          self.z += 0.06;
        }, 3, 15, function() {
          self.moving = false;

          cb && cb();
        });
      });
    });
  };

  Player.prototype.render = function render(ctx) {
    Item.prototype.render.call(this, ctx);

    ctx.drawImage(this.images[this.state].elem,
                  this.point.x - 32,
                  this.point.y - 32,
                  64,
                  64);
  };

  return exports;
});
