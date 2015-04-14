var Player = function(name, x, y, id){
    this.name = name;
    this.id = id;
    this.x = x;
    this.y = y;
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
    var data_obj = {
		    "name": player.name,
		    "id": player.id,
		    "x": player.x,
		    "y": player.y,
		    "xSpeed": player.xSpeed,
		    "ySpeed": player.ySpeed,
		    "xDirection": player.xDirection,
		    "yDirection": player.yDirection,
		    "imageDirection": player.imageDirection,
		    "charge": player.charge,
		    "kills": player.kills
    }
    return data_obj;
}

Player.prototype.initImages = function(){
    var player = this;
    var sprites = ["/images/bluemage/0.png", "/images/bluemage/1.png", "/images/bluemage/2.png", "/images/bluemage/3.png", "/images/bluemage/4.png", "/images/bluemage/5.png", "/images/bluemage/6.png", "/images/bluemage/7.png"];
    for(var i in sprites){
        var img = new Image();
        img.src = sprites[i];
        player.images.push(img);
    }
}

Player.prototype.setDirection = function(clientX, clientY){
    var player = this;
    if(clientY < player.y){
        player.yDirection = -1;
        if(clientX >= player.x - (player.width * 4) && clientX <= player.x + (player.width * 4)){
            player.imageDirection = 0;
            player.xDirection = 0;
        } else if(clientX > player.x){
            player.imageDirection = 1;
            player.xDirection = 1;
        } else if(clientX < player.x){
            player.imageDirection = 7;
            player.xDirection = -1;
        }
    } else if(clientY >= (player.y - player.height * 2) && clientY <= (player.y + player.height * 2)){
        player.yDirection = 0;
        if(clientX > player.x){
            player.imageDirection = 2;
            player.xDirection = 1;
        } else if(clientX < player.x){
            player.imageDirection = 6;
            player.xDirection = -1;
        }
    } else if(clientY > player.y){
        player.yDirection = 1;
        if(clientX >= player.x - (player.width * 4) && clientX <= player.x + (player.width * 4)){
            player.imageDirection = 4;
            player.xDirection = 0;
        } else if(clientX > player.x){
            player.imageDirection = 3;
            player.xDirection = 1;
        } else if(clientX < player.x){
            player.imageDirection = 5;
            player.xDirection = -1;
        }
    }
}

Player.prototype.move = function(keysDown){
    var player = this;
    if("up" in keysDown) player.yDirection == -1 ? player.y = player.y - player.ySpeed : player.y = player.y - (player.ySpeed / 2);
    if("down" in keysDown) player.yDirection == 1 ? player.y = player.y + player.ySpeed : player.y = player.y + (player.ySpeed / 2);
    if("left" in keysDown) player.xDirection == -1 ? player.x = player.x - player.xSpeed : player.x = player.x - (player.xSpeed / 2);
    if("right" in keysDown) player.xDirection == 1 ? player.x = player.x + player.xSpeed : player.x = player.x + (player.xSpeed / 2);
}

Player.prototype.chargeUp = function(mouseDown){
    var player = this;
    if(mouseDown === true){
        if(player.charge < 150) player.charge += 1;
    } else {
        player.charge = 0;
    }
}

Player.prototype.detectCollision = function(obj){
    var player = this;
		if(player.id === obj.originator) {
			return false
		}

    var playerxRange = [player.x, player.x + player.width];
    var playeryRange = [player.y, player.y + player.height];
    var objxRange = [obj.x - (obj.width/2), obj.x + (obj.width/2)];
    var objyRange = [obj.y - (obj.height/2), obj.y + (obj.height/2)];
		// compares bounds of player and proj
		if((playerxRange[0] <= objxRange[1] && playerxRange[1] >= objxRange[0])
		&& (playeryRange[0] <= objyRange[1] && playeryRange[1] >= objyRange[0])) {
			return true
		}
    return false;
}

Player.prototype.respawn = function(game) {
	var player = this;
	setTimeout(function() {
		player.x = Math.floor((Math.random() * (game.canvas.width - 50)))
		player.y = Math.floor((Math.random() * (game.canvas.height - 50)))
	}, 1000)
}

var Projectile = function(startX, startY, endX, endY, speed, size, originator){
    this.x = startX;
    this.y = startY;
    this.speed = speed;
    this.xPath = (endX - startX);
    this.yPath = (endY - startY);
	this.pathAngle = Math.atan((endY - startY)/(endX - startX))
	if(this.xPath < 0) {
		this.xInc = -Math.cos(this.pathAngle) * speed;
        this.yInc = -Math.sin(this.pathAngle) * speed;
	}
	else {
        this.xInc = Math.cos(this.pathAngle) * speed;
		this.yInc = Math.sin(this.pathAngle) * speed;
	}
    this.size = size;
    this.width = size;
    this.height = size;
    this.originator = originator;
	this.damage = 5;
    this.id = Math.random() * 10000;
}

Projectile.prototype.projectileData = function(){
    var projectile = this;
    var data_obj = {
	    "x": projectile.x,
	    "y": projectile.y,
	    "speed": projectile.speed,
	    "xPath": projectile.xPath,
	    "yPath" : projectile.yPath,
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

var Canvas = function(){
    var c = document.getElementById("background");
    this.width = c.width;
    this.height = c.height;
    this.bgCtx = c.getContext("2d");
    var c = document.getElementById("foreground");
    this.fgCtx = c.getContext("2d");
    var c = document.getElementById("cursor");
    this.mCtx = c.getContext("2d");
}

Canvas.prototype.drawPlayer = function(player){
    var canvas = this;
    canvas.fgCtx.drawImage(player.images[player.imageDirection], player.x, player.y);
}

Canvas.prototype.drawProjectile = function(projectile){
    var canvas = this;
    canvas.fgCtx.beginPath();
    canvas.fgCtx.arc(projectile.x, projectile.y, projectile.size, 8, 5 * Math.PI);
    var grd = canvas.fgCtx.createRadialGradient(projectile.x, projectile.y, projectile.size, projectile.x + projectile.size, projectile.y + projectile.size, projectile.size);
    grd.addColorStop(0, '#FFCC5E');
    grd.addColorStop(1, 'white');
    canvas.fgCtx.fillStyle=grd;
    canvas.fgCtx.fill();
}

var Game = function(){
    this.canvas = new Canvas();
    this.socket = io();
    this.player = undefined;
    this.otherPlayers = [];
    this.projectiles = [];
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

Game.prototype.run = function(){
    var game = this;
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
        game.projectiles.push(new Projectile(game.player.x + (game.player.width / 2), game.player.y + (game.player.height / 2), e.clientX, e.clientY, 10, pSize, game.player.id));
        game.socketEmitProjectile(game.player.x + (game.player.width / 2), game.player.y + (game.player.height / 2), e.clientX, e.clientY, 10, pSize, game.player.id);
    }
    game.player.chargeUp(game.mouseDown);
    for(var i in game.projectiles){
        var projectile = game.projectiles[i];
        projectile.move();
        var playerHit = game.player.detectCollision(projectile);
        if(playerHit === true){
			game.player.hp -= projectile.damage
            game.socketEmitProjectileHit(projectile);
		}
        if(projectile.x < 0 || projectile.x > game.canvas.width || projectile.y < 0 || projectile.y > game.canvas.height || playerHit === true){
          game.projectiles.splice(i, 1);
        }
    };
    game.getInput();
    game.drawForeground();
    window.requestAnimationFrame(function(){ game.run() });
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
      name: game.player.name, id: game.player.id, xPos: game.player.x, yPos: game.player.y, imageDir: game.player.imageDirection})
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

Game.prototype.socketEmitProjectile = function(xPos, yPos, xEnd, yEnd, speed, pSize, playerId) {
    var game = this;
    game.socket.emit('projectileShot', {
        startX: xPos,
        startY: yPos,
        endX: xEnd,
        endY: yEnd,
        speed: speed,
        size: pSize,
        originator: playerId
    })
}

Game.prototype.socketProjectileShot = function() {
    var game = this;
    game.socket.on('projectileShot', function(p) {
        game.projectiles.push(new Projectile(p.startX, p.startY, p.endX, p.endY, p.speed, p.size, p.originator))
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
        var i = game.projectiles.map(function(p) { return p.id; }).indexOf(projectile.id);
        game.projectiles.splice(i, 1);
    })
}

window.onload = function(){
    var name = prompt("Enter a badass wizard name");
    var game = new Game();
    game.player = new Player(name, Math.floor((Math.random() * (game.canvas.width - 50))), Math.floor((Math.random() * (game.canvas.height - 50))));
    game.socketInitialize();
    game.drawBackground();
    game.drawForeground();
    game.socketGetProjectileHits();
    game.run();
}

// player hp / game mechanics
// projectile speed fix
// aiming improvement - cannot do diag close to char
// animations
