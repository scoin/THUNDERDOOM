importScripts('https://cdn.socket.io/socket.io-1.2.0.js')

var Player = function(name, x, y, id){
    this.name = name;
    this.id = id;
		this.coord = {"x": x, "y": y};
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
    // this.initImages();
}

Player.prototype.playerData = function(){
  var player = this;
  var playerData = {
    "name": player.name,
    "id": player.id,
		"coord": player.coord,
    "xSpeed": player.xSpeed,
    "ySpeed": player.ySpeed,
    "xDirection": player.xDirection,
    "yDirection": player.yDirection,
    "imageDirection": player.imageDirection,
    "charge": player.charge,
    "kills": player.kills
  }
  return playerData;
}

var Projectile = function(startX, startY, endX, endY, speed, size, originator, id){
  this.x = startX;
  this.y = startY;
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
	    "x": projectile.x,
	    "y": projectile.y,
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
  projectile.x += projectile.xInc;
  projectile.y += projectile.yInc;
}

var GameWorker = function(){
  this.socket = io();
  this.player = undefined;
  this.otherPlayers = [];
  this.projectiles = {};
  this.controls = {
    "W": "up",
    "S": "down",
    "A": "left",
    "D": "right"
  }
  this.keysDown = {};
  this.mouseDown = false;
}

GameWorker.prototype.detectCollision = function(objOne, objTwo){
    var player = this;
		if(objOne.id === objTwo.originator) {
			return false
		}

    var objOneXRange = [objOne.x, objOne.x + objOne.width];
    var objOneYRange = [objOne.y, objOne.y + objOne.height];
    var objTwoXRange = [objTwo.x - (objTwo.width/2), objTwo.x + (objTwo.width/2)];
    var objTwoYRange = [objTwo.y - (objTwo.height/2), objTwo.y + (objTwo.height/2)];
		// compares bounds
    if((objOneXRange[0] <= objTwoXRange[1] && objOneXRange[1] >= objTwoXRange[0])
		&& (objOneYRange[0] <= objTwoYRange[1] && objOneYRange[1] >= objTwoYRange[0])) {
			return true
		}
    return false;
}

GameWorker.prototype.run = function(){
  var game = this;
  setInterval(function(){
    window.onkeydown = function(e){
      game.keysDown[game.controls[String.fromCharCode(e.which)]] = true;
    }
    window.onkeyup = function(e){
      delete game.keysDown[game.controls[String.fromCharCode(e.which)]];
    }
    window.onmousemove = function(e){
      game.player.setDirection(e.clientX, e.clientY);
    }
    window.onmousedown = function(e){
      game.mouseDown = true;
    }
    window.onmouseup = function(e){
      game.mouseDown = false;
      var pSize = Math.floor(game.player.charge / 6) > 5 ? Math.floor(game.player.charge / 6) : 5
      var p = new Projectile(game.player.x + (game.player.width / 2), game.player.y + (game.player.height / 2), e.clientX, e.clientY, 10, pSize, game.player.id)
      game.projectiles[p.id] = p;
      game.socketEmitProjectile(p);
    }
    game.player.chargeUp(game.mouseDown);
    var projectileIdToDelete
    for(var i in game.projectiles){
      var projectile = game.projectiles[i];
      projectile.move();
      var playerHit = game.detectCollision(game.player, projectile);
      if(playerHit === true){
  			game.player.hp -= projectile.damage
        game.socketEmitProjectileHit(projectile);
		  }

      var otherPlayerHit = false
      for(i in game.otherPlayers){
        if(game.detectCollision(game.otherPlayers[i], projectile) === true){
          otherPlayerHit = true
          break
        }
      }
      if(projectile.x < 0 || projectile.x > game.canvas.width || projectile.y < 0 || projectile.y > game.canvas.height || playerHit === true || otherPlayerHit === true){
        projectileIdToDelete = projectile.id
      }
    };
    if(game.projectiles[projectileIdToDelete]){
      delete game.projectiles[projectileIdToDelete];
    }
    game.getInput();
  }, 15)
}

GameWorker.prototype.getInput = function(){
  var game = this;
  if(game.player.x <= 0){
    delete game.keysDown['left'];
  }
  if(game.player.x + game.player.width >= game.canvas.width){
    delete game.keysDown['right'];
  }
  if(game.player.y <= 0){
    delete game.keysDown['up'];
  }
  if(game.player.y + game.player.height >= game.canvas.height){
    delete game.keysDown['down'];
  }
  game.player.move(game.keysDown);
}
// Sockets
GameWorker.prototype.socketAddPlayer = function(){
  game.socket.emit('addPlayer', game.player.playerData());

  socket.on('addPlayer', function(playerData, socketId){
    var p = new Player(playerData.name, playerData.x, playerData.y, socketId);
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
      "xPos": game.player.x,
      "yPos": game.player.y,
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
      var p = new Player(moveInfo.name, moveInfo.xPos, moveInfo.yPos, socketId);
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

GameWorker.prototype.communicateWithClient = function(){
  var gameWorker = this;
  gameWorker.player = new Player()
  gameWorker.socket.on('getUserId', function(userId){
    gameWorker.player.id = userId;
  })
  self.onmessage = function(e){
    if(e.data.player){
      var p = e.data.player
      gameWorker.player.name = p.name
      gameWorker.player.coord.x = p.coord.x
      gameWorker.player.coord.y = p.coord.y
    }
  }
}

GameWorker.prototype.init = function(){

}
var gameWorker = new GameWorker()
gameWorker.communicateWithClient()
setTimeout(function(){
  console.log(gameWorker.player)}, 30)
