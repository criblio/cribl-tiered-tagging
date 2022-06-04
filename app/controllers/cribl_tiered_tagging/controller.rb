# frozen_string_literal: true

module CriblTieredTagging
  class ::ProductsController < ::ApplicationController
    def index
      data = []
      products_tag_group = SiteSetting.cribl_product_tag_group
      products = Tag.joins(:tag_group_memberships).where('tag_group_memberships.tag_group_id IN (?)', TagGroup.where(name: products_tag_group).first).select(:id, :name, :description)

      products.each do |product|
        all_versions = []
          versions = Tag.joins(:tag_group_memberships).where('tag_group_memberships.tag_group_id IN (?)', TagGroup.where(name: product[:name].titleize).first).select(:id, :name, :description)

          data << {
            id: product[:id],
            name: product[:name],
            description: product[:description],
            versions: versions
          }
      end

      render json: data
      end
  end
end
