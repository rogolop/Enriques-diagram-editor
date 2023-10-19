

const xmlns = 'http://www.w3.org/2000/svg';

const EPS = 1e-6;

// "Enums"
const Tool = {
	Main: "mainTool",
	Eraser: "eraser",
	Select: "select",
	Free: "free"
};
const Tools = Object.keys(Tool).map(function(key){return Tool[key];});

const MouseButton = {
	Left: 1,
	Right: 2,
	Middle: 4,
	Back: 8,
	Forward: 16
};

const ObjectTypes = {
	Point: "Point",
	Line: "Line",
	BasePoint: "BasePoint",
	LastFreePoint: "LastFreePoint",
	LastSatellitePoint: "LastSatellitePoint",
	IntermediatePoint: "IntermediatePoint"
};

const enriquesPointTypes = [
	ObjectTypes.BasePoint,
	ObjectTypes.LastFreePoint,
	ObjectTypes.LastSatellitePoint,
	ObjectTypes.IntermediatePoint
];

const movablePointTypes = [
	ObjectTypes.BasePoint,
	ObjectTypes.LastFreePoint,
	ObjectTypes.LastSatellitePoint
];

const deletablePointTypes = [
	ObjectTypes.LastFreePoint,
	ObjectTypes.LastSatellitePoint
];

const lastPointTypes = [
	ObjectTypes.LastFreePoint,
	ObjectTypes.LastSatellitePoint
];

// Global state
var initGlobalState = {
	tool: Tool.Main
};
var GlobalState = initGlobalState;

// Selected <svg> element
var activeSVG;

function selectSVG(evt) {
	if (activeSVG) {
		activeSVG.classList.remove("activeSVG");
	}
	// $(activeSVG).attr({
	// 	class: ""
	// });
	activeSVG = evt.target;
	// $(activeSVG).attr({
	// 	class: "activeSVG"
	// });
	activeSVG.classList.add("activeSVG");
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
	
	elHtml = elHtml.replace("</svg>", "<style>"+cssString+"</style></svg>");
	
	var link = document.createElement('a');
	mimeType = mimeType || 'text/plain';

	link.setAttribute('download', filename);
	link.setAttribute('href', 'data:' + mimeType  +  ';charset=utf-8,' + encodeURIComponent(elHtml));
	link.click(); 
}

/////////////////////////////////////////////////////////////////////

// When the page has completed loading
$(function() {
	// Initialize radio buttons "tool"
	$('input:radio[name=tool]').val([initGlobalState.tool]);
	
	// Function called when radio buttons "tool" change value
	$('input[type=radio][name=tool]').change(function() {
		if (Tools.includes(this.value)) {
			GlobalState.tool = this.value;
			
			// -- add active tool to svg as class
			for (const tool of Tools) {
				activeSVG.classList.remove(tool);
			}
			activeSVG.classList.add(this.value);
			
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
		// this.element.addEventListener('mouseenter', function(){this.element.classList.add("hovering");}.bind(this));
		// this.element.addEventListener('mouseleave', function(){this.element.classList.remove("hovering");}.bind(this));
		this.type = ObjectTypes.Point;
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
		this.type = ObjectTypes.Line;
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

class LineFromTo extends Line {
	static new(_elements, _svg, _pt1, _pt2) {
		let line = new LineFromTo(_svg, _pt1, _pt2);
		_elements[line.id] = line;
		return line;
	}
	
	constructor(_svg, _pt1, _pt2) {
		super(_svg, _pt1.position, _pt2.position);
		this.point1 = _pt1.id; // id
		this.point2 = _pt2.id; // id
	}
}

class BasePoint extends Point {
	static new(_elements, _svg, _pos, _r) {
		let pt = new BasePoint(_svg, _pos, _r);
		_elements[pt.id] = pt;
		return pt;
	}
	
	constructor(_svg, _pos, _r) {
		super(_svg, _pos, _r);
		this.children = []; // id
		this.type = ObjectTypes.BasePoint;
	}
}

class LastFreePoint extends Point {
	static instanceNumber = 0;
	static newID() {
		let n = LastFreePoint.instanceNumber;
		LastFreePoint.instanceNumber++;
		return n;
	}
	
	static new(_elements, _lineParent, _pointParent, _base, _pos, _r) {
		let pt = new LastFreePoint(_elements, _pointParent, _base, _pos, _r);
		let _line = LineFromTo.new(_elements, _lineParent, _base, pt); // JS line
		pt.line = _line.id;
		_elements[pt.id] = pt;
		return pt;
	}
	
	constructor(_elements, _pointParent, _base, _pos, _r) {
		super(_pointParent, _pos, _r);
		this.line = null;
		this.base = _base.id; // id BasePoint / LastFreePoint
		_base.children.push(this.id);
		this.children = []; // ids
		this.type = ObjectTypes.LastFreePoint;
	}
}

class mySVG {
	static instanceNumber = 0;
	static newID() {
		let n = mySVG.instanceNumber;
		mySVG.instanceNumber++;
		return n;
	}
	
	constructor(width, height, parent, name) {
		var $container = $('#' + parent); // search parent by id
		if ($container.length === 0) {
			console.log("No element found with id =", parent);
			$container = $('body,html');
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
		
		// select this svg
		if (activeSVG) {
			activeSVG.classList.remove("activeSVG");
		}
		activeSVG = this.svg;
		activeSVG.classList.add("activeSVG");
		
		// -- all "myElement"s
		this.elements = {}; // id -> myElement
		this.points = []; // ids
		this.lines = []; // ids
		
		// -- event variables
		this.mousePos = {x:0, y:0}; // pos
		this.dragStartMousePos = {x:0, y:0}; // pos
		this.lastMousePos = {x:0, y:0}; // pos
		this.mouseButtons = 0;
		this.dx = 0;
		this.dy = 0;
		this.targetId = null; // id
		this.targetElement = null; // myElement
		
		// -- tool variables
		this.movingAnElement = false;
		this.selectingRectangle = false;
		this.selected = []; // ids
		this.descendants = []; // ids
		
		// -- create background
		this.$background = this.createBackground();
		
		// -- create SVG grouping elements
		this.lineGroup = $(document.createElementNS(xmlns, 'g')).appendTo(this.$svg).attr({
			id: 'lineGroup'
		})[0];
		this.pointGroup = $(document.createElementNS(xmlns, 'g')).appendTo(this.$svg).attr({
			id: 'pointGroup'
		})[0];
		
		// -- create tool gui svg elements
		this.$selectRectangle = this.createSelectionRectangle();
		
		
		// -- create Enriques base point
		let pt = BasePoint.new(this.elements, this.pointGroup, {x:10, y:80}, 6);
		this.basePoint = pt.id; // id
		this.selectElement(this.basePoint);
		
		// -- create example diagram
		this.createExampleDiagram();
		
		// -- add mouse event listeners
		this.makeInteractive();
	}
	
	// -- GENERAL
	
	makeInteractive() {
		// mouse events
		this.svg.addEventListener('mousedown', this.doOnClick.bind(this));
		this.svg.addEventListener('mousemove', this.doOnDrag.bind(this));
		this.svg.addEventListener('mouseup',  this.doOnEndDrag.bind(this));
		this.svg.addEventListener('mouseleave', this.doOnEndDrag.bind(this));
		
		this.svg.addEventListener('mouseover', this.doOnMouseOver.bind(this));
		// this.svg.addEventListener('mouseout', this.doOnMouseOver.bind(this));
		
		// touch events
		this.svg.addEventListener('touchstart', this.doOnClick.bind(this));
		this.svg.addEventListener('touchmove', this.doOnDrag.bind(this));
		this.svg.addEventListener('touchend', this.doOnEndDrag.bind(this));
		this.svg.addEventListener('touchleave', this.doOnEndDrag.bind(this));
		this.svg.addEventListener('touchcancel', this.doOnEndDrag.bind(this));
		// avoid right click context menu
		this.svg.addEventListener("contextmenu", e => e.preventDefault());
	}
	
	// -- handle click, drag, end drag
	
	doOnClick(evt) {
		this.mousePos = this.getMousePosition(evt);
		this.dragStartMousePos = this.mousePos;
		this.targetId = evt.target.id;
		this.targetElement = this.elements[this.targetId];
		this.mouseButtons = evt.buttons;
		
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
			case Tool.Free:
				this.freeClick(evt);
				break;
			default:
				break;
		}
	}
	
	doOnDrag(evt) {
		this.mousePos = this.getMousePosition(evt);
		this.dx = this.mousePos.x - this.lastMousePos.x;
		this.dy = this.mousePos.y - this.lastMousePos.y;
		this.targetId = evt.target.id;
		this.targetElement = this.elements[this.targetId];
		
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
			case Tool.Free:
				this.freeDrag(evt);
				break;
			default:
				break;
		}
		
		this.lastMousePos = this.mousePos;
	}
	
	doOnEndDrag(evt) {
		this.mousePos = this.getMousePosition(evt);
		this.targetId = evt.target.id;
		this.targetElement = this.elements[this.targetId];
		
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
			case Tool.Free:
				this.freeEndDrag(evt);
				break;
			default:
				break;
		}
		
		this.mouseButtons = 0;
	}
	
	doOnMouseOver(evt) {
		if (this.mouseButtons == 0) {
			this.mousePos = this.getMousePosition(evt);
			this.targetId = evt.target.id;
			this.targetElement = this.elements[this.targetId];
			this.mouseButtons = evt.buttons;
			
			// -- act depending on tool
			switch (GlobalState.tool) {
				case Tool.Main:
					this.mainToolMouseOver(evt);
					break;
				case Tool.Eraser:
					this.eraserMouseOver(evt);
					break;
				case Tool.Select:
					this.selectMouseOver(evt);
					break;
				case Tool.Free:
					this.freeMouseOver(evt);
					break;
				default:
					break;
			}
		}
	}
	
	// ---- TOOLS
	
	// -- main tool
	
	mainToolClick(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			if (this.targetId == 'background' && this.selected.length == 1) {
				let pt = this.createFreePoint(this.selected[0], this.mousePos);
				this.unselectAll();
				this.selectElement(pt.id);
				
			} else if (this.targetElement && movablePointTypes.includes(this.targetElement.type)) {
				if (this.selected.length <= 1 || !this.selected.includes(this.targetId)) {
					this.unselectAll();
					this.selectElement(this.targetId);
				}
				
			} else {
				this.unselectAll();
			}
		} else if (this.mouseButtons & MouseButton.Right) {
			if (this.targetId == 'background') {
				this.unselectAll();
				this.startSelectionInRectangle();
			}
			// else if (this.targetElement && movablePointTypes.includes(this.targetElement.type)) {
			// 	this.toggleSelectElement(this.targetId);
			// }
		}
	}
	
	mainToolDrag(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			// -- drag objects (if any)
			this.movingAnElement = true;
			this.moveSelectedBy(this.dx, this.dy);
			
		} else if (this.mouseButtons & MouseButton.Right) {
			if (this.selectingRectangle) {
				this.multipleSelectInRectangle();
			}
		}
	}
	
	mainToolEndDrag(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			if (this.movingAnElement) {
				this.movingAnElement = false;
			} else {
				// if (this.distance2(this.dragStartMousePos, this.mousePos) < EPS) {
				if (this.targetElement && movablePointTypes.includes(this.targetElement.type)) {
					if (this.selected.length >= 2) {
						this.toggleSelectElement(this.targetId);
					}
				}
			}
		} else if (this.mouseButtons & MouseButton.Right) {
			if (this.selectingRectangle) {
				this.stopSelectionInRectangle();
			} else if (!this.movingAnElement) {
				if (this.targetElement && movablePointTypes.includes(this.targetElement.type)) {
					this.toggleSelectElement(this.targetId);
				}
			}
		}
	}
	
	mainToolMouseOver(evt) {}
	
	// -- free
	
	freeClick(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			if (this.targetId == 'background' && this.selected.length == 1) {
				let pt = this.createFreePoint(this.selected[0], this.mousePos);
				this.unselectAll();
				this.selectElement(pt.id);
				
			} else if (this.targetElement && movablePointTypes.includes(this.targetElement.type)) {
				this.unselectAll();
				this.selectElement(this.targetId);
				
			} else {
				this.unselectAll();
			}
			
		} else if (this.mouseButtons & MouseButton.Right) {
			this.unselectAll();
		}
	}
	
	freeDrag(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			// -- drag objects (if any)
			this.movingAnElement = true;
			this.moveSelectedBy(this.dx, this.dy);
		}
	}
	
	freeEndDrag(evt) {
		if (this.movingAnElement) {
			this.movingAnElement = false;
		}
	}
	
	freeMouseOver(evt) {}
	
	// -- select
	
	selectClick(evt) {
		if (this.mouseButtons & (MouseButton.Left | MouseButton.Right)) {
			if (this.targetId == 'background') {
				// >> click on background
				this.unselectAll();
				this.startSelectionInRectangle();

			} else if (this.targetElement && movablePointTypes.includes(this.targetElement.type)) {
				// >> click on movable point
				this.toggleSelectElement(this.targetId);
			}
		}
	}
	
	selectDrag(evt) {
		if (this.mouseButtons & (MouseButton.Left | MouseButton.Right)) {
			if (this.selectingRectangle) {
				this.multipleSelectInRectangle();
			}
		}
	}
	
	selectEndDrag(evt) {
		this.stopSelectionInRectangle();
	}
	
	selectMouseOver(event) {}
	
	// -- eraser
	
	eraserClick = this.erase;
	
	eraserDrag = this.erase;
	
	eraserEndDrag(evt) {
		this.unselectAll();
	}
	
	eraserMouseOver(evt) {
		this.highlightDescendants(this.targetElement);
	}
	
	// ---- FUNCTIONS
	
	// -- move
	
	moveSelectedBy(dx, dy) {
		for (let index = 0; index < this.selected.length; index++) {
			const id = this.selected[index]
			const element = this.elements[id];
			if (element.type == ObjectTypes.BasePoint) {
				this.moveBasePointBy(element, dx, dy);
			} else if (element.type == ObjectTypes.LastFreePoint) {
				this.moveLastFreePointBy(element, dx, dy);
			} else {
				element.moveBy(dx, dy);
			}
		}
	}
	
	moveBasePointBy(element, dx, dy) {
		element.moveBy(dx, dy);
		for (const childId of element.children) {
			let child = this.elements[childId];
			let line = this.elements[child.line];
			line.position1 = element.position;
		}
	}
	
	moveLastFreePointBy(element, dx, dy) {
		element.moveBy(dx, dy);
		let line = this.elements[element.line];
		line.position2 = element.position;
		for (const childId of element.children) {
			let child = this.elements[childId];
			line = this.elements[child.line];
			line.position1 = element.position;
			// this.moveBy(x-this.pos.x, y-this.pos.y);
		}
	}
	
	// -- erase
	
	erase(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			if (this.targetElement && deletablePointTypes.includes(this.targetElement.type)) {
				// evt.target.classList.contains('draggable')
				this.erasePointAndDescendants(this.targetElement);
			} else {
				this.unselectAll();
			}
		}
	}
	
	erasePointAndDescendants(element) {
		this.descendants = [];
		
		// -- unselect
		this.unselectAll();
		
		// -- remove from base's children
		let base = this.elements[element.base];
		let index = base.children.indexOf(element.id);
		base.children.splice(index, 1);
		
		// -- remove descendants of element and itself
		let removalQueue = [element.id];
		while (removalQueue.length > 0) {
			let descendant = this.elements[removalQueue.shift()];
			// -- add children of descendant for removal
			removalQueue = removalQueue.concat(descendant.children);
			// -- remove from SVG
			descendant.element.remove();
			// -- clear links to other points
			descendant.children = [];
			descendant.base = null;
			
			let line = this.elements[descendant.line];
			// -- remove from SVG
			line.element.remove();
			// -- clear links to other points
			line.point1 = null;
			line.point2 = null;
			
			// -- remove from mySVG
			delete this.elements[line.id];
			delete this.elements[descendant.id];
		}
	}
	
	highlightDescendants(element) {
		// -- remove highlights, clear this.descendants
		for (const id of this.descendants) {
			let descendant = this.elements[id];
			descendant.element.classList.remove("highlight");
			// -- remove highlight from incoming line
			if (lastPointTypes.includes(descendant.type)) {
				let line = this.elements[descendant.line];
				line.element.classList.remove("highlight");
			}
		}
		this.descendants = [];
		
		if (element && movablePointTypes.includes(element.type)) {
			// -- highlight descendants of element and itself
			// element.element.classList.add("highlight");
			// this.descendants.push(element.id);
			// let queue = element.children.concat([]); // .concat([]) to do a shallow copy instead of assigning references
			let queue = [element.id];
			if (element.type == ObjectTypes.BasePoint) {
				queue = element.children.concat([]); // .concat([]) to do a shallow copy instead of assigning references
			}
			while (queue.length > 0) {
				let descendant = this.elements[queue.shift()];
				// -- add highlighted point to this.descendants
				this.descendants.push(descendant.id);
				// -- add children of descendant to queue
				queue = queue.concat(descendant.children);
				// -- highlight point and line
				descendant.element.classList.add("highlight");
				if (lastPointTypes.includes(descendant.type)) {
					let line = this.elements[descendant.line];
					line.element.classList.add("highlight");
				}
			}
		}
	}
	
	
	// -- select
	
	selectElement(id) {
		const element = this.elements[id];
		this.selected.push(element.id);
		const svgElement = element.element;
		svgElement.classList.add("selected");
	}
	
	unselectElement(id) {
		let index = this.selected.indexOf(id);
		if (index > -1) { // only splice array when item is found
			const element = this.elements[id].element;
			element.classList.remove("selected");
			this.selected.splice(index, 1); // 1 means remove one item only
		}
	}
	
	toggleSelectElement(id) {
		if (this.selected.includes(id)) {
			this.unselectElement(id);
		} else {
			this.selectElement(id);
		}
	}
	
	unselectAll() {
		for (let index = 0; index < this.selected.length; index++) {
			const element = this.elements[this.selected[index]].element;
			element.classList.remove("selected");
		}
		this.selected = [];
	}
	
	// -- select in rectangle
	
	startSelectionInRectangle() {
		this.selectingRectangle = true;
		this.multipleSelectInRectangle();
	}
	
	multipleSelectInRectangle() {
		this.unselectAll();
		let minPos = {
			x: Math.min(this.mousePos.x, this.dragStartMousePos.x),
			y: Math.min(this.mousePos.y, this.dragStartMousePos.y)
		};
		let maxPos = {
			x: Math.max(this.mousePos.x, this.dragStartMousePos.x),
			y: Math.max(this.mousePos.y, this.dragStartMousePos.y)
		};
		this.$selectRectangle.attr({
			x: minPos.x,
			y: minPos.y,
			width: maxPos.x-minPos.x,
			height: maxPos.y-minPos.y,
			visibility: "visible"
		});
		let pos;
		for (const [id, element] of Object.entries(this.elements)) {
			pos = element.position;
			if (
				movablePointTypes.includes(element.type) &&
				minPos.x < pos.x &&
				pos.x < maxPos.x &&
				minPos.y < pos.y &&
				pos.y < maxPos.y
				) {
				this.selectElement(id);
			}
		}
	}
	
	stopSelectionInRectangle() {
		this.selectingRectangle = false;
		this.$selectRectangle.attr({visibility: "hidden"});
	}
	
	// -- create
	
	createBackground() {
		let $bg = $(document.createElementNS(xmlns, 'rect')).attr({
			class: 'background',
			id: 'background',
			width: '100%',
			height: '100%'
		}).appendTo(this.$svg);
		return $bg;
	};
	
	createSelectionRectangle() {
		let $rect = $(document.createElementNS(xmlns, 'rect')).attr({
			class: 'selectRectangle',
			id: 'selectRectangle',
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			visibility: "visible"
		}).appendTo(this.$svg); //width: this.$svg.attr('width'), height: this.$svg.attr('height')
		return $rect;
	};
	
	createFreePoint(parentId, pos) {
		let pt;
		let parent = this.elements[parentId];
		
		// -- create free point connected to parent
		pt = LastFreePoint.new(this.elements, this.lineGroup, this.pointGroup,
													 parent, pos, 4);
		this.points.push(pt.id);
		this.lines.push(pt.line);
		
		return pt;
	}
	
	createExampleDiagram() {
		let pt = this.createFreePoint(this.basePoint, {x: 20, y: 50});
		let pt4 = this.createFreePoint(pt.id, {x: 40, y: 80});
		pt4 = this.createFreePoint(pt4.id, {x: 60, y: 90});
		pt4 = this.createFreePoint(pt4.id, {x: 130, y: 90});
		pt4 = this.createFreePoint(pt4.id, {x: 140, y: 70});
		pt = this.createFreePoint(pt.id, {x: 35, y: 30});
		pt = this.createFreePoint(pt.id, {x: 50, y: 20});
		pt = this.createFreePoint(pt.id, {x: 70, y: 20});
		this.createFreePoint(pt.id, {x: 70, y: 40});
		pt = this.createFreePoint(pt.id, {x: 90, y: 20});
		this.createFreePoint(pt.id, {x: 100, y: 10});
		let pt2 = this.createFreePoint(pt.id, {x: 90, y: 40});
		let pt3 = this.createFreePoint(pt2.id, {x: 90, y: 60});
		this.createFreePoint(pt2.id, {x: 110, y: 60});
		this.createFreePoint(pt2.id, {x: 110, y: 40});
		pt = this.createFreePoint(pt.id, {x: 110, y: 20});
		pt = this.createFreePoint(pt.id, {x: 130, y: 20});
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
	
	distance2(pos1, pos2) {
		return (pos1.x-pos2.x)**2 + (pos1.y - pos2.y)**2;
	}
}


