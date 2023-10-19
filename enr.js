// alert("Hello! I am an alert box!!");

var svg;

// Boundary for object with class "confine"
var boundaryX1 = 5;
var boundaryX2 = 50;
var boundaryY1 = 50;
var boundaryY2 = 90;

var GlobalState = {
  tool: 'mainTool'
}

var primaryMouseButtonDown = false;





function selectSVG(evt) {
  svg = evt.target;
  // alert(svg.id);
}






// Things to do once the window loads
window.addEventListener("load", function() {
  // Code to be executed once the window is loaded (=> once the svg exists?)
  
  // console.log("first");
  // svg = document.getElementById('mainSVG');
  // console.log(svg);
  
  var item = document.getElementById('item');
  
  
  
  
  // Know mouse state

  primaryMouseButtonDown = false;

  function setPrimaryButtonState(evt) {
    var flags = evt.buttons !== undefined ? evt.buttons : evt.which;
    primaryMouseButtonDown = (flags & 1) === 1;
  }
  
  document.addEventListener("mousedown", setPrimaryButtonState);
  document.addEventListener("mousemove", setPrimaryButtonState);
  document.addEventListener("mouseup", setPrimaryButtonState);
  
  
  

  
  //### Draw boundary rectangle for confined objects
  // var element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  // element.setAttributeNS(null, 'x', boundaryX1);
  // element.setAttributeNS(null, 'y', boundaryY1);
  // element.setAttributeNS(null, 'width', boundaryX2 - boundaryX1);
  // element.setAttributeNS(null, 'height', boundaryY2 - boundaryY1);
  // element.setAttributeNS(null, 'fill', '#ccc');
  // // document.getElementById('background').appendChild(element);
  // // svg.appendChild(element);
  // // svg.insertBefore(element, svg.firstChild);
  // svg.insertBefore(element, document.getElementById('background').nextSibling);

  //### Draw black circle
  var element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  element.setAttributeNS(null, 'cx', 50);
  element.setAttributeNS(null, 'cy', 30);
  element.setAttributeNS(null, 'r', 5);
  element.setAttributeNS(null, 'id', 'target');
  element.setAttributeNS(null, 'class', 'draggable');
  svg.appendChild(element);
  
  //### Draw black circle using jQuery
  var $element = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
  $element.attr({
    cx: 100,
    cy: 30,
    r: 5,
    id: 'target',
    class: 'draggable'
  });
  $element.appendTo(svg);
  // svg.appendChild($element);

  //### Write Hello World
  // var element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  // element.setAttributeNS(null, 'x', 5);
  // element.setAttributeNS(null, 'y', 15);
  // element.setAttributeNS(null, 'class', 'draggable');
  // var txt = document.createTextNode("Hello World");
  // element.appendChild(txt);
  // svg.appendChild(element);

  //### Not
  // var y = parseFloat(item.getAttributeNS(null, 'y1'));
  // item.setAttributeNS(null, 'y1', y + 20);
  // var element = document.getElementById('item');
  // svg.removeChild(element);
  
  //### Dowload when link pressed
  // document.getElementById('downloadLink').addEventListener('mouseup', function() {
  //   downloadInnerHtml('exp.svg', 'main', 'image/svg+xml');
  // });
});

var moveSlider = function(slider, direction) {
  var value = slider.value;
  var circle = document.getElementById("target");
  var coord = "c" + direction;
  circle.setAttributeNS(null, coord, value);
}

function makeInteractive(evt) {
  svg = evt.target;
  svg.addEventListener('mousedown', doOnMouseDown);
  svg.addEventListener('mousemove', doOnMouseDrag);
  svg.addEventListener('mouseup', endDrag);
  svg.addEventListener('mouseleave', endDrag);
  
  // For touch
  svg.addEventListener('touchstart', doOnMouseDown);
  svg.addEventListener('touchmove', doOnMouseDrag);
  svg.addEventListener('touchend', endDrag);
  svg.addEventListener('touchleave', endDrag);
  svg.addEventListener('touchcancel', endDrag);
  
  var selectedElement, offset, transform, confined;
  
  // Simple versions of startDrag() and drag() only work if the <tag> has x and y
  
  // function startDrag(evt) {
  //   if (evt.target.classList.contains('draggable')) {
  //     selectedElement = evt.target;
  //     offset = getMousePosition(evt);
  //     offset.x -= parseFloat(selectedElement.getAttributeNS(null, "x"));
  //     offset.y -= parseFloat(selectedElement.getAttributeNS(null, "y"));
  //   }
  // }

  // function drag(evt) {
  //   if (selectedElement) {
  //     // console.log("drag");
  //     evt.preventDefault(); // prevent other dragging behaviour like selecting text
  //     var coord = getMousePosition(evt);
  //     selectedElement.setAttributeNS(null, "x", coord.x - offset.x);
  //     selectedElement.setAttributeNS(null, "y", coord.y - offset.y);
  //   }
  // }

  
  
  
  // Get mouse position in the SVG coordinate system
  function getMousePosition(evt) {
    var CTM = svg.getScreenCTM(); // Current Transformation Matrix
    // Invert the SVG->screen transformation
    if (evt.touches) { evt = evt.touches[0]; }
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
  }

  // Better versions of startDrag() and drag() using transform (still does not work with gropus and foreignObjects)
  function doOnMouseDown(evt) {
    
    if (GlobalState.tool == 'mainTool' && evt.target.id == 'background') {
      // Create circle
      var element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      var coord = getMousePosition(evt);
      element.setAttributeNS(null, 'cx', coord.x);
      element.setAttributeNS(null, 'cy', coord.y);
      element.setAttributeNS(null, 'r', 2.5);
      element.setAttributeNS(null, 'class', 'draggable');
      // alert(svg.id);
      svg.appendChild(element);
      selectedElement = element;
    } else if (evt.target.classList.contains('draggable')) {
      selectedElement = evt.target;
    } else {
      selectedElement = null;
    }
    
    if (GlobalState.tool == 'mainTool' && selectedElement) {
      // For confined objects
      confined = selectedElement.classList.contains('confine');
      if (confined) {
        bbox = selectedElement.getBBox();
        minX = boundaryX1 - bbox.x;
        maxX = boundaryX2 - bbox.x - bbox.width;
        minY = boundaryY1 - bbox.y;
        maxY = boundaryY2 - bbox.y - bbox.height;
      }

      // Calculate mouse offset
      
      offset = getMousePosition(evt);
      // Get all the transforms currently on this element
      var transforms = selectedElement.transform.baseVal;
      // Ensure the first transform is a translate transform
      if (transforms.length === 0 ||
          transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
        // Create an transform that translates by (0, 0)
        var translate = svg.createSVGTransform();
        translate.setTranslate(0, 0);
        // Add the translation to the front of the transforms list
        selectedElement.transform.baseVal.insertItemBefore(translate, 0);
      }
      // Get initial translation amount
      transform = transforms.getItem(0);
      offset.x -= transform.matrix.e;
      offset.y -= transform.matrix.f;
      
    } else if (GlobalState.tool == 'eraser' && selectedElement) {
      selectedElement.parentNode.removeChild(selectedElement);
      selectedElement = null;
      
    } else if (GlobalState.tool == 'connector' && selectedElement) {
      //
    }


  }

  function doOnMouseDrag(evt) {
    if (GlobalState.tool == 'mainTool' && selectedElement) {
      evt.preventDefault();
      var coord = getMousePosition(evt);
      
      // transform.setTranslate(coord.x - offset.x, coord.y - offset.y);
      
      var dx = coord.x - offset.x;
      var dy = coord.y - offset.y;
      if (confined) {
        if (dx < minX) { dx = minX; }
        else if (dx > maxX) { dx = maxX; }
        if (dy < minY) { dy = minY; }
        else if (dy > maxY) { dy = maxY; }
      }
      transform.setTranslate(dx, dy);
      
    } else if (GlobalState.tool == 'eraser') {
      if (primaryMouseButtonDown && evt.target.classList.contains('draggable')) {
        selectedElement = evt.target;
        selectedElement.parentNode.removeChild(selectedElement);
        selectedElement = null;
      }
      
    } else if (GlobalState.tool == 'connector' && selectedElement) {
      //
    }
  }
  
  function endDrag(evt) {
    selectedElement = null;
  }
   
}

// Download html element with a given id (and its children)
// Source: https://stackoverflow.com/questions/22084698/how-to-export-source-content-within-div-to-text-html-file
function downloadInnerHtml(filename, elId, mimeType) {
  var elHtml = document.getElementById(elId).outerHTML; //.innerHTML; // outerHTML inludes the html element itself, innerHTML only includes children
  var link = document.createElement('a');
  mimeType = mimeType || 'text/plain';

  link.setAttribute('download', filename);
  link.setAttribute('href', 'data:' + mimeType  +  ';charset=utf-8,' + encodeURIComponent(elHtml));
  link.click(); 
}




/////////////////////////////////////////////////////////////////////

// When document is loaded
$(document).ready(function() {
  
  // Initialize radio buttons "tool"
  $('input:radio[name=tool]').val(['mainTool']);
  
  // Function called when radio buttons "tool" change value
  $('input[type=radio][name=tool]').change(function() {
    if (this.value == 'mainTool') {
      GlobalState.tool = 'mainTool';
    } else if (this.value == 'eraser') {
      GlobalState.tool = 'eraser';
    } else if (this.value == 'connector') {
      GlobalState.tool = 'connector';
    }
  });
  
  
});



////////////////////////////////////////////////////////////////////

var InteractiveSVG = (function() {
  var xmlns = 'http://www.w3.org/2000/svg';
  
  /*************************************************
   *      InteractiveSVG
   *  Main object for the whole SVG.
  **************************************************/

  // Initialize InteractiveSVG
  var InteractiveSVG = function($container, width, height) {
    this.$svg = $(document.createElementNS(xmlns, 'svg'));
    this.$svg.attr({
      xmlns: xmlns,
      class: 'interactiveSVG',
      onmouseenter: 'selectSVG(evt)',
      id: 'weeee',
    }).appendTo($container);
    this.$svg[0].setAttribute("viewBox", "0 0 " + (width || 100).toString() + ' ' + (height || 100).toString()); // can't use .attr for uppercase letters

    this.elements = {};
    this.selected = false;
    this._addMouseEventHandlers();
    this.$background = this._addBackground();
    // alert(this.$svg[0].id);
    makeInteractive({target:this.$svg[0]});
  };

  // Call this to create a new InteractiveSVG
  InteractiveSVG.create = function(id, width, height) {
    var $container = $('#' + id);
    if (!$container) {
      console.error("No element found with id " + id);
      return;   
    }
    return new InteractiveSVG($container, width, height);
  };
  
  // Add background to the InteractiveSVG
  InteractiveSVG.prototype._addBackground = function() {
    return this.addElement('rect').attr({
      class: 'background',
      id: 'background',
      width: '100%',
      height: '100%'
    }); //width: this.$svg.attr('width'), height: this.$svg.attr('height')
  };
  
  // What to do with mouse events clicking on the InteractiveSVG (?)
  InteractiveSVG.prototype._addMouseEventHandlers = function() {
    var self = this;

    this.$svg.on('mousemove', function(evt) {
      if (self.selected) {
        evt.preventDefault();

        // Get dragging to work on touch device
        if (evt.type === 'touchmove') { evt = evt.touches[0]; }

        // Move based on change in mouse position
        self.selected.translate(
          evt.clientX - self.dragX,
          evt.clientY - self.dragY
        );

        // Update mouse position
        self.dragX = evt.clientX;
        self.dragY = evt.clientY;
      }
    });

    this.$svg.on('mouseup', function() {
        self.selected = false;
    });
  };
  
  // What to do with mouse events clicking on an element (?)
  InteractiveSVG.prototype._setAsDraggable = function(element) {
    var self = this;
    element.$element.on('mousedown', function(evt) {
      self.selected = element;

      // Get dragging to work on touch device
      if (evt.type === 'touchstart') { evt = evt.touches[0]; }
      self.dragX = evt.clientX;
      self.dragY = evt.clientY;
    });
  };
  
  // Add a new SVG element of type "tagName"
  InteractiveSVG.prototype.addElement = function(tagName) {
    return $(document.createElementNS(xmlns, tagName)).appendTo(this.$svg);
  };

  
  /*************************************************
   *      SVG Element Object
   *  A object that wraps an SVG element.
  **************************************************/

  var SVGElement = function(svgObject, attributes, hiddenAttributes) {
    this.svg = svgObject;
    hiddenAttributes = ['static', 'label', 'draggable'].concat(hiddenAttributes || []);
    
    // Fake attributes that control other attributes
    this.proxyAttributes = this.proxyAttributes || {};

    // Map attributes that this object to list of objects that share that attribute
    this.linkedAttributes = {};

    // hiddenAttributes are attributes for the SVGElement object, but not for SVG element itself.
    for (var i = 0; i < hiddenAttributes.length; i++) {
      var attributeName = hiddenAttributes[i];
      if (attributes[attributeName] !== undefined) {
        this[attributeName] = attributes[attributeName];
        delete attributes[attributeName];
      }
    }

    this.update(attributes);

    if (this.draggable) { svgObject._setAsDraggable(this); }

    if (this.label) { svgObject.elements[this.label] = this; }
  };
  
  // Update the object with a {key, value} map of attributes
  SVGElement.prototype.update = function(attributes) {
    // Update linked attributes
    for (var attributeName in attributes) {
      var value = attributes[attributeName];

      this.updateAttribute(attributeName, value);

      var linkedAttributes = this.linkedAttributes[attributeName];
      if (linkedAttributes) {
        for (var i = 0; i < linkedAttributes.length; i++) {
          this.linkedAttributes[attributeName][i](value);
        }
      }
    }
  };
  
  // Update the object with one given attribute and value
  SVGElement.prototype.updateAttribute = function(attributeName, value) {
    // Update object attributes
    this[attributeName] = value;

    // Update SVG element attributes
    if (this.proxyAttributes[attributeName]) {
      this.proxyAttributes[attributeName](this.$element, value);
    } else {
      this.$element.attr(attributeName, value);
    }
  };
  
  // Update the object with a {key, value} map of attributes if not yet set
  SVGElement.prototype._setAttrIfNotYetSet = function(attributes) {
    var el = this.$element[0];
    for (var attributeName in attributes) {
      if (!el.hasAttribute(attributeName)) {
        this.$element.attr(attributeName, attributes[attributeName]);
      }
    }
  };
  
  SVGElement.prototype.translate = function(dx, dy) {
    this.update({ x: this.x + dx, y: this.y + dy });
  };

  /*************************************************
   *      InteractivePoint
   *  An SVG circle which can be draggable.
  **************************************************/

  var InteractivePoint = function(svgObject, attributes) {
    this.$element = svgObject.addElement('circle');
    this.draggable = !attributes.static;
    
    // Changing this object's x and y attributes changes its element's cx and cy attributes
    this.proxyAttributes = {
      x: function(el, value) { el.attr('cx', value); },
      y: function(el, value) { el.attr('cy', value); }
    };

    SVGElement.call(this, svgObject, attributes);
  
    // Set attributes
    this._setAttrIfNotYetSet({
      'r': this.draggable ? 6 : 3,
      'class': this.draggable ? "draggable draggable-point" : "static-point"
    });

    // Set classes
    this.$element.addClass("point");
  };
  InteractivePoint.prototype = Object.create(SVGElement.prototype);
  
  
  return InteractiveSVG;
})();










