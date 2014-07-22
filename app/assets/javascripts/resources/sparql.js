if (typeof SPARQL == 'undefined') {
    SPARQL = {};
}

SPARQL = {
	prefix : {
		rdf : "PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n",
		rdfs : "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \n",
		owl : "PREFIX owl:<http://www.w3.org/2002/07/owl#> \n",
		all : function(){
			result = "";
			result += SPARQL.prefix.rdf;
			result += SPARQL.prefix.rdfs;
			result += SPARQL.prefix.owl;
			return result;
		}
	},
	result : {
		columns : function(data){
			return data.head.vars;
		}
	}

};