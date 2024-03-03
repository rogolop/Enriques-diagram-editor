

const xmlns = 'http://www.w3.org/2000/svg';

const EPS = 1e-6;

// "Enums"
const Tool = {
	Main: "mainTool",
	Eraser: "eraser",
	Select: "select",
	Free: "free",
	Satellite: "satellite",
	CurveEdit: "curveEdit",
	Labeller: "labeller"
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
	Curve: "Curve",
	BasePoint: "BasePoint",
	LastSatellitePoint: "LastSatellitePoint",
	LastFreePoint: "LastFreePoint",
	IntermediatePoint: "IntermediatePoint",
	Label: "Label"
};

const enriquesPointTypes = [
	ObjectTypes.BasePoint,
	ObjectTypes.LastFreePoint,
	ObjectTypes.LastSatellitePoint,
	ObjectTypes.IntermediatePoint
];

const infinitelyClosePointTypes = [
	ObjectTypes.LastFreePoint,
	ObjectTypes.LastSatellitePoint,
	ObjectTypes.IntermediatePoint
];

const movablePointTypes = [
	ObjectTypes.BasePoint,
	ObjectTypes.LastSatellitePoint,
	ObjectTypes.LastFreePoint
];

const movableTypes = movablePointTypes.concat([
	ObjectTypes.Label
]);

const deletablePointTypes = [
	ObjectTypes.LastSatellitePoint,
	ObjectTypes.LastFreePoint
];

const lastPointTypes = [
	ObjectTypes.LastSatellitePoint,
	ObjectTypes.LastFreePoint
];

const unconstrainedPointTypes = [
	ObjectTypes.BasePoint,
	ObjectTypes.LastFreePoint
];

// Global state
var initGlobalState = {
	tool: Tool.Labeller,
	mySVGs: []
};
var GlobalState = initGlobalState;

// Selected <svg> element
var activeSVG;
var active_mySVG;

function selectSVG(evt) {
	if (activeSVG) {
		activeSVG.classList.remove("activeSVG");
	}
	activeSVG = evt.target;
	activeSVG.classList.add("activeSVG");
	active_mySVG = GlobalState.mySVGs.find(function(mysvg) { return mysvg.svg.id == activeSVG.id});
}

// Download html element with a given id (and its children)
// Partial Source: https://stackoverflow.com/questions/22084698/how-to-export-source-content-within-div-to-text-html-file
function downloadInnerHtml(filename) {
	var mimeType = 'image/svg+xml';
	
	active_mySVG.hideToolGUI();
	
	// -- outerHTML inludes the html element itself, innerHTML only includes children
	// var elHtml = document.getElementById(elId).outerHTML; //.innerHTML;
	var elHtml = activeSVG.outerHTML;
	
	$.ajax({
		url: "svg.css",
		dataType: "text",
		success: function(cssString) {
			// -- embed CSS
			elHtml = elHtml.replace("</svg>", "<style>"+cssString+"</style></svg>");
			
			// -- clean up, remove unnecessary text
			elHtml = elHtml.replace(/class="mySVG.*viewBox/, 'viewBox');
			elHtml = elHtml.replace(/<g id="guiGroup">.*<\/g>/, '');
			elHtml = elHtml.replace(/\/\*.*\*\//g, '');
			elHtml = elHtml.replace(/^\s*$(?:\r\n?|\n)/gm, '');
			elHtml = elHtml.replace(/draggable/g, '');
			elHtml = elHtml.replace(/selected/g, '');
			elHtml = elHtml.replace(/highlight/g, '');
			elHtml = elHtml.replace(/ *" /g, '\" ');
			elHtml = elHtml.replace(/ *">/g, '\">');
			
			// -- download
			var link = document.createElement('a');
			mimeType = mimeType || 'text/plain';
			link.setAttribute('download', filename);
			link.setAttribute('href', 'data:' + mimeType  +  ';charset=utf-8,' + encodeURIComponent(elHtml));
			link.click(); 
		}
	});
	
	// elHtml = elHtml.replace("</svg>", "<style>"+cssString+"</style></svg>");
	
	// var link = document.createElement('a');
	// mimeType = mimeType || 'text/plain';

	// link.setAttribute('download', filename);
	// link.setAttribute('href', 'data:' + mimeType  +  ';charset=utf-8,' + encodeURIComponent(elHtml));
	// link.click(); 
}

function downloadAsTikZ(filename) {
	var mimeType = 'text/plain'; //'image/svg+xml';
	
	active_mySVG.hideToolGUI();
	
	const viewBox = activeSVG.getAttribute("viewBox").split(" ");
	const width = viewBox[2] - viewBox[0];
	const height = viewBox[3] - viewBox[1];
	
	// Tikz header
	var fileContent = `\\begin{tikzpicture}[x=${width}pt,y=${height}pt,yscale=-1,xscale=1,
    inner sep=0pt,
    inner ysep=0pt,
    outer xsep=0pt,
    outer ysep=0pt,
    outer sep=0pt,
    inner xsep=0pt,
    ]
	\\fill[transparent] (0pt,0pt) rectangle (${width}pt,${height}pt);
	\n`;
	
	// Tikz content
	
	let drawableShapes = active_mySVG.getDrawableShapes();
	for (const shape of drawableShapes) {
		if (shape.type == "circle") {
			fileContent += `    \\fill[black] (${shape.pos.x}pt,${shape.pos.y}pt) circle [radius=${shape.r}pt];\n`;
			
		} else if (shape.type == "line") {
			fileContent += `    \\draw[line width=1.5] (${shape.pos1.x}pt,${shape.pos1.y}pt) -- (${shape.pos2.x}pt,${shape.pos2.y}pt);\n`;
			
		} else if (shape.type == "curve") {
			fileContent += `    \\draw[line width=1.5] (${shape.pos1.x}pt,${shape.pos1.y}pt) .. controls (${shape.posC1.x}pt,${shape.posC1.y}pt) and (${shape.posC2.x}pt,${shape.posC2.y}pt) .. (${shape.pos2.x}pt,${shape.pos2.y}pt);\n`;
			
		} else {
			console.log(shape);
		}
	}
	
	// Tikz end of file
	fileContent += "\n\\end{tikzpicture}%";
	
	// -- download
	var link = document.createElement('a');
	mimeType = mimeType || 'text/plain';
	link.setAttribute('download', filename);
	link.setAttribute('href', 'data:' + mimeType  +  ';charset=utf-8,' + encodeURIComponent(fileContent));
	link.click();
}

/////////////////////////////////////////////////////////////////////

// When the page has completed loading (jQuery ready() function)
$(function() {
	// Initialize radio buttons "tool"
	$('input[type=radio][name=tool]').val([initGlobalState.tool]);
	
	// WHY DOES THIS NOT WORK????????????????????????????????????
	// INSTEAD USING checkRadioOnKeyEnterUp, checkRadio BELOW
	//
	// // Change tool (when the radio buttons "tool" change value)
	// $('input[type=number][name=tool]').change(function() {
	// 	console.error("tool change");
	// 	eval("1--");
	// 	if (Tools.includes(this.value)) {
	// 		active_mySVG.stopLabelEdit();
	// 		active_mySVG.hideToolGUI();
	// 		active_mySVG.highlightCancel();
			
	// 		GlobalState.tool = this.value;

	// 		// -- add active tool to svg as class
	// 		for (const tool of Tools) {
	// 			activeSVG.classList.remove(tool);
	// 		}
	// 		activeSVG.classList.add(this.value);
	// 	}
	// });
	
	// Change SVG size (when the number input fields "svgSize" change value)
	$('input[type=number][name=svgSize]').change(function() {
		let viewBox = activeSVG.getAttribute("viewBox").split(" ");
		if (this.id == "svgWidth") {
			activeSVG.setAttribute("viewBox", viewBox[0] + " " + viewBox[1] + " " + this.value + " " + viewBox[3]);
		} else if (this.id == "svgHeight") {
			activeSVG.setAttribute("viewBox", viewBox[0] + " " + viewBox[1] + " " + viewBox[2] + " " + this.value);
		}
	});
	
	// Handle keypresses
	document.onkeydown = function(evt) {
		switch (evt.key) {
			case "Escape":
				if (active_mySVG.editingLabel) {
					active_mySVG.stopLabelEdit();
				} else {
					// Change to main tool
					let $toolButtons = $('input[type=radio][name=tool]');
					$toolButtons.val([Tool.Main]);
					$toolButtons[0].dispatchEvent(new Event('change')); // manually trigger the change event (as if it were user input)
				}
				break;
			case "Enter":
				active_mySVG.stopLabelEdit();
				break;
			default:
				break;
		}
	}
});

function checkRadioOnKeyEnterUp(evt, label){
	if (evt.key === "Enter") checkRadio(label);
}

function checkRadio(label) {
	let input = $("#"+label.getAttribute("for"));
	input.prop("checked", true);
	input = input[0];
	if (Tools.includes(input.value)) {
		GlobalState.tool = input.value;
		
		active_mySVG.hideToolGUI();
		active_mySVG.stopLabelEdit();
		active_mySVG.highlightCancel();
		
		// -- add active tool to svg as class
		for (const tool of Tools) {
			activeSVG.classList.remove(tool);
		}
		activeSVG.classList.add(input.value);
	}
}

////////////////////////////////////////////////////////////////////

function distance2(pos1, pos2) {
	return (pos1.x-pos2.x)**2 + (pos1.y - pos2.y)**2;
}

function distance(pos1, pos2) {
	return Math.sqrt(distance2(pos1, pos2));
}

function normalized(v) {
	let n = Math.sqrt(v.x**2 + v.y**2);
	return { x: v.x/n, y: v.y/n };
}

function directionFromTo(pos1, pos2) {
	return normalized({x: pos2.x-pos1.x, y: pos2.y-pos1.y});
}

function rotate(v, theta) {
	return {
		x: v.x*Math.cos(theta) + v.y*Math.sin(theta),
		y: - v.x*Math.sin(theta) + v.y*Math.cos(theta)
	};
}

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
	
	get position() { return {...this.pos}; } // deep copy of object
	
	set position(_pos) { this.moveTo(_pos.x, _pos.y); }
	
	moveBy(dx, dy) {
		this.moveTo(this.pos.x+dx, this.pos.y+dy);
	}
	
	// move to position
	moveTo(x, y) {
		this.pos.x = x;
		this.pos.y = y;
	}
	
	getDrawableData() {return {type:"none"};}
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
	
	getDrawableData() {return {type:"circle", pos:this.pos, r:this.r};}
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
		this.element = this.createLine();
		this.type = ObjectTypes.Line;
	}
	
	get position1() { return {...this.pos1}; } // deep copy of object
	
	get position2() { return {...this.pos2}; } // deep copy of object
	
	set position1(_pos1) {
		this.pos1 = {..._pos1};
		this.pos = this.center();
		this.element.setAttributeNS(null, 'x1', this.pos1.x);
		this.element.setAttributeNS(null, 'y1', this.pos1.y);
	}
	
	set position2(_pos2) {
		this.pos2 = {..._pos2};
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
	
	createLine() {
		let element = document.createElementNS(xmlns, 'line');
		element.setAttributeNS(null, 'id', this.id);
		element.setAttributeNS(null, 'x1', this.pos1.x);
		element.setAttributeNS(null, 'y1', this.pos1.y);
		element.setAttributeNS(null, 'x2', this.pos2.x);
		element.setAttributeNS(null, 'y2', this.pos2.y);
		element.setAttributeNS(null, 'stroke', "black"); // necessary
		element.setAttributeNS(null, 'stroke-width', 1.5);
		element.setAttributeNS(null, 'class', 'line draggable');
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
	
	getTangentAt(t) {
		return {
			x: this.pos2.x - this.pos1.x,
			y: this.pos2.y - this.pos1.y
		};
	}
	
	getDrawableData() {return {type:"line", pos1:this.pos1, pos2:this.pos2};}
}

class Curve extends myElement {
	static instanceNumber = 0;
	static newID() {
		let n = Curve.instanceNumber;
		Curve.instanceNumber++;
		return n;
	}
	
	static new(_elements, _svg, _pos1, _posC1, _posC2, _pos2) {
		let curve = new Curve(_svg, _pos1, _posC1, _posC2, _pos2);
		_elements[curve.id] = curve;
		return curve;
	}
	
	constructor(_svg, _pos1, _posC1, _posC2, _pos2) {
		super(_svg, "curve"+Curve.newID(), _pos1); // _pos1 is temporary
		this.pos1 = _pos1;
		this.posC1 = _posC1;
		this.posC2 = _posC2;
		this.pos2 = _pos2;
		this.pos = this.center();
		this.element = this.createCurve();
		this.type = ObjectTypes.Curve;
	}
	
	get position1() { return {...this.pos1}; } // deep copy of object
	
	get position2() { return {...this.pos2}; } // deep copy of object

	get positionC1() { return {...this.posC1}; } // deep copy of object
	
	get positionC2() { return {...this.posC2}; } // deep copy of object
	
	set position1(_pos1) {
		this.pos1 = {..._pos1};
		this.pos = this.center();
		this.element.setAttributeNS(null, 'd', this.getPathString());
	}
	
	set position2(_pos2) {
		this.pos2 = {..._pos2};
		this.pos = this.center();
		this.element.setAttributeNS(null, 'd', this.getPathString());
	}
	
	set positionC1(_posC1) {
		this.posC1 = {..._posC1};
		this.element.setAttributeNS(null, 'd', this.getPathString());
	}
	
	set positionC2(_posC2) {
		this.posC2 = {..._posC2};
		this.element.setAttributeNS(null, 'd', this.getPathString());
	}

	center() {
		return {
			x: 1/8*this.pos1.x + 3/8*this.posC1.x +
				3/8*this.posC2.x + 1/8*this.pos2.x,
			y: 1/8*this.pos1.y + 3/8*this.posC1.y +
				3/8*this.posC2.y + 1/8*this.pos2.y
		};
	}
	
	createCurve() {
		let element = document.createElementNS(xmlns, 'path');
		element.setAttributeNS(null, 'id', this.id);
		element.setAttributeNS(null, 'd', this.getPathString());
		element.setAttributeNS(null, 'stroke', "black"); // necessary
		element.setAttributeNS(null, 'stroke-width', 1.5);
		element.setAttributeNS(null, "fill", "none");
		element.setAttributeNS(null, 'class', 'curve draggable');
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
		this.posC1.x += dx;
		this.posC1.y += dy;
		this.posC2.x += dx;
		this.posC2.y += dy;
		this.element.setAttributeNS(null, 'd', this.getPathString());
	}
	
	moveC1By(dx, dy) {
		this.posC1.x += dx;
		this.posC1.y += dy;
		this.element.setAttributeNS(null, 'd', this.getPathString());
	}
	
	moveC2By(dx, dy) {
		this.posC2.x += dx;
		this.posC2.y += dy;
		this.element.setAttributeNS(null, 'd', this.getPathString());
	}
	
	moveTo(x, y) {
		this.moveBy(x-this.pos.x, y-this.pos.y);
	}
	
	getPathString() {
		return "M " + this.pos1.x + " " + this.pos1.y +
				" C " + this.posC1.x + " " + this.posC1.y +
				", " + this.posC2.x + " " + this.posC2.y +
				", " + this.pos2.x + " " + this.pos2.y;
	}
	
	getTangentAt(t) {
		return {
			x: 3*(1-t)**2*(this.posC1.x-this.pos1.x) + 6*(1-t)*t*(this.posC2.x-this.posC1.x) + 3*t**2*(this.pos2.x-this.posC2.x),
			y: 3*(1-t)**2*(this.posC1.y-this.pos1.y) + 6*(1-t)*t*(this.posC2.y-this.posC1.y) + 3*t**2*(this.pos2.y-this.posC2.y)
		};
	}
	
	getDrawableData() {return {type:"curve", pos1:this.pos1, pos2:this.pos2, posC1:this.posC1, posC2:this.posC2};}
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

class CurveFromTo extends Curve {
	static new(_elements, _svg, _pt1, _pt2, _posC1, _posC2) {
		let line = new CurveFromTo(_svg, _pt1, _pt2, _posC1, _posC2);
		_elements[line.id] = line;
		return line;
	}
	
	constructor(_svg, _pt1, _pt2, _posC1, _posC2) {
		super(_svg, _pt1.position, _posC1, _posC2, _pt2.position);
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

class LastSatellitePoint extends Point {
	static instanceNumber = 0;
	static newID() {
		let n = LastSatellitePoint.instanceNumber;
		LastSatellitePoint.instanceNumber++;
		return n;
	}
	
	static new(_elements, _lineParent, _pointParent, _base, _pos, _r) {
		let pt = new LastSatellitePoint(_elements, _pointParent, _base, _pos, _r);
		let _line = LineFromTo.new(_elements, _lineParent, _base, pt); // JS line
		pt.curve = _line.id;
		_elements[pt.id] = pt;
		return pt;
	}
	
	constructor(_elements, _pointParent, _base, _pos, _r) {
		super(_pointParent, _pos, _r);
		this.curve = null;
		this.base = _base.id; // id BasePoint / LastSatellitePoint
		_base.children.push(this.id);
		this.children = []; // ids
		this.type = ObjectTypes.LastSatellitePoint;
	}
}

class LastFreePoint extends Point {
	static instanceNumber = 0;
	static newID() {
		let n = LastFreePoint.instanceNumber;
		LastFreePoint.instanceNumber++;
		return n;
	}
	
	static new(_elements, _lineParent, _pointParent, _base, _pos, _r, _startTangent, _endTangent) {
		let pt = new LastFreePoint(_elements, _pointParent, _base, _pos, _r);
		let _C1 = {x: _base.position.x+_startTangent.x, y:_base.position.y+_startTangent.y};
		let _C2 = {x: _pos.x-_endTangent.x, y:_pos.y-_endTangent.y};
		let _curve = CurveFromTo.new(_elements, _lineParent, _base, pt, _C1, _C2); // JS line
		pt.curve = _curve.id;
		_elements[pt.id] = pt;
		return pt;
	}
	
	constructor(_elements, _pointParent, _base, _pos, _r) {
		super(_pointParent, _pos, _r);
		this.curve = null;
		this.base = _base.id; // id BasePoint / LastFreePoint
		_base.children.push(this.id);
		this.children = []; // ids
		this.type = ObjectTypes.LastFreePoint;
	}
}

class Label extends myElement {
	static instanceNumber = 0;
	static newID() {
		let n = Label.instanceNumber;
		Label.instanceNumber++;
		return n;
	}
	
	static new(_elements, _svg, _pos, _content) {
		let pt = new Label(_svg, _pos, _content);
		_elements[pt.id] = pt;
		return pt;
	}
	
	constructor(_svg, _pos, _content) {
		super(_svg, "label"+Label.newID(), _pos);
		this.contentStr = _content;
		this.element = this.createLabel(_pos, _content, true);
		// this.element.addEventListener('mouseenter', function(){this.element.classList.add("hovering");}.bind(this));
		// this.element.addEventListener('mouseleave', function(){this.element.classList.remove("hovering");}.bind(this));
		this.type = ObjectTypes.Label;
	}
	
	get content() { return this.contentStr.split('').join(''); } // deep copy of string
	
	set content(_content) {
		this.contentStr = _content.split('').join('');// deep copy of string
		this.element.textContent = this.contentStr;
	}
	
	createLabel(pos, content, draggable) {
		let element = document.createElementNS(xmlns, 'text');
		element.setAttributeNS(null, 'id', this.id);
		element.setAttributeNS(null, 'x', pos.x);
		element.setAttributeNS(null, 'y', pos.y);
		element.textContent = content;
		if (draggable) {
			element.setAttributeNS(null, 'class', 'label draggable');
		} else {
			element.setAttributeNS(null, 'class', 'label');
		}
		element = this.svg.appendChild(element);
		return element;
	}
	
	moveTo(x, y) {
		this.element.setAttributeNS(null, 'x', x);
		this.element.setAttributeNS(null, 'y', y);
		this.pos.x = x;
		this.pos.y = y;
	}
	
	getDrawableData() {return {type:"text", pos:this.pos, content:this.content};}
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
		
		this.svg = this.$svg[0];
		
		this.svg.setAttribute("viewBox", "0 0 " + (width || 100).toString() + ' ' + (height || 100).toString()); // can't use .attr for uppercase letters
		
		// select this svg
		if (activeSVG) {
			activeSVG.classList.remove("activeSVG");
		}
		activeSVG = this.svg;
		activeSVG.classList.add("activeSVG");
		activeSVG.classList.add(GlobalState.tool);
		active_mySVG = this;
		GlobalState.mySVGs.push(this);
		
		// -- all "myElement"s
		this.elements = {}; // id -> myElement
		this.points = []; // ids
		this.lines = []; // ids
		this.labels = []; // ids
		
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
		this.editingControl1; // bool
		this.editingControl2; // bool
		this.editingElement1; // curve id
		this.editingElement2; // curve id
		this.editingLabel = false;
		
		// -- create background
		this.$background = this.createBackground();
		
		// -- create SVG grouping elements
		this.lineGroup = $(document.createElementNS(xmlns, 'g')).appendTo(this.$svg).attr({id: 'lineGroup'})[0];
		this.pointGroup = $(document.createElementNS(xmlns, 'g')).appendTo(this.$svg).attr({id: 'pointGroup'})[0];
		this.labelGroup = $(document.createElementNS(xmlns, 'g')).appendTo(this.$svg).attr({id: 'labelGroup'})[0];
		this.guiGroup = $(document.createElementNS(xmlns, 'g')).appendTo(this.$svg).attr({id: 'guiGroup'})[0];
		
		// -- create tool gui svg elements
		this.$selectRectangle = this.createSelectionRectangle();
		this.stopSelectionInRectangle();
		this.controlPoint1;
		this.controlPoint2;
		this.controlPoint1Line;
		this.controlPoint2Line;
		this.createCurveGui();
		this.stopCurveEdit();
		this.shadowPoint;
		this.shadowLine;
		this.createShadowPointGui();
		
		// -- create Enriques base point
		let pt = BasePoint.new(this.elements, this.pointGroup, {x:20, y:80}, 6);
		this.basePoint = pt.id; // id
		this.points.push(pt.id);
		this.selectElement(this.basePoint);
		
		// -- create example diagram
		this.createExampleDiagram();
		
		this.hideToolGUI();
		
		// -- add mouse event listeners
		this.makeInteractive();
	}
	
	// ---- TOOLS
	
	makeInteractive() {
		// mouse events
		this.svg.addEventListener('mousedown', this.doOnClick.bind(this));
		this.svg.addEventListener('mousemove', this.doOnDrag.bind(this));
		this.svg.addEventListener('mouseup',  this.doOnEndDrag.bind(this));
		this.svg.addEventListener('mouseleave', this.doOnEndDrag.bind(this));
		this.svg.addEventListener('mouseover', this.doOnMouseOver.bind(this));
		// this.svg.addEventListener('mouseout', this.doOnMouseOver.bind(this));
		this.svg.addEventListener('dblclick', this.doOnDoubleClick.bind(this));
		
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
		// console.log("Click");
		if (evt.changedTouches) {
			evt = evt.changedTouches[0];
			this.mouseButtons = MouseButton.Left;
		} else {
			this.mouseButtons = evt.buttons;
		}
		this.mousePos = this.getMousePosition(evt);

		this.lastMousePos = this.mousePos;
		
		this.dragStartMousePos = this.mousePos;
		this.targetId = evt.target.id;
		this.targetElement = this.elements[this.targetId];
		// this.mouseButtons = evt.buttons;
		
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
			case Tool.Satellite:
				this.satelliteClick(evt);
				break;
			case Tool.CurveEdit:
				this.curveEditClick(evt);
				break;
			case Tool.Labeller:
				this.labellerClick(evt);
				break;
			default:
				break;
		}
	}
	
	doOnDrag(evt) {
		// console.log("Drag");
		evt.preventDefault();
		if (evt.changedTouches) { evt = evt.changedTouches[0]; }
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
			case Tool.Satellite:
				this.satelliteDrag(evt);
				break;
			case Tool.CurveEdit:
				this.curveEditDrag(evt);
				break;
			case Tool.Labeller:
				this.labellerDrag(evt);
				break;
			default:
				break;
		}
		
		this.lastMousePos = this.mousePos;
	}
	
	doOnEndDrag(evt) {
		// console.log("EndDrag");
		if (evt.changedTouches) { evt = evt.changedTouches[0]; }
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
			case Tool.Satellite:
				this.satelliteEndDrag(evt);
				break;
			case Tool.CurveEdit:
				this.curveEditEndDrag(evt);
				break;
			case Tool.Labeller:
				this.labellerEndDrag(evt);
				break;
			default:
				break;
		}
		
		this.mouseButtons = 0;
	}
	
	doOnMouseOver(evt) {
		// console.log("MouseOver");
		if (this.mouseButtons == 0) {
			this.mousePos = this.getMousePosition(evt);
			this.targetId = evt.target.id;
			this.targetElement = this.elements[this.targetId];
			//this.mouseButtons = evt.buttons;
			
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
				case Tool.Satellite:
					this.satelliteMouseOver(evt);
					break;
				case Tool.CurveEdit:
					this.curveEditMouseOver(evt);
					break;
				case Tool.Labeller:
					this.labellerMouseOver(evt);
					break;
				default:
					break;
			}
		}
	}
	
	doOnDoubleClick(evt) {
		// console.log("DoubleClick");
		// console.log(evt);

		if (evt.changedTouches) {
			evt = evt.changedTouches[0];
			// this.mouseButtons = MouseButton.Left;
		} else {
			// this.mouseButtons = evt.buttons;
		}
		this.mouseButtons = MouseButton.Left; // The dblclick event fires when a pointing device button (such as a mouse's primary button) is double-clicked
		
		this.mousePos = this.getMousePosition(evt);

		// this.lastMousePos = this.mousePos;
		
		// this.dragStartMousePos = this.mousePos;
		this.targetId = evt.target.id;
		this.targetElement = this.elements[this.targetId];
		// this.mouseButtons = evt.buttons;
		
		
		
		// -- act depending on tool
		switch (GlobalState.tool) {
			case Tool.Main:
				this.mainToolDoubleClick(evt);
				break;
			case Tool.Eraser:
				this.eraserDoubleClick(evt);
				break;
			case Tool.Select:
				this.selectDoubleClick(evt);
				break;
			case Tool.Free:
				this.freeDoubleClick(evt);
				break;
			case Tool.Satellite:
				this.satelliteDoubleClick(evt);
				break;
			case Tool.CurveEdit:
				this.curveEditDoubleClick(evt);
				break;
			case Tool.Labeller:
				this.labellerDoubleClick(evt);
				break;
			default:
				break;
		}
		
		this.mouseButtons = 0;
	}
	
	// -- main tool
	
	mainToolClick(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			if (this.targetId == 'background') {
				this.unselectAll();
				this.startSelectionInRectangle();
				this.stopCurveEdit();
				
			} else if (this.targetId == this.controlPoint1.id) {
				// this.selectElement(this.targetId);
				this.editingControl1 = true;
				this.editingControl2 = false;
			} else if (this.targetId == this.controlPoint2.id) {
				// this.selectElement(this.targetId);
				this.editingControl1 = false;
				this.editingControl2 = true;
			
			} else if (this.targetElement) {
				if (this.targetElement.type == ObjectTypes.Curve) {
					this.unselectAll();
					this.startCurveEdit(this.targetId);
					
				} else if (movableTypes.includes(this.targetElement.type)) {
					if (this.selected.length <= 1 || !this.selected.includes(this.targetId)) {
						this.unselectAll();
						this.selectElement(this.targetId);
						if (infinitelyClosePointTypes.includes(this.targetElement.type)) {
							this.startTangentEdit(this.targetId);
						} else {
							this.stopCurveEdit();
						}
					} else {
						this.stopCurveEdit();
					}
				} else {
					this.stopCurveEdit();
				}
			} else {
				this.stopCurveEdit();
			}
			
		} else if (this.mouseButtons & MouseButton.Right) {
			if (this.targetId == 'background') {
				this.unselectAll();
				this.startSelectionInRectangle();
			}
			// else if (this.targetElement && movablePointTypes.includes(this.targetElement.type)) {
			// 	this.toggleSelectElement(this.targetId);
			// }
			this.stopCurveEdit();
		}
	}
	
	mainToolDrag(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			if (this.selectingRectangle) {
				this.multipleSelectInRectangle();
			} else if (this.editingControl1 || this.editingControl2) {
				if (this.editingControl1) {
					this.editCurveControl1(this.editingElement1);
				} else if (this.editingControl2) {
					this.editCurveControl2(this.editingElement2);
				}
				
			} else if (this.selected.length > 0) {
				this.movingAnElement = true;
				this.moveSelectedBy(this.dx, this.dy);
				
				if (this.selected.length == 1) {
					let selectElement = this.elements[this.selected[0]];
					if (selectElement.type == ObjectTypes.LastSatellitePoint) {
						let tangent = normalized(this.elements[selectElement.curve].getTangentAt(1));
						let v = this.projectDirOnTangent(tangent, this.dx, this.dy);
						this.controlPoint1.moveBy(v.x, v.y);
						this.controlPoint1Line.position1 = selectElement.position;
						this.controlPoint1Line.position2 = this.controlPoint1.position;
						// this.controlPoint2.moveBy(v.x, v.y);
						// this.controlPoint2Line.position1 = this.elements[this.selected[0]].position;
						// this.controlPoint2Line.position2 = this.controlPoint2.position;
						
					} else {
						this.controlPoint1.moveBy(this.dx, this.dy);
						this.controlPoint1Line.position1 = selectElement.position;
						this.controlPoint1Line.position2 = this.controlPoint1.position;
						this.controlPoint2.moveBy(this.dx, this.dy);
						this.controlPoint2Line.position1 = selectElement.position;
						this.controlPoint2Line.position2 = this.controlPoint2.position;
					}
				}
			}
			
		} else if (this.mouseButtons & MouseButton.Right) {
			if (this.selectingRectangle) {
				this.multipleSelectInRectangle();
			}
		}
	}
	
	mainToolEndDrag(evt) {
		this.movingAnElement = false;
		if (this.mouseButtons & MouseButton.Left) {
			if (this.selectingRectangle) {
				this.stopSelectionInRectangle();
			}
			// else {
			//	// if (distance2(this.dragStartMousePos, this.mousePos) < EPS) {
			// 	if (this.targetElement && movablePointTypes.includes(this.targetElement.type)) {
			// 		if (this.selected.length >= 2) {
			// 			this.toggleSelectElement(this.targetId);
			// 		}
			// 	}
			// }
		} else if (this.mouseButtons & MouseButton.Right) {
			if (this.selectingRectangle) {
				this.stopSelectionInRectangle();
			} else if (!this.movingAnElement) {
				if (this.targetElement && movableTypes.includes(this.targetElement.type)) {
					this.toggleSelectElement(this.targetId);
				}
			}
		}
		
		this.editingControl1 = false;
		this.editingControl2 = false;
	}
	
	mainToolMouseOver(evt) {}
	
	mainToolDoubleClick(evt) {}
	
	// -- select
	
	selectClick(evt) {
		if (this.mouseButtons && (MouseButton.Left || MouseButton.Right)) {
			if (this.targetId == 'background') {
				// >> click on background
				this.unselectAll();
				this.startSelectionInRectangle();

			} else if (this.targetElement && movableTypes.includes(this.targetElement.type)) {
				// >> click on movable point
				this.toggleSelectElement(this.targetId);
			}
		}
	}
	
	selectDrag(evt) {
		if (this.mouseButtons && (MouseButton.Left || MouseButton.Right)) {
			if (this.selectingRectangle) {
				this.multipleSelectInRectangle();
			}
		}
	}
	
	selectEndDrag(evt) {
		this.stopSelectionInRectangle();
	}
	
	selectMouseOver(evt) {}
	
	selectDoubleClick(evt) {}
	
	// -- eraser
	
	eraserClick = this.erase;
	
	eraserDrag = this.erase;
	
	eraserEndDrag(evt) { this.unselectAll(); }
	
	eraserMouseOver(evt) { this.highlightDescendants(this.targetElement); }
	
	eraserDoubleClick(evt) {}
	
	// -- free
	
	freeClick(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			if (this.targetId == 'background' && this.selected.length == 1) {
				let pt = this.createFreePoint(this.selected[0], this.mousePos);
				this.unselectAll();
				this.selectElement(pt.id);
				// this.shadowLine.position1 = this.elements[this.selected[0]].position;
				
			} else if (this.targetElement && movablePointTypes.includes(this.targetElement.type)) {
				this.unselectAll();
				this.selectElement(this.targetId);
				
			} else {
				this.unselectAll();
			}
			
		} else if (this.mouseButtons & MouseButton.Right) {
			this.unselectAll();
		}
		
		if (this.selected.length == 1) {
			this.shadowPoint.position = this.mousePos;
			// this.shadowLine.position2 = this.mousePos;
		} else {
			this.shadowPoint.element.setAttributeNS(null, "visibility", "hidden");
			// this.shadowLine.element.setAttributeNS(null, "visibility", "hidden");
		}
	}
	
	freeDrag(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			// if (this.selected.length > 0) {
				// -- drag objects (if any)
				this.movingAnElement = true;
				this.moveSelectedBy(this.dx, this.dy);
			// } 
		}
		
		if (this.selected.length == 1) {
			this.shadowPoint.position = this.mousePos;
			// this.shadowLine.position2 = this.mousePos;
		}
	}
	
	freeEndDrag(evt) {
		this.movingAnElement = false;
	}
	
	freeMouseOver(evt) {
		if (this.targetId == 'background') {
			this.shadowPoint.element.setAttributeNS(null, "visibility", "visible");
		} else {
			this.shadowPoint.element.setAttributeNS(null, "visibility", "hidden");
		}
		
		if (this.targetId == 'background' && this.selected.length == 1  && movablePointTypes.includes(this.elements[this.selected[0]].type)) {
			this.shadowPoint.element.setAttributeNS(null, "visibility", "visible");
			// this.shadowLine.element.setAttributeNS(null, "visibility", "visible");
			// this.shadowLine.position1 = this.elements[this.selected[0]].position;
		} else {
			this.shadowPoint.element.setAttributeNS(null, "visibility", "hidden");
			// this.shadowLine.element.setAttributeNS(null, "visibility", "hidden");
		}
	}
	
	freeDoubleClick(evt) {}
	
	// -- satellite
	
	satelliteClick(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			if (this.targetId == 'background' && this.selected.length == 1 && infinitelyClosePointTypes.includes(this.elements[this.selected[0]].type)) {
				let pt = this.createSatellitePoint(this.selected[0], this.mousePos);
				this.unselectAll();
				this.selectElement(pt.id);
				this.shadowLine.position1 = this.elements[this.selected[0]].position;
				
			} else if (this.targetElement && infinitelyClosePointTypes.includes(this.targetElement.type)) {
				this.unselectAll();
				this.selectElement(this.targetId);
				
			} else {
				this.unselectAll();
			}
			
		} else if (this.mouseButtons & MouseButton.Right) {
			this.unselectAll();
		}
		
		if (this.selected.length == 1) {
			let projPos = this.projectPosOnNormal(this.selected[0], this.mousePos);
			this.shadowPoint.position = projPos;
			this.shadowLine.position2 = projPos;
		} else {
			this.shadowPoint.element.setAttributeNS(null, "visibility", "hidden");
			this.shadowLine.element.setAttributeNS(null, "visibility", "hidden");
		}
	}
	
	satelliteDrag(evt) {
		if (this.selected.length == 1 && !infinitelyClosePointTypes.includes(this.elements[this.selected[0]].type)) {
			this.unselectAll();
		}
		
		if (this.mouseButtons & MouseButton.Left) {
			this.movingAnElement = true;
			this.moveSelectedBy(this.dx, this.dy);	
			
		}
		
		if (this.selected.length == 1) {
			let projPos = this.projectPosOnNormal(this.selected[0], this.mousePos);
			this.shadowPoint.position = projPos;
			this.shadowLine.position2 = projPos;
		}
	}
	
	satelliteEndDrag(evt) {
		this.movingAnElement = false;
	}
	
	satelliteMouseOver(evt) {
		if (this.targetId == 'background' && this.selected.length == 1  && infinitelyClosePointTypes.includes(this.elements[this.selected[0]].type)) {
			this.shadowPoint.element.setAttributeNS(null, "visibility", "visible");
			this.shadowLine.element.setAttributeNS(null, "visibility", "visible");
			this.shadowLine.position1 = this.elements[this.selected[0]].position;
		} else {
			this.shadowPoint.element.setAttributeNS(null, "visibility", "hidden");
			this.shadowLine.element.setAttributeNS(null, "visibility", "hidden");
		}
	}
	
	satelliteDoubleClick(evt) {}
	
	// -- curveEdit
	
	curveEditClick(evt) {
		this.unselectAll();
		if (this.mouseButtons & MouseButton.Left) {
			if (this.targetId == 'background') {
				this.stopCurveEdit();
				// this.unselectAll();
			} else if (this.targetElement) {
				if (this.targetElement.type == ObjectTypes.Curve) {
					this.startCurveEdit(this.targetId);
					// this.unselectAll();
				} else if (this.targetElement && infinitelyClosePointTypes.includes(this.targetElement.type)) {
				// (this.targetElement.type == ObjectTypes.LastFreePoint) {
					this.startTangentEdit(this.targetId);
					// this.unselectAll();
				} else if (this.targetId == this.controlPoint1.id) {
					// this.unselectAll();
					// this.selectElement(this.targetId);
					this.editingControl1 = true;
					this.editingControl2 = false;
				} else if (this.targetId == this.controlPoint2.id) {
					// this.unselectAll();
					// this.selectElement(this.targetId);
					this.editingControl1 = false;
					this.editingControl2 = true;
				} else {
					this.stopCurveEdit();
				}
			} else {
				this.stopCurveEdit();
			}
		} else {
			this.stopCurveEdit();
		}
	}
	
	curveEditDrag(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			if (this.editingControl1) {
				this.editCurveControl1(this.editingElement1);
			} else if (this.editingControl2) {
				this.editCurveControl2(this.editingElement2);
			}
		}
	}
	
	curveEditEndDrag(evt) {
		this.editingControl1 = false;
		this.editingControl2 = false;
	}
	
	curveEditMouseOver(evt) {}
	
	curveEditDoubleClick(evt) {}
	
	// -- labeller
	
	labellerClick(evt) {
		if (this.editingLabel) {
			if (this.targetId == "labelInput") {
				
			} else {
				this.stopLabelEdit();
			}
		} else {
			this.unselectAll();
			if (this.mouseButtons & MouseButton.Left) {
				if (this.targetId == 'background') {
					let label = this.createLabel({x: this.mousePos.x - 4, y: this.mousePos.y + 5}, "W");
					this.selectElement(label.id);
					// $(label.id).ready(function(){ 
						this.startLabelEdit(label.id, false);
					//  }.bind(this));
					
				} else if (this.targetElement && (this.targetElement.type == ObjectTypes.Label)) {
					this.selectElement(this.targetId);
				}
			}
		}
	}
	
	labellerDrag(evt) {
		if (!this.editingLabel) {
			if (this.mouseButtons & MouseButton.Left) {
				this.movingAnElement = true;
				this.moveSelectedBy(this.dx, this.dy);
			}
		}
	}
	
	labellerEndDrag(evt) {
		if (this.movingAnElement) {
			this.unselectAll();
			this.movingAnElement = false;
		}
	}
	
	labellerMouseOver(evt) {}
	
	labellerDoubleClick(evt) {
		// console.log("labellerDoubleClick");
		// console.log(this.targetId);
		// console.log(this.targetElement);
		
		// this.unselectAll();
		if ((!this.editingLabel) && (this.targetElement.type == ObjectTypes.Label)) {
			this.startLabelEdit(this.targetId);
		}
	}
	
	// ---- FUNCTIONS
	
	// -- move
	
	moveSelectedBy(dx, dy) {
		// -- find selected points with no selected ancestors
		let topSelected = [];
		if (this.selected.includes(this.basePoint)) {
			topSelected = [this.basePoint];
			for (const id of this.selected) {
				const element = this.elements[id];
				if (element.type == ObjectTypes.Label) {
					// label can me moved immediately
					element.moveBy(dx, dy);
				}
			}
		} else {
			for (const id of this.selected) {
				const element = this.elements[id];
				if (element.type == ObjectTypes.Label) {
					// label can me moved immediately
					element.moveBy(dx, dy);
				} else {
					// points may have ancestors
					let ancestor = this.elements[element.base];
					while (true) {
						if (this.selected.includes(ancestor.id)) {
							break;
						}
						if (ancestor.id == this.basePoint) {
							topSelected.push(id);
							break;
						}
						ancestor = this.elements[ancestor.base];
					}
				}
			}
		}
		
		// -- move descendants of the previous points
		for (const id of topSelected) {
			const element = this.elements[id];
			if (movablePointTypes.includes(element.type)) {
				// this.movePointBy(element, dx, dy);
				this.moveDescendants(element, dx, dy);
			}
		}
	}
	
	movePointBy(element, dx, dy) {
		if (element.type == ObjectTypes.BasePoint) {
			this.moveBasePointBy(element, dx, dy);
		} else if (element.type == ObjectTypes.LastFreePoint) {
			this.moveLastFreePointBy(element, dx, dy);
		} else if (element.type == ObjectTypes.LastSatellitePoint) {
			this.moveLastSatellitePointBy(element, dx, dy);
		}
		// else {
		// 	element.moveBy(dx, dy);
		// }
	}
	
	moveDescendants(element, dx, dy) {
		// this.descendants = [];
		let queue = [element.id];
		while (queue.length > 0) {
			let descendant = this.elements[queue.shift()];
			
			if (unconstrainedPointTypes.includes(descendant.type)) {
				if (!this.descendants.includes(descendant)) {
					// this.descendants.push(descendant.id);
					this.movePointBy(descendant, dx, dy);
				}
				// -- add children of descendant to queue
				queue = queue.concat(descendant.children);
			} else if (descendant.type == ObjectTypes.LastSatellitePoint) {
				let v = this.moveLastSatellitePointBy(descendant, dx, dy);
				for (const id of descendant.children) {
					let child = this.elements[id];
					this.moveDescendants(child, v.x, v.y);
				}
			}
		}
		// for (const id of this.descendants) {
		// 	this.movePointBy(this.elements[id], dx, dy);
		// }
	}
	
	rotatePosToNewTangent(originalPos, centerOfRotation, newTangent) {
		let dist = distance(centerOfRotation, originalPos);
		return {
			x: centerOfRotation.x + newTangent.x*dist,
			y: centerOfRotation.y + newTangent.y*dist
		};
	}
	
	rotatePosToNewNormal(originalPos, centerOfRotation, oldNormal, oldTangent, newTangent) {
		let dist = distance(centerOfRotation, originalPos);
		let sign = Math.sign((oldNormal.x)*(oldTangent.y) + (oldNormal.y)*(-oldTangent.x));
		return {
			x: centerOfRotation.x + newTangent.y * dist * sign,
			y: centerOfRotation.y - newTangent.x * dist * sign
		};
	}
	
	rotatePosAround(originalPos, centerOfRotation, angle) {
		let v = rotate({x: originalPos.x-centerOfRotation.x,
			y:originalPos.y-centerOfRotation.y}, angle);
		return {
			x: centerOfRotation.x + v.x,
			y: centerOfRotation.y + v.y
		};
	}
	
	rotateDescendants(element, centerOfRotation, oldTangent, newTangent) {
		let oldNormal = {
			x: element.position.x - centerOfRotation.x,
			y: element.position.y - centerOfRotation.y
		};
		let curve = this.elements[element.curve];
		// console.log(element.position, centerOfRotation, oldNormal, newTangent);
		// let oldPos = element.position;
		// element.position = this.rotatePosToNewNormal(element.position, centerOfRotation, oldNormal, oldTangent, newTangent);
		// curve.position2 = element.position;
		
		let dot = oldTangent.x*newTangent.x+oldTangent.y*newTangent.y;
		let angle = (Math.abs(dot) >= 1)? 0 : Math.acos(dot);
		let sign = Math.sign(newTangent.x * oldTangent.y + newTangent.y * (-oldTangent.x));
		angle *= sign;
		
		// element.position = this.rotatePosAround(element.position, centerOfRotation, angle);
		// curve.position2 = this.rotatePosAround(curve.position2, centerOfRotation, angle);
		
		// for (const id of element.children) {
		// 	let child = this.elements[id];
		// 	let curve = this.elements[child.curve];
		// 	child.position = this.rotatePosAround(child.position, centerOfRotation, angle);
		// 	curve.position1 = this.rotatePosAround(curve.position1, centerOfRotation, angle);
		// 	curve.position2 = this.rotatePosAround(curve.position2, centerOfRotation, angle);
		// 	if (child.type == ObjectTypes.LastFreePoint) {
		// 		curve.positionC1 = this.rotatePosAround(curve.positionC1, centerOfRotation, angle);
		// 		curve.positionC2 = this.rotatePosAround(curve.positionC2, centerOfRotation, angle);
		// 	}
		// }
		
		let queue = [element.id];
		while (queue.length > 0) {
			let descendant = this.elements[queue.shift()];
			let curve = this.elements[descendant.curve];
			
			descendant.position = this.rotatePosAround(descendant.position, centerOfRotation, angle);
			curve.position1 = this.rotatePosAround(curve.position1, centerOfRotation, angle);
			curve.position2 = this.rotatePosAround(curve.position2, centerOfRotation, angle);
			if (descendant.type == ObjectTypes.LastFreePoint) {
				curve.positionC1 = this.rotatePosAround(curve.positionC1, centerOfRotation, angle);
				curve.positionC2 = this.rotatePosAround(curve.positionC2, centerOfRotation, angle);
			}
			// -- add children of descendant to queue
			queue = queue.concat(descendant.children);
		}
	}
	
	moveBasePointBy(element, dx, dy) {
		element.moveBy(dx, dy);
		for (const childId of element.children) {
			let child = this.elements[childId];
			let line = this.elements[child.curve];
			line.position1 = element.position;
			if (child.type == ObjectTypes.LastFreePoint) {
				line.moveC1By(dx, dy);
			}
		}
	}
	
	moveLastFreePointBy(element, dx, dy) {
		element.moveBy(dx, dy);
		let line = this.elements[element.curve];
		line.position2 = element.position;
		line.moveC2By(dx, dy);
		for (const childId of element.children) {
			let child = this.elements[childId];
			line = this.elements[child.curve];
			line.position1 = element.position;
			if (child.type == ObjectTypes.LastFreePoint) {
				line.moveC1By(dx, dy);
			}
			// this.moveBy(x-this.pos.x, y-this.pos.y);
		}
	}
	
	moveLastSatellitePointBy(element, dx, dy) {
		element.moveBy(dx, dy);
		let pos = this.projectPosOnNormal(element.base, element.position);
		let v = {
			x: dx + (pos.x - element.position.x),
			y: dy + (pos.y - element.position.y)
		}
		element.moveTo(pos.x, pos.y);
		// element.moveBy(v.x, v.y);
		let line = this.elements[element.curve];
		line.position2 = element.position;
		for (const childId of element.children) {
			let child = this.elements[childId];
			line = this.elements[child.curve];
			line.position1 = element.position;
			if (child.type == ObjectTypes.LastFreePoint) {
				line.moveC1By(v.x, v.y);
			}
			// this.moveBy(x-this.pos.x, y-this.pos.y);
		}
		return v;
	}
	
	// -- erase
	
	erase(evt) {
		if (this.mouseButtons & MouseButton.Left) {
			if (this.targetElement && deletablePointTypes.includes(this.targetElement.type)) {
				// evt.target.classList.contains('draggable')
				this.erasePointAndDescendants(this.targetElement);
			}  else if (this.targetElement.type == ObjectTypes.Label) {
				this.eraseLabel(this.targetElement);
			} else {
				this.unselectAll();
			}
		}
	}
	
	eraseLabel(element) {
		this.descendants = [];
		this.unselectAll();
		// -- remove from SVG
		element.element.remove();
		// -- remove from mySVG
		this.labels = this.labels.filter(elt => elt !== element.id);
		delete this.elements[element.id];
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
			
			let line = this.elements[descendant.curve];
			// -- remove from SVG
			line.element.remove();
			// -- clear links to other points
			line.point1 = null;
			line.point2 = null;
			
			// -- remove from mySVG
			this.lines = this.lines.filter(elt => elt !== line.id);
			this.points = this.points.filter(elt => elt !== descendant.id);
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
				let line = this.elements[descendant.curve];
				line.element.classList.remove("highlight");
			}
		}
		this.descendants = [];
		
		if (element) {
			if (deletablePointTypes.includes(element.type)) {
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
						let line = this.elements[descendant.curve];
						line.element.classList.add("highlight");
					}
				}
			} else if (element.type == ObjectTypes.Label) {
				element.element.classList.add("highlight");
				this.descendants = [element.id];
			}
		}
	}
	
	highlightCancel() {
		// -- remove highlights, clear this.descendants
		for (const id of this.descendants) {
			let descendant = this.elements[id];
			descendant.element.classList.remove("highlight");
			// -- remove highlight from incoming line
			if (lastPointTypes.includes(descendant.type)) {
				let line = this.elements[descendant.curve];
				line.element.classList.remove("highlight");
			}
		}
		this.descendants = [];
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
		for (const id of this.selected) {
			const element = this.elements[id].element;
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
			if (movableTypes.includes(element.type) &&
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
	
	// -- edit curve
	
	startCurveEdit(id) {
		this.editingControl1 = false;
		this.editingControl2 = false;
		this.editingElement1 = id;
		this.editingElement2 = id;
		
		var curve1 = this.elements[this.editingElement1];
		this.controlPoint1.position = curve1.positionC1;
		this.controlPoint1Line.position1 = curve1.position1;
		this.controlPoint1Line.position2 = curve1.positionC1;
		this.controlPoint1.element.setAttributeNS(null, "visibility", "visible");
		this.controlPoint1Line.element.setAttributeNS(null, "visibility", "visible");
		
		var curve2 = this.elements[this.editingElement2];
		this.controlPoint2.position = curve2.positionC2;
		this.controlPoint2Line.position1 = curve2.position2;
		this.controlPoint2Line.position2 = curve2.positionC2;
		this.controlPoint2.element.setAttributeNS(null, "visibility", "visible");
		this.controlPoint2Line.element.setAttributeNS(null, "visibility", "visible");
	}
	
	startTangentEdit(id) {
		this.editingControl1 = false;
		this.editingControl2 = false;
		let point = this.elements[id];
		
		if (point.type == ObjectTypes.LastFreePoint) {
			this.editingElement2 = point.curve;
			var curve2 = this.elements[this.editingElement2];
			this.controlPoint2.position = curve2.positionC2;
			this.controlPoint2Line.position1 = curve2.position2;
			this.controlPoint2Line.position2 = curve2.positionC2;
			this.controlPoint2.element.setAttributeNS(null, "visibility", "visible");
			this.controlPoint2Line.element.setAttributeNS(null, "visibility", "visible");
		} else {
			this.controlPoint2.element.setAttributeNS(null, "visibility", "hidden");
			this.controlPoint2Line.element.setAttributeNS(null, "visibility", "hidden");
		}
		
		let freeChildren = point.children.reduce(function(arr, id) {
			if (this.elements[id].type == ObjectTypes.LastFreePoint) {
				arr.push(id);
			}
			return arr;
		}.bind(this), []);
		
		if (freeChildren.length == 1) { // point.children.length == 1
			let child = this.elements[freeChildren[0]]; //[point.children[0]];
			if (child.type == ObjectTypes.LastFreePoint) {
				this.editingElement1 = child.curve;
				var curve1 = this.elements[this.editingElement1];
				this.controlPoint1.position = curve1.positionC1;
				this.controlPoint1Line.position1 = curve1.position1;
				this.controlPoint1Line.position2 = curve1.positionC1;
				this.controlPoint1.element.setAttributeNS(null, "visibility", "visible");
				this.controlPoint1Line.element.setAttributeNS(null, "visibility", "visible");
			} else {
				this.controlPoint1.element.setAttributeNS(null, "visibility", "hidden");
				this.controlPoint1Line.element.setAttributeNS(null, "visibility", "hidden");
			}
		} else {
			this.controlPoint1.element.setAttributeNS(null, "visibility", "hidden");
			this.controlPoint1Line.element.setAttributeNS(null, "visibility", "hidden");
		}
	}
	
	stopCurveEdit() {
		this.editingElement1 = null;
		this.editingElement2 = null;
		this.editingControl1 = false;
		this.editingControl2 = false;
		this.controlPoint1.element.setAttributeNS(null, "visibility", "hidden");
		this.controlPoint2.element.setAttributeNS(null, "visibility", "hidden");
		this.controlPoint1Line.element.setAttributeNS(null, "visibility", "hidden");
		this.controlPoint2Line.element.setAttributeNS(null, "visibility", "hidden");
	}
	
	editCurveControl1(id) {
		let element = this.elements[id];
		let firstPoint = this.elements[element.point1];
		let oldTangent = normalized(element.getTangentAt(0));
		// -- edit control 1 of the curve
		if (unconstrainedPointTypes.includes(firstPoint.type)) {
			this.controlPoint1.moveBy(this.dx, this.dy);
		} else if (firstPoint.type == ObjectTypes.LastSatellitePoint) {
			let v = this.projectDirOnTangent(oldTangent, this.dx, this.dy);
			this.controlPoint1.moveBy(v.x, v.y);
		}
		this.controlPoint1Line.position2 = this.controlPoint1.position;
		element.positionC1 = this.controlPoint1.position;
		let tangent = normalized(element.getTangentAt(0));
		
		if (firstPoint.type == ObjectTypes.LastFreePoint) {
			let curve = this.elements[firstPoint.curve];
			// -- edit direction of tangent 2 of previous curve
			let tangentLength = distance(curve.position2, curve.positionC2);
			curve.positionC2 = {
				x: curve.position2.x - tangent.x*tangentLength,
				y: curve.position2.y - tangent.y*tangentLength
			};
			// -- edit direction of tangent 1 of sibling curves
			for (const childId of firstPoint.children) {
				if (childId != element.point2) {
					let child = this.elements[childId];
					let curve = this.elements[child.curve];
					if (child.type == ObjectTypes.LastFreePoint) {
						let tangentLength = distance(curve.position1, curve.positionC1);
						curve.positionC1 = {
							x: curve.position1.x + tangent.x*tangentLength,
							y: curve.position1.y + tangent.y*tangentLength
						};
					} else if (child.type == ObjectTypes.LastSatellitePoint) {
						this.rotateDescendants(child, firstPoint.position, oldTangent, tangent);
					}
				}
			}
		}
		
		// -- update control 2
		if (this.editingElement2) {
			var curve2 = this.elements[this.editingElement2];
			this.controlPoint2.position = curve2.positionC2;
			// this.controlPoint2Line.position1 = curve2.position2;
			this.controlPoint2Line.position2 = curve2.positionC2;
		}
	}
	
	editCurveControl2(id) {
		let element = this.elements[id];
		let oldTangent = normalized(element.getTangentAt(1));
		// -- edit control 2 of the curve
		this.controlPoint2.moveBy(this.dx, this.dy);
		this.controlPoint2Line.position2 = this.controlPoint2.position;
		element.positionC2 = this.controlPoint2.position;
		// -- edit direction of tangent 1 of child curves
		let tangent = normalized(element.getTangentAt(1));
		let lastPoint = this.elements[element.point2];
		for (const childId of lastPoint.children) {
			let child = this.elements[childId];
			let curve = this.elements[child.curve];
			if (child.type == ObjectTypes.LastFreePoint) {
				curve.positionC1 = this.rotatePosToNewTangent(curve.positionC1, lastPoint.position, tangent);
			} else if (child.type == ObjectTypes.LastSatellitePoint) {
				this.rotateDescendants(child, lastPoint.position, oldTangent, tangent);
			}
		}
		
		// -- update control 1
		if (this.editingElement1) {
			var curve1 = this.elements[this.editingElement1];
			this.controlPoint1.position = curve1.positionC1;
			// this.controlPoint1Line.position1 = curve1.position1;
			this.controlPoint1Line.position2 = curve1.positionC1;
		}
	}
	
	// -- edit label content
	
	startLabelEdit(id, keepLabelValue=true) {
		console.log("startLabelEdit");
		
		this.unselectAll();
		this.selectElement(id);
		this.editingLabel = true;
		const label = this.elements[id];
		label.element.classList.add("hidden-label");
		
		var boundingBox = label.element.getBBox();
		console.log('XxY', boundingBox.x + 'x' + boundingBox.y);
		console.log('size', boundingBox.width + 'x' + boundingBox.height);
		
		// <foreignObject> to contain <input> (and <span>)
		let foreigner = document.createElementNS(xmlns, "foreignObject");
		foreigner.setAttribute("id", "foreigner");
		foreigner.setAttributeNS(null, "x", boundingBox.x);
		foreigner.setAttributeNS(null, "y", boundingBox.y-1);
		foreigner.setAttributeNS(null, "width", boundingBox.width);
		foreigner.setAttributeNS(null, "height", boundingBox.height);
		foreigner.setAttributeNS(null, "overflow", "visible");
		// foreigner.setAttributeNS(null, "display", "flex");
		// foreigner.setAttributeNS(null, "flex-wrap", "wrap");
		// console.log(foreigner);
		this.guiGroup.appendChild(foreigner);
		
		// hidden <span> to measure length of <input> text
		let span = document.createElement('span');
		span.setAttribute("id", "labelHiddenSpan");
		foreigner.appendChild(span);
		
		console.log("HERE");
		console.log(label);
		console.log(label.content);
		
		// <input>
		let labelInput = document.createElement('input');
		labelInput.setAttribute("id", "labelInput");
		labelInput.setAttribute("type", "text");
		if (keepLabelValue) {
			labelInput.setAttribute("value", label.content);
		} else {
			labelInput.setAttribute("value", "");
		}
		labelInput.setAttribute("size", "1");
		// labelInput.setAttributeNS(null, "resize", "both");
		// foreigner.setAttributeNS(null, "min-width", "0");
		// labelInput.setAttribute("style", "box-sizing: border-box; max-width: none; width: 100%;");
		foreigner.appendChild(labelInput);
		// labelInput.addEventListener('change', "function(){this.setAttribute().attr('width', $(this).val().length);}" );
		// labelInput.setAttribute("oninput", "console.log(this);$(this).attr('style', 'box-sizing: border-box; min-width: 1em; width: '+($(this).val().length+1)+'em');");
		// labelInput.setAttribute('tabindex', '0');
		// $("#labelInput").ready(function(){ 
		// 	labelInput.focus();
		// });
		setTimeout(function(){ labelInput.focus(); labelInput.selectionStart = labelInput.selectionEnd = 10000; }, 0);
		// (this.selected.length == 1 && this.elements[this.selected[0]].type == ObjectTypes.Label)
		
		$('#labelHiddenSpan').text($('#labelInput').val());
		$('#labelInput').width($('#labelHiddenSpan').width()+2);
		$('#labelInput').on('input', function() {
			$('#labelHiddenSpan').text($('#labelInput').val());
			$('#labelInput').width($('#labelHiddenSpan').width()+2);
		});
		// $(function() {
		// 	$('#labelHiddenSpan').text($('#labelInput').val());
		// 	$('#labelInput').width($('#labelHiddenSpan').width());
		// }).on('input', function() {
		// 	$('#labelHiddenSpan').text($('#labelInput').val());
		// 	$('#labelInput').width($('#labelHiddenSpan').width()+2);
		// });
	}
	
	stopLabelEdit() {
		console.log("stopLabelEdit");
		console.log(this.selected);
		if (this.editingLabel) {
			const element = this.elements[this.selected[0]];
			element.element.classList.remove("hidden-label");
			element.content = $("#labelInput").val();
			console.log(element.contentStr);
			if (element.content.length == 0) { this.eraseLabel(element); }
			$("#foreigner").remove();
			this.unselectAll();
			this.editingLabel = false;
		}
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
			class: 'selectRectangle gui',
			id: 'selectRectangle',
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			visibility: "visible"
		}).appendTo($(this.guiGroup)); //width: this.$svg.attr('width'), height: this.$svg.attr('height')
		return $rect;
	};
	
	createCurveGui() {
		let l;
		
		l = Line.new({}, this.guiGroup, {x:20, y:30}, {x:50, y:10});
		l.element.classList.add("gui");
		l.id = "controlPoint1Line";
		l.element.id = l.id;
		this.elements[l.id] = l;
		this.controlPoint1Line = l;
		
		l = Line.new({}, this.guiGroup, {x:10, y:10}, {x:40, y:30});
		l.element.classList.add("gui");
		l.id = "controlPoint2Line";
		l.element.id = l.id;
		this.elements[l.id] = l;
		this.controlPoint2Line = l;
		
		Line.instanceNumber -= 2;
		
		let pt;
		
		pt = Point.new({}, this.guiGroup, {x:50, y:10}, 2);
		pt.element.classList.add("gui");
		pt.id = "controlPoint1";
		pt.element.id = pt.id;
		this.elements[pt.id] = pt;
		this.controlPoint1 = pt;
		
		pt = Point.new({}, this.guiGroup, {x:10, y:10}, 2);
		pt.element.classList.add("gui");
		pt.id = "controlPoint2";
		pt.element.id = pt.id;
		this.elements[pt.id] = pt;
		this.controlPoint2 = pt;
		
		Point.instanceNumber -= 2;
	};
	
	createShadowPointGui() {
		let l = Line.new({}, this.guiGroup, {x:20, y:30}, {x:50, y:10});
		l.element.classList.add("gui");
		l.id = "shadowLine";
		l.element.id = l.id;
		this.elements[l.id] = l;
		this.shadowLine = l;
		
		Line.instanceNumber -= 1;
		
		let pt = Point.new({}, this.guiGroup, {x:10, y:10}, 4);
		pt.element.classList.add("gui");
		pt.id = "shadowPoint";
		pt.element.id = pt.id;
		this.elements[pt.id] = pt;
		this.shadowPoint = pt;
		
		Point.instanceNumber -= 1;
	}
	
	createFreePoint(parentId, pos) {
		let pt;
		let parent = this.elements[parentId];
		
		// -- create free point connected to parent
		let startTangent, endTangent;
		let d = distance(parent.pos, pos);
		if (parentId == this.basePoint) {
			let s = Math.sign(pos.y-parent.pos.y);
			startTangent = {x: 0, y: s};// d/3*s};
			// endTangent = rotate(startTangent, Math.PI/2*s);
		} else if (infinitelyClosePointTypes.includes(parent.type)) {
			startTangent = this.elements[parent.curve].getTangentAt(1);
		}
		startTangent = normalized(startTangent);
		
		let n = directionFromTo(parent.position, pos);
		n = {x: n.y, y: -n.x};
		endTangent = {
			x: -(parent.position.x + startTangent.x*d*1/2 - pos.x)/4,
			y:  -(parent.position.y + startTangent.y*d*1/2 - pos.y)/4
		};
		startTangent = {x: startTangent.x*d/2, y: startTangent.y*d/2};
		
		// startTangent = normalized(startTangent);
		// let n = directionFromTo(parent.position, pos);
		// n = {x: n.y, y: -n.x};
		// let start_dot_n = startTangent.x * n.x + startTangent.y * n.y;
		// let c = 3 - Math.abs(start_dot_n);
		// startTangent = {x: startTangent.x*d/c, y: startTangent.y*d/c};
		// start_dot_n = start_dot_n*d/c;
		// endTangent = {
		// 	x: startTangent.x - 2*start_dot_n*n.x,
		// 	y: startTangent.y - 2*start_dot_n*n.y,
		// };
		
		// let dp = normalized(directionFromTo(parent.position, pos));
		// let n = {x: dp.y, y: -dp.x};
		// let start_dot_n = startTangent.x * n.x + startTangent.y * n.y;
		// let start_dot_dp = startTangent.x * dp.x + startTangent.y * dp.y;
		// let c = 3 - Math.abs(start_dot_n);
		// startTangent = {x: startTangent.x*d/3, y: startTangent.y*d/3};
		// // start_dot_n = start_dot_n*d/3;
		// let f = (0.5 + 0.5*start_dot_dp);
		// // if (start_dot_dp > 0) {
		// // 	endTangent = {
		// // 		x: startTangent.x - 2*start_dot_n*n.x,
		// // 		y: startTangent.y - 2*start_dot_n*n.y
		// // 	};
		// // } else {
		// // 	endTangent = {
		// // 		x: -startTangent.x*(1-2*start_dot_dp),
		// // 		y: -startTangent.y*(1-2*start_dot_dp)
		// // 	}
		// // }
		// let angle = (Math.abs(start_dot_dp) >= 1)? 0 : Math.acos(start_dot_dp);
		// endTangent = {
		// 	x: startTangent.x*(start_dot_dp-0.5) + d/3* dp.x * (1-(start_dot_dp-0.5)),
		// 	y: startTangent.y*(start_dot_dp-0.5) + d/3* dp.y * (1-(start_dot_dp-0.5))
		// };
		
	
		pt = LastFreePoint.new(this.elements, this.lineGroup, this.pointGroup, parent, pos, 4, startTangent, endTangent);
		this.points.push(pt.id);
		this.lines.push(pt.curve);
		
		return pt;
	}
	
	createSatellitePoint(parentId, pos) {
		let pt;
		let parent = this.elements[parentId];
		
		let projPos = this.projectPosOnNormal(parentId, pos);
		
		// -- create satellite point connected to parent
		pt = LastSatellitePoint.new(this.elements, this.lineGroup, this.pointGroup, parent, projPos, 4);
		this.points.push(pt.id);
		this.lines.push(pt.curve);
		
		return pt;
	}
	
	createLabel(pos, content) {
		let label = Label.new(this.elements, this.labelGroup, pos, content);
		this.labels.push(label.id);
		return label;
	}
	
	projectPosOnNormal(parentId, pos) {
		let parent = this.elements[parentId];
		let tangent = this.elements[parent.curve].getTangentAt(1);
		tangent = normalized(tangent);
		let n = {x: tangent.y, y: -tangent.x};
		let proj = (pos.x-parent.position.x) * n.x +
					(pos.y-parent.position.y) * n.y;
		let projPos = {
			x: parent.position.x + proj * n.x,
			y: parent.position.y + proj * n.y
		};
		return projPos;
	}
	
	projectDirOnTangent(tangent, dx, dy) {
		let proj = dx * tangent.x + dy * tangent.y;
		let v = {
			x: proj * tangent.x,
			y: proj * tangent.y
		};
		return v;
	}
	
	createExampleDiagram() {
		let pt = this.createFreePoint(this.basePoint, {x: 34, y: 43});
		pt = this.createFreePoint(pt.id, {x: 60, y: 22});
		let pt4 = this.createFreePoint(pt.id, {x: 98, y: 13});
		let pt5 = this.createSatellitePoint(pt4.id, {x: 97, y: 38});
		pt5 = this.createSatellitePoint(pt5.id, {x: 128, y: 40});
		pt = this.createFreePoint(pt5.id, {x: 160, y: 15});
		pt = this.createFreePoint(pt5.id, {x: 173, y: 31});
		
		pt = this.createSatellitePoint(pt4.id, {x: 98, y: 65});
		pt = this.createFreePoint(pt.id, {x: 127, y: 86});
		pt = this.createSatellitePoint(pt.id, {x: 130, y: 61});
		pt = this.createSatellitePoint(pt.id, {x: 157, y: 64});
		
		this.createLabel({x:28, y:85}, "12");
		this.createLabel({x:38, y:57}, "12");
		this.createLabel({x:60, y:38}, "12");
		this.createLabel({x:102, y:15}, "6");
		this.createLabel({x:102, y:34}, "4");
		this.createLabel({x:124, y:30}, "2");
		this.createLabel({x:165, y:18}, "1");
		this.createLabel({x:178, y:35}, "1");
		this.createLabel({x:102, y:70}, "2");
		this.createLabel({x:132, y:93}, "2");
		this.createLabel({x:132, y:57}, "1");
		this.createLabel({x:162, y:70}, "1");
	}
	
	hideToolGUI() {
		// this.movingAnElement = false;
		// this.unselectAll();
		this.stopSelectionInRectangle();
		this.stopCurveEdit();
		this.shadowPoint.element.setAttributeNS(null, "visibility", "hidden");
		this.shadowLine.element.setAttributeNS(null, "visibility", "hidden");
	}
	
	// -- get mouse position in SVG coordinates
	getMousePosition(evt) {
		var CTM = this.svg.getScreenCTM(); // Current Transformation Matrix
		// if (evt.changedTouches) { evt = evt.changedTouches[0]; }
		// Invert the SVG->screen transformation
		return {
			x: (evt.clientX - CTM.e) / CTM.a,
			y: (evt.clientY - CTM.f) / CTM.d
		};
	}
	
	// --
	getDrawableShapes() {
		let shapes = [];
		const drawableElement = this.points.concat(this.lines);
		for (const id of drawableElement) {
			const element = this.elements[id];
			shapes.push(element.getDrawableData());
		}
		return shapes;
	}
}



