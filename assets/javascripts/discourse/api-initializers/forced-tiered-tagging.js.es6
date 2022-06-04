import EmberObject from "@ember/object";
import { getOwner } from "discourse-common/lib/get-owner";
import discourseComputed from "discourse-common/utils/decorators";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { apiInitializer } from "discourse/lib/api";
import showModal from "discourse/lib/show-modal";
import I18n from "I18n";
import { arrayNotEmpty, isDefined, undasherize } from "../lib/field-helpers";

export default apiInitializer("0.11.1", (api) => {
  const PLUGIN_ID = "cribl-tiered-tagging";

  const FIELDS = [
    { name: "product", type: "json" },
    { name: "versions", type: "json" },
    { name: "plainTags", type: "json" },
  ];

  api.modifyClass("model:composer", {
    pluginId: PLUGIN_ID,

    save(opts) {
      const product = this.product;
      const version = this.version;
      const tags = this.tags;

      const addToTags = [];

      if (tags) {
        this.plainTags = tags;
        addToTags.push(...tags);
      }

      if (product) {
        addToTags.push(...product);
      }

      if (version) {
        addToTags.push(...version);
      }

      this.set("tags", addToTags);

      return this._super(...arguments);
    },
  });

  api.modifyClass("controller:composer", {
    pluginId: PLUGIN_ID,

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
        const versionTags = this.buffered.get("version") || [];
        const plainTags = this.buffered.get("plainTags") || [];
        const allTags = [...productTags, ...versionTags, ...plainTags];

        if (
          !isDefined(this.model.product) ||
          !arrayNotEmpty(this.model.product)
        ) {
          return showModal("edit-topic-error", {
            title: "cribl_tiered_tagging.error",
            model: {
              errorMessage: I18n.t("cribl_tiered_tagging.product.validation"),
            },
          });
        } else if (
          !isDefined(this.model.versions) ||
          !arrayNotEmpty(this.model.versions)
        ) {
          return showModal("edit-topic-error", {
            title: "cribl_tiered_tagging.error",
            model: {
              errorMessage: I18n.t("cribl_tiered_tagging.version.validation"),
            },
          });
        }

        this.buffered.set("product", productTags);
        this.buffered.set("versions", versionTags);
        this.buffered.set("plainTags", plainTags);
        this.buffered.set("tags", allTags);

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

        this.buffered.set("tags", [
          ...plainTags,
          ...this.model.product,
          ...this.model.versions,
        ]);

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
