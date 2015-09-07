var Sortable = ic.Sortable.default;

App = Ember.Application.create();

App.ApplicationRoute = Ember.Route.extend({
  model: function() {
    return Ember.ArrayProxy.create({
      content: [
            {id: 1, name: 'foo'},
            {id: 2, name: 'bar'},
            {id: 3, name: 'baz'},
      ]
    });
  }
});

App.MyItemComponent = Ember.Component.extend(Sortable, {

  items: null,

  setEventData: function(event) {
    event.dataTransfer.setData('text/x-item', JSON.stringify(this.get('model')));
  },

  validateDragEvent: function(event) {
    return event.dataTransfer.types.contains('text/x-item');
  },

  acceptDrop: function(event) {
    var data = JSON.parse(event.dataTransfer.getData('text/x-item'));
    var targetItem = this.get('items').findBy('id', data.id);
    var index = this.get('items').indexOf(this.get('model'));

    this.get('items').removeObject(targetItem);
    this.get('items').insertAt(index, targetItem);
  }
});
