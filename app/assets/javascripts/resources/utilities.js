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
	}

};