var mywebpcb=require('core/core').mywebpcb;
var core=require('core/core');
var CircuitContainer=require('circuit/d/circuitcomponent').BoardContainer;


var CircuitSaveView=Backbone.View.extend({
	initialize:function(opt){
			this.model=opt.model; 
			j$('#CircuitSaveDialog').jqxWindow({height: 300, width: 420});
			j$('#CircuitSaveDialog').jqxWindow('open');
			j$('#CircuitSaveDialog').off('close', j$.proxy(this.onclose,this)); 
			j$('#CircuitSaveDialog').on('close', j$.proxy(this.onclose,this)); 				    	
			this.workspaceview=new WorkspaceView(opt);
			this.buttonview=new ButtonView(opt); 
			
	},
	onclose:function(){
		this.buttonview.clear();	
	},
    render:function(){ 
    	this.buttonview.render();
    }
		  
});

WorkspaceView=Backbone.View.extend({
	initialize:function(opt){
		this.model=opt.model;
		j$('#workspacecomboid').editableSelect('clear');
		j$('#projectnameid').val(this.model.formatedFileName);
		j$('#workspacecomboid').val('');
		 this.loadworkspaces();
	},
    loadworkspaces:function(){
	    j$.ajax({
	        type: 'GET',
	        contentType: 'application/xml',
	        url: '/rest/circuits/workspaces',
	        dataType: "xml",
	        beforeSend:function(){
		          j$('#CircuitSaveDialog').block({message:'<h5>Loading...</h5>'});	
		        },
	        success: j$.proxy(this.onloadworkspaces,this),
	        
	        error: function(jqXHR, textStatus, errorThrown){
	            	alert(errorThrown+":"+jqXHR.responseText);
	        },
	        complete:function(jqXHR, textStatus){
	        	j$('#CircuitSaveDialog').unblock();
	        }
	    });    	
    },
    onloadworkspaces:function(data, textStatus, jqXHR){
		let that=this;
    	j$(data).find("name").each(j$.proxy(function(){
		  j$('#workspacecomboid').editableSelect('add',j$(this).text());
		}),that);  	
    },

	render:function(){

		
	}
});

ButtonView=Backbone.View.extend({
	el:"#savebuttonslot",
	initialize:function(opt){
	  this.model=opt.model;
    },	
    clear:function(){
       this.undelegateEvents();
    },
    events: {
        "click  #savebuttonid" : "onsave",	
        "click  #closebuttonid" : "onclose",	
    },
    onsave:function(){    	
    	let workspace=j$('#workspacecomboid').val()!=''?j$('#workspacecomboid').val():'null';
	    let name=j$('#projectnameid').val()!=''?j$('#projectnameid').val():'null'	
    	j$.ajax({
	        type: 'POST',
	        contentType: 'application/xml',
	        url: '/rest/circuits/workspaces/'+workspace+'?projectName='+name+'&overwrite='+j$('#overrideCheck').is(":checked"),
	        dataType: "xml",
	        data:this.model.format(),
	        beforeSend:function(){
		          j$('#CircuitSaveDialog').block({message:'<h5>Saving...</h5>'});	
		        },
	        success: function(){
	    		//close dialog 
	    		j$('#CircuitSaveDialog').jqxWindow('close');
	        },	        		        
	        error: function(jqXHR, textStatus, errorThrown){
	            //if(jqXHR.status==404){
	            	//data=jqXHR.responseJSON;
	            	//clean error list
	            	//$("#errorsres ul").empty();
	            	//for(var i = 0; i < data.length; i++) {
	            	//	$("#errorsres ul").append('<li>'+data[i]+'</li>');
	            	//}
	            //}else{
	            	alert(errorThrown+":"+jqXHR.responseText);
	            //}
	        },
	        complete:function(jqXHR, textStatus){
	        	j$('#CircuitSaveDialog').unblock();
	        }
	    });    	
    },
    onclose:function(){
    	j$('#CircuitSaveDialog').jqxWindow('close'); 	
    },
    
	render:function(){
		j$(this.el).empty();
		j$(this.el).append(
		"<button  id=\"savebuttonid\" class=\"btn btn-default\">Save</button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+
	    "<button  id=\"closebuttonid\" class=\"btn btn-default\">Close</button>");
	}
});

module.exports =CircuitSaveView