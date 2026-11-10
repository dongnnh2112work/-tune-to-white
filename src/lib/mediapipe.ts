import { gameConfig } from "@/config/game.config";

type VisionNS = typeof import("@mediapipe/tasks-vision");

let visionPromise: Promise<VisionNS> | null = null;
type Fileset = Awaited<ReturnType<VisionNS["FilesetResolver"]["forVisionTasks"]>>;

let filesetPromise: Promise<Fileset> | null = null;

async function vision() {
  if (!visionPromise) visionPromise = import("@mediapipe/tasks-vision");
  return visionPromise;
}

async function fileset() {
  if (!filesetPromise) {
    filesetPromise = vision().then((v) => v.FilesetResolver.forVisionTasks("/mediapipe/wasm"));
  }
  return filesetPromise;
}

export async function createHandLandmarker() {
  const v = await vision();
  const fs = await fileset();
  const opts = {
    runningMode: "VIDEO" as const,
    numHands: gameConfig.camera.maxHands,
    minHandDetectionConfidence: 0.55,
    minHandPresenceConfidence: 0.55,
    minTrackingConfidence: 0.5,
  };
  try {
    return await v.HandLandmarker.createFromOptions(fs, {
      baseOptions: {
        modelAssetPath: "/mediapipe/hand_landmarker.task",
        delegate: "GPU",
      },
      ...opts,
    });
  } catch {
    return v.HandLandmarker.createFromOptions(fs, {
      baseOptions: {
        modelAssetPath: "/mediapipe/hand_landmarker.task",
        delegate: "CPU",
      },
      ...opts,
    });
  }
}

export async function createFaceLandmarker() {
  const v = await vision();
  const fs = await fileset();
  const opts = {
    runningMode: "IMAGE" as const,
    numFaces: 1,
    minFaceDetectionConfidence: 0.4,
    minFacePresenceConfidence: 0.4,
    minTrackingConfidence: 0.4,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  };
  try {
    return await v.FaceLandmarker.createFromOptions(fs, {
      baseOptions: {
        modelAssetPath: "/mediapipe/face_landmarker.task",
        delegate: "GPU",
      },
      ...opts,
    });
  } catch {
    return v.FaceLandmarker.createFromOptions(fs, {
      baseOptions: {
        modelAssetPath: "/mediapipe/face_landmarker.task",
        delegate: "CPU",
      },
      ...opts,
    });
  }
}

/** Inner-lip loop (mouth interior) from MediaPipe Face Mesh. */
export const INNER_LIP_INDEXES = [
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191,
];
