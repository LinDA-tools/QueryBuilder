if (typeof QueryBuilder == 'undefined') {
    QueryBuilder = {};
}

var _tmp = null; //a testing variable

var triples = [];
var filters = [];
var lastSelector = null; // temporary stores the element of the last data or object property chosen

var currTripId = null;
var currVar = null;

var propSetting = {};

var propLoaded = false;

var noSelectedItem = false;

var rangeUri = null;

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
            /////////////////////////////////////////////////////////////////////////////////////////
            $("#div_all_classes").show("fast");
            $("#btn_show_all_classes").attr("onclick","QueryBuilder.show_all_classes('"+dataset+"')");
            /////////////////////////////////////////////////////////////////////////////////////////
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
    /////////////////////////////////////////////////////////////////////////////////////////
    //This method calls the ajax method to show all classes in dataset
    show_all_classes: function(dataset){
       $("#loading").show();
	var dataset = $("#hdn_qb_dataset").val();
	$.get("/query/show_all_classes.js",{ dataset:dataset});
    },
    done_showing_classes : function(){
    	$("#all_classes_list_modal").modal("hide");
    },
    select_class_from_list: function(uri, name){
    	 $("#div_all_classes").hide("fast");
    	QueryBuilder.done_showing_classes();
    	QueryBuilder.classes.select(uri, name);
    },
    //////////////////////////////////////////////////////////////////////////////////////////

    //This method calls the ajax method to search for the classes
    search_classes : function(){
        $("#qb_class_search_loading").show();
        var search_string = $("#hdn_searched_class_value").val();
        var dataset = $("#hdn_qb_dataset").val();
	      var force_uri_search = $('#force_uri_search').prop('checked');
        $.get("/query/builder_classes.js",{ search: search_string, dataset:dataset, force_uri_search:force_uri_search});
    },
    reset_searched_class : function(concept){
        $(".clear-search-class").show("fast");
        $("#div_all_classes").show("fast");
        $("#tbl_classes_search_result").html("");
        $("#tbl_classes_search_result").show();
        $(".done-search-class").hide("fast");
        $("#txt_search_classes").val("");
        $("#hdn_qb_class").val("");
        $(".span-more-subclasses").remove();
        $("#div_classes_search_more").hide("fast");
        $(".select-class-subclass-row").remove();


		    var id = $("div#div_selected_class > div.row > div.select-body").attr('triple-id')
        var variable = $("div#div_selected_class > div.row > div.select-body").attr('variable')
		    QueryBuilder.removeTriplesAndFilters(id);
        QueryBuilder.removeConnectingTriples(variable);

        //$("#div_classes_search_result > div.col-md-12 > div#div_selected_class").html("");
        noSelectedItem = true;

        //if no classes.. close everything
        if ($("div.multipleClass").length == 0){
          $('.div_qb_select_class').hide();
          $('.div_qb_properties').hide();
          $('#qb-equivalent-query-main').hide();
          QueryBuilder.hide_equivalent_sparql_query();
          QueryBuilder.hide_searched_query_results();
          QueryBuilder.properties.reset();
          selected_filter_values = {};
        } else {
          theItem = $($("div.multipleClass")[$("div.multipleClass").length-1]).parent();
          uri = $(theItem).find('div.multipleClass').attr('class-uri');

          $("#propertyHistogram").empty();
          $("#propertyHistogram").append(propSetting[uri]);
          $("#propertyHistogram").show();

          $("span#attach-multi-class-labels").find('div.alert').each(function(){
            $(this).addClass('alert alert-info');
            $(this).removeClass('alert alert-warning');
            $(this).css('border',"");
          });

          currVar = $(theItem).find("div.concept").attr('variable');
          currTripId = $(theItem).find("div.concept").attr('triple-id');

          $('#hdn_qb_class').val(uri);
          $(theItem).removeClass('alert alert-info');
          $(theItem).addClass('alert alert-warning');
          $(theItem).css('border',"solid 2px black");

          //QueryBuilder.properties.generate();
          QueryBuilder.generate_equivalent_sparql_query();
        }
    },
    add_another_class : function(){
        $(".clear-search-class").show("fast");
        $("#div_all_classes").show("fast");
        $("#tbl_classes_search_result").html("");
        $("#tbl_classes_search_result").show();
        $(".done-search-class").hide("fast");
        $("#txt_search_classes").val("");
        $("#hdn_qb_class").val("");
        $(".span-more-subclasses").remove();
        $("#div_classes_search_more").hide("fast");
        $(".select-class-subclass-row").remove();
        // QueryBuilder.hide_equivalent_sparql_query();
        // QueryBuilder.hide_searched_query_results();
        // QueryBuilder.properties.reset();
        selected_filter_values = {};
    },
    generate_equivalent_sparql_query : function(){
        var query = "";
        var properties_map = null;
        query += SPARQL.prefix.rdf;
        query += SPARQL.prefix.rdfs;

        query += "SELECT DISTINCT * {\n";
		noClasses = triples.length;
		$.each(triples,function(index,element){
			// if (noClasses > 1) query += "{\n";
			_triples = element['triples'];
			$.each(_triples,function(t_index,t_element){
        if (t_element['show'] == false) return true;
				if (t_element['optional']) query += "OPTIONAL { \n";
				if (t_element['minus']) query += "MINUS { \n";
				query += t_element['s'] + " " + t_element['p'] + " " + t_element['o'] + " . \n"
				if (t_element['minus']) query += "}\n";
				if (t_element['optional']) query += "}\n";

				if (t_element['filterId'] != null){
					var filterId = t_element['filterId'];
					_filters = QueryBuilder.get_filter(filterId);

					if (_filters != null){
						query += "FILTER ("
						$.each(_filters,function(f_index,f_element){
							if (f_element['junction'] != null) {
								if ((f_element['junction'] == 'and') || (f_element['junction'] == '&&')) query += " && ";
								if ((f_element['junction'] == 'or') || (f_element['junction'] == '||')) query += " || ";
							}
							if (_filters.length > 1) query += "(";
							query += f_element['var'] + " " + f_element['op'] + " \"" + f_element['val'] + "\""
							if(f_element['rangeUri'] != null){
								query += "^^<"+f_element['rangeUri']+">";
							}
							if (_filters.length > 1) query += ")";
						})
						query += ")\n"
					}
				}
			})

			// if (noClasses > 1) query += "}\n";

			// if (index <= (noClasses - 2)) query += "UNION\n"; // we might have multiple classes
		});


		 query += "}"
        query += "LIMIT "+$("#txt_sparql_query_limit").val();
        $("#txt_sparql_query").val(query);
    },
    get_filter : function(filterId){
	   toRet = null
       $.each(filters,function(index,element){
		   if(element['id'] == filterId){
		   		toRet =  element['filters']
		   }
       });
	   return toRet;
    },
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
                 $("#div_all_classes").hide("fast");
                 var force_uri_search = $('#force_uri_search').prop('checked');
                 if(force_uri_search != $("#hdn_force_uri_search_value").val() || searched_index != $("#hdn_searched_class_value").val()){
                    $("#hdn_searched_class_value").val(searched_index);
                    $("#hdn_force_uri_search_value").val(force_uri_search);
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
                $("#div_all_classes").show("fast");
            }
        }
    },
	addTriple: function(subject,predicate,object,optional_id, optional_value, optional_filterId){
		//	triples
		var trp = {};
		trp['s'] = subject
		trp['p'] = predicate
		trp['o'] = object

		id = "";
		if (optional_id == null){
			id = QueryBuilder.generateUUID();
		} else {
			id = optional_id
		}

		filterId = optional_filterId;
		if (optional_value){
			if (optional_filterId == null) {
				filterId = QueryBuilder.generateUUID();
			}

			trp['filterId'] = filterId
			trp['optional'] = true
		} else {
			trp['optional'] = false
		}

		_triples = [];
		found = false;
		toRemove = -1;
		$.each(triples, function(index,value){
			if(value['id'] == id){
				_triples = value['triples'];
				found = true;
				toRemove = index
			}
		})
		_triples.push(trp);


		toAdd = {}
		if (!found){
			toAdd['id'] = id;
		} else {
			toAdd['id'] = id;
			triples.splice(toRemove, 1);
		}
		toAdd['triples'] = _triples;

		triples.push(toAdd);

		if (optional_value){
			return filterId;
		} else {
			return id;
		}
	},
	addFilter: function(variable,op,value,optional_logOp,fid){
		var trp = {};
		trp['var'] = variable
		trp['op'] = op
		trp['val'] = value
		trp['junction'] = optional_logOp
		trp['rangeUri'] = rangeUri
		id = fid
		if (id == null){
			id = QueryBuilder.generateUUID();
		}


		_filters = [];
		found = false;
		toRemove = -1;
		$.each(filters, function(index,value){
			if(value['id'] == id){
				_filters = value['filters'];
				found = true;
				toRemove = index
			}
		})
		_filters.push(trp);


		toAdd = {}
		if (!found){
			toAdd['id'] = id;
		} else {
			toAdd['id'] = id;
			filters.splice(toRemove, 1);
		}
		toAdd['filters'] = _filters;
		filters.push(toAdd);
		return id;
	},
	addObjectFilter: function(filterUri, op, filterId, multiValue){
		item = -1;
		accessItem = -1;
		$.each(triples, function(index,value){
			_trips = value['triples'];
			$.each(_trips,function(i,v){
				if (v['filterId'] == filterId){
					accessItem = i
					item = index
				}
			})
		});


		theItem = triples[item]['triples'][accessItem]
	  if (!multiValue)
			triples[item]['triples'].splice(accessItem, 1);
		else
			theItem = JSON.parse(JSON.stringify(triples[item]['triples'][accessItem]));

    var clone = $.extend(true, {}, theItem);

    clone['show'] = false;

		theItem['o'] = filterUri;

		if (op == "!="){
			theItem['minus'] = true;
		}

		(triples[item]['triples']).push(theItem);
    (triples[item]['triples']).push(clone);

	},
	toggleOptional: function(filterId, optional){
		$.each(triples, function(index,value){
			$.each(value['triples'], function(i,v){
				if (v['filterId'] == filterId){
					triples[index]['triples'][i]['optional'] = optional;
				}
			})
		})
	},
	toVariable: function(varName){
		var str = "?"+varName.toLowerCase().replace(/\W+/g, "_")
		return str;
	},
	generateUUID: function() {
	    var d = new Date().getTime();
	    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	        var r = (d + Math.random()*16)%16 | 0;
	        d = Math.floor(d/16);
	        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
	    });
	    return uuid;
	},
	removeTriplesAndFilters: function(idToRemove){

		toRemoveT = -1;
		$.each(triples, function(index,value){
			if(value['id'] == idToRemove){
				toRemoveT = index;
			}
		})

		if (toRemoveT > -1) {
		    triples.splice(toRemoveT, 1);
		}

		// TO FIX
		toRemoveF = -1;
		$.each(filters, function(index,value){
			if(value['id'] == idToRemove){
				toRemoveF = index;
			}
		})

		if (toRemoveF > -1) {
		    filters.splice(toRemoveF, 1);
		}
	},
	removeCheckedFilter: function(filterId){

		toRemoveT = [];
		toRemoveTset = [];
		$.each(triples, function(index,value){
			_t = value['triples'];

      _mainT = {};
      _mainT['outer'] = index;
      _mainT['inner'] = [];
			$.each(_t, function(i,v){
				if(v['filterId'] == filterId){
          _mainT['inner'].push(i)
					// toRemoveTset = i;
					// toRemoveT = index
				}
			})
      toRemoveT.push(_mainT);
		})

    $.each(toRemoveT,function(index){
      if (toRemoveT[index]['inner'].length > 0){
        $.each(toRemoveT[index]['inner'].reverse(), function(idx){
          triples[toRemoveT[index]['outer']]['triples'].splice(toRemoveT[index]['inner'][idx], 1);
        })
      }
    })


		// if (toRemoveT > -1) {
		//     triples[toRemoveT]['triples'].splice(toRemoveTset, 1);
		// }

		toRemoveF = -1;
		$.each(filters, function(index,value){
			_f = value;
			if(value['id'] == filterId){
				toRemoveF = index;
			}
		})

		if (toRemoveF > -1) {
		    filters.splice(toRemoveF, 1);
		}
	},
  removeConnectingTriples: function(variable){
    toRemoveT = -1
    toRemoveTset = -1;
    $.each(triples, function(index,value){
      _t = value['triples'];

      $.each(_t, function(i,v){
        if(v['o'] == variable){
          toRemoveTset = i;
          toRemoveT = index
        }
      })
    })


    if ((toRemoveT > -1) && (toRemoveTset > -1)){
        triples[toRemoveT]['triples'].splice(toRemoveTset, 1);
    }
  },
  showhide: function(filterId, element){
    $.each(triples, function(index,value){
      _t = value['triples'];

      $.each(_t, function(i,v){
        if(v['filterId'] == filterId){
          if (v['show'] != null){
            v['show'] = !(v['show'])

            if (v['show']){
              $(element).removeClass('glyphicon-eye-close');
              $(element).addClass('glyphicon-eye-open');
            } else {
              $(element).removeClass('glyphicon-eye-open');
              $(element).addClass('glyphicon-eye-close');
            }
          }
        }
      })
    })
    QueryBuilder.generate_equivalent_sparql_query();
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
                        a_value = a_value.splice(start_index, 0,  '~');
                    }
                }
                if(is_present){
                    $(this).html(a_value.replace(/\~/g,'<strong>').replace(/\$/g,'</strong>'));
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
        //this method returns a url to retrieve  examples of a class
        get_examples_action_url : function(class_uri){
            return "/query/class_examples?dataset="+QueryBuilder.datasets.get_selected()+ "&class="+encodeURIComponent(class_uri);
        },
        //this method returns a url to subclasses  examples of a class
        get_subclasses_action_url : function(class_uri){
            return "/query/class_subclasses?dataset="+QueryBuilder.datasets.get_selected() + "&class="+encodeURIComponent(class_uri);
        },
        select : function(class_uri, class_name, varn){
            $("#btn_show_checked_properties_no").click();
            $("#hdn_qb_class").val(class_uri);
            $("#tbl_classes_search_result").hide("fast");
            $(".clear-search-class").hide("fast");

            QueryBuilder.select_body($("#div_selected_class"),"<strong>"+class_name+"</strong>");
            $("#div_selected_class").css('border',"solid 2px black")
            $("#div_classes_search_more").show("fast");
            $("#btn_classes_search_more").html("More details on "+truncate(class_name,25,'...') );
            $("#btn_classes_search_more").attr("onclick","Utils.show_uri_viewer('"+class_uri+"')");
            $("#property_main_subclass_header").attr("uri",class_uri);
            $("#property_main_subclasses").hide();
            //Utils.flash.notice("Selected class : "+class_name + " &lt;"+class_uri+"&gt;");
            $("#txt_sparql_query_limit").val(default_sparql_result_limit);

            QueryBuilder.classes.add_class_details($("#div_selected_class").find('.select-body').first(),class_uri,0);

      			var label = $("div#div_selected_class > div.row > div.col-md-10 > strong").html();
            var variable = "";
            if (varn == null)
              variable = QueryBuilder.toVariable(label);
            else {
              variable = QueryBuilder.toVariable(varn);
            }
      			var id = QueryBuilder.addTriple(variable,"a","<"+$("#hdn_qb_class").val()+">")

      			var selClass = $("div#div_selected_class > div.row > div.col-md-10");
      			$(selClass).attr('triple-id',id);
      			$(selClass).attr('variable',variable);
            $(selClass).addClass('concept');

            $("#propertyHistogram").html("");
            $("#propertyHistogram").append(propSetting['default']);

            var theSelectedClass = $("#div_selected_class")
            $(theSelectedClass).removeClass("alert-danger")

            var theXButton = $("#div_selected_class > div.row > div.select-right-actions > span.glyphicon-remove");

            $(theXButton).click(function(event){
              event.stopPropagation();
              QueryBuilder.reset_searched_class($(theSelectedClass));
            });
            $(theSelectedClass).click(function(event){
              QueryBuilder.classes.reload_property(class_uri,$(theSelectedClass));
            });


            //class_uri
            // var theDivs = $("#property_main_properties_object_group > div");
            // $.each(theDivs, function(index){
            //   if ($(this).attr('range') == $("#hdn_qb_class").val()){
            //     $($(this).find('div.row > div.col-md-1 > span')[0]).hide();
            //   }
            // });

      			QueryBuilder.show_equivalent_sparql_query();

      			QueryBuilder.properties.generate();
        },
        add_class_details : function(element,class_uri,tab_level){
            element.attr('class-uri',class_uri);
            element.find('strong').first().after("<span class='loading-image'>&nbsp;&nbsp;&nbsp;<img  height=\"10px\" src=\"/assets/horizontal-loading.gif\"></span>");
            $.getJSON(QueryBuilder.classes.get_examples_action_url(class_uri)).success(function(data){
                var element_append_html = "&nbsp;&nbsp;&nbsp;<span class='badge'>"+get_long_number_display(data.total_objects)+"</span>";
                if(data.total_objects > 0){
                    element_append_html += "&nbsp;&nbsp;<small>(&nbsp;";
                    for(i=0;i<data.sample_objects.length;i++){
                        if(i>0)
                            element_append_html += ",&nbsp;"
                        element_append_html += "<a onclick=\"Utils.show_uri_viewer('"+data.sample_objects[i]["uri"]+"')\" href=\"javascript:void(0);\">"+data.sample_objects[i]["label"]+"</a>"
                    }
                    element_append_html += "&nbsp;)</small>";
                }
                //element.find(".loading-image").first().remove();
                element.find("strong").after(element_append_html);
                if(tab_level > 0)
                    element.parent().find(".select-right-actions").first().append("<span class=\"glyphicon glyphicon-globe clickable pull-right\" onclick=\"QueryBuilder.classes.select_again('"+class_uri+"','"+element.find("strong").first().html()+"')\"></span>");
            }).always(function(){
                element.find(".loading-image").first().remove();
            });
            QueryBuilder.classes.add_subclasses_details(element,class_uri,tab_level);
        },
        add_subclasses_details : function(element,class_uri,tab_level){
            $.getJSON(QueryBuilder.classes.get_subclasses_action_url(class_uri),function(data){
                var right_element = element.parent().find(".select-right-actions").first();
                if(data.subclasses.length > 0){
                    if(tab_level == 0)
                        $("#property_main_subclasses").show();
                    right_element.prepend("<span class=\"glyphicon glyphicon-plus clickable span-more-subclasses\" class-uri=\""+class_uri+"\" onclick=\"QueryBuilder.classes.expand_selected_class('"+class_uri+"',"+tab_level.toString()+")\"></span>");

                    var after_html = "";
                    for(i=data.subclasses.length-1;i>=0;i--){
                        after_html = "<div class='row select-class-subclass-row' parent-class-uri=\""+class_uri+"\" style='display:none;' class-uri=\""+data.subclasses[i]['uri']+"\">";
                        after_html += "<div class='col-md-"+(tab_level+1).toString()+"'></div>";
                        after_html += "<div class=\"col-md-"+(9-tab_level).toString()+" select-class-subclass-body\" class-uri=\""+data.subclasses[i]['uri']+"\" parent-class-uri=\""+class_uri+"\"><strong>"+data.subclasses[i]['label']+"</strong></div>"
                        after_html += "<div class=\"col-md-2 select-right-actions\" ></div>";
                        after_html += "</div>";
                        element.parent().after(after_html);
                    }

                }
                else if(tab_level == 0)
                    $("#property_main_subclasses").hide();

				// right_element.prepend("<span class=\"glyphicon glyphicon-plus clickable span-more-subclasses\" onclick=\"QueryBuilder.classes.multipleClass('"+class_uri+"')\" style=\"padding-right:20px\"></span>")
            });
        },
        expand_selected_class : function(class_uri,tab_level){
            $(".span-more-subclasses").each(function(index){
                if($(this).attr("class-uri") == class_uri){
                    $(this).remove();
                }
            });
            $(".select-class-subclass-row").each(function(index){
                if($(this).attr("parent-class-uri") == class_uri){
                    $(this).show("fast");
                    QueryBuilder.classes.add_class_details($(this).find('.select-class-subclass-body').first(),$(this).attr("class-uri"),tab_level+1);
                }
            });
        },
        select_again : function(class_uri,class_name){
            QueryBuilder.reset_searched_class();
            QueryBuilder.classes.select(class_uri,class_name);
        },
		multipleClass : function(class_uri, variable){
			var currentSelectBox =  $("div#div_selected_class > div.row > div.col-md-10")[0]
			var clonedSelectedBox = $(currentSelectBox).clone();
			QueryBuilder.add_another_class();

			$(clonedSelectedBox).addClass('multipleClass')
			var newRow = $(document.createElement('div'))
			$(newRow).css({"padding": "15px", "margin-bottom": "20px", "border": "1px solid transparent", "border-radius": "4px", "display": "block"});
      $(newRow).addClass('alert alert-info')
      $(newRow).attr('variable',variable);

      var currClass = $('#hdn_qb_class').val();
      propSetting[currClass] = $("#propertyHistogram").clone();
			$(newRow).append($(clonedSelectedBox))

      var theXDiv = $(document.createElement('div'));
      $(theXDiv).addClass("col-md-2 select-right-actions remove")

      var theXSpan = $(document.createElement('span'));
      $(theXSpan).addClass("glyphicon glyphicon-remove clickable pull-right remove")
      $(theXDiv).append(theXSpan);
      $(newRow).append(theXDiv);
      $(newRow).append("<br clear='all' />");


      $(theXSpan).click(function(event){
        event.stopPropagation();
        QueryBuilder.classes.removeMultipleClass($(theXDiv));
      });
      $(newRow).click(function(event){
        QueryBuilder.classes.reload_property(class_uri,$(newRow));
      });

			var attachToElement = $("span#attach-multi-class-labels");
			attachToElement.append($(newRow))
		},
		removeMultipleClass: function(element){
			var id = $(element).parent().children(':first-child').attr('triple-id')
			QueryBuilder.removeTriplesAndFilters(id);
      var variable = $(element).parent().children(':first-child').attr('variable')
      QueryBuilder.removeConnectingTriples(variable);

			$(element).parent().remove();

      if (($("div.multipleClass").length == 0) &&
    ($("div#div_selected_class").length == 0)){
        $('.div_qb_select_class').hide();
        $('.div_qb_properties').hide();
        $('#qb-equivalent-query-main').hide();
        QueryBuilder.hide_equivalent_sparql_query();
        QueryBuilder.hide_searched_query_results();
        QueryBuilder.properties.reset();
        selected_filter_values = {};
      } else if ($("div#div_selected_class").length == 1){
        uri = $("div#div_selected_class > div > div").attr('class-uri')
        $("#propertyHistogram").html(propSetting[uri]);
        $('#hdn_qb_class').val(uri);
        QueryBuilder.generate_equivalent_sparql_query();
      } else {
        uri = $("div.multipleClass").attr('class-uri');
        $("#propertyHistogram").append(propSetting[uri]);
        $('#hdn_qb_class').val(uri);
        QueryBuilder.generate_equivalent_sparql_query();
      }
		},
    refine_search: function(class_uri,class_name,varn,property){
          var filVar = QueryBuilder.toVariable(varn);

          var selClass = null;//$("div#div_selected_class > div.row > div.col-md-10");
          if (noSelectedItem){
            selClass = $($("div.multipleClass")[$("div.multipleClass").length-1]);
          } else {
            selClass = $("div#div_selected_class > div.row > div.col-md-10");
          }

          var id = $(selClass).attr('triple-id');
          var variable = $(selClass).attr('variable');
          filterId = QueryBuilder.addTriple(variable,"<"+property+">",filVar,id,false,filterId);

          var currClass = $('#hdn_qb_class').val();
          propSetting[currClass] = $("#propertyHistogram").clone();

          if (!noSelectedItem){
            QueryBuilder.classes.multipleClass($('#hdn_qb_class').val(), varn);
          } else {
            $("span#attach-multi-class-labels").find('div.alert').each(function(){
              $(this).addClass('alert alert-info');
              $(this).removeClass('alert alert-warning');
              $(this).css('border',"");
            });
          }

          $('#btn_show_all_classes').hide();

          QueryBuilder.classes.select(class_uri, class_name, varn);
    },
    reload_property: function(uri, theItem){
        $("span#attach-multi-class-labels").find('div.alert').each(function(){
          $(this).addClass('alert alert-info');
          $(this).removeClass('alert alert-warning');
          $(this).css('border',"");
        });

        $("#div_selected_class").removeClass('alert alert-warning');
        $("#div_selected_class").addClass('alert alert-info');
        $("#div_selected_class").css('border',"");

        currClass = $('#hdn_qb_class').val();
        propSetting[currClass] = $("#propertyHistogram").clone();

        currVar = $(theItem).find("div.concept").attr('variable');
        currTripId = $(theItem).find("div.concept").attr('triple-id');

        $("#propertyHistogram").html("");
        $("#propertyHistogram").replaceWith(propSetting[uri]);

        $('#hdn_qb_class').val(uri);
        $(theItem).removeClass('alert alert-info');
        $(theItem).addClass('alert alert-warning');
        $(theItem).css('border',"solid 2px black");
      }
  },

  asyncClasses:{
    refine_search: function(class_uri,class_name,varn,property, callback){
          var filVar = QueryBuilder.toVariable(varn);

          var selClass = null;//$("div#div_selected_class > div.row > div.col-md-10");
          if (noSelectedItem){
            selClass = $($("div.multipleClass")[$("div.multipleClass").length-1]);
          } else {
            selClass = $("div#div_selected_class > div.row > div.col-md-10");
          }

          var id = $(selClass).attr('triple-id');
          var variable = $(selClass).attr('variable');
          filterId = QueryBuilder.addTriple(variable,"<"+property+">",filVar,id,false,filterId);

          var currClass = $('#hdn_qb_class').val();
          propSetting[currClass] = $("#propertyHistogram").clone();

          if (!noSelectedItem){
            QueryBuilder.classes.multipleClass($('#hdn_qb_class').val(), varn);
          } else {
            $("span#attach-multi-class-labels").find('div.alert').each(function(){
              $(this).addClass('alert alert-info');
              $(this).removeClass('alert alert-warning');
              $(this).css('border',"");
            });
          }

          $('#btn_show_all_classes').hide();

          QueryBuilder.asyncClasses.select(class_uri, class_name, varn, function(flag){
            callback(flag);
          });
    },
    select : function(class_uri, class_name, varn, callback){
        $("#btn_show_checked_properties_no").click();
        $("#hdn_qb_class").val(class_uri);
        $("#tbl_classes_search_result").hide("fast");
        $(".clear-search-class").hide("fast");

        QueryBuilder.select_body($("#div_selected_class"),"<strong>"+class_name+"</strong>");
        $("#div_selected_class").css('border',"solid 2px black")
        $("#div_classes_search_more").show("fast");
        $("#btn_classes_search_more").html("More details on "+truncate(class_name,25,'...') );
        $("#btn_classes_search_more").attr("onclick","Utils.show_uri_viewer('"+class_uri+"')");
        $("#property_main_subclass_header").attr("uri",class_uri);
        $("#property_main_subclasses").hide();
        //Utils.flash.notice("Selected class : "+class_name + " &lt;"+class_uri+"&gt;");
        $("#txt_sparql_query_limit").val(default_sparql_result_limit);

        QueryBuilder.classes.add_class_details($("#div_selected_class").find('.select-body').first(),class_uri,0);

        var label = $("div#div_selected_class > div.row > div.col-md-10 > strong").html();
        var variable = "";
        if (varn == null)
          variable = QueryBuilder.toVariable(label);
        else {
          variable = QueryBuilder.toVariable(varn);
        }
        var id = QueryBuilder.addTriple(variable,"a","<"+$("#hdn_qb_class").val()+">")

        var selClass = $("div#div_selected_class > div.row > div.col-md-10");
        $(selClass).attr('triple-id',id);
        $(selClass).attr('variable',variable);
        $(selClass).addClass('concept');

        $("#propertyHistogram").html("");
        $("#propertyHistogram").append(propSetting['default']);

        var theSelectedClass = $("#div_selected_class")
        $(theSelectedClass).removeClass("alert-danger")

        var theXButton = $("#div_selected_class > div.row > div.select-right-actions > span.glyphicon-remove");

        $(theXButton).click(function(event){
          event.stopPropagation();
          QueryBuilder.reset_searched_class($(theSelectedClass));
        });
        $(theSelectedClass).click(function(event){
          QueryBuilder.classes.reload_property(class_uri,$(theSelectedClass));
        });


        QueryBuilder.asyncClasses.generateProperties(function(flag){
          callback(flag);
        });
    },
    generateProperties : function(callback){
        $("#property_main_properties_datatype_group").hide();
        $("#property_main_properties_object_group").hide();
        $("#qb_properties_properties_object_loading").show();
        $("#qb_properties_properties_datatype_loading").show();

        $.get("/query/class_properties.js?dataset="+QueryBuilder.datasets.get_selected()+"&class_uri="+encodeURIComponent(QueryBuilder.classes.get_selected_class())).done(function(){
          callback(true);
        })
        $("#div_qb_properties").show("fast");
    },
  },

    //the methods related to properties
    properties : {
        will_show_properties_in_preview : function(){
            if($("#hdn_show_checked_properties").val() == "yes")
                return true ;
            else
                return false ;
        },
        generate : function(){
            $("#property_main_properties_datatype_group").hide();
            $("#property_main_properties_object_group").hide();
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
            $.get("/query/subclasses.js?dataset="+QueryBuilder.datasets.get_selected()+"&class_uri="+encodeURIComponent(class_uri));
        },
        get_subclasses_for_selected_class : function(){
            QueryBuilder.properties.get_subclasses(QueryBuilder.classes.get_selected_class());
        },
        get_properties_for_selected_class : function(){
            $("#qb_properties_properties_object_loading").show();
            $("#qb_properties_properties_datatype_loading").show();

      			// multClasses = $("div.multipleClass").length
      			// uriParams = "";
            //
      			// if (multClasses > 0){
      			// 	$("div.multipleClass").each(function(index,element){
      			// 		uriParams = uriParams + "&class_uri[]="+element.getAttribute('class-uri');
      			// 	})
            //
      			// 	uriParams = uriParams + "&class_uri[]="+encodeURIComponent(QueryBuilder.classes.get_selected_class());
      			// 	$.get("/query/class_properties.js?dataset="+QueryBuilder.datasets.get_selected()+uriParams);
            //
      			// } else {
      				$.get("/query/class_properties.js?dataset="+QueryBuilder.datasets.get_selected()+"&class_uri="+encodeURIComponent(QueryBuilder.classes.get_selected_class()));
      			//}

            // $(".cb-property-range-all").each(function(index){
 //                $(this).prop("checked",true);
 //            });
        },
        get_schema_properties_for_selected_class : function(){
            $("#property_main_schema_properties_group").html("");
            $("#qb_properties_schema_properties_loading").show();
            $.get("/query/class_schema_properties.js?dataset="+QueryBuilder.datasets.get_selected()+"&class_uri="+encodeURIComponent(QueryBuilder.classes.get_selected_class()));

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
            $.each(selected_filter_values,function(k,v){
                if(v.type == "object"){
                    // section for object type properties
                    if(v.filter_type == "not_equals"){
                        result += "?concept <"+v.property_uri+"> ?o_filter"+k.toString();
                    }
                    else{
                        for(j=0;j<v.value.length;j++){
                            if(j>0)
                                result += " UNION ";
                            result += "{ ?concept <"+v.property_uri+"> ?o_filter"+k.toString()+ "}";//<"+v.value[j]["uri"]+"> }";
                        }
                    }
                    result += ".\n"
                }
                else if(v.type == "data"){
                    //section for data type properties
                    result += "?concept <"+v.property_uri+"> ?d_filter"+k.toString()+".\n";
                }
            });
            /*

            This is now an old method. Getting the values from variable instead of the div

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
            */
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
            var original_colors = [  "#E52B50","#9966CC","#007FFF","#964B00","#0095B6","#800020","#CD7F32","#702963","#007BA7","#808000",
                                "#D2B48C","#483C32","#FF4500", "#FFA500", "#D1E231", "#1C2841", "#FA8072", "#7B3F00", "#2F4F4F",
                                "#483D8B", "#FFD700", "#3CB371", "#BC8F8F", "#FF69B4", "#00CED1", "#0000CD"
                            ];

            var badge_classes = [".span-property-range-data",".span-property-range-object"];
            var color_index = 0;
            for(var i=0;i<badge_classes.length;i++){
                var colors =  [];
                for(var j = 0 ; j<original_colors.length ; j++)
                    colors.push(original_colors[j]);
                var range_color_lookup = {};
                $(badge_classes[i]).each(function(index){
                    var range_name = $(this).html();
                    if(range_color_lookup[range_name] == undefined){
                        color_index = get_random_int(0,colors.length-1);
                        range_color_lookup[range_name] = colors[color_index];
                        colors.splice(color_index,1);
                        if(colors.length <= 0){
                            for(var k = 0 ; k<original_colors.length ; k++)
                                colors.push(original_colors[k]);
                        }
                    }
                    $(this).attr("style","background-color:"+range_color_lookup[range_name]+";");
                });
            }
        },
        //This function is called when a property is clicked
        // type is "object" or "datatype"
        property_click : function(uri, name, type, range_uri, range_name, count, element){
					rangeUri = range_uri;
            show_loading();

			lastSelector = element;

			$.get("/query/property_ranges.js?property_uri="+encodeURIComponent(uri)+"&type="+type+"&dataset="+QueryBuilder.datasets.get_selected()+"&property_name="+name+"&range_uri="+encodeURIComponent(range_uri)+"&range_name="+range_name+"&count="+count);

        },
        //this method returns a comma separated string of selected properties
        // returns "ALL" if all of them are checked
        get_checked_properties : function(){
            var all_ranges = $('.cb-property-range').map(function() {return this.value;}).get().join(',');
            var checked_ranges = $('.cb-property-range:checked').map(function() {return this.value;}).get().join(',');
            return checked_ranges;
        },
        get_checked_properties_map : function(){
            var checked_properties = $('.cb-property-range:checked').map(function() {return this.value;});
            var property_map = {};
            for(i=0;i<checked_properties.length;i++){
                property_map[get_uri_element_val(checked_properties[i])] = checked_properties[i];
            }
            return property_map;

        },
        click_check_all : function(type){
        			var to_check = $("#cb_property_range_all_"+type).is(':checked');

                  // var item = $("#cb_property_range_all_"+type);
      //
      //             if(item.prop('checked'))
      //                 to_check = true;
      			if (to_check){
              //remove any filters first
              $(".cb-property-range").each(function(index){
                  if($(this).attr("range-type") == type){
                    if ($(this).is(":checked")){
                      $(this).removeAttr("checked")
                      QueryBuilder.properties.checkbox_click($(this));
                    }
                  }
              });

          			$(".cb-property-range").each(function(index){
              			if($(this).attr("range-type") == type){
                        $(this).prop("checked", true )
            						QueryBuilder.properties.checkbox_click($(this));
              			}
          			});
      			} else {
          			$(".cb-property-range").each(function(index){
              			if($(this).attr("range-type") == type){
                      $(this).removeAttr("checked")
          						QueryBuilder.properties.checkbox_click($(this));
              			}
          			});
      			}
        },
        get_clicked_filter_property : function(){
            return $("#hdn_selector_property_uri").val();
        },
        checkbox_click : function(chkedBox){
        			addPropTrip = false;
        			// if ($(chkedBox).attr('id') == "cb_property_range_all_object"){
        			// 	if ($("cb_property_range_all_object:checked").length > 0){
        			// 		addPropTrip = true;
        			// 	}
        			// }

        			if ($(chkedBox).is(":checked")){
        				addPropTrip = true;
        			}

        			if ($(chkedBox).attr('filter-id')){
        				addPropTrip = false; //because we are toggeling an optional
        			}

        			var filVar = QueryBuilder.toVariable($(chkedBox).parent().parent().parent().attr('display-name'))

        			if (addPropTrip){
        				multClasses = $("div.multipleClass").length
        				uriParams = "";

        				var filterId = null;
        				// if (multClasses > 0){
        				// 	$("div.multipleClass").each(function(index,element){
        				// 		var id = element.getAttribute('triple-id');
        				// 		var variable = element.getAttribute('variable');
        				// 		//subject,predicate,object,optional_id
        				// 		filterId = QueryBuilder.addTriple(variable,"<"+$(chkedBox).val()+">",filVar,id,true,filterId);
        				// 	})
        				// }
                var selClass;
                var id;
                var variable;

                if (currTripId == null){
                  selClass = $("div#div_selected_class > div.row > div.col-md-10");
                  id = $(selClass).attr('triple-id');
                  variable = $(selClass).attr('variable');
                } else {
                  id = currTripId;
                  variable = currVar;
                }

        				filterId = QueryBuilder.addTriple(variable,"<"+$(chkedBox).val()+">",filVar,id,true,filterId);
        				$(chkedBox).attr('filter-id',filterId)
        	            // if(QueryBuilder.properties.will_show_properties_in_preview() == true){
        	            //     QueryBuilder.show_equivalent_sparql_query();
        	            // }
                if ($($(chkedBox).parent().prev().children()[0]).hasClass('glyphicon-filter')){
                  $($(chkedBox).parent().prev().children()[0]).hide()
                }
        			} else {
        				var filterId = $(chkedBox).attr('filter-id')
                $(chkedBox).removeAttr('filter-id');
                QueryBuilder.removeCheckedFilter(filterId);
        				QueryBuilder.toggleOptional(filterId,$(chkedBox).is(":checked"))

                if ($($(chkedBox).parent().prev().children()[0]).hasClass('glyphicon-filter')){
                  $($(chkedBox).parent().prev().children()[0]).show()
                }
        			}

        			 QueryBuilder.show_equivalent_sparql_query();
        },
        filter : {
            add_objects : function(property_uri, property_name,  data, filterId){

                $("#qb_properties_properties_selected_filters_header").show();
                $("#qb_properties_properties_selected_filters_list").show();

        				var div_html = "<div class=\"alert alert-warning list-item\" property-uri=\""+property_uri+"\"  filter-id=\""+filterId+"\" filter-type='data'>";
                        div_html += "<div class='row'><div class='col-md-8'>";
                        div_html += "<strong>"+property_name+"</strong> : "
        				$.each(data,function(index,element){
        					var uri = $(element).attr('uri');
        					var objname = $(element).attr('object-name');
        					var op = "="
        					if ($("#hdn_object_selector_filter_type").val() == "not_equals"){
        						op = "!="
        					}


        					div_html +=  " <strong><i>"+op+"</i></strong> <a href="+uri+">"+ objname + "</a> ";
        					QueryBuilder.addObjectFilter("<"+uri+">", op, filterId, ((data.length > 1) && (index > 0)));
        				})
                div_html += "</div>"; //col-md-8

                div_html += "<div class='col-md-2'><span class=\"glyphicon glyphicon-eye-close clickable pull-right\"  onclick=\"QueryBuilder.showhide('"+filterId+"',$(this))\"></span></div>" //col-md-2

                div_html += "<div class='col-md-2'><span class=\"glyphicon glyphicon-remove clickable pull-right\" onclick=\"QueryBuilder.properties.filter.remove('"+filterId+"',$(this))\"></span></div>" //col-md-2

        				div_html += "</div>" //row
        				div_html += "</div>" //alert


                $("#qb_properties_properties_selected_filters_list").append(div_html);


                QueryBuilder.generate_equivalent_sparql_query();
                Utils.flash.success("Added object filter for "+property_name);

            },
            add_data_filter : function(property_uri, property_name, data_filters,filterId){
				          $("#qb_properties_properties_selected_filters_header").show();
                  $("#qb_properties_properties_selected_filters_list").show();


          				// add triples to filters array - triples to main array are done in the previous call (i.e. done_click)

          				var div_html = "<div class=\"alert alert-warning list-item\" property-uri=\""+property_uri+"\"  filter-id=\""+filterId+"\" filter-type='data'>";
                          div_html += "<div class='row'><div class='col-md-10'>";
                          div_html += "<strong>"+property_name+"</strong> : "

            				$.each(data_filters,function(index,element){
            					var fil_value = $(element).attr('value');
            					var fil_val_op = $(element).attr('value-operator');
            					var op = $(element).attr('operator');
            					div_html +=  " <strong><i>"+op+"</i></strong> " + fil_val_op + " " + fil_value;

											console.log("operator: " + op);
											
            					QueryBuilder.addFilter(QueryBuilder.toVariable(property_name), fil_val_op, fil_value, op, filterId);
            				})
                          div_html += "</div>"; //col-md-10
          				div_html += "<div class='col-md-2'><span class=\"glyphicon glyphicon-remove clickable pull-right\" onclick=\"QueryBuilder.properties.filter.remove('"+filterId+"',$(this))\"></span></div>" //col-md-2

          				div_html += "</div>" //row
          				div_html += "</div>" //alert

                $("#qb_properties_properties_selected_filters_list").append(div_html);

		            QueryBuilder.generate_equivalent_sparql_query();
                Utils.flash.success("Added data filter for "+property_name);

            },
            //removes the filter
            remove : function(filterId,element){
        				// QueryBuilder.removeCheckedFilter(filterId)

        				var allCkbxs = $(".cb-property-range");
        				$.each(allCkbxs, function(index,element){
        					if($(element).attr('filter-id') == filterId){
                    QueryBuilder.properties.checkbox_click($(element));
                    $(element).show();
        						// $(element).removeAttr('filter-id');
        						// $(element).removeAttr('checked');
        					}
        				});

                $("#p_selected_objects > span").remove();
                $("#hdn_selector_property_uri").val("");
                $("#hdn_selector_property_name").val("");

        				$(element).parent().parent().parent().hide();
                QueryBuilder.show_equivalent_sparql_query();
            },
            get_new_list_identifier : function(){
                var max_id=0;
                $("#qb_properties_properties_selected_filters_list").find(".list-item").each(function(index){
                    if(parseInt($(this).attr("identifier")) > max_id)
                        max_id = parseInt($(this).attr("identifier"));
                });
                return (max_id+1).toString();
            },
            select_object_filter_type : function(filter_type){
                $("#hdn_object_selector_filter_type").attr("value",filter_type);
                var other_filter_type = "not_equals";
                if(filter_type == "not_equals")
                    other_filter_type = "equals";
                if($("#btn_object_selector_filter_type_"+filter_type).hasClass("btn-success") == false){
                    $("#btn_object_selector_filter_type_"+filter_type).addClass("btn-success");
                    $("#btn_object_selector_filter_type_"+other_filter_type).removeClass("btn-success");
                }
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
                    $(this).remove();
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
        				var allFilters = $("#p_selected_objects > span");
        				var propertyURI = $("#hdn_selector_property_uri").val();
        				var propertyName = $("#hdn_selector_property_name").val();

        				var checkBox = $(lastSelector).parent().children(':last-child').children('input')
        				var filterId = $(checkBox).attr('filter-id');

        				if (filterId == null){
        					$(checkBox).prop('checked', true);
        					QueryBuilder.properties.checkbox_click($(checkBox));
        					filterId = $(checkBox).attr('filter-id');
                }
                $(checkBox).prop("checked", false )
                QueryBuilder.toggleOptional(filterId,$(checkBox).is(":checked"))

      				QueryBuilder.properties.filter.add_objects(propertyURI,propertyName,allFilters,filterId);
              $(checkBox).hide();
            } else {
      				val = $("#txt_filter_datatype").val()

      				if (val != ""){
      					val_op = $("#hdn_val_operator").val()

      					if (val_op == ""){
      						val_op = "and"
      					}

      					op = $("#hdn_operator").val()
      					$("#p_selected_objects").append("<span value=\""+val+"\" operator='"+op+"' value-operator='"+val_op+"' class='label label-warning selected-objects' >"+op+" "+ val_op+ " "+val+"&nbsp;<span class=\"glyphicon glyphicon-remove clickable\"></span></span>&nbsp;")
      				}

      				var allFilters = $("#p_selected_objects > span");
      				var propertyURI = $("#hdn_selector_property_uri").val();
      				var propertyName = $("#hdn_selector_property_name").val();


      				var checkBox = $(lastSelector).parent().children(':last-child').children('input')
      				var filterId = $(checkBox).attr('filter-id');

      				if (filterId == null){
      					$(checkBox).prop('checked',true);
      					QueryBuilder.properties.checkbox_click($(checkBox));
      					filterId = $(checkBox).attr('filter-id');
      					//added this hack to get filterid
      				  $(checkBox).prop("checked", false )
                QueryBuilder.toggleOptional(filterId,$(checkBox).is(":checked"))
      				}

      				QueryBuilder.properties.filter.add_data_filter(propertyURI,propertyName,allFilters,filterId);
              $(checkBox).hide();
            }
            QueryBuilder.show_equivalent_sparql_query();
            $("#class_selector_modal").modal('hide');
    },
		add_value: function(){
			val_op = $("#hdn_val_operator").val()
			val = $("#txt_filter_datatype").val()
			op = $("#hdn_operator").val()

			$('#sel_text').html('Operator')
			$("#p_selected_objects").append("<span value=\""+val+"\" operator='"+op+"' value-operator='"+val_op+"' class='label label-warning selected-objects' >"+op+" "+ val_op+ " "+val+"&nbsp;<span class=\"glyphicon glyphicon-remove clickable\"></span></span>&nbsp;")

			$("#hdn_operator").val("");
			$("#txt_filter_datatype").val("");
			$("#choose_operator_dd").removeAttr("disabled");
			$("#choose_operator_dd").dropdown();
		}
    },
    convert : {
        configured : {
            check_validity_of_file_content : function(file_data){
                var result = { valid : true, description: ""};
                var blocks = QueryBuilder.convert.configured.get_string_blocks(file_data);
                var block_types = ["variable_dictionary","header","body","footer"];
                for(i=0;i<block_types.length;i++){
                    result.valid = QueryBuilder.convert.configured.check_file_body_item(blocks,block_types[i]);
                    if(result.valid == false){
                        result.description = "These seems to be some problem with the <strong>"+block_types[i]+"</strong> section of your template. Please correct it and upload again.";
                        break;
                    }
                }
                return result;
            },
            check_file_body_item : function(blocks,block_type){
                var result = false;

                var inside = false;
                var break_loop = false;
                for(i=0;i<blocks.length;i++){
                    if(blocks[i].charAt(0) == '{' && blocks[i].charAt(1) == '{' && blocks[i].charAt(blocks[i].length-1) == '}' && blocks[i].charAt(blocks[i].length-2) == '}')
                    {
                        if(blocks[i].indexOf("start") > -1 && inside == false){
                            if(blocks[i].indexOf(block_type) > -1){
                                inside = true;
                            }
                        }
                        else if(blocks[i].indexOf("start") > -1 && inside == true){
                            //nested block.
                            //will throw an errow.
                            break_loop = true;
                            result = false;
                        }
                        else if(inside == true && blocks[i].indexOf("end")){
                            result = true;
                            break_loop = true;
                        }
                    }
                    if(break_loop == true)
                        break;
                }
                return result;
            }
            ,
            handle_error_output : function(valid,error_description){
                if(valid == true){
                    $(".configured-download-file-ok").show("fast");
                }
                else{
                    $("#configured_download_error_message").html(error_description);
                    $(".configured-download-file-error").show("fast");
                }
            },
            handle_file_upload : function(evt) {
                $(".configured-download-file-ok").hide();
                $(".configured-download-file-error").hide();
                var files = evt.target.files; // FileList object
                var valid_file = false;
                var error_description = "";
                var output = [];
                var f = files[0];

                if(get_file_extension(f.name) != "txt"){
                    QueryBuilder.convert.configured.handle_error_output(false,"The file uploaded is not <strong>.txt</strong> file");
                }
                else{
                    output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                            f.size, ' bytes, last modified: ',
                            f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                            '</li>');
                    var reader = new FileReader();
                    var file_data = "";
                    reader.onload = function(e){
                        var file_validity =  QueryBuilder.convert.configured.check_validity_of_file_content(reader.result);
                        if(file_validity.valid == true){
                            var blocks = QueryBuilder.convert.configured.get_string_blocks(reader.result);
                            configured_convert.header = QueryBuilder.convert.configured.get_block_string_from_blocks(blocks,"header");
                            configured_convert.body = QueryBuilder.convert.configured.get_block_string_from_blocks(blocks,"body");
                            configured_convert.footer = QueryBuilder.convert.configured.get_block_string_from_blocks(blocks,"footer");
                            str_variable_dictionary = QueryBuilder.convert.configured.get_block_string_from_blocks(blocks,"variable_dictionary");
                            arr_variable_dictionary = str_variable_dictionary.split("\n");
                            configured_convert.variable_dictionary = [];
                            for(i=0;i<arr_variable_dictionary.length;i++){
                                arr_var = arr_variable_dictionary[i].split("=");
                                if(arr_var.length == 2){
                                    configured_convert.variable_dictionary.push({variable : arr_var[0].trim(), value: arr_var[1].trim()});
                                }
                            }
                        }
                        QueryBuilder.convert.configured.handle_error_output(file_validity.valid,file_validity.description);
                    };
                    reader.readAsText(f);
                }


              //document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';


            },



            get_block_string_from_blocks : function(blocks, block_type){
                var result = "";
                var inside = false;
                var break_loop = false;
                for(i=0;i<blocks.length;i++){
                    if(blocks[i].charAt(0) == '{' && blocks[i].charAt(1) == '{' && blocks[i].charAt(blocks[i].length-1) == '}' && blocks[i].charAt(blocks[i].length-2) == '}')
                    {
                        if(blocks[i].indexOf("start") > -1){
                            if(blocks[i].indexOf(block_type) > -1){
                                inside = true;
                            }
                        }
                        else if(inside == true && blocks[i].indexOf("end")){
                            result = blocks[i-1].substring(1,blocks[i-1].length-1);
                            break_loop = true;
                        }
                    }
                    if(break_loop == true)
                        break;
                }

                return result;

            },
            get_string_blocks : function(file_data){
                var result = [];
                var index_pairs = QueryBuilder.convert.configured.get_block_index_pairs(file_data);
                for(i=0;i<index_pairs.length;i++){
                    result.push(file_data.substring(index_pairs[i].start,index_pairs[i].end));
                    if(i<index_pairs.length-1){
                        result.push(file_data.substring(index_pairs[i].end,index_pairs[i+1].start));
                    }
                }
                return result;
            },
            get_block_index_pairs : function(file_data){
                var entered_block = false;
                var index_pairs = [];
                var start_index = 0;
                var end_index = 0;
                for(i=0;i<file_data.length-1;i++){
                    if(entered_block == false){
                        if(file_data.charAt(i) == '{' && file_data.charAt(i+1) == '{'){
                            start_index = i;
                            entered_block = true;
                            i=i+1;
                        }
                    }
                    else{
                        if(file_data.charAt(i) == '}' && file_data.charAt(i+1) == '}'){
                            end_index = i+2;
                            entered_block = false;
                            index_pairs.push({start: start_index, end : end_index});
                            i = i+1;
                        }
                    }
                }
                return index_pairs;
            },
                initiate_download : function(){
                    $(".div-configured-download").show("fast");
                    $("#btn_group_download").hide("fast");
                    $("#btn_download_configured_convert_template").attr("href","/query/configured_convert_template?selected_properties="+QueryBuilder.properties.get_checked_properties());
                    $(".configured-download-file-ok").hide();
                    $(".configured-download-file-error").hide();
                    $("#form_configured_template_files")[0].reset();
                },
                hide_download : function(motion){
                    if(motion != undefined && motion != ""){
                        $(".div-configured-download").hide("fast");
                        $("#btn_group_download").show("fast");
                    }
                    else{
                        $(".div-configured-download").hide();
                        $("#btn_group_download").show();
                    }
                }
        }, // end QueryBuilder.convert.configured
        json:{
                initiate_download : function(){
                    $("#btn_group_download").hide("fast");
                    $("#div_json_download").show("fast");

                },
                hide_download : function(motion){
                    if(motion != undefined && motion != ""){
                        $("#div_json_download").hide("fast");
                        $("#btn_group_download").show("fast");
                    }
                    else{
                        $("#div_json_download").hide();
                        $("#btn_group_download").show();
                    }
                }

        }//end QueryBuilder.convert.json
    }, // end QueryBuilder.convert
    equivalent_query : {
        handle_checked_properties : function(response){
            $("#hdn_show_checked_properties").val(response);
            if(response == "yes"){
                $("#btn_show_checked_properties_no").removeClass("btn-success");
                $("#btn_show_checked_properties_yes").addClass("btn-danger");
            }
            else if(response == "no"){
                $("#btn_show_checked_properties_no").addClass("btn-success");
                $("#btn_show_checked_properties_yes").removeClass("btn-danger");
            }
            QueryBuilder.show_equivalent_sparql_query();
        }
    }
};


function getUrlParameter(sParam)
{
     var sPageURL = window.location.search.substring(1);
     var sURLVariables = sPageURL.split('&');
     for (var i = 0; i < sURLVariables.length; i++)
     {
         var sParameterName = sURLVariables[i].split('=');
         if (sParameterName[0] == sParam)
         {
             return sParameterName[1];
         }
     }
 }

// function hasAllParameters(){
// 	if (getUrlParameter('dataset') == null) return false;
// 	if (getUrlParameter('classURI') == null) return false;
// 	if (getUrlParameter('classLabel') == null) return false;
// 	return true
// }
function hasAllParameters(){
	if (getUrlParameter('dataset') == null) return false;
	if (getUrlParameter('query') == null) return false;
	return true
}

function defaultPropSetting(){
  return "<div class=\"panel-heading\"><div class=\"row\"><div class=\"col-md-9\">Properties Histogram</div></div></div><div class=\"panel-body\"><div class=\"row\"><div class=\"col-md-12\"><small> Filter some specific properties of the selected concept by clicking on the coloured labels. You can add a new concept to your query by clicking on the <span class=\"glyphicon glyphicon-filter\"></span> button.</small></div></div></div><div class=\"panel-heading alert\" style=\"display:none;\" id=\"qb_properties_properties_selected_filters_header\">Selected filters</div><div class=\"list-group\" id=\"qb_properties_properties_selected_filters_list\" style=\"display:none;\"></div><div class=\"panel-heading alert\"><div class=\"row\"><div class=\"col-md-8\">Object Properties</div><div class=\"col-md-4\" style=\"float:right\"><label>Show Property as Optional:&nbsp;<input type='checkbox' id='cb_property_range_all_object'  class='cb-property-range-all'   onclick=\"QueryBuilder.properties.click_check_all('object');\"/></label></div></div></div><div class=\"list-group properties-list-group\" id=\"property_main_properties_object_group\" ></div><div class=\"row\" id=\"qb_properties_properties_object_loading\"><div class=\"col-md-12\"><center></center></div></div><div class=\"panel-heading alert\"><div class=\"row\"><div class=\"col-md-8\">Data type Properties</div><div class=\"col-md-4\" style=\"float:right\"><label>Show Property as Optional:&nbsp;<input type='checkbox' id='cb_property_range_all_data'  class='cb-property-range-all'  onclick=\"QueryBuilder.properties.click_check_all('data')\"/></label></div></div></div><div class=\"list-group properties-list-group\" id=\"property_main_properties_datatype_group\" ></div><div class=\"row\" id=\"qb_properties_properties_datatype_loading\"><div class=\"col-md-12\"><center></center></div></div></div>";
}

$(document).ready(function(){
  propSetting['default'] = defaultPropSetting();
  if (hasAllParameters()){
    var dataset = getUrlParameter('dataset');
    var query = getUrlParameter('query');

    QueryBuilder.datasets.select(dataset);

    var jsonQuery = JSON.parse(decodeURIComponent(query));

    var classes = jsonQuery['classes'];

    if (classes.length == 1){
      var theClass = classes[0];
      QueryBuilder.asyncClasses.select(theClass['o'],theClass['name'],theClass['s'], function(flag){
        onlyOnce(jsonQuery, theClass)
      });
    } else {
      //first try to find which class has no linking property
      $.each(classes, function(index){
        var theClass = $(this)[0];
        if (getLinkingProperty(jsonQuery, theClass['s']) == null){
          QueryBuilder.asyncClasses.select(theClass['o'],theClass['name'],theClass['s'], function(flag){
            onlyOnce(jsonQuery, theClass)
          });
        }
      });
      setTimeout(function(){
          $.each(classes, function(index){
            var theClass = $(this)[0];
            if (getLinkingProperty(jsonQuery, theClass['s']) != null){
                QueryBuilder.asyncClasses.refine_search(theClass['o'],theClass['name'],theClass['s'].replace("?",""),getLinkingProperty(jsonQuery, theClass['s']),function(flag){
                  onlyOnce(jsonQuery, theClass)
                });

            }
          })
      },3000);
    }
  }
  $("#btn_show_all_classes").hide()
})

var onlyOnce = function(jsonQuery, theClass){
  loadOtherProps(jsonQuery, theClass['s']);
  loadOptionals(jsonQuery)
  loadFilters(jsonQuery);
  finalRecheckOtherProperties(jsonQuery)
}

function getLinkingProperty (jsonQuery, variable){
  var otherProp = jsonQuery['otherProps'];
  var theVal = null
  $.each(otherProp, function(index){
    if (($(this)[0]['o']) == variable){
      theVal = $(this)[0]['p'];
    }
  });
  return theVal;
}

function isVariable(str){
  if (str == null) return false;
  return str.startsWith("?");
}

function loadFilters(jsonQuery){
  var filters = jsonQuery['filters'];

  var pl = getUrlParameter('propertylabels');
  var propertyNames = JSON.parse(decodeURIComponent(pl));

  for (var i = 0; i < filters.length; i++){
    var args = filters[i]['args'];
    if (args.length > 1){
      var v = args[1]['lhs'];
      var uri = getPropertyURI(jsonQuery,v)
      var name = propertyNames[uri];
      $(".list-group-item").each(function(idx){
        if ($($(".list-group-item")[idx]).attr('uri') == uri){
          var checkBox = $($(".list-group-item")[idx]).find('input');
          $(checkBox).prop('checked', true);
          QueryBuilder.properties.checkbox_click($(checkBox));
          var filterId = $(checkBox).attr('filter-id');
          $(checkBox).prop("checked", false )
          QueryBuilder.toggleOptional(filterId,$(checkBox).is(":checked"))
          $(checkBox).hide();

          //QueryBuilder.addObjectFilter("<"+theObject['o']+">", "=", filterId, false);
          data = []
          for (var a = 1; a < args.length; a++){
            if (a == 1) data.push({'value': args[a]['rhs'].substring(1, args[a]['rhs'].indexOf("\"",1)), 'value-operator' : args[a]['op'] , 'operator':''});
            else data.push({'value': args[a]['rhs'].substring(1, args[a]['rhs'].indexOf("\"",1)), 'value-operator' : args[a]['op'] , 'operator': args[0] });
          }

					rangeUri = args[1]['rhs'].substring((args[1]['rhs'].indexOf("^") +2), (args[1]['rhs'].length));
					console.log("rangeuri :" + rangeUri);

					console.log("filter: " + JSON.stringify(data));
          QueryBuilder.properties.filter.add_data_filter(uri,name,data,filterId);
        }
      })
    } else {
      var v = args[0]['lhs'];
      var uri = getPropertyURI(jsonQuery,v)			
      var name = propertyNames[uri];
      $(".list-group-item").each(function(idx){
				console.log("here: " + uri);
	
        if ($($(".list-group-item")[idx]).attr('uri') == uri){
          var checkBox = $($(".list-group-item")[idx]).find('input');
          $(checkBox).prop('checked', true);
          QueryBuilder.properties.checkbox_click($(checkBox));
          var filterId = $(checkBox).attr('filter-id');
          $(checkBox).prop("checked", false )
          QueryBuilder.toggleOptional(filterId,$(checkBox).is(":checked"))
          $(checkBox).hide();

          data = []
          data.push({'value': args[0]['rhs'].substring(1, args[0]['rhs'].indexOf("\"",1)), 'value-operator' : args[0]['op'] , 'operator':''});
					
					rangeUri = args[0]['rhs'].substring((args[0]['rhs'].indexOf("^") +2), (args[0]['rhs'].length));
					console.log("rangeuri :" + rangeUri);
					
          QueryBuilder.properties.filter.add_data_filter(uri,name,data,filterId);
        }
      })
    }
  }
}

function getPropertyURI(jsonQuery,variable){
  var otherProps = jsonQuery['otherProps'];
  var theProp = "";	
  for (var idx in otherProps){		
    if (otherProps[idx]['o']  == variable){
      theProp = otherProps[idx]['p'];
      break;
    }
  }
  return theProp;
}

function loadOptionals (jsonQuery){
  var optionals = jsonQuery['optionals']
  for (var i = 0; i < optionals.length; i++){
    $(".list-group-item").each(function(idx){
      var uri = $($(".list-group-item")[idx]).attr('uri');
      if (uri == optionals[i]){
         var item = $($(".list-group-item")[idx]).find('input');
         $(item).prop("checked", true )

        QueryBuilder.properties.checkbox_click($(item));
      }
    })
  }
}

function loadOtherProps (jsonQuery, variableLink){
  var pl = getUrlParameter('propertylabels');
  var plJson = JSON.parse(decodeURIComponent(pl));

  var otherProp = jsonQuery['otherProps'];
  $.each(otherProp, function(index){
    var theObject = $(this)[0];
    if (theObject['s'] == variableLink){
      if (isVariable(theObject['o'])) {
        //do nothing
      } else {
        $(".list-group-item").each(function(i){
					var uri = $($(".list-group-item")[i]).attr('uri');
          if (uri == theObject['p']){
            var checkBox = $($(".list-group-item")[i]).find('input');
            $(checkBox).prop('checked', true);
            QueryBuilder.properties.checkbox_click($(checkBox));
            var filterId = $(checkBox).attr('filter-id');
            $(checkBox).prop("checked", false )
            QueryBuilder.toggleOptional(filterId,$(checkBox).is(":checked"))

            //QueryBuilder.addObjectFilter("<"+theObject['o']+">", "=", filterId, false);
            data = []
            data.push({'object-name': theObject['o'], uri : theObject['o'] });

            QueryBuilder.properties.filter.add_objects(theObject['p'],plJson[theObject['p']],data,filterId);
            $(checkBox).hide();
          }
        });
      }
    }
  })
}

function finalRecheckOtherProperties (jsonQuery){
  theFilterList = $("#qb_properties_properties_selected_filters_list");
  var otherProp = jsonQuery['otherProps'];
  $.each(otherProp, function(index){
    var theObject = otherProp[index];
    var thePredicate = theObject['p'];
    var theOtriple= theObject['o'];
    if (!(isVariable(theOtriple))){
    } else {
      $.each($("#qb_properties_properties_selected_filters_list").children(), function(idx){
        if (thePredicate == $($("#qb_properties_properties_selected_filters_list").children()[idx]).attr('property-uri')){
          $($(this).find("div.row > div.col-md-2")[0]).find('span.glyphicon-eye-close').click();
          // someAction = true;
        }
      });
    }
  });
}



function search(nameKey, myArray){
	flag = false;
	 $.each(myArray,function(k,v){
         if (v.property_uri.toString() === nameKey.toString()) {
			 flag = true;
         }
	 });
	return flag;
}


$(window).load(function(){
  propSetting['default'] =  defaultPropSetting;
});


$(document).click(function(event) {
   window.lastElementClicked = event.target;
});
