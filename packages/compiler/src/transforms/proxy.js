// @ratscript/compiler/transforms/proxy.js
// proxy Name for target { ... }  ->  const Name = proxy(target, { get: {...}, set: {...}, fn: {...} })

import { arrow, call, identifier, keyOf, object, property } from './../build.js';

export default {

  RsProxyExpression (node, parent, key, context) {
    const groups = { fn: [], get: [], set: [] };

    for (const member of node.members) {
      const { computed, key: memberKey } = keyOf(member.key, member.computed);
      const value = member.mode === 'constant' ? arrow([], member.value) : member.value;
      groups[member.kind].push(property(memberKey, value, computed));
    }

    const spec = Object.entries(groups)
      .filter(([, properties]) => properties.length)
      .map(([kind, properties]) => property(identifier(kind), object(properties)));

    return call(context.helper('proxy'), [node.target, object(spec)], node);
  },
};
