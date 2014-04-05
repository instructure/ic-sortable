// have parent handle the dragEnter events then switch the currently hovered
// thing and tell it to drop above or below

var lastEntered;
var currentDropTarget;
var currentSortableDrag;
var firstTarget = false;

window.addEventListener('dragend', function() {
  // some messy drags don't trigger dragLeave on the currentDropTarget
  // this will get called in those cases (but not on valid drops)
  currentDropTarget && currentDropTarget.resetDropProps();
}, false);

Ember.$(document).on('dragenter', function(event) {
  lastEntered = event.target;
});

var Sortable = Ember.Mixin.create(Droppable, {

  attributeBindings: ['draggable'],

  draggable: "true",

  classNameBindings: [
    'isDragging',
    'isDropping',
    'dropBelow',
    'dropAbove',
    'firstTarget'
  ],

  isDragging: false,

  dropBelow: false,

  dropAbove: false,

  setDropBelow: function() {
    this.set('dropBelow', true);
    this.set('dropAbove', false);
    this.setDropTarget();
  },

  setDropAbove: function() {
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

  setFirstTarget: function() {
    if (!currentDropTarget || !firstTarget) {
      return;
    }
    this.set('firstTarget', true);
    // in most cases, the dragged element gets set to display none, moving the
    // next sibling down, so lets pre-empt some bad styles and set dropAbove
    // immediately
    this.set('dropAbove', true);
    firstTarget = false;
    // run later so the css will take effect and allow transitions
    Ember.run.later(this, function() {
      this.set('firstTarget', false);
      this.set('dropAbove', false);
      firstTarget = false;
    }, 10);
  },

  decideToAddClassForDropAboveOrBelow: function(event) {
    this.setFirstTarget();
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
    this.set('firstTarget', false);
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
    event.stopPropagation();
    firstTarget = true;
    this.setEventData(event);
    currentSortableDrag = this;
    // later because browsers clone the element in its state
    // right now, which would have `is-dragging` styles applied
    Ember.run.later(this, 'set', 'isDragging', true, 0);
  }.on('dragStart'),

  /*
   * Do not add anything in here aside from this component's state,
   * implementations may perform a sort on drop that destroys this component
   * and dragEnd cannot fire on a removed element. This code is not guaranteed
   * to run.
   */

  resetOnDragEnd: function() {
    this.set('isDragging', false);
  }.on('dragEnd'),

  setIsDropping: function() {
    this.set('isDropping', true);
    Ember.run.later(this, 'set', 'isDropping', false, 10);
  }.on('drop')

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

