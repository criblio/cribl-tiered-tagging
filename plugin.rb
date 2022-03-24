# frozen_string_literal: true

# name: cribl-tiered-tagging
# about: Discourse plugin require Product and Version tagging when posting
# version: 0.1
# authors: Keegan George
# contact email: keegan@pavilion.tech
# url: https://github.com/paviliondev/cribl-tiered-tagging

enabled_site_setting :cribl_tiered_tagging_enabled
register_asset 'stylesheets/common.scss'

after_initialize do
  PRODUCT_FIELD_NAME = "product"
  PRODUCT_FIELD_TYPE = "json"
  VERSION_FIELD_NAME = "versions"
  VERSION_FIELD_TYPE = "json"
  
  # Registering the fields
  register_topic_custom_field_type(PRODUCT_FIELD_NAME, PRODUCT_FIELD_TYPE.to_sym)
  register_topic_custom_field_type(VERSION_FIELD_NAME, VERSION_FIELD_TYPE.to_sym)
  
  # Getter Methods
  add_to_class(:topic, PRODUCT_FIELD_NAME.to_sym) do
    if !custom_fields[PRODUCT_FIELD_NAME].nil?
      custom_fields[PRODUCT_FIELD_NAME]
    else
      nil
    end
  end

  add_to_class(:topic, VERSION_FIELD_NAME.to_sym) do
    if !custom_fields[VERSION_FIELD_NAME].nil?
      custom_fields[VERSION_FIELD_NAME]
    else
      nil
    end
  end

  # Setter Methods  
  add_to_class(:topic, "#{PRODUCT_FIELD_NAME}=") do |value|
    custom_fields[PRODUCT_FIELD_NAME] = value
  end
  
  add_to_class(:topic, "#{VERSION_FIELD_NAME}=") do |value|
    custom_fields[VERSION_FIELD_NAME] = value
  end

  # Update on Topic Creation
  on(:topic_created) do |topic, opts, user|
    topic.send("#{PRODUCT_FIELD_NAME}=".to_sym, opts[PRODUCT_FIELD_NAME.to_sym])
    topic.save!
  end

  on(:topic_created) do |topic, opts, user|
    topic.send("#{VERSION_FIELD_NAME}=".to_sym, opts[VERSION_FIELD_NAME.to_sym])
    topic.save!
  end
  
  # Update on Topic Edit
  PostRevisor.track_topic_field(PRODUCT_FIELD_NAME.to_sym) do |tc, value|
    tc.record_change(PRODUCT_FIELD_NAME, tc.topic.send(PRODUCT_FIELD_NAME), value)
    tc.topic.send("#{PRODUCT_FIELD_NAME}=".to_sym, value.present? ? value : nil)
  end

  PostRevisor.track_topic_field(VERSION_FIELD_NAME.to_sym) do |tc, value|
    tc.record_change(VERSION_FIELD_NAME, tc.topic.send(VERSION_FIELD_NAME), value)
    tc.topic.send("#{VERSION_FIELD_NAME}=".to_sym, value.present? ? value : nil)
  end

  # Serialize to Topic
  add_to_serializer(:topic_view, PRODUCT_FIELD_NAME.to_sym) do
    object.topic.send(PRODUCT_FIELD_NAME)
  end

  add_to_serializer(:topic_view, VERSION_FIELD_NAME.to_sym) do
    object.topic.send(VERSION_FIELD_NAME)
  end
  
  # Preload the Fields
  add_preloaded_topic_list_custom_field(PRODUCT_FIELD_NAME)
  add_preloaded_topic_list_custom_field(VERSION_FIELD_NAME)

  # Serialize to the topic list
  add_to_serializer(:topic_list_item, PRODUCT_FIELD_NAME.to_sym) do
    object.send(PRODUCT_FIELD_NAME)
  end

  add_to_serializer(:topic_list_item, VERSION_FIELD_NAME.to_sym) do
    object.send(VERSION_FIELD_NAME)
  end
end