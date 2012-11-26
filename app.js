var http = require('http'),
    connect = require('connect'),
    socketio = require('socket.io');

var app = connect();

app.use(connect.staticCache());
app.use(connect.static(__dirname + '/public'));

var server = http.createServer(app);

var io = socketio.listen(server);

// No logging in production
if (process.env.NODE_ENV === 'production') {
  io.disable('log');
}

io.sockets.on('connection', function(client) {
  var player = {
    type: 'player',
    id: client.id,
    x: 0,
    y: 0,
    z: -4
  };
  client.info = { player: player };

  client.on('disconnect', function() {
    io.sockets.emit('s:item:command', {
      id: player.id,
      cmd: 'remove'
    });
  });

  // Send client's player to itself
  client.emit('s:item:new', player, true);

  var players = [];
  // Send all players to client
  Object.keys(io.sockets.sockets).forEach(function(id) {
    if (id === client.id) return;
    io.sockets.sockets[id].emit('s:item:new', player);

    players.push(io.sockets.sockets[id].info.player);
  });

  client.emit('s:items:new', players);

  client.on('c:item:command', function(options) {
    if (options.id !== client.id) return;

    if (io.sockets.sockets[options.id]) {
      var player = io.sockets.sockets[options.id].info.player;

      if (options.cmd === 'move') {
        player.x += options.args.dx;
        player.y += options.args.dy;
        player.z += options.args.dz;
      }
    }
    io.sockets.emit('s:item:command', options);
  });

  // Stub for zone loading
  client.on('c:zone:load', function(zone) {
    // Only one level exists so far
    if (zone.lz + zone.rz !== 0) return;

    var blocks = [];
    function sendBlock(x, y, z, kind) {
      blocks.push({
        id: Math.random(),
        type: 'block',
        kind: kind,
        x: x,
        y: y,
        z: z
      });
    };

    for (var x = zone.lx; x < zone.rx; x++) {
      for (var y = zone.ly; y < zone.ry; y++) {
        sendBlock(x, y, 0, 'grass');
      }
    }

    var xc = (zone.lx + zone.rx) >> 1,
        yc = (zone.ly + zone.ry) >> 1;

    // Create walls
    for (var x = zone.lx; x < zone.rx; x++) {
      if (x % 3) {
        sendBlock(x, yc, -1, 'block');
        sendBlock(x, yc, -2, 'block');
      }
      sendBlock(x, yc, -3, 'block');
    }

    for (var y = zone.ly; y < zone.ry; y++) {
      if (y === 0) continue;
      if (y % 3) {
        sendBlock(xc, y, -1, 'block');
        sendBlock(xc, y, -2, 'block');
      }
      sendBlock(xc, y, -3, 'block');
    }

    client.emit('s:items:new', blocks);
  });
});

server.listen(8080, function() {
  var addr = this.address();
  console.log('Server listening on port: %d', addr.port);
});
