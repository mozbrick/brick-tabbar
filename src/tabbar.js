// todo:
// click + tap
// targetElems

(function () {

  function delegate(delegateEl, type, selector, handler) {
    delegateEl.addEventListener(type, function(event) {
      var target = event.target;
      var matches = delegateEl.querySelectorAll(selector);
      for (var el = target; el.parentNode && el !== delegateEl; el = el.parentNode) {
        for (var i = 0; i < matches.length; i++) {
          if (matches[i] === el) {
            handler.call(el, event);
            return;
          }
        }
      }
    });
  }

  function _selectTab(tabEl) {
    var activeTab = tabEl.parentNode.querySelectorAll('x-tabbar-tab[selected]');
    for (var i = 0; i < activeTab.length; i++) {
      activeTab[i].removeAttribute('selected');
    }
    tabEl.setAttribute('selected', true);
  }

  var TabbarPrototype = Object.create(HTMLElement.prototype);

  // Lifecycle methods

  TabbarPrototype.attachedCallback = function () {
    var self = this;
    self.settings = {};
    self.settings.overallEventToFire = this.getAttribute("target-event") ||
                                       "reveal";
    delegate(self,"select","x-tabbar-tab",function(){
      console.log("delegate select");
      _selectTab(this);
    });
    delegate(self,"click","x-tabbar-tab",function(){
      console.log("delegate click");
      _selectTab(this);
    });
  };

  TabbarPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  var attrs = {
    'target-event': function (oldVal, newVal) {
      this.settings.overallEventToFire = newVal;
    }
  };

  Object.defineProperties(TabbarPrototype, {
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

  window.Tabbar = document.registerElement('x-tabbar', {
    prototype: TabbarPrototype
  });

})();
