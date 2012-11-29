define([ 'util', 'ui' ], function(util, ui) {
  var exports = {};

  function Block(options) {
    ui.Item.call(this, options);

    this.width = 50;

    this.type = 'block';
    this.sprite = null;
    this.kind = options.kind;
    this.obstacle = true;
  };
  util.inherits(Block, ui.Item);

  exports.Block = Block;
  exports.create = function create(options) {
    return new Block(options);
  };

  Block.prototype.init = function init(zone) {
    Block.super_.prototype.init.call(this, zone);
    this.sprite = this.ui.sprites[this.kind] || this.ui.sprites.block;
  };

  return exports;
});
