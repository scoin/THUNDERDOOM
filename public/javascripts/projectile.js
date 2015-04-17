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
