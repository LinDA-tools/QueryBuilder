include QueryHelper
class QueryController < ApplicationController
  def sparql
  	
  end


  def builder
  end

  def execute_sparql
  	response = {:result=>"error"}
  	query = params[:query]
   	unless query.blank?
   		uri = get_uri("http://localhost:8080/rdf2any/v1.0/convert/json?query="+query)
   		response = HTTParty.get(uri)
   	end
   	render :json => response.to_json
  end

end
