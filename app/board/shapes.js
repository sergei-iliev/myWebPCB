var core=require('core/core');
var utilities =require('core/utilities');
var Shape=require('core/shapes').Shape;
var ResizeableShape=require('core/core').ResizeableShape;
var glyph=require('core/text/d2glyph');
var font=require('core/text/d2font');
var Circle =require('pads/shapes').Circle;
var Arc =require('pads/shapes').Arc;
var Pad =require('pads/shapes').Pad;
var Line =require('pads/shapes').Line;
var RoundRect =require('pads/shapes').RoundRect;
var SolidRegion =require('pads/shapes').SolidRegion;
var GlyphLabel=require('pads/shapes').GlyphLabel;
var AbstractLine=require('core/shapes').AbstractLine;
var FootprintShapeFactory=require('pads/shapes').FootprintShapeFactory;
var d2=require('d2/d2');


class BoardShapeFactory{
	
	createShape(data){
		if (data.tagName.toLowerCase() == 'footprint') {
			var footprint = new PCBFootprint(0, 0, 0, 0,0,0);
			footprint.fromXML(data);
			return footprint;
		}
		if (data.tagName.toLowerCase() == 'via') {
			var via = new PCBVia(0, 0, 0, 0,0,0);
			via.fromXML(data);
			return via;
		}		
		if (data.tagName.toLowerCase() == 'circle') {
			var circle = new PCBCircle(0, 0, 0, 0, 0);
			circle.fromXML(data);
			return circle;
		}
		if (data.tagName.toLowerCase() == 'ellipse') {
			var circle = new Circle(0, 0, 0, 0, 0);
			circle.fromXML(data);
			return circle;
		}
		if (data.tagName.toLowerCase() == 'line') {
			var line = new PCBLine( 0, 0, 0, 0, 0);
			line.fromXML(data);
			return line;
		}
		if (data.tagName.toLowerCase() == 'copperarea') {
			var area = new PCBCopperArea( 0, 0, 0, 0, 0);
			area.fromXML(data);
			return area;
		}
		if (data.tagName.toLowerCase() == 'track') {
		    var track = new PCBTrack(0, 0, 0, 0, 0);
		    track.fromXML(data);
		    return track;
	    }		
		if (data.tagName.toLowerCase() == 'hole') {
			var hole = new PCBHole(0, 0, 0, 0, 0);
			hole.fromXML(data);
			return hole;
		}
		if (data.tagName.toLowerCase() == 'label') {
			var label = new PCBLabel(0, 0, 0);
			label.fromXML(data);		
			return label;
		}
		return null;
	}
}

class PCBFootprint extends Shape{
constructor(layermaskId){
		super(0,0,0,0,0,layermaskId);
		this.displayName = "Footprint";
   	    this.shapes=[];
		this.text = new core.ChipText();
	    this.text.Add(new glyph.GlyphTexture("","reference", 0, 0,  core.MM_TO_COORD(1.2)));
	    this.text.Add(new glyph.GlyphTexture("","value", 8,8,core.MM_TO_COORD(1.2)));		 	    
        this.units=core.Units.MM;
        this.value=2.54;  
        this.rotate=0;
	}
clone(){
        var copy=new PCBFootprint(this.copper.getLayerMaskID());
        copy.text =this.text.clone();
        copy.shapes=[];
        copy.rotate=this.rotate;
        copy.units=this.units;
        copy.value=this.value;
        copy.displayName=this.displayName;
        this.shapes.forEach(function(shape){ 
          copy.add(shape.clone());  
        });
        return copy;        
    }
add(shape){
    if (shape == null)
          return;   
    this.shapes.push(shape);  
} 
getChipText() {
    return this.text;
}
getSide(){
    return core.Layer.Side.resolve(this.copper.getLayerMaskID());       
}
clear() {    
	this.shapes.forEach(function(shape) {
		  shape.owningUnit=null;
		  shape.clear();
		  shape=null;
     });
     this.shapes=[];	
     this.text.Clear();
}
getOrderWeight() {
   var r=this.getBoundingShape();
   return (r.width);
}
isClicked(x,y){
	var r=this.getBoundingShape();
	if(!r.contains(x,y)){
		return false;
	}
	let ps=new d2.Polygon();
	var result= this.shapes.some(function(shape) {
	   if(!(shape instanceof Line)){ 
		return shape.isClicked(x,y);
	   }else{
		ps.points.push(...shape.vertices);  //line vertices   
		return false;
	   }
	});		
	if(result){
		return true;//click on a anything but a Line
	}
	
	this.sortPolygon(ps.points);  //line only
	return ps.contains(x,y);
}
getPolygonCentroid(points){
	let x=0,y=0;
	points.forEach(p=>{
		x+=p.x;
		y+=p.y;
	});
	return new d2.Point(x/points.length,y/points.length);
}
sortPolygon(points){
	let center=this.getPolygonCentroid(points);
	
	points.sort((a,b)=>{
	 let a1=(utilities.degrees(Math.atan2(a.x-center.x,a.y-center.y))+360)%360;
	 let a2=(utilities.degrees(Math.atan2(b.x-center.x,b.y-center.y))+360)%360;
	 return (a1-a2);
	});
}

setSelected (selection) {
	super.setSelected(selection);
	this.shapes.forEach(function(shape) {		  
		  shape.setSelected(selection);
   });	
}
calculateShape() {
	var r = new d2.Box(0,0,0,0);
 	var x1 = Number.MAX_VALUE; 
 	var y1 = Number.MAX_VALUE;
 	var x2 = Number.MIN_VALUE;
 	var y2 = Number.MIN_VALUE;
 	
 	
    //***empty schematic,element,package
    if (this.shapes.length == 0) {
        return r;
    }

    var len=this.shapes.length;
	    for(var i=0;i<len;i++){
        var tmp = this.shapes[i].getBoundingShape();
        if (tmp != null) {
            x1 = Math.min(x1, tmp.x);
            y1 = Math.min(y1, tmp.y);
            x2 = Math.max(x2, tmp.x+tmp.width);
            y2 = Math.max(y2, tmp.y+tmp.height);
        }
        
    }
    r.setRect(x1, y1, x2 - x1, y2 - y1);
    return r;
}	
Move(xoffset,yoffset){
	   var len=this.shapes.length;
	   for(var i=0;i<len;i++){
		   this.shapes[i].Move(xoffset,yoffset);  
	   }	
	   this.text.Move(xoffset,yoffset);
}
setRotation(rotate){
	let alpha=rotate-this.rotate;
	let center=this.getBoundingShape().center;
	let len=this.shapes.length;
	for(var i=0;i<len;i++){
		
	   this.shapes[i].setRotation(rotate,center);  
	}	
	this.text.setRotation(rotate,center);
	this.rotate=rotate;
}
Rotate(rotation){
	//fix angle
	   let alpha=this.rotate+rotation.angle;
	   if(alpha>=360){
		 alpha-=360
	   }
	   if(alpha<0){
		 alpha+=360; 
	   }

	   var len=this.shapes.length;
	   for(var i=0;i<len;i++){
		   this.shapes[i].Rotate(rotation);  
	   }
	  
	   this.text.Rotate(rotation.angle,new d2.Point(rotation.originx,rotation.originy));
	   this.rotate=alpha;
}
drawClearence(g2,viewportWindow,scale,source){
    let rect=this.getBoundingShape();
    if (!rect.intersects(source.getBoundingShape())) {    
    	return;
    }
    
    rect.scale(scale.getScale());
	if (!rect.intersects(viewportWindow)) {
		return;
	}
	var len=this.shapes.length;
	for(i=0;i<len;i++){
	  if(this.shapes[i] instanceof Pad){
		  this.shapes[i].drawClearence(g2,viewportWindow,scale,source); 
	  }
	}
	
}
paint(g2, viewportWindow, scale,layersmask) {        
     
	var rect = this.getBoundingShape();		
	rect.scale(scale.getScale());
	if (!rect.intersects(viewportWindow)) {
	 return;
	}
		
	var len=this.shapes.length;
	for(i=0;i<len;i++){
		  this.shapes[i].paint(g2,viewportWindow,scale,layersmask);  
	}
    this.text.text.forEach(function(texture){
       if((texture.layermaskId&layersmask)!=0){            
        texture.fillColor=(this.selection?'gray':'cyan');
        texture.paint(g2,viewportWindow,scale,layersmask);
       }
    },this);      

 }    
fromXML(data){
	 this.copper=core.Layer.Copper.valueOf(j$(data).attr("layer"));
	 this.value=parseFloat(j$(data).find("units").attr("raster"));
     this.units=core.Units.MM;	
     
	 var reference=j$(data).find("reference")[0];
 	 var value=j$(data).find("value")[0];
 	 
 	 
//	 if(reference!=null&&reference.text()!=''){
//           var label = new GlyphLabel(0,0,0);
//           label.fromXML(reference[0]);
//           label.texture.tag="reference";
//           this.add(label);      
// 	 }
// 	 if(value!=null&&value.text()!=''){
//           var label = new GlyphLabel(0,0,0);
//           label.fromXML(value[0]);
//           label.texture.tag="value";
//           this.add(label);	 		   
// 	 }
 	 
 	 var texture=this.text.getTextureByTag("reference");
 	 texture.fromXML(reference);
 	 
 	 var texture=this.text.getTextureByTag("value");
 	 texture.fromXML(value);
 	 
 	 this.displayName=j$(data).find("name")[0].textContent;	
 	 
	 var that=this;
	 var shapeFactory=new FootprintShapeFactory();
	 
	 j$(data).find('shapes').children().each(function(){
         var shape=shapeFactory.createShape(this);
         that.add(shape);
	 });
}

toXML() {
    let xml="<footprint layer=\""+this.copper.getName()+"\">\r\n";
           xml+="<name>"+this.displayName+"</name>\r\n";
           xml+="<units raster=\""+this.value+"\">"+this.units+"</units>\r\n"; 
           xml+="<reference layer=\""+core.Layer.Copper.resolve(this.text.getTextureByTag("reference").layermaskId).getName()+"\">"+(this.text.getTextureByTag("reference")==null?"":this.text.getTextureByTag("reference").toXML())+"</reference>\r\n";                           
           xml+="<value layer=\""+core.Layer.Copper.resolve(this.text.getTextureByTag("value").layermaskId).getName()+"\">"+(this.text.getTextureByTag("value")==null?"":this.text.getTextureByTag("value").toXML())+"</value>\r\n";
//    //***labels and connectors
//           BoardMgr boardMgr = BoardMgr.getInstance();
//           if(boardMgr.getChildrenByParent(getOwningUnit().getShapes(),this).size()>0){
//             xml.append("<children>\r\n");
//               Collection<Shape> children=boardMgr.getChildrenByParent(getOwningUnit().getShapes(),this);
//                for(Shape child:children){
//                  xml.append(((Externalizable)child).toXML());  
//                }
//                xml.append("</children>\r\n");
//    }               
//              
           xml+="<shapes>\r\n";
           this.shapes.forEach(
            s=>xml+=s.toXML()
           )
           xml+="\r\n</shapes>\r\n";
           xml+="</footprint>";                 
    return xml;  
}
}

class PCBCircle extends Circle{
    constructor( x, y,  r,  thickness, layermaskid) {
        super( x, y, r, thickness, layermaskid);
    }	
    clone(){
    	let copy = new PCBCircle(this.x,this.y,this.width,this.thickness,this.copper.getLayerMaskID());
    	copy.circle=this.circle.clone();
    	copy.fill=this.fill;
    	return copy;
    }  
    
    
}

class PCBArc extends Arc{
    constructor( x, y,  r,  thickness, layermaskid) {
        super( x, y, r, thickness, layermaskid);
    }	
    clone() {
		var copy = new PCBArc(this.x, this.y, this.width,
						this.thickness,this.copper.getLayerMaskID());
        copy.arc=this.arc.clone();
		copy.arc.startAngle = this.arc.startAngle;
        copy.arc.endAngle = this.arc.endAngle;         
		copy.fill = this.fill;
		return copy;
}    
}

class PCBLabel extends GlyphLabel{
    constructor( layermaskId) {
        super("Label",core.MM_TO_COORD(0.3),layermaskId);
        this.clearance=0;
    }
clone(){
	var copy = new PCBLabel(this.copper.getLayerMaskID());
    copy.texture = this.texture.clone();        
    copy.copper=this.copper;
	return copy;
} 
drawClearence(g2,viewportWindow,scale,source){
   if((source.copper.getLayerMaskID()&this.copper.getLayerMaskID())==0){        
	   return;  //not on the same layer
   }
   let clear=this.clearance!=0?this.clearance:source.clearance;
   
   let rect=this.texture.getBoundingShape();
   rect.min.move(-clear,-clear);
   rect.max.move(clear,clear);
   
   if (!rect.intersects(source.getBoundingShape())) {
		return;
   }

    let r=this.texture.getBoundingRect();
 
	r.grow(clear);
    r.scale(scale.getScale());
	if (!r.intersects(viewportWindow)) {
		return;
	}
	
	g2._fill=true;
	g2.fillStyle = "black";	
	
	
    r.move(-viewportWindow.x,- viewportWindow.y);
	r.paint(g2);
	
    g2._fill=false;	
   
}
getDrawingOrder() {
        let order=super.getDrawingOrder();
        if(this.owningUnit==null){            
           return order;
        }
        
        if(this.owningUnit.activeSide==core.Layer.Side.resolve(this.copper.getLayerMaskID())){
          order= 4;
        }else{
          order= 3; 
        }  
        return order;
    }
}
class PCBLine extends Line{
constructor(thickness,layermaskId){
        super(thickness,layermaskId);
    }
clone() {
		var copy = new PCBLine(this.thickness,this.copper.getLayerMaskID());
		  copy.polyline=this.polyline.clone();
		  return copy;
	}    
}
class PCBSolidRegion extends SolidRegion{
	constructor(layermaskId){
	        super(layermaskId);
	    }
	clone() {
			var copy = new PCBSolidRegion(this.copper.getLayerMaskID());
			  copy.polygon=this.polygon.clone();  
			  return copy;
		}    
}

class PCBRoundRect extends RoundRect{
constructor( x, y,  width,height,arc,  thickness, layermaskid) {
        super( x, y, width,height,arc, thickness, layermaskid);
        this.displayName = "Rect";
    }
clone(){
	var copy = new PCBRoundRect(0,0,0,0,0,this.thickness,this.copper.getLayerMaskID());
	copy.roundRect = this.roundRect.clone();
	copy.fill = this.fill;
	copy.arc=this.arc;
	return copy;	
}    
}
//************************PCBTrack********************
class PCBTrack extends AbstractLine{
constructor(thickness,layermaskId){
       super(thickness,layermaskId);
       this.displayName = "Track";
       this.clearance=0;
	}
clone() {
	var copy = new PCBTrack(this.thickness,this.copper.getLayerMaskID());
	copy.clearance=this.clearance=0;;
	copy.polyline=this.polyline.clone();
	return copy;

	}
getDrawingOrder() {
    let order=super.getDrawingOrder();
    if(this.owningUnit==null){            
        return order;
    }
    
    if(this.owningUnit.activeSide==core.Layer.Side.resolve(this.copper.getLayerMaskID())){
       order= 4;
     }else{
       order= 3; 
     }  
    return order;     
}
getOrderWeight() {
    return 4;
}
drawClearence(g2,viewportWindow,scale,source){
   if((source.copper.getLayerMaskID()&this.copper.getLayerMaskID())==0){        
	   return;  //not on the same layer
   }
   g2.lineWidth=(this.thickness+2*(this.clearance!=0?this.clearance:source.clearance))*scale.getScale(); 
   g2.strokeStyle = "black";
   
    
   let clip=source.clip;
   g2.save();
   g2.beginPath();
   g2.moveTo(clip[0].x,clip[0].y);
   for (var i = 1; i < clip.length; i++) {
	   g2.lineTo(clip[i].x, clip[i].y);
   } 
   g2.clip();
   
   let a=this.polyline.clone();
   a.scale(scale.getScale());
   a.move( - viewportWindow.x, - viewportWindow.y);		
   a.paint(g2);

   g2.restore();
}
paint(g2, viewportWindow, scale,layersmask) {
    if((this.copper.getLayerMaskID()&layersmask)==0){
        return;
    }
	
	var rect = this.polyline.box;
	rect.scale(scale.getScale());		
	if (!this.isFloating()&& (!rect.intersects(viewportWindow))) {
		return;
	}

	g2.globalCompositeOperation = 'lighter';
	g2.lineCap = 'round';
	g2.lineJoin = 'round';
	

	g2.lineWidth = this.thickness * scale.getScale();


	if (this.selection)
		g2.strokeStyle = "gray";
	else
		g2.strokeStyle = this.copper.getColor();

	let a=this.polyline.clone();
	a.scale(scale.getScale());
	a.move( - viewportWindow.x, - viewportWindow.y);		
	a.paint(g2);
	
	// draw floating point
	if (this.isFloating()) {
			let p = this.floatingMidPoint.clone();
			p.scale(scale.getScale());
			p.move( - viewportWindow.x, - viewportWindow.y);
			g2.lineTo(p.x, p.y);									
			g2.stroke();							    		
		
			p = this.floatingEndPoint.clone();
			p.scale(scale.getScale());
			p.move( - viewportWindow.x, - viewportWindow.y);
			g2.lineTo(p.x, p.y);									
			g2.stroke();					
	}

	g2.globalCompositeOperation = 'source-over';

}
drawControlShape(g2, viewportWindow, scale){   
    if((!this.isSelected())/*&&(!this.isSublineSelected())*/){
      return;
    }
    this.drawControlPoints(g2, viewportWindow, scale);
}
fromXML(data) {
       this.copper =core.Layer.Copper.valueOf(j$(data).attr("layer"));
	   this.thickness = (parseInt(j$(data).attr("thickness")));
	   var tokens = data.textContent.split(",");
	   var len = Math.floor(tokens.length / 2) * 2;
	   for (var index = 0; index < len; index += 2) {
			var x = parseInt(tokens[index]);
			var y = parseInt(tokens[index + 1]);
			this.polyline.points.push(new d2.Point(x, y));
		}
}
toXML() {
	var result = "<track layer=\"" + this.copper.getName()
								+ "\" thickness=\"" + this.thickness + "\" clearance=\"" + this.clearance + "\" net=\"" + this.net +"\">";
	this.polyline.points.forEach(function(point) {
		result += utilities.roundFloat(point.x,5) + "," + utilities.roundFloat(point.y,5) + ",";
	},this);
	result += "</track>";
	return result;
}
}
class PCBHole extends Shape{
	constructor() {
		super(0, 0, 0, 0,0,core.Layer.LAYER_ALL);		
		this.displayName='Hole';	
        this.fillColor='white';
        this.selectionRectWidth = 3000;
        this.circle=new d2.Circle(new d2.Point(0,0),core.MM_TO_COORD(1.6)/2);
        this.clearance=0;
   	}
clone(){
	   	var copy = new PCBHole();
		 copy.circle.pc.x=this.circle.pc.x;
		 copy.circle.pc.y=this.circle.pc.y;
		 copy.circle.r=this.circle.r;	        	        
	     return copy;
}	
alignToGrid(isRequired) {
	    if(isRequired){
	       return super.alignToGrid(isRequired);
	    }else{
	        return null;
	    }
	}
Move(xoffset, yoffset) {
	this.circle.move(xoffset,yoffset);
}
getOrderWeight() {
    return 3;
}
setWidth(width){
	  this.circle.r=width/2;
	}
calculateShape() {
	    return this.circle.box;
	}
drawClearence(g2, viewportWindow,scale, source) {
	
    let r=this.circle.r+(this.clearance!=0?this.clearance:source.clearance);
    let c=new d2.Circle(this.circle.pc.clone(),r);
	let rect=c.box;
	if (!rect.intersects(source.getBoundingShape())) {
		return;
	}

	rect.scale(scale.getScale());
	if (!rect.intersects(viewportWindow)) {
		return;
	}
	g2._fill=true;
	g2.fillStyle = "black";	
	
	c.scale(scale.getScale());
    c.move(-viewportWindow.x,- viewportWindow.y);
	c.paint(g2);
	
    g2._fill=false;	
}
paint(g2, viewportWindow, scale,layersmask) {	
	var rect = this.calculateShape();
	rect.scale(scale.getScale());
	if (!rect.intersects(viewportWindow)) {
		return;
	}
	
	g2.lineWidth=(scale.getScale())*1000;
	if (this.selection) {
		g2.strokeStyle = "gray";
	} else {
		g2.strokeStyle = "white";
	}

    let c=this.circle.clone();
	c.scale(scale.getScale());
    c.move(-viewportWindow.x,- viewportWindow.y);
	c.paint(g2);
	
	if(this.selection){
	  utilities.drawCrosshair(g2, viewportWindow, scale,null,this.selectionRectWidth,[this.circle.center]);
	}
}
toXML(){
	
}
fromXML(data) {
	let x=parseFloat(j$(data).attr("x"));
	let y=parseFloat(j$(data).attr("y"));
    this.circle.pc.set(x,y);

	this.circle.r=(parseInt(j$(data).attr("width")));	
	this.clearance=(parseInt(j$(data).attr("clearance")));	      
} 

}
class PCBVia extends Shape{
constructor() {
		super(0, 0, 0, 0,core.MM_TO_COORD(0.3),core.Layer.LAYER_ALL);		
		this.outer=new d2.Circle(new d2.Point(0,0),core.MM_TO_COORD(0.8));
		this.inner=new d2.Circle(new d2.Point(0,0),core.MM_TO_COORD(0.4));
        this.selectionRectWidth = 3000;
		this.displayName='Via';	
        this.fillColor='white'; 
        this.clearance=0;
   	}

clone(){
   	var copy = new PCBVia();
        copy.inner=this.inner.clone();
        copy.outer=this.outer.clone();
        return copy;
   	}

alignToGrid(isRequired) {
    if(isRequired){
       return super.alignToGrid(isRequired);
    }else{
        return null;
    }
}
Move(xoffset, yoffset) {
   this.outer.move(xoffset,yoffset);
   this.inner.move(xoffset,yoffset);
}
Rotate(rotation) {
	this.inner.rotate(rotation.angle,{x:rotation.originx,y:rotation.originy});
	this.outer.rotate(rotation.angle,{x:rotation.originx,y:rotation.originy});
}
setWidth(width){

}
calculateShape() {
    return this.outer.box;
}
drawClearence(g2, viewportWindow,scale, source) {    
	
    let r=this.outer.r+(this.clearance!=0?this.clearance:source.clearance);
    let c=new d2.Circle(this.outer.pc.clone(),r);
	let rect=c.box;
	if (!rect.intersects(source.getBoundingShape())) {
		return;
	}

	rect.scale(scale.getScale());
	if (!rect.intersects(viewportWindow)) {
		return;
	}
	g2._fill=true;
	g2.fillStyle = "black";	
	
	c.scale(scale.getScale());
    c.move(-viewportWindow.x,- viewportWindow.y);
	c.paint(g2);
	
    g2._fill=false;
}
paint(g2, viewportWindow, scale,layersmask) {
	
	var rect = this.calculateShape();
	rect.scale(scale.getScale());
	if (!rect.intersects(viewportWindow)) {
		return;
	}
	
	g2._fill=true;
	if (this.selection) {
		g2.fillStyle = "gray";
	} else {
		g2.fillStyle = "white";
	}

	let c=this.outer.clone();
	c.scale(scale.getScale());
    c.move(-viewportWindow.x,- viewportWindow.y);
	c.paint(g2);
	

	g2.fillStyle = "black";	
	c=this.inner.clone();
	c.scale(scale.getScale());
    c.move(-viewportWindow.x,- viewportWindow.y);
	c.paint(g2);
	
    g2._fill=false;
	if(this.selection){
	   utilities.drawCrosshair(g2, viewportWindow, scale,null,this.selectionRectWidth,[this.inner.center]);
	}    
}
getOrderWeight() {
    return 3;
}
fromXML(data) {
	let x=parseFloat(j$(data).attr("x"));
	let y=parseFloat(j$(data).attr("y"));
    this.inner.pc.set(x,y);
    this.outer.pc.set(x,y);


	this.outer.r=(parseInt(j$(data).attr("width")))/2;
	this.inner.r = (parseInt(j$(data).attr("drill")))/2;
	this.clearance=(parseInt(j$(data).attr("clearance")));
}
toXML() {
    return "<via type=\"\" x=\""+utilities.roundFloat(this.inner.center.x,5)+"\" y=\""+utilities.roundFloat(this.inner.center.y,5)+"\" width=\""+this.outer.r+"\" drill=\""+this.inner.r+"\"   clearance=\""+this.clearance+"\" net=\""+(this.net==null?"":this.net)+"\" />";    
}
}
class PCBCopperArea extends Shape{
	constructor( layermaskid) {
        super( 0, 0, 0,0, 0, layermaskid);
        this.displayName = "Copper Area";
        this.clearance=core.MM_TO_COORD(0.2); 
        this.floatingStartPoint=new d2.Point();
        this.floatingEndPoint=new d2.Point();                 
        this.selectionRectWidth = 3000;
        this.fill=core.Fill.FILLED;
        this.polygon=new d2.Polygon();
        this.resizingPoint;
        this.clip=[];
        this.net='gnd';
    }
clone(){
    let copy=new PCBCopperArea(this.copper.getLayerMaskID());
    copy.polygon=this.polygon.clone();  
    return copy;	
}

prepareClippingRegion(viewportWindow,scale){
    this.clip=[];
    this.polygon.points.forEach(function(point){
        let p=point.clone();            
        p.scale(scale.getScale());
        p.move(-viewportWindow.x,-viewportWindow.y);
        this.clip.push(p);    
	}.bind(this));
}
calculateShape(){  	    
   return this.polygon.box;
}	

getLinePoints() {
   return this.polygon.points;
}
add(point) {
    this.polygon.add(point);
}
getDrawingOrder() {
    if(this.owningUnit==null){            
        return super.getDrawingOrder();
    }
    
    if(this.owningUnit.compositeLayer.activeSide==core.Layer.Side.resolve(this.copper.getLayerMaskID())){
       return 2;
    }else{
       return 1; 
    }
}
setResizingPoint(point) {
    this.resizingPoint=point;
}
isFloating() {
    return (!this.floatingStartPoint.equals(this.floatingEndPoint));                
}
isClicked(x,y){
	  var result = false;
		// build testing rect
	  var rect = d2.Box.fromRect(x
								- (3000 / 2), y
								- (3000 / 2), 3000,
								3000);
	  var r1 = rect.min;
	  var r2 = rect.max;

	  // ***make lines and iterate one by one
	  var prevPoint = this.polygon.points[this.polygon.points.length-1];

	  this.polygon.points.some(function(wirePoint) {
							// skip first point
							{
								if (utilities.intersectLineRectangle(
										prevPoint, wirePoint, r1, r2)) {
									result = true;
									return true;
								}
								prevPoint = wirePoint;
							}

						});

	return result;
}
isControlRectClicked(x, y) {
	var rect = d2.Box.fromRect(x-this.selectionRectWidth / 2, y - this.selectionRectWidth/ 2, this.selectionRectWidth, this.selectionRectWidth);
	let point = null;

	this.polygon.points.some(function(wirePoint) {
		if (rect.contains(wirePoint)) {
					point = wirePoint;
		  return true;
		}else{
		  return false;
		}
	});

	return point;
}
isInRect(r) {

    return this.polygon.points.every(function(wirePoint){
    	return r.contains(wirePoint.x,wirePoint.y);                        
    });
    
}
reset(){
	this.resetToPoint(this.floatingStartPoint);	
}
resetToPoint(p){
    this.floatingStartPoint.set(p.x,p.y);
    this.floatingEndPoint.set(p.x,p.y); 
}
Rotate(rotation) {
	this.polygon.rotate(rotation.angle,{x:rotation.originx,y:rotation.originy});
}
Resize(xoffset, yoffset, clickedPoint) {
	clickedPoint.set(clickedPoint.x + xoffset,
								clickedPoint.y + yoffset);
}
paint(g2,viewportWindow,scale, layersmask){
   
    if((this.copper.getLayerMaskID()&layersmask)==0){
      return;
    }
	var rect = this.polygon.box;
	rect.scale(scale.getScale());		
	if (!this.isFloating()&& (!rect.intersects(viewportWindow))) {
		return;
	}
	
	g2.lineWidth = 1;
	
	if(this.isFloating()){
      g2.strokeStyle = this.copper.getColor();		
	}else{
	  g2._fill=true;
	  if (this.selection) {
		 g2.fillStyle = "gray";
	  } else {
		 g2.fillStyle = this.copper.getColor();
	  }
	}
	let a=this.polygon.clone();	
	if (this.isFloating()) {
		let p = this.floatingEndPoint.clone();
		a.add(p);	
    }
	a.scale(scale.getScale());
	a.move( - viewportWindow.x, - viewportWindow.y);		
	a.paint(g2);
	g2._fill=false;
    
    
    //draw clearence background
    this.prepareClippingRegion(viewportWindow, scale);
    this.owningUnit.shapes.forEach(target=>{
    	if(target.drawClearence!=undefined){
         target.drawClearence(g2, viewportWindow, scale, this);
    	}
    });
	
	
//	let dst = [];
//	this.polygon.points.forEach(function(point) {
//		dst.push(point.getScaledPoint(scale));
//	});
//	g2.globalCompositeOperation = 'lighter';
//	g2.beginPath();
//	g2.lineCap = 'round';
//	g2.lineJoin = 'round';
//	g2.moveTo(dst[0].x - viewportWindow.x, dst[0].y
//							- viewportWindow.y);
//	for (var i = 1; i < dst.length; i++) {
//						g2.lineTo(dst[i].x - viewportWindow.x, dst[i].y
//								- viewportWindow.y);
//	}
//	
//	// draw floating point
//	if (this.isFloating()) {
//			let p = this.floatingEndPoint.getScaledPoint(scale);
//				g2.lineTo(p.x - viewportWindow.x, p.y
//								- viewportWindow.y);
//	}
//	g2.closePath();
//
//	if (this.selection){
//		g2.fillStyle = "gray";
//    }else{    	
//		g2.fillStyle = this.copper.getColor();
//	}
//    g2.fill();   
//    
//    if(this.isSelected()){  
//    	g2.lineWidth=1;
//    	g2.strokeStyle = "blue";                   
//        g2.stroke();
//    
//        this.drawControlShape(g2,viewportWindow,scale);
//    }
//    
//	g2.globalCompositeOperation = 'source-over';
}	
drawControlShape(g2, viewportWindow, scale) {
	if (this.isSelected()) {	
	  utilities.drawCrosshair(g2,viewportWindow,scale,null,this.selectionRectWidth,this.polygon.points);
	}
}
fromXML(data){
    this.copper =core.Layer.Copper.valueOf(j$(data).attr("layer"));
	this.clearance = (parseInt(j$(data).attr("clearance")));
	this.net=(j$(data).attr("net"));
	
	   var tokens = data.textContent.split(",");
	   var len = Math.floor(tokens.length / 2) * 2;
	   for (var index = 0; index < len; index += 2) {
			var x = parseInt(tokens[index]);
			var y = parseInt(tokens[index + 1]);
			this.polygon.points.push(new d2.Point(x, y));
	   }
}
toXML() {
	var result = "<copperarea layer=\"" + this.copper.getName()
								+ "\" padconnect=\"" + this.padConnection + "\" clearance=\"" + this.clearance + "\" net=\"" + this.net +"\">";
	this.polygon.points.forEach(function(point) {
		result += utilities.roundFloat(point.x,5) + "," + utilities.roundFloat(point.y,5) + ",";
	},this);
	result += "</copperarea>";
	return result;
}
}

module.exports ={
		PCBCopperArea,
		PCBFootprint,
		PCBLabel,
		PCBCircle,
		PCBRoundRect,
		PCBArc,
		PCBVia,
		PCBHole,
		PCBTrack,
		PCBLine,
		PCBSolidRegion,
		BoardShapeFactory
		
}