!function() {
  requirejs.config({
    baseUrl: '/js'
  });

  // Load all images first
  var images = {
        block: '/img/block.png',
        grass: '/img/grass_block.png',
        player: '/img/player.png',
        'player-flying': '/img/player-flying.png'
      },
      imageMap = {};

  var left = Object.keys(images).length;
  Object.keys(images).forEach(function(key) {
    var img = new Image(),
        once = false;

    imageMap[key] = {
      width: 0,
      height: 0,
      elem: img
    };

    img.onload = function onload() {
      if (once) return;
      once = true;

      imageMap[key].width = img.width;
      imageMap[key].height = img.height;
      if (--left === 0) return onImages();
    };
    img.src = images[key];
  });

  // Load field
  function onImages() {
    requirejs(['ifield'], function(ifield) {
      var field = ifield.create(document.getElementById('field'), imageMap);
      field.setCenter(0, 0, -1);

      var w = 25;
      for (var x = -w; x < w; x++) {
        for (var y = -w; y < w; y++) {
          var k = Math.random();
          field.add(ifield.createBlock(x, y, 0, k > 0.5 ? 'grass' : 'block'));
        }
      }

      for (var x = -w; x < w; x++) {
        field.add(ifield.createBlock(x, -2, -1, 'block'));
        field.add(ifield.createBlock(x, -2, -2, 'block'));
        field.add(ifield.createBlock(x, -2, -3, 'block'));
      }

      var player = ifield.createPlayer(0, 0, -1);
      field.add(player);

      window.addEventListener('keydown', function(e) {
        var code = e.keyCode;

        function cb() {
          field.setCenter(player.x, player.y, player.z);
        }

        if (code === 37) {
          player.move(-1, 0, 0, cb);
        } else if (code === 39) {
          player.move(1, 0, 0, cb);
        } else if (code == 38) {
          player.move(0, -1, 0, cb);
        } else if (code == 40) {
          player.move(0, 1, 0,cb );
        } else {
          return;
        }

        e.preventDefault();
      }, true);

      // Resize field with window
      function onresize() {
        field.resize(window.innerWidth, window.innerHeight);
      }
      window.addEventListener('resize', onresize);
      onresize();

      // Draw animation
      var onframe = window.mozRequestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    window.RequestAnimationFrame;
      onframe(function render() {
        field.render();
        onframe(render);
      });
    });
  }
}();
