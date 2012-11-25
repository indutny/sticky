require.config({
  baseUrl: '/js/lib'
});

// Load field
require([
    'sprites',
    'ui',
    'player',
    'block'
], function(sprites, ui, player, block) {
  // Load all sprites first
  sprites.load(function onsprites(sprites) {
    var field = ui.create({
      canvas: document.getElementById('field'),
      sprites: sprites,
      cellWidth: 64,
      cellHeight: 32,
      zoneSize: 4
    });

    var p = player.create(1, 1, -1);
    field.setPlayer(p);

    var w = 100;
    for (var x = -w + 1; x < w; x++) {
      for (var y = -w + 1; y < w; y++) {
        var k = Math.random();
        field.add(block.create(x, y, 0, ((x + y) % 3) ? 'grass' : 'block'));
      }
    }

    for (var x = -w + 1; x < w; x++) {
      if (x % 3) {
        field.add(block.create(x, 0, -1, 'block'));
        field.add(block.create(x, 0, -2, 'block'));
      }
      field.add(block.create(x, 0, -3, 'block'));
      if (x !== 0) {
        if (x % 3) {
          field.add(block.create(0, x, -1, 'block'));
          field.add(block.create(0, x, -2, 'block'));
        }
        field.add(block.create(0, x, -3, 'block'));
      }
    }

    window.addEventListener('keydown', function onkeydown(e) {
      var code = e.keyCode;

      if (code === 37) {
        p.move(-1, 0, 0);
      } else if (code === 39) {
        p.move(1, 0, 0);
      } else if (code == 38) {
        p.move(0, -1, 0);
      } else if (code == 40) {
        p.move(0, 1, 0);
      } else if (code == 32) {
        p.move(0, 0, -1);
      } else if (code == 13) {
        p.move(0, 0, 1);
      } else {
        return;
      }

      e.preventDefault();
    }, true);
  });
});
