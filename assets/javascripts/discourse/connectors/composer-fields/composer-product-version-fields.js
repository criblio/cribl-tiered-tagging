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
      this.model.set("version", selected);
    },
  },
};
