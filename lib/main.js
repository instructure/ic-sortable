import Ember from 'ember';
import Droppable from 'ic-droppable';

// reasons for these variables are explained where they are used
var currentDropTarget;
var currentSortableDrag;
var startedNewDrag = false;

var Sortable = Ember.Mixin.create(Droppable, {

  attributeBindings: ['draggable'],

  draggable: 'true',

  classNameBindings: [
    'isDragging',
    'isDropping',
    'dropBelow',
    'dropAbove',
    'firstDropTarget'
  ],

  /**
   * Will be true when this element is being dragged, you can style it
   * with `.is-dragging`, but note that this is the element that remains
   * in the DOM, not the ghost being dragged. The ghost gets its styles
   * from the elements' styles before `.is-dragging`. For more control
   * over the ghost, use `event.dataTransfer.setDragImage()`.
   *
   * @property isDragging
   * @type Boolean
   * @private
   */
  
  isDragging: false,

  /**
   * Will be true when a valid drag event is over the bottom half of the
   * element. You can style with `.drop-below`. For a common sortable
   * interface, style with `padding-bottom`.
   *
   * @property dropBelow
   * @type Boolean
   * @private
   */

  dropBelow: false,

  /**
   * Will be true when a valid drag event is over the top half of the
   * element. You can style with `.drop-above`. For a common sortable
   * interface, style with `padding-top`.
   *
   * @property dropAbove
   * @type Boolean
   * @private
   */

  dropAbove: false,

  /**
   * Will be true when this element is first of any sortables to be
   * dragged over. You can style with `first-drop-target`.
   *
   * @property firstDropTarget
   * @type Boolean
   * @private
   */

  firstDropTarget: false,

  /**
   * Override this method to set the event data of the drag, change the
   * dragImage, etc.
   *
   * ```js
   * setEventData: function(event) {
   *   event.dataTransfer.setDragImage(someImageElement, 0, 0);
   *   event.dataTransfer.setData('text/x-foo', 'some data');
   * }
   * ```
   *
   * @public
   */

  setEventData: function(event) {
    event.dataTransfer.setData('text/html', this.$().html());
  },

  /**
   * @private
   */

  setDropBelow: function() {
    this.set('dropBelow', true);
    this.set('dropAbove', false);
    this.updateDropTarget();
  },

  /**
   * @private
   */

  setDropAbove: function() {
    this.set('dropAbove', true);
    this.set('dropBelow', false);
    this.updateDropTarget();
  },

  /**
   * Sets the new global currentDropTarget and resets the drop
   * properties of the previous drop target.  We do the reset work here
   * instead of on dragLeave of the old target so that the old and new
   * drop targets have their properties updated on the same tick.  This
   * allows smoother animations (no delay between the previous target
   * and this new one).
   *
   * @method updateDropTarget
   * @private
   */

  updateDropTarget: function() {
    // ensure we aren't dragging something from the desktop/other window
    if (currentDropTarget && currentDropTarget !== this) {
      currentDropTarget.resetDropProps();
    }
    currentDropTarget = this;
  },

  /**
   * UI may want to respond differently for the first drop target than
   * the rest. For example, if the dragged element gets display none,
   * then the element below it will jump up, receive a drop-above above
   * property, and then a CSS transition may happen that looks weird.
   * Having `.first-target` allows the CSS to remove the animation for
   * this case.
   *
   * @method setFirstTarget
   * @private
   */

  setFirstTarget: function() {
    if (!startedNewDrag) return;
    this.set('firstDropTarget', true);
    // in most cases, the dragged element gets set to display none, moving the
    // next sibling down, so lets pre-empt some bad styles and set dropAbove
    // immediately (maybe make this configurable?)
    this.set('dropAbove', true);
    startedNewDrag = false;
    // run later so the css will take effect and allow transitions
    Ember.run.later(this, function() {
      this.set('dropAbove', false);
      this.set('firstDropTarget', false);
    }, 10); // anything < 10 prevents css transitions from happening ¯\(°_o)/¯
  },

  /**
   * Determines the drop properties from the cursor position of the
   * drag.
   *
   * @method setDropPropertiesFromEvent
   * @private
   */

  setDropPropertiesFromEvent: function(event) {
    this.setFirstTarget();
    if (!this.get('accepts-drag')) return;
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
  },

  /**
   * @method setDropPropertiesFromOnDragOver
   * @private
   */

  setDropPropertiesFromOnDragOver: function(event) {
    this.setDropPropertiesFromEvent(event);
  }.on('dragOver'),

  /**
   * Only need this on dragOver, but also doing it on dragEnter gives
   * snappier responses.
   *
   * @method setDropPropertiesFromOnDragEnter
   * @private
   */

  setDropPropertiesFromOnDragEnter: function(event) {
    this.setDropPropertiesFromEvent(event);
  }.on('dragEnter'),

  /**
   * Removes all the properties used to style the element.
   *
   * @private
   */

  resetDropProps: function() {
    this.set('dropAbove', false);
    this.set('dropBelow', false);
    this.set('firstDropTarget', false);
  },

  /**
   * @method handleDrop
   * @private
   */

  handleDrop: function() {
    this.set('droppedPosition', this.get('dropAbove') ? 'before' : 'after');
    this.resetDropProps();
  }.on('drop'),

  /**
   * @method startDrag
   * @private
   */

  startDrag: function(event) {
    // stopPropagation to allow nested sortables
    event.stopPropagation();
    this.setEventData(event);
    startedNewDrag = true;
    currentSortableDrag = this;
    // later because browsers clone the element in its state right now
    // and we don't want the `is-dragging` styles applied to the ghost
    Ember.run.later(this, 'set', 'isDragging', true, 0);
  }.on('dragStart'),

  /**
   * Resets properties set while dragging.
   *
   * Note: We can't do anything in here aside from things related to
   * this component's state, implementations may perform a sort on drop
   * that destroys this component; `dragEnd` cannot fire on a removed
   * element. This code is not guaranteed to run.
   *
   * @method resetOnDragEnd
   * @private
   */

  resetOnDragEnd: function() {
    this.set('isDragging', false);
  }.on('dragEnd'),

  /**
   * Sets the `isDropping` property. We need to know this so we can do
   * different css during a drop (probably stop animating).
   *
   * @method setIsDropping
   * @private
   */

  setIsDropping: function() {
    this.set('isDropping', true);
    // later so css animations can be changed
    Ember.run.later(this, 'set', 'isDropping', false, 10);
  }.on('drop')

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

// Some messy drags don't trigger dragLeave on the currentDropTarget
// this will get called in those cases (but not on valid drops)
window.addEventListener('dragend', function() {
  currentDropTarget && currentDropTarget.resetDropProps();
}, false);

export default Sortable;

