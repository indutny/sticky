define([ 'util', 'ui' ], function(util, ui) {
  var exports = {};

  function Player(x, y, z) {
    ui.Item.call(this, x, y, z);
    this.type = 'player';
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
    this.sprite = this.sprites.normal;
  };

  Player.prototype.move = function move(dx, dy, dz) {
    var self = this;
    if (this.moving) return;
    this.moving = true;

    this.animate({ dz: -0.3, sprite: this.sprites.flying }, 120);
    this.animate({ dx: dx, dy: dy, dz: dz }, 150);
    this.animate({ dz: 0.3, sprite: this.sprites.normal }, 60, function() {
      self.moving = false;
    });
  };

  Player.prototype.render = function render(ctx) {
    Player.super_.prototype.render.call(this, ctx);

    ctx.drawImage(this.sprite.elem,
                  this.projectionX - 32,
                  this.projectionY - 12,
                  this.sprite.width,
                  this.sprite.height);
  };

  return exports;
});
