var Game = function(){
    this.canvas = new Canvas();
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

Game.prototype.renderGraphics = function(){
  var game = this;
  game.drawBackground();
  game.drawForeground();
}

Game.prototype.communicateWithWorker = function(){

}

window.onload = function(){
  var name = prompt("Enter a badass wizard name");
  var game = new Game();
  game.player = new Player(name, Math.floor((Math.random() * (game.canvas.width - 50))), Math.floor((Math.random() * (game.canvas.height - 50))));
  var gameWorker = new Worker('javascripts/gameWorker.js')
  gameWorker.postMessage({"player": game.player.playerData()})

  window.requestAnimationFrame(function render(){
    game.renderGraphics();
    window.requestAnimationFrame(render)
  })
}

// player hp / game mechanics
// animations
