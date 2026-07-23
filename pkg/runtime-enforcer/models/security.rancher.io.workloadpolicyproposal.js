import SteveModel from '@shell/plugins/steve/steve-class';
import { WORKLOAD_KIND_TO_TYPE_MAPPING } from '@shell/config/types';
import { PRODUCT_NAME, WORKLOAD_POLICY_KIND } from '../types/runtime-enforcer';

export default class WorkloadPolicyProposal extends SteveModel {
  get _availableActions() {
    const removed = new Set([
      'goToEdit', 'goToViewConfig', 'goToEditYaml', 'goToViewYaml', 'goToClone', 'cloneYaml', 'viewInApi', 'showConfiguration',
    ]);

    const out = super._availableActions
      .filter((action) => !action.divider && (!action?.action || !removed.has(action.action)))
      .map((action) => {
        if (action.action === 'download') {
          return {
            action:     'exportPolicy',
            label:      this.t('runtimeEnforcer.policyProposal.action.export'),
            icon:       'icon icon-download',
            bulkable:   true,
            bulkAction: 'exportPolicy',
            enabled:    true,
          };
        }

        if (action.action === 'promptRemove') {
          return {
            action:     'removeProposal',
            label:      this.t('runtimeEnforcer.policyProposal.action.delete'),
            icon:       'icon icon-trash',
            bulkable:   true,
            bulkAction: 'removeProposal',
            enabled:    true,
          };
        }

        return action;
      });

    out.unshift({
      action:  'editPolicy',
      label:   this.t('runtimeEnforcer.policyProposal.action.editPolicy'),
      icon:    'icon icon-edit',
      enabled: true,
    });

    const deleteIndex = out.findIndex((action) => action.action === 'removeProposal');

    if (deleteIndex > -1) {
      out.splice(deleteIndex, 0, { divider: true });
    }

    return out;
  }

  get parentNameOverride() {
    return this.t('runtimeEnforcer.policyProposal.label');
  }

  get listLocation() {
    return {
      name:   `c-cluster-${ PRODUCT_NAME }-policy-proposals`,
      params: { cluster: this.$rootGetters['clusterId'] },
    };
  }

  get fullDetailPageOverride() {
    return true;
  }

  get disableResourceDetailDrawer() {
    return true;
  }

  get ownerReference() {
    return this.metadata?.ownerReferences?.[0];
  }

  get workload() {
    return this.ownerReference?.name;
  }

  get workloadType() {
    return this.ownerReference?.kind;
  }

  get ownerWorkloadSteveType() {
    return WORKLOAD_KIND_TO_TYPE_MAPPING[this.workloadType];
  }

  get rulesByContainer() {
    return this.spec?.rulesByContainer || {};
  }

  get containerNames() {
    return Object.keys(this.rulesByContainer);
  }

  get containerCount() {
    return this.containerNames.length;
  }

  get executableCount() {
    return this.containerNames.reduce((total, name) => {
      return total + (this.rulesByContainer[name]?.executables?.allowed?.length || 0);
    }, 0);
  }

  /**
   * Builds the WorkloadPolicy representation of this proposal for
   * export, given a target mode.
   *
   * `resourceVersion`/`ownerReferences`/`uid`/`creationTimestamp`/`status` are intentionally
   * omitted from the output.
   */
  toActivePolicyResource(mode) {
    return {
      apiVersion: this.apiVersion,
      kind:       WORKLOAD_POLICY_KIND,
      metadata:   {
        name:      this.metadata?.name,
        namespace: this.metadata?.namespace,
      },
      spec: {
        mode,
        rulesByContainer: this.rulesByContainer,
      },
    };
  }

  get childrenRec() {
    return Object.entries(this.rulesByContainer).map(([containerName, containerRules]) => {
      return {
        container:   containerName,
        image:       containerRules?.image || '',
        executableCount: containerRules?.executables?.allowed?.length || 0,
        executables: containerRules?.executables?.allowed || [],
      };
    });
  }

  get detailPageAdditionalActions() {
    return [
      {
        label:   this.t('runtimeEnforcer.policyProposal.action.promote'),
        icon:    'upgrade-alt',
        variant: 'primary',
        size:    'large',
        onClick: () => this.promote(),
      },
    ];
  }

  editPolicy() {
    // eslint-disable-next-line no-console
    console.warn('WorkloadPolicyProposal.editPolicy() is not yet implemented.');
  }

  exportPolicy(resources = this) {
    this.$dispatch('promptModal', {
      component:  'ExportPolicyDialog',
      resources:  Array.isArray(resources) ? resources : [resources],
      modalWidth: '640',
    });
  }

  removeProposal(resources = this) {
    this.$dispatch('promptModal', {
      component:  'DeletePolicyProposalsDialog',
      resources:  Array.isArray(resources) ? resources : [resources],
      modalWidth: '640',
    });
  }

  promote() {
    // eslint-disable-next-line no-console
    console.warn('WorkloadPolicyProposal.promote() is not yet implemented.');
  }

}
