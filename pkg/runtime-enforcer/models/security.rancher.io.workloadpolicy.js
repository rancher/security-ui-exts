import SteveModel from '@shell/plugins/steve/steve-class';
import { RESOURCE } from '../types/runtime-enforcer';

export default class WorkloadPolicyProposal extends SteveModel {
  get _availableActions() {
    const removed = new Set([
      'goToViewConfig', 'goToEditYaml', 'goToViewYaml', 'goToClone', 'cloneYaml', 'viewInApi', 'showConfiguration',
    ]);

    const out = super._availableActions
      .filter((action) => !action.divider && (!action?.action || !removed.has(action.action)))
      .map((action) => {
        if (action.action === 'goToEdit') {
          return {
            action:  'editPolicy',
            label:   this.t('runtimeEnforcer.policyProposal.action.editPolicy'),
            icon:    'icon icon-edit',
            enabled: true,
          };
        }
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
      action:  'changeMode',
      label:   this.t('runtimeEnforcer.activePolicies.actions.changeMode'),
      icon:    'icon icon-refresh',
      enabled: true,
    });



    const deleteIndex = out.findIndex((action) => action.action === 'removeProposal');

    if (deleteIndex > -1) {
      out.splice(deleteIndex, 0, { divider: true });
    }

    return out;
  }

  get violationCount() {
    return this.status?.violationCount || 0;
  }

  changeMode(resources = this) {
    this.$dispatch('promptModal', {
      component:  'ChangeModeDialog',
      resources:  Array.isArray(resources) ? resources : [resources],
      modalWidth: '640',
    });
  }


  removeProposal(resources = this) {
    this.$dispatch('promptModal', {
      component:  'DeleteActivePoliciesDialog',
      resources:  Array.isArray(resources) ? resources : [resources],
      modalWidth: '640',
    });
  }

  /*
   ToDo: Need a ExportActivePoliciesDialog component to handle the export of active policies.
   The current implementation is a placeholder and should be replaced with the actual dialog component when it is available.
  */
  exportPolicy(resources = this) {
    this.$dispatch('promptModal', {
      component:      'ExportPolicyDialog',
      resources:      Array.isArray(resources) ? resources : [resources],
      componentProps: { type: RESOURCE.ACTIVE_POLICIES },
      modalWidth:     '640',
    });
  }
}

