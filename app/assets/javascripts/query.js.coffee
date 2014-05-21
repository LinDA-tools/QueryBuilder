# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

@generate_sample_query = (template_id)->
	$("#txt_sparql_query").html($("#txt_sample_query_"+template_id).html())

@execute_sparql_query =->
	$.getJSON get_server_address()+"/query/execute_sparql",
  	query: $("#txt_sparql_query").html()
	, (data) ->
  		items = []
  		$.each data, (key, val) ->
    		items.push "<li id='" + key + "'>" + val + "</li>"
    		return

  		$("<ul/>",
    		class: "my-new-list"
    		html: items.join("")
  		).appendTo "body"
  	return

