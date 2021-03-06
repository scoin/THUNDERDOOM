importScripts('https://cdn.socket.io/socket.io-1.2.0.js')
importScripts('/javascripts/playerWorker.js')
importScripts('/javascripts/projectile.js')

var GameWorker = function(){
  this.socket = io();
  this.player = undefined;
  this.canvasDimensions = undefined;
  this.otherPlayers = {};
  this.projectiles = {};
  this.keysDown = {};
  this.mouseCoords = [];
  this.mouseDown = false;
}

GameWorker.prototype.otherPlayerData = function(){
  var gameWorker = this;
  var playerData = {};
  for(var p in gameWorker.otherPlayers){
    playerData[p] = gameWorker.otherPlayers[p].playerData();
  }
  return playerData;
}

GameWorker.prototype.detectCollision = function(objOne, objTwo){
		if(objOne.id === objTwo.originator) {
			return false
		}
    var objOneXRange = [objOne.coords.x, objOne.coords.x + objOne.width];
    var objOneYRange = [objOne.coords.y, objOne.coords.y + objOne.height];
    var objTwoXRange = [objTwo.coords.x - (objTwo.width/2), objTwo.coords.x + (objTwo.width/2)];
    var objTwoYRange = [objTwo.coords.y - (objTwo.height/2), objTwo.coords.y + (objTwo.height/2)];
		// compares bounds
    if((objOneXRange[0] <= objTwoXRange[1] && objOneXRange[1] >= objTwoXRange[0])
		&& (objOneYRange[0] <= objTwoYRange[1] && objOneYRange[1] >= objTwoYRange[0])) {
			return true
		}
    return false;
}

GameWorker.prototype.handleClientEvents = function(){
  var gameWorker = this;
  if(gameWorker.mouseCoords.length === 2){
      gameWorker.player.setDirection(gameWorker.mouseCoords[0], gameWorker.mouseCoords[1])
  }
  if(gameWorker.mouseDown === false && gameWorker.player.charge > 0){
    var p = gameWorker.fireProjectile();
    gameWorker.socketEmitProjectile(p);
  }
  else if(gameWorker.mouseDown === true){
    if(gameWorker.player.charge < 150) gameWorker.player.charge += 1;
  }
}

GameWorker.prototype.fireProjectile = function(){
  var gameWorker = this;
  var pSize = Math.floor(gameWorker.player.charge / 6) > 5 ? Math.floor(gameWorker.player.charge / 6) : 5
  var p = new Projectile(
    gameWorker.player.coords.x + (gameWorker.player.width / 2),
    gameWorker.player.coords.y + (gameWorker.player.height / 2),
    gameWorker.mouseCoords[0],
    gameWorker.mouseCoords[1],
    10,
    pSize,
    gameWorker.player.id
  )
  gameWorker.player.charge = 0;
  gameWorker.projectiles[p.id] = p;
  return p;
}

GameWorker.prototype.moveProjectiles = function(){
  var gameWorker = this;
  var projectileIdToDelete;
  for(var i in gameWorker.projectiles){
    var projectile = gameWorker.projectiles[i];
    var playerHit = gameWorker.detectCollision(gameWorker.player, projectile);
    if(playerHit === true){
      gameWorker.player.hp -= projectile.damage;
      gameWorker.socketEmitProjectileHit(projectile);
    }

    var otherPlayerHit = false;
    for(var id in gameWorker.otherPlayers){
      if(gameWorker.detectCollision(gameWorker.otherPlayers[id], projectile) === true){
        otherPlayerHit = true;
        break
      }
    }
    if(projectile.coords.x < 0 || projectile.coords.x > gameWorker.canvasDimensions.width || projectile.coords.y < 0 || projectile.coords.y > gameWorker.canvasDimensions.height || playerHit === true || otherPlayerHit === true){
      projectileIdToDelete = projectile.id;
    }
    projectile.move();
  };
  if(gameWorker.projectiles[projectileIdToDelete]){
    delete gameWorker.projectiles[projectileIdToDelete];
  }
}

GameWorker.prototype.movePlayerWithinBounds = function(){
  var gameWorker = this;
  if(gameWorker.player.coords.x <= 0){
    delete gameWorker.keysDown['left'];
  }
  if(gameWorker.player.coords.x + gameWorker.player.width >= gameWorker.canvasDimensions.width){
    delete gameWorker.keysDown['right'];
  }
  if(gameWorker.player.coords.y <= 0){
    delete gameWorker.keysDown['up'];
  }
  if(gameWorker.player.coords.y + gameWorker.player.height >= gameWorker.canvasDimensions.height){
    delete gameWorker.keysDown['down'];
  }
  gameWorker.player.move(gameWorker.keysDown);
}

GameWorker.prototype.run = function(){
  var gameWorker = this;
  setInterval(function(){
    gameWorker.moveProjectiles();
    if(gameWorker.player.isDead() === true){
      gameWorker.player.imageDirection = 8
      gameWorker.socketBroadcastPosition();
    }
    else{
      gameWorker.handleClientEvents();
      gameWorker.movePlayerWithinBounds();
      gameWorker.socketBroadcastPosition();
    }
    self.postMessage({"gameData": {"playerData": gameWorker.player.playerData(), "otherPlayers": gameWorker.otherPlayerData(), "projectiles": gameWorker.projectiles}})
  }, 15)
}


// Sockets
GameWorker.prototype.socketAddPlayer = function(){
  var gameWorker = this;
  gameWorker.socket.emit('addPlayer', gameWorker.player.playerData());

  gameWorker.socket.on('addPlayer', function(playerData, socketId){
    var p = new PlayerWorker(playerData.name, playerData.coords.x, playerData.coords.y, socketId, playerData.color);
    gameWorker.otherPlayers[socketId] = p;
  })
}

GameWorker.prototype.socketPopPlayers = function(){
  var gameWorker = this;
  gameWorker.socket.on('popPlayer', function(socketId){
    delete gameWorker.otherPlayers[socketId];
  })
}

GameWorker.prototype.socketBroadcastPosition = function() {
  var gameWorker = this;
  gameWorker.socket.emit('playerPosition', {
    "name": gameWorker.player.name,
    "id": gameWorker.player.id,
    "xPos": gameWorker.player.coords.x,
    "yPos": gameWorker.player.coords.y,
    "imageDir": gameWorker.player.imageDirection,
    "color" : gameWorker.player.color
  })
}

GameWorker.prototype.socketSyncPosition = function() {
  var gameWorker = this;
  gameWorker.socket.on('playerPosition', function(moveInfo, socketId) {
    if(gameWorker.otherPlayers[socketId]){
      gameWorker.otherPlayers[socketId].coords.x = moveInfo.xPos;
      gameWorker.otherPlayers[socketId].coords.y = moveInfo.yPos;
      gameWorker.otherPlayers[socketId].imageDirection = moveInfo.imageDir;
    } else {
      var p = new PlayerWorker(moveInfo.name, moveInfo.xPos, moveInfo.yPos, socketId, moveInfo.color);
      gameWorker.otherPlayers[socketId] = p;
    }
  })
}

GameWorker.prototype.socketEmitProjectile = function(projectile) {
  var gameWorker = this;
  gameWorker.socket.emit('projectileShot', projectile.projectileData())
}

GameWorker.prototype.socketProjectileShot = function() {
  var gameWorker = this;
  gameWorker.socket.on('projectileShot', function(p) {
    var projectile = new Projectile(p.coords.x, p.coords.y, p.endX, p.endY, p.speed, p.size, p.originator, p.id)
    gameWorker.projectiles[projectile.id] = projectile
  })
}

GameWorker.prototype.socketEmitProjectileHit = function(projectile){
  var gameWorker = this;
  gameWorker.socket.emit('projectileHit', {
    "player": gameWorker.player.playerData(),
    "projectile": projectile.projectileData()
  })
}

GameWorker.prototype.socketGetProjectileHits = function(){
  var gameWorker = this;
  gameWorker.socket.on('projectileHit', function(hitData){
    var hitPlayer = hitData.player;
    var projectile = hitData.projectile;
    delete gameWorker.projectiles[projectile.id]
  })
}

GameWorker.prototype.receiveMessagesFromClient = function(){
  var gameWorker = this;

  self.onmessage = function(e){
    if(e.data.playerEvents){
      var playerEvents = e.data.playerEvents
      gameWorker.keysDown = playerEvents.keysDown
      gameWorker.mouseCoords = playerEvents.mouseCoords
      gameWorker.mouseDown = playerEvents.mouseDown
    }
    else if(e.data.firstRunData){
      var firstRunData = e.data.firstRunData
      gameWorker.player = new PlayerWorker()
      gameWorker.player.name = firstRunData.player.name
      gameWorker.player.coords = firstRunData.player.coords
      gameWorker.player.color = firstRunData.player.color
      gameWorker.canvasDimensions = firstRunData.canvas
      gameWorker.init()
    }
  }
}

GameWorker.prototype.init = function(){
  var gameWorker = this;

  gameWorker.socket.on('getUserId', function(userId){
    gameWorker.player.id = userId;
    self.postMessage({"playerId": userId})
  })
  gameWorker.socketAddPlayer();
  gameWorker.socketSyncPosition()
  gameWorker.socketProjectileShot()
  gameWorker.socketPopPlayers()
  gameWorker.run()
}

var gameWorker = new GameWorker()
gameWorker.receiveMessagesFromClient()