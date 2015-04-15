var Projectile = function(startX, startY, endX, endY, speed, size, originator){
    this.x = startX;
    this.y = startY;
    this.speed = speed;
    this.xPath = (endX - startX);
    this.yPath = (endY - startY);
    this.pathAngle = Math.atan((endY - startY)/(endX - startX))
	if(this.xPath < 0){
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
