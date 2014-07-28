require 'rubygems'
require 'sparql'
require 'rack/sparql'
include ApplicationHelper
module QueryHelper
	def get_uri(url)
		URI.encode(url.gsub("&lt;","<").gsub("&gt;",">"))
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

		#queryable = RDF::Repository.load(dataset)
		#query = get_sparql_prefixes
		#query += "SELECT distinct ?a ?label "
		#query += " WHERE { ?a rdf:type owl:Class. ?a rdfs:label ?label. "
		#query += " FILTER(bound(?label) && langMatches(lang(?label), \"EN\") && REGEX(?label, '"+search_str.downcase+"'))}"
		#sse = SPARQL.parse(query)
		#results = []
		#queryable.query(sse) do |result|
		#  results << result
		#end
		#results = SPARQL.execute(query, queryable)
		uri = get_uri("http://localhost:8080/rdf2any/v1.0/builder/classes?search="+search_str.downcase+"&dataset="+dataset)
   		response = HTTParty.get(uri)
   		unless response["results"]["bindings"].blank?
   			response["results"]["bindings"].each do |result|
   				classes << {:uri=>result["class"]["value"], :name=>result["label"]["value"].capitalize}
   			end
   		end
		classes
	end

	def get_sublass_search_query(class_uri)
		query = get_sparql_prefixes
		query += " SELECT ?subclass_uri ?subclass_label WHERE {?subclass_uri rdfs:subClassOf <"+class_uri+">. ?subclass_uri rdfs:label ?subclass_label.  FILTER(langMatches(lang(?subclass_label), 'EN')) }"
		return query
	end

	#This method returns the subclasses of a class_uri
	def get_sublasses_of_class(dataset, class_uri)
		query = get_sublass_search_query(class_uri)
		classes = []
		classes_json = get_sparql_result(dataset, query)
		unless classes_json["results"].blank?
			unless classes_json["results"]["bindings"].blank?
				classes_json["results"]["bindings"].each do |b|
					classes << {:uri=>b["subclass_uri"]["value"], :name=>b["subclass_label"]["value"]}
				end
			end
		end
		return classes.uniq
	end
end
