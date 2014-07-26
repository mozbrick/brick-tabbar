(function () {

  var currentScript = document._currentScript || document.currentScript;



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
    var tabbar = tabEl.parentNode;
    var indicator = tabbar.selectedIndicator;
    var activeTab = tabbar.querySelectorAll('brick-tabbar-tab[selected]');
    for (var i = 0; i < activeTab.length; i++) {
      activeTab[i].removeAttribute('selected');
    }
    tabEl.setAttribute('selected', true);

    var tabs = tabbar.tabs;
    var index = tabs.indexOf(tabEl);
    indicator.style.transform = "translateX(" + 100 * index + "%)";

  }

  var BrickTabbarElementPrototype = Object.create(HTMLElement.prototype);

  BrickTabbarElementPrototype.createdCallback = function () {

    var self = this;
    var importDoc = currentScript.ownerDocument;

    var template = importDoc.querySelector("#brick-tabbar-template");

    // fix styling for polyfill
    if (Platform.ShadowCSS) {
      var style = template.content.querySelector("style");
      console.log(style);
      var cssText = Platform.ShadowCSS.shimCssText(style.textContent, 'brick-tabbar');
      console.log(cssText);
      Platform.ShadowCSS.addCssToDocument(cssText);
      style.remove();
    }

    // create shadowRoot and append template to it.
    var shadowRoot = self.createShadowRoot();
    shadowRoot.appendChild(template.content.cloneNode(true));

    self.selectedIndicator = shadowRoot.querySelector(".selected-indicator");
    self.selectedIndicator.style.width = 100 / self.tabs.length + "%";

    self.selectHandler = delegate("brick-tabbar-tab", function(){
      _selectTab(this);
    });

    self.addEventListener("click", self.selectHandler);
    self.addEventListener("select", self.selectHandler);

  };

  BrickTabbarElementPrototype.detachedCallback = function () {
    this.removeEventListener("click", this.selectHandler);
    this.removeEventListener("select", this.selectHandler);
  };

  Object.defineProperties(BrickTabbarElementPrototype, {
    'targetEvent': {
      get: function () {
        return this.getAttribute("target-event") || "reveal";
      },
      set: function (newVal) {
        this.setAttribute('target-event', newVal);
      }
    },
    'tabs': {
      get: function() {
        var tabList = this.querySelectorAll("brick-tabbar-tab");
        return Array.prototype.slice.call(tabList);
      }
    }
  });

  window.BrickTabbarElement = document.registerElement('brick-tabbar', {
    prototype: BrickTabbarElementPrototype
  });

})();
