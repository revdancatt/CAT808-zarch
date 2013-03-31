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
        y: -32
    },
    screenResizeTmr: null,
    fps: 0,
    startTime: null,
    frames: 0,
    frameTmr: null,



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


        setInterval(function() {
            control.drawFrame();
        }, 1000 / 60);
        this.startTime = new Date();
        control.drawFrame();


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
        var mapY, mapX, pixelOffset, brightnessMod;

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

                //  get the hight map adjustment
                topLeft.y -= (Math.floor(this.heightData.data[((mapY * this.mapCanvas.width) + mapX) * 4]) - 105 ) * 2;
                topRight.y -= (Math.floor(this.heightData.data[((mapY * this.mapCanvas.width) + (mapX+1)) * 4]) - 105 ) * 2;
                bottomLeft.y -= (Math.floor(this.heightData.data[(((mapY+1) * this.mapCanvas.width) + mapX) * 4]) - 105 ) * 2;
                bottomRight.y -= (Math.floor(this.heightData.data[(((mapY+1) * this.mapCanvas.width) + (mapX+1)) * 4]) - 105 ) * 2;

                this.ctx.beginPath();
                this.ctx.moveTo(topLeft.x       + (this.canvas.width / 2), topLeft.y + yDrawOffset);
                this.ctx.lineTo(topRight.x      + (this.canvas.width / 2) + 1, topRight.y + yDrawOffset);
                this.ctx.lineTo(bottomRight.x   + (this.canvas.width / 2) + 1, bottomRight.y + yDrawOffset + 1);
                this.ctx.lineTo(bottomLeft.x    + (this.canvas.width / 2), bottomLeft.y + yDrawOffset + 1);
                this.ctx.lineTo(topLeft.x       + (this.canvas.width / 2), topLeft.y + yDrawOffset);
                this.ctx.fill();
            }

        }

        this.position.y = Math.cos(this.frames/221) * (38 + (20 * Math.cos(this.frames/301)));
        this.position.x = -Math.sin(this.frames/223) * (38 + (20 * Math.cos(this.frames/273)));

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