import { reactive } from 'vue';
import selection from '@common/components/customized/SortableTable/selection';

type Row = { id: string };

/** The table's own state and the methods these tests call, bound to it */
interface Table {
  selectedRows: Row[];
  keyField: string;
  $nextTick: Function;
  $emit: jest.Mock;
  updateInput: jest.Mock;
  toggle: Function;
  update: Function;
  pageChanged: Function;
}

const { methods } = selection as unknown as { methods: Record<string, Function> };

/** Reactive as the table's data is, around rows a list gave as plain objects */
const table = (): Table => {
  const ctx = reactive({
    selectedRows: [] as Row[],
    keyField:     'id',
    $nextTick:    (fn: () => void) => fn(),
    $emit:        jest.fn(),
  }) as unknown as Table & Record<string, unknown>;

  Object.entries(methods).forEach(([name, fn]) => {
    ctx[name] = fn.bind(ctx);
  });
  // The checkboxes it ticks are in the page, which these tests don't draw
  ctx.updateInput = jest.fn();

  return ctx;
};

describe('sortableTable selection', () => {
  // As a list that builds its own rows passes them, eg the workload Vulnerabilities tab's images
  const rowA = { id: 'a' };
  const rowB = { id: 'b' };

  it('should unselect a plain row selected before', () => {
    const t = table();

    t.toggle(rowA);
    t.toggle(rowA);

    expect(t.selectedRows).toHaveLength(0);
  });

  it('should only unselect the row asked for', () => {
    const t = table();

    t.update([rowA, rowB], []);
    t.update([], [rowA]);

    expect(t.selectedRows.map((r) => r.id)).toStrictEqual(['b']);
  });

  it('should keep the selected rows still on the page, and drop the ones that left it', () => {
    const t = table();

    t.update([rowA, rowB], []);
    t.pageChanged([rowB]);

    expect(t.selectedRows.map((r) => r.id)).toStrictEqual(['b']);
  });
});
