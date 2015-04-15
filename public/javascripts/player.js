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


Player.prototype.respawn = function(game) {
	var player = this;
	setTimeout(function() {
		player.x = Math.floor((Math.random() * (game.canvas.width - 50)))
		player.y = Math.floor((Math.random() * (game.canvas.height - 50)))
	}, 1000)
}
