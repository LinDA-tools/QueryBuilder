
class QueryController < ApplicationController
  def sparql
  	
  end


  def builder
  end

  def execute_sparql
  	response = {:result=>"error"}
  	query = params[:query]
   	unless query.blank?
   		#response = HTTParty.post("http://localhost:8080/rdf2any/v1.0/convert/json",:body => query, :headers => { 'Content-Type' => 'application/json' })
   		url = "http://localhost:8080/rdf2any/v1.0/convert/json?query="+query
   		uri = URI.encode(url)
   		response = HTTParty.get(uri)
   	end
   	render :json => response.to_json
  end
end
