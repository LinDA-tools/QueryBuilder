# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

@generate_sample_query = (template_id)->
	$("#txt_sparql_query").html($("#txt_sample_query_"+template_id).html())
