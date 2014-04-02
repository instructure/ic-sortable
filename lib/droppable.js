var currentDrag;

Ember.$(document).on('dragstart', function(event) {
  currentDrag = event.target;
});

var Droppable = Ember.Mixin.create({

  canAccept: function(event) {
    return true;
  },

  classNameBindings: ['acceptsDrag'],

  acceptsDrag: false,

  dragOver: function(event) {
    if (this.get('acceptsDrag')) return this.allowDrop(event);
    if (this.droppableIsDraggable(event)) {
      return;
    }
    if (this.canAccept(event)) {
      this.set('acceptsDrag', true);
      return this.allowDrop(event);
    }
  },

  dragLeave: function() {
    // TODO: stopPropagation or no?
    this.resetDroppability();
  },

  drop: function(event) {
    this.acceptDrop(event);
    this.resetDroppability();
    event.stopPropagation();
    return false;
  },

  allowDrop: function(event) {
    event.stopPropagation();
    event.preventDefault();
    return false;
  },

  droppableIsDraggable: function(event) {
    return currentDrag && (
      currentDrag === event.target ||
      currentDrag.contains(event.target)
    );
  },

  resetDroppability: function() {
    this.set('acceptsDrag', false);
  }

});


