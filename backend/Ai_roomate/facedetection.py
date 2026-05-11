from pathlib import Path
from fastapi import APIRouter, UploadFile, File
import cv2
import numpy as np

from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe import Image as MediaPipeImage, ImageFormat

router = APIRouter(
    prefix="/face",
    tags=["Face Detection"]
)

SCRIPT_DIR = Path(__file__).resolve().parent
MODEL_PATH = SCRIPT_DIR / "model" / "blaze_face_short_range.tflite"


@router.post("/verify")
async def detect_face(file: UploadFile = File(...)):
    contents = await file.read()

    np_arr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        return {
            "success": False,
            "message": "Invalid image"
        }

    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    try:
        base_options = python.BaseOptions(
            model_asset_path=str(MODEL_PATH)
        )

        options = vision.FaceDetectorOptions(
            base_options=base_options,
            min_detection_confidence=0.5,
        )

        detector = vision.FaceDetector.create_from_options(options)

        mp_image = MediaPipeImage(
            data=rgb_image,
            image_format=ImageFormat.SRGB
        )

        detection_result = detector.detect(mp_image)
        faces_count = len(detection_result.detections)
        print(f"[FaceDetection] faces_count: {faces_count}")
        print(f"[FaceDetection] detection_result: {detection_result}")

        if faces_count == 1:
            return {
                "success": True,
                "face_detected": True,
                "faces_count": 1,
                "message": "Valid face image"
            }
        else:
            return {
                "success": False,
                "face_detected": False,
                "faces_count": faces_count,
                "message": "Image must contain exactly one face"
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"Face detection failed: {str(e)}"
        }