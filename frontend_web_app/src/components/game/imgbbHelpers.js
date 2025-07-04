const IMGBB_API_KEY = "YOUR_IMGBB_API_KEY"; // <-- Replace with your actual key

// PUBLIC_INTERFACE
export async function uploadImageToImgbb(dataURL) {
  const base64 = dataURL.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
  const formData = new FormData();
  formData.append("image", base64);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData
  });
  const json = await res.json();
  if (json?.success) {
    return json.data.url;
  }
  throw new Error("Upload failed");
}
