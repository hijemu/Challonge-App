const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'server', 'index.cjs');
let src = fs.readFileSync(file, 'utf8');

src = src.replace(
  /function relationId\(attrs, key\) \{ return Number\(attrs\.relationships\?\.\[key\]\?\.data\?\.id \|\| attrs\[key \+ '_id'\] \|\| 0\) \|\| null; \}/,
  `function relationId(rowOrAttrs, key) {\n  const attrs = rowOrAttrs.attributes || rowOrAttrs || {};\n  const relationships = rowOrAttrs.relationships || attrs.relationships || {};\n  return Number(relationships?.[key]?.data?.id || attrs[key + '_id'] || attrs[key + 'Id'] || 0) || null;\n}`
);

src = src.replace(
  /player1_id: relationId\(attrs, 'player1'\), player2_id: relationId\(attrs, 'player2'\),/,
  `player1_id: relationId(row, 'player1'), player2_id: relationId(row, 'player2'),`
);

fs.writeFileSync(file, src);
console.log('Fixed server/index.cjs match player relationship mapping.');
