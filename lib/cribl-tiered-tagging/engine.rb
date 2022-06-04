# frozen_string_literal: true

module ::CriblTieredTagging
  class Engine < ::Rails::Engine
    engine_name "cribl_tiered_tagging".freeze
    isolate_namespace CriblTieredTagging
  end
end
