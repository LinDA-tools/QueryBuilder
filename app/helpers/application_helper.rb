module ApplicationHelper
	def get_sparql_prefixes
		prefix = ""
		prefix += "PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> "
		prefix += "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> "
		prefix += "PREFIX owl:<http://www.w3.org/2002/07/owl#> "
	end

	def get_rdf2any_server_url
		return "http://localhost:8080/rdf2any/"
	end

	def get_rdf2any_convert_url
		return get_rdf2any_server_url + "v1.0/convert/"
	end

	def execute_sparql_to_json(dataset, query)
		uri = get_uri(get_rdf2any_convert_url + "json?dataset="+dataset+"&query="+query)
		response = HTTParty.get(uri)
		return response.to_json
	end

	def get_sparql_result(dataset, query)
		uri = get_uri(get_rdf2any_convert_url + "json?dataset="+dataset+"&query="+query)
		return HTTParty.get(uri)
	end

	def is_sparql_result_empty?(resultset)
		result = true
		unless resultset["results"].blank?
			result = false unless resultset["results"]["bindings"].blank?
		end
		result
	end

	def get_datatype_type(uri)
		type = ""
		sp = uri.split("#")
		type = sp[1] if sp.size == 2
		type
	end
end
