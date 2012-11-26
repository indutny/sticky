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
      zoneSize: 8,
      maxWidth: 800,
      maxHeight: 600
    });

    field.on('zone:load', function (lx, ly, lz, rx, ry, rz) {
      setTimeout(function() {
        if (lz + rz !== -8) return;

        for (var x = lx; x < rx; x++) {
          for (var y = ly; y < ry; y++) {
            var k = Math.random();
            field.add(block.create(x, y, 0, 'grass'));
          }
        }

        var xc = (lx + rx) >> 1,
            yc = (ly + ry) >> 1;

        // Create walls
        for (var x = lx; x < rx; x++) {
          if (x % 3) {
            field.add(block.create(x, yc, -1, 'block'));
            field.add(block.create(x, yc, -2, 'block'));
          }
          field.add(block.create(x, yc, -3, 'block'));
        }

        for (var y = ly; y < ry; y++) {
          if (y === 0) continue;
          if (y % 3) {
            field.add(block.create(xc, y, -1, 'block'));
            field.add(block.create(xc, y, -2, 'block'));
          }
          field.add(block.create(xc, y, -3, 'block'));
        }
      }, 600);
    });

    var p = player.create(0, 0, -4);
    field.setPlayer(p);

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
