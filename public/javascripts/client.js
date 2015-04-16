var controls = {
      "W": "up",
      "S": "down",
      "A": "left",
      "D": "right"
  }

window.onload = function(){
  var gameWorker = new Worker('javascripts/gameWorker.js');
  var name = prompt("Enter a badass wizard name");
  var canvas = new Canvas();
  var player = {
    "name": name,
    "color": "blue",
    "coords": [Math.floor((Math.random() * (canvas.width - 50))), Math.floor((Math.random() * (canvas.height - 50)))]
  }
  var clientData = {};

  clientData.player = player;
  clientData.firstRun = true;

  gameWorker.postMessage(clientData);

  clientData.firstRun = false;

  canvas.drawBackground();

  gameWorker.onmessage = function(gameData){
    player = gameData.player;
    otherPlayers = gameData.otherPlayers;
    projectiles = gameData.projectiles;
  }

  var playerEvents = {};
  window.onkeydown = function(e){
    playerEvents.keysDown[controls[String.fromCharCode(e.which)]] = true;
  }
  window.onkeyup = function(e){
    delete playerEvents.keysDown[controls[String.fromCharCode(e.which)]];
  }
  window.onmousemove = function(e){
    playerEvents.mouseCoords = [e.clientX, e.clientY];
  }
  window.onmousedown = function(e){
    playerEvents.mouseDown = true;
  }
  window.onmouseup = function(e){
    playerEvents.fireProjectile = true;
    playerEvents.mouseDown = false;
  }

  window.requestAnimationFrame(function render(){
    clientData.player = player;
    clientData.playerEvents = playerEvents;
    gameWorker.postMessage(clientData);
    playerEvents.fireProjectile = false;
    canvas.drawForeground(player, players, projectiles);
    window.requestAnimationFrame(render)
  })

}