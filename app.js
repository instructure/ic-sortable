App = Ember.Application.create();

App.ApplicationRoute = Ember.Route.extend({
  model: function() {
    return findGroups();
  }
});

/*************************************************************/

var currentDrag;
var lastEntered;

Ember.$(document).on('dragstart', function(event) {
  currentDrag = event.target;
});

Ember.$(document).on('dragenter', function(event) {
  lastEntered = event.target;
});

var Droppable = Ember.Mixin.create({
  classNameBindings: ['acceptsDrag'],
  acceptType: null,
  accept: {},

  dragOver: function(event) {
    if (this.get('acceptsDrag')) {
      return this.allowDrop(event);
    }
    if (this.droppableIsSelf(event)) return;
    for (var i = 0, l = event.dataTransfer.types.length; i < l; i ++) {
      var type = event.dataTransfer.types[i];
      if (this.accept[type]) {
        this.set('acceptType', type);
        return this.allowDrop(event);
      }
    }
  },

  dragLeave: function() {
    this.resetDroppability();
  },

  drop: function(event) {
    var type = this.get('acceptType');
    var data = event.dataTransfer.getData(type);
    this.accept[type].call(this, event, data);
    this.resetDroppability(event);
  },

  allowDrop: function(event) {
    event.preventDefault();
    return false;
  },

  acceptsDrag: function() {
    return this.get('acceptType') != null;
  }.property('acceptType'),

  droppableIsSelf: function(event) {
    return event.target === currentDrag;
  },

  resetDroppability: function() {
    this.set('acceptType', null);
  }

});

/******************************************************************/


App.ApplicationView = Ember.View.extend({});


App.XGroupComponent = Ember.Component.extend(Droppable, {
  attributeBindings: ['draggable'],
  draggable: "true",
  classNames: ['x-group'],

  accept: {
    'text/x-item': function(event, data) {
      data = JSON.parse(data);
      var myGroup = this.get('model');
      var dragGroup = findGroup(data.group_id);
      if (myGroup === dragGroup) {
        console.debug('same group, should reorder', this.get('elementId'));
        return;
      }
      var dragItem = dragGroup.items.findBy('id', data.id);
      moveItem(dragItem, dragGroup, myGroup);
    }
  }
});


App.XItemComponent = Ember.Component.extend({
  attributeBindings: ['draggable'],
  classNames: ['x-item'],
  draggable: "true",

  initDragStart: function(event) {
    var data = JSON.stringify(this.get('model'));
    event.dataTransfer.setData('text/x-item', data);
  }.on('dragStart'),

  accept: {
    'text/x-item': function(event, data) {
      console.log(data);
    }
  }

});


var groups = Ember.ArrayProxy.create({
  sortProperties: ['sort'],
  content: [
    {
      id: 0,
      name: 'A',
      items: [
        {sort: 0, group_id: 0, id: 1, name: 'a: foo'},
        {sort: 1, group_id: 0, id: 0, name: 'a: bar'},
        {sort: 2, group_id: 0, id: 2, name: 'a: baz'}
      ]
    },
    {
      id: 1,
      name: 'B',
      items: [
        {sort: 0, group_id: 1, id: 0, name: 'b: foo'},
        {sort: 1, group_id: 1, id: 1, name: 'b: bar'},
        {sort: 2, group_id: 1, id: 2, name: 'b: baz'}
      ]
    },

    {
      id: 2,
      name: 'C',
      items: [
        {sort: 0, group_id: 2, id: 0, name: 'c: foo'},
        {sort: 1, group_id: 2, id: 1, name: 'c: bar'},
        {sort: 2, group_id: 2, id: 2, name: 'c: baz'}
      ]
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

