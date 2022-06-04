import {
  prepareData,
  resetProperties,
  setProductProps,
  updateDependantDropdowns,
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
      this.set("buffered.product", selected);

      if (selected.length < 1) {
        resetProperties(this.buffered, this);
      } else {
        setProductProps(this, this.products, selected);
        updateDependantDropdowns(
          this,
          this.get("buffered.version"),
          this.get("versions"),
          "updateVersionTags"
        );
      }
    },

    updateVersionTags(selected) {
      this.set("buffered.versions", selected);
      console.log("selected", selected);

      if (selected.length < 1) {
        console.log("reached");
        return this.set("buffered.versions", null);
      }
    },

    updatePlainTags(selected) {
      this.set("buffered.plainTags", selected);
    },
  },
};
