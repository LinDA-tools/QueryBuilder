# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

@generate_sample_query = (template_id)->
    $("#txt_sparql_query").html($("#txt_sample_query_"+template_id).html())

@get_sparql_result_columns = (data) ->
    return data.head.vars

@get_sparql_result_rows = (data) ->
    return data.results.bindings

@execute_sparql_query =->
    $.getJSON get_server_address()+"/query/execute_sparql",
    query: $("#txt_sparql_query").html()
    , (data) ->
        result_columns = get_sparql_result_columns(data)
        result_rows = get_sparql_result_rows(data)
        result_table = $("#sparql_results_table")
        result_table_header = "<tr><th>#</th>"
        $.each result_columns, (key,val) ->
            result_table_header += "<th>"+val+"</th>"
        result_table_header += "</tr>"
        result_table.find("thead").first().html(result_table_header)
        result_rable_rows = ""
        row_counter = 0
        while row_counter < result_rows.length
            row_counter++
            result_rable_rows += "<tr><td>"+row_counter.toString()+"</td>"
            $.each result_columns, (key,col) ->
                result_rable_rows += "<td>"+result_rows[row_counter-1][col].value+"</td>"
            result_rable_rows += "</tr>" 
        result_table.find("tbody").first().html(result_rable_rows)
        
    return

