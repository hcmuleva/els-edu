
import os
import json

def extract_schema_info(schema_path):
    with open(schema_path, 'r') as f:
        schema = json.load(f)

    collection_info = {
        "collectionName": schema.get("collectionName"),
        "fields": []
    }

    attributes = schema.get("attributes", {})
    for field_name, field_props in attributes.items():
        field_info = {
            "fieldName": field_name,
            "type": field_props.get("type")
        }
        if field_props.get("type") == "relation":
            field_info["relationType"] = field_props.get("relation")
        collection_info["fields"].append(field_info)

    return collection_info

schema_infos = []
for root, dirs, files in os.walk("."):
    for file in files:
        if file == "schema.json" and "content-types" in root:
            schema_path = os.path.join(root, file)
            schema_info = extract_schema_info(schema_path)
            schema_infos.append(schema_info)

output_path = "collections_schema_summary.json"
with open(output_path, "w") as f:
    json.dump(schema_infos, f, indent=2)

print(f"Extracted schema information has been saved to {output_path}.")
