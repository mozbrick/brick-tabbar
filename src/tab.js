(function () {

  /** getWindowViewport() => { top: number, left: number,
                                right: number, bottom: number,
                                width: number, height: number}

  returns the rectangle of the current window viewport, relative to the
  document
  **/
  function getWindowViewport () {
    var docElem = document.documentElement;
    var rect = {
      left: (docElem.scrollLeft || document.body.scrollLeft || 0),
      top: (docElem.scrollTop || document.body.scrollTop || 0),
      width: docElem.clientWidth,
      height: docElem.clientHeight
    };
    rect.right = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;
    return rect;
  }

  /** getRect: DOM element => { top: number, left: number,
                                right: number, bottom: number,
                                width: number, height: number}

  returns the absolute metrics of the given DOM element in relation to the
  document

  returned coordinates already account for any CSS transform scaling on the
  given element
  **/
  function getRect (el) {
    var rect = el.getBoundingClientRect();
    var viewport = getWindowViewport();
    var docScrollLeft = viewport.left;
    var docScrollTop = viewport.top;
    return {
      'left': rect.left + docScrollLeft,
      'right': rect.right + docScrollLeft,
      'top': rect.top + docScrollTop,
      'bottom': rect.bottom + docScrollTop,
      'width': rect.width,
      'height': rect.height
    };
  }

  /* _pointIsInRect: (Number, Number, {left: number, top: number,
                                       right: number, bottom: number})
  */
  function _pointIsInRect (x, y, rect) {
    return (rect.left <= x && x <= rect.right &&
            rect.top <= y && y <= rect.bottom);
  }
  function _onTabbarTabTap (tabEl) {
    if (tabEl.parentNode.nodeName.toLowerCase() === "x-tabbar") {
      var targetEvent = tabEl.targetEvent; // getter handles casing
      var targets = (tabEl.targetSelector) ?
                    document.querySelectorAll(tabEl.targetSelector) :
                    tabEl.targetElems;

      for (var i = 0; i < targets.length; i++) {
        targets[i].dispatchEvent(new CustomEvent(targetEvent, {'bubbles': true}));
      }
    }
  }

  var TabbarTabPrototype = Object.create(HTMLElement.prototype);

  // Lifecycle methods

  TabbarTabPrototype.attachedCallback = function () {
    var self = this;
    self.settings = {};
    self.settings.targetSelector = this.getAttribute("target-selector") || null;
    // for when the user provides DOM programmatically
    // instead of through selector
    self.settings.overrideTargetElems = null;
    self.settings.targetEvent = null;
    self.addEventListener("select", function(e){
      console.log("select");
      var tabEl = e.currentTarget;
      _onTabbarTabTap(tabEl);
    });
    self.addEventListener("click", function(e){
      console.log("click");
      var tabEl = e.currentTarget;
      // for touchend, ensure that we actually tapped and didn't drag
      // off
      if (e.changedTouches && e.changedTouches.length > 0) {
        var releasedTouch = e.changedTouches[0];
        var tabRect = getRect(tabEl);
        if (_pointIsInRect(releasedTouch.pageX, releasedTouch.pageY,
                          tabRect)) {
            _onTabbarTabTap(tabEl);
        }
      } else {
        _onTabbarTabTap(tabEl);
      }
    });
  };

  TabbarTabPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  var attrs = {
    'target-selector': function (oldVal, newVal) {
      this.settings.targetSelector = newVal;
    },
    'target-event': function (oldVal, newVal) {
      this.settings.targetEvent = newVal;
    }
  };

  TabbarTabPrototype.select = function() {
    // has to bubble
    this.dispatchEvent(new CustomEvent('select',{'bubbles': true}));
  };

  Object.defineProperties(TabbarTabPrototype, {
    'targetSelector': {
      get : function () {
        return this.settings.targetSelector;
      },
      set : function (newVal) {
        this.settings.targetSelector = newVal;
        this.setAttribute('target-selector', newVal);
      }
    },
    'targetEvent': {
      get : function () {
        if (this.settings.targetEvent) {
          return this.settings.targetEvent;
        } else if (this.parentNode.nodeName.toLowerCase() === "x-tabbar") {
          return this.parentNode.targetEvent;
        } else {
          throw "tabbar-tab is missing event to fire";
        }
      },
      set : function (newVal) {
        this.settings.targetEvent = newVal;
        this.setAttribute('target-event', newVal);
      }
    }
  });

  window.TabbarTab = document.registerElement('x-tabbar-tab', {
    prototype: TabbarTabPrototype
  });

})();
