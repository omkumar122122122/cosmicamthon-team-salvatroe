import Webcam from "react-webcam";

export default function CameraView({ webcamRef }) {
  return (
    <div className="rounded-3xl overflow-hidden shadow-xl border bg-black">

      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 1280,
          height: 720,
          facingMode: "user",
        }}
        className="w-full"
      />

    </div>
  );
}