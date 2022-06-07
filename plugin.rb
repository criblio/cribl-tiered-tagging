# frozen_string_literal: true

# name: cribl-tiered-tagging
# about: Discourse plugin require Product and Version tagging when posting
# version: 1.1
# authors: Keegan George
# contact email: keegan@pavilion.tech
# url: https://github.com/paviliondev/cribl-tiered-tagging
# required_version: 2.7.0
# transpile_js: true

enabled_site_setting :cribl_tiered_tagging_enabled
register_asset 'stylesheets/common.scss'

after_initialize do
  %w[
    ../lib/cribl-tiered-tagging/engine.rb
    ../config/routes.rb
    ../app/controllers/cribl_tiered_tagging/controller.rb
  ].each do |key|
    load File.expand_path(key, __FILE__)
  end

  fields = [
    { name: 'product', type: 'json' },
    { name: 'versions', type: 'json' },
    { name: 'plainTags', type: 'json' }
  ]

  fields.each do |field|
    # Register the fields
    register_topic_custom_field_type(field[:name], field[:type].to_sym)

    # Getter Methods
    add_to_class(:topic, field[:name].to_sym) do
      if !custom_fields[field[:name]].nil?
        custom_fields[field[:name]]
      else
        nil
      end
    end

    # Setter Methods
    add_to_class(:topic, "#{field[:name]}=") do |value|
      custom_fields[field[:name]] = value
    end

    # Update on Topic Creation
    on(:topic_created) do |topic, opts, user|
      topic.send("#{field[:name]}=".to_sym, opts[field[:name].to_sym])
      topic.save!
    end

    # Update on Topic Edit
    PostRevisor.track_topic_field(field[:name].to_sym) do |tc, value|
      tc.record_change(field[:name], tc.topic.send(field[:name]), value)
      tc.topic.send("#{field[:name]}=".to_sym, value.present? ? value : nil)
    end

    # Serialize to Topic
    add_to_serializer(:topic_view, field[:name].to_sym) do
      object.topic.send(field[:name])
    end

    # Preload the Fields
    add_preloaded_topic_list_custom_field(field[:name])

    # Serialize to the topic list
    add_to_serializer(:topic_list_item, field[:name].to_sym) do
      object.send(field[:name])
    end
  end
end
