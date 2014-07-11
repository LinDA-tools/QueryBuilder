require 'rubygems'
require 'sparql'
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
		sse = SPARQL.parse("SELECT * WHERE { ?s ?p ?o } LIMIT 10")
		queryable.query(sse) do |result|
		  result.inspect
		  debugger
		end
		classes
	end
end
