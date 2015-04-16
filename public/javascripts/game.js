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

Game.prototype.drawForeground = function(){
  var game = this;
  game.canvas.fgCtx.clearRect(0, 0, game.canvas.width, game.canvas.height);
  game.canvas.drawPlayer(game.player);
  for(var i in game.otherPlayers){
    game.canvas.drawPlayer(game.otherPlayers[i]);
  };

  for(var i in game.projectiles){
    game.canvas.drawProjectile(game.projectiles[i]);
  };
}

Game.prototype.drawBackground = function(){
    var game = this;
    var img = new Image();
    img.src = '/images/bg.png';
    img.onload = function(){
        game.canvas.bgCtx.drawImage(img, 0, 0);
    }
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
    game.player.setDirection();
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

Game.prototype.renderGraphics = function(){
  var game = this;
  game.drawBackground();
  game.drawForeground();
}

// SOCKETS

Game.prototype.socketAddPlayer = function() {
  var game = this;
  game.socket.emit('addPlayer', game.player.playerData());

  game.socket.on('addPlayer', function(playerData, socketId){
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

window.onload = function(){
  var name = prompt("Enter a badass wizard name");
  var game = new Game();
  game.player = new Player(name, Math.floor((Math.random() * (game.canvas.width - 50))), Math.floor((Math.random() * (game.canvas.height - 50))));
  game.socketInitialize();
  game.socketGetProjectileHits();
  game.run();
  window.requestAnimationFrame(function render(){
    game.renderGraphics();
    window.requestAnimationFrame(render)
  })
}

// player hp / game mechanics
// animations
