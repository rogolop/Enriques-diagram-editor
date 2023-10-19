var svg;

// Boundary for object with class "confine"
var boundaryX1 = 5;
var boundaryX2 = 50;
var boundaryY1 = 50;
var boundaryY2 = 90;

// Things to do once the window loads
window.addEventListener("load", function() {
  // Code to be executed once the window is loaded (=> once the svg exists?)
  
  // console.log("first");
  svg = document.getElementById('mainSVG');
  // console.log(svg);
  
  var item = document.getElementById('item');

  
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
  // var element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  // element.setAttributeNS(null, 'cx', 50);
  // element.setAttributeNS(null, 'cy', 30);
  // element.setAttributeNS(null, 'r', 5);
  // element.setAttributeNS(null, 'id', 'target');
  // element.setAttributeNS(null, 'class', 'draggable');
  // svg.appendChild(element);

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
  var svg = evt.target;
  svg.addEventListener('mousedown', startDrag);
  svg.addEventListener('mousemove', drag);
  svg.addEventListener('mouseup', endDrag);
  svg.addEventListener('mouseleave', endDrag);
  
  // For touch
  svg.addEventListener('touchstart', startDrag);
  svg.addEventListener('touchmove', drag);
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

  
  // Better versions of startDrag() and drag() using transform (still does not work with gropus and foreignObjects)
  
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

  function startDrag(evt) {
    if (evt.target.id == 'background') {
      var element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      var coord = getMousePosition(evt);
      element.setAttributeNS(null, 'cx', coord.x);
      element.setAttributeNS(null, 'cy', coord.y);
      element.setAttributeNS(null, 'r', 1.5);
      element.setAttributeNS(null, 'class', 'draggable');
      svg.appendChild(element);
      selectedElement = element;
    } else if (evt.target.classList.contains('draggable')) {
      selectedElement = evt.target;
    } else {
      selectedElement = null
    }
    
    
    if (selectedElement) {
      
      
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
    }
  }

  function drag(evt) {
    if (selectedElement) {
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
    }
  }
  
  function endDrag(evt) {
    selectedElement = null;
  }
   
}



////////////////////////////////////////////////////////////////////

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



