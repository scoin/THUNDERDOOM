g_otherPlayers = [] // socket wasn't recognizing it as a class variable

var Player = function(name, x, y){
	this.name = name;
	this.x = x;
	this.y = y;
	this.xSpeed = 4;
	this.ySpeed = 4;
	this.xDirection = 0;
	this.yDirection = 1;
	this.imageDirection = 4;
	this.images = [];
	this.width = 35;
	this.height = 56;
	this.charge = 0;
	this.kills = 0;
	this.initImages();
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

Player.prototype.setDirection = function(){
	var player = this;
	window.onmousemove = function(e){
		if(e.clientY < player.y){
			player.yDirection = -1;
			if(e.clientX >= player.x - (player.width * 4) && e.clientX <= player.x + (player.width * 4)){
				player.imageDirection = 0;
				player.xDirection = 0;
			} else if(e.clientX > player.x){
				player.imageDirection = 1;
				player.xDirection = 1;
			} else if(e.clientX < player.x){
				player.imageDirection = 7;
				player.xDirection = -1;
			}
		} else if(e.clientY >= (player.y - player.height * 2) && e.clientY <= (player.y + player.height * 2)){
			player.yDirection = 0;
			if(e.clientX > player.x){
				player.imageDirection = 2;
				player.xDirection = 1;
			} else if(e.clientX < player.x){
				player.imageDirection = 6;
				player.xDirection = -1;
			}
		} else if(e.clientY > player.y){
			player.yDirection = 1;
			if(e.clientX >= player.x - (player.width * 4) && e.clientX <= player.x + (player.width * 4)){
				player.imageDirection = 4;
				player.xDirection = 0;
			} else if(e.clientX > player.x){
				player.imageDirection = 3;
				player.xDirection = 1;
			} else if(e.clientX < player.x){
				player.imageDirection = 5;
				player.xDirection = -1;
			}
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

var Projectile = function(startX, startY, endX, endY, speed, size, originator){
	this.x = startX;
	this.y = startY;
	this.speed = speed;
	this.xPath = (endX - startX);
	this.yPath = (endY - startY);
	this.xInc = Math.floor(this.xPath / speed);
	this.yInc = Math.floor(this.yPath / speed);
	this.size = size;
	this.originator = originator;
	this.id = Math.floor(Math.random() * 100);
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
	canvas.fgCtx.arc(projectile.x, projectile.y, projectile.size, 0, 2 * Math.PI);
	var grd = canvas.fgCtx.createRadialGradient(projectile.x, projectile.y, projectile.size, projectile.x + projectile.size, projectile.y + projectile.size, projectile.size);
	grd.addColorStop(0, 'blue');
	grd.addColorStop(1, 'white');
	canvas.fgCtx.fillStyle=grd;
	canvas.fgCtx.fill();
}

var Game = function(){
	this.canvas = new Canvas();
	this.players = undefined;
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
	for(player in g_otherPlayers) { game.canvas.drawPlayer(g_otherPlayers[player]) }

	game.projectiles.forEach(function(projectile, i){
		game.canvas.drawProjectile(projectile);
	})
	// game.otherPlayers.forEach(function(player, i){
	// 	game.canvas.drawPlayer(player);
	// });
}

Game.prototype.drawBackground = function(){
	var game = this;
	var img = new Image();
	img.src = '/images/bg.png';
	img.onload = function(){
		game.canvas.bgCtx.drawImage(img, 0, 0);
	}

}

Game.prototype.addOtherPlayer = function(player){
	var game = this;
	game.otherPlayers.push(player);
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
	// game.otherPlayers.forEach(function(player, i){
	// 	player.move(game.keysDown);
	// });
}

Game.prototype.run = function(){
	var game = this;
	game.player.setDirection();
	// game.otherPlayers.forEach(function(player, i){
	// 	player.setDirection();
	// });
	window.onkeydown = function(e){
		game.keysDown[game.controls[String.fromCharCode(e.which)]] = true;
	}
	window.onkeyup = function(e){
		delete game.keysDown[game.controls[String.fromCharCode(e.which)]];
	}
	window.onmousedown = function(e){
		game.mouseDown = true;
	}
	window.onmouseup = function(e){
		game.mouseDown = false;
		var pSize = Math.floor(game.player.charge / 6) > 5 ? Math.floor(game.player.charge / 6) : 5
		console.log(pSize)
		game.projectiles.push(new Projectile(game.player.x, game.player.y, e.clientX, e.clientY, 10, pSize, game.player.name));
	}
	game.player.chargeUp(game.mouseDown);
	game.projectiles.forEach(function(projectile, i){
		projectile.move();
		if(projectile.x < 0 || projectile.x > game.canvas.width){ 
			game.projectiles.splice(i, 1); 
		} else if(projectile.y < 0 || projectile.y > game.canvas.height) {
			game.projectiles.splice(i, 1);
		}
	});
	game.getInput();
	game.drawForeground();
	window.requestAnimationFrame(function(){ game.run() });
}

// SOCKETS
g_socket = io() // wasn't working when I defined it in the class...

var Socket = function(){
	return
}

Socket.prototype.addPlayer = function(player) {
  g_socket.emit('addPlayer', player.name)

	g_socket.on('addPlayer', function(playerName){
	  var p = new Player()
	  p.name = playerName
	  g_otherPlayers.push(p)
	})
}

Socket.prototype.broadcastPosition = function(player) {
  setInterval(function() {
    g_socket.emit('playerPosition', {name: player.name, xPos: player.x, yPos: player.y})
  }, 300)
}

Socket.prototype.syncPosition = function() {
  setInterval(function() {
    g_socket.on('playerPosition', function(moveInfo) {
      var ran = false
      for(player in g_otherPlayers) {
        if(g_otherPlayers[player].name == moveInfo.name) {
          g_otherPlayers[player].x = moveInfo.xPos
					g_otherPlayers[player].y = moveInfo.yPos

          ran = true
          break
        }
      }
      if(ran === false) {
        var p = new Player()
        p.name = moveInfo.name
        g_otherPlayers.push(p)
      }
    })
  }, 300)
}

Socket.prototype.initialize = function(player) {
	this.addPlayer(player)
	this.broadcastPosition(player)
	this.syncPosition()
}

window.onload = function(){
	var game = new Game();
	game.player = new Player("hi", 100, 100);
	var socket = new Socket()
	socket.initialize(game.player)
	// game.addOtherPlayer(new Player("Greg", 300, 300));
	game.drawBackground();
	game.drawForeground();
	game.run();
}
