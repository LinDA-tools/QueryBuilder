require 'test_helper'

class QueryControllerTest < ActionController::TestCase
  test "should get sparql" do
    get :sparql
    assert_response :success
  end

  test "should get builder" do
    get :builder
    assert_response :success
  end

end
