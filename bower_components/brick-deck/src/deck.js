(function () {

  var requestAnimationFrame = window.requestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              function (fn) { setTimeout(fn, 16); };

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

  var skipFrame = function(fn){
    requestAnimationFrame(function(){ requestAnimationFrame(fn); });
  };

  var sides = {
        next: ['nextElementSibling', 'firstElementChild'],
        previous: ['previousElementSibling', 'lastElementChild']
      };

  function indexOfCard(deck, card){
    return Array.prototype.indexOf.call(deck.children, card);
  }

  function getCard(deck, item){
    if (item && item.nodeName) {
      return item;
    } else {
      if (isNaN(item)) {
        return deck.querySelector(item);
      } else {
        return deck.children[item];
      }
    }
  }

  // check if a card in in a deck and has the given selected state
  function checkCard(deck, card, selected){
    return card &&
           (selected ? card === deck.selectedCard : card !== deck.selectedCard) &&
           deck === card.parentNode &&
           card.nodeName.toLowerCase() === 'brick-card';
  }

  function shuffle(deck, side, direction){
    var getters = sides[side];
    var selected = deck.selectedCard && deck.selectedCard[getters[0]];
    if (selected) {
      deck.showCard(selected, direction);
    } else if (deck.loop || deck.selectedIndex === -1) {
      deck.showCard(deck[getters[1]], direction);
    }
  }

  var BrickDeckElementPrototype = Object.create(HTMLElement.prototype);

  BrickDeckElementPrototype.attachedCallback = function() {
    this.ns = {};
    this.revealHandler = delegate('brick-card', function(e) {
      e.currentTarget.showCard(this);
    });
    this.addEventListener('reveal', this.revealHandler);
  };

  BrickDeckElementPrototype.detachedCallback = function() {
    this.removeEventListener('reveal', this.revealHandler);
  };

  BrickDeckElementPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  var attrs = {
    'selected-index': function (oldVal, newVal) {
      var index = parseInt(newVal);
      if (!isNaN(index)  && this.cards[index] !== this.selectedCard) {
        this.showCard(index);
      }
    }
  };

  BrickDeckElementPrototype.nextCard = function(direction){
    shuffle(this, 'next', direction);
  };

  BrickDeckElementPrototype.previousCard = function(direction){
    shuffle(this, 'previous', direction);
  };

  BrickDeckElementPrototype.showCard = function(item, direction){
    var card = getCard(this, item);

    if (checkCard(this, card, false)) {
      var selected = this.ns.selected;
      var currentIndex = indexOfCard(this, selected);
      var nextIndex = indexOfCard(this, card);

      if (!direction) {
        direction = nextIndex > currentIndex ? 'forward' : 'reverse';
        // if looping is turned on, check if the other way round is shorter
        if (this.loop) {
          var dist = nextIndex - currentIndex;
          var distLooped = this.cards.length - Math.max(nextIndex,currentIndex) + Math.min(nextIndex,currentIndex);
          if (Math.abs(distLooped) < Math.abs(dist)) {
            direction = nextIndex < currentIndex ? 'forward' : 'reverse';
          }
        }
      }

      if (selected) { this.hideCard(selected, direction); }

      this.ns.selected = card;
      this.ns.selectedIndex = nextIndex;
      this.setAttribute("selected-index", nextIndex);

      if (!card.selected) { card.selected = true; }


      var hasTransition = card.hasAttribute('transition-type') || this.hasAttribute('transition-type');
      if (hasTransition) {
        // set attributes, set transitionend listener, skip a frame set transition attribute
        card.setAttribute('show','');
        card.setAttribute('transition-direction', direction);
        var transitionendHandler = function() {
          card.dispatchEvent(new CustomEvent('show',{'bubbles': true}));
          card.removeEventListener('transitionend', transitionendHandler);
        };
        card.addEventListener('transitionend', transitionendHandler);
        skipFrame(function(){ card.setAttribute('transition', 'show'); });
      } else {
        card.dispatchEvent(new CustomEvent('show',{'bubbles': true}));
      }

    }
  };

  BrickDeckElementPrototype.hideCard = function(item, direction){
    var card = getCard(this, item);
    if (checkCard(this, card, true)) {
      this.ns.selected = null;
      if (card.selected) {
        card.selected = false;
      }
      card.removeAttribute('show');
      var hasTransition = card.hasAttribute('transition-type') || this.hasAttribute('transition-type');
      if (hasTransition) {
        // set attributes, set transitionend listener, skip a frame set transition attribute
        card.setAttribute('hide', '');
        card.setAttribute('transition-direction', direction || 'reverse');
        var transitionendHandler = function() {
          card.removeAttribute('hide');
          card.removeAttribute('transition');
          card.removeAttribute('transition-direction');
          card.dispatchEvent(new CustomEvent('hide',{'bubbles': true}));
          card.removeEventListener('transitionend', transitionendHandler);
        };
        card.addEventListener('transitionend', transitionendHandler);
        skipFrame(function(){ card.setAttribute('transition', 'show'); });
      } else {
        card.dispatchEvent(new CustomEvent('hide',{'bubbles': true}));
      }
    }
  };

  // Property handlers
  Object.defineProperties(BrickDeckElementPrototype, {
    'loop': {
      get: function() {
        return this.hasAttribute('loop');
      },
      set: function(newVal) {
        if (newVal) {
          this.setAttribute('loop', newVal);
        } else {
          this.removeAttribute('loop');
        }
      }
    },
    'cards': {
      get: function () {
        var cardList = this.querySelectorAll("brick-card");
        return Array.prototype.slice.call(cardList);
      }
    },
    'selectedCard': {
      get: function() {
        return this.ns.selected || null;
      },
      set: function(card) {
        this.showCard(card);
      }
    },
    'selectedIndex': {
      get: function() {
        return this.hasAttribute('selected-index') ? Number(this.getAttribute('selected-index')) : -1;
      },
      set: function(value) {
        var index = Number(value);
        var card = this.cards[index];
        if (card) {
          if (card !== this.ns.selected) {
            this.showCard(card);
          }
        } else {
          this.removeAttribute('selected-index');
          if (this.ns.selected) {
            this.hideCard(this.ns.selected);
          }
        }
      }
    },
    'transitionType': {
      get: function() {
        return this.getAttribute('transition-type');
      },
      set: function(newVal) {
        this.setAttribute('transition-type', newVal);
      }
    }
  });

  // Register the element
  window.BrickDeckElement = document.registerElement('brick-deck', {
    prototype: BrickDeckElementPrototype
  });

})();
