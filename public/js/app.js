require.config({
  baseUrl: '/js/lib'
});

// Load field
require([
    'sprites',
    'ui',
    'player',
    'block',
    '/socket.io/socket.io.js'
], function(sprites, ui, players, blocks, io) {
  io = io.connect();

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

    var p = null;

    function onItem(options, self) {
      if (p && options.id === p.id) return;

      if (options.type === 'player') {
        var player = players.create(options);

        // Init player
        if (self) {
          if (p) p.remove();
          p = player;
          field.setPlayer(p);

          // Broadcast all commands
          p.broadcast(io);
          return;
        }

        field.add(player);
      } else if (options.type === 'block') {
        field.add(blocks.create(options));
      }
    };
    io.on('s:item:new', onItem);

    io.on('s:items:new', function(items) {
      items.forEach(function(item) {
        onItem(item);
      });
    });

    io.on('s:item:command', function(options) {
      if (p && options.id === p.id) return;

      var item = field.getItem(options.id);
      if (!item) return;
      item.command(options.cmd, options.args);
    });

    field.on('zone:load', function (options) {
      io.emit('c:zone:load', options);
    });

    var moving = false;
    window.addEventListener('keydown', function onkeydown(e) {
      var code = e.keyCode;

      if (p === null || moving) return;
      moving = true;

      function release() {
        moving = false;
      };

      if (code === 37) {
        p.command('move', { dx: -1, dy: 0, dz: 0 }, release);
      } else if (code === 39) {
        p.command('move', { dx: 1, dy: 0, dz: 0 }, release);
      } else if (code == 38) {
        p.command('move', { dx: 0, dy: -1, dz: 0 }, release);
      } else if (code == 40) {
        p.command('move', { dx: 0, dy: 1, dz: 0 }, release);
      } else if (code == 32) {
        p.command('move', { dx: 0, dy: 0, dz: -1 }, release);
      } else if (code == 13) {
        p.command('move', { dx: 0, dy: 0, dz: 1 }, release);
      } else {
        release();
        return;
      }

      e.preventDefault();
    }, true);
  });
});
