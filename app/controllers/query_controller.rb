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
   	
      if params[:pdf].blank?
     	  render :json => response.to_json
      else
        send_data(generate_pdf(response), :filename => "output.pdf", :type => "application/pdf") 
      end
    end
  end

  private 
    def generate_pdf(data)
        html = "hello world"
        kit = PDFKit.new(html, :page_size => 'Letter')
        #kit.stylesheets << 'bootstrap.css'
        pdf = kit.to_pdf
        return pdf 
    end
end
