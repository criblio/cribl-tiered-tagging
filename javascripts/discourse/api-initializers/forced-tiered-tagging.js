import EmberObject from '@ember/object';
import { getOwner } from 'discourse-common/lib/get-owner';
import discourseComputed from 'discourse-common/utils/decorators';
import { ajax } from 'discourse/lib/ajax';
import { apiInitializer } from 'discourse/lib/api';
import I18n from 'I18n';
import { arrayNotEmpty, isDefined, undasherize } from '../lib/field-helpers';

export default apiInitializer('0.11.1', (api) => {
  const PRODUCT_FIELD_NAME = 'product';
  const VERSION_FIELD_NAME = 'versions';
  const PLUGIN_ID = 'cribl-tiered-tagging';

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

        const controller = getOwner(this).lookup('controller:composer');
        component.set('productValidation', controller.get('productValidation'));
        component.set('versionValidation', controller.get('versionValidation'));
        controller.addObserver('productValidation', () => {
          if (this._state === 'destroying') {
            return;
          }
          component.set(
            'productValidation',
            controller.get('productValidation')
          );
        });

        controller.addObserver('versionValidation', () => {
          if (this._state === 'destroying') {
            return;
          }
          component.set(
            'versionValidation',
            controller.get('versionValidation')
          );
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

  api.modifyClass('model:composer', {
    pluginId: PLUGIN_ID,

    save(opts) {
      if (this.tags) {
        this.tags.push(...this.product, ...this.versions);
      } else {
        if (this.product && this.version) {
          this.set('tags', [...this.product, ...this.versions]);
        }
      }

      return this._super(...arguments);
    },
  });

  api.modifyClass('controller:composer', {
    pluginId: PLUGIN_ID,

    @discourseComputed('model.product', 'lastValidatedAt')
    productValidation(product, lastValidatedAt) {
      if (!isDefined(product) || !arrayNotEmpty(product)) {
        return EmberObject.create({
          failed: true,
          reason: I18n.t(themePrefix('cribl_tiered_tags.product_validation')),
          lastShownAt: lastValidatedAt,
        });
      }
    },

    @discourseComputed('model.versions', 'lastValidatedAt')
    versionValidation(versions, lastValidatedAt) {
      console.log('versions', versions);
      if (!isDefined(versions) || !arrayNotEmpty(versions)) {
        return EmberObject.create({
          failed: true,
          reason: I18n.t(themePrefix('cribl_tiered_tags.version_validation')),
          lastShownAt: lastValidatedAt,
        });
      }
    },
  });

  api.serializeOnCreate(PRODUCT_FIELD_NAME);
  api.serializeOnCreate(VERSION_FIELD_NAME);
  api.serializeToDraft(PRODUCT_FIELD_NAME);
  api.serializeToDraft(VERSION_FIELD_NAME);
  api.serializeToTopic(PRODUCT_FIELD_NAME, `topic.${PRODUCT_FIELD_NAME}`);
  api.serializeToTopic(VERSION_FIELD_NAME, `topic.${VERSION_FIELD_NAME}`);
});
