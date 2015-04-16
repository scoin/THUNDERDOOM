importScripts('https://cdn.socket.io/socket.io-1.2.0.js')

var Player = function(name, x, y, id){
    this.name = name;
    this.id = id;
    this.x = x;
    this.y = y;
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
    this.initImages();
}

Player.prototype.playerData = function(){
  var player = this;
  var playerData = {
    "name": player.name,
    "id": player.id,
    "x": player.x,
    "y": player.y,
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

var Game = function(){
  this.canvas = new Canvas();
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

Game.prototype.detectCollision = function(objOne, objTwo){
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

Game.prototype.run = function(){
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

Game.prototype.getInput = function(){
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
Game.prototype.socketAddPlayer = function(){
  game.socket.emit('addPlayer', game.player.playerData());

  socket.on('addPlayer', function(playerData, socketId){
    var p = new Player(playerData.name, playerData.x, playerData.y, socketId);
    game.otherPlayers[socketId] = p;
  })
}

Game.prototype.socketPopPlayers = function(){
  var game = this;
  game.socket.on('popPlayer', function(socketId){
    delete game.otherPlayers[socketId];
  })
}

Game.prototype.socketBroadcastPosition = function() {
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

Game.prototype.socketSyncPosition = function() {
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

Game.prototype.socketEmitProjectile = function(projectile) {
  var game = this;
  game.socket.emit('projectileShot', projectile.projectileData())
}

Game.prototype.socketProjectileShot = function() {
  var game = this;
  game.socket.on('projectileShot', function(p) {
    var projectile = new Projectile(p.x, p.y, p.endX, p.endY, p.speed, p.size, p.originator, p.id)
    game.projectiles[projectile.id] = projectile
  })
}

Game.prototype.socketEmitProjectileHit = function(projectile){
  var game = this;
  game.socket.emit('projectileHit', {
    "player": game.player.playerData(),
    "projectile": projectile.projectileData()
  })
}

Game.prototype.socketInitialize = function() {
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

Game.prototype.socketGetProjectileHits = function(){
  var game = this;
  game.socket.on('projectileHit', function(hitData){
    var hitPlayer = hitData.player;
    var projectile = hitData.projectile;
    delete game.projectiles[projectile.id]
  })
}
