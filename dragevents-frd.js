+(function() {
  var lastEntered;
  var enterEventName = 'dragenter:frd';
  var dragLeaveEventName = 'dragleave.'+enterEventName;

  jQuery(document).on('dragenter', function(event) {
    lastEntered = event.target;
  });

  jQuery.event.special['dragenter:frd'] = {
    delegateType: 'dragenter',
    bindType: 'dragenter',
    handle: function(event) {
      var $el = jQuery(this);
      var handled = $el.data(enterEventName);
      if (handled === true) return;
      $el.data(enterEventName, true);
      $el.on(dragLeaveEventName, function(event) {
        var enteredSelf = $el[0] === lastEntered;
        var enteredChild = $el.has(lastEntered).length > 0;
        if (!enteredSelf && !enteredChild) {
          $el.data(enterEventName, false);
          $el.off(dragLeaveEventName);
        }
      });
      return event.handleObj.handler.apply(this, arguments);
    }
  };

  jQuery.event.special['dragleave:frd'] = {
    delegateType: 'dragleave',
    bindType: 'dragleave',
    handle: function(event) {
      var $el = jQuery(this);
      var enteredSelf = $el[0] === lastEntered;
      var enteredChild = $el.has(lastEntered).length > 0;
      if (enteredSelf || enteredChild) return;
      return event.handleObj.handler.apply(this, arguments);
    }
  };

})();

