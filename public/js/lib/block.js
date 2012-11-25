define([ 'util', 'ui' ], function(util, ui) {
  var exports = {};

  function Block(x, y, z, kind) {
    ui.Item.call(this, x, y, z);

    this.width = 50;

    this.type = 'block';
    this.kind = kind;
  };
  util.inherits(Block, ui.Item);

  exports.Block = Block;
  exports.create = function create(x, y, z, kind) {
    return new Block(x, y, z, kind);
  };

  Block.prototype.init = function init(ui) {
    Block.super_.prototype.init.call(this, ui);
    this.image = ui.sprites[this.kind] || ui.sprites.block;
  };

  Block.prototype.render = function render(ctx) {
    Block.super_.prototype.render.call(this, ctx);
    ctx.drawImage(this.image.elem,
                  this.projectionX - 32,
                  this.projectionY - 16,
                  this.image.width,
                  this.image.height);
  };

  return exports;
});
