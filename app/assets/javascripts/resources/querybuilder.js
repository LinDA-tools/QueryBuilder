if (typeof QueryBuilder == 'undefined') {
	QueryBuilder = {};
}

QueryBuilder = {
	selected_dataset : function(dataset){
		$("#div_qb_select_class").show("fast");
		$("#dd_select_dataset").hide("fast");
		$("#div_step_info_dataset").hide("fast");
		QueryBuilder.select_body($("#div_select_dataset"),dataset);
	},
	select_body : function(element,body){
		element.find(".select-body").first().html(body);
		console.log(element.find(".select-body").first());
		element.show("fast");
	}
};
