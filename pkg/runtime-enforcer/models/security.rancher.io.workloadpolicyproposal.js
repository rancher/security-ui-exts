import SteveModel from '@shell/plugins/steve/steve-class';
import { WORKLOAD_KIND_TO_TYPE_MAPPING } from '@shell/config/types';
import { PRODUCT_NAME } from '../types/runtime-enforcer';

export default class WorkloadPolicyProposal extends SteveModel {
  get _availableActions() {
    const removed = new Set([
      'goToEdit', 'goToViewConfig', 'goToEditYaml', 'goToViewYaml', 'goToClone', 'cloneYaml', 'viewInApi', 'showConfiguration',
    ]);

    const out = super._availableActions
      .filter((action) => !action.divider && (!action?.action || !removed.has(action.action)))
      .map((action) => {
        // The base "download" action just dumps the resource's raw YAML. The real Export flow
        // needs its own modal (to convert the proposal to an active policy first), so swap in a
        // placeholder action here instead of relabeling the base one.
        if (action.action === 'download') {
          return {
            action:  'exportPolicy',
            label:   this.t('runtimeEnforcer.policyProposal.action.export'),
            icon:    'icon icon-download',
            enabled: true,
          };
        }

        if (action.action === 'promptRemove') {
          return { ...action, label: this.t('runtimeEnforcer.policyProposal.action.delete') };
        }

        return action;
      });

    out.unshift({
      action:  'editPolicy',
      label:   this.t('runtimeEnforcer.policyProposal.action.editPolicy'),
      icon:    'icon icon-edit',
      enabled: true,
    });

    const deleteIndex = out.findIndex((action) => action.action === 'promptRemove');

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

  exportPolicy() {
    // eslint-disable-next-line no-console
    console.warn('WorkloadPolicyProposal.exportPolicy() is not yet implemented.');
  }

  promote() {
    // eslint-disable-next-line no-console
    console.warn('WorkloadPolicyProposal.promote() is not yet implemented.');
  }
}
