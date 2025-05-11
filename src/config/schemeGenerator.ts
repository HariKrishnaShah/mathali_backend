import { getMetadataArgsStorage } from "typeorm";
async function generateSchema() {
  const schema: any = {};
  const storage = getMetadataArgsStorage();

  storage.tables.forEach((table: any) => {
    schema[table.target.name] = {};
    storage.columns
      .filter((col) => col.target === table.target)
      .forEach((col) => {
        schema[table.target.name][col.propertyName] = col.options.type;
      });

    storage.relations
      .filter((rel) => rel.target === table.target)
      .forEach((rel) => {
        schema[table.target.name][rel.propertyName] = `Relation[${rel.type}]`;
      });
  });

  console.log(JSON.stringify(schema, null, 2));
}

export default generateSchema;
