importScripts('https://cdn.socket.io/socket.io-1.2.0.js')
var socket = io()
socket.emit('addPlayer', game.player.playerData());

socket.on('addPlayer', function(playerData, socketId){
  var p = new Player(playerData.name, playerData.x, playerData.y, socketId);
  game.otherPlayers[socketId] = p;
})
