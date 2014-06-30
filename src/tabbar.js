(function () {

  function delegate(selector, handler) {
    return function(e) {
      var target = e.target;
      var delegateEl = e.currentTarget;
      var matches = delegateEl.querySelectorAll(selector);
      for (var el = target; el.parentNode && el !== delegateEl; el = el.parentNode) {
        for (var i = 0; i < matches.length; i++) {
          if (matches[i] === el) {
            handler.call(el, e);
            return;
          }
        }
      }
    };
  }

  function _selectTab(tabEl) {
    var activeTab = tabEl.parentNode.querySelectorAll('brick-tabbar-tab[selected]');
    for (var i = 0; i < activeTab.length; i++) {
      activeTab[i].removeAttribute('selected');
    }
    tabEl.setAttribute('selected', true);
  }

  var BrickTabbarElementPrototype = Object.create(HTMLElement.prototype);

  BrickTabbarElementPrototype.attachedCallback = function () {
    var self = this;
    self.settings = {};
    self.settings.overallEventToFire = this.getAttribute("target-event") || "reveal";
    self.selectHandler = delegate("brick-tabbar-tab", function(){ _selectTab(this); });
    delegate(self,"select","brick-tabbar-tab", self.selectHandler);
    delegate(self,"click","brick-tabbar-tab", self.selectHandler);
  };

  BrickTabbarElementPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  var attrs = {
    'target-event': function (oldVal, newVal) {
      this.settings.overallEventToFire = newVal;
    }
  };

  Object.defineProperties(BrickTabbarElementPrototype, {
    'targetEvent': {
      get : function () {
        return this.settings.overallEventToFire;
      },
      set : function (newVal) {
        this.settings.overallEventToFire = newVal;
        this.setAttribute('target-event', newVal);
      }
    }
  });

  window.BrickTabbarElement = document.registerElement('brick-tabbar', {
    prototype: BrickTabbarElementPrototype
  });

})();
