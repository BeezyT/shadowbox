// used to match the rel attribute of links
var relAttr = /^(light|shadow)box/i,

/**
 * The name of the expando property that Shadowbox uses on HTML elements
 * to store the cache index of that element.
 *
 * @type    {String}
 * @private
 */
expando = "shadowboxCacheKey";

/**
 * Contains all link objects that have been cached.
 *
 * @type    {Array}
 * @public
 */
S.cache = [];

/**
 * Resolves a link selector. The selector may be omitted to select all anchor elements
 * on the page with rel="shadowbox" or, if Shadowbox.find is used, it may be a single CSS
 * selector or an array of [selector, [context]].
 *
 * @param   {mixed}     selector
 * @return  {Array}     An array of matching link elements
 * @public
 */
S.select = function(selector) {
    var links;

    if (!selector) {
        var rel;
        each(document.getElementsByTagName('a'), function(i, el) {
            rel = el.getAttribute('rel');
            if (rel && relAttr.test(rel))
                links.push(el);
        });
    } else {
        var length = selector.length;
        if (length) {
            if (selector.push) {
                if (S.find && length == 2 && typeof selector[0] == "string" && selector[1].nodeType) {
                    links = S.find(selector[0], selector[1]); // selector + context
                } else {
                    links = selector; // array of links
                }
            } else if (typeof selector == "string" && S.find) {
                links = S.find(selector);
            }
        } else {
            links = [selector]; // single link
        }
    }

    return links;
}

/**
 * Adds all links specified by the given selector to the cache. If no selector
 * is provided, will select every anchor element on the page with rel="shadowbox".
 *
 * Note: Options given here apply only to links selected by the given selector.
 * Also, because <area> elements do not support the rel attribute, they must be
 * explicitly passed to this method.
 *
 * @param   {mixed}     selector
 * @param   {Object}    options     Some options to use for the given links
 * @public
 */
S.setup = function(selector, options) {
    each(S.select(selector), function(i, link) {
        S.addCache(link, options);
    });
}

/**
 * Removes all links specified by the given selector from the cache.
 *
 * @param   {mixed}     selector
 * @public
 */
S.teardown = function(selector) {
    each(S.select(selector), function(i, link) {
        S.removeCache(link);
    });
}

/**
 * Adds the given link element to the cache with the given options.
 *
 * @param   {HTMLElement}   link
 * @param   {Object}        options
 * @public
 */
S.addCache = function(link, options) {
    var cacheKey = link[expando];

    if (typeof cacheKey != "number") {
        cacheKey = S.cache.length;
        // assign cache key expando, use integer primitive to avoid memory leak in IE
        link[expando] = cacheKey;
        // add onclick listener
        addEvent(link, 'click', handleClick);
    }

    S.cache[cacheKey] = S.buildObject(link, options);
}

/**
 * Removes the given link element from the cache.
 *
 * @param   {HTMLElement}   link
 * @public
 */
S.removeCache = function(link) {
    removeEvent(link, 'click', handleClick);
    S.cache[link[expando]] = null;
    link[expando] = null;
    delete link[expando];
}

/**
 * Gets the object from cache representative of the given link element (if there is one).
 *
 * @param   {HTMLElement}   link
 * @return  {Object|null}
 * @public
 */
S.getCache = function(link) {
    var cacheKey = link[expando];
    return cacheKey && cache[cacheKey];
}

/**
 * Removes all onclick listeners from elements that have previously been setup with
 * Shadowbox and clears all objects from cache.
 *
 * @public
 */
S.clearCache = function() {
    each(S.cache, function(i, obj) {
        S.removeCache(obj.link);
    });

    S.cache = [];
}

/**
 * Handles all clicks on links that have been set up to work with Shadowbox
 * and cancels the default event behavior when appropriate.
 *
 * @param   {Event}     e   The click event
 * @private
 */
function handleClick(e) {
    //var link;
    //if(U.isLink(this)){
    //    link = this; // jQuery, Prototype, YUI
    //}else{
    //    link = S.lib.getTarget(e); // Ext, standalone
    //    while(!U.isLink(link) && link.parentNode)
    //        link = link.parentNode;
    //}

    //preventDefault(e); // good for debugging

    S.open(this);

    if (S.gallery.length)
        preventDefault(e);
}
