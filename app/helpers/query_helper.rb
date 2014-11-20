require 'rubygems'
require 'sparql'
require 'rack/sparql'
include ApplicationHelper
module QueryHelper
	def get_uri(url)
		URI.encode(url.gsub("&lt;","<").gsub("&gt;",">"))
	end

	def clean_sparq_query(str)
		return str.gsub("&lt;","<").gsub("&gt;",">").strip
	end

	# This method lists the available datasets to query the data
	#return <Hashmap> 
	def get_datasets
		datasets = {}
		datasets["DBPedia"] = "http://dbpedia.org/sparql"
		datasets
	end

	#This method searches for classes in a dataset matching the search string
	#return <Hashmap>
	def search_classes(dataset,search_str)
		classes = []
		uri = get_uri("http://localhost:#{get_rdf2any_server_port}/rdf2any/v1.0/builder/classes?search="+search_str.downcase+"&dataset="+dataset)
   		response = HTTParty.get(uri)
   		unless response["searched_items"].blank?
   			searched_items = response["searched_items"].sort_by{|item| item["sequence"]}
   			searched_items.each do |result|
   				classes << {:uri=>result["uri"], :name=>result["labels"]["en"].capitalize} unless result["labels"]["en"].blank?
   			end
   		end
		classes
	end

	def search_objects(dataset, search_str, classes, for_class, for_property)
		objects = []
		uri = get_uri("http://localhost:#{get_rdf2any_server_port}/rdf2any/v1.0/builder/objects?search="+search_str.downcase+"&dataset="+dataset+"&classes="+classes+"&for_class="+for_class+"&for_property="+for_property)
   		response = HTTParty.get(uri)
   		unless response["results"]["bindings"].blank?
   			response["results"]["bindings"].each do |result|
   				objects << {:uri=>result["object"]["value"], :name=>result["label"]["value"].capitalize}
   			end
   		end
		objects
	end

	def get_sublass_search_query(class_uri)
		query = get_sparql_prefixes
		query += " SELECT ?subclass_uri ?subclass_label WHERE {?subclass_uri rdfs:subClassOf <"+class_uri+">. ?subclass_uri rdfs:label ?subclass_label.  FILTER(langMatches(lang(?subclass_label), 'EN')) } "
		return query
	end

	def get_class_properties_query(class_uri, type = "object", all = false)
		query = get_sparql_prefixes
		query += "SELECT DISTINCT ?property ?label WHERE { ?concept rdf:type <"+class_uri+">. ?concept ?property ?o. ?property rdfs:label ?label. "
		if type == "object"
			query += " ?property rdf:type owl:ObjectProperty. ?property rdfs:range ?range. "
		elsif type == "datatype"
			query += " ?property rdf:type owl:DatatypeProperty. "
		end
		query += " FILTER(langMatches(lang(?label), 'EN'))} "
		if all
			query += " LIMIT 40"
		else
			query += " LIMIT 5" 
		end
		query
	end

	def get_class_schema_properties_query(class_uri)
		query = get_sparql_prefixes
		query += " SELECT DISTINCT ?property ?label WHERE { ?property rdfs:domain <"+class_uri+">. ?property rdfs:range ?range.  ?property rdfs:label ?label. FILTER(langMatches(lang(?label), 'EN')) }"
		query
	end

	#This method returns the subclasses of a class_uri
	def get_sublasses_of_class(dataset, class_uri)
		query = get_sublass_search_query(class_uri)
		classes = []
		classes_json = get_sparql_result(dataset, query)
		unless is_sparql_result_empty?(classes_json)
			classes_json["results"]["bindings"].each do |b|
				classes << {:uri=>b["subclass_uri"]["value"], :name=>b["subclass_label"]["value"].capitalize}
			end
		end
		return classes.uniq
	end

	#This method returns the class properties
	def get_properties_of_class(dataset, class_uri)
		uri = get_uri("http://localhost:#{get_rdf2any_server_port}/rdf2any/v1.0/builder/properties?dataset="+dataset+"&class="+class_uri)
		properties = {:data_type=>[], :object_type=>[]}
		properties_json = HTTParty.get(uri)
		unless properties_json["rdfClass"].blank?
			unless properties_json["rdfClass"]["properties"].blank?
				properties_json["rdfClass"]["properties"].each do |p|
					if p["count"] > 0 && !p["range"]["label"].blank?
						if p["type"] == "data"
							properties[:data_type] << p
						elsif p["type"] == "object"
							properties[:object_type] << p
						end	
					end
				end
			end
		end
		properties[:data_type] = properties[:data_type].sort_by{|a|a['count']}.reverse unless properties[:data_type].blank?
		properties[:object_type] = properties[:object_type].sort_by{|a|a['count']}.reverse unless properties[:object_type].blank?
		properties
	end

	#This method gets the properties of the class which are defined in the schema 
	def get_schema_properties_of_class(dataset,class_uri)
		properties = []
		properties_json = get_sparql_result(dataset,get_class_schema_properties_query(class_uri))
		unless is_sparql_result_empty?(properties_json)
			properties_json["results"]["bindings"].each do |b|
				properties << {:uri=>b["property"]["value"], :name=>b["label"]["value"]}
			end
		end
		properties.uniq
	end

	#This method gets the property details of a property
	#Return {:type=>String, :data=> [{:value, :name}]}
	def get_property_ranges(dataset, property_uri, type)
		query = get_sparql_prefixes
		if type == "object"
			query += " SELECT ?class ?label WHERE { <"+property_uri+"> rdfs:range ?class.  OPTIONAL {?class rdfs:label ?label.} FILTER(langMatches(lang(?label), 'EN')) }"
		else
			query += " SELECT ?class WHERE { <"+property_uri+"> rdfs:range ?class.  }"
		end
		property_ranges = {:type=>nil,:data=>[]}
		property_ranges_json = get_sparql_result(dataset, query)
		unless is_sparql_result_empty?(property_ranges_json)
			property_ranges_json["results"]["bindings"].each do |b|
				if type.blank?
					if is_xml_schema_node?(b["class"]["value"])
						property_ranges[:type] = "datatype"
						property_ranges[:data] << {:value=>b["class"]["value"], :name=>get_datatype_type(b["class"]["value"])}
					else
						property_ranges[:type] = "object"
						property_ranges[:data] << {:value=>b["class"]["value"], :name=>get_node_label(dataset, b["class"]["value"].capitalize)}
					end
				else
					property_ranges[:type] =  type
					if type == "object"
						property_ranges[:data] << {:value=>b["class"]["value"], :name=>b["label"]["value"]}
					else
						property_ranges[:data] << {:value=>b["class"]["value"], :name=>get_datatype_type(b["class"]["value"])}
					end
				end
			end
		end
		property_ranges[:data] = property_ranges[:data].uniq
		property_ranges
	end


	def search_classes_of_class_types(dataset,search_str, classes)
		query = get_sparql_prefixes
		query += " SELECT distinct ?object ?label "
		query += " WHERE {  "
		class_counter = 0
		classes.each do |c|
			query += " UNION " if class_counter > 0
			query += " { ?object rdf:type &lt;"+c+"&gt;} "
			class_counter += 1
		end
		query += ". ?object rdfs:label ?label.  "
		query += " FILTER(bound(?label) && langMatches(lang(?label), 'EN') && REGEX(?label, '"+search_str+"'))}"
		result = []
		classes_json = get_sparql_result(dataset, query)
		unless is_sparql_result_empty?(classes_json)
			classes_json["results"]["bindings"].each do |b|
				result << {:name=>b["label"]["value"], :uri=> b["object"]["value"]}
			end
		end
		#debugger
		result
	end

	def in_query_builder_action?
		if params[:controller] == "query" && params[:action] == "builder"
			return true
		else
			return false
		end
	end

	def get_configured_template(selected_properties = [])
		result = "{{start variable_dictionary}}\n"
		if selected_properties.blank?
			result += "INPUT YOUR VARIABLE DICTIONARY HERE\n"
		else
			selected_properties.each do |prop|
				result += get_variable_name_of_property(prop)+" = "+prop+"\n"
			end
		end
		result += "{{end}}\n\n"
		result += "{{start header}}\n" 
		result += "INPUT YOUR HEADER HERE\n"
		result += "{{end}}\n\n"
		result += "{{start body}}\n" 
		result += "INPUT YOUR BODY HERE\n"
		result += "{{end}}\n\n"
		result += "{{start footer}}\n" 
		result += "INPUT YOUR FOOTER HERE\n"
		result += "{{end}}"
	end

end
