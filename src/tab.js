// TODO? also accept TargetElems

(function () {

  function _onTapbarTabClick (tabEl) {
    if (tabEl.parentNode.nodeName.toLowerCase() === "brick-tabbar") {
      var targetEvent = tabEl.targetEvent; // getter handles casing
      var targets = (tabEl.targetSelector) ?
                    document.querySelectorAll(tabEl.targetSelector) :
                    tabEl.targetElems;
      for (var i = 0; i < targets.length; i++) {
        targets[i].dispatchEvent(new CustomEvent(targetEvent, {'bubbles': true}));
      }
    }
  }

  var BrickTabbarTabElementPrototype = Object.create(HTMLElement.prototype);

  BrickTabbarTabElementPrototype.attachedCallback = function () {
    var self = this;
    self.settings = {};
    self.settings.targetSelector = this.getAttribute("target-selector") || null;
    self.settings.targetEvent = null;
    self.addEventListener("select", function(e){
      var tabEl = e.currentTarget;
      _onTapbarTabClick(tabEl);
    });
    self.addEventListener("click", function(e){
      var tabEl = e.currentTarget;
      _onTapbarTabClick(tabEl);
    });
  };

  BrickTabbarTabElementPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
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

  BrickTabbarTabElementPrototype.select = function() {
    this.dispatchEvent(new CustomEvent('select',{'bubbles': true}));
  };

  Object.defineProperties(BrickTabbarTabElementPrototype, {
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
        } else if (this.parentNode.nodeName.toLowerCase() === "brick-tabbar") {
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

  window.BrickTabbarTabElement = document.registerElement('brick-tabbar-tab', {
    prototype: BrickTabbarTabElementPrototype
  });

})();
