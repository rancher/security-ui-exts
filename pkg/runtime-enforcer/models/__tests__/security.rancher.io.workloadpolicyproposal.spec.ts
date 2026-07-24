import SteveModel from '@shell/plugins/steve/steve-class';
import WorkloadPolicyProposal from '../security.rancher.io.workloadpolicyproposal';
import { PRODUCT_NAME } from '../../types/runtime-enforcer';

jest.mock('@shell/plugins/steve/steve-class', () => {
  const MockSteveModel = class {
    constructor() {
      this.spec = {};
      this.metadata = {};
      this.t = jest.fn((key) => key);
      this.$rootGetters = { clusterId: 'local' };
      this.$dispatch = jest.fn();
    }

    get _availableActions() {
      return [
        { action: 'showConfiguration', label: 'Show Configuration' },
        { divider: true },
        { action: 'goToEdit', label: 'Edit' },
        { action: 'goToEditYaml', label: 'Edit YAML' },
        { action: 'goToClone', label: 'Clone' },
        { divider: true },
        { action: 'download', label: 'Download' },
        { action: 'viewInApi', label: 'View in API' },
        { action: 'promptRemove', label: 'Delete' },
      ];
    }
  };

  return {
    __esModule: true,
    default:    MockSteveModel,
  };
});

describe('WorkloadPolicyProposal model', () => {
  let proposal: any;
  let superAvailableActionsSpy: jest.SpyInstance;

  const baseActions = [
    { action: 'showConfiguration', label: 'Show Configuration' },
    { divider: true },
    { action: 'goToEdit', label: 'Edit' },
    { action: 'goToEditYaml', label: 'Edit YAML' },
    { action: 'goToClone', label: 'Clone' },
    { divider: true },
    { action: 'download', label: 'Download' },
    { action: 'viewInApi', label: 'View in API' },
    { action: 'promptRemove', label: 'Delete' },
  ];

  beforeEach(() => {
    proposal = new WorkloadPolicyProposal();
    jest.clearAllMocks();

    superAvailableActionsSpy = jest.spyOn(SteveModel.prototype, '_availableActions', 'get');
    superAvailableActionsSpy.mockReturnValue(baseActions);
  });

  describe('_availableActions', () => {
    it('removes base actions that have no custom edit/yaml/api support', () => {
      const actionNames = proposal._availableActions.map((a: any) => a.action);

      expect(actionNames).not.toContain('showConfiguration');
      expect(actionNames).not.toContain('goToEdit');
      expect(actionNames).not.toContain('goToEditYaml');
      expect(actionNames).not.toContain('goToClone');
      expect(actionNames).not.toContain('viewInApi');
    });

    it('strips the base dividers entirely', () => {
      const actions = proposal._availableActions;
      const dividerCount = actions.filter((a: any) => a.divider).length;

      expect(dividerCount).toBe(1);
    });

    it('prepends an "Edit Policy" action', () => {
      const actions = proposal._availableActions;

      expect(actions[0]).toMatchObject({
        action:  'editPolicy',
        label:   'runtimeEnforcer.policyProposal.action.editPolicy',
        enabled: true,
      });
    });

    it('replaces "download" with a bulkable "exportPolicy" action', () => {
      const actions = proposal._availableActions;
      const exportAction = actions.find((a: any) => a.action === 'exportPolicy');

      expect(exportAction).toMatchObject({
        label:      'runtimeEnforcer.policyProposal.action.export',
        bulkable:   true,
        bulkAction: 'exportPolicy',
        enabled:    true,
      });
      expect(actions.some((a: any) => a.action === 'download')).toBe(false);
    });

    it('relabels "promptRemove" to the custom "removeProposal" action', () => {
      const actions = proposal._availableActions;
      const removeAction = actions.find((a: any) => a.action === 'removeProposal');

      expect(removeAction.label).toBe('runtimeEnforcer.policyProposal.action.delete');
    });

    it('places exactly one divider immediately before "removeProposal"', () => {
      const actions = proposal._availableActions;
      const removeIndex = actions.findIndex((a: any) => a.action === 'removeProposal');

      expect(actions[removeIndex - 1]).toEqual({ divider: true });
      expect(actions.filter((a: any) => a.divider).length).toBe(1);
    });

    it('produces the expected final ordering', () => {
      const actionNames = proposal._availableActions.map((a: any) => a.action ?? 'divider');

      expect(actionNames).toEqual(['editPolicy', 'exportPolicy', 'divider', 'removeProposal']);
    });
  });

  describe('parentNameOverride', () => {
    it('returns the translated Policy Proposal label', () => {
      expect(proposal.parentNameOverride).toBe('runtimeEnforcer.policyProposal.label');
      expect(proposal.t).toHaveBeenCalledWith('runtimeEnforcer.policyProposal.label');
    });
  });

  describe('listLocation', () => {
    it('returns the route to the custom Policy Proposals list page', () => {
      expect(proposal.listLocation).toEqual({
        name:   `c-cluster-${ PRODUCT_NAME }-policy-proposals`,
        params: { cluster: 'local' },
      });
    });
  });

  describe('fullDetailPageOverride', () => {
    it('is true', () => {
      expect(proposal.fullDetailPageOverride).toBe(true);
    });
  });

  describe('disableResourceDetailDrawer', () => {
    it('is true', () => {
      expect(proposal.disableResourceDetailDrawer).toBe(true);
    });
  });

  describe('ownerReference', () => {
    it('returns the first ownerReference', () => {
      proposal.metadata = { ownerReferences: [{ name: 'my-deploy', kind: 'Deployment' }] };
      expect(proposal.ownerReference).toEqual({ name: 'my-deploy', kind: 'Deployment' });
    });

    it('returns undefined when there are no ownerReferences', () => {
      proposal.metadata = {};
      expect(proposal.ownerReference).toBeUndefined();
    });
  });

  describe('workload / workloadType', () => {
    it('returns the owning workload name and kind', () => {
      proposal.metadata = { ownerReferences: [{ name: 'my-deploy', kind: 'Deployment' }] };

      expect(proposal.workload).toBe('my-deploy');
      expect(proposal.workloadType).toBe('Deployment');
    });
  });

  describe('ownerWorkloadSteveType', () => {
    it('maps the owner kind to its Steve resource type', () => {
      proposal.metadata = { ownerReferences: [{ name: 'my-deploy', kind: 'Deployment' }] };
      expect(proposal.ownerWorkloadSteveType).toBe('apps.deployment');
    });

    it('maps CronJob kind to its Steve resource type', () => {
      proposal.metadata = { ownerReferences: [{ name: 'my-cronjob', kind: 'CronJob' }] };
      expect(proposal.ownerWorkloadSteveType).toBe('batch.cronjob');
    });
  });

  describe('rulesByContainer / containerNames / containerCount / executableCount', () => {
    it('defaults to empty when spec.rulesByContainer is missing', () => {
      proposal.spec = {};

      expect(proposal.rulesByContainer).toEqual({});
      expect(proposal.containerNames).toEqual([]);
      expect(proposal.containerCount).toBe(0);
      expect(proposal.executableCount).toBe(0);
    });

    it('derives container names/count and total executable count from spec', () => {
      proposal.spec = {
        rulesByContainer: {
          nginx: { executables: { allowed: ['/usr/bin/nginx', '/usr/bin/curl'] } },
          proxy: { executables: { allowed: ['/bin/oauth2-proxy'] } },
        },
      };

      expect(proposal.containerNames).toEqual(['nginx', 'proxy']);
      expect(proposal.containerCount).toBe(2);
      expect(proposal.executableCount).toBe(3);
    });

    it('treats containers with no allowed executables as contributing zero', () => {
      proposal.spec = { rulesByContainer: { empty: {} } };

      expect(proposal.containerCount).toBe(1);
      expect(proposal.executableCount).toBe(0);
    });
  });

  describe('editPolicy / exportPolicy / promote', () => {
    it('editPolicy() does not throw', () => {
      expect(() => proposal.editPolicy()).not.toThrow();
    });

    it('exportPolicy() dispatches promptModal with itself as the sole resource by default', () => {
      proposal.exportPolicy();

      expect(proposal.$dispatch).toHaveBeenCalledWith('promptModal', {
        component:  'ExportPolicyDialog',
        resources:  [proposal],
        modalWidth: '640',
      });
    });

    it('exportPolicy() dispatches promptModal with the given array of resources when called in bulk', () => {
      const other = new WorkloadPolicyProposal();

      proposal.exportPolicy([proposal, other]);

      expect(proposal.$dispatch).toHaveBeenCalledWith('promptModal', {
        component:  'ExportPolicyDialog',
        resources:  [proposal, other],
        modalWidth: '640',
      });
    });

    it('promote() does not throw', () => {
      expect(() => proposal.promote()).not.toThrow();
    });
  });

  describe('toActivePolicyResource', () => {
    it('converts the proposal into a WorkloadPolicy shape with the given mode', () => {
      proposal.apiVersion = 'security.rancher.io/v1alpha1';
      proposal.metadata = { name: 'deploy-nginx-ingress', namespace: 'ingress' };
      proposal.spec = { rulesByContainer: { nginx: { executables: { allowed: ['/usr/bin/nginx'] } } } };

      expect(proposal.toActivePolicyResource('protect')).toEqual({
        apiVersion: 'security.rancher.io/v1alpha1',
        kind:       'WorkloadPolicy',
        metadata:   { name: 'deploy-nginx-ingress', namespace: 'ingress' },
        spec:       {
          mode:             'protect',
          rulesByContainer: { nginx: { executables: { allowed: ['/usr/bin/nginx'] } } },
        },
      });
    });

    it('omits ownerReferences/resourceVersion/uid/creationTimestamp/status from the exported metadata', () => {
      proposal.metadata = {
        name:            'deploy-nginx-ingress',
        namespace:       'ingress',
        ownerReferences: [{
          kind: 'Deployment', name: 'nginx-ingress', uid: 'abc-123'
        }],
        resourceVersion:   '12345',
        uid:               'proposal-uid',
        creationTimestamp: '2026-01-01T00:00:00Z',
      };

      const result = proposal.toActivePolicyResource('monitor');

      expect(result.metadata).toEqual({ name: 'deploy-nginx-ingress', namespace: 'ingress' });
      expect(result.status).toBeUndefined();
    });
  });
});
