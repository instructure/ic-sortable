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

/******************************************************************/


App.ApplicationView = Ember.View.extend({});


App.XGroupComponent = Ember.Component.extend(Droppable, {
  attributeBindings: ['draggable'],
  draggable: "true",
  classNames: ['x-group'],

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


App.XItemComponent = Ember.Component.extend(Droppable, {
  attributeBindings: ['draggable'],
  classNames: ['x-item'],
  draggable: "true",

  canAccept: function(event) {
    return event.dataTransfer.types.contains('text/x-item');
  },

  insertPlaceHolder: function(event) {
    if (!this.get('acceptsDrag')) return;
    var pos = relativeClientPosition(this.$()[0], event.originalEvent);
    // insert when
    // - starting drag -> on self
    // - enter list -> bottom (for now)
    // move when:
    // - on top half of older sibling -> above sibling
    // - on bottom half of younger sibling -> below sibling
    // remove when:
    // - out of list
    //
    if (pos.py < 0.5) {
      console.log('top half');
    } else {
      console.log('bottom half');
    }
  }.on('dragOver'),

  acceptDrop: function(event) {
    console.log('DRRRRRRRRRRRRRROOPP');
  },

  // draggable stuff

  initDragStart: function(event) {
    var data = JSON.stringify(this.get('model'));
    event.dataTransfer.setData('text/x-item', data);
  }.on('dragStart')

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

App.IconDocumentComponent = Ember.Component.extend({
  attributeBindings: ['width', 'height'],
  tagName: 'icon-document',
  width: 16,
  height: 16
});


var groups = Ember.ArrayProxy.create({
  sortProperties: ['sort'],
  content: [
    {
      id: 0,
      name: 'A',
      items: [
        {sort: 0, group_id: 0, id: 1, name: 'foo'},
        {sort: 1, group_id: 0, id: 0, name: 'bar'},
        {sort: 2, group_id: 0, id: 2, name: 'baz'}
      ]
    },
    {
      id: 1,
      name: 'B',
      items: [
        {sort: 0, group_id: 1, id: 3, name: 'qux'}
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

