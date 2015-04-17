importScripts('https://cdn.socket.io/socket.io-1.2.0.js')
var PlayerWorker = function(name, x, y, id){
    this.name = name;
    this.id = id;
		this.coords = {"x": x, "y": y};
    this.xSpeed = 2;
    this.ySpeed = 2;
    this.xDirection = 0;
    this.yDirection = 1;
    this.imageDirection = 4;
    this.images = [];
    this.width = 35;
    this.height = 56;
    this.charge = 0;
		this.hp = 10;
    this.kills = 0;
}

PlayerWorker.prototype.playerDataForClient = function(){
  var player = this;
  var playerData = {
		"coords": player.coords,
    "imageDirection": player.imageDirection,
    "kills": player.kills
  }
  return playerData;
}

PlayerWorker.prototype.move = function(keysDown){
  var player = this;
  if("up" in keysDown) player.yDirection == -1 ? player.coords.y = player.coords.y - player.ySpeed : player.coords.y = player.coords.y - (player.ySpeed / 2);
  if("down" in keysDown) player.yDirection == 1 ? player.coords.y = player.coords.y + player.ySpeed : player.coords.y = player.coords.y + (player.ySpeed / 2);
  if("left" in keysDown) player.xDirection == -1 ? player.coords.x = player.coords.x - player.xSpeed : player.coords.x = player.coords.x - (player.xSpeed / 2);
  if("right" in keysDown) player.xDirection == 1 ? player.coords.x = player.coords.x + player.xSpeed : player.coords.x = player.coords.x + (player.xSpeed / 2);
}

PlayerWorker.prototype.setDirection = function(clientX, clientY){
  var player = this;
  if(clientY < player.coords.y){
    player.yDirection = -1;
    if(clientX >= player.coords.x - (player.width * 4) && clientX <= player.coords.x + (player.width * 4)){
      player.imageDirection = 0;
      player.xDirection = 0;
    } else if(clientX > player.coords.x){
      player.imageDirection = 1;
      player.xDirection = 1;
    } else if(clientX < player.coords.x){
      player.imageDirection = 7;
      player.xDirection = -1;
    }
  } else if(clientY >= (player.coords.y - player.height * 2) && clientY <= (player.coords.y + player.height * 2)){
    player.yDirection = 0;
    if(clientX > player.coords.x){
      player.imageDirection = 2;
      player.xDirection = 1;
    } else if(clientX < player.coords.x){
      player.imageDirection = 6;
      player.xDirection = -1;
    }
  } else if(clientY > player.coords.y){
    player.yDirection = 1;
    if(clientX >= player.coords.x - (player.width * 4) && clientX <= player.coords.x + (player.width * 4)){
      player.imageDirection = 4;
      player.xDirection = 0;
    } else if(clientX > player.coords.x){
      player.imageDirection = 3;
      player.xDirection = 1;
    } else if(clientX < player.coords.x){
      player.imageDirection = 5;
      player.xDirection = -1;
    }
  }
}

var Projectile = function(startX, startY, endX, endY, speed, size, originator, id){
  this.coords = {"x": startX, "y": startY}
  this.speed = speed;
  this.endX = endX;
  this.endY = endY;
  this.pathAngle = Math.atan((endY - startY)/(endX - startX))
	if((endX - startX) < 0){
		this.xInc = -Math.cos(this.pathAngle) * speed;
    this.yInc = -Math.sin(this.pathAngle) * speed;
	}
	else{
    this.xInc = Math.cos(this.pathAngle) * speed;
		this.yInc = Math.sin(this.pathAngle) * speed;
	}
  this.size = size;
  this.width = size;
  this.height = size;
  this.originator = originator;
	this.damage = 5;
  if(id){
    this.id = id
  }
  else{
    this.id = Math.floor(Math.random() * 10000);
  }
}

Projectile.prototype.projectileData = function(){
    var projectile = this;
    var data_obj = {
	    "coords": projectile.coords,
	    "speed": projectile.speed,
	    "endX": projectile.endX,
	    "endY" : projectile.endY,
	    "xInc" : projectile.xInc,
	    "yInc" : projectile.yInc,
	    "size" : projectile.size,
	    "width" : projectile.width,
	    "height" : projectile.height,
	    "originator" : projectile.originator,
	    "id": projectile.id
    }
    return data_obj;
}

Projectile.prototype.move = function(){
  var projectile = this;
  projectile.coords.x += projectile.xInc;
  projectile.coords.y += projectile.yInc;
}

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
      for(i in gameWorker.otherPlayers){
        if(gameWorker.detectCollision(gameWorker.otherPlayers[i], projectile) === true){
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
    self.postMessage({"gameData": {"playerData": gameWorker.player.playerDataForClient(), "projectiles": gameWorker.projectiles}})
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
  game.socket.emit('addPlayer', game.player.playerData());

  socket.on('addPlayer', function(playerData, socketId){
    var p = new PlayerWorker(playerData.name, playerData.x, playerData.y, socketId);
    game.otherPlayers[socketId] = p;
  })
}

GameWorker.prototype.socketPopPlayers = function(){
  var game = this;
  game.socket.on('popPlayer', function(socketId){
    delete game.otherPlayers[socketId];
  })
}

GameWorker.prototype.socketBroadcastPosition = function() {
  var game = this;
  setInterval(function() {
    game.socket.emit('playerPosition', {
      "name": game.player.name,
      "id": game.player.id,
      "xPos": game.player.coords.x,
      "yPos": game.player.coords.y,
      "imageDir": game.player.imageDirection})
  }, 15)
}

GameWorker.prototype.socketSyncPosition = function() {
  var game = this;
  game.socket.on('playerPosition', function(moveInfo, socketId) {
    if(game.otherPlayers[socketId]){
      game.otherPlayers[socketId].x = moveInfo.xPos;
      game.otherPlayers[socketId].y = moveInfo.yPos;
      game.otherPlayers[socketId].imageDirection = moveInfo.imageDir;
    } else {
      var p = new PlayerWorker(moveInfo.name, moveInfo.xPos, moveInfo.yPos, socketId);
      game.otherPlayers[socketId] = p;
    }
  })
}

GameWorker.prototype.socketEmitProjectile = function(projectile) {
  var game = this;
  game.socket.emit('projectileShot', projectile.projectileData())
}

GameWorker.prototype.socketProjectileShot = function() {
  var game = this;
  game.socket.on('projectileShot', function(p) {
    var projectile = new Projectile(p.x, p.y, p.endX, p.endY, p.speed, p.size, p.originator, p.id)
    game.projectiles[projectile.id] = projectile
  })
}

GameWorker.prototype.socketEmitProjectileHit = function(projectile){
  var game = this;
  game.socket.emit('projectileHit', {
    "player": game.player.playerData(),
    "projectile": projectile.projectileData()
  })
}

GameWorker.prototype.socketInitialize = function() {
  var game = this;
  game.socketAddPlayer();
  game.socket.on('getUserId', function(userId){
    game.player.id = userId;
  })
  game.socketPopPlayers();
  game.socketBroadcastPosition();
  game.socketSyncPosition();
  game.socketProjectileShot();
  game.socketGetProjectileHits();
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
}

var gameWorker = new GameWorker()
gameWorker.init()
gameWorker.receiveMessagesFromClient()
gameWorker.run()
