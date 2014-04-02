var currentDrag;

document.body.addEventListener('dragstart', function(event) {
  currentDrag = event.target;
}, false);

var Droppable = Ember.Mixin.create({

  canAccept: function(event) {
    return true;
  },

  classNameBindings: [
    'acceptsDrag',
    'selfDrop'
  ],

  acceptsDrag: false,

  droppableOnDragOver: function(event) {
    if (this.droppableIsDraggable(event)) {
      this.set('selfDrop', true);
    }
    if (this.get('acceptsDrag')) {
      return this.allowDrop(event);
    }
    if (this.canAccept(event)) {
      this.set('acceptsDrag', true);
      return this.allowDrop(event);
    }
  }.on('dragOver'),

  droppableOnDragLeave: function() {
    this.resetDroppability();
  }.on('dragLeave'),

  droppableOnDrop: function(event) {
    // have to validate on drop because you may have nested sortables the
    // parent allows the drop but the child receives it, revalidating allows
    // the event to bubble up to the parent to handle it
    if (!this.canAccept(event)) {
      return;
    }
    this.acceptDrop(event);
    this.resetDroppability();
    event.stopPropagation();
    return false;
  }.on('drop'),

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
    this.set('selfDrop', false);
  }

});


