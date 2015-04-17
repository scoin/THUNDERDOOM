importScripts('https://cdn.socket.io/socket.io-1.2.0.js')
importScripts('/javascripts/playerWorker.js')
importScripts('/javascripts/projectile.js')

var GameWorker = function(){
  this.socket = io();
  this.player = undefined;
  this.canvasDimensions = undefined;
  this.otherPlayers = {}; // this should produce bugs. it used to be an array. it should be a dict with player ids as the key
  this.projectiles = {};
  this.keysDown = {};
  this.mouseCoords = [];
  this.mouseDown = false;
  this.fireProjectile = false;
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
    var player = this;
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

GameWorker.prototype.run = function(){
  var gameWorker = this;
  setInterval(function(){
    if(gameWorker.mouseCoords.length === 2){ // this is acting weird in client. array is empty until the mouse first moves, i think
      gameWorker.player.setDirection(gameWorker.mouseCoords[0], gameWorker.mouseCoords[1])
    }
    if(gameWorker.mouseDown === false && gameWorker.player.charge > 0){
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

      gameWorker.projectiles[p.id] = p;
      gameWorker.socketEmitProjectile(p);
      gameWorker.player.charge = 0;
    }
    else if(gameWorker.mouseDown === true){
      if(gameWorker.player.charge < 150) gameWorker.player.charge += 1;
    }

    var projectileIdToDelete
    for(var i in gameWorker.projectiles){
      var projectile = gameWorker.projectiles[i];
      projectile.move();
      var playerHit = gameWorker.detectCollision(gameWorker.player, projectile);
      if(playerHit === true){
  			gameWorker.player.hp -= projectile.damage
        gameWorker.socketEmitProjectileHit(projectile);
		  }

      var otherPlayerHit = false
      for(id in gameWorker.otherPlayers){
        if(gameWorker.detectCollision(gameWorker.otherPlayers[id], projectile) === true){
          otherPlayerHit = true
          break
        }
      }
      if(projectile.coords.x < 0 || projectile.coords.x > gameWorker.canvasDimensions.width || projectile.coords.y < 0 || projectile.coords.y > gameWorker.canvasDimensions.height || playerHit === true || otherPlayerHit === true){
        projectileIdToDelete = projectile.id
      }
    };
    if(gameWorker.projectiles[projectileIdToDelete]){
      delete gameWorker.projectiles[projectileIdToDelete];
    }
    gameWorker.movePlayerWithinBounds();
    gameWorker.socketBroadcastPosition()
    self.postMessage({"gameData": {"playerData": gameWorker.player.playerData(), "otherPlayers": gameWorker.otherPlayerData(), "projectiles": gameWorker.projectiles}})
  }, 15)
}

GameWorker.prototype.movePlayerWithinBounds = function(){
  var game = this;
  if(game.player.coords.x <= 0){
    delete game.keysDown['left'];
  }
  if(game.player.coords.x + game.player.width >= game.canvasDimensions.width){
    delete game.keysDown['right'];
  }
  if(game.player.coords.y <= 0){
    delete game.keysDown['up'];
  }
  if(game.player.coords.y + game.player.height >= game.canvasDimensions.height){
    delete game.keysDown['down'];
  }
  game.player.move(game.keysDown);
}
// Sockets
GameWorker.prototype.socketAddPlayer = function(){
  var gameWorker = this;
  gameWorker.socket.emit('addPlayer', gameWorker.player.playerData());

  gameWorker.socket.on('addPlayer', function(playerData, socketId){
    var p = new PlayerWorker(playerData.name, playerData.coords.x, playerData.coords.y, socketId);
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
  var game = this;
  game.socket.emit('playerPosition', {
    "name": game.player.name,
    "id": game.player.id,
    "xPos": game.player.coords.x,
    "yPos": game.player.coords.y,
    "imageDir": game.player.imageDirection
  })
}

GameWorker.prototype.socketSyncPosition = function() {
  var game = this;
  game.socket.on('playerPosition', function(moveInfo, socketId) {
    if(game.otherPlayers[socketId]){
      game.otherPlayers[socketId].coords.x = moveInfo.xPos;
      game.otherPlayers[socketId].coords.y = moveInfo.yPos;
      game.otherPlayers[socketId].imageDirection = moveInfo.imageDir;
    } else {
      var p = new PlayerWorker(moveInfo.name, moveInfo.xPos, moveInfo.yPos, socketId);
      game.otherPlayers[socketId] = p;
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
  var game = this;
  game.socket.emit('projectileHit', {
    "player": game.player.playerData(),
    "projectile": projectile.projectileData()
  })
}

GameWorker.prototype.socketGetProjectileHits = function(){
  var game = this;
  game.socket.on('projectileHit', function(hitData){
    var hitPlayer = hitData.player;
    var projectile = hitData.projectile;
    delete game.projectiles[projectile.id]
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
      gameWorker.fireProjectile = playerEvents.fireProjectile
    }
    else if(e.data.firstRunData){
      var firstRunData = e.data.firstRunData

      gameWorker.player.name = firstRunData.player.name
      gameWorker.player.coords = firstRunData.player.coords

      gameWorker.canvasDimensions = firstRunData.canvas
    }
  }
}

GameWorker.prototype.init = function(){
  var gameWorker = this;
  gameWorker.player = new PlayerWorker()

  gameWorker.socket.on('getUserId', function(userId){
    gameWorker.player.id = userId;
    self.postMessage({"playerId": userId})
  })
  gameWorker.socketAddPlayer();
  gameWorker.socketSyncPosition()
  gameWorker.socketProjectileShot()
  gameWorker.socketPopPlayers()
}

var gameWorker = new GameWorker()
gameWorker.init()
gameWorker.receiveMessagesFromClient()
gameWorker.run()
