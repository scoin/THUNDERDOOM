var Controller = function(){
  this.controls = {
    "W": "up",
    "S": "down",
    "A": "left",
    "D": "right"
  };
  this.canvas = new Canvas();
  this.player = null;
  this.otherPlayers = {};
  this.projectiles = {};
  this.clientData = {};
  this.playerEvents = {"keysDown": {}, "mouseCoords": [0,0], "mouseDown": false};
  this.gameWorker = null;
}

Controller.prototype.initPlayer = function(form){
  var controller = this;
  controller.player = {
    "name": form.name.value,
    "color": form.color.value,
    "coords": {"x": Math.floor((Math.random() * (controller.canvas.width - 50))), "y": Math.floor((Math.random() * (controller.canvas.height - 50)))},
    "imageDirection": 4
  }
}

Controller.prototype.initWindowEvents = function(){
  var controller = this;
  window.onkeydown = function(e){
    controller.playerEvents.keysDown[controller.controls[String.fromCharCode(e.which)]] = true;
  }

  window.onkeyup = function(e){
    delete controller.playerEvents.keysDown[controller.controls[String.fromCharCode(e.which)]];
  }

  window.onmousemove = function(e){
    controller.playerEvents.mouseCoords = [e.clientX, e.clientY];
  }

  window.onmousedown = function(e){
    controller.playerEvents.mouseDown = true;
  }

  window.onmouseup = function(e){
    controller.playerEvents.mouseDown = false;
  }
}

Controller.prototype.initGameWorker = function(){
  var controller = this;
  controller.gameWorker = new Worker('javascripts/gameWorker.js');
}

window.onload = function(){
  var controller = new Controller()
  controller.canvas.drawBackground();

  document.forms.wizardInfo.addEventListener("submit", function(e){
    var form = this;
    e.preventDefault();
    form.submit.disabled = true
    controller.initPlayer(form)

    controller.initGameWorker()
    controller.gameWorker.postMessage({"firstRunData": {"player": controller.player, "canvas": {"width": controller.canvas.width, "height": controller.canvas.height}}});

    controller.initWindowEvents()

    controller.gameWorker.onmessage = function(e){
      if(e.data.gameData){
        var playerData = e.data.gameData.playerData
        controller.player.coords = playerData.coords
        controller.player.imageDirection = playerData.imageDirection
        controller.player.kills = playerData.kills

        controller.projectiles = e.data.gameData.projectiles

        controller.otherPlayers = e.data.gameData.otherPlayers
      }
      else if(e.data.playerId){
        controller.player.id = e.data.playerId
      }
    }

    controller.canvas.initImages(function(){
      window.requestAnimationFrame(function render(){
        controller.gameWorker.postMessage({"playerEvents": controller.playerEvents});
        controller.canvas.drawForeground(controller.player, controller.otherPlayers, controller.projectiles);
        window.requestAnimationFrame(render)
      })
    });
  }, false)
}
