if (typeof Utils == 'undefined') {
	Utils = {};
}

Utils = {
	show : function(e){
		e.removeClass('hide');
	},
	hide : function(e){
		e.addClass('hide');
	},
	scroll_to : function(e){
		$('html, body').animate({
        	scrollTop: $(e).offset().top
   	 	}, 500);
	},
	alert : function(message){
		$("#alert_modal").find(".modal-body").first().html(message);
		$("#alert_modal").modal("show");
	},
	rdf2any : {
		server : "http://"+document.domain.toString()+":8080/",
		actions : {
			convert : "rdf2any/v1.0/convert/"
		} 
	},
	show_uri_viewer : function(uri){
		$("#iframe_uri_viewer").attr("src",uri);
		$("#uri_viewer_modal").modal("show");
		$("#a_uri_viewer_new_tab").attr("href",uri);
	},
	notice : function(title,message){
		$.gritter.add({title: title,text: message});
	}

};