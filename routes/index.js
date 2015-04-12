var express = require('express');
var router = express.Router();

module.exports = function(io){
  io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('addPlayer', function(playerName) {
      socket.broadcast.emit('addPlayer', playerName)
    })
    socket.on('playerPosition', function(moveInfo) {
      socket.broadcast.emit('playerPosition', moveInfo)
    })
    socket.on('disconnect', function(){
      console.log('user disconnected');
    });
  });

  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  });

  return router;
}
