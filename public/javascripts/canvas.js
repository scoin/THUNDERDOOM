var sprites = {
  "blue": ["/images/bluemage/0.png", "/images/bluemage/1.png", "/images/bluemage/2.png", "/images/bluemage/3.png", "/images/bluemage/4.png", "/images/bluemage/5.png", "/images/bluemage/6.png", "/images/bluemage/7.png", "/images/bluemage/deadleft.png"],
  "black": ["/images/blackmage/0.png", "/images/blackmage/1.png", "/images/blackmage/2.png", "/images/blackmage/3.png", "/images/blackmage/4.png", "/images/blackmage/5.png", "/images/blackmage/6.png", "/images/blackmage/7.png", "/images/blackmage/deadleft.png"],
  "green": ["/images/greenmage/0.png", "/images/greenmage/1.png", "/images/greenmage/2.png", "/images/greenmage/3.png", "/images/greenmage/4.png", "/images/greenmage/5.png", "/images/greenmage/6.png", "/images/greenmage/7.png", "/images/greenmage/deadleft.png"]
}

var spriteImageCount = function(){
  var count = 0;
  for(var color in sprites){
    count += sprites[color].length
  }
  return count;
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
    this.images = {};
    this.loaded = 0;
}

Canvas.prototype.initImages = function(callback){
  var canvas = this;
  var imgCount = spriteImageCount();
  var loadedImgs = 0;
  for(var color in sprites){
    canvas.images[color] = [];
    for(var imgPath in sprites[color]){
      var img = new Image();
      img.onload = function(){
        loadedImgs += 1;
        if(loadedImgs >= imgCount){
          callback();
          return;
        }
      }
      img.src = sprites[color][imgPath];
      canvas.images[color].push(img);
    }
  }
}

Canvas.prototype.drawPlayer = function(player){
    var canvas = this;
    canvas.fgCtx.drawImage(canvas.images[player.color][player.imageDirection], player.coords.x, player.coords.y);
}

Canvas.prototype.drawProjectile = function(projectile){
  var canvas = this;
  canvas.fgCtx.beginPath();
  canvas.fgCtx.arc(projectile.coords.x, projectile.coords.y, projectile.size, 8, 5 * Math.PI);
  var grd = canvas.fgCtx.createRadialGradient(projectile.coords.x, projectile.coords.y, projectile.size, projectile.coords.x + projectile.size, projectile.coords.y + projectile.size, projectile.size);
  grd.addColorStop(0, '#FFCC5E');
  grd.addColorStop(1, 'white');
  canvas.fgCtx.fillStyle=grd;
  canvas.fgCtx.fill();
}

Canvas.prototype.drawForeground = function(player, otherPlayers, projectiles){
  var canvas = this;
  canvas.fgCtx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.drawPlayer(player);
  for(var id in otherPlayers){
    canvas.drawPlayer(otherPlayers[id]);
  };

  for(var id in projectiles){
    canvas.drawProjectile(projectiles[id]);
  };
}

Canvas.prototype.drawBackground = function(){
  var canvas = this;
  var img = new Image();
  img.src = '/images/bg.png';
  img.onload = function(){
      canvas.bgCtx.drawImage(img, 0, 0);
  }
}
