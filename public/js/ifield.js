define(function() {
  var exports = {};

  // Isometric field prototype, responsible for rendering all blocks on the
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

    this.blocks = [];
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
    this.ctx.clearRect(0, 0, this.width, this.height);

    var center = this.project(this.center.x, this.center.y, 0);
    var cx = Math.round(this.width / 2 - center.x);
    var cy = Math.round(this.height / 2 - center.y);
    this.ctx.translate(cx, cy);

    this.blocks.forEach(function(block) {
      this.ctx.save();
      block.render(this.ctx, this);
      this.ctx.restore();
    }, this);

    this.ctx.restore();
  };

  IField.prototype.setCenter = function setCenter(x, y, z) {
    this.center = { x: x, y: y, z: z};
  };

  IField.prototype.addBlock = function addBlock(block) {
    block.init(this, this.gl);
    this.blocks.push(block);
  };

  function Block(x, y, z, kind) {
    this.width = 50;

    this.x = x;
    this.y = y;
    this.z = z;

    this.vertices = null;
    this.colors = null;

    this.field = null;
    this.kind = kind;
  };
  exports.Block = Block;
  exports.createBlock = function createBlock(x, y, z, kind) {
    return new Block(x, y, z, kind);
  };

  Block.prototype.init = function init(field, gl) {
    this.field = field;
    this.image = field.images[this.kind] || field.images.block;
  };

  Block.prototype.render = function render(ctx, field) {
    var p = field.project(this.x, this.y, this.z);

    this.z += (Math.random() - 0.49999999) / 42;
    ctx.drawImage(this.image.elem,
                  p.x - 32,
                  p.y - 8,
                  this.image.width,
                  this.image.height);
  };

  return exports;
});
