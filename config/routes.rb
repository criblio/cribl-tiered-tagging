# frozen_string_literal: true

Discourse::Application.routes.prepend do
    get '/products' => 'products#index'
end
  