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
		classes = {}
		classes["Actor"] = {}
		classes["Country"] = {}
		classes["Boxer"] = {}

		queryable = RDF::Repository.load(dataset)
		#query = get_sparql_prefixes
		query = "SELECT distinct ?a ?label "
		query += " WHERE { ?a rdf:type owl:Class. ?a rdfs:label ?label. "
		query += " FILTER(bound(?label) && langMatches(lang(?label), \"EN\") && REGEX(?label, '"+search_str.downcase+"'))}"
		#sse = SPARQL.parse(query)
		#results = []
		#queryable.query(sse) do |result|
		#  results << result
		#end
		results = SPARQL.execute(query, queryable)
		classes
	end
end
