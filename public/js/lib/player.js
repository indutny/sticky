define([ 'util', 'ui' ], function(util, ui) {
  var exports = {};

  function Player(options) {
    ui.Item.call(this, options);
    this.type = 'player';
  };
  util.inherits(Player, ui.Item);

  exports.Player = Player;
  exports.create = function create(options) {
    return new Player(options);
  };

  Player.prototype.init = function init(zone) {
    Player.super_.prototype.init.call(this, zone);

    this.sprites = {
      normal: this.ui.sprites.player,
      flying: this.ui.sprites['player-flying']
    };
    this.sprite = this.sprites.normal;
  };

  // Execute remote command
  Player.prototype.command = function command(cmd, options, callback) {
    if (Player.super_.prototype.command.call(this, cmd, options)) return;

    var self = this;

    if (cmd === 'move') {
      this.reset();
      this.animate({ dz: -0.3, sprite: this.sprites.flying }, 120);
      this.animate({ dx: options.dx, dy: options.dy, dz: options.dz }, 150);
      this.animate({ dz: 0.3, sprite: this.sprites.normal }, 60, callback);
    } else {
      return;
    }
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
