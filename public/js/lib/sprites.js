define(function() {
  var exports = {};

  var spriteUrls = {
        block: '/img/block.png',
        grass: '/img/grass_block.png',
        player: '/img/player.png',
        'player-flying': '/img/player-flying.png'
      },
      spriteIds = Object.keys(spriteUrls),
      sprites = {};

  var left = spriteIds.length;
  spriteIds.forEach(function(id) {
    var img = new Image(),
        once = false;

    sprites[id] = {
      width: 0,
      height: 0,
      elem: img
    };

    img.onload = function onload() {
      if (once) return;
      once = true;

      sprites[id].width = img.width;
      sprites[id].height = img.height;
      if (--left === 0) return onSprites();
    };
    img.src = spriteUrls[id];
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
