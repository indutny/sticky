!function() {
  requirejs.config({
    baseUrl: '/js'
  });

  // Load all images first
  var images = {
        block: '/img/block.png',
        grass: '/img/grass_block.png'
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
      field.setCenter(0, 0);

      for (var x = -25; x < 25; x++) {
        for (var y = -25; y < 25; y++) {
          var k = Math.random();
          field.addBlock(ifield.createBlock(x, y, k > 0.8 ? 1 : 0, 'grass'));
        }
      }

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
