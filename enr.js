// Show popup message
// e.g.: alert("Hello! I am an alert box!!");

// Change background color if bool "activate" true
function bginfo(activate) {
	if (activate) {
		$('body').css("background","#8af");
	} else {
		$('body').css("background","#36373a");
	}
}


// Boundary for object with class "confine"
var boundaryX1 = 5;
var boundaryX2 = 50;
var boundaryY1 = 50;
var boundaryY2 = 90;

// "Enums"
const Tool = {
	Main: "mainTool",
	Eraser: "eraser",
	Connector: "connector"
};

const MouseButton = {
	Left: 1,
	Right: 2,
	Middle: 4,
	Back: 8,
	Forward: 16
};

const xmlns = 'http://www.w3.org/2000/svg';


// // Know mouse state
// function setPrimaryButtonState(evt) {
// 	// 1 -> left
// 	// 2 -> right
// 	// 4 -> middle
// 	// 8 -> back
// 	// 16 -> forward
// 	GlobalState.primaryMouseButtonDown = (evt.buttons & 1);
// 	// var flags = (evt.buttons !== undefined) ? evt.buttons : evt.which;
// 	// GlobalState.primaryMouseButtonDown = (flags & 1) === 1;
// }
// document.addEventListener("mousedown", setPrimaryButtonState);
// document.addEventListener("mousemove", setPrimaryButtonState);
// document.addEventListener("mouseup", setPrimaryButtonState);

// Global state
var initGlobalState = {
	tool: Tool.Main
};
var GlobalState = initGlobalState;

// Selected <svg> element
var svg;

function selectSVG(evt) {
	svg = evt.target;
	// alert(svg.id);
}





// Things to do once the window loads
window.addEventListener("load", function() {
	// Code to be executed once the window is loaded (=> once the svg exists?)
	
	// console.log("fdocumenirst");
	// svg = document.getElementById('mainSVG');
	// console.log(svg);
	
	var item = document.getElementById('item');
	
	
	//### Draw boundary rectangle for confined objects
	// var element = document.createElementNS(xmlns, 'rect');
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
	var element = document.createElementNS(xmlns, 'circle');
	element.setAttributeNS(null, 'cx', 50);
	element.setAttributeNS(null, 'cy', 30);
	element.setAttributeNS(null, 'r', 5);
	element.setAttributeNS(null, 'id', 'target');
	element.setAttributeNS(null, 'class', 'draggable');
	svg.appendChild(element);
	
	//### Draw black circle using jQuery
	var $element = $(document.createElementNS(xmlns, 'circle'));
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
	// var element = document.createElementNS(xmlns, 'text');
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


// Simple versions of startDrag() and drag() only work if the <tag> has x and y
//
// function startDrag(evt) {
//   if (evt.target.classList.contains('draggable')) {
//     selectedElement = evt.target;
//     offset = getMousePosition(evt);
//     offset.x -= parseFloat(selectedElement.getAttributeNS(null, "x"));
//     offset.y -= parseFloat(selectedElement.getAttributeNS(null, "y"));
//   }
// }
//
// function drag(evt) {
//   if (selectedElement) {
//     // console.log("drag");
//     evt.preventDefault(); // prevent other dragging behaviour like selecting text
//     var coord = getMousePosition(evt);
//     selectedElement.setAttributeNS(null, "x", coord.x - offset.x);
//     selectedElement.setAttributeNS(null, "y", coord.y - offset.y);
//   }
// }
//
// Below -> Better versions of startDrag() and drag() using transform (not valid for gropus and foreignObjects)


function makeInteractive(evt) {
	svg = evt.target;
	svg.addEventListener('mousedown', doOnClick);
	svg.addEventListener('mousemove', doOnDrag);
	svg.addEventListener('mouseup', doOnEndDrag);
	svg.addEventListener('mouseleave', doOnEndDrag);
	
	// For touch
	svg.addEventListener('touchstart', doOnClick);
	svg.addEventListener('touchmove', doOnDrag);
	svg.addEventListener('touchend', doOnEndDrag);
	svg.addEventListener('touchleave', doOnEndDrag);
	svg.addEventListener('touchcancel', doOnEndDrag);
	
	var selectedElement, offset, transform, confined;
	var minX, maxX, minY, maxY;

	// Get mouse position in the SVG's coordinate system
	function getMousePosition(evt) {
		var CTM = svg.getScreenCTM(); // Current Transformation Matrix
		// Invert the SVG->screen transformation
		if (evt.touches) { evt = evt.touches[0]; }
		return {
			x: (evt.clientX - CTM.e) / CTM.a,
			y: (evt.clientY - CTM.f) / CTM.d
		};
	}
	
	
	// -- do when mouse button is pressed down
	function doOnClick(evt) {
		// -- Select the clicked element
		if (evt.target.classList.contains('draggable')) {
			selectedElement = evt.target;
		} else {
			selectedElement = null;
		}
		
		// -- Act depending on tool
		switch (GlobalState.tool) {
			case Tool.Main:
				mainToolClick(evt);
				break;
			case Tool.Eraser:
				eraserClick(evt);
				break;
			case Tool.Connector:
				//
				break;
			default:
				break;
		}
	}
	
	function createCircle(pos, r, draggable) {
		let element = document.createElementNS(xmlns, 'circle');
		element.setAttributeNS(null, 'cx', pos.x);
		element.setAttributeNS(null, 'cy', pos.y);
		element.setAttributeNS(null, 'r', r);
		if (draggable) {
			element.setAttributeNS(null, 'class', 'draggable');
		}
		svg.appendChild(element);
		return element;
	}
	
	function mainToolClick(evt) {
		if (evt.buttons & MouseButton.Left) {
			// -- click on background
			if (evt.target.id == 'background') {
				// -- create circle at mouse position
				let pos = getMousePosition(evt);
				let element = createCircle(pos, 2.5, true);
				// -- select created circle
				selectedElement = element;
			}
			
			// -- click on object (or newly created from background)
			if (selectedElement) {
				// -- For confined objects, calculate maximum displacements
				confined = selectedElement.classList.contains('confine');
				if (confined) {
					let bbox = selectedElement.getBBox(); // bounding box of element
					minX = boundaryX1 - bbox.x;
					maxX = boundaryX2 - bbox.x - bbox.width;
					minY = boundaryY1 - bbox.y;
					maxY = boundaryY2 - bbox.y - bbox.height;
				}
				
				// -- Calculate mouse offset wrt. object position
				// -- (to prevent object position from "snapping" to mouse position)
				offset = getMousePosition(evt);
				// Get all the transforms currently on this element
				var transforms = selectedElement.transform.baseVal;
				// Ensure the first transform is a translate transform
				if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
					// Create an transform that translates by (0, 0)
					let translate = svg.createSVGTransform();
					translate.setTranslate(0, 0);
					// Add the translation to the front of the transforms list
					selectedElement.transform.baseVal.insertItemBefore(translate, 0);
				}
				// Get initial translation amount
				transform = transforms.getItem(0);
				// Compare mouse position and object position
				offset.x -= transform.matrix.e;
				offset.y -= transform.matrix.f;
			}
		}
	}
	
	function eraserClick(evt) {
		if (evt.buttons & MouseButton.Left) {
			// -- click on object
			if (selectedElement) {
				// -- remove object
				selectedElement.parentNode.removeChild(selectedElement);
				selectedElement = null;
			}
		}
	}
	
	function doOnDrag(evt) {
		// -- Act depending on tool
		switch (GlobalState.tool) {
			case Tool.Main:
				mainToolDrag(evt);
				break;
			case Tool.Eraser:
				eraserDrag(evt);
				break;
			case Tool.Connector:
				//
				break;
			default:
				break;
		}
	}
	
	function mainToolDrag(evt) {
		if (evt.buttons & MouseButton.Left) {
			// -- drag object
			if (selectedElement) {
				evt.preventDefault();
				let pos = getMousePosition(evt);
				let dx = pos.x - offset.x;
				let dy = pos.y - offset.y;
				// -- confine movement
				if (confined) {
					if (dx < minX) { dx = minX; }
					else if (dx > maxX) { dx = maxX; }
					if (dy < minY) { dy = minY; }
					else if (dy > maxY) { dy = maxY; }
				}
				// -- move object
				transform.setTranslate(dx, dy);
			}
		}
	}
	
	function eraserDrag(evt) {
		// -- drag over draggable object
		if ((evt.buttons & MouseButton.Left) && evt.target.classList.contains('draggable')) {
			// -- remove object
			selectedElement = evt.target;
			selectedElement.parentNode.removeChild(selectedElement);
			selectedElement = null;
		}
	}
	
	function doOnEndDrag(evt) {
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
	$('input:radio[name=tool]').val([initGlobalState.tool]);
	
	// Function called when radio buttons "tool" change value
	$('input[type=radio][name=tool]').change(function() {
		if (this.value == Tool.Main) {
			GlobalState.tool = Tool.Main;
		} else if (this.value == Tool.Eraser) {
			GlobalState.tool = Tool.Eraser;
		} else if (this.value == Tool.Connector) {
			GlobalState.tool = Tool.Connector;
		}
	});
});



////////////////////////////////////////////////////////////////////


class myElement {
	constructor(_pos) {
		this.pos = _pos;
	}
}

class point extends myElement {
	constructor(_pos, _r) {
		super(_pos);
		this.r = _r;
	}
}

class mySVG {
	static instanceNumber = 0;
	static newInstance() {
		let n = mySVG.instanceNumber;
		mySVG.instanceNumber++;
		return n;
	}
	
	constructor(parent, width, height, name) {
		var $container = $('#' + parent); // search parent by id
		if (!$container) {
			console.error("No element found with id " + id);
			return;
		}
		
		// -- create html element <svg>
		this.$svg = $(document.createElementNS(xmlns, 'svg'));
		// -- set html attributes and append element to $container
		this.$svg.attr({
			xmlns: xmlns,
			class: 'mySVG',
			onmouseenter: 'selectSVG(evt)',
			id: (name ? name : "svg"+mySVG.newInstance())
		}).appendTo($container);
		this.$svg[0].setAttribute("viewBox", "0 0 " + (width || 100).toString() + ' ' + (height || 100).toString()); // can't use .attr for uppercase letters
		
		this.svg = this.$svg[0];
		
		// -- InteractiveSVG properties
		this.elements = [];
		// this.selected = false;
		this.selectedElement = false;
		this.confined = false;
		this.offset, this.transform, this.minX, this.maxX, this.minY, this.maxY;
		
		// this._addMouseEventHandlers();
		this.$background = this.addBackground();
		// alert(this.$svg[0].id);
		this.makeInteractive();//{target:this.svg});
		
		// this.svg.addEventListener('mousedown', this.asd.bind(this));
	}
	// asd(evt) {
	// 	alert(this.svg.id);
	// }
	
	// -- add SVG element
	addElement(tagName) {
		return $(document.createElementNS(xmlns, tagName)).appendTo(this.$svg);
	};
	
	addBackground() {
		let bg = this.addElement('rect').attr({
			class: 'background',
			id: 'background',
			width: '100%',
			height: '100%'
		}); //width: this.$svg.attr('width'), height: this.$svg.attr('height')
		this.elements.push(bg);
		return bg;
	};
	
	makeInteractive() {
		// mouse events
		this.svg.addEventListener('mousedown', this.doOnClick.bind(this));
		this.svg.addEventListener('mousemove', this.doOnDrag.bind(this));
		this.svg.addEventListener('mouseup',  this.doOnEndDrag.bind(this));
		this.svg.addEventListener('mouseleave', this.doOnEndDrag.bind(this));
		// touch events
		this.svg.addEventListener('touchstart', this.doOnClick.bind(this));
		this.svg.addEventListener('touchmove', this.doOnDrag.bind(this));
		this.svg.addEventListener('touchend', this.doOnEndDrag.bind(this));
		this.svg.addEventListener('touchleave', this.doOnEndDrag.bind(this));
		this.svg.addEventListener('touchcancel', this.doOnEndDrag.bind(this));
	}
	
	// Get mouse position in the SVG's coordinate system
	getMousePosition(evt) {
		var CTM = this.svg.getScreenCTM(); // Current Transformation Matrix
		// Invert the SVG->screen transformation
		if (evt.touches) { evt = evt.touches[0]; }
		return {
			x: (evt.clientX - CTM.e) / CTM.a,
			y: (evt.clientY - CTM.f) / CTM.d
		};
	}
	
	createCircle(pos, r, draggable) {
		let element = document.createElementNS(xmlns, 'circle');
		element.setAttributeNS(null, 'cx', pos.x);
		element.setAttributeNS(null, 'cy', pos.y);
		element.setAttributeNS(null, 'r', r);
		if (draggable) {
			element.setAttributeNS(null, 'class', 'draggable');
		}
		this.svg.appendChild(element);
		
		return element;
	}
	
	// -- do when mouse button is pressed down
	doOnClick(evt) {
		// -- Select the clicked element
		if (evt.target.classList.contains('draggable')) {
			this.selectedElement = evt.target;
		} else {
			this.selectedElement = null;
		}
		// -- Act depending on tool
		switch (GlobalState.tool) {
			case Tool.Main:
				this.mainToolClick(evt);
				break;
			case Tool.Eraser:
				this.eraserClick(evt);
				break;
			case Tool.Connector:
				//
				break;
			default:
				break;
		}
	}
	
	doOnDrag(evt) {
		// -- Act depending on tool
		switch (GlobalState.tool) {
			case Tool.Main:
				this.mainToolDrag(evt);
				break;
			case Tool.Eraser:
				this.eraserDrag(evt);
				break;
			case Tool.Connector:
				//
				break;
			default:
				break;
		}
	}
	
	doOnEndDrag(evt) {
		// -- Act depending on tool
		switch (GlobalState.tool) {
			case Tool.Main:
				this.mainToolEndDrag(evt);
				break;
			case Tool.Eraser:
				this.eraserEndDrag(evt);
				break;
			case Tool.Connector:
				//
				break;
			default:
				break;
		}
		// this.selectedElement = null;
	}
	
	
	mainToolClick(evt) {
		if (evt.buttons & MouseButton.Left) {
			// -- click on background
			if (evt.target.id == 'background') {
				// -- create circle at mouse position
				let pos = this.getMousePosition(evt);
				let element = this.createCircle(pos, 2.5, true);
				// -- select created circle
				this.selectedElement = element;
			}
			
			// -- click on object (or newly created from background)
			if (this.selectedElement) {
				// -- For confined objects, calculate maximum displacements
				this.confined = this.selectedElement.classList.contains('confine');
				if (this.confined) {
					let bbox = this.selectedElement.getBBox(); // bounding box of element
					this.minX = boundaryX1 - bbox.x;
					this.maxX = boundaryX2 - bbox.x - bbox.width;
					this.minY = boundaryY1 - bbox.y;
					this.maxY = boundaryY2 - bbox.y - bbox.height;
				}
				
				// -- Calculate mouse offset wrt. object position
				// -- (to prevent object position from "snapping" to mouse position)
				this.offset = this.getMousePosition(evt);
				// Get all the transforms currently on this element
				var transforms = this.selectedElement.transform.baseVal;
				// Ensure the first transform is a translate transform
				if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
					// Create an transform that translates by (0, 0)
					let translate = this.svg.createSVGTransform();
					translate.setTranslate(0, 0);
					// Add the translation to the front of the transforms list
					this.selectedElement.transform.baseVal.insertItemBefore(translate, 0);
				}
				// Get initial translation amount
				this.transform = transforms.getItem(0);
				// Compare mouse position and object position
				this.offset.x -= this.transform.matrix.e;
				this.offset.y -= this.transform.matrix.f;
			}
		}
	}
	
	mainToolDrag(evt) {
		if (evt.buttons & MouseButton.Left) {
			// -- drag object
			if (this.selectedElement) {
				evt.preventDefault();
				let pos = this.getMousePosition(evt);
				let dx = pos.x - this.offset.x;
				let dy = pos.y - this.offset.y;
				// -- confine movement
				if (this.confined) {
					if (dx < this.minX) { dx = this.minX; }
					else if (dx > this.maxX) { dx = this.maxX; }
					if (dy < this.minY) { dy = this.minY; }
					else if (dy > this.maxY) { dy = this.maxY; }
				}
				// -- move object
				this.transform.setTranslate(dx, dy);
			}
		}
	}
	
	mainToolEndDrag(evt) {
		this.selectedElement = null;
	}
	
	eraserClick(evt) {
		if (evt.buttons & MouseButton.Left) {
			// -- click on object
			if (this.selectedElement) {
				// -- remove object
				this.selectedElement.parentNode.removeChild(this.selectedElement);
				this.selectedElement = null;
			}
		}
	}
	
	eraserDrag(evt) {
		// -- drag over draggable object
		if ((evt.buttons & MouseButton.Left) && evt.target.classList.contains('draggable')) {
			// -- remove object
			this.selectedElement = evt.target;
			this.selectedElement.parentNode.removeChild(this.selectedElement);
			this.selectedElement = null;
		}
	}
	
	eraserEndDrag(evt) {
		this.selectedElement = null;
	}
}






































/*************************************************
 *      InteractiveSVG
 *  Main object for the whole SVG.
 * Everything is inside here
**************************************************/

var InteractiveSVG = (function() {
	// Initialize(?) InteractiveSVG
	var InteractiveSVG = function($container, width, height, name) {
		// -- create html element <svg>
		this.$svg = $(document.createElementNS(xmlns, 'svg'));
		// -- set html attributes and append element to $container
		this.$svg.attr({
			xmlns: xmlns,
			class: 'interactiveSVG',
			onmouseenter: 'selectSVG(evt)',
			id: name
		}).appendTo($container);
		this.$svg[0].setAttribute("viewBox", "0 0 " + (width || 100).toString() + ' ' + (height || 100).toString()); // can't use .attr for uppercase letters
		
		// -- InteractiveSVG member variables
		this.elements = {};
		this.selected = false;
		
		this._addMouseEventHandlers();
		this.$background = this._addBackground();
		// alert(this.$svg[0].id);
		makeInteractive({target:this.$svg[0]});
	};

	// Call this to create a new InteractiveSVG
	InteractiveSVG.create = function(id, width, height, name) {
		var $container = $('#' + id);
		if (!$container) {
			console.error("No element found with id " + id);
			return;   
		}
		return new InteractiveSVG($container, width, height, name);
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










