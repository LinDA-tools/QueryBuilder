if (typeof QueryBuilder == 'undefined') {
    QueryBuilder = {};
}

QueryBuilder = {
    //The methods related to datasets
    datasets : {
        //this method resets the dataset selected
        reset : function(){
            $(".done-dataset").hide("fast");
            $("#div_qb_select_class").hide("fast");
            $(".clear-dataset").show("fast");
            QueryBuilder.reset_searched_class();
        },
        //this method is called when the dataset is selected from the dropdown list
        select : function(dataset){
            $("#div_qb_select_class").show("fast");
            $("#dd_select_dataset").hide("fast");
            QueryBuilder.select_body($("#div_select_dataset"),dataset);
            $("#hdn_qb_dataset").attr("value",dataset);
            //Utils.flash.notice("Selected dataset : "+dataset);
        },
        //this method returns the selected dataset
        //return String
        get_selected : function(){
            return $("#hdn_qb_dataset").val();
        }
    },
    select_body : function(element,body){
        element.find(".select-body").first().html(body);
        element.show("fast");
    },
    //This method calls the ajax method to search for the classes
    search_classes : function(){
        $("#qb_class_search_loading").show();
        var search_string = $("#hdn_searched_class_value").val();
        var dataset = $("#hdn_qb_dataset").val();
        $.get("/query/builder_classes.js",{ search: search_string, dataset:dataset});
    },
    reset_searched_class : function(){
        $(".clear-search-class").show("fast");
        $("#tbl_classes_search_result").html("");
        $("#tbl_classes_search_result").show();
        $(".done-search-class").hide("fast");
        $("#txt_search_classes").val("");
        $("#hdn_qb_class").val("");
        $("#div_classes_search_more").hide("fast");
        QueryBuilder.hide_equivalent_sparql_query();
        QueryBuilder.hide_searched_query_results();
        QueryBuilder.properties.reset();
    },
    generate_equivalent_sparql_query : function(){
        var query = "";
        query += SPARQL.prefix.rdf;
        query += SPARQL.prefix.rdfs;
        query += "SELECT ?concept ?label WHERE \n{ ?concept rdf:type <"+$("#hdn_qb_class").val()+">.\n ?concept rdfs:label ?label.\n";
        query += QueryBuilder.properties.get_subclasses_triples();
        query += QueryBuilder.properties.get_properties_triples();
        query += "FILTER(langMatches(lang(?label), \"EN\"))}\n LIMIT 200";
        $("#txt_sparql_query").val(query);
    }
    ,
    show_equivalent_sparql_query : function(){
        QueryBuilder.generate_equivalent_sparql_query();
        $(".qb-equivalent-query-main").show("fast");
    },
    hide_equivalent_sparql_query : function(){
        $(".qb-equivalent-query-main").hide("fast");
    },
    hide_searched_query_results : function(){
        $("#sparql_results_container").hide("fast");
    },
    search_classes_change : function(){
        var search = $("#txt_search_classes").val();
        if(search != undefined){
            search = search.trim();
            if(search.length >= 3){
                 var searched_index = search.substring(0,3);
                 if(searched_index != $("#hdn_searched_class_value").val()){
                    $("#hdn_searched_class_value").val(searched_index);
                    QueryBuilder.search_classes();
                 }else if($("#hdn_done_searching_class").val() == "true"){
                    QueryBuilder.classes.validate();
                 }
                
            }
            else{
                $("#hdn_searched_class_value").val("");
                $("#tbl_classes_search_result").hide("fast");
                $("#hdn_done_searching_class").val("false");
                $("#qb_class_search_error").hide("fast");
            }
        }
    },

    //The methods related to classes
    classes : {
        validate : function(){
            var search_strings = $("#txt_search_classes").val().trim().toLowerCase().split(" ");
            $("#tbl_classes_search_result").find("a").each(function(index){
                $(this).html(QueryBuilder.classes.get_searched_result_item($(this)));
                var a_value = $(this).html().toLowerCase();
                var is_present = true;
                for(var i=0;i<search_strings.length;i++){
                    if(a_value.indexOf(search_strings[i]) < 0){
                        is_present = false;
                        break;
                    }
                    else{
                        var start_index = a_value.indexOf(search_strings[i]);
                        var end_index = start_index + search_strings[i].length ;
                        a_value = a_value.splice(end_index, 0,'$');
                        a_value = a_value.splice(start_index, 0,  '#');
                    }
                }
                if(is_present){
                    $(this).html(a_value.replace(/\#/g,'<strong>').replace(/\$/g,'</strong>'));
                    $(this).show();
                }
                else
                    $(this).hide();
            });
            QueryBuilder.classes.check_empty_error();
            
        },
        check_empty_error : function(){
            if($("#tbl_classes_search_result").find("a:visible").length <= 0){
                var search = $("#txt_search_classes").val().trim();
                $("#qb_class_search_error").find(".alert").first().html("No classes found matching \""+search+"\"");
                $("#qb_class_search_error").show();
            }
            else{
                $("#qb_class_search_error").hide("fast");
            }
        },
        get_searched_result_item : function(e){
            return e.html().replace(/\<strong\>/g,'').replace(/\<\/strong\>/g,'');
        },
        get_selected_class : function(){
            return $("#hdn_qb_class").val();
        },
        //this method returns a hashmap containing examples of a class
        get_examples_action_url : function(class_uri){
            return "/query/class_examples?class="+class_uri+"&dataset="+QueryBuilder.datasets.get_selected();
        },
        select : function(class_uri, class_name){
            $("#hdn_qb_class").val(class_uri);
            $("#tbl_classes_search_result").hide("fast");
            $(".clear-search-class").hide("fast");
            QueryBuilder.select_body($("#div_selected_class"),"<strong>"+class_name+"</strong>");
            QueryBuilder.show_equivalent_sparql_query();
            QueryBuilder.properties.generate();
            $("#div_classes_search_more").show("fast");
            $("#btn_classes_search_more").html("More details on "+truncate(class_name,25,'...') );
            $("#btn_classes_search_more").attr("onclick","Utils.show_uri_viewer('"+class_uri+"')");
            $("#property_main_subclass_header").attr("uri",class_uri);
            //Utils.flash.notice("Selected class : "+class_name + " &lt;"+class_uri+"&gt;");
            QueryBuilder.classes.add_class_details($("#div_selected_class"),class_uri);
        },
        add_class_details : function(element,class_uri){
            $.getJSON(QueryBuilder.classes.get_examples_action_url(class_uri),function(data){
                var element_append_html = "&nbsp;&nbsp;&nbsp;<span class='badge'>"+data.total_objects.toString()+"</span>";
                if(data.total_objects > 0){
                    element_append_html += "&nbsp;&nbsp;<small>(&nbsp;";
                    for(i=0;i<data.sample_objects.length;i++){
                        if(i>0)
                            element_append_html += ",&nbsp;"
                        element_append_html += data.sample_objects[i]["label"]
                    }
                    element_append_html += "&nbsp;)</small>";   
                }
                element.find("strong").after(element_append_html);
            });
        }
    
    },

    //the methods related to properties
    properties : {
        generate : function(){
            QueryBuilder.properties.get_properties_for_selected_class();
            $("#div_qb_properties").show("fast");
        },
        hide : function(){
           $("#div_qb_properties").hide("fast"); 
        },
        reset : function(){
            $("#qb_properties_properties_selected_filters_header").hide();
            $("#qb_properties_properties_selected_filters_list").html("");
            $("#qb_properties_properties_selected_filters_list").hide();
            QueryBuilder.properties.hide();
            QueryBuilder.properties.reset_subclasses();

        },
        reset_subclasses : function(){
            $(".property-subclass-individual").remove();
            $("#property_main_subclass_header").find("button").first().show();
            $(".property-subclass-group").click();
        },
        get_subclasses : function(class_uri){
            $("#qb_properties_sub_classes_loading").show();
            $.get("/query/subclasses.js?dataset="+QueryBuilder.datasets.get_selected()+"&class_uri="+class_uri);
        },
        get_subclasses_for_selected_class : function(){
            QueryBuilder.properties.get_subclasses(QueryBuilder.classes.get_selected_class());
        },
        get_properties_for_selected_class : function(){
            $("#qb_properties_properties_object_loading").show();
            $("#qb_properties_properties_datatype_loading").show();
            /*
            if(all)
                $("#btn_properties_properties_"+type+"_more").hide("fast");
            else
                $("#btn_properties_properties_"+type+"_more").show("fast");*/
            $.get("/query/class_properties.js?dataset="+QueryBuilder.datasets.get_selected()+"&class_uri="+QueryBuilder.classes.get_selected_class());
            $(".cb-property-range-all").each(function(index){
                $(this).prop("checked",true);
            });
        },
        get_schema_properties_for_selected_class : function(){
            $("#property_main_schema_properties_group").html("");
            $("#qb_properties_schema_properties_loading").show();
            $.get("/query/class_schema_properties.js?dataset="+QueryBuilder.datasets.get_selected()+"&class_uri="+QueryBuilder.classes.get_selected_class());

        },
        get_subclasses_triples : function(){
            var result = "";
            var all = false;
            $(".property-subclass-group").each(function(index){
                if($(this).attr("clicked") == "true")
                    all = true;
            });
            if(!all){
                var subclasses = [];
                $(".property-subclass-individual").each(function(index){
                    if($(this).attr("clicked") == "true"){
                        subclasses.push("<"+$(this).attr("uri")+">");
                    }
                        
                });
                if(subclasses.length > 0){
                    for(var i=0;i < subclasses.length ; i++){
                        if(result != "")
                            result += "UNION \n"
                        result += "{?concept rdf:type "+subclasses[i]+"} ";
                    }
                    result += " .\n"
                }
            }

            return result;
        },
        get_properties_triples : function(){
            var result = "";
            $("#qb_properties_properties_selected_filters_list").find(".list-item").each(function(index){
                if($(this).attr("filter-type") == 'object'){
                    var objects = $(this).attr("filter-value").split(",");
                    var property_uri = $(this).attr("property-uri");
                    for(var i=0;i<objects.length;i++){
                        if(i>0)
                            result += " UNION ";
                        result += "{ ?concept <"+property_uri+"> <"+objects[i]+"> }";
                    }
                    result += ".\n"
                }
            });
            return result;
        },
        select_subclass : function(uri){

            $("#property_main_subclasses").find(".list-group-item").each(function(index){
                var html = "";
                if($(this).attr("uri") == uri){
                    if($(this).attr("clicked") == "true"){
                        $(this).attr("clicked","false");
                    }else{
                        html += "<span class='glyphicon glyphicon-ok'></span>&nbsp;&nbsp;";
                        $(this).attr("clicked","true");
                        if(uri == "all"){
                            $(".property-subclass-individual").each(function(i){
                                $(this).attr("clicked","false");
                                $(this).html($(this).attr("display-name"));
                            });
                        }else{
                            $(".property-subclass-group").each(function(i){
                                $(this).attr("clicked","false");
                                $(this).html($(this).attr("display-name"));
                            });
                        }
                    }
                    if(uri == "all")
                            html += "<strong>"
                    html += $(this).attr("display-name");
                    if(uri == "all")
                        html += "</strong>";
                    $(this).html(html);       
                }
            });
            QueryBuilder.generate_equivalent_sparql_query();
        },
        //This method assigns colors to the badges of ranges of properties
        generate_range_badge_colors : function(){
            var colors =    [  "#E52B50","#9966CC","#007FFF","#964B00","#0095B6","#800020","#CD7F32","#702963","#007BA7","#808000",
                                "#D2B48C","#483C32","#FF4500", "#FFA500", "#D1E231", "#1C2841", "#FA8072", "#7B3F00", "#2F4F4F",
                                "#483D8B", "#FFD700", "#3CB371", "#BC8F8F", "#FF69B4", "#00CED1", "#0000CD"
                            ];
            var badge_classes = [".span-property-range-data",".span-property-range-object"];
            for(var i=0;i<badge_classes.length;i++){
                var color_counter = 0;
                var range_color_lookup = {};
                $(badge_classes[i]).each(function(index){
                    var range_name = $(this).html();
                    if(range_color_lookup[range_name] == undefined){
                        range_color_lookup[range_name] = colors[color_counter];
                        color_counter++;
                        if(color_counter>=colors.length)
                            color_counter = 0;
                    }
                    $(this).attr("style","background-color:"+range_color_lookup[range_name]+";");
                });
            }
        },
        //This function is called when a property is clicked 
        // type is "object" or "datatype"
        property_click : function(uri, name, type, range_uri, range_name, count){
            show_loading();
            $.get("/query/property_ranges.js?property_uri="+uri+"&type="+type+"&dataset="+QueryBuilder.datasets.get_selected()+"&property_name="+name+"&range_uri="+range_uri+"&range_name="+range_name+"&count="+count);
        },
        //this method returns a comma separated string of selected properties
        // returns "ALL" if all of them are checked
        get_checked_properties : function(){
            var all_ranges = $('.cb-property-range').map(function() {return this.value;}).get().join(',');
            var checked_ranges = $('.cb-property-range:checked').map(function() {return this.value;}).get().join(',');
            return checked_ranges;
        },
        click_check_all : function(type){
            var item = $("#cb_property_range_all_"+type);
            var to_check = false;
            if(item.prop('checked'))
                to_check = true;
            $(".cb-property-range").each(function(index){
                if($(this).attr("range-type") == type){
                    $(this).prop('checked',to_check);
                }
            });
        },
        get_clicked_filter_property : function(){
            return $("#hdn_selector_property_uri").val();
        },
        filter : {
            add_objects : function(property_uri, property_name,  data){
                var identifier = QueryBuilder.properties.filter.get_new_list_identifier();
                $("#qb_properties_properties_selected_filters_header").show();
                $("#qb_properties_properties_selected_filters_list").show();
                var uris = "";
                var names = "";
                for(var i=0;i<data.length;i++){
                    if(i>0){
                        uris += ",";
                        names += ", ";
                    }
                    uris += data[i].uri;
                    names += "'"+data[i].name+"'";
                }
                var div_html = "<div id='qb_properties_properties_selected_filters_list_item_"+identifier+"' class=\"alert alert-warning list-item\" property-uri=\""+property_uri+"\" filter-value=\""+uris+"\" identifier=\""+identifier+"\" filter-type='object'>";
                div_html += "<div class='row'><div class='col-md-10'>";
                div_html += "<strong>"+property_name+"</strong> "+names;
                div_html += "</div>";
                div_html += "<div class='col-md-2'><span class=\"glyphicon glyphicon-remove clickable pull-right\" onclick=\"QueryBuilder.properties.filter.remove('"+identifier+"')\"></span></div>"
                div_html += "</div></div>";
                $("#qb_properties_properties_selected_filters_list").append(div_html);
                QueryBuilder.generate_equivalent_sparql_query();
                Utils.flash.success("Added objects "+names+" to filter for "+property_name);
            },
            add_data_filter : function(property_uri, property_name, data_filter){
                var identifier = QueryBuilder.properties.filter.get_new_list_identifier();
                $("#qb_properties_properties_selected_filters_header").show();
                $("#qb_properties_properties_selected_filters_list").show();
                var div_html = "<div id='qb_properties_properties_selected_filters_list_item_"+identifier+"' class=\"alert alert-warning list-item\" property-uri=\""+property_uri+"\"  identifier=\""+identifier+"\" filter-type='data'>";
                div_html += "<div class='row'><div class='col-md-10'>";
                div_html += "<strong>"+property_name+"</strong> "+data_filter;
                div_html += "</div>";
                div_html += "<div class='col-md-2'><span class=\"glyphicon glyphicon-remove clickable pull-right\" onclick=\"QueryBuilder.properties.filter.remove('"+identifier+"')\"></span></div>"
                div_html += "</div></div>";
                $("#qb_properties_properties_selected_filters_list").append(div_html);
                QueryBuilder.generate_equivalent_sparql_query();
                Utils.flash.success("Added data filter "+data_filter+" to filter for "+property_name);

            },
            //removes the filter
            remove : function(identifier){
                var list_item = $("#qb_properties_properties_selected_filters_list_item_"+identifier);
                list_item.hide("fast");
                setTimeout(function(){
                    list_item.remove();
                    if($("#qb_properties_properties_selected_filters_list").find(".list-item").length <= 0){
                        $("#qb_properties_properties_selected_filters_header").hide("fast");
                        $("#qb_properties_properties_selected_filters_list").hide("fast");
                    }
                    QueryBuilder.generate_equivalent_sparql_query();
                }, 500);
            },
            get_new_list_identifier : function(){
                var max_id=0;
                $("#qb_properties_properties_selected_filters_list").find(".list-item").each(function(index){
                    if(parseInt($(this).attr("identifier")) > max_id)
                        max_id = parseInt($(this).attr("identifier"));
                });
                return (max_id+1).toString();
            }
        }
    },

    // This contains methods for objects
    objects : {
            validate : function(){
            var search_strings = $("#txt_search_objects").val().trim().toLowerCase().split(" ");
            $("#tbl_objects_search_result").find("a").each(function(index){
                $(this).html(QueryBuilder.classes.get_searched_result_item($(this)));
                var a_value = $(this).html().toLowerCase();
                var is_present = true;
                if(!$(this).hasClass('selected')){
                    for(var i=0;i<search_strings.length;i++){
                        if(a_value.indexOf(search_strings[i]) < 0){
                            is_present = false;
                            break;
                        }
                        else{
                            var start_index = a_value.indexOf(search_strings[i]);
                            var end_index = start_index + search_strings[i].length ;
                            a_value = a_value.splice(end_index, 0,'$');
                            a_value = a_value.splice(start_index, 0,  '#');
                        }
                    }
                }
                if(is_present){
                    $(this).html(a_value.replace(/\#/g,'<strong>').replace(/\$/g,'</strong>'));
                    $(this).show();
                }
                else
                    $(this).hide();
            });
            QueryBuilder.objects.check_empty_error();
            
        },
        check_empty_error : function(){
            if($("#tbl_objects_search_result").find("a:visible").length <= 0){
                var search = $("#txt_search_objects").val().trim();
                $("#qb_object_search_error").find(".alert").first().html("No objects found matching \""+search+"\"");
                $("#qb_object_search_error").show();
            }
            else{
                $("#qb_object_search_error").hide("fast");
            }
        },
        get_searched_result_item : function(e){
            return e.html().replace(/\<strong\>/g,'').replace(/\<\/strong\>/g,'');
        },
        search_change : function(){
            var search = $("#txt_search_objects").val();
            if(search != undefined){
                search = search.trim();
                if(search.length >= 3){
                     var searched_index = search.substring(0,2);
                     if(searched_index != $("#hdn_searched_object_value").val()){
                        $("#hdn_searched_object_value").val(searched_index);
                        QueryBuilder.objects.search();
                     }else if($("#hdn_done_searching_object").val() == "true"){
                        QueryBuilder.objects.validate();
                     }
                    
                }
                else{
                    $("#hdn_searched_oject_value").val("");
                    $("#tbl_objects_search_result").hide("fast");
                    $("#hdn_done_searching_object").val("false");
                    $("#qb_object_search_error").hide("fast");
                }
            }
        },
        search : function(){
            $("#qb_object_search_loading").show();
            var search_string = $("#hdn_searched_object_value").val();
            var classes = $("#hdn_objects_of_class").val();
            var dataset = $("#hdn_qb_dataset").val();
            var for_class = QueryBuilder.classes.get_selected_class();
            var for_property = QueryBuilder.properties.get_clicked_filter_property();
            $.get("/query/builder_objects.js",{ search: search_string, dataset:dataset, classes : classes, for_class: for_class, for_property : for_property}); 
        },
        select : function(object_uri, object_name){
            if(!QueryBuilder.objects.is_object_added(object_uri)){
                $("#p_selected_objects").append("<span object-name=\""+object_name+"\" uri='"+object_uri+"' class='label label-warning selected-objects' >"+object_name+"&nbsp;<span class=\"glyphicon glyphicon-remove clickable\" onclick=\"QueryBuilder.objects.delete_selected('"+object_uri+"')\"></span></span></span>&nbsp;")
            }
            QueryBuilder.objects.hide_object_tile(object_uri);
            //Utils.flash.notice("Successfully added object "+object_name);

        },
        hide_object_tile : function(object_uri){
            $("#tbl_objects_search_result").find(".list-group-item").each(function(index){
                if($(this).attr("uri") == object_uri){
                    $(this).addClass("selected");
                    $(this).hide("fast");
                }
            });
        },
        is_object_added : function(object_uri){
            result = false;
            $("#p_selected_objects").find(".selected-objects").each(function(index){
                if($(this).attr("uri") == object_uri){
                    result = true;
                }
            });
            return result;
        },
        delete_selected : function(object_uri){
            $("#p_selected_objects").find(".selected-objects").each(function(index){
                if($(this).attr("uri") == object_uri){
                    $(this).hide("fast");
                }
            }); 
            $("#tbl_objects_search_result").find(".list-group-item").each(function(index){
                if($(this).attr("uri") == object_uri){
                    $(this).removeClass("selected");
                }
            });
            QueryBuilder.objects.validate();
        },
        get_selected_objects : function(){
            result = [];
            $("#p_selected_objects").find(".selected-objects").each(function(index){
                result.push({name : $(this).attr("object-name"), uri : $(this).attr("uri")})
            }); 
            return result;
        },
        done_click : function(){
            if($("#hdn_selector_type").val()=="object"){
                var selected_objects = QueryBuilder.objects.get_selected_objects();
                if(selected_objects.length > 0){
                    QueryBuilder.properties.filter.add_objects($("#hdn_selector_property_uri").val(),$("#hdn_selector_property_name").val(),selected_objects);
                }
            }
            else{
                QueryBuilder.properties.filter.add_data_filter($("#hdn_selector_property_uri").val(),$("#hdn_selector_property_name").val(),$("#txt_filter_datatype").val());
            }
            $("#class_selector_modal").modal('hide');
        }

    }


};
    