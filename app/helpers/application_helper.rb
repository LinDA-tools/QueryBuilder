require 'open-uri'
module ApplicationHelper
	def get_sparql_prefixes
		prefix = ""
		prefix += "PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> "
		prefix += "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> "
		prefix += "PREFIX owl:<http://www.w3.org/2002/07/owl#> "
	end

	def get_rdf2any_server_url
		return "http://localhost:"+get_rdf2any_server_port+"/rdf2any/"
	end

	def get_rdf2any_server_port
		return "8081"
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
		uri.gsub(xml_schema_uri,"")
	end

	def is_xml_schema_node?(uri)
		return uri.include?(xml_schema_uri) 
	end

	def xml_schema_uri
		"http://www.w3.org/2001/XMLSchema#"
	end

	def get_node_label(dataset, uri)
		query = get_sparql_prefixes
		query += " SELECT ?label WHERE { <"+uri+"> rdfs:label ?label. FILTER(langMatches(lang(?label), 'EN')) }"
		label = ""
		label_json = get_sparql_result(dataset, query)
		unless is_sparql_result_empty?(label_json)
			label_json["results"]["bindings"].each do |b|
				label = b["label"]["value"]
			end
		end
		label
	end
	def get_variable_name_of_property(property_uri)
		variable_name = property_uri.split("/").last
		return variable_name.gsub(/[^[:alnum:]]/, "").underscore
	end

	def uri_value_encode(str)
		URI::encode(str).gsub("\&","%26")
	end
end
