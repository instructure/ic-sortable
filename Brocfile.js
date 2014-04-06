module.exports = function(broccoli) {
  return require('broccoli-dist-es6-module')(broccoli.makeTree('lib'), {
    global: 'ic.Sortable',
    packageName: 'ic-sortable',
    main: 'sortable',
    shim: {
      'ember': 'Ember',
      'ic-droppable': 'ic.Droppable.default'
    }
  });
};

