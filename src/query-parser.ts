export type FilterExpression = {
  key: string;
  op: string;
  val: string;
}

export function parseQueryFilter(query: any): Array<FilterExpression> {
  if (typeof query != 'object') {
    return [];
  }

  return Object.entries(query).reduce((result, [key, conditions]) => {
    if (typeof conditions === 'string') {
      result.push({ key, op: 'eq', val: conditions});
    } else if (typeof conditions == 'object' && conditions !== null) {
      Object.entries(conditions).forEach(([op, values]) => {
        if (Array.isArray(values)) {
          values.forEach((val) => {
            result.push({key, op, val});
          });
        } else {
          result.push({key, op, val: values});
        }
      });
    } else {
      throw new Error('Conditions must be a string or a filter expression object');
    }
    return result;
  }, [] as Array<FilterExpression>);
}
