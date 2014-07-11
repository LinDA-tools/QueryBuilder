module ApplicationHelper
	def get_sparql_prefixes
		prefix = ""
		prefix += "PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> "
		prefix += "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> "
		prefix += "PREFIX owl:<http://www.w3.org/2002/07/owl#> "
	end
end
