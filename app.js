var http = require('http'),
    connect = require('connect');

var app = connect();

app.use(connect.static(__dirname + '/public'));

http.createServer(app).listen(8080, function() {
  var addr = this.address();
  console.log('Server listening on port: %d', addr.port);
});
