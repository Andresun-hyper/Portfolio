import { modelPreviewsSchema } from './model-previews.schema';

export const modelPreviews = modelPreviewsSchema.parse({
  droplet: {
    model: './models/droplet/droplet.glb',
    poster: './droplet-source-render-red-dot-2026.png',
    fallbackImage: './droplet-source-render-red-dot-2026.png',
    size: '709 KB',
    unit: 'mm',
    camera: {
      fov: 40,
      position: [150, 110, 220],
      target: [0, 20, 0],
      autoRotate: false,
    },
    // The source GLB has generic node names, so these stable mesh ranges keep
    // the interaction usable without baking source-software metadata into the build.
    parts: [
      {
        id: 'droplet-body',
        labelEn: 'Main body',
        labelZh: '主体外壳',
        descriptionEn: 'The bottle body keeps the portable water supply and the grip surface together.',
        descriptionZh: '瓶身把便携储水和握持区域整合在同一段结构里。',
        match: { meshRange: [0, 8] },
      },
      {
        id: 'droplet-grip',
        labelEn: 'Grip loop',
        labelZh: '握持环',
        descriptionEn: 'A compact loop for carrying the bottle while moving with a pet.',
        descriptionZh: '用于户外携带的环形握持结构，便于运动中快速拿取。',
        match: { meshRange: [9, 9] },
      },
      {
        id: 'droplet-spout',
        labelEn: 'Drinking spout',
        labelZh: '饮水口',
        descriptionEn: 'The upper outlet guides water into the pet-facing drinking area.',
        descriptionZh: '上部出水结构把水导向宠物饮水区域。',
        match: { meshRange: [10, 10] },
      },
      {
        id: 'droplet-flow-channel',
        labelEn: 'Flow channel',
        labelZh: '导流结构',
        descriptionEn: 'The internal stack describes how water moves between the bottle and the outlet.',
        descriptionZh: '内部叠层表达水从瓶身进入出水口的导流关系。',
        match: { meshRange: [11, 33] },
      },
      {
        id: 'droplet-water-tank',
        labelEn: 'Pull-out water tray',
        labelZh: '抽出式水槽',
        descriptionEn: 'The integrated side tray lifts a short distance along the bottle for a visible drinking setup without detaching.',
        descriptionZh: '下部水槽可向前抽出，形成更直观的饮水使用姿态。',
        // The pull-out tank is the side structure shown in the reference,
        // together with the lower-shell pieces that stay mechanically joined.
        match: { meshRange: [34, 37] },
      },
      {
        id: 'droplet-tray-handle',
        labelEn: 'Tray handle',
        labelZh: '水槽提手',
        descriptionEn: 'The small handle travels with the pull-out tray so the extraction direction stays readable.',
        descriptionZh: '小提手与抽出式水槽同步移动，让抽出方向更清晰。',
        match: { meshIndex: 38 },
      },
      {
        id: 'droplet-bottom-shell',
        labelEn: 'Lower shell',
        labelZh: '下部外壳',
        descriptionEn: 'The lower shell stays seated while the inner drinking tray slides out.',
        descriptionZh: '下部外壳保持在机身上，内部饮水槽从中滑出。',
        match: { meshIndex: 37 },
      },
    ],
    animations: [
      {
        id: 'tank-pullout',
        labelEn: 'Pull out water tray',
        labelZh: '抽出水槽',
        descriptionEn: 'Lift the integrated water tray upward along the bottle while keeping it engaged.',
        descriptionZh: '把下部水槽向前抽出，展示饮水使用方式。',
        partIds: ['droplet-water-tank', 'droplet-tray-handle'],
        // Mesh nodes are positioned in the shared model frame. A short
        // positive Y offset lifts the joined sleeve upward along the bottle,
        // while keeping its lower shell and handle overlapped with the body.
        offset: [0, 0.055, 0],
        durationMs: 1400,
      },
    ],
    noteEn: 'A lightweight, pure-white GLB viewer for direct angle inspection and a pull-out water-tray motion study.',
    noteZh: '轻量纯白 GLB 网页查看器，支持旋转观察和抽出式水槽动画演示。',
  },
  aquara: {
    model: './models/aquara/aquara-complete.glb',
    poster: './aqua-robot-cover.webp',
    fallbackImage: './aqua-robot-cover.webp',
    size: '39.7 MB',
    unit: 'mm',
    camera: {
      fov: 40,
      position: [220, 120, 260],
      target: [0, 70, 0],
      autoRotate: false,
    },
    parts: [
      {
        id: 'aquara-charging-dock',
        labelEn: 'Charging dock',
        labelZh: '充电回仓',
        descriptionEn: 'The upper charging dock stays fixed while the cleaning robot disengages below it.',
        descriptionZh: '上部充电回仓保持固定，清洁机器人从下方脱离。',
        match: {
          nameIncludes: [
            '-0563', '-1420', '-1423', '-1520', '-1529', '-2353',
            '-3959', '-3962', '-3963', '-3964', '-3965', '-3966',
          ],
        },
      },
      {
        id: 'aquara-robot-body',
        labelEn: 'Cleaning robot body',
        labelZh: '清洁机器人主体',
        descriptionEn: 'The lower robot body leaves the dock as one assembly, including the cleaning face and side housings.',
        descriptionZh: '下方机器人主体连同清洁面和侧向外壳整体离开回仓。',
        // The lower robot was below Y=0 in the Rhino assembly. The complete
        // export keeps that group under the 36xx-39xx source ids.
        match: { nameIncludes: ['aquara-part-36', 'aquara-part-37', 'aquara-part-38', 'aquara-part-39'] },
      },
      {
        id: 'aquara-robot-wheels',
        labelEn: 'Robot wheels and rollers',
        labelZh: '机器人轮组',
        descriptionEn: 'The wheel and roller housings travel with the lower robot body during undocking.',
        descriptionZh: '轮组和滚轮外壳随下方机器人主体一起脱离回仓。',
        match: { nameIncludes: [
          'aquara-part-388', 'aquara-part-389',
          '-3900', '-3901', '-3902', '-3903', '-3904', '-3905', '-3906',
        ] },
      },
      {
        id: 'aquara-telescopic-rods',
        labelEn: 'Telescopic rods',
        labelZh: '伸缩杆',
        descriptionEn: 'The paired support rods retract into the dock as the cleaning robot disengages.',
        descriptionZh: '两侧伸缩杆在清洁机器人脱离时回收到回仓内部。',
        match: {
          nameIncludes: [
            'aquara-part-029', 'aquara-part-030',
            '-1578', '-1591', '-1978', '-1979', '-2340', '-2341',
          ],
        },
      },
      {
        id: 'aquara-cleaning-roller',
        labelEn: 'Cleaning roller',
        labelZh: '清洁滚刷',
        descriptionEn: 'The small cleaning contact remains part of the moving robot assembly.',
        descriptionZh: '小型清洁接触件作为移动机器人组件的一部分保留。',
        match: { nameIncludes: ['-3907'] },
      },
      {
        id: 'aquara-shell',
        labelEn: 'Main shell',
        labelZh: '主体结构',
        descriptionEn: 'The main shell contains the robot body and the primary buoyant volume.',
        descriptionZh: '主体外壳承载机器人的主要体量和核心结构。',
        match: { partId: 'aquara-layer-00' },
      },
      {
        id: 'aquara-upper',
        labelEn: 'Upper structure',
        labelZh: '上层结构',
        descriptionEn: 'Upper components shape the robot profile and connect the operating modules.',
        descriptionZh: '上层部件形成机器人轮廓，并连接各个工作模块。',
        match: { partId: 'aquara-layer-06' },
      },
      {
        id: 'aquara-roller',
        labelEn: 'Cleaning roller',
        labelZh: '滚刷模块',
        descriptionEn: 'The roller layer is the cleaning contact module identified in the source model.',
        descriptionZh: '滚刷层是源模型中标注的清洁接触模块。',
        match: { partId: 'aquara-layer-10' },
      },
      {
        id: 'aquara-support',
        labelEn: 'Support structure',
        labelZh: '辅助结构',
        descriptionEn: 'Support pieces complete the mechanical assembly around the cleaning system.',
        descriptionZh: '辅助部件补齐清洁系统周围的机械装配关系。',
        match: { partId: 'aquara-layer-12' },
      },
      {
        id: 'aquara-detail',
        labelEn: 'Finishing detail',
        labelZh: '细节部件',
        descriptionEn: 'Small finishing objects are kept in the interactive model as separate source parts.',
        descriptionZh: '源模型中的细节部件仍作为独立对象保留在互动模型里。',
        match: { partId: 'aquara-layer-14' },
      },
    ],
    animations: [
      {
        id: 'robot-undock',
        labelEn: 'Detach robot from charging dock',
        labelZh: '展开清洁滚刷',
        descriptionEn: 'The complete cleaning robot slides out below the fixed dock while the paired rods retract into the housing.',
        descriptionZh: '把清洁滚刷从主体外壳中拉开，展示工作模块的关系。',
        partIds: ['aquara-robot-body', 'aquara-robot-wheels', 'aquara-cleaning-roller'],
        offset: [0, -55, 0],
        tracks: [
          {
            partIds: ['aquara-robot-body', 'aquara-robot-wheels', 'aquara-cleaning-roller'],
            offset: [0, -55, 0],
          },
          {
            partIds: ['aquara-telescopic-rods'],
            offset: [0, 60, 0],
            scale: [0, 0, 0],
          },
        ],
        durationMs: 1600,
      },
    ],
    noteEn: 'A pure-white GLB rebuilt from the Aquara Rhino geometry for direct angle inspection. Click a source part to see its role; the original 3DM/KSP files stay out of the public build.',
    noteZh: '由 Aquara Rhino 几何重建的纯白 GLB。点击部件可查看说明，原始 3DM/KSP 文件不会进入公开构建。',
  },
});

export type ModelPreviewKey = keyof typeof modelPreviews;
