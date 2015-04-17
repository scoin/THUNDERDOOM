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
    "coords": {"x": Math.floor((Math.random() * (canvas.width - 50))), "y": Math.floor((Math.random() * (canvas.height - 50)))},
    "imageDirection": 4
  }
  var otherPlayers = {};
  var projectiles = {};
  var clientData = {};

  clientData.firstRunData = {"player": player, "canvas": {"width": canvas.width, "height": canvas.height}}

  gameWorker.postMessage(clientData);

  delete clientData.firstRunData;

  var playerEvents = {"keysDown": {}, "mouseCoords": [], "mouseDown": false, "fireProjectile": false};

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

  gameWorker.onmessage = function(e){
    if(e.data.playerData){
      var playerData = e.data.playerData
      player.coords = playerData.coords
      player.imageDirection = playerData.imageDirection
      player.kills = playerData.kills
    }
    else if(e.data.playerId){
      player.id = e.data.playerId
    }
  }

  canvas.drawBackground();

  window.requestAnimationFrame(function render(){
    clientData.playerEvents = playerEvents;
    gameWorker.postMessage(clientData);
    playerEvents.fireProjectile = false;
    canvas.drawForeground(player, otherPlayers, projectiles);
    window.requestAnimationFrame(render)
  })

}
