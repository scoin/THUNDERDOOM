g_otherPlayers = {} // socket wasn't recognizing it as a class variable
g_projectiles = []

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
    canvas.fgCtx.arc(projectile.x, projectile.y, projectile.size, 8, 5 * Math.PI);
    var grd = canvas.fgCtx.createRadialGradient(projectile.x, projectile.y, projectile.size, projectile.x + projectile.size, projectile.y + projectile.size, projectile.size);
    grd.addColorStop(0, '#FFCC5E');
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
    for(var i in g_otherPlayers){
        game.canvas.drawPlayer(g_otherPlayers[i]);
    };

    for(var i in game.projectiles){
        game.canvas.drawProjectile(game.projectiles[i]);
    };
    // projectiles from socket
    for(var i in g_projectiles){
        game.canvas.drawProjectile(g_projectiles[i]);
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
        game.projectiles.push(new Projectile(game.player.x, game.player.y, e.clientX, e.clientY, 10, pSize, game.player.name));
        g_socket.emit('projectileShot', {
            startX: game.player.x,
            startY: game.player.y,
            endX: e.clientX,
            endY: e.clientY,
            speed: 10,
            size: pSize,
            originator: game.player.name
        })
    }
    game.player.chargeUp(game.mouseDown);
    for(var i in game.projectiles){
        var projectile = game.projectiles[i];
        projectile.move();
        if(projectile.x < 0 || projectile.x > game.canvas.width || projectile.y < 0 || projectile.y > game.canvas.height){
            game.projectiles.splice(i, 1);
        }
    };
    for(var i in g_projectiles){
        var projectile = g_projectiles[i];
        projectile.move();
        if(projectile.x < 0 || projectile.x > game.canvas.width || projectile.y < 0 || projectile.y > game.canvas.height){
            g_projectiles.splice(i, 1);
        }
    };
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
    g_socket.emit('addPlayer', player.playerData());

    g_socket.on('addPlayer', function(playerData, socketId){
        var p = new Player(playerData.name, playerData.x, playerData.y, socketId);
        g_otherPlayers[socketId] = p;
    })
}

Socket.prototype.popPlayers = function(){
    g_socket.on('popPlayer', function(socketId){
        delete g_otherPlayers[socketId];
    })
}

Socket.prototype.broadcastPosition = function(player) {
  setInterval(function() {
    g_socket.emit('playerPosition', {
            name: player.name, id: player.id, xPos: player.x, yPos: player.y, imageDir: player.imageDirection})
  }, 15)
}

Socket.prototype.syncPosition = function() {
    g_socket.on('playerPosition', function(moveInfo, socketId) {
      if(g_otherPlayers[socketId]){
        g_otherPlayers[socketId].x = moveInfo.xPos;
        g_otherPlayers[socketId].y = moveInfo.yPos
        g_otherPlayers[socketId].imageDirection = moveInfo.imageDir
      } else {
        var p = new Player(moveInfo.name, moveInfo.xPos, moveInfo.yPos, socketId);
        g_otherPlayers[socketId] = p;
      }
    })
}

Socket.prototype.emitProjectile = function(xPos, yPos, xEnd, yEnd, speed, pSize, playerName) {
    g_socket.emit('projectileShot', {
        startX: xPos,
        startY: yPos,
        endX: xEnd,
        endY: yEnd,
        speed: speed,
        size: pSize,
        originator: playerName
    })
}

Socket.prototype.projectileShot = function(canvas) {
    g_socket.on('projectileShot', function(p) {
        g_projectiles.push(new Projectile(p.startX, p.startY, p.endX, p.endY, p.speed, p.size, p.originator))
    })
}

Socket.prototype.initialize = function(player) {
    this.addPlayer(player)
    this.popPlayers();
    this.broadcastPosition(player)
    this.syncPosition()
    this.projectileShot()
}

window.onload = function(){
    var name = prompt("Enter a badass wizard name");
    var game = new Game();
    game.player = new Player(name, Math.floor((Math.random() * (game.canvas.width - 50))), Math.floor((Math.random() * (game.canvas.height - 50))));
    var socket = new Socket()
    socket.initialize(game.player)
    game.drawBackground();
    game.drawForeground();
    game.run();
}

// better oo / optimize sockets
// projectile player collision
// projectile speed fix
// aiming improvement - cannot do diag close to char
// animations