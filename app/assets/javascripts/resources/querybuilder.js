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
        QueryBuilder.reset_searched_class();
    },
    search_classes : function(){
        show_loading();
        var search_string = $("#txt_search_classes").val();
        var dataset = $("#hdn_qb_dataset").val();
        $.get("/query/builder_classes.js",{ search: search_string, dataset:dataset});
    },
    select_class : function(class_uri, class_name){
        $("#tbl_classes_search_result").hide("fast");
        $(".clear-search-class").hide("fast");
        QueryBuilder.select_body($("#div_selected_class"),class_name);
        $("#hdn_qb_class").val(class_uri);
        QueryBuilder.show_equivalent_sparql_query();

    },
    reset_searched_class : function(){
        $(".clear-search-class").show("fast");
        $("#tbl_classes_search_result").find("tbody").html("");
        $("#tbl_classes_search_result").show();
        $(".done-search-class").hide("fast");
        $("#txt_search_classes").val("");
        $("#hdn_qb_class").val("");
        QueryBuilder.hide_equivalent_sparql_query();
    },
    show_equivalent_sparql_query : function(){
        var query = "";
        query += SPARQL.prefix.rdf;
        query += SPARQL.prefix.rdfs;
        query += "SELECT ?concept ?label WHERE \n{ ?concept rdf:type <"+$("#hdn_qb_class").val()+">.\n ?concept rdfs:label ?label.\n";
        query += "FILTER(langMatches(lang(?label), \"EN\"))}\n LIMIT 200";
        $("#txt_sparql_query").html(query);
        $(".qb-equivalent-query-main").show("fast");
    },
    hide_equivalent_sparql_query : function(){
        $(".qb-equivalent-query-main").hide("fast");
    }

};
    