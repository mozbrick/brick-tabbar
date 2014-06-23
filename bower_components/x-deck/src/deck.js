/* globals Event */

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

  // xtag core
  var prefix = (function () {
    var styles = window.getComputedStyle(document.documentElement, ''),
        pre = (Array.prototype.slice
          .call(styles)
          .join('')
          .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
        )[1];
    return {
      dom: pre === 'ms' ? 'MS' : pre,
      lowercase: pre,
      css: '-' + pre + '-',
      js: pre === 'ms' ? pre : pre[0].toUpperCase() + pre.substr(1)
    };
  })();

  var requestFrame = (function(){
    var raf = window.requestAnimationFrame ||
              window[prefix.lowercase + 'RequestAnimationFrame'] ||
              function(fn){ return window.setTimeout(fn, 20); };
    return function(fn){ return raf(fn); };
  })();

  var skipTransition = function(element, fn, bind){
    var prop = prefix.js + 'TransitionProperty';
    element.style[prop] = element.style.transitionProperty = 'none';
    var callback = fn ? fn.call(bind) : null;
    return requestFrame(function(){
      requestFrame(function(){
        element.style[prop] = element.style.transitionProperty = '';
        if (callback) {
          requestFrame(callback);
        }
      });
    });
  };

  // xtag transition
  var matchNum = /[1-9]/,
      replaceSpaces = / /g,
      captureTimes = /(\d|\d+?[.]?\d+?)(s|ms)(?!\w)/gi,
      transPre = 'transition' in getComputedStyle(document.documentElement) ? 't' : prefix.js + 'T',
      transDur = transPre + 'ransitionDuration',
      transProp = transPre + 'ransitionProperty';
  var skipFrame = function(fn){
    requestFrame(function(){ requestFrame(fn); });
  };
  var ready = document.readyState === 'complete' ?
    skipFrame(function(){ ready = false; }) :
    document.addEventListener('readystatechange', function(){
      if (document.readyState === 'complete') {
        skipFrame(function(){ ready = false; });
        document.removeEventListener(document, 'readystatechange', ready);
      }
  });

  function getTransitions(node){
    node.__transitions__ = node.__transitions__ || {};
    return node.__transitions__;
  }

  function startTransition(node, name, transitions) {
    var style = getComputedStyle(node),
        after = transitions[name].after;
    node.setAttribute('transition', name);
    if (after && !style[transDur].match(matchNum)) {
      after();
    }
  }

  document.addEventListener('transitionend', function(e){
    var node = e.target,
        name = node.getAttribute('transition');
    if (name) {
      var i = 0;
      var max = 0;
      var prop = null;
      var style = getComputedStyle(node);
      var transitions = getTransitions(node);
      var props = style[transProp].replace(replaceSpaces, '').split(',');
      style[transDur].replace(captureTimes, function(match, time, unit){
        time = parseFloat(time) * (unit === 's' ? 1000 : 1);
        if (time > max) { prop = i; max = time; }
        i++;
      });
      prop = props[prop];
      if (!prop) {
        throw new SyntaxError('No matching transition property found');
      } else if ( (e.propertyName === prop && transitions[name].after) ) {
        transitions[name].after();
      }
    }
  });

  var transition = function(node, name, obj){
    var transitions = getTransitions(node);
    var options = transitions[name] = obj || {};
    if (options.immediate) { options.immediate(); }
    if (options.before) {
      options.before();
      if (ready) {
        skipTransition(node, function(){
          startTransition(node, name, transitions);
        });
      } else {
        skipFrame(function(){
          startTransition(node, name, transitions);
        });
      }
    } else {
      startTransition(node, name, transitions);
    }
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
           card.nodeName.toLowerCase() === 'x-card';
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

  var DeckPrototype = Object.create(HTMLElement.prototype);

  DeckPrototype.attachedCallback = function() {
    var self = this;
    this.ns = {};
    delegate(self, "reveal", "x-card", function(e){
      e.currentTarget.showCard(this);
    });
  };

  DeckPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  var attrs = {
    'attr': function (oldVal, newVal) {

    }
  };

  DeckPrototype.nextCard = function(direction){
    shuffle(this, 'next', direction);
  };

  DeckPrototype.previousCard = function(direction){
    shuffle(this, 'previous', direction);
  };

  DeckPrototype.showCard = function(item, direction){
    var card = getCard(this, item);
    if (checkCard(this, card, false)) {

      var selected = this.ns.selected;
      var nextIndex = indexOfCard(this, card);
      direction = direction || (nextIndex > indexOfCard(this, selected) ? 'forward' : 'reverse');
      if (selected) {
        this.hideCard(selected, direction);
      }
      this.ns.selected = card;
      this.selectedIndex = nextIndex;
      if (!card.selected) {
        card.selected = true;
      }
      transition(card, 'show', {
        before: function(){
          card.setAttribute('show', '');
          card.setAttribute('transition-direction', direction);
        },
        after: function(){
          card.dispatchEvent(new CustomEvent('show',{'bubbles': true}));
        }
      });
    }
  };

  DeckPrototype.hideCard = function(item, direction){
    var card = getCard(this, item);
    if (checkCard(this, card, true)) {
      this.ns.selected = null;
      if (card.selected) {
        card.selected = false;
      }
      transition(card, 'hide', {
        before: function(){
          card.removeAttribute('show');
          card.setAttribute('hide', '');
          card.setAttribute('transition-direction', direction || 'reverse');
        },
        after: function(){
          card.removeAttribute('hide');
          card.removeAttribute('transition');
          card.removeAttribute('transition-direction');
          card.dispatchEvent(new CustomEvent('hide',{'bubbles': true}));
        }
      });
    }
  };

  // Property handlers
  Object.defineProperties(DeckPrototype, {
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
        return this.querySelectorAll("x-card");
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
          this.setAttribute('selected-index', index);
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
  window.CustomElement = document.registerElement('x-deck', {
    prototype: DeckPrototype
  });

})();
