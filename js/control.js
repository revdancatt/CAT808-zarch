control = {

    pause: false,
    grid: [
        {y: 0,    x: 179},
        {y: 11,   x: 187},
        {y: 26,   x: 199},
        {y: 44,   x: 212},
        {y: 64,   x: 228},
        {y: 88,   x: 246},
        {y: 116,  x: 267},
        {y: 149,  x: 291},
        {y: 188,  x: 322},
        {y: 237,  x: 359}
    ],
    dims: {
        width: null,
        height: null,
        maxX: 12,
        maxY: 9
    },
    position: {
        x: 0,
        y: 0,
        facing: 0, // 0 is north
        tilt: 0, // 0 is flat, 90 is, well tilted 90 degrees.
        speed: 0,
        speedLimit: 5
    },
    velocity: {
        facing: 0,
        tilt: 0,
        speed: 0,
        facingLimit: 3,
        tiltLimit: 1
    },
    dampening: {
        facing: 0.9,
        velocityTilt: 0.9,
        positionTilt: 0.995,
        speed: 0.8
    },
    screenResizeTmr: null,
    fps: 0,
    startTime: null,
    frames: 0,
    frameTmr: null,
    keyControls: {
        isLeftDown: false,
        isRightDown: false,
        isTiltForwardDown: false,
        isTiltBackDown: false,
        isThrustDown: false
    },



    init: function() {

        this.canvas = document.getElementById('landscape');
        this.ctx = this.canvas.getContext('2d');
        this.dims.width = this.canvas.width;
        this.dims.height = this.canvas.height;

        //  set the size of the thingy.
        utils.setStage();
        $(window).on('resize', function() {
            clearTimeout(control.screenResizeTmr);
            control.screenResizeTmr = setTimeout(function() {
                utils.setStage();
            }, 333);
        });

        //  Copy the image map to the canvas map
        this.mapCanvas = document.getElementById("map");
        this.mapCtx = this.mapCanvas.getContext("2d");
        var img = $('.map img')[0];
        this.mapCtx.drawImage(img,0,0);
        this.mapData = this.mapCtx.getImageData(0, 0, this.mapCanvas.width, this.mapCanvas.height);

        //  Copy the image height to the canvas height
        this.heightCanvas = document.getElementById("height");
        this.heightCtx = this.heightCanvas.getContext("2d");
        img = $('.height img')[0];
        this.heightCtx.drawImage(img,0,0);
        this.heightData = this.heightCtx.getImageData(0, 0, this.heightCanvas.width, this.heightCanvas.height);


        //  Bind the keys
        //  Yeah ok, so this kinda grew & not the idea way to do this, but it'll do
        //  for the moment.
        //  Normal up/down, left/right cursor and WASD controls, space for thrust
        $(document).bind('keydown', function(e) {
            if (e.keyCode == 39 || e.keyCode == 68) control.keyControls.isRightDown = true;         //  cursor right || D
            if (e.keyCode == 37 || e.keyCode == 65) control.keyControls.isLeftDown = true;          //  cursor left || A
            if (e.keyCode == 38 || e.keyCode == 87) control.keyControls.isTiltForwardDown = true;   //  cursor up || W
            if (e.keyCode == 40 || e.keyCode == 83) control.keyControls.isTiltBackDown = true;      //  cursor down || S
            if (e.keyCode == 32) control.keyControls.isThrustDown = true;                           //  space bar
        });

        $(document).bind('keyup', function(e) {
            if (e.keyCode == 39 || e.keyCode == 68) control.keyControls.isRightDown = false;        //  cursor right || D
            if (e.keyCode == 37 || e.keyCode == 65) control.keyControls.isLeftDown = false;         //  cursor left || A
            if (e.keyCode == 38 || e.keyCode == 87) control.keyControls.isTiltForwardDown = false;  //  cursor up || W
            if (e.keyCode == 40 || e.keyCode == 83) control.keyControls.isTiltBackDown = false;     //  cursor down || S
            if (e.keyCode == 32) control.keyControls.isThrustDown = false;                          //  space bar
        });

        setInterval(function() {
            control.calculatePosition();
            control.drawFrame();
            control.drawShip();
        }, 1000 / 60);
        this.startTime = new Date();
        control.calculatePosition();
        control.drawFrame();
        control.drawShip();

    },

    calculatePosition: function() {

        //  Dampen everything
        //  For the moment we'll dampen the turn speed and the "thrust" speed
        //  The *speed* at the moment is just a function of the tilt because
        //  I'm not throwing the code in for "thrust" yet. When I do the
        //  forward velocity and upward velocity will be a function of tilt *and*
        //  thrust (and gravity)
        //  But for the moment the height will stay steady and speed = tilt.
        this.velocity.facing = this.velocity.facing * this.dampening.facing;
        this.velocity.tilt = this.velocity.tilt * this.dampening.velocityTilt;
        this.position.tilt = this.position.tilt * this.dampening.positionTilt;
        this.position.speed = this.position.speed * this.dampening.speed;

        //  To start off with let's figure out how much to turn the ship
        //  the controls don't directly effect the facing of the ship
        //  but rather the "velocity" by which we're turning it
        //  holding the keys down increases or decrease the velocity
        //  which in turn effects the facing
        if (this.keyControls.isRightDown) this.velocity.facing += 0.3;
        if (this.keyControls.isLeftDown) this.velocity.facing -= 0.3;

        //  make sure the velocity doesn't exceed our limits, i.e. we can only turn
        //  a maximum of [x] per frame
        //  if x is 3, then we can turn 360 every 120 frames, running at 60fps we ca
        //  do a full turn once every 2 seconds.
        if (this.velocity.facing > this.velocity.facingLimit) this.velocity.facing = this.velocity.facingLimit;
        if (this.velocity.facing < -this.velocity.facingLimit) this.velocity.facing = -this.velocity.facingLimit;

        //  *now* we can adjust the facing
        this.position.facing += this.velocity.facing;
        if (this.position.facing < 0) this.position.facing = 360 + this.position.facing;
        if (this.position.facing > 359) this.position.facing = 360 - this.position.facing;

        //  And we get to do it all over again with the tilt
        //  SEE above for what's going on
        if (this.keyControls.isTiltForwardDown) this.velocity.tilt += 0.1;
        if (this.keyControls.isTiltBackDown) this.velocity.tilt -= 0.1;
        if (this.velocity.tilt > this.velocity.tiltLimit) this.velocity.tilt = this.velocity.tiltLimit;
        if (this.velocity.tilt < -this.velocity.tiltLimit) this.velocity.tilt = -this.velocity.tiltLimit;
        this.position.tilt += this.velocity.tilt;
        if (this.position.tilt < 0) this.position.tilt = 0;
        if (this.position.tilt > 90) this.position.tilt = 90;

        //  For simplicity sake at the moment we'll have the speed being a function of the tilt
        this.position.speed += (this.position.tilt / 90);
        if (this.position.speed > this.position.speedLimit) this.position.speed = this.position.speedLimit;

        $('#debug').html('facing = ' +
            Math.floor(this.position.facing) +
            '<br />' +
            'tilt = ' +
            Math.floor(this.position.tilt) +
            '<br />' +
            'speed = ' +
            Math.floor(this.position.speed*100)/100);

        var velX = Math.sin(this.position.facing * Math.PI / 180) * this.position.speed / 20;
        var velY = -Math.cos(this.position.facing * Math.PI / 180) * this.position.speed / 20;

        this.position.y += velY;
        this.position.x += velX;

        /*
        this.position.y = Math.cos(this.frames/221) * (38 + (20 * Math.cos(this.frames/301)));
        this.position.x = -Math.sin(this.frames/223) * (38 + (20 * Math.cos(this.frames/273)));
        */

        if (this.position.y < -(this.mapCanvas.height / 2)) this.position.y = this.mapCanvas.height + this.position.y;
        if (this.position.y >= this.mapCanvas.height / 2) this.position.y = this.position.y - this.mapCanvas.height;

        if (this.position.x < -(this.mapCanvas.width / 2)) this.position.x = this.mapCanvas.width + this.position.x;
        if (this.position.x >= this.mapCanvas.width / 2) this.position.x = this.position.x - this.mapCanvas.width;

        $('.position').css({
            top: Math.floor((this.mapCanvas.height / 2) + this.position.y),
            left: Math.floor((this.mapCanvas.width / 2) + this.position.x)
        });

        this.frames++;
        document.getElementById('fps').innerHTML = 'fps: ' + Math.floor(this.frames / (new Date() - this.startTime) * 10000) / 10;

    },

    drawFrame: function() {

        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.dims.width, this.dims.height);

        //  This is the vertical offset position 
        var yDrawOffset = 232;

        //  Now we want to loop thru the position drawing the tiles
        //  from the back to the front
        this.ctx.strokeStyle = '#000';


        //  Workout what the y offset is
        var yOffset = this.position.y - Math.floor(this.position.y);
        var xOffset = this.position.x - Math.floor(this.position.x);
        if (xOffset !== 0) xOffset = 1 - xOffset;
        if (yOffset !== 0) yOffset = 1 - yOffset;
        var topY, topYStart, topYEnd, topTileWidth;
        var bottomY, bottomYStart, bottomYEnd, bottomTileWidth;
        var mapY, mapX, mapYPlusOne, mapXPlusOne, pixelOffset, brightnessMod;

        for (var y = 0; y <= this.dims.maxY; y++) {

            //  At some point we need to work out which tile
            //  we are looking at, but for the moment let's just
            //  be happy that we are dealing the lines

            //  If the y row is current 0 then the top position is
            //  going to be the root 0 position
            if (y === 0) {
                topY = this.grid[0].y;
                topYStart = -this.grid[0].x;
                topYEnd = this.grid[0].x;
            } else {
                topY = this.grid[y-1].y + ((this.grid[y].y - this.grid[y-1].y) * yOffset);
                topYEnd = this.grid[y-1].x + ((this.grid[y].x - this.grid[y-1].x) * yOffset);
                topYStart = -topYEnd;
            }
            topTileWidth = (topYEnd - topYStart) / this.dims.maxX;

            if (y == this.dims.maxY) {
                bottomY = this.grid[this.dims.maxY].y;
                bottomYStart = -this.grid[this.dims.maxY].x;
                bottomYEnd = this.grid[this.dims.maxY].x;
            } else {
                bottomY = this.grid[y].y + ((this.grid[y+1].y - this.grid[y].y) * yOffset);
                bottomYEnd = this.grid[y].x + ((this.grid[y+1].x - this.grid[y].x) * yOffset);
                bottomYStart = -bottomYEnd;
            }
            bottomTileWidth = (bottomYEnd - bottomYStart) / this.dims.maxX;

            //  Get the mapY
            mapY = (this.mapCanvas.height / 2) + y - Math.floor(this.dims.maxY / 2) + Math.floor(this.position.y);
            if (mapY < 0) mapY = this.mapCanvas.height + mapY;
            if (mapY >= this.mapCanvas.height) mapY = mapY - this.mapCanvas.height;

            //  set the brightness mod
            brightnessMod = 0.4 + (0.6 * ((y+yOffset) / this.dims.maxY));

            //  Now lets throw the x loop into the mix
            for (var x = 0; x <= this.dims.maxX; x++) {

                //  Set the left side of the tile, if it's
                //  0 then we mark it as flush with the
                //  left, otherwise we need the offset
                if (x === 0) {
                    topLeft = {
                        x: topYStart,
                        y: topY
                    };
                    bottomLeft = {
                        x: bottomYStart,
                        y: bottomY
                    };
                } else {
                    topLeft = {
                        x: topYStart + ((x-1) * topTileWidth) + (topTileWidth * xOffset),
                        y: topY
                    };
                    bottomLeft = {
                        x: bottomYStart + ((x-1) * bottomTileWidth) + (bottomTileWidth * xOffset),
                        y: bottomY
                    };
                }

                if (x == this.dims.maxX) {
                    topRight = {
                        x: topYEnd,
                        y: topY
                    };
                    bottomRight = {
                        x: bottomYEnd,
                        y: bottomY
                    };
                } else {
                    topRight = {
                        x: topYStart + (x * topTileWidth) + (topTileWidth * xOffset),
                        y: topY
                    };
                    bottomRight = {
                        x: bottomYStart + (x * bottomTileWidth) + (bottomTileWidth * xOffset),
                        y: bottomY
                    };
                }

                //  Get the mapX
                mapX = (this.mapCanvas.width / 2) + x - Math.floor(this.dims.maxX / 2) + Math.ceil(this.position.x);
                if (mapX < 0) mapX = this.mapCanvas.width + mapX;
                if (mapX >= this.mapCanvas.width) mapX = mapX - this.mapCanvas.width;

                //  get the color from the map data
                pixelOffset = ((mapY * this.mapCanvas.width) + mapX) * 4;
                this.ctx.fillStyle = 'rgb(' + Math.floor(this.mapData.data[pixelOffset]*brightnessMod) + ', ' + Math.floor(this.mapData.data[pixelOffset+1]*brightnessMod) + ', ' + Math.floor(this.mapData.data[pixelOffset+2]*brightnessMod) + ')';

                //  get the height map adjustment
                mapYPlusOne = mapY+1;
                if (mapYPlusOne >= this.mapCanvas.height)  mapYPlusOne = 0;
                mapXPlusOne = mapX+1;
                if (mapXPlusOne >= this.mapCanvas.width)  mapXPlusOne = 0;

                topLeft.y -= (Math.floor(this.heightData.data[((mapY * this.mapCanvas.width) + mapX) * 4]) - 105 ) * 2;
                topRight.y -= (Math.floor(this.heightData.data[((mapY * this.mapCanvas.width) + (mapXPlusOne)) * 4]) - 105 ) * 2;
                bottomLeft.y -= (Math.floor(this.heightData.data[(((mapYPlusOne) * this.mapCanvas.width) + mapX) * 4]) - 105 ) * 2;
                bottomRight.y -= (Math.floor(this.heightData.data[(((mapYPlusOne) * this.mapCanvas.width) + (mapXPlusOne)) * 4]) - 105 ) * 2;

                this.ctx.beginPath();
                this.ctx.moveTo(topLeft.x       + (this.canvas.width / 2), topLeft.y + yDrawOffset);
                this.ctx.lineTo(topRight.x      + (this.canvas.width / 2) + 1, topRight.y + yDrawOffset);
                this.ctx.lineTo(bottomRight.x   + (this.canvas.width / 2) + 1, bottomRight.y + yDrawOffset + 1);
                this.ctx.lineTo(bottomLeft.x    + (this.canvas.width / 2), bottomLeft.y + yDrawOffset + 1);
                this.ctx.lineTo(topLeft.x       + (this.canvas.width / 2), topLeft.y + yDrawOffset);
                this.ctx.fill();

                mapX = mapX;

            }

        }


    },

    //  Now we are going to draw the ship
    drawShip: function() {

        //  Only we aren't, because that's quite hard and I'll do that next
        //  instead we are going to draw an arrow
        var arrow = [
            {x: 0, y: 10},
            {x: -2, y: 8},
            {x: 2, y: 8}
        ];

        //  Now we need to rotate each of those points around
        //  based on the current facing position
        var point = null;
        var facing = this.position.facing * Math.PI / 180;

        for (var i = 0; i < arrow.length; i++) {
            point = {};
            point.x = parseFloat(arrow[i].x);
            point.y = parseFloat(arrow[i].y);
            arrow[i].x = (point.x * Math.cos(facing) - point.y * Math.sin(facing)) * -5 * (this.position.speed/2 + 1);
            arrow[i].y = (point.x * Math.sin(facing) + point.y * Math.cos(facing)) * -2 * (this.position.speed/2 + 1);
        }

        //  draw the arrow on the page
        //this.ctx.stroke();
        this.ctx.strokeStyle = 'rgb(255, 0, 0)';
        this.ctx.beginPath();
        this.ctx.moveTo(0 + (this.canvas.width / 2), 0 + (this.canvas.height / 3));
        this.ctx.lineTo(arrow[0].x + (this.canvas.width / 2), arrow[0].y + (this.canvas.height / 3));
        this.ctx.lineTo(arrow[1].x + (this.canvas.width / 2), arrow[1].y + (this.canvas.height / 3));
        this.ctx.moveTo(arrow[0].x + (this.canvas.width / 2), arrow[0].y + (this.canvas.height / 3));
        this.ctx.lineTo(arrow[2].x + (this.canvas.width / 2), arrow[2].y + (this.canvas.height / 3));
        this.ctx.stroke();

        //this.ctx.strokeStyle = '#000';

    }



};

utils = {

    log: function(msg) {

        try {
            console.log(msg);
        } catch(er) {
            //  DO NOWT
        }
    },

    setStage: function() {

        var modifier = $(document).width() / control.canvas.width;
        var newHeight = control.canvas.height * modifier;

        //  TODO, we need to check to see if the new height is higher than the 
        //  viewport, if so then we need to match the height and reduce the width

        var newTop = ($(document).height() - newHeight) / 2;
        if (newTop < 0) {
            $('#landscape').css({
                top: 0,
                width: '100%',
                height: '100%'
            });
        } else {
            $('#landscape').css({
                top: newTop,
                width: '100%',
                height: newHeight
            });
        }

    }

};