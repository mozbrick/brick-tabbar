// remove last card is still buggy if selected

(function () {

  var CardPrototype = Object.create(HTMLElement.prototype);

  CardPrototype.attachedCallback = function () {
    this.ns = {};
    this.ns.selected = this.hasAttribute("selected");
    var deck = this.parentNode;
    if (deck.nodeName.toLowerCase() === 'x-deck') {
      this.ns.deck = deck;
      if (this !== deck.selectedCard && this.selected) {
        deck.showCard(this);
      }
    }
  };

  CardPrototype.detachedCallback = function () {
    var deck = this.ns.deck;
    if (deck) {
      if (this === deck.selectedCard) {
        deck.selectedCard = null;
        deck.removeAttribute('selected-index');
      } else {
        deck.showCard(deck.selectedCard);
      }
      this.ns.deck = null;
    }
  };

  CardPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  // Attribute handlers
  var attrs = {
    'selected': function (oldVal, newVal) {
      this.ns.selected = newVal;
    },
  };

  // Property handlers
  Object.defineProperties(CardPrototype, {
    'selected': {
      get : function () {
        return this.ns.selected;
      },
      set : function (newVal) {
        var deck = this.ns.deck;
        if (deck) {
          if (newVal) {
            if (this === deck.selectedCard) {
              this.setAttribute("selected");
            } else {
              deck.showCard(this);
            }
          } else {
            if (this === deck.selectedCard) {
              deck.hideCard(this);
            } else {
              this.removeAttribute("selected");
            }
          }
        }
      }
    },
    'transitionType': {
      get: function() {
        return this.getAttribute("transition-type");
      },
      set: function(newVal) {
        this.setAttribute("transition-type", newVal);
      }
    }
  });

  // Register the element
  window.CustomElement = document.registerElement('x-card', {
    prototype: CardPrototype
  });

})();
