var express = require('express');
var router = express.Router();

module.exports = function(io){
  io.on('connection', function(socket){
    console.log('a user connected');
    io.to(socket.id).emit('getUserId', socket.id);
    socket.on('addPlayer', function(playerData) {
      console.log(playerData)
      socket.broadcast.emit('addPlayer', playerData, socket.id);
    })

    socket.on('playerPosition', function(moveInfo) {
      socket.broadcast.emit('playerPosition', moveInfo, socket.id);
    })

    socket.on('projectileShot', function(projectile_dict) {
      socket.broadcast.emit('projectileShot', projectile_dict)
    })

    socket.on('projectileHit', function(hitData){
      socket.broadcast.emit('projectileHit', hitData);
    })

    socket.on('playerDead', function(killDict) {
      socket.broadcast.emit('playerDead', killDict)
    })

    socket.on('disconnect', function(){
      console.log('user disconnected');
      socket.broadcast.emit('popPlayer', socket.id);
    });
  });

  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  });

  return router;
}
