define(function() {
  var exports = {};

  var spriteUrls = {
        block: '/img/block.png#32x16',
        grass: '/img/grass_block.png#32x16',
        player: '/img/player.png#32x12',
        'player-flying': '/img/player-flying.png#32x12'
      },
      spriteIds = Object.keys(spriteUrls),
      sprites = {};

  var left = spriteIds.length;
  spriteIds.forEach(function(id) {
    var img = new Image(),
        match = spriteUrls[id].match(/^(.*)#(\d+)x(\d+)$/),
        once = false;

    sprites[id] = {
      width: 0,
      height: 0,
      x: parseInt(match[2], 10),
      y: parseInt(match[3], 10),
      elem: img
    };

    img.onload = function onload() {
      if (once) return;
      once = true;

      sprites[id].width = img.width;
      sprites[id].height = img.height;
      if (--left === 0) return onSprites();
    };
    img.src = match[1];
  });

  var loaded = false,
      callbacks = [];
  function onSprites() {
    if (loaded) return;
    loaded = true;

    callbacks.forEach(function(callback) {
      callback(sprites);
    });
    callbacks = null;
  };

  exports.load = function load(callback) {
    if (loaded) return callback(sprites);

    callbacks.push(callback);
  };

  return exports;
});
