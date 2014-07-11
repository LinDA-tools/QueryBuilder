if (typeof Utils == 'undefined') {
	Utils = {};
}

Utils = {
	show : function(e){
		e.removeClass('hide');
	},
	hide : function(e){
		e.addClass('hide');
	}

};