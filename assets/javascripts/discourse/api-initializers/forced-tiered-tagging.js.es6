import EmberObject from '@ember/object';
import { getOwner } from 'discourse-common/lib/get-owner';
import discourseComputed from 'discourse-common/utils/decorators';
import { ajax } from 'discourse/lib/ajax';
import { popupAjaxError } from 'discourse/lib/ajax-error';
import { apiInitializer } from 'discourse/lib/api';
import showModal from 'discourse/lib/show-modal';
import I18n from 'I18n';
import { arrayNotEmpty, isDefined, undasherize } from '../lib/field-helpers';

export default apiInitializer('0.11.1', (api) => {
  const PRODUCT_FIELD_NAME = 'product';
  const VERSION_FIELD_NAME = 'versions';
  const TAGS_FIELD_NAME = 'plainTags';
  const PLUGIN_ID = 'cribl-tiered-tagging';
  const siteSettings = api.container.lookup('site-settings:main');

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

        // Tag data for to dropdowns:
        ajax(`/tags.json`).then(({ extras }) => {
          const tagGroups = extras.tag_groups;
          const productLabels = [];

          const productsTagGroup = tagGroups.find(
            (t) => t.name === siteSettings.cribl_product_tag_group
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
        },

        updateVersionTags(version) {
          let product = this.get('selectedProduct');
          this.model.set('versions', version);
        },
      },
    }
  );

  api.modifyClass('model:composer', {
    pluginId: PLUGIN_ID,

    save(opts) {
      const product = this.product;
      const versions = this.versions;
      const tags = this.tags;

      if (tags) {
        this.plainTags = tags;
        this.set('tags', [...tags, ...product, ...versions]);
      } else {
        if (product && versions) {
          this.set('tags', [...product, ...versions]);
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
          reason: I18n.t('cribl_tiered_tagging.product.validation'),
          lastShownAt: lastValidatedAt,
        });
      }
    },

    @discourseComputed('model.versions', 'lastValidatedAt')
    versionValidation(versions, lastValidatedAt) {
      if (!isDefined(versions) || !arrayNotEmpty(versions)) {
        return EmberObject.create({
          failed: true,
          reason: I18n.t('cribl_tiered_tagging.version.validation'),
          lastShownAt: lastValidatedAt,
        });
      }
    },
  });

  api.registerConnectorClass(
    'edit-topic',
    'edit-topic-product-version-fields',
    {
      setupComponent(attrs, component) {
        const model = attrs.model;

        ajax(`/tags.json`).then(({ extras }) => {
          const tagGroups = extras.tag_groups;
          const productLabels = [];

          const productsTagGroup = tagGroups.find(
            (t) => t.name === siteSettings.cribl_product_tag_group
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

        component.set('product', model.get('product'));
        component.set('versions', model.get('versions'));

        const controller = getOwner(this).lookup('controller:topic');
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
          this.set('buffered.product', product);

          this.model.set('versions', []);
          const products = this.get('products');

          if (isDefined(product) && arrayNotEmpty(product)) {
            const versions = findProductVersions(products, product);
            this.set('productVersions', versions);
            this.set('showVersions', true);
          }
        },

        updateVersionTags(version) {
          let product = this.get('selectedProduct');

          this.model.set('versions', version);
          this.set('buffered.versions', version);
        },

        updatePlainTags(tags) {
          this.set('buffered.plainTags', tags);
        },
      },
    }
  );

  api.modifyClass('controller:topic', {
    pluginId: PLUGIN_ID,

    actions: {
      finishedEditingTopic() {
        const plainTags = this.get('buffered.plainTags') || [];
        const product = this.get('buffered.product') || [];
        const versions = this.get('buffered.versions') || [];

        if (
          !isDefined(this.model.product) ||
          !arrayNotEmpty(this.model.product)
        ) {
          return showModal('edit-topic-error', {
            title: 'cribl_tiered_tagging.error',
            model: {
              errorMessage: I18n.t('cribl_tiered_tagging.product.validation'),
            },
          });
        } else if (
          !isDefined(this.model.versions) ||
          !arrayNotEmpty(this.model.versions)
        ) {
          return showModal('edit-topic-error', {
            title: 'cribl_tiered_tagging.error',
            model: {
              errorMessage: I18n.t('cribl_tiered_tagging.version.validation'),
            },
          });
        }

        this.buffered.set('product', product);
        this.buffered.set('versions', versions);
        this.buffered.set('plainTags', plainTags);

        ajax(`/t/${this.model.id}`, {
          type: 'PUT',
          data: {
            plainTags,
            versions,
            product,
          },
        }).catch(popupAjaxError);

        this.buffered.set('tags', [
          ...plainTags,
          ...this.model.product,
          ...this.model.versions,
        ]);

        return this._super(...arguments);
      },
    },
  });

  api.serializeOnCreate(PRODUCT_FIELD_NAME);
  api.serializeOnCreate(VERSION_FIELD_NAME);
  api.serializeOnCreate(TAGS_FIELD_NAME);

  api.serializeToDraft(PRODUCT_FIELD_NAME);
  api.serializeToDraft(VERSION_FIELD_NAME);
  api.serializeToDraft(TAGS_FIELD_NAME);

  api.serializeToTopic(PRODUCT_FIELD_NAME, `topic.${PRODUCT_FIELD_NAME}`);
  api.serializeToTopic(VERSION_FIELD_NAME, `topic.${VERSION_FIELD_NAME}`);
  api.serializeToTopic(TAGS_FIELD_NAME, `topic.${TAGS_FIELD_NAME}`);
});
