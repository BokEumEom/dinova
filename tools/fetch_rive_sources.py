import urllib.request, pathlib, concurrent.futures
base='https://raw.githubusercontent.com/rive-app/rive-runtime/main/'
paths=['include/rive/generated/artboard_base.hpp','include/rive/generated/node_base.hpp','include/rive/generated/transform_component_base.hpp','include/rive/generated/component_base.hpp','include/rive/generated/shapes/image_base.hpp','include/rive/generated/assets/image_asset_base.hpp','include/rive/generated/assets/file_asset_base.hpp','include/rive/generated/assets/file_asset_contents_base.hpp','include/rive/generated/animation/linear_animation_base.hpp','include/rive/generated/animation/keyed_object_base.hpp','include/rive/generated/animation/keyed_property_base.hpp','include/rive/generated/animation/keyframe_double_base.hpp','include/rive/generated/animation/keyframe_base.hpp','src/file.cpp','src/runtime_header.cpp','src/animation/keyed_object.cpp','src/importers/artboard_importer.cpp','src/importers/linear_animation_importer.cpp']
def fetch(p):
 try:
  data=urllib.request.urlopen(base+p).read();out=pathlib.Path('artifacts/rive-src')/p.replace('/','_');out.write_bytes(data);return (p,len(data))
 except Exception as e:return(p,str(e))
for r in concurrent.futures.ThreadPoolExecutor(8).map(fetch,paths): print(r)
