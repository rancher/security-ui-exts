import { shallowMount } from '@vue/test-utils';
import ImportDialog from '../ImportDialog.vue';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { NAMESPACE } from '@shell/config/types';
import { NAME as NAME_COL, TYPE, NAMESPACE as NAMESPACE_COL, AGE } from '@shell/config/table-headers';

jest.mock('@shell/utils/error', () => ({
  exceptionToErrorsArray: jest.fn((err) => [err]),
}));

const t = jest.fn((key, args, raw) => (raw ? `${ key }:${ JSON.stringify(args) }` : key));

const createNamespace = (name: string) => ({ name });

const createWrapper = ({
  defaultNamespace,
  doAction = jest.fn(),
  dispatch = jest.fn(),
  attachTo,
}: {
  defaultNamespace?: string,
  doAction?: jest.Mock,
  dispatch?: jest.Mock,
  attachTo?: HTMLElement,
} = {}) => {
  return shallowMount(ImportDialog as any, {
    props: { defaultNamespace },
    attachTo,
    global: {
      mocks: {
        t,
        $store: {
          dispatch,
          getters: {
            currentCluster: { doAction },
          },
        },
      },
      directives: {
        t: () => undefined,
        'clean-html': () => undefined,
      },
      stubs: {
        FileSelector: true,
        LabeledSelect: true,
        SortableTable: true,
        YamlEditor: true,
        Banner: true,
        Card: true,
        AsyncButton: true,
        RcButton: true,
      },
    },
  });
};

describe('ImportDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('computed', () => {
    it('namespaceOptions maps and sorts namespaces by label', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).allNamespaces = [
        createNamespace('zeta'),
        createNamespace('alpha'),
        createNamespace('middle'),
      ];

      expect((wrapper.vm as any).namespaceOptions).toEqual([
        { label: 'alpha', value: 'alpha' },
        { label: 'middle', value: 'middle' },
        { label: 'zeta', value: 'zeta' },
      ]);
    });

    it('headers returns expected static table headers', () => {
      const wrapper = createWrapper();

      expect((wrapper.vm as any).headers).toEqual([TYPE, NAME_COL, NAMESPACE_COL, AGE]);
    });
  });

  describe('fetch', () => {
    it('loads namespaces and sets selected namespace to default when available', async() => {
      const dispatch = jest.fn().mockResolvedValue([
        createNamespace('kube-system'),
        createNamespace('default'),
      ]);
      const wrapper = createWrapper({ dispatch });

      (wrapper.vm as any).selectedNamespace = undefined;
      await (wrapper.vm as any).$options.fetch.call(wrapper.vm);

      expect(dispatch).toHaveBeenCalledWith('cluster/findAll', {
        type: NAMESPACE,
        opt:  { url: 'namespaces' },
      });
      expect((wrapper.vm as any).allNamespaces).toEqual([
        createNamespace('kube-system'),
        createNamespace('default'),
      ]);
      expect((wrapper.vm as any).selectedNamespace).toBe('default');
    });

    it('uses first namespace when default is not accessible', async() => {
      const dispatch = jest.fn().mockResolvedValue([
        createNamespace('team-a'),
        createNamespace('team-b'),
      ]);
      const wrapper = createWrapper({ dispatch });

      (wrapper.vm as any).selectedNamespace = undefined;
      await (wrapper.vm as any).$options.fetch.call(wrapper.vm);

      expect((wrapper.vm as any).selectedNamespace).toBe('team-a');
    });

    it('keeps selected namespace when already set', async() => {
      const dispatch = jest.fn().mockResolvedValue([
        createNamespace('default'),
        createNamespace('team-a'),
      ]);
      const wrapper = createWrapper({ dispatch, defaultNamespace: 'preset-ns' });

      await (wrapper.vm as any).$options.fetch.call(wrapper.vm);

      expect((wrapper.vm as any).selectedNamespace).toBe('preset-ns');
    });

    it('handles null namespace response as empty list', async() => {
      const dispatch = jest.fn().mockResolvedValue(null);
      const wrapper = createWrapper({ dispatch });

      (wrapper.vm as any).selectedNamespace = undefined;
      await (wrapper.vm as any).$options.fetch.call(wrapper.vm);

      expect((wrapper.vm as any).allNamespaces).toEqual([]);
      expect((wrapper.vm as any).selectedNamespace).toBeUndefined();
    });
  });

  describe('mounted', () => {
    it('adds import container class and border radius to modal container parent', () => {
      const host = document.createElement('div');

      host.className = 'modal-container';
      document.body.appendChild(host);

      const wrapper = createWrapper({ attachTo: host });

      expect(host.classList.contains('import-dialog-container')).toBe(true);
      expect(host.style.borderRadius).toBe('8px');

      wrapper.unmount();
      host.remove();
    });

    it('does nothing when no modal container parent exists', () => {
      const wrapper = createWrapper();

      expect((wrapper.vm as any)).toBeTruthy();
    });
  });

  describe('methods', () => {
    it('close emits close event', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).close();

      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('onFileSelected clears errors and updates editor value when editor ref exists', () => {
      const wrapper = createWrapper();
      const updateValue = jest.fn();
      const ctx: any = {
        errors: ['old'],
        $refs:  {
          yamleditor: { updateValue },
        },
      };

      (wrapper.vm as any).$options.methods.onFileSelected.call(ctx, 'kind: ConfigMap');

      expect(ctx.errors).toBeNull();
      expect(updateValue).toHaveBeenCalledWith('kind: ConfigMap');
    });

    it('onFileSelected is a no-op when editor ref is missing', () => {
      const wrapper = createWrapper();
      const ctx: any = {
        errors: ['old'],
        $refs:  {},
      };

      (wrapper.vm as any).$options.methods.onFileSelected.call(ctx, 'kind: Secret');

      expect(ctx.errors).toEqual(['old']);
    });

    it('importYaml success applies yaml and sets rows/done', async() => {
      const res = [{ _key: '1' }];
      const doAction = jest.fn().mockResolvedValue(res);
      const btnCb = jest.fn();
      const wrapper = createWrapper({ doAction });

      (wrapper.vm as any).currentYaml = 'apiVersion: v1';
      (wrapper.vm as any).selectedNamespace = 'team-a';
      (wrapper.vm as any).errors = ['old'];

      await (wrapper.vm as any).importYaml(btnCb);

      expect((wrapper.vm as any).errors).toEqual([]);
      expect(doAction).toHaveBeenCalledWith('apply', {
        yaml:             'apiVersion: v1',
        defaultNamespace: 'team-a',
      });
      expect(btnCb).toHaveBeenCalledWith(true);
      expect((wrapper.vm as any).rows).toEqual(res);
      expect((wrapper.vm as any).done).toBe(true);
    });

    it('importYaml failure formats errors and marks done false', async() => {
      const err = new Error('apply failed');
      const doAction = jest.fn().mockRejectedValue(err);
      const btnCb = jest.fn();
      const wrapper = createWrapper({ doAction });
      const mockedExceptionToErrorsArray = exceptionToErrorsArray as jest.Mock;

      mockedExceptionToErrorsArray.mockReturnValueOnce(['formatted-error']);

      (wrapper.vm as any).currentYaml = 'bad yaml';
      (wrapper.vm as any).selectedNamespace = 'team-a';
      (wrapper.vm as any).done = true;

      await (wrapper.vm as any).importYaml(btnCb);

      expect(mockedExceptionToErrorsArray).toHaveBeenCalledWith(err);
      expect((wrapper.vm as any).errors).toEqual(['formatted-error']);
      expect((wrapper.vm as any).done).toBe(false);
      expect(btnCb).toHaveBeenCalledWith(false);
    });

    it('rowClick closes dialog when clicking a link', () => {
      const wrapper = createWrapper();
      const closeSpy = jest.spyOn(wrapper.vm as any, 'close').mockImplementation(() => undefined);

      (wrapper.vm as any).rowClick({ target: { tagName: 'A' } });

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it('rowClick does not close for non-link targets', () => {
      const wrapper = createWrapper();
      const closeSpy = jest.spyOn(wrapper.vm as any, 'close').mockImplementation(() => undefined);

      (wrapper.vm as any).rowClick({ target: { tagName: 'SPAN' } });

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('onReadyYamlEditor emits payload', () => {
      const wrapper = createWrapper();
      const arg = { editor: 'ready' };

      (wrapper.vm as any).onReadyYamlEditor(arg);

      expect(wrapper.emitted('onReadyYamlEditor')).toEqual([[arg]]);
    });
  });
});
