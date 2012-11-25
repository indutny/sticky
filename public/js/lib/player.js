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

  Player.prototype.init = function init(zone) {
    Player.super_.prototype.init.call(this, zone);

    this.sprites = {
      normal: this.ui.sprites.player,
      flying: this.ui.sprites['player-flying']
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
      self._move(0, 0, -0.03);
    }, 6, 30, function() {
      var times = 6;
      animate(function() {
        self._move(dx / times, dy / times, dz / times);
      }, times, 30, function() {
        self.state = 'normal';
        animate(function() {
          self._move(0, 0, 0.06);
        }, 3, 30, function() {
          self.setPosition(endX, endY, endZ);
          self.moving = false;
        });
      });
    });
  };

  Player.prototype.render = function render(ctx) {
    Player.super_.prototype.render.call(this, ctx);

    ctx.drawImage(this.sprites[this.state].elem,
                  this.projectionX - 32,
                  this.projectionY - 12,
                  this.sprites[this.state].width,
                  this.sprites[this.state].height);
  };

  return exports;
});
