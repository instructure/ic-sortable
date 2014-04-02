// have parent handle the dragEnter events then switch the currently hovered
// thing and tell it to drop above or below

var lastEntered;
var currentDropTarget;
var currentSortableDrag;

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
    'onSelf'
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

  setOnSelf: function(event) {
    if (!currentSortableDrag) {
      return;
    }
    var el = currentSortableDrag.get('element');
    var onSelf = event.target === el || el.contains(event.target);
    currentSortableDrag.set('onSelf', onSelf);
  },

  decideToAddClassForDropAboveOrBelow: function(event) {
    this.setOnSelf(event);
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
    console.debug('resetDropProps', this.get('elementId'));
    this.set('dropAbove', false);
    this.set('dropBelow', false);
    this.set('onSelf', false);
  },

  resetDropPropsOnDrop: function() {
    this.set('droppedPosition', this.get('dropAbove') ? 'before' : 'after');
    this.resetDropProps();
  }.on('drop'),

  resetDropPropsOnLeave: function(event) {
    console.log('leave', this.get('elementId'));
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
    this.setEventData(event);
    currentSortableDrag = this;
    this.set('onSelf', true);
    // later because browsers clone the element in its state
    // right now, which would have `is-dragging` styles applied
    Ember.run.later(this, 'set', 'isDragging', true, 0);
  }.on('dragStart'),

  resetOnDragEnd: function() {
    this.set('isDragging', false);
    this.set('onSelf', false);
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

