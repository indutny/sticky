define([ 'util', 'ui' ], function(util, ui) {
  var exports = {};

  function Player(x, y, z) {
    ui.Item.call(this, x, y, z);
    this.type = 'player';
    this.state = 'normal';

    this.moving = false;
  };
  util.inherits(Player, ui.Item);

  exports.Player = Player;
  exports.create = function create(x, y, z) {
    return new Player(x, y, z);
  };

  Player.prototype.init = function init(ui) {
    Player.super_.prototype.init.call(this, ui);

    this.sprites = {
      normal: ui.sprites.player,
      flying: ui.sprites['player-flying']
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

  Player.prototype.move = function move(dx, dy, dz) {
    var self = this;

    if (this.moving) {
      return;
    }
    this.moving = true;

    var endX = self.x + dx,
        endY = self.y + dy,
        endZ = self.z + dz;

    this.state = 'flying';
    animate(function() {
      self.z -= 0.03;
    }, 6, 30, function() {
      var times = 6;
      animate(function() {
        self.x += dx / times;
        self.y += dy / times;
        self.z += dz / times;
      }, times, 30, function() {
        self.state = 'normal';
        animate(function() {
          self.z += 0.06;
        }, 3, 30, function() {
          self.x = endX;
          self.y = endY;
          self.z = endZ;
          self.moving = false;
        });
      });
    });
  };

  Player.prototype.render = function render(ctx) {
    Player.super_.prototype.render.call(this, ctx);

    ctx.drawImage(this.sprites[this.state].elem,
                  this.point.x - 32,
                  this.point.y - 12,
                  this.sprites[this.state].width,
                  this.sprites[this.state].height);
  };

  return exports;
});
