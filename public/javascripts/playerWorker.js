var PlayerWorker = function(name, x, y, id){
    this.name = name;
    this.id = id;
    this.coords = {"x": x, "y": y};
    this.xSpeed = 2;
    this.ySpeed = 2;
    this.xDirection = 0;
    this.yDirection = 1;
    this.imageDirection = 4;
    this.width = 35;
    this.height = 56;
    this.charge = 0;
    this.hp = 10;
    this.kills = 0;
}

PlayerWorker.prototype.playerData = function(){
  var player = this;
  var playerData = {
    "coords": player.coords,
    "hp": player.hp,
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