var controls = {
  "W": "up",
  "S": "down",
  "A": "left",
  "D": "right"
}

window.onload = function(){
  var canvas = new Canvas();
  var otherPlayers = {};
  var projectiles = {};
  var clientData = {};

  canvas.drawBackground();

  document.forms.wizardInfo.addEventListener("submit", function(e){
    var form = this;
    e.preventDefault();
    form.submit.disabled = true
    form.style.visibility = "hidden";

    var player = {
      "name": form.name.value,
      "color": form.color.value,
      "coords": {"x": Math.floor((Math.random() * (canvas.width - 50))), "y": Math.floor((Math.random() * (canvas.height - 50)))},
      "imageDirection": 4
    }

    var gameWorker = new Worker('javascripts/gameWorker.js');
    gameWorker.postMessage({"firstRunData": {"player": player, "canvas": {"width": canvas.width, "height": canvas.height}}});

    var playerEvents = {"keysDown": {}, "mouseCoords": [0,0], "mouseDown": false};

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
      playerEvents.mouseDown = false;
    }

    gameWorker.onmessage = function(e){
      if(e.data.gameData){
        var playerData = e.data.gameData.playerData
        player.coords = playerData.coords
        player.imageDirection = playerData.imageDirection
        player.kills = playerData.kills

        projectiles = e.data.gameData.projectiles

        otherPlayers = e.data.gameData.otherPlayers
      }
      else if(e.data.playerId){
        player.id = e.data.playerId
      }
    }


  canvas.drawBackground();
  canvas.initImages(function(){
    window.requestAnimationFrame(function render(){
      gameWorker.postMessage({"playerEvents": playerEvents});
      canvas.drawForeground(player, otherPlayers, projectiles);
      window.requestAnimationFrame(render)
    })
  });
  }, false)
}
