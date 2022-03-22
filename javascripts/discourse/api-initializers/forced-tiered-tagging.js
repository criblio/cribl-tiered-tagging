import { ajax } from 'discourse/lib/ajax';
import { apiInitializer } from 'discourse/lib/api';
import { arrayNotEmpty, isDefined, undasherize } from '../lib/field-helpers';

export default apiInitializer('0.11.1', (api) => {
  const PRODUCT_FIELD_NAME = 'product';
  const VERSION_FIELD_NAME = 'versions';

  function findProductVersions(products, product) {
    const productVersions = products.find((p) => p.id === product[0]).versions;
    const versions = productVersions.map((v) => v.id);
    return versions;
  }

  api.registerConnectorClass(
    'composer-fields',
    'composer-product-version-fields',
    {
      setupComponent(attrs, component) {
        const model = attrs.model;
        console.log('model', model, 'attrs', attrs, 'component', component);

        // Tag data for to dropdowns:
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

          if (isDefined(model.product) && arrayNotEmpty(model.product)) {
            const versions = findProductVersions(
              component.products,
              model.product
            );
            this.set('productVersions', versions);
            this.set('showVersions', true);
          }
        });
      },

      actions: {
        updateProductTags(product) {
          this.set('selectedProduct', product);
          this.model.set('product', product);
          this.model.set('versions', []);
          const products = this.get('products');

          if (isDefined(product) && arrayNotEmpty(product)) {
            const versions = findProductVersions(products, product);
            this.set('productVersions', versions);
            this.set('showVersions', true);
          }

          console.log('model', this.model);
          // TODO if the product is cleared, remove the version tags
        },

        updateVersionTags(version) {
          let product = this.get('selectedProduct');
          console.log('Version', version);
          // product.push(...version);
          // this.attachTags((product = new Set()));

          // if (this.model.versions) {
          //   this.model.versions.push(...version);
          // } else {
          this.model.set('versions', version);
          // }

          console.log('model versions', this.model);
        },
      },
    }
  );

  api.serializeOnCreate(PRODUCT_FIELD_NAME);
  api.serializeOnCreate(VERSION_FIELD_NAME);
  api.serializeToDraft(PRODUCT_FIELD_NAME);
  api.serializeToDraft(VERSION_FIELD_NAME);
  api.serializeToTopic(PRODUCT_FIELD_NAME, `topic.${PRODUCT_FIELD_NAME}`);
  api.serializeToTopic(VERSION_FIELD_NAME, `topic.${VERSION_FIELD_NAME}`);
});
