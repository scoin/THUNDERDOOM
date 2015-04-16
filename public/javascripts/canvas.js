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
