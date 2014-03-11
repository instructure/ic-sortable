// have parent handle the dragEnter events then switch the currently hovered
// thing and tell it to drop above or below

var lastEntered;

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
    'dropAbove'
  ],

  isDragging: false,

  dropBelow: false,

  dropAbove: false,

  setDropBelow: function() {
    // TODO: check index of siblings, don't do anything
    console.debug('dropBelow');
    this.set('dropBelow', true);
    this.set('dropAbove', false);
  },

  setDropAbove: function() {
    console.debug('dropAbove');
    // TODO: check index of siblings, don't do anything
    this.set('dropAbove', true);
    this.set('dropBelow', false);
  },

  decideToAddClassForDropAboveOrBelow: function(event) {
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
  }.on('dragOver'),

  decideOnDragOver: function(event) {
    this.decideToAddClassForDropAboveOrBelow(event);
  }.on('dragOver'),

  decideOnDragEnter: function(event) {
    this.decideToAddClassForDropAboveOrBelow(event);
  }.on('dragEnter'),

  resetDropProps: function() {
    console.debug('resetDropProps');
    this.set('dropAbove', false);
    this.set('dropBelow', false);
  },

  resetDropPropsOnDrop: function() {
    this.set('droppedPosition', this.get('dropAbove') ? 'before' : 'after');
    this.resetDropProps();
  }.on('drop'),

  resetDropPropsOnLeave: function(event) {
    var el = this.get('element');
    // TODO: what about nested sortables, huh? did you ever think about that? HUH? WELL? DID YOU?!
    if (el !== lastEntered && !el.contains(lastEntered)) {
      this.resetDropProps();
    }
  }.on('dragLeave'),

  setEventData: function(event) {
    event.dataTransfer.setData('text/html', this.$().html());
  },

  initDragStart: function(event) {
    this.setEventData(event);
    // later because browsers clone the element in its state
    // right now, which would have `is-dragging` styles applied
    Ember.run.later(this, 'set', 'isDragging', true, 0);
    //this.constructor.newDrag = true;
  }.on('dragStart'),

  resetOnDragEnd: function() {
    this.set('isDragging', false);
    //this.constructor.newDrag = false;
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

