if (typeof QueryBuilder == 'undefined') {
    QueryBuilder = {};
}

QueryBuilder = {
    selected_dataset : function(dataset){
        $("#div_qb_select_class").show("fast");
        $("#dd_select_dataset").hide("fast");
        $("#div_step_info_dataset").hide("fast");
        QueryBuilder.select_body($("#div_select_dataset"),dataset);
        $("#hdn_qb_dataset").attr("value",dataset);
    },
    select_body : function(element,body){
        element.find(".select-body").first().html(body);
        element.show("fast");
    },
    reset_dataset : function(){
        $(".done-dataset").hide("fast");
        $("#div_qb_select_class").hide("fast");
        $(".clear-dataset").show("fast");
    },
    search_classes : function(){
        var search_string = $("#txt_search_classes").val();
        var dataset = $("#hdn_qb_dataset").val();
        $.get("/query/builder_classes.js",{ search: search_string, dataset:dataset});
    },
    select_class : function(class_uri, class_name){
        $("#tbl_classes_search_result").hide("fast");
        QueryBuilder.select_body($("#div_selected_class"),class_name);
    }
};
    