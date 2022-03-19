import Component from '@ember/component';
import { ajax } from 'discourse/lib/ajax';
import { undasherize } from '../lib/string-helpers';

export default Component.extend({
  didInsertElement() {
    this._super(...arguments);
    ajax(`/tags.json`).then(({ extras }) => {
      const tagGroups = extras.tag_groups;
      const productLabels = [];

      const productsTagGroup = tagGroups.find(
        (t) => t.name === settings.product_tag_group
      );

      const products = productsTagGroup.tags;

      products.forEach((product) => {
        const productVersions = tagGroups.find(
          (t) => t.name === undasherize(product.text)
        );

        product.versions = productVersions.tags;
        product.title = productVersions.name;
        productLabels.push(product.id);
      });

      this.set('products', products);
      this.set('productLabels', productLabels);
    });
  },

  actions: {
    updateProductTags(product) {
      this.set('selectedProduct', product);
      const products = this.get('products');
      const productVersions = products.find(
        (p) => p.id === product[0]
      ).versions;
      this.set('showVersions', true);
      const versions = productVersions.map((v) => v.id);
      console.log(versions);
      this.set('productVersions', versions);
    },
  },
});
