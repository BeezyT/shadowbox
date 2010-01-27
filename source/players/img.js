/**
 * The image player for Shadowbox.
 */

/**
 * Keeps track of 4 floating values (x, y, startx, & starty) that are used in the drag calculations.
 *
 * @type    {Object}
 * @private
 */
var drag,

/**
 * Holds the draggable element so we don't have to fetch it every time the mouse moves.
 *
 * @type    {HTMLElement}
 * @private
 */
draggable,

/**
 * The id to use for the drag layer.
 *
 * @type    {String}
 * @private
 */
dragId = "sb-drag-layer",

/**
 * Resource used to preload images. It's class-level so that when a new
 * image is requested, the same resource can be reassigned, cancelling
 * the original's callback.
 *
 * @type    {HTMLElement}
 * @private
 */
pre;

/**
 * Resets the class drag variable.
 *
 * @private
 */
function resetDrag() {
    drag = {
        x:      0,
        y:      0,
        startx: null,
        starty: null
    };
}

/**
 * Toggles the drag function on and off.
 *
 * @param   {Number}    height  The height of the drag layer
 * @param   {Number}    width   The width of the drag layer
 * @private
 */
function toggleDrag(height, width) {
    if (height) {
        resetDrag();

        // add transparent drag layer to prevent browser dragging of actual image
        var style = [
            "position:absolute",
            "height:" + height + "px",
            "width:" + width + "px",
            "cursor:" + (S.isGecko ? "-moz-grab" : "move"),
            "background-color:" + (S.isIE ? "#fff;filter:alpha(opacity=0)" : "transparent")
        ].join(";");

        appendHTML(S.skin.body, '<div id="' + dragId + '" style="' + style + '"></div>');
        addEvent(dragLayer, "mousedown", listenDrag);
    } else {
        var dragLayer = get(dragId);
        if (dragLayer) {
            removeEvent(dragLayer, "mousedown", listenDrag);
            remove(dragLayer);
        }
        draggable = null;
    }
}

/**
 * Sets up a drag listener on the document. Called when the mouse button is
 * pressed (mousedown).
 *
 * @param   {Event}     e   The mousedown event
 * @private
 */
function listenDrag(e) {
    // prevent browser dragging
    preventDefault(e);

    var xy = getPageXY(e);
    drag.startx = xy[0];
    drag.starty = xy[1];

    draggable = get(S.playerId);
    addEvent(document, "mousemove", positionDrag);
    addEvent(document, "mouseup", unlistenDrag);

    if (S.isGecko)
        get(dragId).style.cursor = "-moz-grabbing";
}

/**
 * Removes the drag listener. Called when the mouse button is released
 * (mouseup).
 *
 * @private
 */
function unlistenDrag() {
    removeEvent(document, "mousemove", positionDrag);
    removeEvent(document, "mouseup", unlistenDrag);

    if (S.isGecko)
        get(dragId).style.cursor = "-moz-grab";
}

/**
 * Positions an oversized image on drag.
 *
 * @param   {Event}     e   The mousemove event
 * @private
 */
function positionDrag(e) {
    var player = S.player,
        dims = S.dimensions,
        xy = getPageXY(e);

    var movex = xy[0] - drag.startx;
    drag.startx += movex;
    // x boundaries
    drag.x = Math.max(Math.min(0, drag.x + movex), dims.innerWidth - player.width);
    draggable.style.left = drag.x + "px";

    var movey = xy[1] - drag.starty;
    drag.starty += movey;
    // y boundaries
    drag.y = Math.max(Math.min(0, drag.y + movey), dims.innerHeight - player.height);
    draggable.style.top = drag.y + "px";
}

/**
 * Constructor. The image player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.img = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // preload the image
    this.ready = false;
    var self = this;
    pre = new Image();
    pre.onload = function() {
        // height/width defaults to image height/width
        self.height = obj.height ? parseInt(obj.height, 10) : pre.height;
        self.width = obj.width ? parseInt(obj.width, 10) : pre.width;

        // ready to go
        self.ready = true;

        // clean up to prevent memory leak in IE
        pre.onload = null;
        pre = null;
    }
    pre.src = obj.content;
}

S.img.ext = ["bmp", "gif", "jpg", "jpeg", "png"];

S.img.prototype = {

    /**
     * Appends this image to the document.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        var img = document.createElement("img");
        img.id = this.id;
        img.src = this.obj.content;
        img.style.position = "absolute";

        // need to use setAttribute here for IE's sake
        img.setAttribute("height", dims.innerHeight)
        img.setAttribute("width", dims.innerWidth)

        body.appendChild(img);
    },

    /**
     * Removes this image from the document.
     *
     * @public
     */
    remove: function() {
        var el = get(this.id);
        if (el)
            remove(el);

        // disable drag layer
        toggleDrag();

        // prevent old image requests from loading
        if (pre) {
            pre.onload = null;
            pre = null;
        }
    },

    /**
     * An optional callback function to process after this content has been
     * loaded.
     *
     * @public
     */
    onLoad: function() {
        var dims = S.dimensions;

        // listen for drag, in the case of oversized images, the "resized"
        // height/width will actually be the original image height/width
        if (dims.oversized && S.options.handleOversize == "drag")
            toggleDrag(dims.resizeHeight, dims.resizeWidth);
    },

    /**
     * Called when the window is resized.
     *
     * @public
     */
    onWindowResize: function() {
        var dims = S.dimensions,
            el = get(this.id);

        switch (S.options.handleOversize) {
        case "resize":
            el.height = dims.innerHeight;
            el.width = dims.innerWidth;
            break;
        case "drag":
            if (draggable) {
                var top = parseInt(getStyle(draggable, "top")),
                    left = parseInt(getStyle(draggable, "left"));
                // fix positioning when enlarging viewport
                if (top + this.height < dims.innerHeight)
                    draggable.style.top = dims.innerHeight - this.height + "px";
                if (left + this.width < dims.innerWidth)
                    draggable.style.left = dims.innerWidth - this.width + "px";
            }
            break;
        }
    }

}
