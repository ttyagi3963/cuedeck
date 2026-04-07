export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to read video metadata"));
    };

    video.src = objectUrl;
  });
}
