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
  console.debug('dragenter native');
  lastEntered = event.target;
});

var Droppable = Ember.Mixin.create({
  classNameBindings: ['acceptsDrag'],
  acceptType: null,
  accept: {},

  acceptsDrag: function() {
    console.debug('acceptsDrag', this.get('acceptType'));
    return this.get('acceptType') != null;
  }.property('acceptType'),

  dragIsSelf: function(event) {
    return event.target === currentDrag;
  },

  validateDragEnter: function(event) {
    console.debug('validateDragEnter');
    if (this.dragIsSelf(event)) {
      console.debug('dragIsSelf');
      return;
    }
    for (var i = 0, l = event.dataTransfer.types.length; i < l; i ++) {
      var type = event.dataTransfer.types[i];
      if (this.accept[type]) {
        console.debug('acceptType', type);
        this.set('acceptType', type);
        break;
      }
    }
  }.on('dragEnter'),

  resetDroppability: function() {
    console.debug('resetDroppability');
    this.set('acceptType', null);
  },

  resetDroppabilityOnDragLeave: function() {
    console.debug('resetDroppabilityOnDragLeave', lastEntered);
    var $el = this.$();
    if (lastEntered === $el[0] || $el.has(lastEntered).length) return;
    this.resetDroppability();
  }.on('dragLeave'),

  makeDroppable: function(event) {
    if (this.get('acceptsDrag')) {
      event.preventDefault();
      return false;
    }
  }.on('dragOver'),

  receiveDrop: function(event) {
    var type = this.get('acceptType');
    var data = event.dataTransfer.getData(type);
    this.accept[type].call(this, event, data);
    this.resetDroppability(event);
  }.on('drop')
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
        console.debug('same group, should reorder');
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
  }.on('dragStart')
});


var groups = [
  {
    id: 0,
    name: 'A',
    items: [
      {group_id: 0, id: 0, name: 'a: foo'},
      {group_id: 0, id: 1, name: 'a: bar'},
      {group_id: 0, id: 2, name: 'a: baz'}
    ]
  },
  {
    id: 1,
    name: 'B',
    items: [
      {group_id: 1, id: 0, name: 'b: foo'},
      {group_id: 1, id: 1, name: 'b: bar'},
      {group_id: 1, id: 2, name: 'b: baz'}
    ]
  },

  {
    id: 2,
    name: 'C',
    items: [
      {group_id: 2, id: 0, name: 'c: foo'},
      {group_id: 2, id: 1, name: 'c: bar'},
      {group_id: 2, id: 2, name: 'c: baz'}
    ]
  }
];

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

