from pathlib import Path

import numpy as np
import rhino3dm
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals


SOURCE = Path(r"D:\aigc-private-model-data-root\aquara\aquara-latest.3dm")
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "models" / "aquara" / "aquara-complete.glb"

# The dock is in the positive-Y band and the cleaning robot is below it in the
# same Rhino assembly (roughly Y=-100..0). Keep that single product assembly,
# not the other layout copies spread across the document.
X_RANGE = (-90.0, 90.0)
Y_RANGE = (-110.0, 300.0)
Z_RANGE = (-10.0, 90.0)


def rgba_from_rhino(color, fallback=(180, 185, 185, 255)):
    values = list(color or fallback)
    if len(values) < 4:
        values.append(255)
    return tuple(max(0, min(255, int(value))) for value in values[:4])


def material_for(file3dm, attributes, cache):
    index = attributes.MaterialIndex
    if 0 <= index < len(file3dm.Materials):
        source = file3dm.Materials[index]
        rgba = rgba_from_rhino(source.DiffuseColor)
        key = (index, rgba)
    else:
        rgba = (180, 185, 185, 255)
        key = ("default", rgba)
    if key not in cache:
        alpha = rgba[3] / 255.0
        cache[key] = PBRMaterial(
            name=f"aquara-material-{len(cache)}",
            baseColorFactor=[*rgba[:3], alpha],
            metallicFactor=0.18,
            roughnessFactor=0.32,
            alphaMode="BLEND" if alpha < 0.995 else "OPAQUE",
            alphaCutoff=0.01,
            doubleSided=True,
        )
    return cache[key]


def convert_brep(brep):
    vertices = []
    faces = []
    uvs = []
    has_uv = True
    for face in brep.Faces:
        mesh = face.GetMesh(rhino3dm.MeshType.Render) or face.GetMesh(rhino3dm.MeshType.Any)
        if mesh is None:
            continue
        offset = len(vertices)
        vertices.extend((point.X, point.Y, point.Z) for point in mesh.Vertices)
        if len(mesh.TextureCoordinates) == len(mesh.Vertices):
            uvs.extend((uv.X, uv.Y) for uv in mesh.TextureCoordinates)
        else:
            has_uv = False
            uvs.extend((0.0, 0.0) for _ in mesh.Vertices)
        for a, b, c, d in mesh.Faces:
            faces.append((offset + a, offset + b, offset + c))
            if d != c:
                faces.append((offset + a, offset + c, offset + d))
    if not faces:
        return None
    return (
        np.asarray(vertices, dtype=np.float32),
        np.asarray(faces, dtype=np.int64),
        np.asarray(uvs, dtype=np.float32),
        has_uv,
    )


def main():
    file3dm = rhino3dm.File3dm.Read(str(SOURCE))
    if file3dm is None:
        raise RuntimeError(f"Unable to read {SOURCE}")

    scene = trimesh.Scene()
    materials = {}
    objects = 0
    triangles = 0
    for object_index, obj in enumerate(file3dm.Objects):
        if type(obj.Geometry).__name__ != "Brep":
            continue
        bounds = obj.Geometry.GetBoundingBox()
        center = bounds.Center
        if not (
            X_RANGE[0] <= center.X <= X_RANGE[1]
            and Y_RANGE[0] <= center.Y <= Y_RANGE[1]
            and Z_RANGE[0] <= center.Z <= Z_RANGE[1]
        ):
            continue
        converted = convert_brep(obj.Geometry)
        if converted is None:
            continue
        vertices, faces, uvs, has_uv = converted
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
        mesh.visual = TextureVisuals(
            uv=uvs if has_uv else None,
            material=material_for(file3dm, obj.Attributes, materials),
        )
        name = f"aquara-part-{object_index:04d}"
        scene.add_geometry(mesh, geom_name=name, node_name=name)
        objects += 1
        triangles += len(faces)

    if objects == 0:
        raise RuntimeError("No Aqua assembly meshes matched the product bounds")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    scene.export(str(OUTPUT), file_type="glb")
    print(f"wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes, {objects} parts, {triangles} triangles)")


if __name__ == "__main__":
    main()
