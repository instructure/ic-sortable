// have parent handle the dragEnter events then switch the currently hovered
// thing and tell it to drop above or below

var lastEntered;
var currentDropTarget;
var currentSortableDrag;
var justStarted = false;

setInterval(function() {
  console.debug('---');
}, 5000);

Ember.$(document).on('dragenter', function(event) {
  lastEntered = event.target;
});

var Sortable = Ember.Mixin.create(Droppable, {

  attributeBindings: ['draggable'],

  draggable: "true",

  classNameBindings: [
    'isDragging',
    'dropBelow',
    'dropAbove',
    'justStarted'
  ],

  isDragging: false,

  dropBelow: false,

  dropAbove: false,

  setDropBelow: function() {
    // TODO: check index of siblings, don't do anything
    this.set('dropBelow', true);
    this.set('dropAbove', false);
    this.setDropTarget();
  },

  setDropAbove: function() {
    // TODO: check index of siblings, don't do anything
    this.set('dropAbove', true);
    this.set('dropBelow', false);
    this.setDropTarget();
  },

  setDropTarget: function() {
    if (currentDropTarget != null && currentDropTarget !== this) {
      currentDropTarget.resetDropProps();
    }
    currentDropTarget = this;
  },

  setJustStarted: function() {
    if (!currentDropTarget || !justStarted) {
      return;
    }
    this.set('justStarted', true);
    justStarted = false;
    Ember.run.later(this, function() {
      this.set('justStarted', false);
      justStarted = false;
    }, 0);
  },

  decideToAddClassForDropAboveOrBelow: function(event) {
    this.setJustStarted();
    if (!this.get('acceptsDrag')) return;
    var pos = relativeClientPosition(this.$()[0], event.originalEvent);
    if (this.get('dropBelow')) {
      // making assumptions that the css will make room enough for
      // one item with these maths
      if (pos.py < 0.33) {
        this.setDropAbove();
      }
    } else if (this.get('dropAbove')) {
      if (pos.py > 0.66) {
        this.setDropBelow();
      }
    } else {
      if (pos.py < 0.5) {
        this.setDropAbove();
      } else {
        this.setDropBelow();
      }
    }
  },

  decideOnDragOver: function(event) {
    this.decideToAddClassForDropAboveOrBelow(event);
  }.on('dragOver'),

  decideOnDragEnter: function(event) {
    this.decideToAddClassForDropAboveOrBelow(event);
  }.on('dragEnter'),

  resetDropProps: function() {
    this.set('dropAbove', false);
    this.set('dropBelow', false);
    this.set('justStarted', false);
  },

  resetDropPropsOnDrop: function() {
    this.set('droppedPosition', this.get('dropAbove') ? 'before' : 'after');
    this.resetDropProps();
  }.on('drop'),

  resetDropPropsOnLeave: function(event) {
    var el = this.get('element');
    // TODO: what about nested sortables, huh? did you ever think about that? HUH? WELL? DID YOU?!
    if (el !== lastEntered && !el.contains(lastEntered)) {
      // later so that setDropTarget can happen on the old and new targets in
      // the same tick for smoother animations, but still do this in the case
      // you drag out the side, etc.
      Ember.run.later(this, 'resetDropProps', 100);
    }
  }.on('dragLeave'),

  setEventData: function(event) {
    event.dataTransfer.setData('text/html', this.$().html());
  },

  initDragStart: function(event) {
    justStarted = true;
    this.setEventData(event);
    currentSortableDrag = this;
    // later because browsers clone the element in its state
    // right now, which would have `is-dragging` styles applied
    Ember.run.later(this, 'set', 'isDragging', true, 0);
  }.on('dragStart'),

  /*
   * Do not add anything in here aside from this component's state,
   * implementations may perform a sort on drop that destroys this component
   * and dragEnd cannot fire on a removed element.
   */

  resetOnDragEnd: function() {
    this.set('isDragging', false);
  }.on('dragEnd')

});

function relativeClientPosition(el, event) {
  var rect = el.getBoundingClientRect();
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;
  return {
    x: x,
    y: y,
    px: x / rect.width,
    py: y / rect.height
  };
}

