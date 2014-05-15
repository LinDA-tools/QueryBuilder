require 'test_helper'

class DeveloperControllerTest < ActionController::TestCase
  test "should get docs" do
    get :docs
    assert_response :success
  end

end
