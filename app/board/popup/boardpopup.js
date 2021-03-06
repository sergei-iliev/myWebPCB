var ContextMenu = require('core/popup/contextmenu').ContextMenu;
var core=require('core/core');
var LineSlopBendingProcessor=require('core/line/linebendingprocessor').LineSlopBendingProcessor;
var SlopLineBendingProcessor=require('core/line/linebendingprocessor').SlopLineBendingProcessor;
var DefaultLineBendingProcessor=require('core/line/linebendingprocessor').DefaultLineBendingProcessor;

class BoardContextMenu extends ContextMenu{
constructor(component,placeholderid){
		super(component,placeholderid);	
	}
registerTrackPopup(target,event){
	  var items="<div id='menu-items'><table style='cursor: default;'>";		  		  			  
	    items+="<tr id='lineslopebendid' ><td style='padding: 0.4em;'>Line Slope Bending</td></tr>";
	    items+="<tr id='slopelinebendid' ><td style='padding: 0.4em;'>Slope Line Bending</td></tr>";
	    items+="<tr id='defaultbendid'><td style='padding: 0.4em;'>Default Bending</td></tr>";	  
	    items+="</table></div>";
	    this.setContent(items,{target:target});	    
	    this.open(event);		
}
registerChipPopup(target,event){
	  var items="<div id='menu-items'><table style='cursor: default;'>";		  		  			  
	    items+="<tr id='selectallid' ><td style='padding: 0.4em;'>Edit Footprint</td></tr>";
	    items+="<tr id='rotateleftid' ><td style='padding: 0.4em;'>Rotate Left</td></tr>";
	    items+="<tr id='rotaterightid'><td style='padding: 0.4em;'>Rotate Right</td></tr>";	  
	    items+="<tr id='cloneid'><td style='padding: 0.4em;'>Clone</td></tr>";
	    items+="<tr id='topbottomid'><td style='padding: 0.4em'>Mirror Top-Bottom</td></tr>";
	    items+="<tr id='leftrightid'><td style='padding: 0.4em'>Mirror Left-Right</td></tr>";
	    items+="<tr id='deleteid'><td style='padding: 0.4em'>Delete</td></tr>";	
	    items+="<tr id='deleteid'><td style='padding: 0.4em'>Wire ends connect</td></tr>";	
	    items+="<tr id='deleteid'><td style='padding: 0.4em'>Wire ends disconnect</td></tr>";	
	    items+="</table></div>";
	    this.setContent(items,{target:target});	    
	    this.open(event);		
}
registerUnitPopup(target,event){	          	            
	  var items="<div id='menu-items'><table style='cursor: default;'>";		  		  			  
	    items+="<tr id='selectallid' ><td style='padding: 0.4em;'>Select All</td></tr>";
	    items+="<tr id='undoid'><td style='padding: 0.4em;'>Undo</td></tr>";	  
	    items+="<tr id='redoid'><td style='padding: 0.4em;'>Redo</td></tr>";
	    items+="<tr id='loadid'><td style='padding: 0.4em'>Load</td></tr>";
	    items+="<tr id='reloadid'><td style='padding: 0.4em'>Reload</td></tr>";
	    items+="<tr id='deleteunit'><td style='padding: 0.4em'>Delete</td></tr>";	
	    items+="<tr id='copyid'><td style='padding: 0.4em'>Copy</td></tr>";
	    items+="<tr id='pasteid'><td style='padding: 0.4em'>Paste</td></tr>";		    
	    items+="<tr id='positiontocenterid'><td style='padding: 0.4em'>Position drawing to center</td></tr>";
	    items+="</table></div>";
	    this.setContent(items,{target:target});	    
	    this.open(event);	
}
registerBlockPopup(target,event){
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
//registerLinePopup(target,event){
//	  var items="<div id='menu-items'><table style='cursor: default;'>";		  		  			  
//	    items+="<tr id='deletelastpointid' ><td style='padding: 0.4em;'>Delete Last Point</td></tr>";
//	    items+="<tr id='deletelineid'><td style='padding: 0.4em;'>Delete Line</td></tr>";	  
//	    items+="<tr id='cancelid'><td style='padding: 0.4em;'>Cancel</td></tr>";	    	    	
//	    items+="</table></div>";
//	    this.setContent(items,{target:target});	
//	    this.open(event);	  	
//}

attachEventListeners(context){
	  var placeholder=document.getElementById('menu-items');		  
	  var rows=placeholder.getElementsByTagName("table")[0].rows;
	  var self=this;
	  for (var i = 0; i < rows.length; i++) {
	      //closure		   
	      (function(row) {
	          row.addEventListener("click", function() {	    		          	    	  		        	 
	        	  self.close();	        	  
	        	  self.actionPerformed(row.id,context);
	          });
	      })(rows[i]);
	  }
}
actionPerformed(id,context){
   if (id=="resumeid") {
        this.component.getView().setButtonGroup(core.ModeEnum.LINE_MODE);
        this.component.setMode(core.ModeEnum.LINE_MODE);         
        this.component.resumeLine(context.target,"line", {x:this.x, y:this.y,which:3});
    }  	
    let line =this.component.lineBendingProcessor.line;
	if(id=='lineslopebendid'){		
		this.component.lineBendingProcessor=new LineSlopBendingProcessor();
		this.component.lineBendingProcessor.initialize(line);
	}
	if(id=='slopelinebendid'){
		this.component.lineBendingProcessor=new SlopLineBendingProcessor();
		this.component.lineBendingProcessor.initialize(line);
	}
	if(id=='defaultbendid'){
		this.component.lineBendingProcessor=new DefaultLineBendingProcessor();
		this.component.lineBendingProcessor.initialize(line);
	}	
   super.actionPerformed(id,context);
   
}


}

module.exports ={
		BoardContextMenu
		}