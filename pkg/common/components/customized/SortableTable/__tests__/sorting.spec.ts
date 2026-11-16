import sorting from '@common/components/customized/SortableTable/sorting';

const { arrangedRows } = (sorting as any).computed;

function createContext(rows: { id: string }[]) {
  return {
    rows,
    sortFields:                ['id'],
    descending:                false,
    sortGeneration:            undefined,
    sortGenerationFn:          () => 'gen1',
    externalPaginationEnabled: false,
    ...(sorting as any).data.call({ headers: [], defaultSortBy: 'id' }),
  };
}

const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

describe('sorting mixin: arrangedRows', () => {
  it('shows the new rows when a filter returns different rows with the same count', () => {
    const ctx = createContext([{ id: 'deploy-b' }, { id: 'deploy-a' }]);

    expect(ids(arrangedRows.call(ctx))).toStrictEqual(['deploy-a', 'deploy-b']);

    ctx.rows = [{ id: 'cronjob-b' }, { id: 'cronjob-a' }];

    expect(ids(arrangedRows.call(ctx))).toStrictEqual(['cronjob-a', 'cronjob-b']);
  });
});
