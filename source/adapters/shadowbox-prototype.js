/**
 * An adapter for Shadowbox and the Prototpe JavaScript library.
 */

if(typeof Prototype == 'undefined')
    throw 'Unable to load Shadowbox adapter, Prototype not found';

if(typeof Shadowbox == 'undefined')
    throw 'Unable to load Shadowbox adapter, Shadowbox not found';

(function(S){

    var E = Event,
        L = Element;

    S.lib = {

        /**
         * Gets the value of the style on the given element.
         *
         * @param   HTMLElement     el          The DOM element
         * @param   String          style       The script name of the style
         *                                      (e.g. marginTop, not margin-top)
         * @return  mixed                       The value of the given style
         * @public
         */
        getStyle: function(el, style){
            return L.getStyle(el, style);
        },

        /**
         * Removes an element from the DOM.
         *
         * @param   HTMLElement     el          The element to remove
         * @return  void
         * @public
         */
        remove: function(el){
            L.remove(el);
        },

        /**
         * Gets the target of the given event. The event object passed will be
         * the same object that is passed to listeners registered with
         * addEvent().
         *
         * @param   mixed           e           The event object
         * @return  HTMLElement                 The event's target element
         * @public
         */
        getTarget: function(e){
            return E.element(e);
        },

        /**
         * Gets the page X/Y coordinates of the mouse event in an [x, y] array.
         * The page coordinates should be relative to the document, and not the
         * viewport. The event object provided here will be the same object that
         * is passed to listeners registered with addEvent().
         *
         * @param   mixed           e           The event object
         * @return  Array                       The page X/Y coordinates
         * @public
         */
        getPageXY: function(e){
            return [E.pointerX(e), E.pointerY(e)];
        },

        /**
         * Prevents the event's default behavior. The event object passed will
         * be the same object that is passed to listeners registered with
         * addEvent().
         *
         * @param   mixed           e           The event object
         * @return  void
         * @public
         */
        preventDefault: function(e){
            E.stop(e);
        },

        /**
         * Gets the key code of the given event object (keydown). The event
         * object here will be the same object that is passed to listeners
         * registered with addEvent().
         *
         * @param   mixed           e           The event object
         * @return  Number                      The key code of the event
         * @public
         */
        keyCode: function(e){
            return e.keyCode;
        },

        /**
         * Adds an event listener to the given element. It is expected that this
         * function will be passed the event as its first argument.
         *
         * @param   HTMLElement     el          The DOM element to listen to
         * @param   String          name        The name of the event to register
         *                                      (i.e. 'click', 'scroll', etc.)
         * @param   Function        handler     The event handler function
         * @return  void
         * @public
         */
        addEvent: function(el, name, handler){
            E.observe(el, name, handler);
        },

        /**
         * Removes an event listener from the given element.
         *
         * @param   HTMLElement     el          The DOM element to stop listening to
         * @param   String          name        The name of the event to stop
         *                                      listening for (i.e. 'click')
         * @param   Function        handler     The event handler function
         * @return  void
         * @public
         */
        removeEvent: function(el, name, handler){
            E.stopObserving(el, name, handler);
        },

        /**
         * Appends an HTML fragment to the given element.
         *
         * @param   HTMLElement     el          The element to append to
         * @param   String          html        The HTML fragment to use
         * @return  void
         * @public
         */
        append: function(el, html){
            L.insert(el, html);
        }

    };

})(Shadowbox);
