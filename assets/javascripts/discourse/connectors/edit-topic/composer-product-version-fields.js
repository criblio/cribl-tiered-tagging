import { prepareData } from "../../lib/product-helpers";

export default {
  shouldRender(args, component) {
    return component.siteSettings.cribl_tiered_tagging_enabled;
  },

  setupComponent(args, component) {
    prepareData(component);
  },

  actions: {
    updateProductTags(selected) {},

    updateVersionTags(selected) {},

    updatePlainTags(selected) {
      this.set("buffered.plainTags", selected);
    },
  },
};
