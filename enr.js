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
	Select: "select",
	Connect: "connect",
};
const Tools = Object.keys(Tool).map(function(key){return Tool[key];});

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
var activeSVG;

function selectSVG(evt) {
	$(activeSVG).attr({
		class: ""
	});
	activeSVG = evt.target;
	$(activeSVG).attr({
		class: "activeSVG"
	});
	// alert(activeSVG.id);
}

// var moveSlider = function(slider, direction) {
// 	var value = slider.value;
// 	var circle = document.getElementById("target");
// 	var coord = "c" + direction;
// 	circle.setAttributeNS(null, coord, value);
// }

// Download html element with a given id (and its children)
// Partial Source: https://stackoverflow.com/questions/22084698/how-to-export-source-content-within-div-to-text-html-file
function downloadInnerHtml(filename, elId, mimeType) {
	// var elHtml = document.getElementById(elId).outerHTML; //.innerHTML; // outerHTML inludes the html element itself, innerHTML only includes children
	var elHtml = activeSVG.outerHTML;
	
	var cssString;
	// cssString = $.get("/enr.css");
	cssString = $.ajax({type: "GET", url: "/svg.css", async: false}).responseText;
	// console.log(cssString);
	
	elHtml = elHtml.replace("</svg>", "<style>"+cssString+"</style></svg>");
	
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
		// console.log(Tools);
		if (Tools.includes(this.value)) {
			GlobalState.tool = this.value;
		}
	});
});

////////////////////////////////////////////////////////////////////

class myElement {
	static instanceNumber = 0;
	static newID() {
		let n = myElement.instanceNumber;
		myElement.instanceNumber++;
		return n;
	}
	
	static new(_elements, _svg, _pos) {
		let elt = new myElement(_svg, "myElement"+Point.newID(), _pos);
		_elements[elt.id] = elt;
		return elt;
	}
	
	constructor(_svg, _id, _pos) {
		this.svg = _svg;
		this.element = false; // svg element
		this.id = _id
		this.pos = _pos;
	}
	
	get position() {
		return this.pos;
	}
	
	set position(_pos) {
		this.moveTo(_pos.x, _pos.y);
	}
	
	moveBy(dx, dy) {
		this.moveTo(this.pos.x+dx, this.pos.y+dy);
	}
	
	// move to position
	moveTo(x, y) {
		this.pos.x = x;
		this.pos.y = y;
	}
}

class Point extends myElement {
	static instanceNumber = 0;
	static newID() {
		let n = Point.instanceNumber;
		Point.instanceNumber++;
		return n;
	}
	
	static new(_elements, _svg, _pos, _r) {
		let pt = new Point(_svg, _pos, _r);
		_elements[pt.id] = pt;
		return pt;
	}
	
	constructor(_svg, _pos, _r) {
		super(_svg, "point"+Point.newID(), _pos);
		this.r = _r;
		this.element = this.createPoint(_pos, _r, true);
	}
	
	createPoint(pos, r, draggable) {
		let element = document.createElementNS(xmlns, 'circle');
		element.setAttributeNS(null, 'id', this.id);
		element.setAttributeNS(null, 'cx', pos.x);
		element.setAttributeNS(null, 'cy', pos.y);
		element.setAttributeNS(null, 'r', r);
		if (draggable) {
			element.setAttributeNS(null, 'class', 'point draggable');
		} else {
			element.setAttributeNS(null, 'class', 'point');
		}
		element = this.svg.appendChild(element);
		return element;
	}
	
	moveTo(x, y) {
		this.element.setAttributeNS(null, 'cx', x);
		this.element.setAttributeNS(null, 'cy', y);
		this.pos.x = x;
		this.pos.y = y;
	}
}

class Line extends myElement {
	static instanceNumber = 0;
	static newID() {
		let n = Line.instanceNumber;
		Line.instanceNumber++;
		return n;
	}
	
	static new(_elements, _svg, _pos1, _pos2) {
		let line = new Line(_svg, _pos1, _pos2);
		_elements[line.id] = line;
		return line;
	}
	
	constructor(_svg, _pos1, _pos2) {
		super(_svg, "line"+Line.newID(), _pos1); // _pos1 is temporary
		this.pos1 = _pos1;
		this.pos2 = _pos2;
		this.pos = this.center();
		this.element = this.createLine(_pos1, _pos2, true);
	}
	
	get position1() {
		return this.pos1;
	}
	
	get position2() {
		return this.pos1;
	}
	
	set position1(_pos1) {
		this.pos1 = _pos1;
		this.pos = this.center();
		this.element.setAttributeNS(null, 'x1', this.pos1.x);
		this.element.setAttributeNS(null, 'y1', this.pos1.y);
	}
	
	set position2(_pos2) {
		this.pos2 = _pos2;
		this.pos = this.center();
		this.element.setAttributeNS(null, 'x2', this.pos2.x);
		this.element.setAttributeNS(null, 'y2', this.pos2.y);
	}
	
	center() {
		return {
			x: (this.pos1.x + this.pos2.x)/2,
			y: (this.pos1.y + this.pos2.y)/2
		};
	}
	
	createLine(pos1, pos2, draggable) {
		let element = document.createElementNS(xmlns, 'line');
		element.setAttributeNS(null, 'id', this.id);
		element.setAttributeNS(null, 'x1', this.pos1.x);
		element.setAttributeNS(null, 'y1', this.pos1.y);
		element.setAttributeNS(null, 'x2', this.pos2.x);
		element.setAttributeNS(null, 'y2', this.pos2.y);
		element.setAttributeNS(null, 'stroke', "black"); // necessary
		element.setAttributeNS(null, 'stroke-width', 1.5);
		if (draggable) {
			element.setAttributeNS(null, 'class', 'line draggable');
		} else {
			element.setAttributeNS(null, 'class', 'line');
		}
		element = this.svg.appendChild(element);
		return element;
	}
	
	moveBy(dx, dy) {
		this.pos.x += dx;
		this.pos.y += dy;
		this.pos1.x += dx;
		this.pos1.y += dy;
		this.pos2.x += dx;
		this.pos2.y += dy;
		this.element.setAttributeNS(null, 'x1', this.pos1.x);
		this.element.setAttributeNS(null, 'y1', this.pos1.y);
		this.element.setAttributeNS(null, 'x2', this.pos2.x);
		this.element.setAttributeNS(null, 'y2', this.pos2.y);
	}
	
	moveTo(x, y) {
		this.moveBy(x-this.pos.x, y-this.pos.y);
	}
}

class mySVG {
	static instanceNumber = 0;
	static newID() {
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
			id: (name ? name : "svg"+mySVG.newID())
		}).appendTo($container);
		this.$svg[0].setAttribute("viewBox", "0 0 " + (width || 100).toString() + ' ' + (height || 100).toString()); // can't use .attr for uppercase letters
		
		this.svg = this.$svg[0];
		
		this.elements = {};
		// -- mainTool, erase
		this.selectedElement = null;
		this.lastMousePos;
		// -- select
		this.selected = [];
		this.dragStart = null;
		// this.confined = false;
		// this.transform, this.minX, this.maxX, this.minY, this.maxY;
		
		// -- create elements
		this.$background = this.addBackground();
		this.selectRectangle = this.addSelectRectangle();
		// Point.new(this.elements, this.svg, {x:20, y:5}, 4);
		Line.new(this.elements, this.svg, {x:0,y:20}, {x:20,y:20});
		
		this.makeInteractive();
	}
	
	addBackground() {
		let bg = $(document.createElementNS(xmlns, 'rect')).appendTo(this.$svg).attr({
			class: 'background',
			id: 'background',
			width: '100%',
			height: '100%'
		});
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
		// avoid right click context menu
		this.svg.addEventListener("contextmenu", e => e.preventDefault());
	}
	
	// -- get mouse position in SVG coordinates
	getMousePosition(evt) {
		var CTM = this.svg.getScreenCTM(); // Current Transformation Matrix
		// Invert the SVG->screen transformation
		if (evt.touches) { evt = evt.touches[0]; }
		return {
			x: (evt.clientX - CTM.e) / CTM.a,
			y: (evt.clientY - CTM.f) / CTM.d
		};
	}
	
	// -- handle click, drag, end drag

	doOnClick(evt) {
		// -- act depending on tool
		switch (GlobalState.tool) {
			case Tool.Main:
				this.mainToolClick(evt);
				break;
			case Tool.Eraser:
				this.eraserClick(evt);
				break;
			case Tool.Select:
				this.selectClick(evt);
				break;
			case Tool.Connect:
				//
				break;
			default:
				break;
		}
	}
	
	doOnDrag(evt) {
		// -- act depending on tool
		switch (GlobalState.tool) {
			case Tool.Main:
				this.mainToolDrag(evt);
				break;
			case Tool.Eraser:
				this.eraserDrag(evt);
				break;
			case Tool.Select:
				this.selectDrag(evt);
				break;
			case Tool.Connect:
				//
				break;
			default:
				break;
		}
	}
	
	doOnEndDrag(evt) {
		// -- act depending on tool
		switch (GlobalState.tool) {
			case Tool.Main:
				this.mainToolEndDrag(evt);
				break;
			case Tool.Eraser:
				this.eraserEndDrag(evt);
				break;
			case Tool.Select:
				this.selectEndDrag(evt);
				break;
			case Tool.Connect:
				//
				break;
			default:
				break;
		}
		// this.selectedElement = null;
	}
	
	// -- main tool
	
	mainToolClick(evt) {
		// -- save click position
		this.lastMousePos = this.getMousePosition(evt);
		
		if (evt.buttons & MouseButton.Left) {
			// -- click on background
			if (evt.target.id == 'background') {
				this.unselectAll();
				// -- create circle at mouse position
				let pos = this.getMousePosition(evt);
				let element = Point.new(this.elements, this.svg, pos, 2.5);
				// -- select created circle
				this.selectedElement = element;
				
				// -- click on draggable element
			} else if (evt.target.classList.contains('draggable')) {
				// -- unselect if click on not selected
				if (!this.selected.includes(evt.target.id)) {
					this.unselectAll();
				}
				// -- Select the clicked element
				this.selectedElement = this.elements[evt.target.id];
			} else {
				this.selectedElement = null;
			}
		} else if (evt.buttons & MouseButton.Right) {
			evt.preventDefault();
			this.selectClick(evt);
		}
	}
	
	mainToolDrag(evt) {
		if (evt.buttons & MouseButton.Left) {
			evt.preventDefault();
			let pos = this.getMousePosition(evt);
			let x = pos.x - this.lastMousePos.x;
			let y = pos.y - this.lastMousePos.y;
			this.lastMousePos = pos; // update last mouse position
			// -- drag object(s)
			if (this.selectedElement && !this.selected.includes(this.selectedElement.id)) {
				this.selectedElement.moveBy(x, y);
			}
			if (this.selected.length > 0) {
				evt.preventDefault();
				for (let index = 0; index < this.selected.length; index++) {
					const element = this.elements[this.selected[index]];
					element.moveBy(x,y);
				}
			}
		} else if (evt.buttons & MouseButton.Right) {
			evt.preventDefault();
			this.selectDrag(evt);
		}
	}
	
	mainToolEndDrag(evt) {
		this.selectedElement = null;
		this.selectEndDrag(evt);
	}
	
	// -- eraser
	
	eraserClick(evt) {
		this.eraser(evt);
	}
	
	eraserDrag(evt) {
		this.eraser(evt);
	}
	
	eraserEndDrag(evt) {
		this.selectedElement = null;
	}

	eraser(evt) {
		if (evt.buttons & MouseButton.Left) {
			// -- Select the clicked element
			if (evt.target.classList.contains('draggable')) {
				// this.selectedElement = evt.target;
				this.selectedElement = this.elements[evt.target.id];
			} else {
				this.selectedElement = null;
			}
			// -- click on element
			if (this.selectedElement) {
				// -- remove element from svg
				this.selectedElement.element.remove();//.parentNode.removeChild(this.selectedElement);
				// -- remove element from this.selected
				this.unselect(this.selectedElement.id);
				// -- remove element from this.elements
				// let index = this.elements.indexOf(this.selectedElement);
				// if (index > -1) { // only splice array when item is found
				// 	this.elements.splice(index, 1); // 1 means remove one item only
				// }
				delete this.elements[this.selectedElement.id];
				// -- unselect element
				this.selectedElement = null;
				// console.log(this.elements);
			}
		}
	}
	
	// -- select
	
	unselectAll() {
		for (let index = 0; index < this.selected.length; index++) {
			const element = this.elements[this.selected[index]].element;
			let classString = element.getAttributeNS(null, "class");
			classString = classString.replaceAll(" selected", "");
			element.setAttributeNS(null, "class", classString);
		}
		// console.log(this.selected);
		this.selected = [];
	}
	
	unselect(id) {
		let index = this.selected.indexOf(id);
		if (index > -1) { // only splice array when item is found
			const element = this.elements[id].element;
			let classString = element.getAttributeNS(null, "class");
			classString = classString.replaceAll(" selected", "");
			element.setAttributeNS(null, "class", classString);
			
			this.selected.splice(index, 1); // 1 means remove one item only
		}
		// console.log(this.selected);
	}
	
	select(id) {
		const element = this.elements[id];
		this.selected.push(element.id);
		const svgElement = element.element;
		let classString = svgElement.getAttributeNS(null, "class");
		if (!classString.includes("selected")) {
			svgElement.setAttributeNS(null, "class", classString+" selected");
		}
		// console.log(this.selected);
	}
	
	addSelectRectangle() {
		let rect = $(document.createElementNS(xmlns, 'rect')).appendTo(this.$svg).attr({
			class: 'selectRectangle',
			id: 'selectRectangle',
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			visibility: "visible"
		}); //width: this.$svg.attr('width'), height: this.$svg.attr('height')
		return rect;
	};
	
	selectClick(evt) {
		if (evt.buttons & (MouseButton.Left | MouseButton.Right)) {
			// -- click on background
			if (evt.target.id == 'background') {
				this.unselectAll();
				this.dragStart = this.getMousePosition(evt);

				// -- click on draggable element
			} else if (evt.target.classList.contains('draggable')) {
				if (this.selected.includes(evt.target.id)) {
					// -- unselect the clicked element
					this.unselect(evt.target.id);
				} else {
					// -- select the clicked element
					this.select(evt.target.id);
					this.dragStart = null;
				}
			}
		}
	}
	
	selectDrag(evt) {
		if (evt.buttons & (MouseButton.Left | MouseButton.Right)) {
			if (this.dragStart != null) {
				this.unselectAll();
				let mouse = this.getMousePosition(evt);
				let minPos = {
					x: Math.min(mouse.x, this.dragStart.x),
					y: Math.min(mouse.y, this.dragStart.y)
				};
				let maxPos = {
					x: Math.max(mouse.x, this.dragStart.x),
					y: Math.max(mouse.y, this.dragStart.y)
				};
				this.selectRectangle.attr({
					x: minPos.x,
					y: minPos.y,
					width: maxPos.x-minPos.x,
					height: maxPos.y-minPos.y,
					visibility: "visible"
				});
				for (const [id, element] of Object.entries(this.elements)) {
					const pos = element.position;
					if (minPos.x < pos.x && pos.x < maxPos.x && minPos.y < pos.y && pos.y < maxPos.y) {
						this.select(id);
					}
				}
			}
		}
	}
	
	selectEndDrag(evt) {
		this.selectRectangle.attr({
			visibility: "hidden"
		});
		this.dragStart = null;
	}
	
	// -- connect
	
	
}






/* TESTS */

// class A {
// 	hello() {
// 		this.print();
// 	}
	
// 	print() {
// 		console.log("A");
// 	}
// }

// class B extends A {
// 	print() {
// 		console.log("B");
// 	}
// }

// b = new B();
// b.hello();

// class A {
// 	static instanceNumber = 0;
// 	static newID() {
// 		let n = A.instanceNumber;
// 		A.instanceNumber++;
// 		return n;
// 	}
	
// 	constructor() {
// 		console.log("A"+A.newID());
// 	}
// }

// class B extends A {
// 	constructor() {
// 		super();
// 		console.log("B"+B.newID());
// 	}
// }

// var a = new A();
// a = new A();
// a = new A();
// var b = new B();

// console.log(A.instanceNumber);
// console.log(B.instanceNumber);




























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
		// makeInteractive({target:this.$svg[0]});
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










