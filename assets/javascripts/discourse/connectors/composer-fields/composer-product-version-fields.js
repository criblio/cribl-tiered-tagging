import {
  prepareData,
  resetProperties,
  setProductProps,
} from "../../lib/product-helpers";

export default {
  shouldRender(args, component) {
    return component.siteSettings.cribl_tiered_tagging_enabled;
  },

  setupComponent(args, component) {
    prepareData(component);

    if (component.model.editingPost) {
      component.model.setProperties({
        product: component.model.topic.product,
        versions: component.model.topic.versions,
        plainTags: component.model.topic.plainTags,
      });
    }
  },

  actions: {
    updateProductTags(selected) {
      // If selected product is removed:
      if (selected.length < 1) {
        resetProperties(this.model, this);
      }

      this.model.set("product", selected);
      setProductProps(this, this.products, selected);
    },

    updateVersionTags(selected) {
      this.model.set("versions", selected);
    },

    updatePlainTags(selected) {
      this.model.set("plainTags", selected);
    },
  },
};
