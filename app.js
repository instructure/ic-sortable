App = Ember.Application.create();

App.ApplicationRoute = Ember.Route.extend({
  model: function() {
    return findGroups();
  }
});

/*************************************************************/

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
    if (this.droppableIsDraggable(event)) return;
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


var lastEntered;

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
    this.set('dropBelow', true);
    this.set('dropAbove', false);
  },

  setDropAbove: function() {
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

  resetDropProps: function() {
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
  }.on('dragStart'),

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


/******************************************************************/


App.ApplicationView = Ember.View.extend({});


App.MyGroupComponent = Ember.Component.extend(Droppable, {

  attributeBindings: ['draggable'],

  draggable: "true",

  canAccept: function(event) {
    return event.dataTransfer.types.contains('text/x-item');
  },

  acceptDrop: function(event) {
    var data = JSON.parse(event.dataTransfer.getData('text/x-item'));
    var myGroup = this.get('model');
    var dragGroup = findGroup(data.group_id);
    if (myGroup === dragGroup) {
      console.debug('same group, should reorder', this.get('elementId'));
      return;
    }
    var dragItem = dragGroup.items.findBy('id', data.id);
    moveItem(dragItem, dragGroup, myGroup);
  }
});

App.MyItemComponent = Ember.Component.extend(Sortable, {

  classNameBindings: ['dropping'],

  setEventData: function(event) {
    event.dataTransfer.setData('text/x-item', JSON.stringify(this.get('model')));
  },

  canAccept: function(event) {
    return event.dataTransfer.types.contains('text/x-item');
  },

  acceptDrop: function(event) {
    this.set('dropping', true);
    Ember.run.later(this, 'set', 'dropping', false, 150);
    var data = JSON.parse(event.dataTransfer.getData('text/x-item'));
    var targetGroup = findGroup(data.group_id);
    var targetItem = targetGroup.items.findBy('id', data.id);
    var myGroup = findGroup(this.get('model.group_id'));
    targetGroup.items.removeObject(targetItem);
    var index = myGroup.items.indexOf(this.get('model'));
    if (this.get('droppedPosition') === 'after') {
      index = index + 1;
    };
    targetItem.group_id = myGroup.id;
    myGroup.items.insertAt(index, targetItem);
  }

});


App.IconDocumentComponent = Ember.Component.extend({
  attributeBindings: ['width', 'height'],
  tagName: 'icon-document',
  width: 16,
  height: 16
});


var groups = Ember.ArrayProxy.create({
  content: [
    {
      id: 0,
      name: 'A',
      items: [
        {group_id: 0, id: 1, name: 'foo'},
        {group_id: 0, id: 2, name: 'bar'},
        {group_id: 0, id: 3, name: 'baz'},
        {group_id: 0, id: 4, name: 'qux'},
        {group_id: 0, id: 5, name: 'quux'},
        {group_id: 0, id: 6, name: 'hooba'},
        {group_id: 0, id: 7, name: 'tuba'},
        {group_id: 0, id: 8, name: 'ding'},
        {group_id: 0, id: 9, name: 'dong'}
      ]
    },
    {
      id: 1,
      name: 'B',
      items: [
        {group_id: 1, id: 10, name: 'qux'}
      ]
    },

    {
      id: 2,
      name: 'C',
      items: []
    }
  ]
});

function findGroups() {
  return groups;
}

function findGroup(id) {
  return groups.findProperty('id', id);
}

function moveItem(item, from, to) {
  from.items.removeObject(item);
  item.group_id = to.id;
  to.items.addObject(item);
}

