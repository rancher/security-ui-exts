import SteveModel from '@shell/plugins/steve/steve-class';
import { RESOURCE, POLICY_LABEL_KEY, PRODUCT_NAME } from '../types/runtime-enforcer';
import { WORKLOAD_KIND_TO_TYPE_MAPPING } from '@shell/config/types';

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

    const deleteIndex = out.findIndex((action) => action.action === 'removeProposal');

    if (deleteIndex > -1) {
      out.splice(deleteIndex, 0, { divider: true });
    }

    if (this.$rootState.targetRoute && this.$rootState.targetRoute.params && 'id' in this.$rootState.targetRoute.params) {
      return out;
    }

    out.unshift({
      action:  'changeMode',
      label:   this.t('runtimeEnforcer.activePolicies.actions.changeMode'),
      icon:    'icon icon-refresh',
      enabled: true,
    });

    return out;
  }

  get workloadRef() {
    let workloads = [];

    return (() => {
      try {
        Object.values(WORKLOAD_KIND_TO_TYPE_MAPPING).map((workloadType) => {
          const workloadList = this.$getters['all'](workloadType);

          workloads = workloads.concat(workloadList || []);
        });

        const workload = workloads.find((workload) => {
          const podTemplate = workload.spec?.jobTemplate?.spec?.template ?? workload.spec?.template;

          if (!podTemplate) {
            return;
          }

          const metadata = podTemplate.metadata ??= {};
          const labels = metadata.labels ??= {};

          return labels?.[POLICY_LABEL_KEY] === this.metadata?.name && this.metadata?.namespace === workload.metadata?.namespace;
        });


        if (workload) {
          const cluster = this.$rootState.targetRoute.params.cluster;
          const containers = workload.spec?.template?.spec?.containers
            || workload.spec?.jobTemplate?.spec?.template?.spec?.containers
            || [];

          const imageMap = containers.reduce((acc, container) => {
            acc[container.name] = container.image;

            return acc;
          }, {});

          return {
            workloadName:     workload.metadata?.name || '',
            workloadType:     workload.kind || '',
            workloadLocation: `/c/${ cluster }/explorer/${ WORKLOAD_KIND_TO_TYPE_MAPPING[workload.kind] || '' }/${ workload.metadata?.namespace || '' }/${ workload.metadata?.name || '' }`,
            imageMap,
          };
        }

        return {
          workloadName:     '',
          workloadType:     '',
          workloadLocation: '',
          imageMap:         {},
        };
      } catch {
        return {
          workloadName:     '',
          workloadType:     '',
          workloadLocation: '',
          imageMap:         {}
        };
      }
    })();
  }

  get violationCount() {
    return this.status?.violationCount || 0;
  }

  get activeViolationCount() {
    return this.status?.activeViolationCount || 0;
  }

  get fullDetailPageOverride() {
    return true;
  }

  get disableResourceDetailDrawer() {
    return true;
  }

  get executables() {
    const rulesByContainer = this.spec?.rulesByContainer || {};
    const executables = [];

    Object.values(rulesByContainer).forEach((container) => {
      const allowedExecutables = container?.executables?.allowed || [];

      executables.push(...allowedExecutables);
    });

    return executables;
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

  editPolicy() {
    this.goToEdit();
  }

}