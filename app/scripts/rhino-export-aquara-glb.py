import os
import re

import rhinoscriptsyntax as rs
import scriptcontext as sc


SOURCE_TAG = "aquara"
OUTPUT_PATH = os.environ.get("AQUARA_GLB_OUTPUT", r"D:\aquara-full-export.glb")
LOG_PATH = os.environ.get("AQUARA_GLB_LOG", r"D:\aquara-full-export.log")


def safe_tag(value):
    value = value or "default"
    value = re.sub(r"[^0-9A-Za-z_-]+", "-", value).strip("-")
    return value.lower() or "default"


def visible_breps():
    result = []
    for object_id in rs.AllObjects(selectable=True, include_lights=False) or []:
        if rs.IsObjectHidden(object_id) or not rs.IsBrep(object_id):
            continue
        result.append(object_id)
    return result


def tag_objects(object_ids):
    layer_counts = {}
    for index, object_id in enumerate(object_ids):
        layer_name = rs.ObjectLayer(object_id) or "default"
        layer_tag = safe_tag(layer_name)
        layer_counts[layer_tag] = layer_counts.get(layer_tag, 0) + 1
        attributes = sc.doc.Objects.FindId(object_id)
        if attributes is None:
            continue
        attributes.Attributes.Name = "{0}-{1}-{2:04d}".format(SOURCE_TAG, layer_tag, index)
        attributes.CommitChanges()
    return layer_counts


def export_selected(output_path):
    output_path = os.path.abspath(output_path)
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.isdir(output_dir):
        os.makedirs(output_dir)
    rs.UnselectAllObjects()
    object_ids = visible_breps()
    if not object_ids:
        raise RuntimeError("No visible Brep objects found")
    tag_counts = tag_objects(object_ids)
    rs.SelectObjects(object_ids)
    if os.path.exists(output_path):
        os.remove(output_path)
    # The command-line exporter accepts the file path followed by the default
    # GLB export options. Materials are intentionally overridden in the web
    # viewer, so source CMF data is not required for the public preview.
    command = '_-Export "{0}" _Enter _Enter'.format(output_path)
    if not rs.Command(command, echo=False):
        raise RuntimeError("Rhino GLB export command failed")
    rs.UnselectAllObjects()
    if not os.path.exists(output_path):
        raise RuntimeError("Rhino reported success but GLB was not created")
    return len(object_ids), tag_counts


def write_log(message):
    with open(LOG_PATH, "w", encoding="utf-8") as handle:
        handle.write(message)


write_log("STARTED\n")
try:
    count, tag_counts = export_selected(OUTPUT_PATH)
    write_log("OK\nobjects={0}\nlayers={1}\n".format(count, tag_counts))
except Exception as error:
    write_log("ERROR\n{0}\n".format(error))
    raise
