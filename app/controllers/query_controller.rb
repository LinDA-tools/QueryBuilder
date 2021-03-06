require 'json'
include QueryHelper
include ApplicationHelper
class QueryController < ApplicationController
  def sparql
  	respond_to do |format|
      format.html
    end
  end


  def builder
    respond_to do |format|
      format.html
    end

  end

  def execute_sparql
  	response = {:result=>"error"}
    dataset = params[:dataset]
    query = params[:query]
   	if !query.blank? && !dataset.blank?
   		uri = get_uri("http://localhost:#{get_rdf2any_server_port}/rdf2any/v1.0/convert/json?dataset="+dataset+"&query="+uri_value_encode(query))
      response = HTTParty.get(uri)
   	
      if params[:pdf].blank?
     	  render :json => response.to_json
      else
        send_data(generate_pdf(response), :filename => "output.pdf", :type => "application/pdf") 
      end
    end
  end

  def builder_classes
    @searched_classes = search_classes(params[:dataset],params[:search], params[:force_uri_search])
    respond_to do |format|
      format.js
    end
  end
  
  def show_all_classes
    @all_classes = get_all_classes(params[:dataset])
    respond_to do |format|
      format.js
    end
  end
  
  def builder_objects
    @searched_objects = search_objects(params[:dataset],params[:search],params[:classes],params[:for_class], params[:for_property])
    respond_to do |format|
      format.js
    end
  end

  def subclasses
    @subclasses = get_sublasses_of_class(params[:dataset],params[:class_uri])
    respond_to do |format|
      format.js
    end
  end

  def class_properties
    @properties = get_properties_of_class(params[:dataset],params[:class_uri])
    respond_to do |format|
      format.js
    end
  end

  def class_schema_properties
    @properties = get_schema_properties_of_class(params[:dataset], params[:class_uri])
    respond_to do |format|
      format.js
    end
  end

  def property_ranges
    #@property_ranges = get_property_ranges(params[:dataset], params[:property_uri], params[:type])
    @property_ranges = {:type=>params[:type],:data=>[{:value=>params[:range_uri],:name=>params[:range_name]}], :count=>params[:count].to_i}
    respond_to do |format|
      format.js
    end
  end

  def class_examples
    response = HTTParty.get("http://localhost:#{get_rdf2any_server_port}/rdf2any/v1.0/builder/classes/examples?dataset="+params[:dataset]+"&class="+params[:class])
    render :json => response.to_json
  end

  def class_subclasses
    response = HTTParty.get("http://localhost:#{get_rdf2any_server_port}/rdf2any/v1.0/builder/classes/subclasses?dataset="+params[:dataset]+"&class="+params[:class])
    render :json => response.to_json
  end

  def configured_convert_template
    #render plain: "CONFIGURED DOWNLOAD TEMPLATE"
    if params[:selected_properties].blank?
      selected_properties = []
    else
      selected_properties = params[:selected_properties].split(",")
    end
    send_data get_configured_template(selected_properties), :filename => 'configured_convert_template.txt'
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
