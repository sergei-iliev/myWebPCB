var core=require('core/core');
var UnitMgr = require('core/unit').UnitMgr;
var d2=require('d2/d2');

class ContextMenu{
constructor(component,placeholderid){
	this.component=component;
	this.placeholder = document.getElementById(placeholderid);	
	this.content="";
	this.x=this.y=0;
	this.opened = false;	
}
registerShapePopup(target,event){
var items="<div id='menu-items'><table style='cursor: default;'>";		  		  			  
  items+="<tr id='rotateleftid' ><td style='padding: 0.4em;'>Rotate Left</td></tr>";
  items+="<tr id='rotaterightid'><td style='padding: 0.4em;'>Rotate Right</td></tr>";	  
  items+="<tr id='cloneid'><td style='padding: 0.4em;'>Clone</td></tr>";
  items+="<tr id='topbottomid'><td style='padding: 0.4em'>Mirror Top-Bottom</td></tr>";
  items+="<tr id='leftrightid'><td style='padding: 0.4em'>Mirror Left-Right</td></tr>";
  items+="<tr id='deleteid'><td style='padding: 0.4em'>Delete</td></tr>";	
  items+="</table></div>";
  this.setContent(items,{target:target});	
  this.open(event);	
}
registerLineSelectPopup(target,event){
	  let bending=target.isBendingPointClicked(event.x,event.y);
	  var items="<div id='menu-items'><table style='cursor: default;'>";		  		  			  
	    items+="<tr id='cloneid' ><td style='padding: 0.4em;'>Clone</td></tr>";
	    if(bending!=null){
	      if(target.isEndPoint(event.x,event.y)){	
	        items+="<tr id='resumeid'><td style='padding: 0.4em;'>Resume</td></tr>";
	      }
	    }else{
	    	items+="<tr id='addbendingpointid'><td style='padding: 0.4em;'>Add Bending point</td></tr>";	
	    }
	    
	    if(bending!=null){
	      items+="<tr id='deletebendingpointid'><td style='padding: 0.4em'>Delete Bending point</td></tr>";
	    }
	    items+="<tr id='deleteid'><td style='padding: 0.4em'>Delete</td></tr>";	
	    items+="</table></div>";
	    this.setContent(items,{target:target});	
	    this.open(event);	
}
open(event){ 
	this.x=event.x;
	this.y=event.y;
    this.placeholder.style.left=event.data.originalEvent.offsetX+"px";
    this.placeholder.style.top=event.data.originalEvent.offsetY+"px";
    this.show();				  
}
show(){
    if (!this.opened) {
	   this.placeholder.className = "visible";
	}    
	this.opened = true;		  		  
}
close() {
	
	j$(this.placeholder).removeClass("visible");
	j$(this.placeholder).empty();
    this.opened = false;  
}
isOpen(){
	return this.opened;
}
setContent(content,context) {
    this.placeholder.innerHTML ="<div class='content'>" + content + "</div>";
    //attach event listeners
    this.attachEventListeners(context);
}	

attachEventListeners(context){
	
}

actionPerformed(id,context){
	 if (id=="resumeid") {
	        this.component.getView().setButtonGroup(core.ModeEnum.LINE_MODE);
	        this.component.setMode(core.ModeEnum.LINE_MODE);         
	        this.component.resumeLine(context.target,"line", {x:this.x, y:this.y,which:3});
	 } 
	 if(id=='cancelid') {
		   this.component.getEventMgr().resetEventHandle();
		   context.target.setSelected(false);
		   this.component.getView().setButtonGroup(core.ModeEnum.COMPONENT_MODE);
	       this.component.setMode(core.ModeEnum.COMPONENT_MODE); 
	       this.component.repaint();
	 }
     if (id=="addbendingpointid") {
    	 let line=context.target;
         line.insertPoint(this.x, this.y);
         
         this.component.repaint();
         return;
    }	 
     if(id=='deletelastpointid') {
        let line=context.target;
        line.deleteLastPoint();

        if (line.points.length == 1) {
            //getUnitComponent().getModel().getUnit().registerMemento(getTarget().getState(MementoType.DELETE_MEMENTO));
            this.component.getEventMgr().resetEventHandle();
            this.component.getModel().getUnit().remove(line.uuid);
        }

         this.component.repaint();
         return;
     }
     if(id=='deletebendingpointid'){
    	 let line=context.target;
    	 line.removePoint(this.x,this.y);
         //***delete wire if one point remains only
         if (line.getLinePoints().length == 1) {
        	 this.component.getEventMgr().resetEventHandle();
        	 this.component.getModel().getUnit().remove(line.uuid);
         }
         this.component.repaint();
         return;
     }
     if (id=="deletelineid") {
    	 let line=context.target;
         //this.component.getModel().getUnit().registerMemento(getTarget().getState(MementoType.DELETE_MEMENTO));
         this.component.getEventMgr().resetEventHandle();
         this.component.getModel().getUnit().remove(line.uuid);
         this.component.repaint();                    
   } 
	 if(id=='topbottomid'||id=='leftrightid'){
         let shapes= this.component.getModel().getUnit().getSelectedShapes(false);         
         if(shapes.length==0){
             return; 
         }
         
         let r=this.component.getModel().getUnit().getShapesRect(shapes);       
         let unitMgr = UnitMgr.getInstance();
         let p=this.component.getModel().getUnit().grid.positionOnGrid(r.center.x,r.center.y); 
         if(id=='topbottomid'){
             unitMgr.mirrorBlock(shapes,new d2.Line(new d2.Point(p.x-10,p.y),new d2.Point(p.x+10,p.y)));
         }else{
             unitMgr.mirrorBlock(shapes,new d2.Line(new d2.Point(p.x,p.y-10),new d2.Point(p.x,p.y+10)));
         }         
         unitMgr.alignBlock(this.component.getModel().getUnit().grid,shapes);
         this.component.repaint();		 
	 }	
	 if(id=='rotaterightid'||id=='rotateleftid'){
         let shapes= this.component.getModel().getUnit().getSelectedShapes(false);         
         if(shapes.length==0){
             return; 
         }
         
         let r=this.component.getModel().getUnit().getShapesRect(shapes);       
         let unitMgr = UnitMgr.getInstance();
         
         unitMgr.rotateBlock(shapes,core.AffineTransform.createRotateInstance(r.center.x,r.center.y,(id==("rotateleftid")?1:-1)*(90.0)));
         
         unitMgr.alignBlock(this.component.getModel().getUnit().grid,shapes);
         this.component.repaint();		 
	 }
	 if(id=='positiontocenterid'){
	     let unit=this.component.getModel().getUnit();           
	     let rect =unit.getBoundingRect();
	    
	     let x=rect.center.x;
	     let y=rect.center.y;
	     
	     let unitMgr = UnitMgr.getInstance();
	     
	     unitMgr.moveBlock(unit.shapes, (unit.width/2)-x, (unit.height/2)-y);
	     unitMgr.alignBlock(unit.grid,unit.shapes);
	      
	     //scroll to center
	     this.component.setScrollPosition((unit.width/2), (unit.height/2));
	     this.component.repaint();
	 }
	 if(id=='deleteunit'){
         this.component.getModel().delete(this.component.getModel().getUnit().getUUID());
         if (this.component.getModel().unitsmap.size> 0) {
        	 this.component.getModel().setActiveUnit(0);
        	 this.component.getModel().fireUnitEvent({target:this.component.getModel().getUnit(),type:Event.SELECT_UNIT});
         }else{
        	 this.component.Clear();
        	 this.component.fireContainerEvent({target:null, type:Event.DELETE_CONTAINER});
         }
         this.component.repaint();  
	 }
     if (id=='deleteid') {
    	 let unit=this.component.getModel().getUnit(); 
    	 let unitMgr = UnitMgr.getInstance();        
         unitMgr.deleteBlock(unit,unit.getSelectedShapes(false));
         this.component.repaint();                     
     } 
	 if(id=='cloneid'){
		 let unit=this.component.getModel().getUnit();  
		 let unitMgr = UnitMgr.getInstance();
         unitMgr.cloneBlock(unit,unit.getSelectedShapes(true));
         let shapes= unit.getSelectedShapes(false); 
         let r=unit.getShapesRect(shapes);
         unitMgr.moveBlock(shapes,
                              r.width,r.height);
         unitMgr.alignBlock(unit.grid,shapes);
         
         this.component.repaint();
         //***emit property event change
         if (shapes.length == 1) {            
	       unit.fireShapeEvent({target:shapes[0],type:Event.SELECT_SHAPE});
         }             
         return; 		 
	 }
	 if(id=='selectallid'){ 
	     this.component.getModel().getUnit().setSelected(true);
	     this.component.repaint();  
	 }	
}
}

module.exports ={
		   ContextMenu
}