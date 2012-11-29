define([ 'util', 'ui' ], function(util, ui) {
  var exports = {};

  function Player(options) {
    ui.Item.call(this, options);
    this.type = 'player';
    this.moving = false;
    this.falling = false;
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
    if (Player.super_.prototype.command.call(this, cmd, options)) return true;

    if (cmd === 'move') {
      this.doMove(options, callback);

      return true;
    } else {
      return false;
    }
  };

  //
  // Move player
  //
  Player.prototype.doMove = function doMove(options, callback) {
    var self = this;

    if (this.ui.hasObstacle(this.rx + options.dx,
                            this.ry + options.dy,
                            this.rz + options.dz)) {
      if (options.dz === 0 && !this.ui.hasObstacle(this.rx + options.dx,
                                                   this.ry + options.dy,
                                                   this.rz - 1)) {
        // Go "upstairs"
        options.dz = -1;
      } else {
        // Can't move into obstacle
        if (callback) callback();
        return;
      }
    }

    this.moving = true;
    this.reset();
    this.animate({ dz: -0.3, sprite: this.sprites.flying }, 120);
    this.animate({ dx: options.dx, dy: options.dy, dz: options.dz }, 150);
    this.animate({ dz: 0.3, sprite: this.sprites.normal }, 60, function() {
      self.moving = false;
      self.gravitation(callback);
    });
  };

  //
  // Apply gravitation
  //
  Player.prototype.gravitation = function gravitation(callback) {
    if (this.falling) return;

    var grnd,
        x = this.rx,
        y = this.ry,
        z = this.rz;

    // Find closest ground
    for (var i = 1; !(grnd = this.ui.hasObstacle(x, y, z + i)); i++) {
    }

    // If object is already on the ground - invoke callback
    if (grnd.rz === z + 1) {
      if (callback) callback();
      return;
    }

    // Animate fall
    var self = this;
    this.falling = true;
    var dz = grnd.rz - z - 1;
    this.animate({ dz: dz }, dz * 200, function() {
      self.falling = false;

      // Apply gravitation again (useful if we're falling through multiple zones
      self.gravitation(callback);
    });
  };

  return exports;
});
