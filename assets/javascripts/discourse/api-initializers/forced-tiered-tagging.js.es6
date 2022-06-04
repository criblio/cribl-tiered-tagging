import EmberObject from "@ember/object";
import discourseComputed from "discourse-common/utils/decorators";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { apiInitializer } from "discourse/lib/api";
import showModal from "discourse/lib/show-modal";
import I18n from "I18n";
import { arrayNotEmpty, isDefined } from "../lib/field-helpers";

export default apiInitializer("0.11.1", (api) => {
  const PLUGIN_ID = "cribl-tiered-tagging";

  const FIELDS = [
    { name: "product", type: "json" },
    { name: "versions", type: "json" },
    { name: "plainTags", type: "json" },
  ];

  api.modifyClass("model:composer", {
    pluginId: PLUGIN_ID,

    // eslint-disable-next-line no-unused-vars
    save(opts) {
      const product = this.product;
      const versions = this.versions;

      if (this.editingPost) {
        this.set("tags", this.plainTags);
      }

      const tags = this.tags;

      const addToTags = [];

      if (tags) {
        if (!this.editingPost) {
          this.plainTags = tags;
        }

        addToTags.push(...tags);
      }

      if (product) {
        addToTags.push(...product);
      }

      if (versions) {
        addToTags.push(...versions);
      }

      this.set("tags", addToTags);

      return this._super(...arguments);
    },
  });

  api.modifyClass("controller:composer", {
    pluginId: PLUGIN_ID,

    save() {
      if (!this.get("productValidation") && !this.get("versionValidation")) {
        this._super(...arguments);
      } else {
        this.set("lastValidatedAt", Date.now());
      }
    },

    @discourseComputed("model.product", "lastValidatedAt")
    productValidation(product, lastValidatedAt) {
      if (!isDefined(product) || !arrayNotEmpty(product)) {
        return EmberObject.create({
          failed: true,
          reason: I18n.t("cribl_tiered_tagging.product.validation"),
          lastShownAt: lastValidatedAt,
        });
      }
    },

    @discourseComputed("model.versions", "lastValidatedAt")
    versionValidation(versions, lastValidatedAt) {
      if (!isDefined(versions) || !arrayNotEmpty(versions)) {
        return EmberObject.create({
          failed: true,
          reason: I18n.t("cribl_tiered_tagging.version.validation"),
          lastShownAt: lastValidatedAt,
        });
      }
    },
  });

  api.modifyClass("controller:topic", {
    pluginId: PLUGIN_ID,

    actions: {
      finishedEditingTopic() {
        const productTags = this.buffered.get("product") || [];
        const versionTags = this.buffered.get("versions") || [];
        const plainTags = this.buffered.get("plainTags") || [];
        const allTags = [...productTags, ...versionTags, ...plainTags];

        if (!isDefined(productTags) || !arrayNotEmpty(productTags)) {
          return showModal("edit-topic-error", {
            title: "cribl_tiered_tagging.error",
            model: {
              errorMessage: I18n.t("cribl_tiered_tagging.product.validation"),
            },
          });
        } else if (!isDefined(versionTags) || !arrayNotEmpty(versionTags)) {
          return showModal("edit-topic-error", {
            title: "cribl_tiered_tagging.error",
            model: {
              errorMessage: I18n.t("cribl_tiered_tagging.version.validation"),
            },
          });
        }

        this.buffered.setProperties({
          product: productTags,
          versions: versionTags,
          plainTags,
          tags: allTags,
        });

        ajax(`/t/${this.model.id}`, {
          type: "PUT",
          data: {
            plainTags,
            versions: versionTags,
            product: productTags,
          },
        }).catch(popupAjaxError);

        return this._super(...arguments);
      },
    },
  });

  FIELDS.forEach((field) => {
    api.serializeOnCreate(field.name);
    api.serializeToDraft(field.name);
    api.serializeToTopic(field.name, `topic.${field.name}`);
  });
});
