

const xmlns = 'http://www.w3.org/2000/svg';

// "Enums"
const Tool = {
	Main: "mainTool",
	Eraser: "eraser",
	Select: "select",
	Connect: "connect",
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



// Global state
var initGlobalState = {
	tool: Tool.Free
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

class BasePoint extends Point {
	static new(_elements, _svg, _pos, _r) {
		let pt = new BasePoint(_svg, _pos, _r);
		_elements[pt.id] = pt;
		return pt;
	}
	
	constructor(_svg, _pos, _r) {
		super(_svg, _pos, _r);
		this.children = []; // JS
		this.type = ObjectTypes.BasePoint;
	}
	
	moveTo(x, y) {
		super.moveTo(x,y);
		for (const lastFreePoint of this.children) {
			lastFreePoint.updateBase()
			// this.moveBy(x-this.pos.x, y-this.pos.y);
		}
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
		let pt = new LastFreePoint(_elements, _lineParent, _pointParent, _base, _pos, _r);
		_elements[pt.id] = pt;
		console.log("new", pt.base.children);
		return pt;
	}
	
	constructor(_elements, _lineParent, _pointParent, _base, _pos, _r) {
		super(_pointParent, _pos, _r);
		this.line = Line.new(_elements, _lineParent, _base.position, _pos); // JS line
		this.base = _base; // JS BasePoint / LastFreePoint
		this.base.children.push(this);
		this.children = []; // JS
		this.type = ObjectTypes.LastFreePoint;
	}
	
	moveTo(x, y) {
		super.moveTo(x,y);
		this.line.position2 = {x: x, y: y};
		for (const lastFreePoint of this.children) {
			lastFreePoint.updateBase()
			// this.moveBy(x-this.pos.x, y-this.pos.y);
		}
	}
	
	updateBase() {
		this.line.position1 = this.base.position;
	}
	
	get descendants() {
		let desc = this.children;
		for (const lastFreePoint of this.children) {
			desc = desc.concat(lastFreePoint.descendants);
		}
		return desc;
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
			id: (name ? name : "svg"+mySVG.newID()),
			height: '200px'
		}).appendTo($container);
		this.$svg[0].setAttribute("viewBox", "0 0 " + (width || 100).toString() + ' ' + (height || 100).toString()); // can't use .attr for uppercase letters
		
		this.svg = this.$svg[0];

		// -- all "myElement"s
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
		this.lineGroup = $(document.createElementNS(xmlns, 'g')).appendTo(this.$svg).attr({
			id: 'lineGroup'
		})[0];
		this.pointGroup = $(document.createElementNS(xmlns, 'g')).appendTo(this.$svg).attr({
			id: 'pointGroup'
		})[0];
		
		this.selectRectangle = this.addSelectRectangle();
		// this.basePoint = Point.new(this.elements, this.svg, {x:10, y:80}, 4);
		// Line.new(this.elements, this.svg, {x:0,y:20}, {x:20,y:20});
		this.basePoint = BasePoint.new(this.elements, this.pointGroup, {x:10, y:80}, 6);
		
		// free
		this.selectedElementId;
		this.selectPoint(this.basePoint);
		this.points = [];
		// this.points.push(LastFreePoint.new(this.elements, this.lineGroup, this.pointGroup, this.basePoint, {x:20,y:50}, 4));
		// this.points.push(LastFreePoint.new(this.elements, this.lineGroup, this.pointGroup, this.points[0], {x:40,y:50}, 4));
		// this.points.push(LastFreePoint.new(this.elements, this.lineGroup, this.pointGroup, this.points[1], {x:60,y:50}, 4));
		// this.points.push(LastFreePoint.new(this.elements, this.lineGroup, this.pointGroup, this.points[0], {x:40,y:30}, 4));
		
		this.makeInteractive();
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
			case Tool.Free:
				this.freeClick(evt);
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
			case Tool.Free:
				this.freeDrag(evt);
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
			case Tool.Free:
				this.freeEndDrag(evt);
				break;
			default:
				break;
		}
		// this.selectedElement = null;
	}
	
	// -- free
	
	unselectPoint() {
		if (this.selectedElementId) {
			const svgElement = this.elements[this.selectedElementId].element;
			svgElement.classList.remove("selectedPoint");
			this.selectedElementId = null;
		}
	}
	
	selectPoint(pt) {
		this.unselectPoint();
		this.selectedElementId = pt.id;
		const svgElement = pt.element;
		svgElement.classList.add("selectedPoint");
	}	
	
	freeClick(evt) {
		// -- save click position
		let pos = this.getMousePosition(evt);
		this.lastMousePos = pos;
		let id = evt.target.id;
		let element = this.elements[id];
		
		if (evt.buttons & MouseButton.Left) {
			if (id == 'background' && this.selectedElementId) {
				// >> click on background
				
				this.unselectAll();
				// -- create free point at mouse position, attached to this.selectedElementId
				let pt = this.createFreePoint(this.selectedElementId, pos);
				// -- select created point
				this.selectPoint(pt);
				
			} else if (enriquesPointTypes.includes(element.type)) {
				// >> click on point
				// evt.target.classList.contains('draggable')
				// ['draggable', 'point'].every(className => evt.target.classList.contains(className))
				this.selectPoint(this.elements[evt.target.id]);
				
			} else {
				this.unselectPoint();
			}
			
		} else if (evt.buttons & MouseButton.Right) {
			this.unselectPoint();
		}
	}
	
	createFreePoint(parentId, pos) {
		let pt;
		let parent = this.elements[parentId];

		// -- create free point connected to parent
		pt = LastFreePoint.new(this.elements, this.lineGroup, this.pointGroup,
													 parent, pos, 4);
		this.points.push(pt);
		
		console.log("parent.children =", parent.children.map(pt => pt.id));
		return pt;
	}
	
	freeDrag(evt) {
		if (evt.buttons & MouseButton.Left) {
			if (this.selectedElementId) {
				evt.preventDefault();
				let pos = this.getMousePosition(evt);
				let x = pos.x - this.lastMousePos.x;
				let y = pos.y - this.lastMousePos.y;
				this.lastMousePos = pos; // update last mouse position
				// -- drag object(s)
				this.elements[this.selectedElementId].moveBy(x, y);
			}
		}
	}
	
	freeEndDrag(evt) {
		
	}
	
	// -- main tool
	
	mainToolClick(evt) {
		// -- save click position
		this.lastMousePos = this.getMousePosition(evt);
		
		if (evt.buttons & MouseButton.Left) {
			// -- click on background
			let id = evt.target.id;
			let element = this.elements[id];
			if (id == 'background') {
				this.unselectAll();
				// -- create circle at mouse position
				let pos = this.getMousePosition(evt);
				let element = Point.new(this.elements, this.svg, pos, 2.5);
				// -- select created circle
				this.selectedElement = element;
				
				// -- click on draggable element
			} else if (movablePointTypes.includes(element.type)) {
				//evt.target.classList.contains('draggable')
				
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
	
	eraserClick = this.eraser;
	
	eraserDrag = this.eraser;
	
	eraserEndDrag(evt) {
		this.selectedElement = null;
	}
	
	eraser(evt) {
		if (evt.buttons & MouseButton.Left) {
			let id = evt.target.id;
			let element = this.elements[id];
			if (id != 'background' && deletablePointTypes.includes(element.type)) {
				// evt.target.classList.contains('draggable')
				this.erasePointAndDescendants(element);
			} else {
				this.selectedElement = null;
			}
		}
	}
	
	erasePointAndDescendants(element) {
		let parentPoint = element;
		// this.selectedElement = parentPoint;
		console.log("parentPoint.id =", parentPoint.id);
		console.log("parentPoint.children =", parentPoint.children.map(pt => pt.id));
		
		// -- unselect element
		this.selectedElement = null;
		this.unselectPoint();
		this.unselectAll();
		
		// -- remove from base's children
		let index = parentPoint.base.children.indexOf(parentPoint.id);
		parentPoint.base.children.splice(index, 1);

		// -- use the element's removal function
		// parentPoint.del();
		
		// -- remove descendants and itself
		let desc = parentPoint.descendants; // includes parentPoint
		desc.push(parentPoint);
		console.log("desc = ", desc);
		for (const descendantPoint of desc) {
			console.log(descendantPoint.id);
			// this.unselectElement(descendantPoint.id); // included in unselectAll()
			
			delete this.elements[descendantPoint.id]; // remove from mySVG
			descendantPoint.element.remove(); // remove from SVG
			
			// -- clear links to other points
			descendantPoint.children = [];
			descendantPoint.base = null;
			
			// -- remove child line
			console.log(descendantPoint.line.id);
			delete this.elements[descendantPoint.line.id]; // remove from mySVG
			descendantPoint.line.element.remove(); // remove from SVG
		}
	}
	
	// -- select
	
	unselectAll() {
		for (let index = 0; index < this.selected.length; index++) {
			const element = this.elements[this.selected[index]].element;
			element.classList.remove("selected");
		}
		this.selected = [];
	}
	
	unselectElement(id) {
		let index = this.selected.indexOf(id);
		if (index > -1) { // only splice array when item is found
			const element = this.elements[id].element;
			element.classList.remove("selected");
			this.selected.splice(index, 1); // 1 means remove one item only
		}
	}
	
	selectElement(id) {
		const element = this.elements[id];
		this.selected.push(element.id);
		const svgElement = element.element;
		svgElement.classList.add("selected");
	}
	
	addSelectRectangle() {
		let rect = $(document.createElementNS(xmlns, 'rect')).attr({
			class: 'selectRectangle',
			id: 'selectRectangle',
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			visibility: "visible"
		}).appendTo(this.$svg); //width: this.$svg.attr('width'), height: this.$svg.attr('height')
		return rect;
	};
	
	selectClick(evt) {
		if (evt.buttons & (MouseButton.Left | MouseButton.Right)) {
			// -- click on background
			let id = evt.target.id;
			let element = this.elements[id];
			if (id == 'background') {
				this.unselectAll();
				this.dragStart = this.getMousePosition(evt);

				// -- click on draggable element
			} else if (movablePointTypes.includes(element.type)) {
				// evt.target.classList.contains('draggable')
				
				if (this.selected.includes(evt.target.id)) {
					// -- unselect the clicked element
					this.unselectElement(evt.target.id);
				} else {
					// -- select the clicked element
					this.selectElement(evt.target.id);
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
					if (minPos.x < pos.x &&
						pos.x < maxPos.x &&
						minPos.y < pos.y &&
						pos.y < maxPos.y &&
						movablePointTypes.includes(element.type) ) {
						this.selectElement(id);
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
	
	// -- GENERAL
	
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



